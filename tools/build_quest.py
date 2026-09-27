"""Build Quest from one multilingual source and a shared server/browser renderer.

This idempotent migration touches only the Quest section, its obsolete renderer,
and its own marked asset block. Missing sources or unexpected legacy anchors fail
before index.html is written.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANGS = ('ko', 'en', 'de')

def build():
    source = json.loads((ROOT / 'assets/quest-roadmap.json').read_text(encoding='utf-8'))
    assert source['schemaVersion'] == 1
    assert len(source['quests']) == 6
    ids = [q['id'] for q in source['quests']]
    assert len(ids) == len(set(ids)) and all(re.fullmatch(r'[a-z]+', id) for id in ids)
    assert set(source['priorities']).issubset(ids)
    for value in source['ui'].values():
        assert set(value) == set(LANGS), 'Missing UI translation'
    articles = {a['id']: a for a in json.loads((ROOT / 'research/research-index.json').read_text(encoding='utf-8'))['articles']}
    source['sources'] = {}
    for quest in source['quests']:
        assert set(quest['copy']) == set(LANGS)
        for lang in LANGS:
            assert set(quest['copy'][lang]) == {'title','question','stage','evidence','problem','position','checks','decision'}
            assert len(quest['copy'][lang]['checks']) == 3
        for ref in quest['references']:
            article = articles[ref['id']]
            assert set(ref['role']) == set(LANGS)
            source['sources'][ref['id']] = {lang: {key: article[lang][key] for key in ('title', 'link')} for lang in LANGS}
            for lang in LANGS:
                path = article[lang]['link']
                assert path.startswith('research/') and '..' not in path
                assert (ROOT / path).is_file(), f'Missing source: {path}'
    payload = json.dumps(source, ensure_ascii=False, separators=(',', ':'))
    renderer = "const fs=require('fs');const q=require('./assets/quest-roadmap.js');process.stdout.write(q.markup(JSON.parse(fs.readFileSync(0,'utf8')),'en'));"
    markup = subprocess.check_output(['node', '-e', renderer], input=payload, text=True, cwd=ROOT)
    with (ROOT / 'index.html').open(encoding='utf-8', newline='') as fh:
        html = fh.read()
    section = '<section id="quest" class="page-section mb-16 pt-4" aria-labelledby="quest-title">\n' + markup + '\n        </section>'
    # The section ends immediately before the Research section/comment. Inner
    # sections in the new markup are intentionally not matched as the boundary.
    start = html.index('<section id="quest"')
    research = html.index('<section id="research"', start)
    end = html.rfind('</section>', start, research) + len('</section>')
    assert end > start and end < research
    html = html[:start] + section + html[end:]
    # Replace the legacy proposal rendering block once, leaving other modals intact.
    legacy_start = html.find('            function applyAccordionState()')
    if legacy_start != -1:
        legacy_end = html.index('            function showModal(luthier)', legacy_start)
        html = html[:legacy_start] + '            function renderProposals() {\n                if (window.RavenForgeQuest) window.RavenForgeQuest.render(currentLang);\n            }\n\n' + html[legacy_end:]
    assert 'window.RavenForgeQuest.render(currentLang)' in html
    # Remove obsolete final overrides; all current Quest copy lives in JSON.
    html = re.sub(r'        translations\.(?:en|de|ko)\.proposalsData = \[[\s\S]*?\n        \];', '', html)
    def digest(file):
        return hashlib.sha256((ROOT / file).read_bytes()).hexdigest()[:12]
    safe_payload = payload.replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    block = '\n'.join([
        '<!-- RF:QUEST START -->',
        f'<link rel="stylesheet" href="assets/quest-roadmap.css?v={digest("assets/quest-roadmap.css")}">',
        f'<script type="application/json" id="rf-quest-data">{safe_payload}</script>',
        f'<script src="assets/quest-roadmap.js?v={digest("assets/quest-roadmap.js")}"></script>',
        '<!-- RF:QUEST END -->'
    ])
    pattern = r'<!-- RF:QUEST START -->[\s\S]*?<!-- RF:QUEST END -->'
    if re.search(pattern, html):
        html = re.sub(pattern, lambda _: block, html, count=1)
    else:
        html = html.replace('</body>', block + '\n</body>', 1)
    with (ROOT / 'index.html').open('w', encoding='utf-8', newline='') as fh:
        fh.write(html)
    print(f'Quest {source["version"]}: {len(ids)} quests, {len(source["sources"])} linked sources, KO/EN/DE; static fallback built.')

if __name__ == '__main__':
    build()
