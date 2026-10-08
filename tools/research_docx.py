"""Fail-closed, create-only DOCX publisher. Dry runs never write into the repo.

B03 supplies text normalization, run properties and the source-block verifier.
A06's preassembled HTML remains independent and is never rebuilt by this tool.
"""
import argparse
from contextlib import contextmanager
from datetime import date
from hashlib import sha256
from html import escape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import posixpath
import re
import shutil
import tempfile
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from xml.etree import ElementTree as ET
from zipfile import ZipFile, BadZipFile

from build_b03_from_docx import NS, W, LANGS, LABELS, plain, normalized, enabled, style, BlockReader

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence'
R = '{' + NS['r'] + '}'
CODE = re.compile(r'^([A-Z]\d{2,})\s*[—–:-]')
ID = re.compile(r'[A-Za-z0-9][A-Za-z0-9_-]{0,79}\Z')


class Invalid(ValueError):
    pass


class SourceReader(BlockReader):
    """B03 verifier with separators for semantic headings inside table cells."""
    def handle_starttag(self, tag, attrs):
        super().handle_starttag(tag, attrs)
        if self.active is not None and tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td', 'th'):
            self.blocks[self.active].append(' ')


def read_json(path):
    def unique(pairs):
        result = {}
        for k, v in pairs:
            if k in result:
                raise Invalid(f'{path}: duplicate JSON key {k}')
            result[k] = v
        return result
    return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=unique)


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.links, self.ids, self.text, self.visible = [], set(), [], True
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'style'):
            self.visible = False
        if 'id' in a:
            if a['id'] in self.ids:
                raise Invalid('Duplicate HTML anchor: ' + a['id'])
            self.ids.add(a['id'])
        for key in ('href', 'src'):
            if key in a:
                self.links.append(a[key])
        if tag in ('p', 'br', 'h1', 'h2', 'h3', 'td', 'th'):
            self.text.append('\n')

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.visible = True

    def handle_data(self, value):
        if self.visible:
            self.text.append(value)


def archive(root):
    """Identity includes the actual opening research code of legacy HTML.

    Do not scan excerpts/references: these legitimately mention other studies.
    """
    records, identities, seen_ids = [], {}, set()
    for path in sorted((root / 'research').glob('*/meta.json')):
        meta = read_json(path)
        article_id = str(meta.get('id', '')).strip().casefold()
        if not article_id or article_id in seen_ids:
            raise Invalid(f'{path}: missing or duplicate archive ID')
        seen_ids.add(article_id)
        identities_here = {str(meta.get('id', '')).casefold(), path.parent.name.casefold()}
        if meta.get('researchCode'):
            identities_here.add(meta['researchCode'].casefold())
        for lang in LANGS:
            page = path.parent / f'{lang}.html'
            if page.is_file():
                # Only opening title/brand paragraphs, before body references.
                for line in ''.join(Page(page.read_text(encoding='utf-8')).text).splitlines()[:20]:
                    match = CODE.match(line.strip())
                    if match:
                        identities_here.add(match[1].casefold())
                        break
        for identity in identities_here:
            if identity in identities and identities[identity] != meta['id']:
                raise Invalid(f'Duplicate archive identity: {identity}')
            identities[identity] = meta['id']
        records.append(meta)
    index = read_json(root / 'research/research-index.json')
    for meta in index['articles']:
        identities.setdefault(meta['id'].casefold(), meta['id'])
    return records, identities


def inventory(root):
    return {p.relative_to(root).as_posix(): sha256(p.read_bytes()).hexdigest()
            for p in sorted((root / 'research').rglob('*')) if p.is_file()}


def safe_url(value):
    if any(ord(c) < 32 for c in value) or '\\' in value:
        raise Invalid('Unsafe link')
    parsed = urlsplit(value)
    if parsed.scheme not in ('', 'http', 'https', 'mailto') or value.startswith('//'):
        raise Invalid('Unsupported link scheme: ' + value)
    if parsed.scheme in ('http', 'https') and (not parsed.hostname or parsed.username or parsed.password):
        raise Invalid('Invalid external URL: ' + value)
    return value


