# v10 source parts and additive controls — 2026-10-20 KST

Scope: isolated `configurator-preview.html`. Production options, prices,
restrictions and PDF source are unchanged.

## Corrected regressions

The v9 family renderer stretched generic silhouettes into sample envelopes.
It did not reproduce actual products: block/roller/cam bridges, Y/clover tuner
keys and pickup poles were insufficiently grounded. The replacement masks and
symbols have been removed, including rear tuner-housing guesses. No vendor
pixels/logos were copied. The original source parts are restored.

**Manufacturer-specific geometry is not implemented in v10.** Every selected
pickup, bridge and tuner is explicitly marked as not rendered. Product names
remain in the options and quote. Source tuner/saddle counts may differ from the
sales specification. A source envelope is not a verified selected product.

The three fabricated bass pickguard contours are also removed. Only GRAMR has a
source drawing contour; EDDA/EMBLA/ASKR expose no active guard controls and cannot
render a guard even if a stale display selection is passed in.

The v9 switch planner changed source knob slots to switch slots. v10 retains all
knob positions and render content, then adds independent coil/kill switch symbols
at stable, non-overlapping preview positions. Dashed outlines identify these
positions as unconfirmed. Removing an extra removes only its symbol. Dual tone
marks an existing push-pull knob; an internal buffer creates no exterior control.

The existing quote's `using an existing control position` wording is preserved.
The additive visual proposal does not establish an agreed fabrication layout or
price for new drilling. This distinction is shown in KO/EN/DE scope text.

## Connected selections

| Selection | Display | Limit |
| --- | --- | --- |
| Body / neck pieces | Existing joins and rear laminations | Illustrative widths, opaque/top conceal joins |
| Pickguard | GRAMR source contour only | No invented bass guard; excluded from quote |
| Wood ramp | v9 matching wood ramp retained | Preview placement proposal |
| Pickups / bridge / tuners | Original source pixels or drawing envelopes | Selected product shape not rendered, front and back |
| Third pickup | Pending, two reference pickups retained | Deferred option remains unavailable in production |
| Coil switch | One/two additional dashed switch symbols | None/EDDA/GRAMR/EMG/Fishman suppress these; unconfirmed positions |
| Kill switch | Separate dashed pushbutton | Original knobs retained; unconfirmed position |
| Dual tone | Indicator on original push-pull knob | Passive-only; knob remains a knob |
| Buffer | Scope text | Internal, no exterior part |

ASKR bridge colour stays independent of hardware colour; Nova uses fixed black
anodized finish on the **retained reference shape**, not a claimed Nova model.
GRAMR pickup poles no longer inherit bridge/tuner hardware colour.

## Evidence threshold for future part replacements

Require the exact product/variant, a usable image or measured geometry, the
correct viewing angle and a confirmed instrument envelope/placement. Keep the
source part if these are absent. Product-family recognition is insufficient.

Primary references checked (research only, not copied assets):
- Gotoh GB707: https://g-gotoh.com/product/gb707/?lang=en
- Gotoh GB707 dimensions: https://g-gotoh.com/images/pdf/GB707-Dim.pdf
- Gotoh 404BO-5: https://g-gotoh.com/product/404bo-5/?lang=en
- Delano Times Square SBC 5 TF: https://www.delano.de/sbc_5_tf/sbc_5_tf_details.html
- Delano drawing: https://www.delano.de/downloads/sbc5_tf.pdf

The public Delano sheet states 108 × 32 mm; the repository's SBC routing envelope
must not be silently treated as an identical fit. The public data alone does not
justify fitting or stretching it into the existing render.

## Colour correction

All selected wood textures now use a common sRGB luminance-to-dye mapping.
Neutralizing the source chroma before applying RGB channel tables prevents a
source wood's blue/green tint from competing with selected red. Body, matching
head, stained rear wings, matching ramps/wood knobs/guard use this mapping.
Natural-oil rear and the fretboard keep their own natural material colour.
Source relief stays neutral; no spatial blur is applied to RGB image content.

## Checks

- Production source parity and 545 allowed substitutions × 3 languages × front/back.
- Every original knob coordinate survives each coil/kill/dual-tone combination.
- Additional symbols have independent, stable, non-overlapping preview coordinates.
- No unverified family geometry or source-clearing part underlays remain.
- Browser checks compare the complete knob rendering before/after adding/removing
  switches in all 24 model/language/viewport combinations.
- Current browser and PDF results are recorded on PR #35; previous PASS results
  do not establish v10 success.
