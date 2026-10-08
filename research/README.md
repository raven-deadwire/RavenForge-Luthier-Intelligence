# RavenForge Research Archive

The Research section is now GitHub-native. The website reads `research/research-index.json`; the former Google Sheet is no longer used at runtime.

All 16 legacy research entries have been migrated into this repository. Each entry contains per-language metadata and static KR/EN/DE HTML pages. Original published Google Docs URLs are retained only as `sourceLink` provenance inside migrated `meta.json` files.

## Article structure

```text
research/
└─ A05/
   ├─ meta.json
   ├─ ko.html
   ├─ en.html
   └─ de.html
```

`research/research-index.json` is generated automatically from `research/*/meta.json`. Do not edit the generated index manually.

## Publishing workflow

1. Create a folder such as `research/A05/`.
2. Add the KR/EN/DE article pages (`ko.html`, `en.html`, `de.html`).
3. Add `meta.json` with category, date, localized title/excerpt, and local page links.
4. Commit/push to `main`.
5. GitHub Actions validates the metadata and rebuilds `research/research-index.json` automatically.

The create-only DOCX publisher below generates the three HTML files and `meta.json`; the website itself no longer requires Google Docs or Google Sheets.

## Article schema

```json
{
  "id": "A05",
  "date": "2026-09-11",
  "category": "sound",
  "ko": {
    "title": "한국어 제목",
    "excerpt": "한국어 요약",
    "link": "research/A05/ko.html"
  },
  "en": {
    "title": "English title",
    "excerpt": "English excerpt",
    "link": "research/A05/en.html"
  },
  "de": {
    "title": "Deutscher Titel",
    "excerpt": "Deutsche Kurzfassung",
    "link": "research/A05/de.html"
  }
}
```

Every `ko`, `en`, and `de` block must contain `title`, `excerpt`, and `link`.

Migrated articles may additionally contain `sourceLink`, `migratedFrom`, and `legacySheetRow`. These fields are archival provenance and are not required for new entries.

## Categories

Use one of the existing site category IDs:

- `wood`
- `craft`
- `sound`
- `liberal`
- `log`

## Current migration status

- Legacy Google Sheet metadata: migrated
- KR/EN/DE titles and excerpts: migrated
- KR/EN/DE article bodies: mirrored as static GitHub HTML
- Website Research loader: GitHub JSON only
- Google Sheet runtime dependency: removed
- Google Docs runtime dependency: removed

## Generic DOCX publishing (create-only)

`tools/research_docx.py` converts three authoritative DOCX manuscripts into the
existing archive schema. Python 3.10+ and the standard library are sufficient.
It reuses B03's source-text normalization, formatting-property helpers, block
verifier and responsive CSS. B03's fixed title positions/counts and A06's
hash-checked, preassembled HTML remain independent; neither article is changed.

Prepare a private input folder **outside this checkout**:

```text
private-study/
├── manifest.json
├── ko.docx
├── en.docx
└── de.docx
```

Copy `tools/research-docx-manifest.example.json` as `manifest.json`. Set the new
ID/research code, date, category and each language's editorial title/excerpt
once. DOCX filenames are relative to the manifest, so the same command works
for every study. These titles/excerpts describe archive cards; the manuscript's
own title, subtitle and complete body remain intact. Optional `sourceLink`
records provenance. The tool does not generate or verify the semantic accuracy
of translations: three distinct, nonempty manuscripts are required.

From the checkout root:

```bash
# Private dry-run; the output directory must be NEW and outside the checkout.
python tools/research_docx.py ../private-study/manifest.json --output ../private-study/preview

# Include live HTTP checks when the manuscript contains remote references.
python tools/research_docx.py ../private-study/manifest.json --output ../private-study/preview-checked --check-external

# Inspect the three pages and validation-report.json before preparing publication.
# Create NEW research/<id>/ files. This is blocked for any existing/legacy identity.
python tools/research_docx.py ../private-study/manifest.json --publish --check-external
```

Commit only the generated new article directory on a feature branch, review the
PR, and merge it through the existing process. The current site workflow then
rebuilds `research/research-index.json`. Neither dry-run nor `--publish` updates
the index or pushes/deploys anything. No DOCX inputs or private dry-run files
need to enter the public repository. The page CSS travels with the new article.

