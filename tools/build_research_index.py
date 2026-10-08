"""Validate all archive metadata before atomically replacing the generated index."""
import argparse
from datetime import date
import json
import os
from pathlib import Path
import tempfile
from urllib.parse import unquote, urlsplit

from research_docx import Invalid, LANGS, archive, read_json

ROOT = Path(__file__).resolve().parents[1]


def build_index(root):
    archive(root)
    articles = []
    seen = set()
    for meta_path in sorted((root / 'research').glob('*/meta.json')):
        data = read_json(meta_path)
        article_id = str(data.get('id', '')).strip()
        if not article_id or article_id.casefold() in seen:
            raise Invalid(f'{meta_path}: missing or duplicate id')
        seen.add(article_id.casefold())
        date.fromisoformat(data.get('date', ''))
        category = data.get('category', '')
        if category not in {'wood', 'craft', 'sound', 'liberal', 'log'}:
            raise Invalid(f'{meta_path}: invalid category')
        normalized = {k: data[k] for k in ('id', 'date', 'category')}
        for lang in LANGS:
            local = data.get(lang)
            if not isinstance(local, dict) or any(not isinstance(local.get(k), str) or not local[k].strip() for k in ('title', 'excerpt', 'link')):
                raise Invalid(f'{meta_path}: {lang} requires title, excerpt, link')
            parsed = urlsplit(local['link'])
            target = (root / unquote(parsed.path)).resolve()
            if parsed.scheme or parsed.netloc or not target.is_relative_to(meta_path.parent.resolve()) or not target.is_file():
                raise Invalid(f'{meta_path}: invalid/missing {lang} page link')
            normalized[lang] = {k: local[k].strip() for k in ('title', 'excerpt', 'link')}
        articles.append(normalized)
    articles.sort(key=lambda item: (item['date'], item['id']), reverse=True)
    content = json.dumps({'schemaVersion': 1, 'articles': articles}, ensure_ascii=False, indent=2) + '\n'
    output = root / 'research/research-index.json'
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=output.parent, delete=False) as f:
        temporary = Path(f.name)
        try:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        except BaseException:
            temporary.unlink()
            raise
    try:
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
    return len(articles)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=ROOT)
    args = parser.parse_args()
    try:
        count = build_index(args.repo.resolve())
        print(f'Wrote research/research-index.json with {count} article(s).')
    except (Invalid, ValueError, KeyError) as e:
        raise SystemExit(str(e))
