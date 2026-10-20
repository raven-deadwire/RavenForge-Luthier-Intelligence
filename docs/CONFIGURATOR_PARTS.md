## v19 correction — restore EDDA guard; remove unrequested plate

The v18 EDDA control plate was an incorrect interpretation and is withdrawn.
Restore the exact v17 pickguard path from `a651060`; no trimming or reshaping.
Remove the plate renderer, geometry and mounts. Existing front sample places the
controls outside the pickguard, so relocate all 3/4/5/6-pot and custom fallback
banks to that control area with complete knob/shadow discs clear of the guard.
Keep the prior rear-based body registration, bridge work and rear tuner cleanup.
No production, pricing, option restrictions or PDF calculation changes.
The v18 plate-dependent checks below are superseded by body containment, original
guard identity and guard/knob clearance checks. All positions remain visual proposals.

---

## v18 — bridge evidence and EDDA registration (2026-10-20 KST)

Supersedes the historical Schaller 3D / ETS coverage rows below.

| Part | Primary evidence | Render and approval boundary |
|---|---|---|
| Schaller 3D-4, 1213 | [official drawing](https://schaller.info/media/b6/cb/4e/1707212100/1213.pdf), October 2015 | 79.7 × 57.4 mm plan, nominal 19 mm string spacing, three mounting holes, transverse brass rollers, narrow saddle arms. Separate from BM/M4 tuners. |
| Schaller 3D-5, 1214 | [official drawing](https://schaller.info/media/92/28/b2/1707212127/1214.pdf), October 2015 | 86.3 × 57 mm plan, drawing nominal 16.6 mm spacing. Instrument positioning, height/radius and drilling remain unapproved. |
| ETS Custom, EDDA / EMBLA | [manufacturer gallery](https://www.ets-hardware.com/index.php/en/produkte-2), headed Tuning Fork rounded-small photo | Open fork channels, teardrop reliefs, individual saddles and rear rail. Catalog photo reference only; widths/spacing are visual estimates. No evidence identifies the ordered Custom variant. Do not substitute headless MK-III. |
| ETS / Nova Custom, ASKR | Existing prototype PDF | Keep source contour and pending status: headed parallel Tuning Fork cannot establish a custom fanned bridge. |

Schaller 3D-4 is covered as a four-string reference, but the EDDA production option
contract does not permit Schaller. This change does not expand allowed options.
Schaller 3D-5 is used for allowed five-string selections. Neither drawing is a
RavenForge installation approval. No manufacturer photographs/logos/PDFs are distributed.

EDDA front body uses the mirror of the existing rear-concept body path in
`configurator-rear-renderer.js`: x = 539 + (525 − rearX) × 0.712,
y = 198 + (rearY − 275) × 0.712. This registers the nut axis and body outline
without claiming that the AI rear concept is a fabrication drawing. Original
front sample remains available for comparison. The board/pickup anchors remain
front-reference placements; contour, pickup and controls are visual proposals.

The guard's control-side scallop now ends left of the separate metal plate.
The plate and 3/4/5/6-pot banks are separate layers. Selected EDDA rear tuners use a clean head surface so the original baked housings cannot show through. Custom-wiring fallback uses
the same four-control region; its wiring is still pending. Knob discs (including
stacked knob/shadow allowance), kill switch and pickup envelopes are checked
against body/guard/plate boundaries. Selected referenced bridge strings now
terminate at their own saddle centres. Bridge is raised from the lower rim.
These are 2D visual checks, not cavity depth, hand clearance or fastener approval.

Validation: production calculation/PDF source equality, 565 allowed option
substitutions × KO/EN/DE × front/back pass locally. Native-SVG body/guard/plate
clearance checks and existing 24 viewport/language/model UI + 24 PDF matrix run
in CI; final outcomes are recorded separately in the PR. Local browser installation
was unavailable, so static render review is not presented as browser acceptance.

---

## v17 — tuner planes, ASKR nut transition and bridge relief

Front-mounted bushings/posts are now a separate layer above the headstock.
Keys and shafts are rendered beneath the wood; the rear view shows the gear
housing and (M4 90 Locking) knurled wheel. ASKR/EMBLA use the same PDF units/mm
on both sides and map actual front post centres through the two nut projections,
instead of placing replacement gears at source housing bounding-box centres.
GRAMR uses its source nut span / confirmed 43 mm nut width. Rear units mirror
the transverse shaft offset, so keys occupy corresponding positions in both
projections. M4 90 retains its perpendicular screw lug.

ASKR's extracted head contour ended at (180.1176, 191.8002), while the angled
nut ends at (180.295, 200.3). A display-only transition face joins this endpoint
to both original nut endpoints. It receives the same paint/wood/clip/shadow as
the head. The rear projection closes the same gap and uses a continuous
head/neck base without a false cast shadow across their boundary. The extracted
exterior, board and fret coordinates are unchanged.

New original SVG variants, based on primary references inspected 2026-10-19:

| Selection | Exterior reference | Scope |
| --- | --- | --- |
| Graph Tech PRB Ratio | PRB-5320, 3+2 Y button; sealed circular gear cover | Photo proportions; no drill fit approval |
| Schaller BM Schaller Style | 1025 clover, four-screw open gear, 22 mm bushing | Manufacturer drawing in mm |
| Schaller M4 90 Locking | M4 button, 90-degree lug, solid post, rear locking wheel | M4 drawing + locking-post diagram |
| Gotoh GB707 | 25 × 32.6 mm butterfly; offset worm shaft; 18 mm washer | Manufacturer drawing in mm |
| Payson | V4 fanned five-string continuous plate, recessed channels and separate saddles | Catalog exterior fitted to source string anchors; exact fit unconfirmed |

Payson retains ASKR's fixed satin aluminium preview finish, independent of the
tuner/knob colour. Unconfirmed ETS Custom and Nova parts retain the owned PDF
bridge outlines; dark recesses and small edge highlights replace same-colour
CAD strokes. The drawing does not approve a selected custom SKU. No manufacturer
photos, logos or PDFs are redistributed.

Primary references:
- https://graphtech.com/products/bass-ratio-5-string-3-2-y-style-button-please-select-finish-prb-5320
- https://schaller.info/en/bm-schaller-style/1025
- https://schaller.info/media/ed/c7/69/1764676097/1025.pdf
- https://schaller.info/en/m4-90/10540401.22.70
- https://schaller.info/media/b6/24/1e/1707210855/TZ_1054.pdf
- https://schaller.info/media/d2/b3/0c/1777013254/1054-76_M4%2090_4_2026.jpg
- https://g-gotoh.com/images/pdf/GB707-Dim.pdf
- https://www.paysonbass.com/store/p152/Payson-Fanned-Fret-Bass-Bridge.html

---

## v15 — PDF anchors and approval boundary

ASKR #001 and EMBLA #002 now use the supplied PDFs for front contours, 24 fret
lines, prototype pickup/bridge/tuner anchors and the original five-control bank.
Their rear body outlines, five bolt centres, covers and battery outlines retain
the existing PDF extraction. This verifies depiction of those **prototype
projections**, not selected replacement-part clearances, drill diameters, pocket
depths or a machining toolpath.

ASKR's source pickup envelope is EMG 45TW (117.5 × 38 mm). Replacement 40TWX,
Fluence and other supported covers scale from their own registered dimensions;
they must not inherit the 45TW width just because that prototype was drawn.
Selected tuner/bridge shapes remain manufacturer-reference illustrations. Their
fitted positions, non-five-pot EQ banks and extra switches are proposals.

GRAMR uses PDF path 5613 for its transverse rear neck/body boundary. The supplied
historical four-bolt plate does not approve the current five-bolt, no-plate,
2-2-1 platform. The relocated hatched joint is explicitly schematic. ASKR/EMBLA
pocket machining geometry and GRAMR's final heel/holes remain unapproved.

See [audit](CONFIGURATOR_DRAWING_AUDIT.md) for reproducible source provenance.

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

## v13 — complete control layouts and continuous surfaces

Each bass has separate 3/4/5/6-pot arrangements. Volume/blend occupy the upper
control area; EQ/filter controls form a lower group. Switching topology relocates
the entire arrangement. Added coil/kill switches keep separate positions; GRAMR
keeps its two-pot/blade drawing. Custom wiring still retains the source layout.

The body wood/paint is rendered continuously with a common light field and contour
edge shading. It no longer multiplies a hardware-bearing raster then punches out
individual knob holes. This prevents bright/dark circles at former knob centres,
for both natural/transparent and opaque finishes. The original source image is
available in Sample render. This is a display surface, not a new production asset.

Pickup cover faces use neutral black ABS, a rounded shoulder, a visible side wall,
subtle crown highlights and fine grain. Times Square's two pole rows, Delano's
three mounting holes / E side recesses, Fluence's groove and M6's exposed slug
bobbins follow the manufacturer photographs. Cover projection uses the original
model envelope, so EMBLA does not receive an oversized flat top-down soapbar.
No manufacturer photos or logos are shipped. Unknown custom pickups still retain
the original part and pending status.

Photos rechecked 2026-10-20:
- https://www.delano.de/sbc_5_he_s_4/files/stacks-image-86dd0f9.png
- https://www.delano.de/sbc_5_he_s_4_e/files/stacks-image-54bf15c.png
- https://www.delano.de/sbc_5_tf/files/stacks-image-ddb31a5.png
- https://fishman.com/wp-content/uploads/2025/04/Fluence-5-string-soapbar-bass-pickup-hero.jpg
- https://shop.lundgrenpickups.com/products/m6
- EMG 40TWX outline: https://www.emgpickups.com/pub/media/Mageants/4/0/40twx_0230-0192re.pdf

---

# v12 pickup surfaces and electronics controls — 2026-10-20 KST

The following v12 changes supersede the historical v11 knob-retention rule.
Coil/kill switches cannot consume a knob. Changing electronics can intentionally
change knob quantity, stacking and arrangement. These are installation examples,
not approved drilling coordinates or a wiring harness specification.

## Electronics display mapping

| Selected option | EQ architecture | Knob example |
| --- | --- | --- |
| Passive bass | Passive | Volume, blend, tone (3) |
| Fishman Fluence | Bass / treble | Volume, blend, bass, treble (4) |
| ZUTA Bass Core / Glockenklang / LHZ-05 | 3 bands | Volume, blend, bass, mid, treble (5) |
| Darkglass Tone Capsule | Bass / mid / high-mid | Volume, blend plus 3 EQ controls (5); no invented treble band |
| Noll TCM 4 XM | Bass / low-mid / high-mid / treble | Volume, blend plus 4 separate EQ controls (6); single-pot variant example |
| East UNI-PRE 5 | 3 bands with mid sweep | Volume, blend, bass/treble stack, mid/frequency stack, passive tone (5) |
| Lusithand Double NFP MKII | Dual filter | Volume, blend, neck filter, bridge filter (4) |
| Underhill Cali Dub | Dual filter + bass EQ | Volume, blend, 3 filter/EQ stacks (5) |
| ACG EQ-01 | Dual filter + high-pass | 4K example: volume/blend and 3 filter stacks (4); variant not finalized |
| GRAMR passive / planned ZUTA Core | Guitar control contract | Original 2 pots and blade opening retained |
| Nova custom / custom control layout | Unconfirmed | Original knobs retained; pending status |

Bass volume/blend integration and single-versus-stacked variants are explicitly
proposals unless the named version fixes them. Internal DIP switches and trimmers
are not invented as exterior controls. GRAMR kill position is now [796,210] in
front PDF space: upright view, right of pickguard centre and slightly above.
Its original two pot centres and blade selector remain intact.

Primary references (accessed 2026-10-20):
- https://fishman.com/dp/fluence-bass-2-band-eq/
- https://zutagroup.com/products/zuta-bass-core
- https://glockenklang.de/en/electronics/
- https://www.glockenklang.de/pdf/de/GLOnboardVolJason9-18V.pdf
- https://www.noll-electronic.de/bass-electronics/tcm-4-xm/
- https://www.darkglass.com/products/tone-capsule
- https://lhzpreampshop.com/products/lhz-05
- https://www.east-uk.com/wp-content/uploads/2020/06/UNI-PRE-01-5-KNOB-01-1.pdf
- https://lusithanddevices.com/product/double-nfp/
- https://www.underhillbass.com/product-page/cali-dub-dual-filter-and-bass-eq
- https://acguitars.co.uk/electronics/

## Pickup surface changes

Original SVG artwork follows the reference photos linked in the v11 registry:
matte micrograin, differentiated shoulder bevels, side walls, open side mounting
recesses, counterbored SBC holes, paired Times Square rectangular poles, Fluence's
asymmetric groove, and M6 capsule bobbins with two rows of round slugs and small
secondary holes. No manufacturer photos or logos are distributed. Correct
reference aspect ratios are preserved. Unsupported custom covers retain the
owned sample/drawing and remain explicitly pending.

## Verification

Unit coverage includes each topology, stack count and switch clearance; band
changes do not mutate quote state. Browser QA checks live EQ swaps, head/neck
selection, both burst sides, localized quote rows, desktop left/right order and
mobile overflow. Exact CI results are recorded in PR #35 after the run completes.

---

## Historical v11 implementation notes

# v11 selected parts and neck materials — 2026-10-20 KST

Isolated `configurator-preview.html`; production, option normalization, prices and
PDF source are unchanged. The test navigation omits finger ramps at the owner's
request. Their old data remains in the production contract; stale ramp selections
cannot render a ramp. Reintroducing them is future work requiring a mounting plan.

## Corrections

- Restore optional EDDA pickguard using the asymmetric contour visible in the
  owned `Edda Prototype Design.png` (neck pocket, treble horn, control scallop).
  Default none; black/ivory/matching wood are display-only, excluded from quote.
  Source SHA256: c1491926555ffa9b902a4dca9a2804bdd9a18823a5ecf859fafa557d59a5ffb2.
  This is a sample trace, not a CNC template. GRAMR retains its PDF contour.
  EMBLA/ASKR have no registered guard contour; this does not imply they cannot
  be built with a guard.
- Replace v10's blanket manufacturer fallback with explicit reference coverage.
  Parts use original SVG geometry informed by the manufacturer sources below.
  No manufacturer image or logo is redistributed. A product name alone never
  enables an unverified family symbol.
- Apply each neck piece's actual specified species texture. 9/13-piece walnut
  and bloodwood alternatives can be compared using test-only buttons; the choice
  does not enter the quote. 13-piece also uses a separate bubinga texture.
- Repack full EQ layouts and independent coil/kill rows in the current front
  coordinate system. Added controls never replace knobs. Positions remain
  proposals; v16 removes dashed halos. Dual tone marks a push-pull knob, while
  an internal buffer has no external part. Quote control-position terms remain.

## Registered product coverage

| Category | Product option | Visual evidence / representation |
| --- | --- | --- |
| Pickup | Nova Omnia B4 MM | 89 × 48.8 cover, three ears, four split rails |
| Pickup | Häussel MM Triplebucker 4-string | Catalog p15: 89 × 48 cover, three ears, 8 large + 8 small central poles |
| Pickup · catalog reference | EDDA Nova Custom | Standard MM exterior shown; custom cover pending |
| Pickup · catalog reference | EMBLA Häussel BassBar Custom | Catalog p18 BB5 101 × 36 exterior shown; ordered custom 100 × 36 cover pending |
| Pickup | Delano SBC 5 HE/S-4 | Smooth soapbar; two left holes and one right hole |
| Pickup | Delano SBC 5 TF Times Square | 108 × 32 outline, two rows of five separate rectangular poles |
| Pickup | Delano SBC 5 HE/S-4 E | Smooth E cover, centred side mounting recesses |
| Pickup | Fishman Fluence 5-string | Contoured recessed line and side recesses |
| Pickup | EMG 40TWX | Plain rounded cover and side recesses; no Fluence line |
| Pickup | Lundgren M6 | Two rounded open bobbins, two rows of round slugs; no invented screw row |
| Bridge | Gotoh 404BO 4/5 | Product plate, saddle/slot pattern and correct string count |
| Bridge | Hipshot A / B | Separate A channels versus B open well; saddles and springs |
| Bridge | Hipshot MassKicker 5 | High-mass plate, guided saddles, brass inserts and springs |
| Bridge | Babicz FCH top-mount 4/5 | Broad plate, eCAM saddle housings and adjustment points |
| Bridge | Gotoh 510T-FE1 | Two-point plate notches, six bent saddles, arm socket and arm |
| Tuner | Gotoh GB707 / GB350 | Shared butterfly silhouette, different 18/20 mm washers |
| Tuner | Gotoh GB528 | Clover button and open gear back |
| Tuner | Hipshot Ultralite 3/8 Y | Narrow Y button and open rear gear |
| Tuner | Schaller BM Light | Broad key, offset housing, exposed gear and two screws |
| Tuner | Gotoh SG381-07 | 07 button and closed housing reference |

Part contours/details are reference-based; **instrument fit and positions are
illustrative**, not drilling/routing approval. Ratios are retained for pickups,
including Times Square's different envelope: no claim it drops into SBC routing.
Front bass tuner positions are sample fits with the configured string count;
rear ASKR/EMBLA placements use PDF housing centres as display anchors, not drilling
coordinates. GRAMR uses the existing PDF centres.

Not covered yet: EMBLA/ASKR Nova custom pickup covers, unspecified Others and
custom HH; ETS custom, Payson/Nova exact bridge variants, Schaller 3D;
Hipshot Xtender, unspecified Graph Tech PRB button variant, Schaller BM and M4
locking variant. These retain source geometry and remain explicitly pending in
all three languages. Custom covers and variant selection need usable drawings.
All active pickup cards use the same original SVG art as the instrument or show
a missing-reference notice. Catalog references remain pending for the custom fit.
Häussel reference: https://www.haeussel.com/fileadmin/pdf/Katalog2014_en.pdf (pp15,18).
Third-pickup layout is still deferred by the existing production restrictions.

ASKR bridge colours remain fixed (Payson reference finish, Nova black anodized)
regardless of hardware colour, including unsupported-shape fallback. Pickup poles
do not inherit hardware colour. Finger ramps are omitted in every render.

## Neck material mapping

| Neck | Species shown |
| --- | --- |
| 1 / 3-piece | Maple |
| Bass 5-piece | Ash / wenge / maple / wenge / ash |
| Bass 7-piece | Ash / purpleheart / maple / wenge / maple / purpleheart / ash |
| Bass 9-piece | Ash / accent / purpleheart / maple / wenge / mirrored outer four |
| Bass 13-piece | Ash / accent / purpleheart / maple / bubinga / wenge / maple / mirrored outer six |
| GRAMR 5-piece | Maple / wenge / purpleheart / wenge / maple |

Bass specs confirm species but not exact order/width; the symmetric sequences and
widths are explicitly illustrative. GRAMR 5-piece order follows its stated spec.
Each strip is clipped to the detachable neck, never extended through the body.
Grain uses shared atlas images and consistent physical texture space, not flat
colour bands or a stretched image per thin strip. Bloodwood/bubinga are original
AI grain examples, not inventory photos. Red dye remains luminance-neutralized
in sRGB. RGB content is never blurred; only the replacement alpha mask feathers.

## Primary references

- https://g-gotoh.com/images/pdf/GB707-Dim.pdf
- https://g-gotoh.com/images/pdf/GB350-Dim.pdf
- https://g-gotoh.com/images/pdf/GB528-Dim.pdf
- https://g-gotoh.com/images/pdf/404BO-4-Dim.pdf (contains 4 and 5-string plates)
- https://g-gotoh.com/images/pdf/510T-FE1-Dim.pdf
- https://g-gotoh.com/images/pdf/SG381-Dim.pdf
- https://g-gotoh.com/images/pdf/SG-Buttons-Dim2026.pdf (07 button)
- https://docs.hipshotproducts.com/20650_ULTRALITE_3-8_Y_KEY.pdf
- https://docs.hipshotproducts.com/5A500-708_5_STG_A_STYLE_BASS_BRIDGE_708_SPACING_DIMENSIONS.pdf
- https://docs.hipshotproducts.com/5B500-708_5_STG_B_STYLE_BASS_BRIDGE_708_SPACING_DIMENSIONS.pdf
- https://hipshotproducts.com/products/5-string-masskicker-bass-bridge
- https://www.fullcontacthardware.com/fch-4-string-bass-bridge
- https://www.fullcontacthardware.com/fch-5-string-bass-bridge
- https://schaller.info/media/pdf/65/6a/31/TZ_1027.pdf
- https://www.delano.de/sbc_5_he_s_4/sbc_5_he_s_4_details.html
- https://www.delano.de/downloads/sbc5_tf.pdf
- https://www.delano.de/sbc_5_he_s_4_e/sbc_5_he_s_4_e_details.html
- https://fishman.com/dp/fluence-bass-soapbar-5-string-pickups/
- https://stage.emgpickups.com/40twx.html (manufacturer's public product mirror)
- https://shop.lundgrenpickups.com/products/m6

## Validation

Local contracts and 545 allowed substitutions × KO/EN/DE × front/back pass.
Tests cover reference registry vs pending status, selected product differences,
EDDA guard restoration, texture species per laminate, both accent alternatives,
read-only quote input, ramp exclusion even with stale input, source knob retention,
ASKR fixed bridge colours and bindrunes. Native whole-instrument SVG renders are
inspected. Browser UI/PDF results for the exact published SHA are recorded on PR 35;
a preceding commit's results are not current-commit validation.


### v20 correction — 2026-10-20

- EDDA pickguard materials are acrylic, aluminium and matching wood; generic single-/three-ply plastic choices have been removed. Acrylic edge, brushed aluminium and wood grain are illustrative surface treatments, not manufacturing specifications. Original v17 guard contour and v19 control clearance are retained; there is no control plate.
- The selected preview colour now covers both body faces, including when the quote still selects natural oil. No selected colour keeps natural body wood. Neck finish remains independent. A visible warning flags oil/colour specification conflicts; the preview does not change quote prices or finish categories.
- Opaque EDDA rear paint conceals source wood grain. Rear concept shape, bolt centres and installation positions remain unverified; ASKR/EMBLA drawing provenance is unchanged.

- EDDA head: the user-supplied rear reference (20 October, 12:26:36 image) is the shape authority. A curved trace is mirrored and uniformly scaled by 0.62 about rear nut (525,290) to front nut (539,198). The previous angular front contour is removed; no anisotropic distortion is used. Both faces share the same traced head. Tuner post locations are visual reference placements, not approved drilling coordinates.


### v21 — EDDA machine-head orientation correction
The v20 rear machines were vertically mirrored and tilted the wrong way. EDDA rear housings now retain their local vertical orientation, with shafts above the gear centres and a -10 degree shaft angle, as in the supplied rear reference. Only the front's rear-mounted key plane is reflected vertically to match that projection. Head contours and post centres are unchanged. Other models retain their existing transforms.
