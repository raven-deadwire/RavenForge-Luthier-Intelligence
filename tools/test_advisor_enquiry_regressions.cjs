// Deterministic UI regression tests. Responses are mocked; this does not test an AI model.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const url = process.env.CHAT_QA_URL || 'http://127.0.0.1:8000/configurator.html';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CONFIGURATOR_BROWSER_PATH || undefined });
  const failures = [];
  let checked = 0;
  try {
    for (const language of ['ko', 'en', 'de']) for (const model of ['EDDA', 'EMBLA', 'ASKR', 'GRAMR']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const requests = [];
      let failNext = true;
      const finishColor = 'Transparent blue / 투명 파랑 / Transparentblau';
      const specialInstructions = 'Please confirm strap balance / 스트랩 균형 확인 / Balance prüfen';
      await page.route('**/chat', route => {
        requests.push(route.request().postDataJSON());
        const failed = failNext;
        failNext = false;
        return route.fulfill({ status: failed ? 429 : 200, contentType: 'application/json',
          body: JSON.stringify(failed ? { error: 'Please retry' } : { reply: 'Draft from the retry', quote: null }) });
      });
      try {
        await page.goto(url + '?lang=' + language);
        await page.locator(`[data-model="${model}"]`).click();
        await page.locator('[data-step="3"]').click();
        await page.locator('#finish-color').fill(finishColor);
        await page.locator('[data-step="5"]').click();
        await page.locator('#special-instructions').fill(specialInstructions);
        await page.locator('.rf-chat-launcher').click();
        const panel = page.locator('.rf-chat-panel');
        await panel.locator('.rf-chat-actions button').nth(2).click();
        await panel.locator('[role="alert"]').waitFor();
        // Report both regressions rather than stop after the first missing field.
        for (const [field, expected] of Object.entries({ finishColor, specialInstructions })) {
          try { assert.equal(requests[0].configuration[field], expected); }
          catch { failures.push(`${language}/${model}: ${field} missing from enquiry request`); }
        }
        const prompt = await panel.locator('.rf-chat-form textarea').inputValue();
        assert.ok(prompt.length > 0);
        await panel.locator('.rf-chat-form button').click();
        await panel.getByText('Draft from the retry', { exact: true }).first().waitFor();
        assert.equal(requests.length, 2);
        assert.deepEqual(requests[1], requests[0], 'retry must preserve the failed request');
        if (await panel.locator('#rf-enquiry-draft').count() !== 1) {
          failures.push(`${language}/${model}: successful retry did not create an editable enquiry`);
        } else {
          const edited = 'Reviewed / 검토 / Geprüft';
          await panel.locator('#rf-enquiry-draft').fill(edited);
          const downloading = page.waitForEvent('download');
          await panel.locator('.rf-chat-draft button').click();
          const download = await downloading;
          assert.equal(download.suggestedFilename(), 'RavenForge-enquiry.txt');
          assert.equal(await fs.readFile(await download.path(), 'utf8'), edited);
          assert.equal(requests.length, 2, 'editing/saving must not make a request');
        }
        // A new question after a failed draft is not a request to make a draft.
        await panel.locator('.rf-chat-header-actions button').first().click();
        failNext = true;
        await panel.locator('.rf-chat-actions button').nth(2).click();
        await panel.locator('[role="alert"]').waitFor();
        await panel.locator('.rf-chat-form textarea').fill('Explain the current pickup instead.');
        await panel.locator('.rf-chat-form button').click();
        await panel.getByText('Draft from the retry', { exact: true }).first().waitFor();
        assert.equal(await panel.locator('#rf-enquiry-draft').count(), 0);
        assert.deepEqual(errors, []);
        checked++;
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
  assert.deepEqual(failures, [], failures.join('\n'));
  console.log(`PASS: ${checked} model/language enquiry context and retry flows (mocked).`);
})().catch(error => { console.error(error); process.exitCode = 1; });
