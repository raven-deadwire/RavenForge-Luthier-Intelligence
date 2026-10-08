# Configurator browser and PDF regression — 2026-10-08

Base source: `cebf8b2c3244f996c20a6bd296def08254b0a18c` (latest main at start and final source check).
Public URL: https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence/configurator.html

## Public site and source identity

The public configurator HTML, platform script and localization script match main byte-for-byte:

| File | SHA-256 |
| --- | --- |
| configurator.html | cc6a92ed03898b5a285744c9389be19c88042a81230f2adaa6e85149c83e0246 |
| assets/configurator-platforms.js | 2017465252afee1a024b251f0ac2ec2d721e60836d362b5cb6a9dcd26d2f7c88 |
| assets/configurator-ui.js | 70c335e8d0369628d219b3cc5fb04064decdfe2b1489bf4ede8de54d6087df86 |

Actual public Chromium interactions cover Korean, English and German at 1440×1080 and 390×844 for EDDA, EMBLA, ASKR and GRAMR (24 combinations). Mobile results are Chromium viewport emulation, not physical Android/iOS device testing.

## Findings and minimal changes

1. **German PDF generation fails.** Reproduced on the public site in both the cloud browser and Chromium 131. EDDA reproduces the renderer exception: `IndexSizeError: Failed to execute setEnd on Range: offset 10 exceeds node length 9`. CSS uppercase expands `Bundgröße` from 9 characters to `BUNDGRÖSSE` (10), while html2canvas measures the original node. The patch materializes uppercase text nodes and disables CSS text transformation in the detached PDF copy only.
2. **A nearly blank trailing page is exported.** Actual raster inspection found EDDA/EMBLA PDFs whose second page contains only a light container border, with zero dark text pixels. Reduce PDF-only header/container padding from 16 to 12 px, row gap from 4 to 2 px, and remove the copied scroll section’s 24 px bottom margin. Longer specifications can still legitimately use multiple pages.

Customer selections, pricing and on-screen typography are not altered by these changes.

## Test commands

```sh
node tools/test_configurator_contracts.cjs
node tools/test_configurator.cjs
node tools/test_configurator.cjs --matrix-ui-only --url https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence/configurator.html
node tools/test_configurator.cjs --matrix
python tools/test_configurator_pdf_visual.py /path/to/matrix-output
```

Set `CONFIGURATOR_BROWSER_PATH` when using an existing browser and `CONFIGURATOR_QA_DIR` to retain evidence. This run uses Chromium 131.0.6778.204, real CDN dependencies and html2pdf 0.10.1. No selections, prices, renderer or downloads are mocked. The isolated command-line test browser uses `CONFIGURATOR_IGNORE_HTTPS_ERRORS=1` because its trust store lacks the environment’s proxy CA; this setting is recorded in each JSON report. The separate cloud-browser German reproduction uses its normal browser trust configuration.

The first Korean render was invalid because the test container lacked Korean fonts. Install Noto Sans CJK KR before the final run; initial tofu-glyph files are superseded, not counted as valid Korean PDF evidence.

## Evidence distinctions

- Browser tests operate real controls, select every current EDDA/EMBLA bridge, check the sole GRAMR buffalo-bone nut, ensure no EDDA coil control or summary/future item exists, verify a €200 premium upgrade, and reset changed selections/notes on model changes.
- PDF tests compare every summary row and the total with the actual renderer input, wait for real downloads and inspect PDF structure. The separate raster checker verifies all actual pages contain ink and OCR confirms model IDs and totals. Human page-image review checks Korean glyphs, clipping, page transitions and selected hardware/nut/gigbag information. Renderer-input equality alone is not described as full raster-text equality.
- Code-only tests extract production normalization functions and check stale EDDA coil values, GRAMR nut coercion, other models’ coil retention, bridge availability and upgrade prices. These are not browser results.

## Final validation

| Evidence | Result |
| --- | --- |
| Public site, 3 languages × 2 viewports × 4 models | 24/24 browser UI combinations PASS |
| Patched source, same UI matrix | 24/24 PASS |
| Patched source, real PDF matrix | 24/24 downloads PASS; 942 summary rows and totals match renderer input |
| Actual PDF raster/OCR verification | 24/24 A4 PDFs, 28 pages PASS; no blank pages; rendered IDs/totals match |
| Existing browser regression suite | 18/18 cases PASS (plus bootstrap), including 3 real PDF exports |
| Production normalization contracts | PASS, code-only |
| Human inspection of all 28 rendered pages | PASS; Korean glyphs readable, no clipping/overlap observed |

The final source matrix also deliberately changes hardware color and exercises EMBLA coil controls before verifying model resets. Public UI evidence is pre-patch. Patched PDF results are from a local HTTP server serving the proposed source, not from deployed GitHub Pages. The patch is not deployed to the public site by this validation task.

`docs/validation/configurator-2026-10-08.json` records machine-readable run summaries and final source hashes. Full downloaded PDFs, screenshots, PDF-source observations and raster/OCR evidence are retained in the deliverable evidence archive.
