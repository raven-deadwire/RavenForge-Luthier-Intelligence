#!/usr/bin/env python3
"""Build one review HTML with exact original image bytes and local code embedded.

CDN dependencies remain the same as the existing configurator. No pixel conversion
or source modification is performed. The output is safe to move out of its folder.
"""
import argparse
import base64
import json
import mimetypes
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
MEDIA = [
    'assets/configurator-materials/wood-neck-atlas-v11.webp',
    *[f'assets/configurator-materials/wood-{group}-atlas-v8.webp' for group in ['body','fretboard','top']],
    'Edda Prototype Design.png', 'EMBLA Prototype Design.png', 'ASKR Prototype Design.png',
    'assets/configurator-gramr-reference.svg', 'assets/configurator-gramr-rear-reference.svg',
    'assets/configurator-materials/ash-illustrative.webp',
    *[f'assets/configurator-bindrune/c{i}.svg' for i in range(1, 5)],
    'assets/configurator-bindrune/layouts-v5.png',
    'assets/configurator-rear/edda-rear-bolton-v6.webp',
    *[f'assets/configurator-rear/{model}-rear-reference.svg' for model in ['embla', 'askr']],
]


def data_url(name):
    mime = mimetypes.guess_type(name)[0] or 'application/octet-stream'
    return f'data:{mime};base64,' + base64.b64encode((ROOT / name).read_bytes()).decode()


def build():
    html = (ROOT / 'configurator-preview.html').read_text()
    payload = json.dumps({name: data_url(name) for name in MEDIA}, separators=(',', ':'))
    html = html.replace('<body>', '<body>\n<script>globalThis.RavenForgePreviewMedia=' + payload + ';</script>', 1)

    def script(match):
        name = match[1].split('?')[0].removeprefix('./')
        source = (ROOT / name).read_text().replace('</script', '<\\/script')
        return '<script>\n' + source + '\n</script>'

    html = re.sub(r'<script src="(\./assets/[^"]+)"></script>', script, html)
    html = re.sub(r'<link rel="stylesheet" href="\./assets/configurator-preview\.css[^"]*">',
                  lambda _: '<style>' + (ROOT / 'assets/configurator-preview.css').read_text() + '</style>', html)
    html = html.replace('src="./ravenforge.png"', 'src="' + data_url('ravenforge.png') + '"')
    html = html.replace('href="assets/favicon.png"', 'href="' + data_url('assets/favicon.png') + '"')
    return html


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(build())
    print(args.output)
