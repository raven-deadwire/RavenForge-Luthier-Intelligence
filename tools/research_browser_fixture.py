"""Public synthetic DOCX fixtures; never publish or touch the research archive.

Only the standard library is used, just like the converter. These are test
packages, not manuscripts or customer document deliverables.
"""
import argparse
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import struct
import zlib
from zipfile import ZipFile

from research_docx import ROOT, NS, build, inventory

TEXT = {
    'ko': {'title': '다국어 연구일지 변환과 목재 구조 검증', 'body': '한국어 글꼴 확인 가구 제작과 베이스 기타의 목재 구조를 비교합니다. 받침과 겹받침을 확인합니다 값 꽃 뼈 넓다.', 'heading': '목재 구조와 측정 결과', 'table': '표', 'image': '그림', 'refs': '참고문헌', 'jump': '참고문헌으로 이동', 'back': '본문으로 돌아가기', 'cell': '목재 강성 및 진동 응답', 'archive': '연구 목록'},
    'en': {'title': 'Multilingual research conversion and timber structure validation', 'body': 'This synthetic study compares timber stiffness and vibration in furniture and bass guitar construction. It is test data, not a published research result.', 'heading': 'Timber structure and measurement results', 'table': 'Table', 'image': 'Figure', 'refs': 'References', 'jump': 'Jump to references', 'back': 'Return to body', 'cell': 'Timber stiffness and vibration response', 'archive': 'Research archive'},
    'de': {'title': 'Mehrsprachige Forschungsberichte und Prüfung der Holzstruktur', 'body': 'Diese Testdaten vergleichen Holzsteifigkeit und Schwingungsverhalten im Möbelbau und E-Bass-Bau. Größen, äußere Kräfte und Übertragungsmaß werden geprüft.', 'heading': 'Holzstruktur und Messergebnisse', 'table': 'Tabelle', 'image': 'Abbildung', 'refs': 'Literaturverzeichnis', 'jump': 'Zum Literaturverzeichnis', 'back': 'Zurück zum Text', 'cell': 'Holzsteifigkeit und Schwingungsverhalten', 'archive': 'Forschungsarchiv'},
}
CODE = 'A99999'
ARTICLE = 'qa-docx-browser-a99999'


def paragraph(text, style=None):
    prop = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ''
    return f'<w:p>{prop}<w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'


def anchor(name, text):
    return f'<w:p><w:bookmarkStart w:id="{1 if name == "body" else 2}" w:name="{name}"/><w:r><w:t>{escape(text)}</w:t></w:r><w:bookmarkEnd w:id="{1 if name == "body" else 2}"/></w:p>'


def jump(target, text):
    return f'<w:p><w:hyperlink w:anchor="{target}"><w:r><w:t>{escape(text)}</w:t></w:r></w:hyperlink></w:p>'


def png(width, height, number):
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff)
    rows = []
    for y in range(height):
        row = bytearray()
        for x in range(width):
            # Distinct edge markers expose clipping; stripes expose distortion.
            color = (180, 30, 40) if x < 12 else (25, 125, 70) if x >= width - 12 else (25, 60, 130) if y < 12 or y >= height - 12 else ((220, 231, 241) if (x // 80 + y // 60 + number) % 2 else (250, 250, 245))
            row.extend(color)
        rows.append(b'\0' + row)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b''.join(rows))) + chunk(b'IEND', b'')


