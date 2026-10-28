'use strict';

// Run through test_configurator.cjs --pdf-layout. Real UI selections, renderer
// and downloads; observe geometry without replacing the export implementation.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = async ({ page, hostPage, report, output, expectedModels, step, freshModel, quotedAmount }) => {
  await page.evaluate(() => {
    const originalFrom = html2pdf.Worker.prototype.from;
    html2pdf.Worker.prototype.from = function (source, ...args) {
      const probe = source.cloneNode(true);
      Object.assign(probe.style, { position: 'fixed', left: '-10000px', top: '0' });
      document.body.appendChild(probe);
      const pages = [...probe.querySelectorAll('[data-pdf-page]')];
      const violations = [];
      const images = [];
      for (const sheet of pages) {
        const bounds = sheet.getBoundingClientRect();
        const inside = (rect, text) => {
          if (rect.width && rect.height && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) {
            violations.push({ page: sheet.dataset.pdfPage, text: text.slice(0, 80), left: rect.left - bounds.left,
              right: rect.right - bounds.left, bottom: rect.bottom - bounds.top, width: bounds.width, height: bounds.height });
          }
        };
        const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          if (!walker.currentNode.data.trim()) continue;
          // pre-wrap preserves trailing spaces which may legally hang past
          // the line box. Measure ink-bearing tokens, not invisible spaces.
          for (const match of walker.currentNode.data.matchAll(/\S+/gu)) {
            const range = document.createRange();
            range.setStart(walker.currentNode, match.index);
            range.setEnd(walker.currentNode, match.index + match[0].length);
            for (const rect of range.getClientRects()) inside(rect, match[0]);
          }
        }
        for (const img of sheet.querySelectorAll('figure img')) {
          const rect = img.getBoundingClientRect(); inside(rect, img.alt);
          images.push({ alt: img.alt, widthMm: rect.width * 25.4 / 96, heightMm: rect.height * 25.4 / 96,
            cssWidthMm: parseFloat(img.style.width), cssHeightMm: parseFloat(img.style.height) });
        }
      }
      window.__pdfLayout = { pages: pages.length, text: probe.innerText, images, violations };
      probe.remove();
      return originalFrom.call(this, source, ...args);
    };
  });
  const notes = {
    default: '',
    prose: ('Check the finish, nut and setup before delivery. ').repeat(30).slice(0, 1000),
    multiline: Array.from({ length: 50 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')}: check setup.\n`).join('').slice(0, 1000),
    hyphen: ('Drop-A-setup-reference-').repeat(60).slice(0, 996) + 'END!',
  };
  report.pdfLayouts = [];
  const reference = new Map();
  for (const model of expectedModels) {
    await freshModel(model.id);
    for (const language of ['en', 'ko', 'de']) {
      await page.getByRole('button', { name: language === 'ko' ? 'KR' : language.toUpperCase(), exact: true }).click();
      for (const [profile, note] of Object.entries(notes)) {
        const key = `${language}-layout-${profile}-${model.id}`;
        try {
          await step(5);
          await page.locator('textarea').fill(note);
          assert.equal(await page.locator('textarea').inputValue(), note);
          assert.equal(await quotedAmount(), model.basePrice);
          const pending = hostPage.waitForEvent('download', { timeout: 60000 });
          await page.locator('#quote-actions-area button').click();
          const download = await pending;
          await download.saveAs(path.join(output, key + '.pdf'));
          assert.equal(await download.failure(), null);
          const layout = await page.evaluate(() => window.__pdfLayout);
          await fs.writeFile(path.join(output, key + '-layout.json'), JSON.stringify(layout, null, 2));
          await fs.writeFile(path.join(output, key + '-pdf-source.txt'), layout.text);
          report.pdfLayouts.push({ filename: key + '.pdf', profile, language, model: model.id, ...layout });
          assert.equal(await page.evaluate(() => document.documentElement.lang), language, 'Export must restore page language');
          assert.equal(layout.pages, ['default'].includes(profile) ? 1 : layout.pages);
          assert.ok(layout.pages >= 1 && layout.pages <= 2);
          assert.equal(layout.images.length, 2, 'Both rendered sides must be present');
          assert.deepEqual(layout.violations, [], 'No image or text may extend outside an A4 content page');
          assert.match(layout.text, /SPECIFICATION SUMMARY/);
          assert.match(layout.text, /Dimensions require approved drawings/);
          if (model.id === 'EDDA') {
            assert.match(layout.text, /Approximate photo\/concept scale/);
            for (const img of layout.images) assert.match(img.alt, /approx\. 1:/i);
          }
          assert.ok(layout.text.includes('€' + model.basePrice));
          if (note) assert.ok(layout.text.includes(note), 'Keep every instruction character');
          for (const img of layout.images) {
            assert.ok(Math.abs(img.widthMm - img.cssWidthMm) < .1);
            assert.ok(Math.abs(img.heightMm - img.cssHeightMm) < .1);
          }
          const identity = JSON.stringify({ text: layout.text, pages: layout.pages, images: layout.images });
          const ref = model.id + '/' + profile;
          if (language === 'en') reference.set(ref, identity);
          else assert.equal(identity, reference.get(ref), 'Language must not change PDF content, pagination or image size');
          report.checks.push({ name: key, result: 'PASS' });
          console.log('PASS: ' + key);
        } catch (error) {
          report.checks.push({ name: key, result: 'FAIL', error: error.stack });
          console.error('FAIL: ' + key + '\n' + error.message);
        }
      }
    }
  }
  assert.equal(report.pdfLayouts.length, 48, 'Every matrix case must download a real PDF');
  assert.ok(report.pdfLayouts.some(layout => layout.pages === 2), 'Exercise the two-page branch');
};
