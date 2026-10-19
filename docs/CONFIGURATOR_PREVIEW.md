# Isolated configurator preview test

Date: 2026-10-19. Baseline: `dc1272c` (main at checkout).

Entry point: `configurator-preview.html`. This is a separate test page. The production `configurator.html`, `index.html`, shared pricing/platform module, translations, existing links and deployment configuration are unchanged. Do not replace or link the production configurator until the test has been reviewed.

## Implementation

The first commit connects EDDA end to end; the next extends the same renderer to EMBLA, ASKR and GRAMR. The test page copies the existing configurator shell and adds a read-only preview component, colour controls, and a responsive two-column layout. `tools/test_configurator_preview.cjs` compares data, normalization, pricing, option handlers, quote markup and PDF export source against production so the copy cannot silently diverge.

## Full front/back and inlay review (2026-10-19, latest user request)

- Removed body/fretboard/head zoom controls. Front/back buttons always show the complete instrument with an unchanged aspect ratio. Legacy crop names in the renderer fall back to the full front view.
- GRAMR has a separate rear projection extracted from the supplied PDF: rear body/head contours, neck envelope, six tuner centres and tremolo cavity. No front mirroring or generated whole-instrument image. The old four-bolt plate is excluded; a hatched region marks the unresolved current joint. Neck lamination widths and exact rear hardware/cavity internals are not fabricated.
- Rear body tone uses body wood (never the top); natural oil retains the natural tone. Other rear finishes can use the existing finish-colour input. Materials remain illustrative.
- EDDA, EMBLA and ASKR do not have verified rear source assets in this test. Their rear tab explicitly displays an unavailable state and never presents a mirrored front as a rear image. The quote remains intact.
- The existing `inlay_oval` option now uses an original RavenForge tapered oval / raven-eye motif with a feather split. It is a design study, not a manufacturing drawing. Oval material choices change illustrative tones and do not inherit dot-only placement state. Existing option IDs/prices are unchanged.
- Marleaux's oval option was referenced through its [official Soprano configuration sheet](https://www.marleaux-bass.de/wp-content/uploads/en_Configuration_Soprano.pdf) and [Consat Signature reference listing](https://www.paisleymusik.de/marleaux/marleaux-consat-signature-4-string/). No external image, vector path or logo is included.
- Choosing custom → bindrune displays C1–C4 from `RavenForge_Bindrune_Inlay_Design_Guide_v5.0.pdf`, page 1. The four SVGs preserve the existing illustration paths. The original `RavenForge_Bindrune_Layouts_v5.png` is also available from the example card. No new runes or inferred meaning are added. The final artwork/placement is not automatically applied to the instrument.
- Only the requested example images are bundled; the complete private PDFs remain outside the repository. Provenance is in `assets/configurator-bindrune/README.md`.

This section supersedes the earlier zoom/rear descriptions below. Production configurator, shared platform/options/pricing and quote/PDF behavior remain unchanged.

## Opaque / GRAMR drawing correction (2026-10-19, later user review)

Opaque formerly applied a 4-pixel Gaussian blur to the entire body image and a 2-pixel blur to the headstock. This caused the reported loss of detail. Both are removed. Bass opaque colour now uses only pointwise colour/contrast transfer; source RGB pixels are never spatially averaged. GRAMR opaque paint fully covers its texture and retains vector edges. Its edge-lighting filter blurs **SourceAlpha only**, not instrument RGB; shadow softness is separate from finish resolution.

GRAMR's old concept raster is no longer used to determine its silhouette, parts or reference view. Its replacement comes directly from the uploaded `RavenForge_Superstrat_24F_ver3_STRICT_R12-Model(1).pdf`:

- `assets/configurator-gramr-geometry.js`: extracted PDF body/head/pickguard curves, 24 fret positions, six tuner bore centres, bridge/pickup/control placement. Coordinates use the PDF rotation matrix and a uniform 0.5 display scale, without reshaping. The largest join gap in the PDF source is <0.05 PDF points. The small neck-covered closing segment is only a display fill closure.
- `assets/configurator-gramr-reference.svg`: clean front-geometry reference used by the comparison button. It is not the complete private manufacturing drawing.
- `tools/extract_gramr_preview_geometry.py`: reproducible, source-SHA-guarded extraction. The original PDF is neither modified nor committed.
- `assets/configurator-drawing-renderer.js`: material/lighting layers over the extracted geometry. No stretch of the inaccurate whole-instrument concept image. Strings span six tuner posts, the board and six saddles consistently.
- `assets/configurator-materials/ash-illustrative.webp`: generated material-only texture (1254 × 1254). It is illustrative ash, not a photo of actual stock. It never controls geometry. Prompt and provenance are alongside the asset.