### Preservation and validation

- Every top-level paragraph/table is compared with parsed HTML for text and
  order, including bibliography paragraphs and table cell content.
- Heading styles/outline levels, bold/italic/subscript/superscript, paragraph
  breaks, bookmarks, hyperlinks and literal HTTP URLs are preserved.
- Tables preserve cell/row order, horizontal merges, nested tables and explicit
  header rows. Embedded PNG/JPEG/GIF bytes are copied without recompression;
  each occurrence and SHA-256 is recorded in the private report. Existing alt
  text is retained; standalone figures use the following caption as fallback.
- Each page has a localized archive title/description, canonical URL, reciprocal
  KO/EN/DE navigation and hreflang links. `meta.json` is generated automatically.
- All local page, image, stylesheet and fragment links must resolve against the
  staged article plus the existing checkout. Remote links are `UNCHECKED` unless
  requested; HTTP 404/410 is `BROKEN`, and access/rate/network failures are
  `UNVERIFIED`. Any non-PASS remote result blocks `--publish`; it is not silently
  accepted as a valid link. HTTP checks cannot validate remote page fragments.
- Missing language metadata/files, identical DOCX translations, wrong manuscript
  research codes, unsafe paths/URL schemes and duplicate JSON keys are rejected.
- IDs are case-insensitive. Legacy entries are additionally identified from their
  opening research-code/title paragraphs, not references to other studies.
  Thus A04 already mapped to `legacy-2026-09-10-sound` can be dry-run tested but
  cannot be republished under a new `A04` ID. Existing index IDs are also reserved.
- An exclusive publication lock plus exclusive folder creation prevents duplicate
  writers. Metadata is exposed last, after all pages/assets are ready; failed
  copies remove only the new folder. Existing/empty folders and prior previews
  are never overwritten. The metadata index generator validates every entry and
  replaces the index atomically only after all entries pass.

Unsupported features **stop conversion** rather than disappearing: vertical
cell merges, nested/overridden or non-decimal list numbering, fields, footnotes/
endnotes, tracked changes, content controls, embedded objects, native equations,
VML/vector/linked images and comments. Resolve these in the manuscript or add a
reviewed converter before publishing. Standard top-level decimal/bullet lists
are supported; original page geometry, headers/footers and Word-specific visual
styles are outside the web body conversion contract. Rendered HTML needs visual
review, especially for large tables and figures.

Run the public, synthetic regression suite:

```bash
python -m unittest discover -s tools -p test_research_docx.py -v
```

The read-only `research-docx-contract.yml` workflow runs these contracts on
Linux/Windows/macOS. It never downloads private Drive manuscripts or publishes
previews. A separate Linux Chromium job uploads only generated synthetic test
data and browser evidence, never private manuscripts.

### Actual browser regression

```bash
# Requires Playwright and Chromium; install a Korean-capable system font.
# Optional: RESEARCH_BROWSER_PATH=/path/to/chrome-headless-shell
# Optional: RESEARCH_QA_DIR=/absolute/path/outside/the/checkout
node tools/test_research_browser.cjs
```

The runner creates fresh KO/EN/DE DOCX fixtures outside the checkout and invokes
the production converter without `--publish`. Its local HTTP server overlays the
temporary article at the real site path, leaving existing research untouched.
Three languages at 1440×1080 and 390×844 cover titles, text, tables, images,
bibliography, bookmarks, TOC clicks, language switching and existing local links.
Korean glyphs must actually use an explicitly configured Korean platform font
(Chromium CDP). Generated CSS includes Noto Sans CJK KR, as commonly named on
Linux, alongside Noto Sans KR, Malgun Gothic and Apple SD Gothic Neo.
Image decoding, byte hashes, proportions, page overflow, table cell width and
access to the final column are checked. Generated screen tables reserve 10rem
per column and scroll horizontally; existing article CSS and print layout stay
unchanged. Screenshots still require visual inspection.

`report.json` and screenshots are distinct browser evidence; Python converter
contracts are not browser results. Mobile means viewport emulation, not a
physical phone. The fixture contains local references only: remote HTTP failures
remain covered by converter contracts, and real manuscripts still require live
`--check-external` and editorial review. See
`docs/validation/research-docx-2026-10-08.md` for the completed acceptance run.
