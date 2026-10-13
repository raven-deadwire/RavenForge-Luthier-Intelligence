#!/usr/bin/env python3
"""Fail-closed website release contract. Public reads deliberately use no token.

--offline validates reviewed local content only; it never authorizes publication.
Default mode additionally verifies the public tag, provenance, packages and images.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
REPO = "raven-deadwire/SpectralForge-Chimera-Amp-Matrix"
API = f"https://api.github.com/repos/{REPO}"
RAW = f"https://raw.githubusercontent.com/{REPO}/"
WEB = f"https://github.com/{REPO}"


class InvalidRelease(Exception):
    pass


def require(condition, message):
    if not condition:
        raise InvalidRelease(message)


def blob_sha(data):
    return hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()


def fetch(url, method="GET"):
    request = Request(url, method=method, headers={"User-Agent": "RavenForge-public-release-verifier", "Accept": "*/*"})
    with urlopen(request, timeout=40) as response:
        require(response.status == 200, f"Public URL is not HTTP 200: {url}")
        require(urlsplit(response.url).scheme == "https", f"Non-HTTPS redirect: {url}")
        body = b"" if method == "HEAD" else response.read(32 * 1024 * 1024 + 1)
        require(len(body) <= 32 * 1024 * 1024, f"Unexpectedly large document/image: {url}")
        return body, dict(response.headers)


def public_json(url):
    return json.loads(fetch(url)[0].decode("utf-8-sig"))


def load_inventory(root=ROOT):
    run = subprocess.run(["node", str(root / "tools/chimera_page_inventory.cjs")], cwd=root,
                         text=True, capture_output=True, check=True)
    return json.loads(run.stdout)


def product_markup(root):
    page = (root / "index.html").read_bytes()
    match = re.search(rb'<section\b[^>]*\bid="chimera"[^>]*>.*?</section>', page, re.S)
    require(match is not None, "Missing product markup")
    return match.group(0)


def validate_native_preset_observations(lock, rigs):
    capture = rigs["capture_provenance"]
    require(rigs["source_sha"] == capture["source_sha"]
            == capture["compiled_version"]["source_sha"] == lock["source_sha"]
            and rigs["release_version"] == capture["compiled_version"]["version"] == lock["version"]
            and rigs["controller_source_sha"] == capture["controller_source_sha"]
            and rigs["run_url"] == capture["run_url"]
            and capture["product_checkout_clean"] is True
            and capture["capture"]["parameter_overrides"] == [], "Native preset source identity differs")
    observations = capture["capture"]["images"]
    observed = {record["file"]: record for record in observations}
    require(len(observed) == len(observations) == len(rigs["images"])
            and {record["artifact_path"] for record in rigs["images"]} == set(observed),
            "Capture report preset inventory differs")
    for record in rigs["images"]:
        artifact_path = record["artifact_path"]
        require(record["file"] == "assets/chimera/" + artifact_path,
                "Native preset website path differs: " + artifact_path)
        # The website adds only its path prefix and the original artifact path.
        # Preserve every other observed field, including nested amp/timing data.
        original = {key: value for key, value in record.items() if key != "artifact_path"}
        original["file"] = artifact_path
        require(original == observed[artifact_path],
                "Native preset observation differs from capture: " + artifact_path)


def validate_local(lock, inventory, root=ROOT):
    require(lock.get("schema") == 1 and re.fullmatch(r"[0-9a-f]{40}", lock.get("source_sha", "")), "Invalid source lock")
    require(lock["tag"] == "v" + lock["version"], "Tag/version mismatch")
    require({(p["file"], p["lang"]) for p in inventory} ==
            {(f, l) for f in ("index.html", "manual/chimera.html") for l in ("en", "ko", "de")}, "Incomplete language rendering")
    for file, digest in lock["reviewed_files"].items():
        require(hashlib.sha256((root / file).read_bytes()).hexdigest() == digest,
                f"Content changed since source review; re-audit and update lock: {file}")
    require(hashlib.sha256(product_markup(root)).hexdigest() == lock["product_markup_sha256"],
            "Product markup changed since source review")
    # Keep raw production artwork distinct from actual native UI evidence.
    for name, expected_kind in [
        ("heads-beta131-artwork-provenance.json", "artwork"),
        ("heads-beta131-native-provenance.json", "native")
    ]:
        provenance_path = "assets/chimera/" + name
        require(provenance_path in lock["reviewed_files"], "Unreviewed head image provenance")
        provenance = json.loads((root / provenance_path).read_text())
        image_source = lock["source_sha"] if expected_kind == "artwork" else lock.get("native_capture", lock)["source_sha"]
        require(provenance["source_sha"] == image_source, "Head images have a different source")
        records = provenance["images"]
        require(len(records) == (25 if expected_kind == "artwork" else 3), "Incomplete head image evidence")
        if expected_kind == "artwork":
            require({record["model_index"] for record in records} == set(range(26)) - {16},
                    "Artwork must cover every active amp exactly once")
        else:
            require({record["file"] for record in records} == {
                "assets/chimera/head-brit-edge-beta131.png",
                "assets/chimera/head-niflheimr-beta131.png",
                "assets/chimera/head-nastrond-beta131.png"}, "Unexpected native head evidence")
        for record in records:
            require(record["pixel_edits"] is False, "Head image has unreviewed pixel edits")
            if expected_kind == "artwork":
                path = record["source_path"]
                require(record["website_url"] == RAW + lock["source_sha"] + "/" + path
                        and lock["source_files"].get(path) == record["source_git_blob"]
                        and lock["images"].get(path) == record["source_git_blob"],
                        "Head artwork URL is not the locked unchanged production PNG")
                require(re.fullmatch(r"[0-9a-f]{64}", record["sha256"]) and record["size_bytes"] > 0,
                        "Missing inspected source artwork digest")
            else:
                filename = record["file"]
                contents = (root / filename).read_bytes()
                require(len(contents) == record["size_bytes"]
                        and hashlib.sha256(contents).hexdigest() == record["sha256"]
                        and lock["reviewed_files"].get(filename) == record["sha256"],
                        "Head image bytes differ from reviewed evidence: " + filename)
    rig_provenance_path = "assets/chimera/rigs-beta131-native-provenance.json"
    require(rig_provenance_path in lock["reviewed_files"], "Unreviewed native preset provenance")
    rigs = json.loads((root / rig_provenance_path).read_text())
    validate_native_preset_observations(lock.get("native_capture", lock), rigs)
    expected_rigs = {
        "rigs-classic-crunch-beta131.png": (7, "Classic Crunch", 0, [1]),
        "rigs-dual-wrath-beta131.png": (35, "Feel My Wrath", 1, [17, 2]),
        "rigs-matrix-crom-cruach-beta131.png": (31, "Crom Cruach", 2, [14, 7, 2]),
    }
    require(len(rigs["images"]) == 3 and {record["artifact_path"] for record in rigs["images"]} == set(expected_rigs),
            "Incomplete native preset evidence")
    for record in rigs["images"]:
        settling = record["audio_settling"]
        require(settling["policy"] == "fixed 2250 paced callbacks; no CPU threshold, reset or retry"
                and settling["audio_thread"] is True and settling["blocks"] == 2250
                and settling["processed_audio_seconds"] == 12.0 and settling["wall_seconds"] >= 11.99,
                "Native presets require the reviewed fixed audio settling interval")
        filename = record["file"]
        contents = (root / filename).read_bytes()
        require(filename == "assets/chimera/" + record["artifact_path"]
                and (record["preset_index"], record["preset"], record["mode"],
                     [amp["model_index"] for amp in record["amps"]]) == expected_rigs[record["artifact_path"]]
                and record["native_peer"] is True and record["pixel_edits"] is False
                and (record["width"], record["height"]) == (1180, 780)
                and len(contents) == record["size_bytes"]
                and hashlib.sha256(contents).hexdigest() == record["sha256"]
                and lock["reviewed_files"].get(filename) == record["sha256"],
                "Native preset PNG differs from reviewed evidence: " + filename)
    download = WEB + "/releases/download/" + lock["tag"] + "/"
    image_prefix = RAW + lock["source_sha"] + "/"
    linked_assets, images = set(), set()
    for page in inventory:
        if page["file"] == "manual/chimera.html":
            require(page["models"] == {"preModels": 39, "ampModels": 25, "postModels": 21}, "Rendered model count mismatch")
            require(page["presets"] == lock["counts"]["presets"], "Rendered preset count mismatch")
        else:
            require(page["stats"] == [lock["counts"]["amps"], 60, lock["counts"]["presets"]], "Homepage count mismatch")
        for item in page["links"]:
            url = item["url"]
            parsed = urlsplit(url)
            if url.startswith(WEB + "/releases/download/"):
                require(url.startswith(download), f"Wrong release in download link: {url}")
                name = unquote(url[len(download):])
                require(name in lock["assets"], f"Unreviewed download path: {name}")
                linked_assets.add(name)
            elif url.startswith(WEB + "/releases/tag/"):
                require(url == WEB + "/releases/tag/" + lock["tag"], "Wrong release page")
            if item["image"] and parsed.scheme:
                require(url.startswith(image_prefix), f"Image must use the reviewed full source SHA: {url}")
                path = unquote(url[len(image_prefix):])
                require(path in lock["images"], f"Unreviewed image: {path}")
                require(bool(item.get("alt")), f"Missing image description: {path}")
                images.add(path)
            if not parsed.scheme and parsed.path:
                local = (root / Path(page["file"]).parent / unquote(parsed.path)).resolve()
                require(local.is_relative_to(root.resolve()) and local.is_file(), f"Missing local reference: {page['file']}: {url}")
    require(linked_assets == {n for n, a in lock["assets"].items() if a["linked"]}, "Missing reviewed download links")
    require(images == set(lock["images"]), "Image inventory changed; review the source lock")
    return {"rendered_languages": ["en", "ko", "de"], "remote_images": len(images), "linked_assets": len(linked_assets)}


def validate_release_metadata(lock, release, tag_sha):
    require(release.get("draft") is False and bool(release.get("published_at")), "Release is not publicly published")
    require(release.get("tag_name") == lock["tag"], "Public release tag mismatch")
    require(release.get("html_url") == WEB + "/releases/tag/" + lock["tag"], "Release page mismatch")
    require(tag_sha == lock["source_sha"], "Published source differs from audited source; review final code, copy and artwork")
    assets = {}
    for asset in release.get("assets", []):
        require(asset["name"] not in assets, "Duplicate release asset")
        assets[asset["name"]] = asset
    for name in lock["assets"]:
        require(name in assets, f"Missing public release asset: {name}")
        asset = assets[name]
        require(asset.get("state") == "uploaded" and asset.get("size", 0) > 0, f"Incomplete release asset: {name}")
        require(asset.get("browser_download_url") == WEB + "/releases/download/" + lock["tag"] + "/" + name,
                f"Unexpected public download path: {name}")
        require(re.fullmatch(r"sha256:[0-9a-f]{64}", asset.get("digest") or ""), f"Missing asset digest: {name}")
    return assets


def validate_provenance(lock, candidate, run):
    require(candidate.get("revision") == lock["source_sha"] and candidate.get("version") == lock["version"]
            and candidate.get("tag") == lock["tag"], "Candidate provenance source/version mismatch")
    require(str(candidate.get("runId")) == str(run.get("id")) and run.get("head_sha") == lock["source_sha"]
            and run.get("status") == "completed" and run.get("conclusion") == "success", "Candidate build has not succeeded for this source")


def validate_weekly_publication(lock, documents, run):
    """Check the published source-bound receipt, not preparation-time approval flags."""
    body = documents["publication-decision.json"].encode("utf-8")
    require(hashlib.sha256(body).hexdigest() == lock["publication"]["decision_sha256"],
            "Published approval receipt differs from reviewed digest")
    decision = json.loads(body)
    candidate = json.loads(documents["candidate-source.json"])
    require(decision.get("schema") == "spectralforge.chimera.weekly-publication-decision"
            and decision.get("schema_version") == 1
            and decision.get("version") == lock["version"]
            and decision.get("revision", {}).get("commit_sha") == lock["source_sha"]
            and str(decision["revision"].get("run_id")) == str(candidate.get("runId"))
            and str(decision["revision"].get("run_attempt")) == str(candidate.get("runAttempt")),
            "Published approval source/build identity differs")
    require(all(decision.get(field) is True for field in
                ("publication_allowed", "release_approved", "publication_authorized")),
            "Published approval does not authorize this beta")
    acceptance = decision.get("owner_acceptance", {})
    require(decision.get("decision") == "OWNER_ACCEPTED_BETA_WITH_VALIDATION_GAPS"
            and all(acceptance.get(field) is True for field in
                    ("approved", "publication_authorized", "validation_gaps_accepted")),
            "Published beta validation gaps were not accepted")
    require(str(run.get("id")) == str(lock["publication"]["run_id"])
            and run.get("status") == "completed" and run.get("conclusion") == "success",
            "Publication workflow has not succeeded")


def parse_sums(text):
    result = {}
    for line in text.splitlines():
        match = re.fullmatch(r"([a-fA-F0-9]{64})\s+\*?([^/\\]+)", line)
        require(match is not None, "Malformed SHA256SUMS entry")
        digest, name = match.groups()
        require(name not in result, "Duplicate SHA256SUMS entry")
        result[name] = digest.lower()
    return result


def validate_update(lock, update, sums, assets):
    require(update.get("version") == lock["version"] and update.get("schema") == 1 and update.get("channel") == "beta"
            and update.get("releaseUrl") == WEB + "/releases/tag/" + lock["tag"], "Wrong update manifest")
    expected = {("windows", "x86_64"): "win64-Setup.exe", ("macos", "universal"): "macos-universal.pkg", ("linux", "x86_64"): "linux-x86_64.deb"}
    seen = set()
    for item in update.get("assets", []):
        key = (item.get("platform"), item.get("arch"))
        require(key in expected and key not in seen, "Unexpected/duplicate update platform")
        seen.add(key)
        name = f"SpectralForge-Chimera-{lock['version']}-{expected[key]}"
        require(item.get("name") == name and item.get("url") == assets[name]["browser_download_url"]
                and item.get("sha256") == sums[name] and item.get("size") == assets[name]["size"], f"Update package mismatch: {name}")
    require(seen == set(expected), "Missing update platform")


def validate_public(lock):
    # No credentials: an authenticated view of a draft cannot pass as public.
    release = public_json(API + "/releases/tags/" + lock["tag"])
    ref = public_json(API + "/git/ref/tags/" + lock["tag"])["object"]
    for _ in range(8):
        if ref["type"] == "commit":
            break
        require(ref["type"] == "tag", "Unexpected tag object")
        ref = public_json(API + "/git/tags/" + ref["sha"])["object"]
    require(ref["type"] == "commit", "Unresolved annotated tag")
    assets = validate_release_metadata(lock, release, ref["sha"])
    tree = public_json(API + "/git/trees/" + ref["sha"] + "?recursive=1")
    require(not tree.get("truncated"), "Incomplete released source tree")
    blobs = {e["path"]: e["sha"] for e in tree["tree"] if e["type"] == "blob"}
    for path, digest in {**lock["source_files"], **lock["images"]}.items():
        require(blobs.get(path) == digest, f"Reviewed source/artwork differs at released tag: {path}")
    policy = public_json(RAW + ref["sha"] + "/Validation/release-policy.json")["release_scope"]
    require(policy.get("version") == lock["version"], "Release source version differs")
    if not lock.get("publication"):
        require(policy.get("release_approved") is True and policy.get("publication_authorized") is True,
                "Release source acceptance is not approved")
    documents = {}
    for name, spec in lock["assets"].items():
        url = assets[name]["browser_download_url"]
        if spec["kind"] == "package":
            _, headers = fetch(url, "HEAD")
            headers = {k.lower(): v for k, v in headers.items()}
            require("text/html" not in headers.get("content-type", ""), f"Download is an HTML page: {name}")
            if "content-length" in headers:
                require(int(headers["content-length"]) == assets[name]["size"], f"Public package size mismatch: {name}")
        else:
            body, _ = fetch(url)
            require(len(body) == assets[name]["size"] and "sha256:" + hashlib.sha256(body).hexdigest() == assets[name]["digest"], f"Document digest mismatch: {name}")
            if spec.get("source_path"):
                require(blob_sha(body) == lock["source_files"][spec["source_path"]], f"Published document differs from audited source: {name}")
            documents[name] = body.decode("utf-8-sig")
    candidate = json.loads(documents["candidate-source.json"])
    require(str(candidate.get("runId", "")).isdigit(), "Missing candidate run ID")
    run = public_json(API + "/actions/runs/" + str(candidate["runId"]))
    validate_provenance(lock, candidate, run)
    if lock.get("publication"):
        publication_run = public_json(API + "/actions/runs/" + str(lock["publication"]["run_id"]))
        validate_weekly_publication(lock, documents, publication_run)
    sums = parse_sums(documents["SHA256SUMS.txt"])
    packages = {name for name, spec in lock["assets"].items() if spec["kind"] == "package"}
    require(set(sums) == packages, "Checksums must cover exactly five packages")
    for name, digest in sums.items():
        require(assets[name]["digest"] == "sha256:" + digest, f"Release/checksum disagreement: {name}")
    validate_update(lock, json.loads(documents["update-beta.json"]), sums, assets)
    require(not any(marker in documents["OPEN_BETA_RELEASE_NOTES.md"] for marker in
                    ("release preparation", "릴리즈 준비본", "The release remains in preparation")), "Public release notes still describe an unpublished candidate")
    manual_base = re.search(r"const ASSET=['\"]([^'\"]+)['\"]", documents["MANUAL.html"])
    manual_refs = {ref["sha"], lock["tag"]}
    if lock.get("published_manual_artwork_ref"):
        # The packaged manual retains a previous immutable art tag. Verify those
        # bytes also exist unchanged in the released product; never accept main.
        art_ref = lock["published_manual_artwork_ref"]
        require(re.fullmatch(r"v\d+\.\d+\.\d+-beta\.\d+", art_ref), "Mutable manual artwork reference")
        art_tree = public_json(API + "/git/trees/" + art_ref + "?recursive=1")
        require(not art_tree.get("truncated"), "Incomplete manual artwork tree")
        old_art = {e["path"]: e["sha"] for e in art_tree["tree"]
                   if e["type"] == "blob" and e["path"].startswith("Assets/Artwork/")
                   and e["path"].lower().endswith((".jpg", ".png", ".webp"))}
        require(old_art and all(blobs.get(path) == digest for path, digest in old_art.items()),
                "Packaged manual artwork differs from released product")
        manual_refs.add(art_ref)
    require(manual_base is not None and manual_base[1] in
            {RAW + value + "/Assets/Artwork/" for value in manual_refs},
            "Published manual artwork must match verified immutable source")

    artwork = json.loads((ROOT / "assets/chimera/heads-beta131-artwork-provenance.json").read_text())
    inspected_artwork = {record["source_path"]: record for record in artwork["images"]}

    def verify_image(item):
        path, digest = item
        body, headers = fetch(RAW + ref["sha"] + "/" + path)
        headers = {k.lower(): v for k, v in headers.items()}
        require(headers.get("content-type", "").startswith("image/") and blob_sha(body) == digest,
                f"Image bytes do not match released source: {path}")
        if path in inspected_artwork:
            record = inspected_artwork[path]
            require(len(body) == record["size_bytes"] and hashlib.sha256(body).hexdigest() == record["sha256"],
                    "Head artwork differs from inspected source bytes: " + path)
    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(verify_image, lock["images"].items()))
    return {"tag": lock["tag"], "source_sha": ref["sha"], "release_id": release["id"], "published_at": release["published_at"],
            "build_run": run["id"], "assets": len(lock["assets"]), "images": len(lock["images"])}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    report = {"checked_at": datetime.now(timezone.utc).isoformat(), "mode": "offline" if args.offline else "public", "public_verified": False}
    try:
        lock = json.loads((ROOT / "assets/chimera-release.json").read_text())
        report["local"] = validate_local(lock, load_inventory())
        if not args.offline:
            report["public"] = validate_public(lock)
            report["public_verified"] = True
        report["status"] = "OFFLINE_PASS" if args.offline else "PUBLIC_PASS"
    except Exception as error:
        report.update(status="BLOCKED", error=f"{type(error).__name__}: {error}")
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    return 1 if report["status"] == "BLOCKED" else 0


if __name__ == "__main__":
    sys.exit(main())