def make_docx(path, lang):
    t = TEXT[lang]
    body = [paragraph(f'{CODE} — {t["title"]}', 'Title'), paragraph(t['body']), anchor('body', t['body']), jump('references', t['jump']), paragraph(t['heading'], 'Heading1')]
    body.append('<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bold </w:t></w:r><w:r><w:rPr><w:i/></w:rPr><w:t>Italic </w:t></w:r><w:r><w:t>H</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t>2</w:t></w:r><w:r><w:t>O E</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>2</w:t></w:r></w:p>')
    for index, columns in enumerate([2, 3, 5, 8, 10, 2, 3, 5, 2], 1):
        body.append(paragraph(f'{t["table"]} {index} — {t["cell"]}', 'Heading2'))
        rows = []
        for row in range(3):
            cells = []
            for col in range(columns):
                value = f'{index}.{row}.{col} {t["cell"]}'
                if row == 2 and col == columns - 1:
                    value += ' END-COLUMN-' + str(index)
                cells.append('<w:tc>' + paragraph(value) + '</w:tc>')
            rows.append('<w:tr>' + ('<w:trPr><w:tblHeader/></w:trPr>' if row == 0 else '') + ''.join(cells) + '</w:tr>')
        body.append('<w:tbl>' + ''.join(rows) + '</w:tbl>')
    images = [(1200, 300), (320, 480), (900, 600), (1400, 240), (640, 360), (1000, 500)]
    for index, (width, height) in enumerate(images, 1):
        body.append(f'<w:p><w:r><w:drawing><wp:inline><wp:extent cx="{width*6000}" cy="{height*6000}"/><wp:docPr id="{index}" name="Figure {index}" descr="{t["image"]} {index} edge markers"/><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="img{index}"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>')
        body.append(paragraph(f'{t["image"]} {index} — {t["cell"]}', 'Caption'))
    body.extend([paragraph(t['refs'], 'Heading1'), anchor('references', '[1] ' + t['refs'] + ' — Fixture reference 2026'), paragraph('[2] ' + ('Holzstrukturprüfungsverfahren' if lang == 'de' else 'LongReferenceIdentifier') * 9), jump('body', t['back'])])
    # Relative URL exercises actual navigation to an existing publication.
    body.append('<w:p><w:hyperlink r:id="local"><w:r><w:t>Published B03</w:t></w:r></w:hyperlink></w:p>')
    ns = {**NS, 'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing', 'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'}
    namespace = ' '.join(f'xmlns:{k}="{v}"' for k, v in ns.items())
    xml = f'<w:document {namespace}><w:body>{"".join(body)}<w:sectPr/></w:body></w:document>'
    relns = 'http://schemas.openxmlformats.org/package/2006/relationships'
    reltype = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/'
    rels = ''.join(f'<Relationship Id="img{i}" Type="{reltype}image" Target="media/{i}.png"/>' for i in range(1, 7))
    rels += f'<Relationship Id="local" Type="{reltype}hyperlink" Target="../B03/{lang}.html" TargetMode="External"/>'
    styles = ''.join(f'<w:style w:type="paragraph" w:styleId="{s}"><w:name w:val="{s}"/></w:style>' for s in ('Title', 'Heading1', 'Heading2', 'Caption'))
    with ZipFile(path, 'w') as package:
        package.writestr('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>')
        package.writestr('_rels/.rels', f'<Relationships xmlns="{relns}"><Relationship Id="rDoc" Type="{reltype}officeDocument" Target="word/document.xml"/></Relationships>')
        package.writestr('word/document.xml', xml)
        package.writestr('word/styles.xml', f'<w:styles xmlns:w="{NS["w"]}">{styles}</w:styles>')
        package.writestr('word/_rels/document.xml.rels', f'<Relationships xmlns="{relns}">{rels}<Relationship Id="styles" Type="{reltype}styles" Target="styles.xml"/></Relationships>')
        for i, (w, h) in enumerate(images, 1):
            package.writestr(f'word/media/{i}.png', png(w, h, i))


def create(destination):
    destination = destination.resolve()
    if destination.is_relative_to(ROOT):
        raise ValueError('Browser fixtures must be outside the checkout')
    destination.mkdir(parents=True, exist_ok=False)
    source = destination / 'source'
    source.mkdir()
    before = inventory(ROOT)
    manifest = {'id': ARTICLE, 'researchCode': CODE, 'date': '2026-10-08', 'category': 'craft'}
    for lang, text in TEXT.items():
        make_docx(source / f'{lang}.docx', lang)
        manifest[lang] = {'docx': f'{lang}.docx', 'title': text['title'], 'excerpt': text['body']}
    mpath = source / 'manifest.json'
    mpath.write_text(json.dumps(manifest, ensure_ascii=False), encoding='utf-8')
    report = build(mpath, ROOT, destination / 'article')
    assert report['publish_ready'] and report['archive_unchanged'], report
    assert before == inventory(ROOT)
    expected = {'article': ARTICLE, 'text': TEXT, 'tables': 9, 'images': 6, 'archive_files': len(before), 'archive_sha256': sha256(json.dumps(before, sort_keys=True).encode()).hexdigest()}
    (destination / 'expected.json').write_text(json.dumps(expected, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'fixture': str(destination), 'archive_files_unchanged': len(before), 'conversion_passed': True}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path)
    create(parser.parse_args().destination)
