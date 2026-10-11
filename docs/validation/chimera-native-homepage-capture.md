# Native homepage capture controller

This manual-only workflow produces website illustration evidence from the
unchanged Chimera product source
`c291d7132ba33561db922e7d5a992ab40212345d`. It does not publish images, update
the website, run product acceptance, merge product changes or create a release.

The product is checked out clean at the full SHA. An external CMake hook adds
one console target at the end of the existing product configure. It links the
production `ChimeraAmpMatrix`, artwork and manual targets. No product source,
test, compiler setting, existing target or CI gate is rewritten.

The Linux runner uses the product's unchanged Xvfb/Openbox wrapper. The harness
requires a display, a visible native peer and its real native handle. It selects
presets through the actual preset ComboBox, navigates through existing controls,
checks model identities and captures 1180 × 780 component images:

| File | Preset index | Preset | Mode and heads |
| --- | ---: | --- | --- |
| `rigs-classic-crunch-beta131.png` | 7 | Classic Crunch | Classic · Brit Edge |
| `rigs-dual-wrath-beta131.png` | 35 | Feel My Wrath | Dual Blend · Fourfold / Tight 515 |
| `rigs-matrix-crom-cruach-beta131.png` | 31 | Crom Cruach | Matrix · Taste Punch / Modern Bass / Tight 515 |

No sound parameter override, generated UI, pixel modification or screenshot
compositing is performed. Silence is processed for a fixed 2,250 callbacks per
scene at 48 kHz / 256 samples: exactly 12 seconds of audio. A separate worker
uses a steady-clock cadence while the UI dispatches messages. Missed callback
deadlines are recorded and rebased rather than followed by a catch-up burst.
This is host-like callback pacing on an ordinary runner thread, with no audio
interface or real-time driver; CPU readings are incidental, not benchmarks.

The original 80-block capture covered only 0.427 seconds of audio. The product
updates its peak meter as `max(callbackLoad, previousPeak * exp(-blockSeconds))`,
so its first-callback cold-start peak remained visible. There is no user-facing
CPU-peak reset. Idle wall-time waiting does not advance this meter's decay.
The new fixed interval lets the unchanged product meter settle naturally while
processing real callbacks. No metric is assigned, reset, hidden, clamped or used
as a capture threshold; the native image is captured after the fixed interval
and UI refresh even if its measured load is high. The report preserves initial/final average and peak,
maximum callback duration, deadline overruns and actual elapsed wall time.
The original run `38147840181` and its PNGs remain untouched evidence.
These are native JUCE component snapshots, not desktop framebuffer or Studio
One captures. The website may use them only after the run succeeds and the
images are inspected; an artifact from a failed run is diagnostic evidence.

`provenance.json` records the exact product/controller SHAs, clean source tree
objects, compiled version, controller file hashes, production static-library
hashes, capture executable/log hashes, preset/model observations and all three
PNG hashes and dimensions. `SHA256SUMS.txt` covers the evidence files. Product
acceptance and publication are explicitly false in this illustration record.

The workflow has only `workflow_dispatch` and read-only repository permission.
Its sole remote write is the normal Actions evidence artifact. A separate
website content change must update product images, captions, release lock and
browser checks after public product release verification.