The drawing's older textual specification (including one-piece body and four-point neck joint) is **not** copied over current platform specifications. This revision changes front visual geometry only. No rear geometry, neck-joint specification, model pricing, option dependency or PDF logic changes. Pickup/bridge surfaces are illustrated within the drawing envelopes, not certified manufacturer renders.

Current geometry/material behavior supersedes the GRAMR entries in the earlier sample-render revision below. EDDA/EMBLA/ASKR keep their original sample pixels; their known baked-part limitations remain.

## Sample-render revision (user visual review, 2026-10-19)

The first flat SVG candidate was rejected for image quality. The test now composites the **existing, unchanged RavenForge sample render pixels** through source-coordinate SVG masks. No new instrument raster, third-party asset or generated completed instrument is used. The original PNG files are used to avoid the optimized thumbnails’ compression; both originals and optimized WebP files remain byte-for-byte unchanged.

`assets/configurator-geometry.js` supplies source dimensions, silhouette/wood/part masks, material exposure and portrait/landscape crops. These remain display coordinates, not CAD or approved manufacturing geometry. `assets/configurator-preview.js` preserves source grain, bevels, highlights, original pickups and hardware detail. Luminance transfer changes front/headstock tone, and independent metal filters change bridge and knob highlights. Transparent dye combines selected material tone and finish colour; opaque colour reduces grain contrast without spatial blur. It is not a physically calibrated finish model.

The visible “Sample parts retained” caption distinguishes the selected pickup/bridge names from the raster parts. All exact pickup, bridge and tuner appearances are explicitly pending, including catalog options. Changing a manufacturer never claims to replace the raster with that manufacturer's exact part. Nova Parts still renders black independently of other metal colours.

| Model | Unchanged visual source | Scope |
|---|---|---|
| EDDA | `Edda Prototype Design.png` | Existing sample body, headstock and hardware pixels |
| EMBLA | `EMBLA Prototype Design.png` | Existing sample including perspective and bevel |
| ASKR | `ASKR Prototype Design.png` | Existing sample body and angled part layout |
| GRAMR | `assets/concepts/gramr-superstrat-24f.png`, front view | Front-view crop of existing concept sheet |

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

Local: `node tools/test_configurator_contracts.cjs`, `node tools/test_configurator_preview.cjs`, JavaScript syntax checks and `git diff --check`. The new contract covers 545 allowed option substitutions in three languages and front/back views, mutation protection, unknown colour/material handling, escaping, model restrictions and Nova's hardware-colour exception.

Local browser QA is **unavailable** in the authoring environment: the managed preview supervisor exits with `bwrap: Can't mount proc ... Operation not permitted`. Static SVG raster review is not browser QA.

`.github/workflows/configurator-preview.yml` runs on this test page's PR. It validates 4 models × 3 languages × 2 viewports (1440×1080 and 390×844), live colour/top/fretboard/hardware changes, retained-part statuses, source image decoding, reference/selected switching, actual pixel differences after a colour change, full opaque/front/back screenshots and no RGB blur, responsive orientation, no zoom controls, side-switch price invariance, rear asset fallbacks, Oval and original bindrune examples, reset, unmapped-state behavior, and page overflow. It then uses the existing real-browser regression runner for 24 price/option/PDF combinations. Screenshots, PDFs and JSON reports are uploaded as the PR's CI artifact. A passing source contract is not a substitute for this CI result or final visual approval.

## Follow-up asset work

Replace display contours with approved orthographic outlines, and add measured/licensed part assets through an explicit per-model/per-option registry. Obtain stock-board texture photos and separate front/rear/headstock masks before claiming species-specific grain, exact selected parts, or finished-build fidelity. Unsupported selections must keep their visible fallback until those assets exist.
