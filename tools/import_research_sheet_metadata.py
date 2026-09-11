# One-time importer for migrating the published Research Lab sheet into GitHub-native metadata.
import csv
import io
import json
import re
import urllib.request
from pathlib import Path

SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_PHt3LmAsjEbH_9XCiD18E8XFgY2gWb0QDQhghJmM0V9eZDCz1CcWUIJA5h_abKecwLEn_XIEzlsH/pub?output=csv"
ROOT = Path("research")
KNOWN_IDS = {
    ("2026-09-05", "From Mechanical Vibration to Electrical Signal"): "A01",
}
LANG_COLUMNS = {
    "ko": ("Title_KO", "Excerpt_KO", "Link_KO"),
    "en": ("Title_EN", "Excerpt_EN", "Link_EN"),
    "de": ("Title_DE", "Excerpt_DE", "Link_DE"),
}


def clean(value):
    return (value or "").strip()


def slug_fragment(value):
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "research"


with urllib.request.urlopen(SHEET_CSV_URL, timeout=30) as response:
    csv_text = response.read().decode("utf-8-sig")

rows = list(csv.DictReader(io.StringIO(csv_text)))
used_ids = set()
written = 0

for row_number, row in enumerate(rows, start=2):
    date = clean(row.get("Date"))
    category = clean(row.get("Category")).lower()
    title_en = clean(row.get("Title_EN"))

    if not date or not category or not title_en:
        continue

    article_id = KNOWN_IDS.get((date, title_en))
    if not article_id:
        base_id = f"legacy-{date}-{slug_fragment(category)}"
        article_id = base_id
        suffix = 2
        while article_id in used_ids:
            article_id = f"{base_id}-{suffix}"
            suffix += 1
    used_ids.add(article_id)

    meta = {
        "id": article_id,
        "date": date,
        "category": category,
        "migratedFrom": "google-sheet",
        "legacySheetRow": row_number,
    }

    for lang, (title_col, excerpt_col, link_col) in LANG_COLUMNS.items():
        title = clean(row.get(title_col))
        excerpt = clean(row.get(excerpt_col))
        link = clean(row.get(link_col))
        if not title or not excerpt or not link:
            raise SystemExit(
                f"Sheet row {row_number}: incomplete {lang} metadata "
                f"({title_col}, {excerpt_col}, {link_col})"
            )
        meta[lang] = {
            "title": title,
            "excerpt": excerpt,
            "link": link,
        }

    target_dir = ROOT / article_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / "meta.json"
    target.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    written += 1

if written == 0:
    raise SystemExit("No research rows were imported from the published Sheet.")

print(f"Imported {written} research metadata file(s) from the legacy Google Sheet.")
