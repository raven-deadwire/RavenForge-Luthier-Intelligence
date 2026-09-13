import json
from pathlib import Path

ROOT = Path('concepts')
OUTPUT = ROOT / 'concept-index.json'
REQUIRED = ('id', 'image', 'kind', 'date', 'title', 'description', 'alt')

entries = []
for meta_path in sorted(ROOT.glob('*/meta.json')):
    data = json.loads(meta_path.read_text(encoding='utf-8'))
    missing = [key for key in REQUIRED if not data.get(key)]
    if missing:
        raise SystemExit(f'{meta_path}: missing {", ".join(missing)}')
    if data.get('id') != meta_path.parent.name:
        raise SystemExit(f'{meta_path}: id must match directory name')
    entries.append(data)

entries.sort(key=lambda item: (str(item.get('date', '')), str(item.get('id', ''))), reverse=True)
ROOT.mkdir(exist_ok=True)
OUTPUT.write_text(
    json.dumps({'schemaVersion': 1, 'entries': entries}, ensure_ascii=False, indent=2) + '\n',
    encoding='utf-8',
)
print(f'Wrote {OUTPUT} with {len(entries)} concept(s).')
