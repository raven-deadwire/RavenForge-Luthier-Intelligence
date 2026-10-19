"""Extract only white artwork from the original v5 guide SVGs; never the board/frets."""
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
motifs = {}
for index in range(1, 5):
    svg = ET.parse(root / f'assets/configurator-bindrune/c{index}.svg').getroot()
    board = next(p for p in svg if p.get('fill') == '#101415')
    numbers = list(map(float, re.findall(r'-?\d+(?:\.\d+)?', board.get('d'))))
    paths = []
    for p in svg:
        if p.get('fill') != '#ffffff' and p.get('stroke') != '#ffffff':
            continue
        width = p.get('stroke-width', '0')
        paths.append({'d': p.get('d'), 'fill': p.get('fill') == '#ffffff',
                      'width': 0 if width == 'None' else float(width)})
    motifs[f'c{index}'] = {'board': [numbers[i:i + 2] for i in range(0, 8, 2)], 'paths': paths}
header = "/* White motif paths extracted unchanged from the existing v5 guide SVGs. */\n"
wrapper = "(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeBindruneMotifs=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){return "
(root / 'assets/configurator-bindrune-motifs.js').write_text(header + wrapper + json.dumps(motifs, separators=(',', ':')) + ';});\n')
