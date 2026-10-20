#!/usr/bin/env python3
"""Extract only rear display geometry from the supplied ASKR/EMBLA PDFs.

Original PDFs are not modified or redistributed. Ghosted front parts, text and
dimensions are excluded. Source SHA and segment indices make extraction auditable.
"""
import hashlib
import json
import math
from pathlib import Path
import sys
import fitz

ROOT = Path(__file__).resolve().parents[1]
CONFIG = {
    'EMBLA': dict(filename='RavenForge_EMBLA_002_LYW_34_5ST-Model.pdf',
        body=list(range(4714,4718))+list(range(4719,4737))+[11762,11763,11764],
        head=list(range(4707,4714))+[4718], bolts=[9379,9383,9385,9381,9387],
        cavity=list(range(7812,7814))+[7815,7816,7817,7819],battery=list(range(5470,5478)),
        neck=[(340.17,1399.28),(1277.89,1374.59),(1281.09,1420.97),(1358.05,1501.25),(340.17,1473.89)],
        heel=[11765,11766],joint=[4733,4734,4732],scoop=[5468],
        tuners=[[10418,10419],[10440,10441],[10463,10464],[10485,10486],[10507,10508]],
        origin=[30,1120],view=[0,0,1880,640]),
    'ASKR': dict(filename='RavenForge_ASKR_MS5001_john0-Model(1).pdf',
        body=[5770,5771,5772,5852,5853,5854,5855,5856,5857,5841,5867,5868],
        head=list(range(5860,5866))+[5877,5878,5858], bolts=[8178,8182,8190,8186,8194],
        cavity=list(range(5869,5874))+[5889,5890,5956],battery=list(range(8638,8940,2)),
        neck=[(373.06,1550.21),(1556.62,1527.56),(1610.77,1663.91),(430.60,1639.28)],
        heel=[5856],joint=[5856],scoop=[5876],
        tuners=[[7012,7013],[7045,7046],[7078,7079],[7110,7111],[7144,7145]],
        origin=[30,1290],view=[0,0,2290,650]),
}


def extract(model, source):
    cfg=CONFIG[model]
    expected={'ASKR':'94962ee6ea46a1d87c35910537aea98d13adfd9a2ea47c372ae1cbc9b89b6fc5','EMBLA':'b5953882c1c5018d5eede0fa73f8e16dfd113e772de44f0629dd7614e82aaef5'}
    if hashlib.sha256(source.read_bytes()).hexdigest()!=expected[model]:raise ValueError('Unexpected source revision: '+model)
    page=fitz.open(source)[0]
    drawings=page.get_drawings()
    matrix=page.rotation_matrix
    ox,oy=cfg['origin']
    def xy(p): return f'{(p[0]-ox)/2:.4f},{(p[1]-oy)/2:.4f}'
    def groups(ids):
        return [[(item[0],[tuple(p*matrix) for p in item[1:]]) for item in drawings[i]['items']] for i in ids]
    def contour(ids,closed=True,tolerance=.5,start=None):
        remaining=groups(ids);here=start or remaining[0][0][1][0];ordered=[];gaps=[]
        while remaining:
            candidates=[(math.dist(here,g[0][1][0]),i,False) for i,g in enumerate(remaining)]+[(math.dist(here,g[-1][1][-1]),i,True) for i,g in enumerate(remaining)]
            gap,index,reverse=min(candidates);g=remaining.pop(index)
            if reverse:g=[(kind,list(reversed(points))) for kind,points in reversed(g)]
            if gap>tolerance:raise ValueError((model,ids,'gap',gap))
            gaps.append(gap);ordered.extend(g);here=g[-1][1][-1]
        result='M'+xy(ordered[0][1][0])
        for kind,points in ordered:
            if kind not in ('l','c'):raise ValueError(kind)
            result+=(' L' if kind=='l' else ' C')+' '.join(xy(p) for p in points[1:])
        return result+(' Z' if closed else ''),max(gaps)
    def single(i,closed=True):return contour([i],closed)[0]
    body,gap=contour(cfg['body'])
    # Head is an open perimeter at the nut; Z closes only the short neck seam.
    head,hgap=contour(cfg['head'],tolerance=.5,start=(340.17,1399.28) if model=='EMBLA' else (373.06,1550.21))
    cavity,cgap=contour(cfg['cavity'])
    battery,bgap=contour(cfg['battery'],tolerance=.5)
    bolts=[]
    for i in cfg['bolts']:
        r=drawings[i]['rect']*matrix
        bolts.append([round(((r.x0+r.x1)/2-ox)/2,4),round(((r.y0+r.y1)/2-oy)/2,4),round(r.width/4,4)])
    data=dict(kind='rear-drawing',source=f'assets/configurator-rear/{model.lower()}-rear-reference.svg',
        body=body,head=head,neck='M'+' L'.join(xy(p) for p in cfg['neck'])+' Z',
        cavity=cavity,battery=battery,bolts=bolts,
        heel=' '.join(single(i,False) for i in cfg['heel']),jointSeam=contour(cfg['joint'],False,start=cfg['neck'][1])[0],scoop=' '.join(single(i,False) for i in cfg['scoop']),
        tuners=[dict(housing=single(pair[0]),key=single(pair[1])) for pair in cfg['tuners']],
        viewBox='0 0 '+str(cfg['view'][2]/2)+' '+str(cfg['view'][3]/2),
        portraitBox=f'0 0 {cfg["view"][3]/2} {cfg["view"][2]/2}',
        portraitTransform=f'translate({cfg["view"][3]/2} 0) rotate(90)',
        provenance=dict(sourceName=source.name,sha256=hashlib.sha256(source.read_bytes()).hexdigest(),page=1,
            indices={k:cfg[k] for k in ['body','head','bolts','cavity','battery','heel','joint','scoop','tuners']},
            rotation=page.rotation,displayScale=.5,offset=cfg['origin'],maxBodyJoinGap=gap,maxHeadJoinGap=hgap,maxCavityJoinGap=cgap,maxBatteryJoinGap=bgap,
            scope='Rear geometry/5-bolt positions only; prototype electronics and pricing never override the active platform.'))
    out=ROOT/'assets/configurator-rear';out.mkdir(exist_ok=True)
    shapes=[f'<path d="{data[key]}"/>' for key in ['body','head','neck','cavity','battery','heel','scoop']]
    shapes += [f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x,y,r in bolts]
    shapes += [f'<path d="{d}"/>' for tuner in data['tuners'] for d in tuner.values()]
    (ROOT/data['source']).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{data["viewBox"]}"><title>{model} rear geometry from supplied drawing — bolt-on</title><g fill="none" stroke="#b9b9ac" stroke-width=".6">'+''.join(shapes)+'</g></svg>')
    print(model,'max gaps',gap,hgap,cgap,bgap)
    return data


if __name__=='__main__':
    folder=Path(sys.argv[1]);data={model:extract(model,folder/cfg['filename']) for model,cfg in CONFIG.items()}
    target=ROOT/'assets/configurator-bass-rear-geometry.js'
    target.write_text("/* Extracted rear drawing geometry; see tools/extract_bass_rear_geometry.py. */\n(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeBassRear=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){return "+json.dumps(data,separators=(',',':'))+';});\n')
