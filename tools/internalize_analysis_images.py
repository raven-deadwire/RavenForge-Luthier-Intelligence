"""Serve the Analysis card and modal photos from this site instead of hotlinking.

assets/analysis-media.js and assets/analysis-media-data.js used to point every
representative-model photo at the original maker or retailer image: about 130
full-size JPEGs (often 1280-2000 px) spread over some 75 hosts, most of them in
Europe and North America. From Korea a single modal could take several seconds
to fill in. This downloads each photo once, scales it down and re-encodes it as
WebP (EXIF dropped) under assets/analysis/, and points the shot at the local
copy:

  assets/analysis/<maker-slug>-<n>.webp

Each entry keeps its `source` link to the maker, and
tools/analysis-image-sources.json records the original URL of every copy.

A shot whose src fails is saved from its fallback instead (as the page itself
would show it). i0.wp.com (the WordPress image CDN) answers 404 to scripted
requests, so a URL behind it is also tried directly on the original host.
Shots that already point at a file in this repo are left alone. A shot whose src and fallback both fail stays hotlinked and is
listed as SKIPPED, so the runtime fallbacks (Instagram embeds, the missing-image
placeholder) keep working. It is idempotent: shots already pointing at
assets/analysis/ are left alone.

  python tools/internalize_analysis_images.py
"""
from __future__ import annotations

import io
import json
import re
import sys
import time
import unicodedata
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'analysis'
MANIFEST = ROOT / 'tools' / 'analysis-image-sources.json'
BASE = ROOT / 'assets' / 'analysis-media.js'
EXTRA = ROOT / 'assets' / 'analysis-media-data.js'
LOCAL = 'assets/analysis/'
# Modal tiles are about 350 CSS px wide (700 device px on a 2x screen). The one
# `mode: 'bg'` shot crops a 315% background, so it keeps more pixels.
MAX_SIDE = 1000
MAX_SIDE_BG = 2000
QUALITY = 80
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/128.0 Safari/537.36')

# {label:'…',src:'…'(,fallback:'…')?…} in analysis-media.js
BASE_SHOT = re.compile(r"\{label:'(?P<label>[^']*)',src:'(?P<src>[^']*)'(?P<fb>,fallback:'(?P<fallback>[^']*)')?(?P<rest>[^{}]*)\}")
BASE_ENTRY = re.compile(r"^ ?'(?P<name>[^']+)':\{model:", re.M)
# { "label": "…", "src": "…"(, "fallback": "…")? … } in analysis-media-data.js
EXTRA_SHOT = re.compile(r'\{ "label": "(?P<label>[^"]*)", "src": "(?P<src>[^"]*)"(?P<fb>, "fallback": "(?P<fallback>[^"]*)")?(?P<rest>[^{}]*)\}')
EXTRA_ENTRY = re.compile(r'^ "(?P<name>[^"]+)": \{', re.M)


def unwrap(url: str) -> str | None:
    """https://i0.wp.com/host/path?w=… -> https://host/path"""
    m = re.match(r'https://i\d\.wp\.com/([^?]+)', url)
    return f'https://{m.group(1)}' if m else None


def slug(text: str) -> str:
    # Häussel -> haussel, not h-ussel
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:48]


def fetch(url: str) -> Image.Image | None:
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': UA, 'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9', 'Sec-Fetch-Dest': 'image'})
            with urllib.request.urlopen(req, timeout=30) as res:
                body = res.read()
            img = Image.open(io.BytesIO(body))
            img.load()
            # Hotlink blockers often answer 200 with a 1x1 GIF.
            if img.width < 40 and img.height < 40:
                return None
            return img
        except Exception as error:  # noqa: BLE001 - any failure means "use the next URL"
            if attempt:
                print(f'  {url}: {error}', file=sys.stderr)
            time.sleep(2)
    return None


def save(img: Image.Image, path: Path, max_side: int) -> None:
    img = ImageOps.exif_transpose(img)
    alpha = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
    img = img.convert('RGBA' if alpha else 'RGB')
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, 'WEBP', quality=QUALITY, method=6)


def owner(entries: list[tuple[int, str]], at: int) -> str:
    name = ''
    for start, entry in entries:
        if start > at:
            break
        name = entry
    return name


def process(path: Path, shot_re: re.Pattern, entry_re: re.Pattern, quote: str, manifest: dict) -> tuple[str, list[str]]:
    text = path.read_text(encoding='utf-8')
    entries = [(m.start(), m.group('name')) for m in entry_re.finditer(text)]
    counts: dict[str, int] = {}
    skipped: list[str] = []

    def replace(m: re.Match) -> str:
        name = owner(entries, m.start())
        counts[name] = counts.get(name, 0) + 1
        src, fallback = m.group('src'), m.group('fallback')
        if not src.startswith('http'):
            return m.group(0)
        bg = 'mode:' in m.group('rest') and "'bg'" in m.group('rest')
        local = f'{LOCAL}{slug(name)}-{counts[name]}.webp'
        used, img = None, None
        for url in dict.fromkeys(u for u in (src, unwrap(src), fallback, fallback and unwrap(fallback)) if u):
            img = fetch(url)
            if img is not None:
                used = url
                break
        if img is None:
            skipped.append(f'{name} #{counts[name]} {m.group("label")}')
            return m.group(0)
        save(img, ROOT / local, MAX_SIDE_BG if bg else MAX_SIDE)
        manifest[local] = {'maker': name, 'label': m.group('label'), 'original': used}
        print(f'  {local} <- {used}')
        rest = m.group('rest')
        if used not in (src, unwrap(src)) and bg:
            # The runtime fallback switches the background to cover/centre; keep that look.
            rest = re.sub(r",bgSize:'[^']*'", ",bgSize:'cover'", rest)
            rest = re.sub(r",bgPos:'[^']*'", ",bgPos:'50% 50%'", rest)
        q = quote
        if q == "'":
            return f"{{label:'{m.group('label')}',src:'{local}'{rest}}}"
        return f'{{ "label": "{m.group("label")}", "src": "{local}"{rest}}}'

    return shot_re.sub(replace, text), skipped


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {}
    results = []
    for path, shot_re, entry_re, quote in ((BASE, BASE_SHOT, BASE_ENTRY, "'"), (EXTRA, EXTRA_SHOT, EXTRA_ENTRY, '"')):
        print(path.relative_to(ROOT))
        results.append((path, *process(path, shot_re, entry_re, quote, manifest)))
    for path, text, skipped in results:
        path.write_text(text, encoding='utf-8')
        for item in skipped:
            print(f'SKIPPED {item} [{path.relative_to(ROOT)}]: src and fallback both failed; left hotlinked')
    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    total = sum(1 for p in OUT.glob('*.webp'))
    size = sum(p.stat().st_size for p in OUT.glob('*.webp'))
    print(f'{total} local Analysis images, {size / 1e6:.1f} MB in total.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
