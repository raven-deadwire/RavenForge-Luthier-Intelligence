import json
import re
import subprocess
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

SITE = 'https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence/'
INDEX = Path('index.html')
CONFIG = Path('configurator.html')
FOOTER_SCRIPT_VERSION = '20260915s2'


def read_preserve(path: Path) -> str:
    with path.open('r', encoding='utf-8', newline='') as fh:
        return fh.read()


def write_preserve(path: Path, text: str) -> None:
    with path.open('w', encoding='utf-8', newline='') as fh:
        fh.write(text)


def last_updated() -> str:
    try:
        value = subprocess.check_output(['git', 'log', '-1', '--format=%cs'], text=True).strip()
        if re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
            return value
    except Exception:
        pass
    return date.today().isoformat()


def replace_marked(text: str, start: str, end: str, block: str, anchor: str) -> str:
    pattern = re.compile(re.escape(start) + r'[\s\S]*?' + re.escape(end))
    wrapped = f'{start}\n{block.rstrip()}\n{end}'
    if pattern.search(text):
        return pattern.sub(wrapped, text, count=1)
    return text.replace(anchor, f'{wrapped}\n{anchor}', 1)


updated = last_updated()

if INDEX.exists():
    html = read_preserve(INDEX)

    seo = f'''    <meta name="description" content="RavenForge Luthier Intelligence is an independent instrument-design, lutherie research and prototype portfolio by musician and instrument designer Raven Cho.">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="theme-color" content="#101a20">
    <link rel="canonical" href="{SITE}">
    <link rel="icon" type="image/png" sizes="64x64" href="assets/favicon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="RavenForge Luthier Intelligence">
    <meta property="og:title" content="RavenForge Luthier Intelligence — Instrument Design, Research & Prototypes">
    <meta property="og:description" content="Instrument design, material and electronics research, CAD development and prototype studies shaped by musicianship, narrative and craft.">
    <meta property="og:url" content="{SITE}">
    <meta property="og:image" content="{SITE}assets/model-backdrops/edda-wide.webp">
    <meta property="og:locale" content="en_US">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="RavenForge Luthier Intelligence">
    <meta name="twitter:description" content="Instrument design, lutherie research and prototype studies by Raven Cho.">
    <meta name="twitter:image" content="{SITE}assets/model-backdrops/edda-wide.webp">
    <script type="application/ld+json">{json.dumps({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'RavenForge Luthier Intelligence',
        'url': SITE,
        'description': 'Independent instrument-design, lutherie research and prototype portfolio.',
        'creator': {
            '@type': 'Person',
            'name': 'Raven Cho',
            'sameAs': [
                'https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence',
                'https://www.instagram.com/raven_deadwire/'
            ]
        }
    }, ensure_ascii=False)}</script>'''
    html = replace_marked(html, '<!-- RF:SEO START -->', '<!-- RF:SEO END -->', seo, '</head>')

    config_panel = '''                <div class="w-full bg-slate-50 rounded-xl border border-slate-200 px-6 py-10 text-center">
                    <a href="configurator.html" target="_blank" rel="noopener" class="inline-flex items-center justify-center bg-slate-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-slate-700 transition" data-lang-key="configuratorOpenBtn"></a>
                </div>'''
    html = re.sub(
        r'\s*<div class="w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200" style="height:\s*900px;">\s*<iframe[\s\S]*?</iframe>\s*</div>',
        '\n' + config_panel,
        html,
        count=1,
        flags=re.I,
    )

    concept_index = Path('concepts/concept-index.json')
    if concept_index.exists():
        data = json.loads(concept_index.read_text(encoding='utf-8'))
        payload = json.dumps(data.get('entries', []), ensure_ascii=False, indent=2)
        html = re.sub(
            r'(<script\s+type="application/json"\s+id="concept-lab-data"\s*>)[\s\S]*?(</script>)',
            lambda m: f'{m.group(1)}\n{payload}\n        {m.group(2)}',
            html,
            count=1,
            flags=re.I,
        )

    footer = f'''    <footer class="rf-site-footer bg-slate-800 text-slate-300 mt-8">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
            <p class="text-sm">&copy; 2026 RavenForge Luthier Intelligence.</p>
            <nav class="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
                <a href="#about" data-page-link data-footer-key="contact" class="hover:text-white">Contact</a>
                <a href="https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence" target="_blank" rel="noopener" class="hover:text-white">GitHub</a>
                <a href="https://www.instagram.com/raven_deadwire/" target="_blank" rel="noopener" class="hover:text-white">Instagram</a>
                <a href="https://www.youtube.com/@raven_deadwire" target="_blank" rel="noopener" class="hover:text-white">YouTube</a>
            </nav>
            <p class="text-xs text-slate-400"><span data-footer-key="updated">Last Updated</span> · <time datetime="{updated}">{updated}</time></p>
        </div>
    </footer>'''
    html = re.sub(r'<footer\b[\s\S]*?</footer>', footer, html, count=1, flags=re.I)

    footer_script = f'<script src="assets/footer.js?v={FOOTER_SCRIPT_VERSION}"></script>'
    if 'assets/footer.js' in html:
        html = re.sub(
            r'<script\s+src="assets/footer\.js(?:\?[^\"]*)?"></script>',
            footer_script,
            html,
            count=1,
            flags=re.I,
        )
    else:
        html = html.replace('</body>', f'    {footer_script}\n</body>', 1)

    write_preserve(INDEX, html)

if CONFIG.exists():
    html = read_preserve(CONFIG)
    seo = f'''  <meta name="description" content="RavenForge custom bass configurator for exploring compatible model, material, hardware and electronics options.">
  <meta name="robots" content="index,follow">
  <meta name="theme-color" content="#101a20">
  <link rel="canonical" href="{SITE}configurator.html">
  <link rel="icon" type="image/png" sizes="64x64" href="assets/favicon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:title" content="RavenForge Bass Configurator">
  <meta property="og:description" content="Explore RavenForge bass model, material, hardware and electronics configurations.">
  <meta property="og:url" content="{SITE}configurator.html">
  <meta property="og:image" content="{SITE}assets/model-backdrops/embla-wide.webp">'''
    html = replace_marked(html, '<!-- RF:SEO START -->', '<!-- RF:SEO END -->', seo, '</head>')
    write_preserve(CONFIG, html)

Path('robots.txt').write_text(
    f'User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n',
    encoding='utf-8',
)

urls = [(SITE, updated), (urljoin(SITE, 'configurator.html'), updated)]
research_index = Path('research/research-index.json')
if research_index.exists():
    data = json.loads(research_index.read_text(encoding='utf-8'))
    for article in data.get('articles', []):
        article_date = str(article.get('date') or updated)
        for lang in ('ko', 'en', 'de'):
            link = article.get(lang, {}).get('link')
            if link:
                urls.append((urljoin(SITE, link), article_date))

seen = set()
rows = []
for loc, mod in urls:
    if loc in seen:
        continue
    seen.add(loc)
    rows.append(f'  <url><loc>{loc}</loc><lastmod>{mod}</lastmod></url>')
Path('sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(rows) + '\n</urlset>\n',
    encoding='utf-8',
)
print(f'Built site metadata, footer, configurator shell and sitemap ({len(rows)} URLs).')
