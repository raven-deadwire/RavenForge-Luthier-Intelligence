"""Negative publication contracts. Synthetic fixtures do not approve Chimera."""
import copy
import json
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
        self.assertEqual(len(self.verify()), 13)

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
        docs["candidate-source.json"] = json.dumps({"revision": self.sha, "tag": lock["tag"], "version": lock["version"], "runId": 42}).encode()
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
            if "/actions/runs/" in url: return {"id": 42, "head_sha": self.sha, "status": "completed", "conclusion": "success"}
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


class LocalContentContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lock = json.loads((check.ROOT / "assets/chimera-release.json").read_text())
        cls.inventory = check.load_inventory()

    def test_three_languages_render_and_all_local_links_exist(self):
        result = check.validate_local(self.lock, self.inventory)
        self.assertEqual(result["remote_images"], 87)

    def test_stale_content_hash_is_blocked(self):
        lock = copy.deepcopy(self.lock); lock["reviewed_files"]["manual/chimera.html"] = "0" * 64
        with self.assertRaisesRegex(check.InvalidRelease, "changed since source review"):
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