class Converter:
    def __init__(self, source, lang, output, title, research_code):
        self.source, self.lang, self.output, self.title = source, lang, output, title
        self.code = research_code
        self.assets, self.headings, self.expected = [], [], {}
        self.tables = self.paragraphs = 0
        self.counter = 0
        self.caption = ''
        self.title_node = None

    def image(self, node):
        blips = node.findall('.//a:blip', NS)
        if len(blips) != 1 or not blips[0].get(R + 'embed'):
            raise Invalid('Only embedded raster images are supported')
        blip = blips[0]
        rel = self.rels.get(blip.get(R + 'embed'))
        if not rel or rel.get('TargetMode') == 'External':
            raise Invalid('Missing or external image relationship')
        target = posixpath.normpath('word/' + rel['Target'])
        if not target.startswith('word/media/'):
            raise Invalid('Invalid image package path')
        data = self.doc.read(target)
        if data.startswith(b'\x89PNG\r\n\x1a\n'):
            ext = 'png'
        elif data.startswith(b'\xff\xd8\xff'):
            ext = 'jpg'
        elif data.startswith((b'GIF87a', b'GIF89a')):
            ext = 'gif'
        else:
            raise Invalid('Unsupported figure format; export a PNG/JPEG/GIF first')
        digest = sha256(data).hexdigest()
        name = f'assets/{self.lang}-{digest[:24]}.{ext}'
        (self.output / name).write_bytes(data)
        alt = next((x.get('descr') or x.get('title') for x in node.iter()
                    if x.tag.endswith('}docPr') and (x.get('descr') or x.get('title'))), self.caption)
        self.assets.append({'file': name, 'sha256': digest, 'source': target})
        return f'<img src="{name}" alt="{escape(alt, quote=True)}" loading="lazy">'

    def inline(self, node, linkify=True):
        parts = []
        for child in node:
            tag = child.tag
            if tag == W + 't':
                value = child.text or ''
                if not linkify:
                    parts.append(escape(value))
                    continue
                # Preserve literal URLs as clickable references, without altering text.
                cursor = 0
                for m in re.finditer(r'https?://[^\s<>]+', value):
                    url = m.group().rstrip('.,;)]}')
                    parts.append(escape(value[cursor:m.start()]))
                    parts.append(f'<a href="{escape(safe_url(url), quote=True)}">{escape(url)}</a>')
                    cursor = m.start() + len(url)
                parts.append(escape(value[cursor:]))
            elif tag in (W + 'br', W + 'cr'):
                parts.append('<br>')
            elif tag == W + 'tab':
                parts.append(' ')
            elif tag == W + 'drawing':
                parts.append(self.image(child))
            elif tag == W + 'hyperlink':
                rid, anchor = child.get(R + 'id'), child.get(W + 'anchor')
                target = self.rels.get(rid, {}).get('Target') if rid else '#' + (anchor or '')
                if not target:
                    raise Invalid('Missing hyperlink relationship')
                parts.append(f'<a href="{escape(safe_url(target), quote=True)}">{self.inline(child, False)}</a>')
            elif tag == W + 'bookmarkStart':
                name = child.get(W + 'name', '')
                if name and name != '_GoBack':
                    parts.append(f'<span id="{escape(name, quote=True)}"></span>')
            elif tag == W + 'r':
                content = self.inline(child, linkify)
                props = child.find('w:rPr', NS)
                for prop, html_tag in [('b', 'strong'), ('i', 'em')]:
                    if enabled(props, prop):
                        content = f'<{html_tag}>{content}</{html_tag}>'
                vertical = props.find('w:vertAlign', NS) if props is not None else None
                if vertical is not None:
                    html_tag = {'subscript': 'sub', 'superscript': 'sup'}.get(vertical.get(W + 'val'))
                    if html_tag:
                        content = f'<{html_tag}>{content}</{html_tag}>'
                parts.append(content)
            elif tag not in (W + 'pPr', W + 'rPr', W + 'bookmarkEnd', W + 'proofErr', W + 'lastRenderedPageBreak'):
                raise Invalid('Unsupported inline DOCX feature: ' + tag.split('}')[-1])
        return ''.join(parts)

    def paragraph(self, p, block=False):
        self.paragraphs += 1
        attrs = ''
        if block:
            self.expected[self.counter] = normalized(plain(p))
            attrs = f' data-docx-block="{self.counter}"'
            self.counter += 1
        content = self.inline(p)
        pstyle = style(p)
        outline = p.find('w:pPr/w:outlineLvl', NS)
        level = None
        s = self.styles.get(pstyle)
        if outline is None and s is not None:
            outline = s.find('w:pPr/w:outlineLvl', NS)
        if outline is not None and int(outline.get(W + 'val', '9')) < 6:
            level = int(outline.get(W + 'val')) + 2
        elif re.fullmatch(r'(?:Heading|RFH)[1-5]', pstyle):
            level = int(pstyle[-1]) + 1
        text = plain(p).strip()
        if p is self.title_node:
            level = 1
        elif pstyle.casefold() == 'title':
            level = 1
        cls = 'caption' if 'caption' in pstyle.lower() or re.match(r'^(?:Figure|Abb\.|Abbildung|그림)\s*\d+', text) else 'reference' if re.match(r'^\[(?:\d+|R\d+)\]', text) else ''
        if level:
            level = min(level, 6)
            anchor = 'section-' + str(self.paragraphs)
            attrs += f' id="{anchor}"'
            if level > 1:
                self.headings.append((anchor, text))
            return f'<h{level}{attrs}>{content}</h{level}>'
        num = p.find('w:pPr/w:numPr', NS)
        if num is None and s is not None:
            num = s.find('w:pPr/w:numPr', NS)
        if num is not None:
            # Numbered/bulleted lists require actual numbering definitions.
            num_id = num.find('w:numId', NS)
            ilvl = num.find('w:ilvl', NS)
            key = (num_id.get(W + 'val') if num_id is not None else '', ilvl.get(W + 'val', '0') if ilvl is not None else '0')
            if key[1] != '0':
                raise Invalid('Nested lists require manual review; hierarchy is never flattened silently')
            fmt = self.numbering.get(key)
            if fmt not in ('bullet', 'decimal'):
                raise Invalid('Unsupported list numbering; use bullet or decimal')
            if fmt == 'bullet':
                return f'<ul><li{attrs}>{content}</li></ul>'
            self.list_counts[key] = self.list_counts.get(key, self.starts.get(key, 1) - 1) + 1
            return f'<ol start="{self.list_counts[key]}"><li{attrs}>{content}</li></ol>'
        return f'<p{attrs} class="{cls}">{content}</p>'

    def table(self, table, block=False):
        self.tables += 1
        attrs = ''
        if block:
            self.expected[self.counter] = normalized(' '.join(plain(p) for p in table.findall('.//w:p', NS)))
            attrs = f' data-docx-block="{self.counter}"'
            self.counter += 1
        first_row = table.find('w:tr', NS)
        if first_row is None:
            raise Invalid('Empty table')
        columns = sum(int(s.get(W + 'val', '1')) if (s := c.find('w:tcPr/w:gridSpan', NS)) is not None else 1 for c in first_row.findall('w:tc', NS))
        kind = 'callout' if columns == 1 else 'meta' if columns == 2 else 'comparison'
        parts = [f'<div class="table-scroll" tabindex="0" role="region" aria-label="{LABELS[self.lang][3]} {self.tables}"><table class="{kind}"{attrs}>']
        for row in table.findall('w:tr', NS):
            parts.append('<tr>')
            for cell in row.findall('w:tc', NS):
                span = cell.find('w:tcPr/w:gridSpan', NS)
                colspan = f' colspan="{int(span.get(W + "val"))}"' if span is not None else ''
                tag = 'th' if row.find('w:trPr/w:tblHeader', NS) is not None else 'td'
                parts.append(f'<{tag}{colspan}>')
                for child in cell:
                    if child.tag == W + 'p':
                        parts.append(self.paragraph(child))
                    elif child.tag == W + 'tbl':
                        parts.append(self.table(child))
                    elif child.tag != W + 'tcPr':
                        raise Invalid('Unsupported table cell content')
                parts.append(f'</{tag}>')
            parts.append('</tr>')
        parts.append('</table></div>')
        return ''.join(parts)

    def convert(self):
        with ZipFile(self.source) as self.doc:
            body = ET.fromstring(self.doc.read('word/document.xml')).find('w:body', NS)
            if body is None:
                raise Invalid('Missing document body')
            for feature in ('vMerge', 'fldSimple', 'fldChar', 'sym', 'sdt', 'ins', 'del', 'object', 'altChunk', 'pict', 'footnoteReference', 'endnoteReference', 'commentReference'):
                if body.find('.//w:' + feature, NS) is not None:
                    raise Invalid('Unsupported DOCX feature (no output published): ' + feature)
            if any(n.tag.endswith(('}oMath', '}oMathPara')) for n in body.iter()):
                raise Invalid('Native equations require an explicit MathML conversion; export figures first')
            rel_path = 'word/_rels/document.xml.rels'
            self.rels = {r.get('Id'): r.attrib for r in ET.fromstring(self.doc.read(rel_path))} if rel_path in self.doc.namelist() else {}
            self.styles = {s.get(W + 'styleId'): s for s in ET.fromstring(self.doc.read('word/styles.xml'))} if 'word/styles.xml' in self.doc.namelist() else {}
            self.numbering, self.starts, self.list_counts = {}, {}, {}
            if 'word/numbering.xml' in self.doc.namelist():
                numbering = ET.fromstring(self.doc.read('word/numbering.xml'))
                abstract = {a.get(W + 'abstractNumId'): a for a in numbering.findall('w:abstractNum', NS)}
                for n in numbering.findall('w:num', NS):
                    if n.find('w:lvlOverride', NS) is not None:
                        raise Invalid('List overrides require manual review')
                    aid = n.find('w:abstractNumId', NS).get(W + 'val')
                    for lvl in abstract[aid].findall('w:lvl', NS):
                        key = (n.get(W + 'numId'), lvl.get(W + 'ilvl'))
                        self.numbering[key] = lvl.find('w:numFmt', NS).get(W + 'val')
                        start = lvl.find('w:start', NS)
                        self.starts[key] = int(start.get(W + 'val', '1')) if start is not None else 1
            rendered = []
            blocks = list(body)
            paragraphs = [p for p in blocks if p.tag == W + 'p' and plain(p).strip()]
            self.title_node = next((p for p in paragraphs[:6] if self.code and CODE.match(plain(p).strip()) and CODE.match(plain(p).strip())[1] == self.code), None)
            if self.title_node is None:
                self.title_node = next((p for p in paragraphs if style(p).casefold() == 'title'), paragraphs[0] if paragraphs else None)
            for index, block in enumerate(blocks):
                self.caption = ''
                if block.find('.//w:drawing', NS) is not None and not plain(block).strip():
                    if index + 1 < len(blocks) and blocks[index + 1].tag == W + 'p':
                        self.caption = plain(blocks[index + 1]).strip()
                if block.tag == W + 'p':
                    rendered.append(self.paragraph(block, True))
                elif block.tag == W + 'tbl':
                    rendered.append(self.table(block, True))
                elif block.tag != W + 'sectPr':
                    raise Invalid('Unsupported DOCX body block')
        markup = '\n'.join(rendered)
        verifier = SourceReader()
        verifier.feed(markup)
        actual = {k: normalized(''.join(v)) for k, v in verifier.blocks.items()}
        if list(actual) != list(self.expected):
            raise Invalid('Source block order mismatch')
        for index, expected in self.expected.items():
            if actual[index] != expected:
                raise Invalid(f'Source text mismatch: {self.lang} block {index}: {actual[index]!r} != {expected!r}')
        if not any(self.expected.values()):
            raise Invalid('Empty translation')
        return markup, {'sha256': sha256(self.source.read_bytes()).hexdigest(),
                        'blocks': len(self.expected), 'paragraphs': self.paragraphs,
                        'tables': self.tables, 'figures': self.assets, 'text_verified': True}


