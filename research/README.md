# RavenForge Research Metadata

The Research section now supports GitHub-native per-article metadata while keeping the existing Google Sheet as a temporary fallback during migration.

## Publishing workflow

1. Create a folder such as `research/A05/`.
2. Add `meta.json` using the schema below.
3. Commit/push the file to `main`.
4. GitHub Actions validates all article metadata and rebuilds `research/research-index.json` automatically.
5. The website reads the generated index. Existing non-migrated articles continue to load from the legacy Google Sheet.

Do **not** edit `research/research-index.json` manually; it is generated from `research/*/meta.json`.

## Article schema

```json
{
  "id": "A05",
  "date": "2026-09-11",
  "category": "sound",
  "ko": {
    "title": "한국어 제목",
    "excerpt": "한국어 요약",
    "link": "https://..."
  },
  "en": {
    "title": "English title",
    "excerpt": "English excerpt",
    "link": "https://..."
  },
  "de": {
    "title": "Deutscher Titel",
    "excerpt": "Deutsche Kurzfassung",
    "link": "https://..."
  }
}
```

Every `ko`, `en`, and `de` block must contain `title`, `excerpt`, and `link`.

## Categories

Use one of the existing site category IDs:

- `wood`
- `craft`
- `sound`
- `liberal`
- `log`

## Migration behavior

The site merges legacy Google Sheet entries with the generated GitHub index. When a GitHub-native entry matches a legacy entry, the GitHub entry takes priority. This allows articles to be migrated one by one without breaking the existing Research section.

`research/A01/meta.json` is the first migrated example.
