#!/usr/bin/env python3
"""Extract only the four original layout illustrations from the supplied v5 guide.
Usage: python tools/extract_bindrune_examples.py /path/to/guide.pdf
No redraw, added rune strokes, text pages or full guide publication.
"""
from pathlib import Path
import hashlib, json, sys
import fitz
source=Path(sys.argv[1]); digest=hashlib.sha256(source.read_bytes()).hexdigest()
if digest!='2aa5a79c0e50cabdb46c501300eaffc46f6fe0cee3d64f323f779e745605ea97': raise SystemExit('Unexpected guide revision; review source before extracting.')
page=fitz.open(source)[0]
root=Path(__file__).resolve().parents[1]/'assets/configurator-bindrune'
root.mkdir(parents=True,exist_ok=True)
def xy(p): return f'{p.x:.5f},{p.y:.5f}'
def color(c): return 'none' if c is None else '#'+''.join(f'{round(v*255):02x}' for v in c)
rects=[fitz.Rect(94.0748,209.76361,178.05119,982.34631),fitz.Rect(283.99609,209.76361,367.97241,982.34631),fitz.Rect(473.91730,209.76361,557.89368,982.34631),fitz.Rect(663.83862,209.76361,747.81500,982.34631)]
for index,rect in enumerate(rects,1):
    clip=rect+(-2,-2,2,2);paths=[]
    for draw in page.get_drawings():
        if not clip.contains(draw['rect']):continue
        segments=[];last=None
        for item in draw['items']:
            kind=item[0]
            if kind in ('l','c'):
                if last is None or abs(last-item[1])>.001: segments.append('M'+xy(item[1]))
                segments.append(('L' if kind=='l' else 'C')+' '.join(xy(p) for p in item[2:]));last=item[-1]
            elif kind in ('re','qu'):
                r=item[1]; pts=[r.tl,r.tr,r.br,r.bl] if kind=='re' else [r.ul,r.ur,r.lr,r.ll]
                segments.append('M'+xy(pts[0])+' L'+' '.join(xy(p) for p in pts[1:])+' Z');last=None
            else: raise ValueError(kind)
        if draw.get('closePath'):segments.append('Z')
        attrs=f'fill="{color(draw.get("fill"))}" stroke="{color(draw.get("color"))}" stroke-width="{draw.get("width",1)}" stroke-linejoin="round" stroke-linecap="round"'
        if draw.get('even_odd'):attrs+=' fill-rule="evenodd"'
        paths.append('<path d="'+' '.join(segments)+'" '+attrs+'/>')
    assert len(paths)>20
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{clip.x0} {clip.y0} {clip.width} {clip.height}"><title>RavenForge Bindrune v5 — C{index} original layout example</title>'+''.join(paths)+'</svg>'
    (root/f'c{index}.svg').write_text(svg)
(root/'README.md').write_text('# Bindrune layout examples\n\nSource: `RavenForge_Bindrune_Inlay_Design_Guide_v5.0.pdf`, 2026-09-09, page 1.\n\nSHA-256: `'+digest+'`.\n\nC1–C4 are extracted vector illustrations from the existing design guide, with no new rune strokes. Source drawings assume a 5-string, 34-inch, 24-fret board; these are layout examples, not approved geometry for every model. The guide remains private; only requested example illustrations are included. Extract with `tools/extract_bindrune_examples.py`.\n')
print('Extracted four original bindrune layouts from page 1;',digest)
