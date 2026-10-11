#!/usr/bin/env python3
"""Verify and record native homepage illustrations; never approve a release."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import struct
import subprocess

EXPECTED_SOURCE = "ce3d3b43a4958b1aba55226fb081276578967704"
VERSION = "1.3.1-beta.1"
CONTROLLER_FILES = [
    ".github/workflows/chimera-native-homepage-capture.yml",
    "tools/chimera-native-capture.cpp",
    "tools/chimera-native-capture.cmake",
    "tools/chimera_native_capture_provenance.py",
]
EXPECTED_IMAGES = {
    "rigs-classic-crunch-beta131.png": (7, "Classic Crunch", 0, [1]),
    "rigs-dual-wrath-beta131.png": (35, "Feel My Wrath", 1, [17, 2]),
    "rigs-matrix-crom-cruach-beta131.png": (31, "Crom Cruach", 2, [14, 7, 2]),
}


def require(value, message):
    if not value:
        raise RuntimeError(message)


def git(root, *args):
    return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()


def digest(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("product", "controller", "build", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    product, controller, build, output = (
        getattr(args, name).resolve() for name in ("product", "controller", "build", "output")
    )
    require(git(product, "rev-parse", "HEAD") == EXPECTED_SOURCE, "Wrong product checkout")
    require(not git(product, "status", "--porcelain=v1"), "Product checkout has been modified")
    version = json.loads((build / "chimera-build-version.json").read_text())
    require(version == {"product_version": "1.3.1", "source_sha": EXPECTED_SOURCE, "version": VERSION},
            "Compiled source/version provenance does not match")
    controller_sha = git(controller, "rev-parse", "HEAD")
    require(os.environ.get("GITHUB_SHA") == controller_sha, "Workflow/controller SHA mismatch")
    controller_files = {}
    for name in CONTROLLER_FILES:
        file = controller / name
        require(git(controller, "hash-object", str(file)) == git(controller, "rev-parse", "HEAD:" + name),
                "Controller file changed after checkout: " + name)
        controller_files[name] = {"sha256": digest(file), "git_blob": git(controller, "rev-parse", "HEAD:" + name)}
    observed = json.loads((output / "capture-observations.json").read_text())
    require(observed["product_version"] == "1.3.1" and observed["release_version"] == VERSION,
            "Capture reports a different version")
    require(observed["parameter_overrides"] == [], "Unexpected manual sound parameter overrides")
    images = observed["images"]
    require(len(images) == 3 and {image["file"] for image in images} == set(EXPECTED_IMAGES),
            "Missing, duplicate or unexpected capture")
    require({file.name for file in output.glob("*.png")} == set(EXPECTED_IMAGES), "Unexpected PNG output")
    for image in images:
        expected = EXPECTED_IMAGES[image["file"]]
        require((image["preset_index"], image["preset"], image["mode"],
                 [amp["model_index"] for amp in image["amps"]]) == expected,
                "Captured preset/model identity differs: " + image["file"])
        require(image["native_peer"] is True and image["pixel_edits"] is False,
                "Native untouched component capture required")
        settling = image["audio_settling"]
        require(settling["policy"] == "fixed 2250 paced callbacks; no CPU threshold, reset or retry"
                and settling["audio_thread"] is True and settling["blocks"] == 2250
                and settling["processed_audio_seconds"] == 12.0 and settling["wall_seconds"] >= 11.99,
                "Fixed paced native audio settling interval is missing")
        for field in ("wall_seconds", "maximum_callback_ms", "initial_cpu_average_percent", "initial_cpu_peak_percent",
                      "final_cpu_average_percent", "final_cpu_peak_percent"):
            require(math.isfinite(settling[field]) and settling[field] >= 0, "Invalid observed timing: " + field)
        require(isinstance(settling["callback_deadline_overruns"], int)
                and 0 <= settling["callback_deadline_overruns"] <= 2250, "Invalid callback deadline count")
        file = output / image["file"]
        with file.open("rb") as source:
            header = source.read(24)
        require(header[:16] == b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
                and struct.unpack(">II", header[16:24]) == (1180, 780)
                and (image["width"], image["height"]) == (1180, 780), "Invalid PNG dimensions")
        image.update(sha256=digest(file), size_bytes=file.stat().st_size)
    binary = Path((build / "chimera-capture-binary-Release.txt").read_text().strip()).resolve()
    require(binary.is_relative_to(build) and binary.is_file(), "Capture executable is outside the build")
    libraries = {}
    for pattern in ("*SharedCode.a", "libChimeraArtwork.a", "libChimeraManual.a", "libChimeraIRs.a"):
        files = list(build.rglob(pattern))
        require(len(files) == 1, "Missing or ambiguous production library: " + pattern)
        libraries[str(files[0].relative_to(build))] = digest(files[0])
    run_id = os.environ.get("GITHUB_RUN_ID", "")
    require(run_id.isdigit() and os.environ.get("GITHUB_REPOSITORY") == "raven-deadwire/RavenForge-Luthier-Intelligence",
            "Expected the dedicated website evidence workflow")
    report = {
        "schema": 1,
        "verified_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_sha": EXPECTED_SOURCE,
        "product_repository": "raven-deadwire/SpectralForge-Chimera-Amp-Matrix",
        "product_checkout_clean": True,
        "source_objects": {path: git(product, "rev-parse", "HEAD:" + path)
                           for path in ("Source", "Assets", "CMakeLists.txt", "cmake", "docs/MANUAL.html")},
        "compiled_version": version,
        "controller_source_sha": controller_sha,
        "controller_files": controller_files,
        "run_url": "https://github.com/" + os.environ["GITHUB_REPOSITORY"] + "/actions/runs/" + run_id,
        "run_attempt": os.environ.get("GITHUB_RUN_ATTEMPT"),
        "runner_os": os.environ.get("RUNNER_OS"),
        "native_environment": "Linux runner with Xvfb and Openbox via the unmodified product Tools/run_linux_ui_tests.py",
        "capture_binary_sha256": digest(binary),
        "production_library_sha256": libraries,
        "capture_log_sha256": digest(output / "capture.log"),
        "observations_sha256": digest(output / "capture-observations.json"),
        "build_version_sha256": digest(build / "chimera-build-version.json"),
        "capture": observed,
        "product_acceptance": False,
        "published": False,
        "notes": [
            "Unmodified production editor and real preset ComboBox on a native Linux component peer.",
            "Component snapshots are not desktop framebuffer or Studio One screenshots.",
            "No generated UI, pixel edits, sound parameter overrides or replacement test results.",
            "A fixed 12 seconds of audio is processed with paced worker callbacks while UI messages are dispatched.",
            "CPU fields are actual product observations; no reset, threshold-based waiting, suppression or retry is used.",
            "Runner timing includes cold-start and scheduling effects; no audio interface or real-time driver is used, and this is not a benchmark.",
            "This website evidence workflow does not run or replace the product acceptance gates.",
            "The external CMake hook adds only the capture target; the product source checkout remains clean.",
        ],
    }
    (output / "provenance.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    files = sorted(file for file in output.iterdir() if file.is_file() and file.name != "SHA256SUMS.txt")
    (output / "SHA256SUMS.txt").write_text("".join(digest(file) + "  " + file.name + "\n" for file in files))
    print(json.dumps({"source_sha": EXPECTED_SOURCE, "controller_sha": controller_sha,
                      "native_images": len(images), "product_acceptance": False}, indent=2))


if __name__ == "__main__":
    main()
