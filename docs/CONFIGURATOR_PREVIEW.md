## v16 — lower switch rows and visible product-specific pickups

The previous switch placement was rejected visually despite its automated
clearance checks. EMBLA's coil switches were still beside its pickups; ASKR's
switches were too close to the lower rim. Both now have a dedicated switch row
below the whole knob bank, beside the bridge and inset from the body boundary.
Both 3/4/5/6-knob banks are repacked against v15's new PDF-vector coordinates. Add/remove operations do
not replace or move knobs. Mini toggles have a washer, hex nut and lever; the
floating dashed halos are removed. GRAMR's specified kill-switch position stays
unchanged. These are display layouts, not confirmed drilling coordinates.

The v15 drawing/texture update is preserved. Integration also fixes reversed
EMBLA PDF string-line endpoints, which incorrectly placed replacement bridge
anchors in the headstock; line coordinates are unchanged, only ordered head-to-bridge.

The official Häussel catalog, page 15, establishes the 89×48 mm four-string MM
Triplebucker: two rows of four large poles and a middle row of eight small poles,
with three mounting ears. Its original SVG now replaces the source pickup on
EDDA. This supersedes v14's incorrect claim that no exterior reference existed.
https://www.haeussel.com/fileadmin/pdf/Katalog2014_en.pdf#page=15

Page 18 supplies the Häussel BassBar catalog exterior (101×36 mm BB5). EMBLA's
ordered custom 100×36 cover is not established by that drawing: the actual catalog
shape is shown as a **catalog reference**, with this discrepancy visible below the
instrument and in the option card. EDDA Nova Custom similarly shows its known
standard MM base exterior and explicitly leaves the custom cover unconfirmed.
https://www.haeussel.com/fileadmin/pdf/Katalog2014_en.pdf#page=18

Every active pickup choice now has a visual/status card. Product cards and the
instrument use the same original SVG renderer. Recognizable details include Nova
split rails, Triplebucker poles, Delano Times Square bars, Fishman's groove and
Lundgren's two open bobbins. Cover-only EMG/Delano models retain their distinct
mounting recesses, proportions and fastening patterns. Manufacturer photos are
reference material only; no third-party product photos or logos are distributed.

| Scope | Active selections |
| --- | --- |
| Product exterior | EDDA Nova MM / Häussel Triple; EMBLA Delano SBC / Times Square; ASKR EMG / Fishman / Delano SBC5 E; GRAMR Lundgren M6 |
| Catalog exterior; custom cover pending | EDDA Nova Custom; EMBLA Häussel BassBar Custom |
| Unspecified exterior; explicitly retains source | EMBLA / ASKR Nova Custom; Others; GRAMR custom passive HH |

Validation includes all active pickup cards against the selected instrument
profile in KO/EN/DE and desktop/mobile, plus product pole counts, custom-reference
status, lower-row bounds, control clearances and an unchanged body surface across
preamps. Existing price/dependency/handler/PDF source parity remains enforced.
CI results and visual review are recorded in PR #35; passing checks do not imply
owner approval of appearance. Production configurator files remain unchanged.

---

## v15 — original drawing audit (2026-10-20 KST)

Based on PR head v14 `5dfc1f07e54639e11ff41fe13a014405cf77485e`, preserving
all v12–v14 additions made after the requested v11 revision. Production is unchanged.

ASKR #001 / EMBLA #002 front outlines, heads and 24 fret lines now come from
native PDF vectors rather than the prototype raster silhouettes. Rear outlines
and five source bolt centres are retained. GRAMR's rear neck boundary now uses
PDF path 5613, replacing a diagonal line to the cutaway tangent. Its current
five-bolt 2-2-1 joint remains an explicitly unapproved schematic: the old source
PDF depicts a four-point plate, not the current platform.

