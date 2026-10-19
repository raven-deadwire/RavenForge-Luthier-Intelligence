#!/usr/bin/env python3
"""Extract ASKR #001 / EMBLA #002 front projections, without changing specs.

Use the exact supplied PDFs. Contours are original vectors, with a single
unseen closure under the fretboard. No raster trace or generated instrument.
The PDF supplies display placement, not approval for other selected hardware.
"""
import hashlib
import json
import math
from pathlib import Path
import sys
import fitz

ROOT = Path(__file__).resolve().parents[1]
CONFIG = {
    'ASKR': dict(filename='RavenForge_ASKR_MS5001_john0-Model(1).pdf',
        sha='94962ee6ea46a1d87c35910537aea98d13adfd9a2ea47c372ae1cbc9b89b6fc5',
        body=[0,1,2,941,942,943,944,945,946,604,956,957],
        body_start=(1556.626220703125,811.13232421875),
        head=[947,949,950,951,952,953,954,968,969],
        head_start=(373.06005859375,788.47998046875),
        board=[(373.06,788.48),(430.60,699.41),(1710.52,672.68),(1771.66,814.94)],
        frets=list(range(12,36)),pickup=[605,606],
        tuners=[7016,7049,7082,7114,7148],
        controls=[519,530,543,562,574],strings=list(range(7,12)),
        origin=(30,410),height=650,length=2290,units=.946,
        pickup_reference_mm=[117.5,38],
        bridge_rect=(2034.4,657.5,2225.6,830.3)),
    'EMBLA': dict(filename='RavenForge_EMBLA_002_LYW_34_5ST-Model.pdf',
        sha='b5953882c1c5018d5eede0fa73f8e16dfd113e772de44f0629dd7614e82aaef5',
        body=[4033,4034,4035,*range(4037,4051),4060,4061],
        body_start=(1277.8861083984375,724.64404296875),
        head=[*range(4026,4033),4036],head_start=(340.18,699.95),
        board=[(340.18,699.95),(340.18,625.34),(1441.69,596.09),(1441.69,728.99)],
        frets=[5,*range(8,19),*range(22,31),34,35,36],pickup=[39,49],
        tuners=[8495,8490,8485,8480,8475],
        controls=[7821,7823,7825,7827,7829],strings=[8494,8489,8484,8479,8474],
        origin=(30,355),height=640,length=1880,units=.8236,
        pickup_reference_mm=[100,36],bridge_rect=(1762.72,580.16,1858.27,744.89)),
}


