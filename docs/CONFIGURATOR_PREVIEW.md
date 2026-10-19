# Isolated configurator preview test

Date: 2026-10-19. Baseline: `dc1272c` (main at checkout).

Entry point: `configurator-preview.html`. This is a separate test page. The production `configurator.html`, `index.html`, shared pricing/platform module, translations, existing links and deployment configuration are unchanged. Do not replace or link the production configurator until the test has been reviewed.

## Implementation

The first commit connects EDDA end to end; the next extends the same renderer to EMBLA, ASKR and GRAMR. The test page copies the existing configurator shell and adds a read-only preview component, colour controls, and a responsive two-column layout. `tools/test_configurator_preview.cjs` compares data, normalization, pricing, option handlers, quote markup and PDF export source against production so the copy cannot silently diverge.

## Sample-render revision (user visual review, 2026-10-19)

The first flat SVG candidate was rejected for image quality. The test now composites the **existing, unchanged RavenForge sample render pixels** through source-coordinate SVG masks. No new instrument raster, third-party asset or generated completed instrument is used. The original WebP files remain byte-for-byte unchanged.

`assets/configurator-geometry.js` supplies source dimensions, silhouette/wood/part masks, material exposure and portrait/landscape crops. These remain display coordinates, not CAD or approved manufacturing geometry. `assets/configurator-preview.js` preserves source grain, bevels, highlights, original pickups and hardware detail. Luminance transfer changes front/headstock tone, and independent metal filters change bridge and knob highlights. Transparent dye combines selected material tone and finish colour; opaque colour softens the retained grain. It is not a physically calibrated finish model.

The visible “Sample parts retained” caption distinguishes the selected pickup/bridge names from the raster parts. All exact pickup, bridge and tuner appearances are explicitly pending, including catalog options. Changing a manufacturer never claims to replace the raster with that manufacturer's exact part. Nova Parts still renders black independently of other metal colours.

| Model | Unchanged visual source | Scope |
|---|---|---|
| EDDA | `assets/optimized/edda-prototype.webp` | Existing sample body, headstock and hardware pixels |
| EMBLA | `assets/optimized/embla-prototype.webp` | Existing sample including perspective and bevel |
| ASKR | `assets/optimized/askr-prototype.webp` | Existing sample body and angled part layout |
| GRAMR | `assets/optimized/gramr-superstrat-24f.webp`, front view | Front-view crop of existing concept sheet |

The source samples are not specification-correct production renders. In particular, EMBLA's pictured bridge/strings/tuners do not all correspond to the current five-string platform. The redrawn board uses the current 4/5/5/6 string counts, but the body strings/saddles and tuner arrangements are baked source details. The visible caption and scope panel flag that distinction. GRAMR's 2-2-1 remains a neck-bolt pattern. None of these sample arrangements is promoted to an approved specification.

| Selection | Display behavior |
|---|---|
| Body / top | Material tone changes while the source's grain and reflections remain. **A quilt/burl pattern does not become a different species' authentic grain.** Unknown materials receive a visible hatch. |
| Veneer / cap | Front tone changes; no invented thickness or side geometry. |
| Desired colour | Existing `finishColor` controls dye/opaque tone. Swatches, picker and single ko/en/de colour names work; quote/PDF use the same field. Complex prose remains unrendered with a warning. |
| Headstock | Matching front tone over the source image. Plate artwork remains hatched/unavailable. Source tuner silhouettes stay unchanged and are not recoloured. |
| Pickups / bridge / tuners | Detailed **source sample parts retained**, with exact selected labels and pending appearance status. No generic dashed rectangles posing as parts. |
| Hardware colour | Existing bridge/knob pixels are recoloured while preserving reflections. Nova bridge stays black. Wooden knob appearance remains pending. |
| Fretboard | Clean shaded board with approximate tone and fine illustrative grain; removes the sample's unselected ornate inlay. Not a stock-board photograph. |
| Frets / fretless / inlays | 24 frets, zero fret where applicable, lined/unlined fretless, dot/oval markers. Current board string count. Source body/saddle count can differ, as explained above. |
| Burst / flake / ramp / custom artwork / rear | Pending. Quote still preserves these choices. |

Desktop uses a larger portrait product stage; mobile keeps a compact landscape stage. Body/board/head zooms preserve source aspect ratio. “Sample render” displays the original reference with an explicit statement that selected options are not applied; changing a selection returns to the selected-finish preview. The renderer remains read-only with respect to prices, normalization, quote and PDF state.

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

`.github/workflows/configurator-preview.yml` runs on this test page's PR. It validates 4 models × 3 languages × 2 viewports (1440×1080 and 390×844), live colour/top/fretboard/hardware changes, retained-part statuses, source image decoding, reference/selected switching, actual pixel differences after a colour change, responsive orientation, zoom, reset, unmapped-state behavior, and page overflow. It then uses the existing real-browser regression runner for 24 price/option/PDF combinations. Screenshots, PDFs and JSON reports are uploaded as the PR's CI artifact. A passing source contract is not a substitute for this CI result or final visual approval.

## Follow-up asset work

Replace display contours with approved orthographic outlines, and add measured/licensed part assets through an explicit per-model/per-option registry. Obtain stock-board texture photos and separate front/rear/headstock masks before claiming species-specific grain, exact selected parts, or finished-build fidelity. Unsupported selections must keep their visible fallback until those assets exist.
