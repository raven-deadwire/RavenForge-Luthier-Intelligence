"""Build B03 from authoritative DOCX files, preserving text order and image bytes.

Run from any directory; Python standard library only. Every source block is
compared with the generated HTML before a page is written.
"""
from hashlib import sha256
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import struct
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
ARTICLE = ROOT / "research/B03"
SITE = "https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence"
LANGS = ("ko", "en", "de")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
W = "{" + NS["w"] + "}"
LABELS = {"ko": ("연구일지", "목차", "언어", "표"),
          "en": ("Research", "Contents", "Language", "Table"),
          "de": ("Forschungsjournal", "Inhalt", "Sprache", "Tabelle")}


def plain(element):
    parts = []
    for node in element.iter():
        if node.tag == W + "t":
            parts.append(node.text or "")
        elif node.tag in (W + "br", W + "cr", W + "tab"):
            parts.append(" ")
    return "".join(parts)


def normalized(text):
    return re.sub(r"\s+", " ", text).strip()


def enabled(props, name):
    node = props.find("w:" + name, NS) if props is not None else None
    return node is not None and node.get(W + "val", "1") not in ("0", "false", "off")


def inline(paragraph):
    result = []
    for run in paragraph.findall("w:r", NS):
        parts = []
        for node in run:
            if node.tag == W + "t":
                parts.append(escape(node.text or ""))
            elif node.tag in (W + "br", W + "cr"):
                parts.append("<br>")
            elif node.tag == W + "tab":
                parts.append(" ")
        text = "".join(parts)
        props = run.find("w:rPr", NS)
        if enabled(props, "b"):
            text = "<strong>" + text + "</strong>"
        if enabled(props, "i"):
            text = "<em>" + text + "</em>"
        vertical = props.find("w:vertAlign", NS) if props is not None else None
        if vertical is not None:
            tag = {"subscript": "sub", "superscript": "sup"}.get(vertical.get(W + "val"))
            if tag:
                text = f"<{tag}>{text}</{tag}>"
        result.append(text)
    return "".join(result)


def style(paragraph):
    value = paragraph.find("w:pPr/w:pStyle", NS)
    return value.get(W + "val", "") if value is not None else ""


