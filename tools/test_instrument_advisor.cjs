const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const url = process.env.CHAT_QA_URL || 'http://127.0.0.1:8000/configurator.html';
(async () => {
  const { priceConfiguration } = await import('../worker/quote-consult/src/pricing.js');
  const browser = await chromium.launch({ executablePath: process.env.CONFIGURATOR_BROWSER_PATH || undefined });
  try {
    for (const width of [375, 1440]) for (const language of ['ko', 'en', 'de']) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, acceptDownloads: true });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      let calls = 0;
      await page.route('**/chat', route => {
        calls++;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'Editable enquiry draft', quote: priceConfiguration({ model: 'EMBLA', selections: { fretboard: 'ebony' } }) }) });
      });
      await page.goto(url + '?advisor=1&lang=' + language);
      const panel = page.locator('.rf-chat-panel'); await panel.waitFor();
      await panel.locator('.rf-chat-actions button').first().click();
      await panel.locator('.rf-chat-quote').waitFor();
      // A recommendation must not change the selected model until accepted.
      assert.equal(await page.locator('[data-model="EDDA"]').getAttribute('aria-pressed'), 'true');
      await panel.locator('.rf-chat-quote summary').click();
      await panel.locator('.rf-chat-quote button').click();
      assert.equal(await page.locator('[data-model="EMBLA"]').getAttribute('aria-pressed'), 'true');
      await panel.locator('.rf-chat-actions button').nth(2).click();
      const draft = panel.locator('#rf-enquiry-draft'); await draft.waitFor();
      await draft.fill('Reviewed by visitor');
      const downloading = page.waitForEvent('download');
      await panel.locator('.rf-chat-draft button').click();
      const download = await downloading;
      assert.equal(download.suggestedFilename(), 'RavenForge-enquiry.txt');
      const fs = require('node:fs/promises');
      assert.equal(await fs.readFile(await download.path(), 'utf8'), 'Reviewed by visitor');
      assert.equal(calls, 2, 'editing and saving must not send an enquiry or call AI');
      const bounds = await panel.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: 6 advisor flows; explicit apply, editable enquiry, local download and no automatic send.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