Opaque bass rear bodies/covers now use solid paint and independent lighting;
wood grain no longer leaks through. Eight materials have independent native
724 × 2172 sources without resizing. The remaining 21 materials retain legacy
atlas cells; this is **not** a claim of 2048 × 2048 source quality.

See [drawing audit and visual evidence](CONFIGURATOR_DRAWING_AUDIT.md) for exact
source hashes, validated scope, remaining limitations and verification results.

---

## v14 — EDDA guard selections, Nova pickup and EMBLA control placement

EDDA now exposes presence, single-/three-ply plastic or body/top matching wood,
black/white/ivory/burgundy/body-match colour, and matte/gloss surface in Hardware.
These are ordinary test-catalog selections: the existing dependency normalizer,
summary and PDF consume them. None remains the base-price default; adding a guard
requires a separate quote. Material/colour/surface are visual proposals, not an
approved fabrication price list. Wood follows the selected body/top; its separate
colour choices disappear. Removing the guard removes all dependent quote rows.
The original EDDA sample contour is retained. GRAMR keeps its display-only guard;
ASKR and EMBLA do not acquire invented outlines. Production files are unchanged.

Nova Omnia B4 MM now has its own original SVG: 89 × 48.8 mm cover (101 mm with
mounting ears), three ears and four split rails in two rows. References inspected:
https://www.nova-pickups.com/products/omnia-b4-mm
https://www.nova-pickups.com/cdn/shop/files/photo_2026-06-06_08.58.36.jpg
No photo or logo is distributed. Custom Nova and Häussel covers remain pending;
their notice is now visible directly below the instrument, outside collapsed scope.
The manufacturer's Triplebucker page did not establish the ordered custom cover.

EMBLA's 3/4/5/6-knob arrays now stay in a compact control bank to the right of
the pickups and above the lower bridge edge. Coil and kill switches retain separate
clearances. The continuous body surface remains identical across electronics.
ASKR coil switches now sit below all knob layouts; the optional kill switch has
a separate lower position. Positions are preview installation proposals, not drilling coordinates.

Validation: production parity, catalog dependency/quote state, 22 distinct guard
appearances, Nova coverage, EMBLA bounds and switch separation. Browser checks
exercise all guard controls, model cleanup and real PDF rows in KO/EN/DE. CI
results are recorded in PR #35 after the exact revision completes.

---

## v13 historical status — 2026-10-20 KST

Move the complete instrument preview to the leftmost desktop column. Options
occupy the centre, with the live specification and price on the right. Preview
and quote stick independently while the option form scrolls. Mobile retains its
compact preview, quote and option stack plus quick navigation and live total.
Bass control positions now use complete 3/4/5/6-knob layouts, with level/blend
above and tone/filter groups below. They no longer consume a prefix of the source
knob coordinates. Body material and lighting form one continuous surface before
hardware is added: changing preamps cannot uncover bright erase patches. The
original sample silhouette and sample-reference button are preserved. Pickup
covers use manufacturer-photo details and the original rendered projection.
Existing choices, prices and PDF export remain unchanged; compact quote rules are scoped to its live wrapper so detached
PDF snapshots preserve their export layout.

---

## v12 historical status — 2026-10-20 KST

- Desktop: choose options on the left; whole-instrument image and compact
  category/value/price rows share the right column. At wide desktop sizes they
  sit side by side. Mobile has preview/quote/options jump links and a live total.
- Preview-only settings and scope notes fold away, keeping the image visible.
- Pickup surfaces and EQ-dependent single/stacked knob arrays are described in
  `CONFIGURATOR_PARTS.md`. Separate coil/kill switches never replace a knob.
- Burst follows each actual body contour, including cutaways, on front **and**
  back. It does not shade the headstock or instrument hardware. No ellipse-based
  burst or RGB blur is used; the edge mask is derived from silhouette alpha.
- GRAMR kill switch follows the requested upper-right pickguard position.
- Test catalog removes RavenForge head plate and adds natural non-matching
  headstock. It is a zero-cost alternative to the existing zero-cost head choices.
