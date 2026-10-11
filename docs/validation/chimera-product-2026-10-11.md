# Chimera 1.3 product description — 11 October 2026

The owner requested the homepage to describe the whole product through version
1.3, rather than present an update log. This candidate updates the existing
English, Korean and German product section accordingly.

## Product content

- Introduces the 25 amp heads, 48 presets, Classic/Dual/Matrix routing and
  39 PRE / 21 POST effects as one product.
- Explains nine cabinet configurations, 14 speakers, Chimera HF plus three additional tweeter designs,
  20 microphones, independent Mic A/B paths and the Dual/Matrix room.
- Separates modeled six-driver bass 6×10 from external 8×10 IR metadata;
  explains EXAMPLE artwork without implying that it documents a capture session.
- Gives Niflheimr a dedicated product section with its five channels and
  14 controls. Retains Náströnd and the existing effect catalogue.
- Replaces the historical shutdown-update paragraph with project/rig use.
  Existing Beta 1.1 screenshots keep their explicit earlier-version captions.

Code and artwork references are pinned to the integrated 1.3 source
`f56dc9d65c83a5d8dc29710ed29242032d34e235` on
`release/1.3.0-preparation` and `release/open-beta-1.3.0`.
Its parent `621bd70e79720c36c8b484f292e9f9386848ecb8`
([Chimera PR #43](https://github.com/raven-deadwire/SpectralForge-Chimera-Amp-Matrix/pull/43))
improves captured-cabinet depth and keeps mounted bass 4×10 HF hardware visible
at zero level. The final commit changes only the packaged manual and release
notes. All 107 audited source/artwork blobs match the final GitHub tree.

The web manual now matches the final source documentation for all four tweeter
choices, OUTPUT 0 dB preset recall, the mounted 4×10 horn at zero level,
metadata-based 2.5D IR illustrations, EXAMPLE and view/source selection behavior.
The packaged manual pins artwork to `v1.3.0-beta.1`; the web manual uses the exact
source SHA. Release notes describe the product without certifying publication or
completed acceptance. The source policy remains `release_approved=false`.
The product copy describes the resulting behavior; it is not a release
acceptance receipt.

## Local validation

- All 15 homepage release-contract tests pass.
- EN/KO/DE DOM rendering, translations, catalogue counts and local links pass.
- Source/content integrity lock covers the current product markup, JS, CSS,
  manual, source files and 85 pinned remote image references plus two verified local CI screenshots.
- JavaScript syntax and whitespace checks pass.
- GitHub run 38118045844 for the preceding website head `e571a4d` confirms
  the content/link job passes and the public release/assets job blocks on HTTP
  404 (2026-10-11 06:31 UTC). This final-source lock update has passed local
  checks; no new website CI result is claimed here. A desktop/mobile browser
  render was not completed locally because the Chromium download was invalid.
- `verify_chimera_release.py --offline` reports `OFFLINE_PASS`, explicitly
  `public_verified=false`. See the adjacent JSON report.

## Publication dependency

The owner has authorized publication after the fixes and product release.
No additional authorization is requested here. The existing release acceptance
and public-asset checks remain required: this PR must not publish 1.3 download
links until the exact source has a verified public 1.3 release. Source changes
require another source/content audit. This candidate does not mark CI,
listening, DAW or historical acceptance checks as complete.

## Actual CAB/IR screens

The CAB section now links two byte-identical native macOS component snapshots
from the successful macOS job in CAB CI run 38116435373, artifact 11694466617,
source `621bd70e79720c36c8b484f292e9f9386848ecb8`. Their original provenance stays
unchanged: the final source `f56dc9d` changes documentation only, with identical
CAB/IR code and artwork. These are not relabelled as captures of a later build.
One shows the modeled 4×10 horn at tweeter 0%; the other shows factory IR cards
with the shared enclosure depth/materials. These are actual product components,
not mockups. Each caption identifies macOS. Artifact and image hashes are in
`assets/chimera/screens-beta13-provenance.json`, itself covered by the content
lock. These screenshots do not certify external IR recording equipment.
