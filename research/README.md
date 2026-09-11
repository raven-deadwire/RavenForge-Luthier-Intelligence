# RavenForge Research Metadata

The Research section can read GitHub-native metadata from `research-index.json` while keeping the existing Google Sheet as a fallback during migration.

## Article schema

```json
{
  "id": "A01",
  "date": "2026-09-03",
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

Append entries to the `articles` array in `research-index.json`.

## Categories

Use one of the existing site category IDs:

- `wood`
- `craft`
- `sound`
- `liberal`
- `log`

## Migration behavior

The site merges the legacy Google Sheet entries with `research-index.json`. If both sources contain the same article ID, the JSON entry takes priority. This lets old entries remain in the Sheet while new or migrated entries live in GitHub.