def links_check(output, root, article_id, check_external=False):
    problems, external = [], set()
    virtual = root / 'research' / article_id
    for page in output.glob('*.html'):
        parsed_page = Page(page.read_text(encoding='utf-8'))
        for link in parsed_page.links:
            try:
                safe_url(link)
                u = urlsplit(link)
                if u.scheme in ('https', 'http'):
                    if link.startswith(SITE + '/'):
                        local = unquote(u.path[len(urlsplit(SITE).path):]).lstrip('/')
                        target = (root / local).resolve()
                        if not target.is_relative_to(root):
                            raise Invalid('Local site link escapes repository')
                        if target.is_relative_to(virtual):
                            target = output / target.relative_to(virtual)
                    else:
                        external.add(link)
                        continue
                elif u.scheme == 'mailto':
                    continue
                else:
                    path = unquote(u.path)
                    vpath = ((root / path.lstrip('/')) if path.startswith('/') else (virtual / path)).resolve() if path else virtual / page.name
                    if not vpath.is_relative_to(root):
                        raise Invalid('Local link escapes repository')
                    target = output / vpath.relative_to(virtual) if vpath.is_relative_to(virtual) else vpath
                if not target.is_file():
                    raise Invalid('Missing local target')
                if u.fragment and target.suffix == '.html':
                    if unquote(u.fragment) not in Page(target.read_text(encoding='utf-8')).ids:
                        raise Invalid('Missing fragment anchor')
            except (Invalid, ValueError) as e:
                problems.append({'page': page.name, 'link': link, 'error': str(e)})
    results = []
    for url in sorted(external):
        status = 'UNCHECKED'
        if check_external:
            try:
                with urlopen(Request(url, headers={'User-Agent': 'RavenForge-LinkCheck/1.0'}), timeout=10) as response:
                    status = 'PASS' if response.status < 400 else 'BROKEN'
            except HTTPError as e:
                status = 'BROKEN' if e.code in (404, 410) else 'UNVERIFIED'
            except (URLError, TimeoutError, OSError):
                status = 'UNVERIFIED'
        results.append({'url': url, 'status': status})
    return {'local_errors': problems, 'external': results,
            'passed': not problems and all(r['status'] == 'PASS' for r in results)}


