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

Code and artwork references are pinned to the owner-approved integrated 1.3 source
`7f692693f942a0f1dd1973062dc4d5d47b9be4ac` on
`release/1.3.0-preparation` and `release/open-beta-1.3.0`.
The implementation source `621bd70e79720c36c8b484f292e9f9386848ecb8`
([Chimera PR #43](https://github.com/raven-deadwire/SpectralForge-Chimera-Amp-Matrix/pull/43))
improves captured-cabinet depth and keeps mounted bass 4×10 HF hardware visible
at zero level. Subsequent commits finalize the manual/release notes and record
owner approval. Source `8303c844` then makes the owner's requested
narrow cabinet side-rail texture correction in `Source/CabEnclosureArtwork.h`,
with corresponding enclosure material checks. It changes neither DSP nor
presets; the packaged manual and release policy retain their reviewed blobs.
Final release source `7f692693` changes only the enclosure material test and
three Python CI encoding/test files. All production code, artwork, manual and
approval-policy blobs remain identical to `8303c844`; no new capture is implied.
All 108 audited source/artwork blobs match the final GitHub tree.

The web manual now matches the final source documentation for all four tweeter
choices, OUTPUT 0 dB preset recall, the mounted 4×10 horn at zero level,
metadata-based 2.5D IR illustrations, EXAMPLE and view/source selection behavior.
The packaged manual pins artwork to `v1.3.0-beta.1`; the web manual uses the exact
source SHA. The owner reported checking the downloaded test file and expressly
approved release and homepage publication. The source policy now records
`release_approved=true`, `publication_authorized=true` and
`OWNER_APPROVED_CI_VERIFICATION_PENDING`. No additional general approval or
tested-file identification is requested. Owner acceptance does not fabricate
individual test measurements or replace independently evaluated CI evidence.
The product description itself does not certify public release availability.

## Local validation

- All 15 homepage release-contract tests pass.
- EN/KO/DE DOM rendering, translations, catalogue counts and local links pass.
- Source/content integrity lock covers the current product markup, JS, CSS,
  manual, source files and 85 pinned remote image references plus two verified local CI screenshots.
- JavaScript syntax and whitespace checks pass.
- GitHub run 38119822329 for the preceding website head `035cbde` confirms
  the content/link job passes and the public release/assets job blocks on HTTP
  404 (2026-10-11 07:01 UTC). This native screenshot update has passed local
  checks; no new website CI result is claimed here. A desktop/mobile browser
  render was not completed locally because the Chromium download was invalid.
- `verify_chimera_release.py --offline` reports `OFFLINE_PASS`, explicitly
  `public_verified=false`. See the adjacent JSON report.

## Publication dependency

Owner acceptance and publication authorization are recorded in the approved
source. No additional general approval or tested-file identification is required.
The individual CI/source-evidence and public-asset checks remain unchanged:
this PR must not publish 1.3 download links until the exact source has a verified
public 1.3 release. The two CAB/IR pictures now use verified captures of the
corrected production renderer. Source changes require another source/content
audit; documentation, pipeline or test-only changes do not relabel the capture
source or require new screenshots when product UI code and artwork are identical.
Owner acceptance does not synthesize individual CI, listening, DAW or historical
measurement reports.

## Actual CAB/IR screens

The CAB section links two byte-identical native Windows component snapshots
from successful Windows CAB job 114411441748 in run 38119610154,
artifact 11695383097, source `8303c844c3dbf024cc1ffa56f9014a97e271af54`.
The artifact ZIP SHA-256 is
`d565f0168a749ca5ac358bd645154fa0eb32b9297ca107a07781ee96dc8bce0a`.

Visual review confirms the guitar 4×12 side rail follows a continuous upper/lower
texture at the bend, the bass 4×10 horn remains visible at tweeter 0%, and the IR
cards retain enclosure depth, microphone placement and intentional EXAMPLE
labels. These are actual product components, not mockups or capture-session
photographs. The Windows screenshots replace the earlier macOS images, and
all three language captions now identify Windows. Their dimensions remain
1040×780 and 1040×748, respectively.

Artifact and image hashes are in `assets/chimera/screens-beta13-provenance.json`,
itself covered by the content lock. This provenance identifies the successful
Windows job; it does not assert success for the macOS job or entire CAB workflow.
Final source `7f692693` changes only CI encoding and test files, preserving all
production renderer code and artwork. These verified pictures therefore remain
representative of that source, while their original capture identity stays
`8303c844`. No additional approval or recapture requirement is introduced.
