"""Render the three L04 manuscripts using the established L13 visual format."""
import json
from html import escape as e
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE / 'content.json').read_text())
SITE = 'https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence'
LANGS = ('ko', 'en', 'de')
LABELS = {
 'ko': ['인문 연구일지', '문서 목적', '핵심 입장 — RavenForge의 종합', '필드', '기록 내용', '개념도 · 측정 데이터 아님', '외부 문헌과 확인 범위', '선행 연구', '완료와 미완료', '연구 목록'],
 'en': ['Humanities research journal', 'Purpose', 'Position — RavenForge synthesis', 'Field', 'Record', 'Conceptual schematic · not measured data', 'References and verification scope', 'Earlier studies', 'Completed and pending', 'Research archive'],
 'de': ['Geisteswissenschaftliches Forschungsjournal', 'Zweck', 'Position — RavenForges Synthese', 'Feld', 'Dokumentation', 'Begriffliches Schema · keine Messdaten', 'Literatur und Prüfumfang', 'Vorangehende Studien', 'Abgeschlossen und ausstehend', 'Forschungsarchiv']
}
REFS = [
 ('Polanyi, M. (1965). The Structure of Consciousness. Brain, 88, 799–810. Authorized web text follows Knowing and Being (1969), 211–224.', 'https://www.polanyisociety.org/mp-structure.htm'),
 ('Polanyi, M. The Tacit Dimension. University of Chicago Press, 2009 edition; foreword by Amartya Sen. Bibliographic record and publisher description.', 'https://press.uchicago.edu/ucp/books/book/chicago/T/bo6035368'),
 ('Sennett, R. The Craftsman. Yale University Press, 2009 paperback, ISBN 9780300151190. Bibliographic record and publisher description.', 'https://yalebooks.yale.edu/book/9780300151190/the-craftsman/'),
 ('Sennett, R. The Craftsman. Official table of contents, Yale University Press.', 'https://drupal.yalebooks.yale.edu/sites/default/files/files/TOC/sennett_craftsman.pdf')
]

def table(rows, headers=None):
    head = '<thead><tr>' + ''.join(f'<th scope="col">{e(x)}</th>' for x in headers) + '</tr></thead>' if headers else ''
    body = ''.join('<tr>' + ''.join(f'<th scope="row">{e(x)}</th>' if i == 0 else f'<td>{e(x)}</td>' for i, x in enumerate(row)) + '</tr>' for row in rows)
    return '<div class="table-wrap"><table>' + head + '<tbody>' + body + '</tbody></table></div>'

meta = {'id': 'L04', 'date': '2026-11-05', 'category': 'liberal'}
for lang, d in DATA.items():
    label = LABELS[lang]
    title = 'The Epistemology of Craft — ' + d['subtitle']
    meta[lang] = {'title': title, 'excerpt': d['status'] + '. ' + d['purpose'], 'link': f'research/L04/{lang}.html'}
    page = f'<!doctype html>\n<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>L04 — {e(title)} · RavenForge</title><meta name="description" content="{e(d["purpose"])}"><link rel="canonical" href="{SITE}/research/L04/{lang}.html">\n'
    page += ''.join(f'<link rel="alternate" hreflang="{x}" href="{SITE}/research/L04/{x}.html">\n' for x in LANGS)
    page += f'<link rel="alternate" hreflang="x-default" href="{SITE}/research/L04/en.html"><link rel="stylesheet" href="l04.css"></head><body><main>\n'
    page += f'<div class="top"><div><div class="brand">RAVENFORGE</div><p class="kicker">{label[0]} — L04</p></div><nav class="langs" aria-label="Language">'
    page += ''.join(f'<a href="{x}.html" hreflang="{x}"' + (' aria-current="page"' if x == lang else '') + f'>{x.upper()}</a>' for x in LANGS) + '</nav></div>\n'
    page += f'<h1>L04 — The Epistemology of Craft</h1><p class="sub">{e(d["subtitle"])}</p><p class="date">2026-11-05 · v1.0 · {e(d["status"])}</p>\n'
    page += f'<div class="purpose"><strong>{label[1]}</strong>{e(d["purpose"])}</div>'
    page += table([['Code', 'L04 — The Epistemology of Craft'], ['Focus', 'tacit knowing · subsidiary / focal awareness · craft judgment'], ['Evidence', 'Polanyi [1–2] · Sennett [3–4]'], ['RavenForge link', 'Craft Judgment Record'], ['Upstream', 'L02 · L03 · L13'], ['Downstream', 'L05 — Craft, CNC and the Location of Judgment'], ['Status', d['status']], ['Date / revision', '2026-11-05 / v1.0']])
    page += f'<aside class="box"><strong>{label[2]}</strong>{e(d["thesis"])}</aside>\n'
    for n, (heading, body) in enumerate(d['sections'], 1):
        # References are linked without changing the authored text.
        body = e(body)
        for r in range(1, 5):
            body = body.replace(f'[{r}]', f'<a href="#ref-{r}">[{r}]</a>')
        page += f'<section id="s{n}"><h2>{n}. {e(heading)}</h2><p>{body}</p>'
        if n in (2, 9):
            k = 2 if n == 2 else 1
            cls = ' cues' if k == 2 else ' loop'
            page += f'<figure><div class="diagram{cls}"><div class="nodes">' + ''.join(f'<span>{e(x)}</span>' for x in d[f'diagram{k}']) + f'</div><small>RAVENFORGE / L04 · {label[5]}</small></div><figcaption>{e(d["captions"][k-1])}</figcaption></figure>'
        if n == 9:
            page += table(d['record'], label[3:5])
        if n == 10:
            page += table(d['matrix'][1:], d['matrix'][0])
        page += '</section>\n'
    page += f'<h2>{label[6]}</h2><div class="refs">'
    for r, (text, url) in enumerate(REFS, 1):
        page += f'<p id="ref-{r}">[{r}] {e(text)}<br><a href="{url}">{e(url)}</a></p>'
    page += '</div><p>' + e(d['sourceNote']) + '</p>'
    page += f'<h2>{label[7]}</h2><ul>'
    for code, folder in [('L02', 'legacy-2026-09-06-liberal'), ('L03', 'L03'), ('L13', 'L13')]:
        page += f'<li><a href="../{folder}/{lang}.html">{code}</a></li>'
    page += f'</ul><aside class="box"><strong>{label[8]}</strong>{e(d["complete"])}</aside>'
    home = 'index.html' if lang == 'en' else f'{lang}.html'
    page += f'<footer class="foot">RAVENFORGE / L04 · 2026-11-05 · v1.0 · <a href="../../{home}#research">{label[9]}</a></footer></main></body></html>\n'
    (HERE / f'{lang}.html').write_text(page, encoding='utf-8')
(HERE / 'meta.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
