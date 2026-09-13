import re
from pathlib import Path

path = Path('index.html')
with path.open('r', encoding='utf-8', newline='') as fh:
    text = fh.read()
text = re.sub(
    r'<title>[\s\S]*?</title>',
    '<title>RavenForge Luthier Intelligence — Instrument Design, Research & Prototypes</title>',
    text,
    count=1,
    flags=re.I,
)
with path.open('w', encoding='utf-8', newline='') as fh:
    fh.write(text)
