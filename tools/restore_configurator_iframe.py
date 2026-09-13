import re
from pathlib import Path

INDEX = Path('index.html')

if not INDEX.exists():
    raise SystemExit('index.html not found')

with INDEX.open('r', encoding='utf-8', newline='') as fh:
    html = fh.read()

embed = '''                <div class="w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200" style="height: 900px;">
                    <iframe src="configurator.html" width="100%" height="100%" style="border: none;" title="RavenForge Bass Configurator" loading="lazy"></iframe>
                </div>'''

if 'iframe src="configurator.html"' not in html:
    pattern = re.compile(
        r'\s*<div class="w-full bg-slate-50 rounded-xl border border-slate-200 px-6 py-10 text-center">\s*'
        r'<a href="configurator\.html"[\s\S]*?</a>\s*</div>',
        re.I,
    )
    html, count = pattern.subn('\n' + embed, html, count=1)
    if count != 1:
        raise SystemExit('Configurator launch panel was not found; refusing to make an ambiguous edit.')

with INDEX.open('w', encoding='utf-8', newline='') as fh:
    fh.write(html)

print('Configurator iframe is present in index.html.')
