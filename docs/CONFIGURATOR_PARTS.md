# v9 display parts — 2026-10-20 KST

Scope: isolated `configurator-preview.html`, continuing the accepted v8 outlines.
Production options, prices, restrictions and PDF source are unchanged. These are
independently drawn SVG examples, not manufacturer CAD, machining templates or
approved finished instruments. No vendor image pixels or logos are copied.

## Connected selections

| Selection | Display | Limit |
| --- | --- | --- |
| Body 1 / 2 / 3 pieces | Rear joins; exposed GRAMR front joins | Widths illustrative. Bass `none` top is a matching core-wood top, so it hides front tone-block joins. Opaque covers joins. No internal chambers drawn. |
| Neck pieces | 1 / 3 / 5 / 7 / 9 / 13 rear stripes where offered | Neck-only clipping, ends at bolt-on boundary. Widths/order illustrative; custom laminations remain pending. |
| Wood finger ramp | Raised, matching top surface between pickups | Proposed envelope, no machining dimensions. Removed for none/three pickups. |
| Fretboard extension / third pickup | Renderer supports a proposed envelope | Production currently defers these options; this change does not unlock them. |
| Pickguard | None / black / ivory / matching wood | Test-only visual control, excluded from quote and PDF. GRAMR original drawing outline; bass original proposed outlines. No new drill coordinates. |
| Pickups | MM/triple pole family, soapbar, square-pole SBC, bar/sealed covers | Default sample retained. Allowed alternate families redrawn in existing reference envelopes. Custom housings stay pending/reference-retained. |
| Bridges | Block/barrel/mass/cam/roller/single-saddle families | Generic family details in the existing bridge envelope; final manufacturer geometry not certified. ETS/Payson and GRAMR use existing reference/drawing. |
| Tuners | Compact/Y/clover/locking families and Xtender lever | Front/back existing reference arrangement. Source front tuner counts may differ from sales specs; no new holes inferred. Custom guitar tuners pending. |
| Coil switches | 1 / 2 toggle examples replacing existing control positions | None/EDDA/EMG/Fishman suppresses them. No extra control holes. |
| Kill switch | Recessed button at an existing control position | Proposed allocation, not confirmed machining. Removes on deselection. |
| Dual tone | Push-pull indicator on an existing knob | Passive-only; capacitor itself is internal. |
| Buffer | Scope text only | Internal circuit, no invented external box/switch. |

ASKR bridge finish is independent of the hardware-colour selector, including
Nova black anodized aluminium. Other hardware follows the selection. Parts with
similar external families may appear similar; internal construction is not drawn.

## Shape-family reference checks

Current repository options and supplied model drawings are the controlling source
for fit/envelopes. The following official pages were consulted on 2026-10-20 KST
for family recognition only; no dimensions are used as approved mounting points:

- Delano SBC 5 TF: https://www.delano.de/sbc_5_tf/sbc_5_tf_details.html
- Delano Xtender housing family (deferred option): https://www.delano.de/xtender_4_he_s/xtender_4_he_s_details.html
- Gotoh GB707: https://g-gotoh.com/product/gb707/?lang=en
- Gotoh GB350: https://g-gotoh.com/product/gb350/?lang=en
- Gotoh GB528: https://g-gotoh.com/product/gb528/?lang=en
- Hipshot B-style barrel saddles: https://hipshotproducts.com/products/4-string-b-style-bass-bridge
- Hipshot family catalog: https://docs.hipshotproducts.com/Bass_Bridges.htm
- Babicz individual cam-saddle family: https://www.fullcontacthardware.com/fch-1-solorail-individual-bass-saddle
- Häussel family catalog: https://haeussel.com/fileadmin/pdf/Katalog2014_en.pdf

## Colour correction

All selected wood textures now use a common sRGB luminance-to-dye mapping.
Neutralizing the source chroma before applying RGB channel tables prevents a
source wood's blue/green tint from competing with selected red. Body, matching
head, stained rear wings, matching ramps/wood knobs/guard use this mapping.
Natural-oil rear and the fretboard keep their own natural material colour.
Source relief stays neutral; no spatial blur is applied to RGB image content.

## Checks

- Source-parity contract: prices, model restrictions, handlers and PDF unchanged.
- 545 allowed substitutions × 3 languages × front/back, plus focused pieces,
  switch allocation, read-only extras and ramp exclusion checks.
- Browser test: all 27 wood cells × red/blue dye, plus actual red front/back pixels,
  part/guard/ramp/switch interactions, reset, neck/body counts in 24 UI combinations.
- Actual browser/PDF results are recorded on PR #35 after the current CI run.
