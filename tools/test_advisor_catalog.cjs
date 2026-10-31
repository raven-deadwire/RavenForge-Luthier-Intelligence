// Regression for runtime catalog fields lost by the advisor. AI replies are mocked.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const url = process.env.CHAT_QA_URL || 'http://127.0.0.1:8000/configurator.html';
(async () => {
  const { priceConfiguration, sanitizeConfiguration, withPageNames } = await import('../worker/quote-consult/src/pricing.js');
  const browser = await chromium.launch({ executablePath: process.env.CONFIGURATOR_BROWSER_PATH || undefined });
  const failures = [];
  try {
    for (const language of ['ko', 'en', 'de']) for (const model of ['EDDA', 'EMBLA', 'ASKR', 'GRAMR']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const requests = [], quotes = [], errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/chat', route => {
        const body = route.request().postDataJSON();
        requests.push(body.configuration);
        const quote = withPageNames(priceConfiguration(sanitizeConfiguration(body.configuration)), language);
        quotes.push(quote);
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'Current configuration', quote }) });
      });
      try {
        await page.goto(url + '?lang=' + language);
        await page.locator(`[data-model="${model}"]`).click();
        await page.locator('[data-step="3"]').click();
        await page.locator('input[name="neck_finish"][value="neck_body"]').check();
        await page.locator('input[name="color_headstock"][value="head_natural"]').check();
        if (['EDDA', 'GRAMR'].includes(model)) {
          await page.locator('[data-step="4"]').click();
          if (model === 'EDDA') await page.locator('input[name="pickguard"][value="pg_add"]').check();
          await page.locator('input[name="pickguard_material"][value="pg_aluminium"]').check();
          await page.locator('input[name="pickguard_colour"][value="pg_white"]').check();
          await page.locator('input[name="pickguard_finish"][value="pg_gloss"]').check();
        }
        const before = await page.locator('#quote-list-container').innerText();
        await page.locator('.rf-chat-launcher').click();
        const panel = page.locator('.rf-chat-panel');
        await panel.locator('.rf-chat-actions button').nth(1).click();
        await panel.locator('.rf-chat-quote').waitFor();
        assert.equal(await page.locator('#quote-list-container').innerText(), before, 'comparison cannot mutate the configuration');
        await panel.locator('.rf-chat-quote summary').click();
        await panel.locator('.rf-chat-quote button').click();
        await panel.locator('.rf-chat-actions button').nth(1).click();
        await panel.locator('.rf-chat-quote').waitFor();
        try {
          assert.equal(quotes[0].price_on_request, true, 'unpriced options must keep the quote incomplete');
          assert.deepEqual(requests[1].selections, requests[0].selections, 'review/apply must preserve every current selection');
          assert.equal(await page.locator('#quote-list-container').innerText(), before);
          assert.equal(quotes[0].lines.find(line => line.category === 'neck_finish').page_label,
            { ko: '바디 색상 매칭', en: 'Match body colour', de: 'An Korpusfarbe anpassen' }[language]);
          assert.deepEqual(errors, []);
        } catch (error) { failures.push(`${language}/${model}: ${error.message}`); }
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
  assert.deepEqual(failures, [], failures.join('\n'));
  console.log('PASS: 12 runtime catalog, localized quote and explicit-apply regressions (mocked).');
})().catch(error => { console.error(error); process.exitCode = 1; });
