"""Negative publication contracts. Synthetic fixtures do not approve Chimera."""
import copy
import json
import subprocess
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
import verify_chimera_release as check


class PublicReleaseContract(unittest.TestCase):
    def setUp(self):
        self.lock = json.loads((check.ROOT / "assets/chimera-release.json").read_text())
        self.sha = self.lock["source_sha"]
        self.release = {"id": 1, "draft": False, "published_at": "2026-10-10T00:00:00Z",
                        "tag_name": self.lock["tag"], "html_url": check.WEB + "/releases/tag/" + self.lock["tag"],
                        "assets": [{"name": name, "state": "uploaded", "size": 100, "digest": "sha256:" + "a" * 64,
                                    "browser_download_url": check.WEB + "/releases/download/" + self.lock["tag"] + "/" + name}
                                   for name in self.lock["assets"]]}

    def verify(self):
        return check.validate_release_metadata(self.lock, self.release, self.sha)

    def test_complete_synthetic_metadata_is_accepted(self):
        self.assertEqual(len(self.verify()), 14)

    def publication_fixture(self, lock):
        return {"schema": "spectralforge.chimera.weekly-publication-decision", "schema_version": 1,
                "version": lock["version"], "revision": {"commit_sha": self.sha, "run_id": "42", "run_attempt": "1"},
                "decision": "OWNER_ACCEPTED_BETA_WITH_VALIDATION_GAPS", "publication_allowed": True,
                "release_approved": True, "publication_authorized": True,
                "owner_acceptance": {"approved": True, "publication_authorized": True, "validation_gaps_accepted": True}}

    def test_weekly_approval_rejects_wrong_source_missing_consent_or_failed_publish(self):
        lock = copy.deepcopy(self.lock)
        candidate = {"runId": 42, "runAttempt": "1"}
        valid = self.publication_fixture(lock)
        run = {"id": lock["publication"]["run_id"], "status": "completed", "conclusion": "success"}
        def verify(decision, publication_run=run, pin=True):
            body = json.dumps(decision)
            if pin:
                lock["publication"]["decision_sha256"] = check.hashlib.sha256(body.encode()).hexdigest()
            check.validate_weekly_publication(lock, {"publication-decision.json": body,
                "candidate-source.json": json.dumps(candidate)}, publication_run)
        verify(valid)
        wrong = copy.deepcopy(valid); wrong["revision"]["commit_sha"] = "0" * 40
        with self.assertRaisesRegex(check.InvalidRelease, "identity differs"): verify(wrong)
        wrong = copy.deepcopy(valid); wrong["publication_authorized"] = False
        with self.assertRaisesRegex(check.InvalidRelease, "does not authorize"): verify(wrong)
        wrong = copy.deepcopy(valid); wrong["owner_acceptance"]["validation_gaps_accepted"] = False
        with self.assertRaisesRegex(check.InvalidRelease, "not accepted"): verify(wrong)
        with self.assertRaisesRegex(check.InvalidRelease, "not succeeded"): verify(valid, {**run, "conclusion": "failure"})
        with self.assertRaisesRegex(check.InvalidRelease, "reviewed digest"): verify(wrong, pin=False)

    def test_draft_cannot_be_public(self):
        self.release["draft"] = True
        with self.assertRaisesRegex(check.InvalidRelease, "not publicly published"):
            self.verify()

    def test_404_is_not_a_skip_or_pass(self):
        with patch.object(check, "public_json", side_effect=HTTPError("test", 404, "Not Found", {}, None)):
            with self.assertRaises(HTTPError):
                check.validate_public(self.lock)

    def test_different_source_is_blocked(self):
        self.sha = "b" * 40
        with self.assertRaisesRegex(check.InvalidRelease, "differs from audited"):
            self.verify()

    def test_missing_os_package_or_document_is_blocked(self):
        for name in self.lock["assets"]:
            with self.subTest(name=name):
                original = self.release["assets"]
                self.release["assets"] = [a for a in original if a["name"] != name]
                with self.assertRaisesRegex(check.InvalidRelease, "Missing public release asset"):
                    self.verify()
                self.release["assets"] = original

    def test_old_version_path_and_empty_upload_are_blocked(self):
        for field, value in [("size", 0), ("state", "new"), ("digest", None),
                             ("browser_download_url", check.WEB + "/releases/download/v1.2.0-beta.1/old.exe")]:
            with self.subTest(field=field):
                old = self.release["assets"][0][field]
                self.release["assets"][0][field] = value
                with self.assertRaises(check.InvalidRelease):
                    self.verify()
                self.release["assets"][0][field] = old

    def test_duplicate_assets_are_blocked(self):
        self.release["assets"].append(self.release["assets"][0])
        with self.assertRaisesRegex(check.InvalidRelease, "Duplicate"):
            self.verify()

    def test_candidate_run_must_match_source_and_succeed(self):
        candidate = {"revision": self.sha, "version": self.lock["version"], "tag": self.lock["tag"], "runId": 42}
        run = {"id": 42, "head_sha": self.sha, "status": "completed", "conclusion": "success"}
        check.validate_provenance(self.lock, candidate, run)
        for field, value in [("head_sha", "b" * 40), ("id", 43), ("status", "in_progress"), ("conclusion", "failure")]:
            with self.subTest(field=field), self.assertRaises(check.InvalidRelease):
                check.validate_provenance(self.lock, candidate, {**run, field: value})

    def test_checksums_reject_duplicate_or_invalid_lines(self):
        line = "a" * 64 + "  package.exe"
        self.assertEqual(check.parse_sums(line), {"package.exe": "a" * 64})
        for content in [line + "\n" + line, "bad-hash  package.exe", "a" * 64 + "  ../package.exe"]:
            with self.assertRaises(check.InvalidRelease):
                check.parse_sums(content)

    def test_update_platforms_and_hashes_must_agree(self):
        assets = self.verify()
        sums = {name: "a" * 64 for name, spec in self.lock["assets"].items() if spec["kind"] == "package"}
        update = {"schema": 1, "version": self.lock["version"], "channel": "beta", "releaseUrl": self.release["html_url"], "assets": []}
        for platform, arch, suffix in [("windows", "x86_64", "win64-Setup.exe"), ("macos", "universal", "macos-universal.pkg"), ("linux", "x86_64", "linux-x86_64.deb")]:
            name = f"SpectralForge-Chimera-{self.lock['version']}-{suffix}"
            update["assets"].append({"platform": platform, "arch": arch, "name": name, "size": 100, "sha256": sums[name], "url": assets[name]["browser_download_url"]})
        check.validate_update(self.lock, update, sums, assets)
        wrong = copy.deepcopy(update); wrong["assets"][0]["sha256"] = "b" * 64
        with self.assertRaises(check.InvalidRelease):
            check.validate_update(self.lock, wrong, sums, assets)
        update["assets"].pop()
        with self.assertRaisesRegex(check.InvalidRelease, "Missing update platform"):
            check.validate_update(self.lock, update, sums, assets)

    def test_public_pipeline_rejects_tampered_document_and_image_bytes(self):
        # Transport fixture exercises the whole public chain, not a real release.
        lock = copy.deepcopy(self.lock)
        release = copy.deepcopy(self.release)
        assets = {a["name"]: a for a in release["assets"]}
        docs = {n: b"Synthetic release documentation" for n, a in lock["assets"].items() if a["kind"] == "document"}
        docs["MANUAL.html"] = ("const ASSET='" + check.RAW + self.sha + "/Assets/Artwork/';").encode()
        docs["candidate-source.json"] = json.dumps({"revision": self.sha, "tag": lock["tag"], "version": lock["version"], "runId": 42, "runAttempt": "1"}).encode()
        docs["publication-decision.json"] = json.dumps(self.publication_fixture(lock)).encode()
        lock["publication"]["decision_sha256"] = check.hashlib.sha256(docs["publication-decision.json"]).hexdigest()
        sums = {n: "a" * 64 for n, a in lock["assets"].items() if a["kind"] == "package"}
        docs["SHA256SUMS.txt"] = "\n".join(h + "  " + n for n, h in sums.items()).encode()
        update = {"schema": 1, "version": lock["version"], "channel": "beta", "releaseUrl": release["html_url"], "assets": []}
        for platform, arch, suffix in [("windows", "x86_64", "win64-Setup.exe"), ("macos", "universal", "macos-universal.pkg"), ("linux", "x86_64", "linux-x86_64.deb")]:
            name = f"SpectralForge-Chimera-{lock['version']}-{suffix}"
            update["assets"].append({"platform": platform, "arch": arch, "name": name, "size": 100, "sha256": sums[name], "url": assets[name]["browser_download_url"]})
        docs["update-beta.json"] = json.dumps(update).encode()
        for name, data in docs.items():
            assets[name].update(size=len(data), digest="sha256:" + check.hashlib.sha256(data).hexdigest())
            if lock["assets"][name].get("source_path"):
                lock["source_files"][lock["assets"][name]["source_path"]] = check.blob_sha(data)
        image = b"synthetic image fixture"
        lock["images"] = {"Assets/Artwork/test.png": check.blob_sha(image)}
        tree = {"truncated": False, "tree": [{"path": p, "sha": s, "type": "blob"} for p, s in {**lock["source_files"], **lock["images"]}.items()]}
        def api(url):
            if "/releases/tags/" in url: return release
            if "/git/ref/" in url: return {"object": {"type": "tag", "sha": "c" * 40}}
            if "/git/tags/" in url: return {"object": {"type": "commit", "sha": self.sha}}
            if "/git/trees/" in url: return tree
            if url.endswith("release-policy.json"): return {"release_scope": {"version": lock["version"], "release_approved": True, "publication_authorized": True}}
            if "/actions/runs/" in url: return {"id": int(url.rsplit('/', 1)[1]), "head_sha": self.sha, "status": "completed", "conclusion": "success"}
            self.fail("Unexpected fixture request: " + url)
        corrupt = None
        def transport(url, method="GET"):
            name = url.rsplit("/", 1)[1]
            if method == "HEAD": return b"", {"Content-Type": "application/octet-stream", "Content-Length": "100"}
            if name == "test.png": return (b"changed" if corrupt == "image" else image), {"Content-Type": "image/png"}
            return (b"changed" if corrupt == "document" else docs[name]), {}
        with patch.object(check, "public_json", side_effect=api), patch.object(check, "fetch", side_effect=transport):
            self.assertEqual(check.validate_public(lock)["source_sha"], self.sha)
            for corrupt, error in [("document", "Document digest"), ("image", "Image bytes")]:
                with self.subTest(corrupt=corrupt), self.assertRaisesRegex(check.InvalidRelease, error):
                    check.validate_public(lock)