- New neck colour choice: natural / match body. Transparent matching retains
  laminate species; opaque matching conceals them. The neck colour follows the
  body colour input independently of the rear body's natural-oil setting. The
  rear headstock follows neck colour; front head matching remains independent.
- No approved neck-match surcharge exists, so its price is **request**, not an
  invented charge. Natural is the unchanged base configuration. Both new finish
  choices enter the ordinary test spec sheet/PDF through a test-only catalog
  adapter; production data and all price/dependency/PDF functions stay unchanged.
- Existing EDDA pickguard, deferred finger ramp, bolt-on joints, rear references,
  bindrunes, full front/back framing and ASKR fixed bridge colours remain.

Local validation: JSX compiles; 553 allowed substitutions × 3 languages × front/
back pass; new topology, material/finish and switch-position assertions pass.
14 native whole-instrument examples were rendered and representative pickup,
EQ, burst and GRAMR switch views inspected. Browser/PDF results belong to the
exact PR head, recorded in PR #35 after CI, not assumed from prior v11 results.

---

## Historical implementation record (v11 and earlier)

## v11 current status — 2026-10-20 KST

EDDA optional sample-contour guard is restored. Selected manufacturer parts now
use the explicit reference registry in `configurator-parts-renderer.js`, with
unsupported products still marked pending. See `CONFIGURATOR_PARTS.md` for exact
coverage and primary sources; this supersedes the historical v10 blanket fallback.
Neck laminate strips now have the specified species grain, including bloodwood
and bubinga. Walnut/bloodwood comparison is display-only. Finger ramps are deferred
and removed from the test step and all rendering, including stale selections.
Production and price/PDF logic are unchanged.

# Isolated configurator preview test

Date: 2026-10-19. Baseline: `dc1272c` (main at checkout).

Entry point: `configurator-preview.html`. This is a separate test page. The production `configurator.html`, `index.html`, shared pricing/platform module, translations, existing links and deployment configuration are unchanged. Do not replace or link the production configurator until the test has been reviewed.

## Implementation

The first commit connects EDDA end to end; the next extends the same renderer to EMBLA, ASKR and GRAMR. The test page copies the existing configurator shell and adds a read-only preview component, colour controls, and a responsive two-column layout. `tools/test_configurator_preview.cjs` compares data, normalization, pricing, option handlers, quote markup and PDF export source against production so the copy cannot silently diverge.

## Optional EDDA pickguard restored (v11, 2026-10-20, latest)

The user confirmed EDDA can have a pickguard. Its original sample image already
contains an asymmetric guard. Register that visible contour as a display trace
and restore none/black/ivory/matching-wood choices, defaulting to none. The guard
renders below the board and pickups, never on the rear; it does not alter quote
or PDF state. This is not an approved machining outline. GRAMR keeps its PDF
contour. EMBLA/ASKR still have no registered display contour; that is an asset
limitation, not a declaration that they cannot support a pickguard.

## Source hardware and additive controls (v10, 2026-10-20, historical)

Remove the v9 generic pickup, bridge and tuner substitutions and their flat
underlays. Restore the original sample pixels / supplied drawing contours, front
and back. Explicitly label selected product geometry as **not rendered**. Exact
manufacturer substitutions remain unfinished; a product-family name or generic
shape is not adequate evidence of appearance or fit.

Retain every original knob. Additional coil/kill switches use separate stable
preview positions with dashed outlines. They do not remove, repurpose, overlap
or move a knob. Dual tone remains a push-pull indicator on a retained knob.
These positions are proposals, not fabrication coordinates. Production quote
wording still specifies existing control positions; a real additive-control
layout requires separate confirmation. The test does not rewrite that contract.

The fabricated v9 bass pickguards were removed here. The temporary blanket
removal of EDDA controls is corrected in v11 using its original sample contour. Preserve body/neck pieces, wood ramps, neutral dye processing, ASKR fixed bridge
finish, bolt-on joints, bindrunes, prices and PDF. See
[component scope and references](CONFIGURATOR_PARTS.md).