class BlockReader(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks, self.active, self.depth = {}, None, 0

    def handle_starttag(self, tag, attrs):
        block = dict(attrs).get("data-docx-block")
        if block is not None:
            assert self.active is None, "Nested source blocks"
            self.active, self.depth = int(block), 0
            self.blocks[self.active] = []
        if self.active is not None:
            if tag in ("p", "br"):
                self.blocks[self.active].append(" ")
            if tag not in ("img", "br", "hr", "meta", "link", "col", "input"):
                self.depth += 1

    def handle_endtag(self, tag):
        if self.active is not None:
            self.depth -= 1
            if self.depth == 0:
                self.active = None

    def handle_data(self, text):
        if self.active is not None:
            self.blocks[self.active].append(text)


def render_table(table, index, number, lang):
    rows = table.findall("w:tr", NS)
    columns = len(rows[0].findall("w:tc", NS))
    kind = "callout" if columns == 1 else "meta" if columns == 2 else "comparison"
    parts = [f'<table class="{kind}" data-docx-block="{index}">']
    for ri, row in enumerate(rows):
        if kind == "comparison" and ri == 0:
            parts.append("<thead>")
        elif ri == 0 or (kind == "comparison" and ri == 1):
            parts.append("<tbody>")
        parts.append("<tr>")
        for ci, cell in enumerate(row.findall("w:tc", NS)):
            heading = (kind == "comparison" and ri == 0) or (kind == "meta" and ci == 0)
            tag = "th" if heading else "td"
            scope = ' scope="col"' if kind == "comparison" and heading else ' scope="row"' if heading else ""
            content = "".join("<p>" + inline(p) + "</p>" for p in cell.findall("w:p", NS))
            parts.append(f"<{tag}{scope}>{content}</{tag}>")
        parts.append("</tr>")
        if kind == "comparison" and ri == 0:
            parts.append("</thead>")
    parts.append("</tbody></table>")
    markup = "".join(parts)
    if kind == "comparison":
        label = f"{LABELS[lang][3]} {number}"
        return f'<div class="table-scroll" role="region" tabindex="0" aria-label="{label}">{markup}</div>'
    return markup


def build(lang, css_version):
    source = ARTICLE / "source" / f"{lang}.docx"
    source_hash = sha256(source.read_bytes()).hexdigest()
    expected, rendered, headings, images = {}, [], [], []
    heading_count = table_count = image_count = 0
    with ZipFile(source) as doc:
        body = ET.fromstring(doc.read("word/document.xml")).find("w:body", NS)
        blocks = list(body)
        relationships = {r.get("Id"): r.get("Target") for r in ET.fromstring(doc.read("word/_rels/document.xml.rels"))}
        for feature in ("hyperlink", "numPr", "footnoteReference", "endnoteReference", "vMerge", "gridSpan", "fldSimple", "sym"):
            assert body.find(".//w:" + feature, NS) is None, f"Unsupported DOCX feature: {feature}"
        title, subtitle = plain(blocks[3]), plain(blocks[4])
        for index, block in enumerate(blocks):
            attrs = f'data-docx-block="{index}"'
            if block.tag == W + "tbl":
                table_count += 1
                expected[index] = normalized(" ".join(plain(p) for p in block.findall(".//w:p", NS)))
                rendered.append(render_table(block, index, table_count, lang))
                continue
            if block.tag != W + "p":
                continue
            drawings = block.findall(".//w:drawing", NS)
            if drawings:
                assert len(drawings) == 1 and not plain(block), "Expected one standalone figure"
                image_count += 1
                blip = drawings[0].find(".//a:blip", NS)
                target = relationships[blip.get("{" + NS["r"] + "}embed")]
                data = doc.read("word/" + target)
                assert data.startswith(b"\x89PNG\r\n\x1a\n"), "Expected original PNG figure"
                digest = sha256(data).hexdigest()
                filename = f"{lang}-figure-{image_count:02d}-{digest[:12]}.png"
                (ARTICLE / "assets" / filename).write_bytes(data)
                width, height = struct.unpack(">II", data[16:24])
                caption = plain(blocks[index + 1])
                rendered.append(f'<figure {attrs}><a href="assets/{filename}" target="_blank" rel="noopener"><img src="assets/{filename}" width="{width}" height="{height}" alt="{escape(caption, quote=True)}" loading="lazy" decoding="async"></a></figure>')
                images.append({"file": "assets/" + filename, "source": target, "sha256": digest})
                expected[index] = ""
                continue
            if not plain(block).strip():
                continue
            expected[index] = normalized(plain(block))
            content, pstyle = inline(block), style(block)
            if index < 5:
                tag, cls = [("p", "kicker"), ("p", "brand"), ("p", "series"), ("h1", ""), ("p", "subtitle")][index]
            elif pstyle == "RFH1":
                heading_count += 1
                tag, cls = "h2", ""
                attrs += f' id="section-{heading_count}"'
                headings.append(f'<a href="#section-{heading_count}">{escape(plain(block))}</a>')
            elif pstyle == "RFH2":
                tag, cls = "h3", ""
            else:
                tag, cls = "p", {"RFCaption": "caption", "RFSmall": "reference"}.get(pstyle, "")
            rendered.append(f'<{tag} {attrs} class="{cls}">{content}</{tag}>')
        assert (table_count, image_count, heading_count) == (19, 5, 22), "Incomplete source document"
        article_html = "\n".join(rendered)
        check = BlockReader()
        check.feed(article_html)
        actual = {k: normalized("".join(v)) for k, v in check.blocks.items()}
        assert list(actual) == list(expected), "Source block order changed"
        for index, original in expected.items():
            assert actual[index] == original, f"{lang}: source text mismatch in block {index}"
    home, contents, language, _ = LABELS[lang]
    links = "".join(f'<a href="{code}.html" lang="{code}" hreflang="{code}"' + (' aria-current="page"' if code == lang else '') + f'>{code.upper()}</a>' for code in LANGS)
    alternatives = "\n".join(f'<link rel="alternate" hreflang="{code}" href="{code}.html">' for code in LANGS)
    toc = f'<details class="toc"><summary>{contents}</summary><nav aria-label="{contents}">' + "".join(headings) + "</nav></details>"
    page = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)} · RavenForge</title>
<meta name="description" content="{escape(subtitle, quote=True)}">
<link rel="canonical" href="{SITE}/research/B03/{lang}.html">
{alternatives}
<link rel="alternate" hreflang="x-default" href="en.html">
<link rel="stylesheet" href="b03.css?v={css_version}">
</head>
<body>
<main>
<div class="page-navigation"><a href="../../index.html#research" target="_top">{home}</a><nav class="languages" aria-label="{language}">{links}</nav></div>
{toc}
<article id="research-log" data-source-sha256="{source_hash}">
{article_html}
</article>
</main>
</body>
</html>
'''
    (ARTICLE / f"{lang}.html").write_text(page, encoding="utf-8")
    return {"source": f"source/{lang}.docx", "sha256": source_hash, "blocks": len(expected), "sections": heading_count, "tables": table_count, "figures": images}, title, subtitle


def main():
    (ARTICLE / "assets").mkdir(exist_ok=True)
    css_version = sha256((ARTICLE / "b03.css").read_bytes()).hexdigest()[:12]
    meta_path = ARTICLE / "meta.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    manifest = {"schemaVersion": 1, "languages": {}}
    for lang in LANGS:
        result, title, subtitle = build(lang, css_version)
        manifest["languages"][lang] = result
        meta[lang] = {"title": title, "excerpt": subtitle, "link": f"research/B03/{lang}.html"}
        print(f"{lang}: {result['blocks']} source blocks verified, {result['sections']} sections, {result['tables']} tables, {len(result['figures'])} original figures")
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ARTICLE / "source-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
