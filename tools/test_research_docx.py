"""No private manuscripts in fixtures: exercise conversion and publication guards."""
from contextlib import redirect_stdout
import base64
from io import StringIO
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from zipfile import ZipFile

from research_docx import (Invalid, build, main, inventory, links_check, archive,
                           read_json, Converter, NS, W)
from build_research_index import build_index

REPO = Path(__file__).resolve().parents[1]
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=')


def docx(path, text, feature='', hyperlink='https://example.com/ref#part'):
    # Minimal valid OOXML, includes mixed inline text/image and merged table cells.
    styles = f'<w:styles xmlns:w="{NS["w"]}"><w:style w:styleId="Heading1"><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style></w:styles>'
    body = f'''<w:p><w:r><w:t>A99 — {text}</w:t></w:r></w:p>
<w:p><w:r><w:t>Summary {text}</w:t></w:r></w:p>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Research question</w:t></w:r></w:p>
<w:p><w:bookmarkStart w:id="1" w:name="part"/><w:r><w:rPr><w:b/><w:i/><w:vertAlign w:val="subscript"/></w:rPr><w:t>R</w:t></w:r><w:hyperlink r:id="rLink"><w:r><w:t>Reference</w:t></w:r></w:hyperlink><w:r><w:drawing><a:blip r:embed="rImage"/></w:drawing></w:r></w:p>
<w:tbl><w:tr><w:trPr><w:tblHeader/></w:trPr><w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>Value</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Nested</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:tc></w:tr></w:tbl>
<w:p><w:r><w:t>[1] Bibliography {text}</w:t></w:r></w:p>{feature}<w:sectPr/>'''
    xml = f'<w:document xmlns:w="{NS["w"]}" xmlns:r="{NS["r"]}" xmlns:a="{NS["a"]}"><w:body>{body}</w:body></w:document>'
    rels = f'<Relationships><Relationship Id="rImage" Target="media/image.png"/><Relationship Id="rLink" Target="{hyperlink}" TargetMode="External"/></Relationships>'
    with ZipFile(path, 'w') as z:
        z.writestr('word/document.xml', xml)
        z.writestr('word/styles.xml', styles)
        z.writestr('word/_rels/document.xml.rels', rels)
        # Original image content is compared byte for byte, not re-encoded.
        z.writestr('word/media/image.png', PNG)


class ResearchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.repo = self.base / 'repo'
        (self.repo / 'research/B03').mkdir(parents=True)
        shutil.copy(REPO / 'research/B03/b03.css', self.repo / 'research/B03/b03.css')
        (self.repo / 'index.html').write_text('<main id="research"></main>', encoding='utf-8')
        self.index = self.repo / 'research/research-index.json'
        self.index.write_text('{"schemaVersion":1,"articles":[]}\n', encoding='utf-8')
        self.source = self.base / 'source'
        self.source.mkdir()
        self.manifest = {'id': 'A99', 'researchCode': 'A99', 'date': '2026-10-08', 'category': 'sound'}
        for lang in ('ko', 'en', 'de'):
            docx(self.source / (lang + '.docx'), lang)
            self.manifest[lang] = {'docx': lang + '.docx', 'title': lang + ' title', 'excerpt': lang + ' summary'}
        self.manifest_path = self.source / 'manifest.json'
        self.save()
        self.output = self.base / 'preview'

    def tearDown(self):
        self.temp.cleanup()

    def save(self):
        self.manifest_path.write_text(json.dumps(self.manifest), encoding='utf-8')

    def run_cli(self, *args):
        with redirect_stdout(StringIO()):
            return main([str(self.manifest_path), '--repo', str(self.repo), *map(str, args)])

    def add_existing(self, article_id='legacy-old', code='A99'):
        folder = self.repo / 'research' / article_id
        folder.mkdir()
        m = {'id': article_id, 'date': '2026-09-10', 'category': 'sound'}
        for lang in ('ko', 'en', 'de'):
            (folder / (lang + '.html')).write_text(f'<p>{code} — Original</p>', encoding='utf-8')
            m[lang] = {'title': 'Old', 'excerpt': 'Original', 'link': f'research/{article_id}/{lang}.html'}
        (folder / 'meta.json').write_text(json.dumps(m), encoding='utf-8')
        return folder

    def test_content_order_formatting_tables_images_and_bibliography(self):
        before = inventory(self.repo)
        r = build(self.manifest_path, self.repo, self.output)
        self.assertTrue(r['conversion_passed'])
        self.assertFalse(r['publish_ready'])  # Remote link has not been verified.
        self.assertEqual(inventory(self.repo), before)
        html = (self.output / 'ko.html').read_text(encoding='utf-8')
        for text in ('<strong>', '<em>', '<sub>', 'colspan="2"', '<th', 'Nested', '[1] Bibliography ko', 'hreflang="de"', 'id="part"'):
            self.assertIn(text, html)
        self.assertEqual(r['languages']['ko']['tables'], 2)
        image = r['languages']['ko']['figures'][0]
        self.assertEqual((self.output / image['file']).read_bytes(), PNG)
        m = read_json(self.output / 'meta.json')
        self.assertEqual(m['en']['link'], 'research/A99/en.html')

    def test_missing_translation(self):
        del self.manifest['de']; self.save()
        self.assertEqual(self.run_cli('--output', self.output), 1)
        self.assertFalse(self.output.exists())

    def test_table_minimum_width_uses_widest_row_and_preserves_source_css(self):
        original_css = (self.repo / 'research/B03/b03.css').read_bytes()
        cells = ''.join(f'<w:tc><w:p><w:r><w:t>Column {i}</w:t></w:r></w:p></w:tc>' for i in range(10))
        feature = '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Title</w:t></w:r></w:p></w:tc></w:tr><w:tr>' + cells + '</w:tr></w:tbl>'
        for lang in ('ko', 'en', 'de'):
            docx(self.source / (lang + '.docx'), lang, feature=feature, hyperlink='#part')
        report = build(self.manifest_path, self.repo, self.output)
        self.assertTrue(report['publish_ready'])
        html = (self.output / 'ko.html').read_text(encoding='utf-8')
        self.assertIn('class="comparison" style="--docx-columns:10"', html)
        self.assertIn('style="--docx-columns:2"', html)  # merged header cells
        self.assertIn('@media screen{', (self.output / 'article.css').read_text(encoding='utf-8'))
        self.assertEqual((self.repo / 'research/B03/b03.css').read_bytes(), original_css)

    def test_explicit_korean_font_fallback_preserves_published_css(self):
        original_css = (self.repo / 'research/B03/b03.css').read_bytes()
        build(self.manifest_path, self.repo, self.output)
        css = (self.output / 'article.css').read_text(encoding='utf-8')
        self.assertIn('"Noto Sans KR","Noto Sans CJK KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif', css)
        self.assertEqual((self.repo / 'research/B03/b03.css').read_bytes(), original_css)

    def test_empty_editorial_field(self):
        self.manifest['en']['excerpt'] = ' '; self.save()
        self.assertEqual(self.run_cli('--output', self.output), 1)

    def test_missing_source(self):
        (self.source / 'de.docx').unlink()
        self.assertEqual(self.run_cli('--output', self.output), 1)

    def test_identical_translation_inputs(self):
        shutil.copy(self.source / 'ko.docx', self.source / 'en.docx')
        self.assertEqual(self.run_cli('--output', self.output), 1)

    def test_wrong_code_prevents_duplicate_under_new_id(self):
        self.manifest['id'] = 'A100'; self.manifest['researchCode'] = 'A100'; self.save()
        self.assertEqual(self.run_cli('--output', self.output), 1)

    def test_legacy_identity_blocks_publication_but_allows_dry_run(self):
        self.add_existing()
        before = inventory(self.repo)
        r = build(self.manifest_path, self.repo, self.output)
        self.assertTrue(r['conversion_passed'])
        self.assertEqual(r['conflicting_articles'], ['legacy-old'])
        self.assertFalse(r['publish_ready'])
        self.assertEqual(self.run_cli('--publish'), 1)
        self.assertEqual(before, inventory(self.repo))

    def test_existing_empty_destination_cannot_be_overwritten(self):
        (self.repo / 'research/A99').mkdir()
        with patch('research_docx.links_check', return_value={'local_errors': [], 'external': [], 'passed': True}):
            self.assertEqual(self.run_cli('--publish'), 1)

    def test_case_insensitive_duplicate(self):
        self.add_existing('a99')
        self.assertIn('a99', archive(self.repo)[1])
        self.assertEqual(self.run_cli('--publish'), 1)

    def test_publish_new_article_then_repeat_is_blocked(self):
        for lang in ('ko', 'en', 'de'):
            docx(self.source / (lang + '.docx'), lang, hyperlink='#part')
        old_index = self.index.read_bytes()
        self.assertEqual(self.run_cli('--publish'), 0)
        self.assertEqual(self.index.read_bytes(), old_index)
        before = inventory(self.repo)
        self.assertEqual(self.run_cli('--publish'), 1)
        self.assertEqual(before, inventory(self.repo))
        self.assertEqual(build_index(self.repo), 1)
        self.assertEqual(read_json(self.index)['articles'][0]['id'], 'A99')

    def test_dry_run_inside_repo_is_rejected(self):
        self.assertEqual(self.run_cli('--output', self.repo / 'preview'), 1)

    def test_dry_run_never_overwrites_preview(self):
        self.output.mkdir(); (self.output / 'sentinel').write_text('keep', encoding='utf-8')
        self.assertEqual(self.run_cli('--output', self.output), 1)
        self.assertEqual((self.output / 'sentinel').read_text(encoding='utf-8'), 'keep')

    def test_unsafe_id(self):
        self.manifest['id'] = '../escape'; self.save()
        self.assertEqual(self.run_cli('--publish'), 1)

    def test_local_missing_target_and_fragment(self):
        for lang in ('ko', 'en', 'de'):
            docx(self.source / (lang + '.docx'), lang, hyperlink='absent.html#missing')
        r = build(self.manifest_path, self.repo, self.output)
        self.assertFalse(r['conversion_passed'])
        self.assertTrue(r['links']['local_errors'])
        self.assertEqual(self.run_cli('--publish'), 1)

    def test_missing_anchor(self):
        for lang in ('ko', 'en', 'de'):
            docx(self.source / (lang + '.docx'), lang, hyperlink='#missing')
        r = build(self.manifest_path, self.repo, self.output)
        self.assertFalse(r['conversion_passed'])

    def test_unsafe_hyperlink(self):
        docx(self.source / 'en.docx', 'en', hyperlink='javascript:alert(1)')
        self.assertEqual(self.run_cli('--output', self.output), 1)

    def test_external_404_and_unverified_responses(self):
        build(self.manifest_path, self.repo, self.output)
        for code, status in ((404, 'BROKEN'), (403, 'UNVERIFIED')):
            with patch('research_docx.urlopen', side_effect=HTTPError('https://example.com', code, 'error', {}, None)):
                r = links_check(self.output, self.repo, 'A99', True)
            self.assertFalse(r['passed'])
            self.assertEqual(r['external'][0]['status'], status)

    def test_external_unchecked_blocks_publication(self):
        self.assertEqual(self.run_cli('--publish'), 1)
        self.assertFalse((self.repo / 'research/A99').exists())

    def test_unsupported_features_fail_closed(self):
        before = inventory(self.repo)
        for feature in ('vMerge', 'footnoteReference', 'fldChar', 'sdt', 'ins', 'del', 'object'):
            docx(self.source / 'en.docx', 'en', feature=f'<w:p><w:r><w:{feature}/></w:r></w:p>')
            with self.subTest(feature=feature):
                self.assertEqual(self.run_cli('--publish'), 1)
                self.assertEqual(inventory(self.repo), before)

    def test_index_validation_does_not_replace_existing_index(self):
        folder = self.add_existing()
        old = self.index.read_bytes()
        m = read_json(folder / 'meta.json'); del m['de']; (folder / 'meta.json').write_text(json.dumps(m), encoding='utf-8')
        with self.assertRaises(Invalid):
            build_index(self.repo)
        self.assertEqual(self.index.read_bytes(), old)

    def test_index_rejects_missing_page_and_duplicate_id(self):
        folder = self.add_existing()
        old = self.index.read_bytes()
        (folder / 'de.html').unlink()
        with self.assertRaises(Invalid):
            build_index(self.repo)
        self.assertEqual(self.index.read_bytes(), old)
        (folder / 'de.html').write_text('original', encoding='utf-8')
        duplicate = self.repo / 'research/duplicate'
        shutil.copytree(folder, duplicate)
        with self.assertRaises(Invalid):
            build_index(self.repo)
        self.assertEqual(self.index.read_bytes(), old)

    def test_duplicate_json_keys_rejected(self):
        self.manifest_path.write_text('{"id":"A99","id":"A100"}', encoding='utf-8')
        self.assertEqual(self.run_cli('--output', self.output), 1)

    def test_lock_blocks_concurrent_publisher(self):
        (self.repo / '.research-publication.lock').write_text('busy', encoding='utf-8')
        self.assertEqual(self.run_cli('--publish'), 1)
        self.assertTrue((self.repo / '.research-publication.lock').exists())

    def test_malformed_docx_is_blocked(self):
        (self.source / 'en.docx').write_bytes(b'not a zip')
        self.assertEqual(self.run_cli('--publish'), 1)
        self.assertFalse((self.repo / 'research/A99').exists())

    def test_rollback_failed_copy_preserves_existing_archive(self):
        before = inventory(self.repo)
        for lang in ('ko', 'en', 'de'):
            docx(self.source / (lang + '.docx'), lang, hyperlink='#part')
        with patch('research_docx.shutil.copyfile', side_effect=OSError('disk full')):
            self.assertEqual(self.run_cli('--publish'), 1)
        self.assertEqual(inventory(self.repo), before)
        self.assertFalse((self.repo / 'research/A99').exists())

    def test_external_success_enables_publish(self):
        class Response:
            status = 200
            def __enter__(self): return self
            def __exit__(self, *args): pass
        with patch('research_docx.urlopen', return_value=Response()):
            self.assertEqual(self.run_cli('--publish', '--check-external'), 0)
        self.assertTrue((self.repo / 'research/A99/meta.json').is_file())


if __name__ == '__main__':
    unittest.main()