def validate_manifest(manifest, source_dir):
    for key in ('id', 'date', 'category'):
        if not isinstance(manifest.get(key), str) or not manifest[key].strip():
            raise Invalid('Manifest requires ' + key)
    if not ID.fullmatch(manifest['id']):
        raise Invalid('Unsafe article ID')
    if manifest.get('researchCode') and not re.fullmatch(r'[A-Z]\d{2,}', manifest['researchCode']):
        raise Invalid('Invalid researchCode')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', manifest['date']):
        raise Invalid('Date must use YYYY-MM-DD')
    date.fromisoformat(manifest['date'])
    if manifest['category'] not in {'wood', 'craft', 'sound', 'liberal', 'log'}:
        raise Invalid('Invalid category')
    sources = {}
    for lang in LANGS:
        localized = manifest.get(lang)
        if not isinstance(localized, dict):
            raise Invalid('Missing translation: ' + lang)
        for field in ('docx', 'title', 'excerpt'):
            if not isinstance(localized.get(field), str) or not localized[field].strip():
                raise Invalid(f'{lang}: missing {field}')
        sources[lang] = (source_dir / localized['docx']).resolve()
        if not sources[lang].is_file():
            raise Invalid(f'{lang}: missing DOCX input')
    if len({sha256(p.read_bytes()).hexdigest() for p in sources.values()}) != 3:
        raise Invalid('Identical DOCX inputs: missing translation or incorrect source mapping')
    declared = manifest.get('researchCode', manifest['id'])
    for lang, source in sources.items():
        with ZipFile(source) as package:
            body = ET.fromstring(package.read('word/document.xml')).find('w:body', NS)
            opening_codes = {m[1] for p in list(body)[:6] if p.tag == W + 'p'
                             if (m := CODE.match(plain(p).strip()))}
            if opening_codes and opening_codes != {declared}:
                raise Invalid(f'{lang}: manuscript research code does not match declared identity')
    return sources