def extract(model, folder):
    cfg=CONFIG[model];source=folder/cfg['filename']
    digest=hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != cfg['sha']: raise ValueError('Unexpected PDF revision: '+model)
    doc=fitz.open(source);page=doc[0];ds=page.get_drawings();matrix=page.rotation_matrix
    def point(v):
        x,y=v
        return [round((cfg['origin'][1]+cfg['height']-y)/2,4),round((x-cfg['origin'][0])/2,4)]
    def xy(v):return ','.join(map(str,point(v)))
    def segments(i):
        result=[]
        for item in ds[i]['items']:
            if item[0] in ('l','c'):result.append((item[0],[tuple(v*matrix) for v in item[1:]]))
            elif item[0]=='qu':
                q=item[1];ps=[tuple(v*matrix) for v in (q.ul,q.ur,q.lr,q.ll)]
                result.extend(('l',[ps[j],ps[(j+1)%4]]) for j in range(4))
            elif item[0]=='re':
                r=item[1];ps=[tuple(v*matrix) for v in (r.tl,r.tr,r.br,r.bl)]
                result.extend(('l',[ps[j],ps[(j+1)%4]]) for j in range(4))
            else: raise ValueError(item[0])
        return result
    def contour(ids,start=None,closed=True,tip=False):
        groups=[segments(i) for i in ids];here=start or groups[0][0][1][0];ordered=[];gaps=[]
        while groups:
            gap,idx,reverse=min([(math.dist(here,g[0][1][0]),i,False) for i,g in enumerate(groups)]+[(math.dist(here,g[-1][1][-1]),i,True) for i,g in enumerate(groups)])
            g=groups.pop(idx)
            if reverse:g=[(kind,ps[::-1]) for kind,ps in g[::-1]]
            if gap>.2:
                # The original EMBLA horn's round cap is a separate two-curve
                # path; discover it only by both exact endpoints, never smooth it.
                candidates=[]
                if tip:
                    for j,d in enumerate(ds):
                        if len(d['items'])>3 or any(s[0] not in ('l','c') for s in d['items']):continue
                        ss=segments(j)
                        for rev in [False,True]:
                            st=[(k,ps[::-1]) for k,ps in ss[::-1]] if rev else ss
                            err=max(math.dist(here,st[0][1][0]),math.dist(g[0][1][0],st[-1][1][-1]))
                            if err<.2:candidates.append((err,j,st))
                if not candidates:raise ValueError((model,'unresolved contour gap',gap,here,g[0][1][0]))
                err,j,st=min(candidates,key=lambda a:a[0]);ordered.extend(st);gaps.append(err)
                if j not in ids:ids.append(j)
            else:gaps.append(gap)
            ordered.extend(g);here=g[-1][1][-1]
        result='M'+xy(ordered[0][1][0])
        for kind,ps in ordered:result+=(' L' if kind=='l' else ' C')+' '.join(xy(v) for v in ps[1:])
        return result+(' Z' if closed else ''),max(gaps)
    def centre(i):
        r=ds[i]['rect']*matrix
        return point(((r.x0+r.x1)/2,(r.y0+r.y1)/2))
    body,bgap=contour(cfg['body'],cfg['body_start'],tip=True)
    head,hgap=contour(cfg['head'],cfg['head_start'])
    board=[point(v) for v in cfg['board']]
    frets=[[point(v*matrix) for v in ds[i]['items'][0][1:]] for i in cfg['frets']]
    pickups=[];outlines=[]
    for i in cfg['pickup']:
        ps=[point(v) for _,ss in segments(i) for v in ss]
        # Rotated rectangle in ASKR, orthogonal rounded cover in EMBLA.
        if model=='ASKR':
            q=ds[i]['items'][0][1];corners=[point(v*matrix) for v in (q.ul,q.ur,q.lr,q.ll)]
            edges=[(math.dist(corners[j],corners[(j+1)%4]),j) for j in range(4)]
            _,j=max(edges);a,b=corners[j],corners[(j+1)%4]
            if a[0]>b[0]:a,b=b,a
            w=math.dist(a,b);h=min(x[0] for x in edges);angle=math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))
        else:w=max(x for x,y in ps)-min(x for x,y in ps);h=max(y for x,y in ps)-min(y for x,y in ps);angle=0
        r=ds[i]['rect']*matrix;cx,cy=point(((r.x0+r.x1)/2,(r.y0+r.y1)/2))
        pickups.append(dict(x=round(cx-w/2,4),y=round(cy-h/2,4),w=round(w,4),h=round(h,4),angle=round(angle,5)))
        outlines.append(contour([i])[0])
    strings=[]
    for i in cfg['strings']:
        seg=ds[i]['items'][0];strings.append([point(v*matrix) for v in seg[1:]])
    bridge=[strings[0][-1],strings[-1][-1]]
    tuners=[centre(i) for i in cfg['tuners']]
    controls=[centre(i) for i in cfg['controls']]
    # The native control bank is used for five knobs. Other electronics are
    # explicitly fitted proposals within the same area, not source hole centres.
    a,b,c,d,e=controls
    layouts={3:[a,c,e],4:[a,b,d,e],5:controls,6:[[x-8,y] for x,y in controls]+[[225,1000]]}
    if model=='EMBLA':
        layouts[6]=[[234,766],[264,786],[234,811],[274,830],[234,856],[267,869]]
    coils=[[225,789],[222,837]] if model=='EMBLA' else [[210,1090],[243,1090]]
    kill=[211,879] if model=='EMBLA' else [177,1102]
    # Preserve actual PDF bridge drawing strokes, excluding labels and rear
    # ghost parts. EMBLA shows the STEEL basic plate, ASKR individual modules.
    bridge_indices=list(range(5715,5755)) if model=='ASKR' else list(range(8498,8517))
    bridge_lines=[]
    for i in bridge_indices:
        for kind,ps in segments(i):bridge_lines.append('M'+xy(ps[0])+(' L' if kind=='l' else ' C')+' '.join(xy(v) for v in ps[1:]))
    W,H=cfg['height']/2,cfg['length']/2
    data=dict(kind='bass-drawing',source=f'assets/configurator-front/{model.lower()}-front-reference.svg',
        body=body,head=head,board=board,frets=frets,pickups=pickups,pickupOutlines=outlines,
        controls=controls,controlLayouts=layouts,controlProposals=dict(coils=coils,kill=kill),
        tuners=tuners,tunerAnchors=[[x,y,180 if x<sum(p[0] for p in board)/4 else 0] for x,y in tuners],
        unitsPerMm=cfg['units'],pickupReferenceMM=cfg['pickup_reference_mm'],strings=5,stringLines=strings,
        bridge=bridge,bridgeArtwork=' '.join(bridge_lines),bridgeOutlines=[contour([i])[0] for i in ([5715,5723,5731,5739,5747] if model=='ASKR' else [8498])],
        hardware='M'+' L'.join(','.join(map(str,point(v))) for v in [(cfg['bridge_rect'][0],cfg['bridge_rect'][1]),(cfg['bridge_rect'][2],cfg['bridge_rect'][1]),(cfg['bridge_rect'][2],cfg['bridge_rect'][3]),(cfg['bridge_rect'][0],cfg['bridge_rect'][3])])+' Z',
        transform=f'translate(0 {W}) rotate(-90)',portraitTransform='translate(0 0)',
        views=dict(full=f'0 0 {H} {W}'),portrait=dict(full=f'0 0 {W} {H}'),imageSize=[W,H],bodyCenter=sum(p[0] for p in board)/4,
        provenance=dict(sourceName=source.name,sha256=digest,page=1,pdfRotation=page.rotation,displayScale=.5,
            transform=f'x=({cfg["origin"][1]+cfg["height"]}-pdfY)/2; y=(pdfX-{cfg["origin"][0]})/2',
            indices={k:cfg[k] for k in ['body','head','frets','pickup','tuners','controls','strings']},
            bridgeDrawingIndices=bridge_indices,maxBodyJoinGapPDFPoints=bgap,maxHeadJoinGapPDFPoints=hgap,
            closure='Body closes under the fingerboard; not a neck-pocket toolpath.',
            scope='Exact source front silhouette and fret lines. Source hardware anchors are prototype display references; selected replacements and EQ layouts are not approved manufacturing positions.'))
    shapes=[f'<path d="{body}"/>',f'<path d="{head}"/>',f'<polygon points="{" ".join(",".join(map(str,p)) for p in board)}"/>']
    shapes += [f'<path d="{d}"/>' for d in outlines]
    shapes += [f'<path d="M{a[0]},{a[1]} L{b[0]},{b[1]}"/>' for a,b in frets]
    shapes += [f'<circle cx="{x}" cy="{y}" r="5"/>' for x,y in tuners+controls]
    shapes += [f'<path d="{data["bridgeArtwork"]}"/>']
    target=ROOT/data['source'];target.parent.mkdir(exist_ok=True)
    target.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><title>{model} supplied front drawing geometry</title><g fill="none" stroke="#aaa99e" stroke-width=".6">'+''.join(shapes)+'</g></svg>')
    print(model,'front contour gaps',bgap,hgap,'bridge segments',len(bridge_indices))
    return data


if __name__=='__main__':
    data={model:extract(model,Path(sys.argv[1])) for model in CONFIG}
    (ROOT/'assets/configurator-bass-front-geometry.js').write_text('/* Original PDF vectors; rebuild with tools/extract_bass_front_geometry.py. */\n(function(root,factory){const api=factory();if(typeof module===\'object\'&&module.exports)module.exports=api;if(root)root.RavenForgeBassFront=api;})(typeof globalThis!==\'undefined\'?globalThis:this,function(){return '+json.dumps(data,separators=(',',':'))+';});\n')
