"""Copy the homepage's hotlinked photos (dcinside / Naver) into the repo.

The About > Works gallery and the profile photo used to load straight from
dcinside and search.pstatic.net. Those links are hotlink-protected and can
expire, so this script downloads each photo once, re-encodes it as WebP
(EXIF, including any GPS data, is dropped) and points index.html at the local
copies:

  assets/works/work-NN.webp        full size, opened by openImagePopup()
  assets/works/work-NN-thumb.webp  grid thumbnail
  assets/works/profile.webp        About > Introduction portrait

It is idempotent: once index.html no longer references those hosts it does
nothing. Any failed download aborts before index.html is touched.
"""
from __future__ import annotations

import html
import io
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'index.html'
OUT = ROOT / 'assets' / 'works'
REMOTE = r'https://(?:dcimg\d\.dcinside\.(?:co\.kr|com)|search\.pstatic\.net)/[^"\']+'
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/128.0 Safari/537.36')


def download(url: str) -> Image.Image:
    headers = {'User-Agent': UA, 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8'}
    if 'dcinside' in url:
        # dcinside only serves images with a gallery referer.
        headers['Referer'] = 'https://gall.dcinside.com/'
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as res:
        data = res.read()
    im = Image.open(io.BytesIO(data))
    im.load()
    im = ImageOps.exif_transpose(im)
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    return im


def save_webp(im: Image.Image, dst: Path, max_px: int, quality: int) -> None:
    im = im.copy()
    im.thumbnail((max_px, max_px), Image.Resampling.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, 'WEBP', quality=quality, method=6)
    print(f'  {dst.relative_to(ROOT)}: {im.width}x{im.height}, {dst.stat().st_size:,} bytes')


def main() -> int:
    text = INDEX.read_text(encoding='utf-8', newline='')
    urls = list(dict.fromkeys(re.findall(REMOTE, text)))
    if not urls:
        print('index.html has no hotlinked dcinside/pstatic images; nothing to do.')
        return 0

    works = [u for u in urls if 'dcinside' in u]
    profile = [u for u in urls if 'pstatic' in u]
    plan: dict[str, tuple[str, str]] = {}
    images: dict[str, Image.Image] = {}
    for n, url in enumerate(works, 1):
        plan[url] = (f'assets/works/work-{n:02d}.webp', f'assets/works/work-{n:02d}-thumb.webp')
    for url in profile:
        plan[url] = ('assets/works/profile.webp', 'assets/works/profile.webp')

    for url in plan:
        print(f'Downloading {html.unescape(url)[:90]}...')
        images[url] = download(html.unescape(url))

    for url, (full, thumb) in plan.items():
        if full == thumb:
            save_webp(images[url], ROOT / full, 720, 88)
        else:
            save_webp(images[url], ROOT / full, 2000, 88)
            save_webp(images[url], ROOT / thumb, 800, 82)

    for url, (full, thumb) in plan.items():
        text = text.replace(f"openImagePopup('{url}')", f"openImagePopup('{full}')")
        text = text.replace(f'src="{url}"', f'src="{thumb}" loading="lazy" decoding="async"')
    left = re.findall(REMOTE, text)
    if left:
        print(f'Unreplaced remote image references remain: {left[:3]}', file=sys.stderr)
        return 1
    INDEX.write_text(text, encoding='utf-8', newline='')
    print(f'Rewrote {len(plan)} images in index.html')
    return 0


if __name__ == '__main__':
    sys.exit(main())