def build(manifest_path, root, output, check_external=False):
    root = root.resolve()
    manifest = read_json(manifest_path)
    sources = validate_manifest(manifest, manifest_path.parent)
    records, identities = archive(root)
    conflicts = sorted({identities[x.casefold()] for x in (manifest['id'], manifest.get('researchCode', manifest['id'])) if x.casefold() in identities})
    before = inventory(root)
    output.mkdir(parents=True, exist_ok=False)
    (output / 'assets').mkdir()
    # Reuse B03's established responsive layout without coupling source articles.
    css = (root / 'research/B03/b03.css').read_text(encoding='utf-8')
    css += '\narticle img{max-width:100%;height:auto}ul,ol{padding-left:2em}h4,h5,h6{break-after:avoid}\n'
    (output / 'article.css').write_text(css, encoding='utf-8')
    meta = {k: manifest[k] for k in ('id', 'date', 'category')}
    if manifest.get('researchCode'):
        meta['researchCode'] = manifest['researchCode']
    evidence = {}
    for lang in LANGS:
        local = manifest[lang]
        converter = Converter(sources[lang], lang, output, local['title'], manifest.get('researchCode', manifest['id']))
        markup, evidence[lang] = converter.convert()
        meta[lang] = {k: local[k] for k in ('title', 'excerpt')}
        meta[lang]['link'] = f'research/{manifest["id"]}/{lang}.html'
        if local.get('sourceLink'):
            meta[lang]['sourceLink'] = safe_url(local['sourceLink'])
        nav = ''.join(f'<a href="{code}.html" hreflang="{code}"' + (' aria-current="page"' if code == lang else '') + f'>{code.upper()}</a>' for code in LANGS)
        alternatives = ''.join(f'<link rel="alternate" hreflang="{code}" href="{code}.html">' for code in LANGS)
        toc = ''.join(f'<a href="#{anchor}">{escape(title)}</a>' for anchor, title in converter.headings)
        page = f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(local['title'])} · RavenForge</title>