## Construction and colour correction (v9, historical)

Body joins, preview-only pickguards, wood ramps and common neutral-luminance dye
processing were introduced here. The inaccurate part-family shapes and the
control-slot replacement logic are superseded by v10.

## Detailed options and wood textures (v8, 2026-10-20, historical)

This continues the user-accepted v7 outline and bolt-on construction in the test
page only. Production, option normalization, prices and PDF source stay identical.

- All named body/top/fretboard wood options now resolve to illustrative wood
  textures, including ironwood, bog oak, snakewood, wamara, kingwood, African
  blackwood, jindai woods and buckeye burl. The old ironwood display was the grey
  unknown-material hatch, not an intended metal material. It is now warm wood.
- Three original AI texture atlases contain 27 material examples. Generated source
  resolution is 1254 × 1254 (not the requested 2048); each inset cell is 410 × 410.
  Whole-instrument framing is retained. No upscaled-detail viewer is offered.
  The ash/swamp-ash and Indian-rosewood/rosewood options share the respective family
  example. Custom/other woods remain explicitly unmapped. These are not stock-board
  photographs, species identification certificates or approved bookmatches.
- Add binding/purfling edges, fret width, dot material colour, wood knobs, burst,
  flake, finish sheen, handedness, rear neck-piece options and rear body-wing wood.
  Material widths, burst colour/falloff and flake sizes are visual examples.
- Original front instrument geometry and part pixels remain. Exact manufacturer
  pickup/bridge/tuner substitutions, third-pickup positions, finger/slap ramps,
  custom spacing/profiles and chambering are not invented. The scope table marks
  missing shapes/positions and front/back-only features.
- C1–C4 guide cards are keyboard-accessible buttons. Clicking a card applies ONLY
  its original white motif paths to the fretboard, below strings and above wood.
  Board/fret/string/background paths from the guide are not copied. The source
  board coordinates are mapped to the selected model's display board; this is a
  guide example, not approved inlay toolpaths. Choice is retained per model and
  language; choosing another inlay/custom type hides the rune. It does not alter
  the price/PDF selection model or imply approval of a customer's final artwork.
- All ASKR multiscale bridge finishes are independent of hardware colour. Payson
  retains the previous reference finish; Nova retains its specified black anodized
  finish. Hardware colours still apply to the other metal components, including
  front tuners. Selecting another bridge is separate from changing its colour.

Source generation: `assets/configurator-materials/README.md` and
`prompts-v8.json`. White-path extraction: `tools/extract_bindrune_motifs.py`.
The current browser/PDF run must be checked separately; previous PASS results do
not automatically apply to v8.

## ASKR and EMBLA are bolt-on (v7, 2026-10-20, historical)

Both models are fixed bolt-on instruments, not optional joint types. Re-reading
both supplied rear drawings confirms five rear fasteners; it does not validate a
finished joint surface from the body cutaway curve alone.

- Give the detachable neck its own grain coordinates and transverse lighting.
  The former shared pattern aligned neck and body grain as if cut from one blank.
- Keep neck laminations inside the neck clip and draw an illustrative mechanical
  edge at the source neck/body envelope. Body and neck remain separate surfaces.
- Keep the five PDF bolt centres; do not replace them with generated positions.
- Label every model, including ASKR and EMBLA, as a bolt-on neck in both views.
- This correction changes the test renderer only. The seam relief is illustrative,
  not an approved pocket depth or machining surface. No production options,
  pricing, PDF code or original front samples are changed.

## Visible bolt-on joint correction (v6, 2026-10-20, historical)

The user correctly rejected v5's remaining neck-through/set-neck appearance.
Passing bolt-count and renderer metadata checks did not validate that appearance.
The v6 changes are limited to the test preview:

