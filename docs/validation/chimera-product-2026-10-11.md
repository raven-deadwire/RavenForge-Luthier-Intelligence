# Chimera 1.3 product description — 11 October 2026

The owner requested the homepage to describe the whole product through version
1.3, rather than present an update log. This candidate updates the existing
English, Korean and German product section accordingly.

## Product content

- Introduces the 25 amp heads, 48 presets, Classic/Dual/Matrix routing and
  39 PRE / 21 POST effects as one product.
- Explains nine cabinet configurations, 14 speakers, three tweeter models,
  20 microphones, independent Mic A/B paths and the Dual/Matrix room.
- Separates modeled six-driver bass 6×10 from external 8×10 IR metadata;
  explains EXAMPLE artwork without implying that it documents a capture session.
- Gives Niflheimr a dedicated product section with its five channels and
  14 controls. Retains Náströnd and the existing effect catalogue.
- Replaces the historical shutdown-update paragraph with project/rig use.
  Existing Beta 1.1 screenshots keep their explicit earlier-version captions.

Code and artwork references are pinned to UI-fix candidate
`621bd70e79720c36c8b484f292e9f9386848ecb8`,
[Chimera PR #43](https://github.com/raven-deadwire/SpectralForge-Chimera-Amp-Matrix/pull/43).
This source improves captured-cabinet depth and keeps mounted bass 4×10 HF
hardware visible at zero level. The product copy describes the resulting
behavior; it is not a release acceptance receipt.

## Local validation

- All 15 homepage release-contract tests pass.
- EN/KO/DE DOM rendering, translations, catalogue counts and local links pass.
- Source/content integrity lock covers the current product markup, JS, CSS,
  manual, source files and 87 pinned remote image references.
- JavaScript syntax and whitespace checks pass.
- `verify_chimera_release.py --offline` reports `OFFLINE_PASS`, explicitly
  `public_verified=false`. See the adjacent JSON report.

## Publication dependency

The owner has authorized publication after the fixes and product release.
No additional authorization is requested here. The existing release acceptance
and public-asset checks remain required: this PR must not publish 1.3 download
links until the exact source has a verified public 1.3 release. Source changes
require another source/content audit. This candidate does not mark CI,
listening, DAW or historical acceptance checks as complete.
