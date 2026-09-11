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

A future DOCX-to-HTML publishing step can generate the three HTML files and `meta.json`; the website itself no longer requires Google Docs or Google Sheets.

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
