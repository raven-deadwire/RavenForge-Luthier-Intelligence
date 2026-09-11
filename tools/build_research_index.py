import json
from pathlib import Path

ROOT = Path('research')
OUTPUT = ROOT / 'research-index.json'
ALLOWED_CATEGORIES = {'wood', 'craft', 'sound', 'liberal', 'log'}
REQUIRED_LANGS = ('ko', 'en', 'de')

articles = []
for meta_path in sorted(ROOT.glob('*/meta.json')):
    data = json.loads(meta_path.read_text(encoding='utf-8'))

    article_id = str(data.get('id', '')).strip()
    date = str(data.get('date', '')).strip()
    category = str(data.get('category', '')).strip().lower()

    if not article_id:
        raise SystemExit(f'{meta_path}: missing id')
    if not date:
        raise SystemExit(f'{meta_path}: missing date')
    if category not in ALLOWED_CATEGORIES:
        raise SystemExit(f'{meta_path}: invalid category {category!r}')

    normalized = {
        'id': article_id,
        'date': date,
        'category': category,
    }

    for lang in REQUIRED_LANGS:
        localized = data.get(lang)
        if not isinstance(localized, dict):
            raise SystemExit(f'{meta_path}: missing {lang} object')
        title = str(localized.get('title', '')).strip()
        excerpt = str(localized.get('excerpt', '')).strip()
        link = str(localized.get('link', '')).strip()
        if not title or not excerpt or not link:
            raise SystemExit(f'{meta_path}: {lang} requires title, excerpt, link')
        normalized[lang] = {
            'title': title,
            'excerpt': excerpt,
            'link': link,
        }

    articles.append(normalized)

articles.sort(key=lambda item: (item['date'], item['id']), reverse=True)
OUTPUT.write_text(
    json.dumps({'schemaVersion': 1, 'articles': articles}, ensure_ascii=False, indent=2) + '\n',
    encoding='utf-8',
)
print(f'Wrote {OUTPUT} with {len(articles)} article(s).')
