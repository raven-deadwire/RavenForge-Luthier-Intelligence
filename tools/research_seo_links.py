"""Give every research article page a canonical URL and hreflang alternates.

research/<id>/{en,de,ko}.html come from several generators and, for the
legacy articles, from hand-made HTML. Most of the legacy pages had no
canonical or hreflang links, and some generators wrote hreflang as relative
paths, which Google ignores. This rewrites those link tags in each page's
<head> to absolute URLs:

  <link rel="canonical" href=".../research/<id>/<lang>.html">
  <link rel="alternate" hreflang="<code>" href=".../research/<id>/<code>.html">   one per existing language
  <link rel="alternate" hreflang="x-default" href=".../research/<id>/en.html">

Only those tags change; the rest of each file is left byte-for-byte as it
was. It is idempotent.

  python tools/research_seo_links.py          rewrite pages
  python tools/research_seo_links.py --check  exit 1 when a page would change
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESEARCH = ROOT / 'research'
SITE = 'https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence'
LANGS = ('ko', 'en', 'de')
EXISTING = re.compile(r'[ \t]*<link\b(?=[^>]*\brel=["\'](?:canonical|alternate)["\'])(?=[^>]*(?:\bhreflang=|\brel=["\']canonical))[^>]*>[ \t]*\r?\n?', re.I)
HEAD_END = re.compile(r'</head>', re.I)


def links_for(article: str, lang: str, langs: list[str], newline: str) -> str:
    base = f'{SITE}/research/{article}'
    default = 'en' if 'en' in langs else langs[0]
    tags = [f'<link rel="canonical" href="{base}/{lang}.html">']
    tags += [f'<link rel="alternate" hreflang="{code}" href="{base}/{code}.html">' for code in langs]
    tags.append(f'<link rel="alternate" hreflang="x-default" href="{base}/{default}.html">')
    return newline.join(tags) + newline


def rewrite(text: str, block: str) -> str:
    head = HEAD_END.search(text)
    if not head:
        raise ValueError('no </head>')
    start = text[:head.start()]
    first = EXISTING.search(start)
    stripped = EXISTING.sub('', start)
    # Keep the tags where the generator put them when there were any; else just before </head>.
    at = first.start() if first else len(stripped)
    return stripped[:at] + block + stripped[at:] + text[head.start():]


def main() -> int:
    check = '--check' in sys.argv
    stale = []
    for directory in sorted(p for p in RESEARCH.iterdir() if p.is_dir()):
        langs = [code for code in LANGS if (directory / f'{code}.html').exists()]
        for lang in langs:
            path = directory / f'{lang}.html'
            with path.open(encoding='utf-8', newline='') as fh:
                text = fh.read()
            newline = '\r\n' if '\r\n' in text[:2000] else '\n'
            try:
                updated = rewrite(text, links_for(directory.name, lang, langs, newline))
            except ValueError as error:
                print(f'Skipped {path.relative_to(ROOT)}: {error}', file=sys.stderr)
                continue
            if updated == text:
                continue
            stale.append(str(path.relative_to(ROOT)))
            if not check:
                with path.open('w', encoding='utf-8', newline='') as fh:
                    fh.write(updated)
    if check and stale:
        print(f'{len(stale)} research pages need canonical/hreflang updates; run python tools/research_seo_links.py', file=sys.stderr)
        return 1
    print(f'Research canonical/hreflang: {len(stale)} page(s) {"to update" if check else "updated"}.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
