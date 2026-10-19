#!/usr/bin/env python3
"""Extract display contours from the user-supplied GRAMR PDF (no CAD redesign).
Usage: python tools/extract_gramr_preview_geometry.py /path/to/source.pdf
Requires PyMuPDF. Source SHA is checked to avoid silently using another revision.
The original PDF is not modified or copied into the public repository.
"""
import hashlib, json, math, sys
from pathlib import Path
import fitz
ROOT=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]); digest=hashlib.sha256(source.read_bytes()).hexdigest()
EXPECTED='3edaab849e644ba2c1aa2e28abdbed9c92a246cb7a3ca5591da152d22c609b1d'
if digest!=EXPECTED: raise SystemExit('Unexpected PDF revision; review extraction indices before proceeding.')
page=fitz.open(source)[0]; drawings=page.get_drawings(); matrix=page.rotation_matrix

def segments(ids):
    return [[(item[0],[tuple(v*matrix) for v in item[1:]]) for item in drawings[i]['items']] for i in ids]

def contour(ids,start=None):
    groups=segments(ids)
    if start is None:start=groups[0][0][1][0]
    here=start; ordered=[]; gaps=[]
    while groups:
        candidates=[(math.dist(here,g[0][1][0]),i,False) for i,g in enumerate(groups)]+[(math.dist(here,g[-1][1][-1]),i,True) for i,g in enumerate(groups)]
        gap,index,reverse=min(candidates);g=groups.pop(index)
        if reverse:g=[(kind,list(reversed(points))) for kind,points in reversed(g)]
        if gap>.2:raise ValueError(('Unexpected contour gap',gap,ids))
        gaps.append(gap);ordered.extend(g);here=g[-1][1][-1]
    result='M'+xy(ordered[0][1][0])
    for kind,points in ordered:
        if kind not in ('l','c'):raise ValueError(kind)
        result+=(' L' if kind=='l' else ' C')+' '.join(xy(p) for p in points[1:])
    return result+' Z',max(gaps)

def xy(p):return f'{p[0]/2:.4f},{p[1]/2:.4f}'
def path(i):return contour([i])[0]
def center(i):
    r=drawings[i]['rect']*matrix
    return [round((r.x0+r.x1)/4,4),round((r.y0+r.y1)/4,4)]
body_ids=list(range(1066,1076))+list(range(1077,1090))
body,body_gap=contour(body_ids,(1275.49,630.73))
head,head_gap=contour(list(range(1096,1104)),(437.11,526.45))
jack,_=contour(list(range(1369,1376)))
board=[[437.11/2,526.49/2],[437.11/2,618.44/2],[1491.34/2,632.12/2],[1491.34/2,512.6/2]]
frets=[[[round(v/2,4) for v in point*matrix] for point in drawings[i]['items'][0][1:]] for i in range(72,96)]
data=dict(kind='drawing',status='drawing',source='assets/configurator-gramr-reference.svg',strings=6,horizontal=True,
 imageSize=[2160,880], transform='translate(0 0)',portraitTransform='translate(590 0) rotate(90)',
 views=dict(full='0 90 1080 390',body='540 100 530 390',neck='205 235 555 110',head='15 210 220 145'),
 portrait=dict(full='105 0 410 1080',body='105 540 390 530',neck='245 205 110 555',head='235 15 145 220'),
 body=body,head=head,pickguard=path(139),board=board,frets=frets,
 pickups=[dict(x=1517.14/2,y=498.11/2,w=(1597.81-1517.14)/2,h=(646.64-498.11)/2),dict(x=1689.58/2,y=497.66/2,w=(1771.09-1689.58)/2,h=(647.06-497.66)/2)],
 pickupOutlines=[path(140),path(141)],bridge=[[1832.92/2,514.76/2],[1832.92/2,629.99/2]],bridgeOutline=path(163),
 controls=[center(218),center(1300)],tuners=[center(i) for i in reversed(range(1090,1096))],
 pickguardScrews=[center(i) for i in range(146,159)],jack=jack,selector=[[1679.14/2,383.12/2],[1725.49/2,349.73/2]],
 provenance=dict(sourceName=source.name,sha256=digest,page=1,pdfRotation=270,displayScale=.5,bodyDrawingIndices=body_ids,headDrawingIndices=list(range(1096,1104)),pickguardDrawingIndex=139,fretDrawingIndices=list(range(72,96)),maxBodyJoinGapPDFPoints=body_gap,maxHeadJoinGapPDFPoints=head_gap,scope='Front contours and placement only. No change to current quote, pricing, neck joint, materials or build specification.'))
js='/* Extracted from the user-supplied drawing. Rebuild with tools/extract_gramr_preview_geometry.py. */\n(function(root,factory){const api=factory();if(typeof module===\'object\'&&module.exports)module.exports=api;if(root)root.RavenForgeGramrDrawing=api;})(typeof globalThis!==\'undefined\'?globalThis:this,function(){return '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';});\n'
(ROOT/'assets/configurator-gramr-geometry.js').write_text(js)
parts=[f'<path d="{body}"/>',f'<path d="{head}"/>',f'<polygon points="{" ".join(",".join(str(v) for v in p) for p in board)}"/>',f'<path d="{data["pickguard"]}"/>',*[f'<path d="{d}"/>' for d in data['pickupOutlines']],f'<path d="{data["bridgeOutline"]}"/>',f'<path d="{jack}"/>']
for a,b in frets:parts.append(f'<path d="M{a[0]},{a[1]} L{b[0]},{b[1]}"/>')
for x,y in data['tuners']+data['controls']:parts.append(f'<circle cx="{x}" cy="{y}" r="5"/>')
svg='<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="880" viewBox="0 80 1080 440"><title>GRAMR — front geometry extracted from supplied drawing</title><rect width="1080" height="600" fill="#f6f4ed"/><g fill="none" stroke="#343637" stroke-width=".65">'+''.join(parts)+'</g></svg>'
(ROOT/'assets/configurator-gramr-reference.svg').write_text(svg)
print('Extracted body/head/pickguard, 24 fret positions, 6 tuner bores and part placement; max join gap',max(body_gap,head_gap),'PDF points')
