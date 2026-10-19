# Isolated configurator preview test

Date: 2026-10-19. Baseline: `dc1272c` (main at checkout).

Entry point: `configurator-preview.html`. This is a separate test page. The production `configurator.html`, `index.html`, shared pricing/platform module, translations, existing links and deployment configuration are unchanged. Do not replace or link the production configurator until the test has been reviewed.

## Implementation

The first commit connects EDDA end to end; the next extends the same renderer to EMBLA, ASKR and GRAMR. The test page copies the existing configurator shell and adds a read-only preview component, colour controls, and a responsive two-column layout. `tools/test_configurator_preview.cjs` compares data, normalization, pricing, option handlers, quote markup and PDF export source against production so the copy cannot silently diverge.

`assets/configurator-geometry.js` contains hand-authored SVG display outlines based on the repository's existing RavenForge images. These are **concept/prototype reference contours, not approved CAD or manufacturing geometry**. Source pixels are not repainted or distributed as a new finished-product image. String counts, fret count and fixed options use the current platform; no tuner arrangement is guessed from ambiguous concept illustrations. GRAMR's 2-2-1 remains a neck-bolt pattern, never a headstock specification.

`assets/configurator-preview.js` consumes the same normalized selection object as the quote. It has no setters for instrument specifications, pricing rules, extra audio dependencies, asynchronous rendering or remote asset requests. SVG updates in the same React render. User strings are escaped before SVG serialization. Colour inputs accept a single explicit colour; arbitrary prose, multipart finish instructions and unknown materials fail visibly to an unmapped state rather than being interpreted as a fabricated build.

| Model | Existing visual source | Shape status |
|---|---|---|
| EDDA | `assets/optimized/edda-prototype.webp` | Prototype display contour |
| EMBLA | `assets/optimized/embla-prototype.webp` | Prototype display contour; perspective retained |
| ASKR | `assets/optimized/askr-prototype.webp` | Prototype display contour; fan shown schematically, not a verified fret layout |
| GRAMR | `assets/optimized/gramr-superstrat-24f.webp`, front view; `concepts/gramr-superstrat-24f/meta.json` | Published concept contour |

## What is and is not visualized

| Selection | Display behavior |
|---|---|
| Body / top / fretboard | Approximate flat material colour only. No stock-specific, figured, quilted or burl grain is invented. Exotic/unmapped material is hatched. |
| Standard matching top | Uses the core wood on three-piece bass construction, as the current option specifies. Wing wood is recorded but not exposed through that top. |
| Veneer / cap | Selected top wood changes the front colour. Construction type is recorded; no unverified thickness, binding or side view is drawn. |
| Desired colour | Swatches/picker write the existing `finishColor` field, which already appears in the quote/PDF. `transparent #RRGGBB` blends over the material colour; `solid #RRGGBB` covers it. Natural clears the colour field. Simple English/Korean/German colour names are accepted. |
| Complex free text | Remains in the quote; a visible localized warning states that it has not been rendered. No silent colour inference. |
| Headstock | Existing contour with matching front colour. RavenForge plate is hatched because plate artwork is unavailable. |
| Pickups / bridges | Dashed symbols in reference positions, plus the exact selected name. These are **not manufacturer part renders**. Custom/unverified pickup appearance is hatched. Changing brand does not fabricate a new housing. |
| Hardware colour | Reference knob symbols and bridge colour update. Nova Parts multiscale bridge remains black independently of the other hardware. |
| Frets / fretless / fret lines | 24 symbolic fret lines or an unlined/lined fretless board; current string count. GRAMR stays 24 frets without a zero fret. |
| Inlays | Simple dot/oval position symbols only. Custom art is not drawn. Materials and dimensions are not a production representation. |
| Tuners / rear finish / neck laminates / control functions / burst / flake / ramp | Kept in selections and quote. Exact appearances and rear geometry are not available; scope panel identifies the limit. No rear or audio simulation. |

All four zoom views use SVG viewBox changes, with no new specification or price state. Source-concept links are clearly separated from the selected-option preview.

## Reference comparison (observed 2026-10-19)

Only interaction patterns were studied. No external images, paths, code or branding were copied.

| Reference | Observed behavior | RavenForge decision |
|---|---|---|
| [ST reference](https://your-st-model-01.pages.dev/) | Immediate colour/material controls, whole/body/neck/head views, SVG instrument. Audio is also present. | Immediate SVG updates and focused views; no audio. |
| [Sandberg](https://configurator.sandberg-guitars.de/) | Instrument/model/finish/neck/hardware navigation alongside an instrument image and a recall code. | Retain model-specific constraints and a persistent visual area. No new save/account flow. |
| [Maruszczyk / Public Peace](https://www.public-peace-customshop.de/configurator/jake-c/body) | Body/colour/neck/fingerboard/headstock/pickups/electronics/hardware tabs, material tiles, visualization download and configuration overview/total. | Keep the existing categorized controls and quote; expose precisely which selected material is shown. |
| [Kiesel](https://www.kieselguitars.com/builder/guitar) | General/body/neck/electronics/hardware sections, front/rear control, graphic-representation and finish-colour qualifications, model-specific restrictions. | Clearly qualify concept/material previews and unsupported assets. Rear view waits for real reference data. |

## Verification

Local: `node tools/test_configurator_contracts.cjs`, `node tools/test_configurator_preview.cjs`, JavaScript syntax checks and `git diff --check`. The new contract covers 545 allowed option substitutions in three languages and four views, mutation protection, unknown colour/material handling, escaping, model restrictions and Nova's hardware-colour exception.

Local browser QA is **unavailable** in the authoring environment: the managed preview supervisor exits with `bwrap: Can't mount proc ... Operation not permitted`. Static SVG raster review is not browser QA.

`.github/workflows/configurator-preview.yml` runs on this test page's PR. It validates 4 models × 3 languages × 2 viewports (1440×1080 and 390×844), live colour/top/fretboard/hardware/pickup changes, zoom, reset, unmapped-state behavior, and page overflow. It then uses the existing real-browser regression runner for 24 price/option/PDF combinations. Screenshots, PDFs and JSON reports are uploaded as the PR's CI artifact. A passing source contract is not a substitute for this CI result or final visual approval.

## Follow-up asset work

Replace display contours with approved orthographic outlines, and add measured/licensed part assets through an explicit per-model/per-option registry. Obtain stock-board texture photos and separate front/rear/headstock masks before claiming realistic grain, exact parts, or finished-build fidelity. Unsupported selections must keep their visible fallback until those assets exist.