<meta name="description" content="{escape(local['excerpt'], quote=True)}">
<link rel="canonical" href="{SITE}/{meta[lang]['link']}">{alternatives}
<link rel="alternate" hreflang="x-default" href="en.html"><link rel="stylesheet" href="article.css"></head>
<body><main><div class="page-navigation"><a href="../../index.html#research">{LABELS[lang][0]}</a><nav class="languages">{nav}</nav></div>
<details class="toc"><summary>{LABELS[lang][1]}</summary><nav>{toc}</nav></details>
<article id="research-log" data-source-sha256="{evidence[lang]['sha256']}">{markup}</article></main></body></html>'''
        (output / f'{lang}.html').write_text(page, encoding='utf-8')
    (output / 'meta.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    link_report = links_check(output, root, manifest['id'], check_external)
    unchanged = before == inventory(root)
    report = {'schemaVersion': 1, 'id': manifest['id'], 'languages': evidence,
              'existing_articles': len(records), 'conflicting_articles': conflicts,
              'archive_unchanged': unchanged, 'links': link_report,
              'conversion_passed': unchanged and not link_report['local_errors'],
              'publish_ready': unchanged and not conflicts and link_report['passed']}
    (output / 'validation-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return report


@contextmanager
def publication_lock(root):
    path = root / '.research-publication.lock'
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    try:
        os.close(fd)
        yield
    finally:
        path.unlink()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--repo', type=Path, default=ROOT)
    parser.add_argument('--output', type=Path, help='New private directory outside repository (dry-run default)')
    parser.add_argument('--publish', action='store_true', help='Create a NEW article folder only; never overwrite or update index')
    parser.add_argument('--check-external', action='store_true', help='Check remote URLs; unknown/failing responses block publication')
    args = parser.parse_args(argv)
    root = args.repo.resolve()
    try:
        if args.publish:
            if args.output:
                raise Invalid('--output cannot be combined with --publish')
            with publication_lock(root), tempfile.TemporaryDirectory(prefix='ravenforge-docx-') as temporary:
                generated = Path(temporary) / 'article'
                report = build(args.manifest.resolve(), root, generated, args.check_external)
                if not report['publish_ready']:
                    raise Invalid('Publication BLOCKED: ' + json.dumps({'conflicts': report['conflicting_articles'], 'links': report['links']}, ensure_ascii=False))
                destination = root / 'research' / report['id']
                if destination.exists() or destination.is_symlink():
                    raise Invalid('Article directory already exists')
                # mkdir is exclusive even against a non-cooperating concurrent writer.
                # The archive builder cannot discover this folder until meta is last.
                destination.mkdir()
                try:
                    for item in generated.iterdir():
                        if item.name in ('meta.json', 'validation-report.json'):
                            continue
                        if item.is_dir():
                            shutil.copytree(item, destination / item.name)
                        else:
                            shutil.copyfile(item, destination / item.name)
                    shutil.copyfile(generated / 'meta.json', destination / '.meta-pending')
                    os.replace(destination / '.meta-pending', destination / 'meta.json')
                except BaseException:
                    shutil.rmtree(destination)
                    raise
                print('Created ' + str(destination) + '; commit via PR, existing index workflow publishes after merge.')
        else:
            if args.output is None or args.output.resolve().is_relative_to(root):
                raise Invalid('Dry-run --output must be a new directory outside the repository')
            report = build(args.manifest.resolve(), root, args.output.resolve(), args.check_external)
            print(json.dumps({k: report[k] for k in ('id', 'existing_articles', 'conflicting_articles', 'archive_unchanged', 'conversion_passed', 'publish_ready')}, ensure_ascii=False))
            if not report['conversion_passed']:
                return 1
        return 0
    except (Invalid, ValueError, OSError, KeyError, ET.ParseError, BadZipFile) as e:
        print('BLOCKED: ' + str(e))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