- EDDA uses a newly edited concept with a lighter separate neck and a sharp heel
  seam. The old concept is no longer packaged. Its exact joint remains unapproved.
- ASKR/EMBLA trace their supplied PDFs' actual neck/body boundary, independently
  of heel-relief lines, with a seam readable at full-instrument display size.
- GRAMR no longer omits every bolt. Its known five-bolt 2-2-1 / no-plate structure
  appears as symbols in an explicitly hatched construction region. These symbols
  are not manufacturing coordinates, and the hatch is not a neck plate. The
  exposed neck ends at the source envelope; no neck strip crosses the body.
- The heading says `RF / TEST v6`, distinguishing this delivery from v5. Sources
  and image paths are versioned; the standalone HTML still embeds all media.
- Prices, model constraints, front source images, bindrune assets and PDF export
  code are unchanged. The same direct-file CI gates must run on the new commit.

Current screenshots must be visually reviewed at whole-instrument size; metadata
checks alone must never be described as construction or visual approval.

## Delivery and bolt-on rear correction (v5, 2026-10-20, historical)

The user's screenshots exposed a delivery failure missed by the earlier HTTP-only QA: front source images were not represented correctly and the four bindrune image links were broken in the user's environment. The exact external viewer/path failure was not reproduced locally; the images are intact in the repository and earlier CI artifact. Do not claim the user's renderer was fixed merely because the old HTTP check passed.

- `tools/build_configurator_standalone.py` now builds a movable, single HTML with byte-identical front PNGs, bindrune SVGs/original sheet, rear sources, material texture and local code embedded. The user opens this HTML directly; no local server or sibling image folder is required. Existing CDN dependencies still require internet.
- The ZIP root contains `RavenForge-Configurator-Test.html` and `START-HERE.txt`. Development copies are under `source/`. CI opens the exact standalone file with `file://`, checks embedded image SHA-256 against originals, asserts zero sibling-file requests, and exercises all 24 model/language/viewport and 24 price/PDF combinations. A separate HTTP failure check blocks source images and requires an explicit load error instead of a broken composite.
- All models are **bolt-on** per the user's correction. Rejected neck-through-looking generated EMBLA/ASKR candidates are not included.
- ASKR/EMBLA rear outlines, heel strokes, five bolt centres, tuner outlines, control-cover and battery positions come from the newly supplied ASKR #001 / EMBLA #002 PDFs. Only rear display geometry is extracted; ghosted front strings, pickups, bridge and knob circles are omitted. Neck laminates are clipped to the neck and end at the heel. Their widths/material textures are illustrative. The source front-view sample composites remain intact; these new prototype drawings are not claimed to validate those older front samples.
- EDDA has an explicitly labelled AI bolt-on rear concept. Its five ferrules, heel and cavity are a display proposal, not verified EDDA construction coordinates. The original concept was corrected to show a detachable neck seam before use.
- GRAMR retains its separate drawing-based rear; the historical four-bolt plate is still excluded in favour of the current platform's five-bolt/no-plate requirement, whose exact rear layout remains pending.
- Rear body wood/finish respond independently of front top selection; natural rear oil stays natural. Exact rear manufacturer-part shapes remain unverified. Production options, pricing, dependencies and PDF logic are unchanged.

Provenance and exact generation prompts: `assets/configurator-rear/README.md`. PDF revision guards and extraction indices: `tools/extract_bass_rear_geometry.py`, `assets/configurator-bass-rear-geometry.js`. This section supersedes earlier rear-unavailable and server-required notes.

## Full front/back and inlay review (2026-10-19, latest user request)

- Removed body/fretboard/head zoom controls. Front/back buttons always show the complete instrument with an unchanged aspect ratio. Legacy crop names in the renderer fall back to the full front view.
- On narrow screens the preview scrolls with the page so it cannot cover options or inlay examples. Desktop keeps the side-by-side sticky preview. Browser QA hit-tests the first and last bindrune cards to catch covering layers.
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
