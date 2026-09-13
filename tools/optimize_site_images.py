from pathlib import Path
from PIL import Image
import json

OUT = Path('assets/optimized')
OUT.mkdir(parents=True, exist_ok=True)

JOBS = [
    (Path('EMBLA Prototype Design.png'), OUT / 'embla-prototype.webp', 2000, 88),
    (Path('ASKR Prototype Design.png'), OUT / 'askr-prototype.webp', 2000, 88),
    (Path('Edda Prototype Design.png'), OUT / 'edda-prototype.webp', 2000, 88),
    (Path('Body Structure.png'), OUT / 'body-structure.webp', 2200, 86),
    (Path('assets/concepts/gram-superstrat-24f.png'), OUT / 'gram-superstrat-24f.webp', 1800, 88),
    (Path('ravenforge.png'), OUT / 'ravenforge-logo.webp', 1200, 90),
]

def optimize(src: Path, dst: Path, max_px: int, quality: int):
    if not src.exists():
        print(f'Skip missing {src}')
        return
    with Image.open(src) as im:
        im.load()
        if max(im.size) > max_px:
            scale = max_px / max(im.size)
            im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.Resampling.LANCZOS)
        if im.mode not in ('RGB', 'RGBA'):
            im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, 'WEBP', quality=quality, method=6)
        print(f'{src} -> {dst}: {dst.stat().st_size:,} bytes')

for job in JOBS:
    optimize(*job)

# Small dedicated favicon assets from the original logo.
logo = Path('ravenforge.png')
if logo.exists():
    with Image.open(logo) as im:
        im.load()
        if im.mode not in ('RGB', 'RGBA'):
            im = im.convert('RGBA')
        for size, name in ((64, 'favicon.png'), (180, 'apple-touch-icon.png')):
            thumb = im.copy()
            thumb.thumbnail((size, size), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            canvas.alpha_composite(thumb, ((size-thumb.width)//2, (size-thumb.height)//2))
            canvas.save(Path('assets') / name, 'PNG', optimize=True)

# Point concept source metadata at optimized GRAM media when available.
gram_meta = Path('concepts/gram-superstrat-24f/meta.json')
if gram_meta.exists() and (OUT / 'gram-superstrat-24f.webp').exists():
    data = json.loads(gram_meta.read_text(encoding='utf-8'))
    data['image'] = 'assets/optimized/gram-superstrat-24f.webp'
    gram_meta.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Replace runtime references in the monolithic homepage without touching archival originals.
index = Path('index.html')
if index.exists():
    with index.open('r', encoding='utf-8', newline='') as fh:
        text = fh.read()
    replacements = {
        'EMBLA%20Prototype%20Design.png': 'assets/optimized/embla-prototype.webp',
        'ASKR%20Prototype%20Design.png': 'assets/optimized/askr-prototype.webp',
        'Edda%20Prototype%20Design.png': 'assets/optimized/edda-prototype.webp',
        'Body%20Structure.png': 'assets/optimized/body-structure.webp',
        'Body Structure.png': 'assets/optimized/body-structure.webp',
        'src="ravenforge.png"': 'src="assets/optimized/ravenforge-logo.webp"',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    with index.open('w', encoding='utf-8', newline='') as fh:
        fh.write(text)
