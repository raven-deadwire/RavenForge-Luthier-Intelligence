# Multilingual DOCX browser validation — 2026-10-08

PR #6 original head: `3efd149aa8173d19be54fe0f4d3ebc37bd201a2d`.
Integrated main: `41f66e6e4b66209e5f0a4ce55e7bae7e6c22b72d`, including PR #18.
The main merge completed without conflicts. Exact converter, test, base CSS,
generated HTML/CSS and screenshot SHA-256 values are in the adjacent JSON report.

## Scope and isolation

The PR #18 environment is reusable: Playwright 1.62.1 controls its existing
Chromium 131.0.6778.204 headless executable. Noto Sans CJK KR is installed.
This run uses local HTTP only, normal browser trust, no HTTPS bypass and no
mocked renderer, fonts or requests.

`research_browser_fixture.py` generates new, distinct KO/EN/DE DOCX packages
outside the checkout, using the unused research code A99999 and temporary
article ID `qa-docx-browser-a99999`. Each language contains 9 tables (2–10
columns), 6 actual PNG images with visible edge markers and mixed proportions,
headings, paragraphs, inline emphasis/subscript/superscript, bibliography, long
unbroken reference text, bookmarks and a link to the existing B03 page. The
production converter runs as a dry-run. A local server overlays the generated
article at the normal repository-prefixed URL; nothing is added to `research/`.

All 342 research files retain their before/after test hashes. Compared with
main, only the research README changes; every published study, its assets,
metadata and the 26-entry index remain byte-identical. A04 is neither reused
as test data nor rewritten. Its earlier private conversion evidence remains
historical evidence, not a new A04 browser-validation claim.

## Browser findings and corrections

The initial Chromium pass found no missing glyph, image decoding, link or
horizontal page-overflow failures. Pixel inspection nevertheless exposed a
real readability problem: B03's inherited fixed 660px mobile minimum squeezes
10-column tables to about 66px per column. Korean and German text breaks into
one or two characters per line. Geometry checks alone did not flag this.

The generic converter now counts the widest logical row, including horizontal
spans, and emits a column-count CSS variable. Generated **screen** tables keep
at least 10rem per column and use the existing accessible horizontal scroll
container. Final measured narrowest cells are approximately 159.8px (collapsed
borders account for the fraction). The last column is reachable, and keyboard
ArrowRight scrolls the focused table. Published B03 CSS and print rules are
unchanged. A new converter regression covers a short title row followed by a
10-column data row and verifies that original B03 CSS is preserved.

Before: [dense mobile table](research-docx-2026-10-08/before-ko-mobile-dense-table.png).
After: [readable columns](research-docx-2026-10-08/ko-mobile-wide-table.png) and
[reachable final column](research-docx-2026-10-08/ko-mobile-wide-table-end.png).

The first remote browser run, [37769493618](https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence/actions/runs/37769493618),
passed all three 27-test Python jobs and all English/German browser cases, but
failed the Korean font-selection checks at both sizes. Its preserved artifact
`11546638244` was downloaded and SHA-256 verified. Chromium 131.0.6778.33 on
Ubuntu selected **WenQuanYi Zen Hei** despite installed Noto CJK fonts, because
the inherited CSS did not list Noto's Linux family name. The screenshot showed
readable Hangul, so this was an unintended font fallback, **not proven missing
glyphs**. Generated CSS now explicitly lists Noto Sans CJK KR and the existing
Korean/macOS alternatives. The browser font requirement was retained, and an
additional Python regression protects the explicit family list and original
published CSS. That first CI browser failure is superseded, not reported as PASS.

## Results by evidence type

| Evidence | Result |
| --- | --- |
| Existing converter / negative-publication contracts before correction | 26/26 PASS, local Linux; not browser tests |
| Converter contracts after both corrections | 28/28 PASS, local Linux |
| Actual Chromium, KO/EN/DE × 1440×1080 and 390×844 | 6/6 combinations, 54/54 grouped checks PASS |
| Table content/order in browser | All 9 tables per language match every expected cell |
| Actual Korean font usage | CDP confirms Noto Sans CJK KR glyphs in title, body, table and references at both sizes |
| Images | All six per page decode, match original SHA-256, preserve aspect ratio and fit the content width |
| Links and navigation | Local HTTP 200 responses and fragments; real bookmark/TOC/language/B03 clicks PASS |
| Layout | No horizontal page overflow, clipped table cells, inaccessible final columns or distorted images |
| Visual screenshot inspection | All six title/reference views plus Korean glyph, image edge-marker and dense-table before/after views PASS |
| Published archive preservation | 342/342 file hashes unchanged during final browser run |
| Index rebuild | 26 entries; byte-identical |
| Configurator source contracts inherited from PR #18 | PASS; supplementary code-only check |

The browser checks are separate from Python contracts. Browser checks validate
glyph usage, HTTP responses, actual clicks, decoding and geometry; screenshots
provide the visual review. Machine-readable measurements are in
`research-docx-2026-10-08.json`. Selected title and table screenshots are checked
in; each CI browser run retains the full synthetic sources, generated pages,
report and screenshots as an Actions artifact.

One intermediate post-fix run was invalidated by the archive guard when the
research README was edited while it was running. It is **not** acceptance
evidence. The final fresh run after edits completed passed all checks and the
unchanged-archive assertion. A later local iteration passed all 54 assertions
but caught image requests aborted by the test's own rapid language switching.
The runner now decodes every actual image before the next language click,
rather than relying on network-idle timing;
request failures remain fatal and include their browser error text. That
superseded iteration is not counted as acceptance evidence.

## Reproduction and continuous checks

```sh
python -m unittest discover -s tools -p test_research_docx.py -v
python tools/build_research_index.py
RESEARCH_BROWSER_PATH=/path/to/chrome-headless-shell \
RESEARCH_QA_DIR=/tmp/research-browser-new \
node tools/test_research_browser.cjs
```

The read-only workflow keeps the Linux/Windows/macOS Python contracts and adds
an independent Linux browser job. CI pins Playwright 1.49.1 with its Chromium
131 build and installs Noto CJK fonts. Its browser version and source hashes
are recorded in each fresh report; the local acceptance version above must
not be substituted for the CI version. The browser job explicitly checks out
the PR head, and artifacts are named with that SHA. The three Python jobs use
the standard PR merge checkout to cover integration with main.

Mobile results are viewport emulation, not physical Android/iOS or Safari
coverage. These fixtures have local references only. Remote reference HTTP
failures remain separate converter contracts; real manuscripts still need
`--check-external`, fragment/editorial review and their own visual check before
publication. No PDF-output, translation-quality or arbitrary-OOXML fidelity
claim is made by this HTML acceptance run.
