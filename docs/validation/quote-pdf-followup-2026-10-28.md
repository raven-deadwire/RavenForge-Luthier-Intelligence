# Quote PDF follow-up audit — 2026-10-28 KST

## Decision and scope

The deployed quotation PDF is suitable for the tested default and representative
option configurations. It is **not a manufacturing template or dimensional
approval**. No paper copy was printed or measured in this audit.

Baseline: `2ffd8a1e8466f93c395592db5daaedb9efe41497` (main, PR #67).
PR #65 merged at 04:23:14 KST; #66 already corrected long hyphenated instruction
overflow and qualified EDDA's scale; #67 retained only EDDA's scale note and
made fretless nut selection independent. Those changes were not duplicated.
PR #68's tax/shipping label change is a separate open change, excluded here.

`check_pages_freshness.py` independently compared all **51** tracked quote files
(index/ko/de, configurator, configurator assets): the deployed files equal this
main baseline. A fresh connected Chrome visit also loaded the real homepage
iframe, the four model choices, and the default EDDA EUR 2100 quotation. Its
PDF-download event timed out; that attempt is **not** counted as a successful
export or an application defect.

## Evidence independently inspected

| Evidence | Commit / run | Result |
|---|---|---|
| Deployed homepage Chromium 131.0.6778.33 | [40618411869](https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence/actions/runs/40618411869), main `2ffd8a1` | 61 assertions; 24 real downloaded A4 PDFs / 24 pages |
| #67 candidate boundary matrix | [40616464213](https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence/actions/runs/40616464213), `2d2b517` | 48 real downloaded A4 PDFs / 81 pages |
| Local code-only contracts and preview tests | main baseline | PASS; 577 option substitutions × 3 languages × both views, independent fret-spacing checks |
| New dense-option regression | this PR | Added and syntax/module-load checked; GitHub jobs queued at audit cutoff. No browser PASS claimed. |

The #67 candidate and current main have identical configurator, geometry,
renderer and tests; their differences are generated homepage/sitemap metadata.
Artifacts were actually downloaded, unpacked, rasterized/OCR-checked again, and
representative page images reviewed. This is stronger than relying on PR prose,
but does not mean this session directly generated the CI PDFs.

- Live artifact `12785973153`, SHA-256
  `976c5b449aa566d394f9be84e172496d34ae9bddbe2950bb79ff8762a19488f2`.
- #67 candidate artifact `12785512253`, SHA-256
  `74daa7209d223a646d709f47f33a28300cdbeb79ce5c3f8c606497c36f2d1170`.
- The 8 live and 27 boundary page groups are pixel-identical between EN/KO/DE:
  35 groups / 105 pages. Labels/specifications are English; user-written notes
  remain verbatim in their original language, not automatically translated.
- Both views, exact totals, 1–2 page limit, visible-text bounds and preserved
  1,000-character notes passed in the existing boundary matrix. Independent
  OCR validates model/total, not every glyph; DOM/source parity checks every
  expected field. Representative visual inspection is not exhaustive OCR.

## Calibration and original drawings

All three original PDFs were retrieved and their bytes matched the provenance
hashes recorded by the repository. They contain revision-specific prototype
specifications and machining hold points. Old pickups, woods and GRAMR's old
four-bolt specification must not override the current sales configuration.
Only source geometry is compared here; original private PDFs are not added to
this repository.

| Model | Original reference | SHA-256 |
|---|---|---|
| EMBLA | `RavenForge_EMBLA_002_LYW_34_5ST-Model.pdf` | `b5953882c1c5018d5eede0fa73f8e16dfd113e772de44f0629dd7614e82aaef5` |
| ASKR | `RavenForge_ASKR_MS5001_john0-Model(1).pdf` | `94962ee6ea46a1d87c35910537aea98d13adfd9a2ea47c372ae1cbc9b89b6fc5` |
| GRAMR | `RavenForge_Superstrat_24F_ver3_STRICT_R12-Model(1).pdf` | `3edaab849e644ba2c1aa2e28abdbed9c92a246cb7a3ca5591da152d22c609b1d` |

| Model | Front / rear units per mm | Nominal string length | Independent geometry result |
|---|---:|---:|---|
| EDDA | 0.923 / 1.296348315 | 863.6 mm (34 in) | Approximately 797 front image units. Photo/concept reference, no approved full dimensional reference. |
| EMBLA | 0.8236 / 0.8236 | 863.6 mm | 1st-to-12th fret spacing implies 863.885 mm; original outline length converts to 1100.103 mm versus 1100.1 mm reference. |
| ASKR | 0.946 / 0.946 | 939.8 / 863.6 mm | Fret-edge intervals imply 937.598 / 861.560 mm. Original outline converts to 1167.304 mm versus the labelled 1170.00 mm reference. |
| GRAMR | 1.0675 / 1.0675 | 647.7 mm (25.5 in; source rounds to 648) | 1st-to-12th fret spacing implies 647.780 mm. |

Fret endpoints on the board edges are a consistency check, not independently
measured string witness points. ASKR's roughly 0.23–0.25% difference is not proof
that changing its scalar is correct: one needs agreed reference landmarks,
source dimension association, and geometric tolerances. No scalar was changed.

The table below measures the original body paths using endpoints **and exact
cubic Bézier extrema**, transformed by the source rotation, display factor 0.5
and model units/mm. Raw PDF drawing rectangles include Bézier control points
and overestimate some bounds; they must not be used as physical extents.

| Model | Front body length × width, mm | Rear body length × width, mm | Interpretation |
|---|---:|---:|---|
| EMBLA | 494.439 × 333.441 | 494.439 × 333.459 | Matches source 494.4 / 333.4 references within about 0.06 mm; old 325 mm reference is explicitly stale in source. |
| ASKR | 542.093 × 304.345 | 542.075 × 304.329 | Both views agree within 0.019 mm; source labels 543.45 × 304.5 and non-associative reference dimensions. |
| GRAMR | 458.854 × 319.335 | 458.854 × 319.335 | Matching source projection envelopes; does not validate the added five-bolt schematic or final routes. |

**EDDA is materially different.** Its rear image is an AI-assisted concept.
The body registration uses 0.712 while the head/tuner registration uses 0.62.
At the same indicated scale, the corresponding front head is
`0.62 / 0.712 = 0.8707865` of the rear head: **12.92% smaller**. Total image
heights differing by only about 0.98% do not prove local dimensional agreement.
The existing `approx.` captions and EDDA photo/concept note are necessary.

## Three ratios: native output versus arithmetic comparison

The application does not offer twelve model/scale combinations. It emits bass
one-page PDFs at 1:8, GRAMR one-page PDFs at 1:9, and all two-page PDFs at 1:5.
The unused combinations below are **calculated**, not claimed generated PDFs.
Numbers are front/rear cropped-image heights in mm, including selected parts
and rendered shading; they are not the instrument's approved overall length.

| Model | 1:5 (native 2 pages) | 1:8 | 1:9 | Front / rear height ratio |
|---|---:|---:|---:|---:|
| EDDA | 227.034 / 224.829 | 141.896 / 140.518 (native) | 126.130 / 124.905 (calculated) | 1.00981 |
| EMBLA | 225.318 / 222.179 | 140.824 / 138.862 (native) | 125.177 / 123.433 (calculated) | 1.01413 |
| ASKR | 238.037 / 235.414 | 148.773 / 147.134 (native) | 132.243 / 130.786 (calculated) | 1.01114 |
| GRAMR | 194.839 / 194.839 | 121.775 / 121.775 (calculated) | 108.244 / 108.244 (native) | 1.00000 |

Figures retain aspect ratio and use a common scalar per layout; differing
front/rear crop extents are not themselves a scaling error. Do not stretch one
view merely to make its outer height equal the other.

Nominal nut-to-saddle reference lengths to use for a later print check:

| Model | At 1:5, mm | At 1:8, mm | At 1:9, mm |
|---|---:|---:|---:|
| EDDA / EMBLA (34 in) | 172.720 | 107.950 | 95.956 |
| ASKR (37–34 in) | 187.960 / 172.720 | 117.475 / 107.950 | 104.422 / 95.956 |
| GRAMR (25.5 in) | 129.540 | 80.963 | 71.967 |

## Physical dimensions within actual digital PDFs

The downloaded PDFs have an A4 media box of **210.00157 × 297.00009 mm**.
The page content is one raster image, so individual instruments are not
separate PDF image objects. The embedded page image is 1438 pixels wide and
placed at 190.00155 mm. Relative to nominal 2× CSS rasterization this gives a
horizontal scale transfer of **0.998771**. Vertical transfer is
**0.998771–0.998978**, depending on page slicing. Thus nominal sizing contracts
by about **0.10–0.13%**, even before printer settings.

The following table maps browser-measured figure boxes through the actual PDF
image transformation. It is digital-file measurement, not paper measurement.
The final column independently measures dark raster ink rows (threshold <235,
allowing two-pixel gaps); it excludes faint crop/shadow pixels, so it is slightly
smaller and is not a substitute for a fixed landmark measurement.

| Model / layout | PDF front width × height, mm | PDF rear width × height, mm | Dark-ink front / rear heights, mm |
|---|---:|---:|---:|
| EDDA 1:8 | 47.422 × 141.721 | 43.698 × 140.342 | 141.378 / 140.189 |
| EDDA 1:5 | 75.879 × 226.801 | 69.917 × 224.549 | 225.988 / 224.355 |
| EMBLA 1:8 | 45.535 × 140.647 | 42.983 × 138.690 | 140.321 / 138.339 |
| EMBLA 1:5 | 72.857 × 225.087 | 68.773 × 221.902 | 224.534 / 221.448 |
| ASKR 1:8 | 41.303 × 148.587 | 39.222 × 146.952 | 148.381 / 146.795 |
| ASKR 1:5 | 66.081 × 237.791 | 62.757 × 235.124 | 237.485 / 234.793 |
| GRAMR 1:9 | 36.909 × 108.110 | 36.909 × 108.110 | 107.817 / 107.817 |
| GRAMR 1:5 | 66.436 × 194.638 | 66.436 × 194.597 | 194.006 / 193.965 |

## Specification, amount and pagination results

| Model | Default EUR | Paid abalone / return to included dot EUR | Empty / prose / multiline / hyphen pages |
|---|---:|---:|---:|
| EDDA | 2100 | 2210 / 2100 | 1 / 2 / 2 / 2 |
| EMBLA | 2550 | 2660 / 2550 | 1 / 2 / 2 / 2 |
| ASKR | 3200 | 3310 / 3200 | 1 / 2 / 2 / 2 |
| GRAMR | 2000 | 2110 / 2000 | 1 / 1 / 2 / 2 |

These page counts are the default-option boundary cases, not maximum-option
results. Notes use exactly 1,000 characters where non-empty. All three UI
languages agree. The already-fixed GRAMR dot price was checked for regression
only; no price logic changed.

- Current fretless basses permit appropriate non-zero-fret nut materials;
  **verawood is available for fretless, not mandatory** after #67. Guayacan is
  absent. Fretted zero-fret guides and GRAMR buffalo bone remain separate.
- S-Lock text derives from the selected hardware colour. Existing source
  contracts pass; the new matrix explicitly exercises gold/black/chrome with
  the leather strap and records the resulting PDF row.
- Request-priced items must retain a **priced items subtotal**; a numerical
  total is not a quote including unpriced extras. Existing live fixtures cover
  this distinction. Tax/shipping wording is being handled separately in #68.
- Existing long-hyphen clipping is fixed by #66 and was not reintroduced.
- Text in the second-page column can shrink without a readability floor.
  A 1,000-character cap alone does not prove readability for every line-break
  pattern; extreme blank-line inputs are a remaining stress case.

## Changes in this PR and remaining execution boundary

This PR extends test coverage, without changing model geometry or pricing:

1. Build deterministic dense configurations through actual UI controls, choosing
   the highest finite-priced currently available options and all compatible
   accessories/extras. This is not a mathematical maximum over mutually
   exclusive or request-priced combinations.
2. Test fretted configurations of all four models and fretless variants of the
   three basses. Verify a bone-to-verawood choice retains fretless state.
3. Exercise EN/KO/DE with 1,000-character multiline and unbroken-token notes:
   **42 actual PDF exports expected** when CI runs. Enforce the 1,001-to-1,000
   input boundary, independently sum a catalog ledger, retain every English
   specification row, check S-Lock colours, text/image bounds and 1–2 pages.
4. Run independent PDF raster/OCR inspection on those downloaded files.

The new GitHub QA jobs remained queued at this audit's cutoff. The initial run
was [40626085574](https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence/actions/runs/40626085574).
Local JS syntax and module loading pass; no execution result for the new matrix
is asserted. Keep the PR draft until those checks run and any actual failures
are triaged. No new application defect was established by the completed tests.

## Display and production-use recommendation

Preserve EDDA's existing **“approx. 1:5 / 1:8”** and photo/concept limitation.
For drawing-derived models, a more precise caption would be **“Preview scale
1:5 / 1:8 / 1:9”**, with a compact document-level **“Quotation illustration;
not a machining template. Final dimensions follow approved drawings.”**
This is a recommendation, not a reversal of #67's deliberate EDDA-only note.

If dimensional output becomes a product requirement, create a separate approved
vector drawing export with revision ID, datum/landmark definitions, dimensioned
witness points, tolerance, and a 50 mm calibration bar on each page. Keep render
textures, illustrative hardware placement and provisional five-bolt symbols
outside that approval. Print A4 at 100% with fit-to-page disabled and measure
both horizontal/vertical bars plus nut-to-saddle references. Photograph and
record printer/settings and ruler readings. That physical test, approved EDDA
orthographic geometry, and Firefox/Safari export remain **unverified**.