class NativePresetObservationContract(unittest.TestCase):
    def setUp(self):
        self.rigs = json.loads((check.ROOT / "assets/chimera/rigs-beta131-native-provenance.json").read_text())
        # The public release lock intentionally stays at the published version
        # during preparation. These comparison tests use the recorded capture.
        self.lock = {"source_sha": self.rigs["source_sha"], "version": self.rigs["release_version"]}

    def test_recorded_capture_observations_match_without_mutation(self):
        original = copy.deepcopy(self.rigs)
        check.validate_native_preset_observations(self.lock, self.rigs)
        self.assertEqual(self.rigs, original)

    def test_stale_compiled_source_is_blocked(self):
        self.rigs["capture_provenance"]["compiled_version"]["source_sha"] = "0" * 40
        with self.assertRaisesRegex(check.InvalidRelease, "source identity"):
            check.validate_native_preset_observations(self.lock, self.rigs)

    def test_stale_embedded_image_or_route_observations_are_blocked(self):
        mutations = [
            ("sha256", "0" * 64), ("size_bytes", 1), ("width", 1),
            ("preset_index", -1), ("preset", "Stale preset"), ("mode", -1),
            ("input_mode", -1), ("native_peer", False), ("pixel_edits", True),
        ]
        for field, value in mutations:
            with self.subTest(field=field):
                stale = copy.deepcopy(self.rigs)
                stale["capture_provenance"]["capture"]["images"][0][field] = value
                with self.assertRaisesRegex(check.InvalidRelease, "observation differs"):
                    check.validate_native_preset_observations(self.lock, stale)
        for field in ("model_index", "channel_index", "input_route_index"):
            with self.subTest(amp_field=field):
                stale = copy.deepcopy(self.rigs)
                stale["capture_provenance"]["capture"]["images"][0]["amps"][0][field] = -1
                with self.assertRaisesRegex(check.InvalidRelease, "observation differs"):
                    check.validate_native_preset_observations(self.lock, stale)
        stale = copy.deepcopy(self.rigs)
        stale["images"][0]["audio_settling"]["final_cpu_peak_percent"] += 1
        with self.assertRaisesRegex(check.InvalidRelease, "observation differs"):
            check.validate_native_preset_observations(self.lock, stale)

    def test_missing_added_or_duplicate_observation_fields_are_blocked(self):
        for side in ("website", "capture"):
            for operation in ("missing", "added"):
                with self.subTest(side=side, operation=operation):
                    stale = copy.deepcopy(self.rigs)
                    record = (stale["images"] if side == "website"
                              else stale["capture_provenance"]["capture"]["images"])[0]
                    if operation == "missing":
                        del record["input_mode"]
                    else:
                        record["unrecorded_annotation"] = "changed"
                    with self.assertRaisesRegex(check.InvalidRelease, "observation differs"):
                        check.validate_native_preset_observations(self.lock, stale)
        self.rigs["capture_provenance"]["capture"]["images"].append(
            copy.deepcopy(self.rigs["capture_provenance"]["capture"]["images"][0]))
        with self.assertRaisesRegex(check.InvalidRelease, "inventory differs"):
            check.validate_native_preset_observations(self.lock, self.rigs)

    def test_website_path_cannot_replace_artifact_identity(self):
        self.rigs["images"][0]["file"] = "assets/chimera/unrelated.png"
        with self.assertRaisesRegex(check.InvalidRelease, "website path differs"):
            check.validate_native_preset_observations(self.lock, self.rigs)


class LocalContentContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lock = json.loads((check.ROOT / "assets/chimera-release.json").read_text())
        cls.inventory = check.load_inventory()

    def test_three_languages_render_and_all_local_links_exist(self):
        result = check.validate_local(self.lock, self.inventory)
        self.assertEqual(result["remote_images"], 85)
        for path in ["assets/chimera/dual-cabinet-beta13.png", "assets/chimera/ir-loader-beta13.png"]:
            self.assertIn(path, self.lock["reviewed_files"])
            self.assertTrue(any(i["image"] and i["url"] == path for i in self.inventory[0]["links"]))

    def test_removed_rigs_or_original_amp_content_is_blocked(self):
        # Exercise removal from the rendered DOM, including the whole section
        # that used to disappear while the surviving-node inventory still passed.
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { validateProductContent } = require('./tools/chimera_page_inventory.cjs');
const html = fs.readFileSync('index.html', 'utf8');
const copy = fs.readFileSync('assets/chimera.js', 'utf8');
const removed = [
  '#chimera-rigs',
  '#chimera-rigs img[data-chimera-alt="rigsDualAlt"]',
  '#chimera-rigs [data-chimera-key="matrix"]',
  '#chimera-rigs [data-chimera-key="rigsControls"]',
  '#chimera-editing',
  '#chimera-editing [data-chimera-key="headBody"]',
  '#chimera-editing [data-chimera-key="knobBody"]',
  '#chimera-editing [data-chimera-key="signalBody"]',
  '#chimera-editing [data-chimera-key="eqBody"]',
  '#chimera-editing .rf-chimera-head-gallery',
  '#chimera-niflheimr',
  '#chimera-niflheimr .rf-chimera-nastrond-features > article',
  '#chimera-nastrond .rf-chimera-nastrond-channels > article',
  '#chimera-nastrond [data-chimera-key="nastrondManual"]'
];
for (const lang of ['en', 'ko', 'de']) {
  const dom = new JSDOM(html, {url: 'https://example.test/', runScripts: 'outside-only'});
  dom.window.document.documentElement.lang = lang;
  dom.window.eval(copy);
  const product = dom.window.document.querySelector('#chimera');
  validateProductContent(product, lang);
  for (const selector of removed) {
    const incomplete = product.cloneNode(true);
    assert.ok(incomplete.querySelector(selector), `Missing fixture: ${selector}`);
    incomplete.querySelector(selector).remove();
    assert.throws(() => validateProductContent(incomplete, lang),
                  /Expected one required product element|requires/, `${lang}: ${selector}`);
  }
  dom.window.close();
}
"""
        run = subprocess.run(["node", "-e", script], cwd=check.ROOT, text=True, capture_output=True)
        self.assertEqual(run.returncode, 0, run.stderr)

    def test_stale_content_hash_is_blocked(self):
        for path in ["manual/chimera.html", "assets/chimera/dual-cabinet-beta13.png", "assets/chimera/ir-loader-beta13.png"]:
            lock = copy.deepcopy(self.lock); lock["reviewed_files"][path] = "0" * 64
            with self.subTest(path=path), self.assertRaisesRegex(check.InvalidRelease, "changed since source review"):
                check.validate_local(lock, self.inventory)

    def test_missing_or_mutable_image_reference_is_blocked(self):
        for url in ["missing-chimera-image.png", check.RAW + "main/Assets/Artwork/anastrond.png"]:
            inventory = copy.deepcopy(self.inventory)
            next(i for i in inventory[0]["links"] if i["image"])["url"] = url
            with self.assertRaises(check.InvalidRelease):
                check.validate_local(self.lock, inventory)

    def test_untranslated_language_or_wrong_counts_are_blocked(self):
        with self.assertRaisesRegex(check.InvalidRelease, "Incomplete language"):
            check.validate_local(self.lock, self.inventory[:-1])
        inventory = copy.deepcopy(self.inventory); inventory[1]["presets"] = 43
        with self.assertRaisesRegex(check.InvalidRelease, "preset count"):
            check.validate_local(self.lock, inventory)


if __name__ == "__main__":
    unittest.main()
