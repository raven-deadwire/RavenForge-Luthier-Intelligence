// Configuration links and KakaoTalk sharing: a copied link restores the same
// configuration and price, tampered links fall back safely, and the KakaoTalk
// button appears only on Korean pages once a Kakao key is configured.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const url = process.env.SHARE_QA_URL || 'http://127.0.0.1:8000/configurator.html';

const totalText = page => page.locator('.rf-mobile-review strong').innerText();
const selectedModel = page => page.locator('[data-model][aria-pressed="true"]').getAttribute('data-model');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CONFIGURATOR_BROWSER_PATH || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(url).origin });
    const errors = [];

    // 1. Build a non-default configuration and copy its link.
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url + '?lang=en');
    await page.locator('[data-model="EMBLA"]').click();
    await page.locator('[data-step="2"]').click();
    await page.locator('input[name="fretboard"][value="ebony"]').check();
    await page.locator('#finish-color').fill('Deep forest green').catch(() => {});
    const expectedTotal = await totalText(page);
    assert.equal(await page.locator('[data-share-actions] button').count(), 1, 'only "copy link" without a Kakao key');
    await page.getByRole('button', { name: 'Copy configuration link', exact: true }).click();
    await page.getByText('Link copied', { exact: true }).waitFor();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    const shared = new URL(link);
    assert.equal(shared.pathname, new URL(url).pathname);
    assert.equal(shared.searchParams.get('lang'), 'en');
    assert.ok(shared.searchParams.get('cfg'), 'link carries the configuration');
    assert.ok(link.length < 2000, `link stays short (${link.length})`);

    // 2. Opening the link restores model, options and price.
    const restored = await context.newPage();
    restored.on('pageerror', error => errors.push(error.message));
    await restored.goto(link);
    await restored.locator('[data-model="EMBLA"][aria-pressed="true"]').waitFor();
    await restored.locator('[data-step="2"]').click();
    assert.equal(await restored.locator('input[name="fretboard"][value="ebony"]').isChecked(), true);
    assert.equal(await totalText(restored), expectedTotal);
    await restored.close();

    // 3. Tampered or unknown values are ignored instead of breaking the page.
    const forged = btoa(JSON.stringify({ v: 1, m: 'EMBLA', s: { fretboard: 'gold_bars', '<img>': 'x', strings: '<script>' }, o: ['nope'], a: ['nope'], f: 'x'.repeat(500) }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    for (const cfg of [forged, 'not-base64!!', btoa('{"v":1,"m":"NOPE"}')]) {
      const tampered = await context.newPage();
      tampered.on('pageerror', error => errors.push(error.message));
      await tampered.goto(url + '?lang=en&cfg=' + encodeURIComponent(cfg));
      await tampered.locator('[data-model][aria-pressed="true"]').waitFor();
      const model = await selectedModel(tampered);
      assert.ok(['EMBLA', 'EDDA'].includes(model), model);
      if (cfg === forged) {
        await tampered.locator('[data-step="2"]').click();
        assert.equal(await tampered.locator('input[name="fretboard"][value="gold_bars"]').count(), 0);
        assert.ok((await tampered.locator('#finish-color').inputValue().catch(() => '')).length <= 80);
      }
      await tampered.close();
    }
    await page.close();

    // 4. With a Kakao key: the button shows on Korean pages only and sends a text template.
    const kakao = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await kakao.route(/configurator\.html/, async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace('data-kakao-key=""', 'data-kakao-key="test-js-key"');
      await route.fulfill({ response, body });
    });
    await kakao.route(/t1\.kakaocdn\.net/, route => route.fulfill({ contentType: 'application/javascript', body: `
      window.__kakaoCalls = [];
      window.Kakao = { _init: null, isInitialized() { return Boolean(this._init); }, init(key) { this._init = key; },
        Share: { sendDefault(options) { window.__kakaoCalls.push({ key: window.Kakao._init, options }); } } };` }));
    for (const language of ['en', 'de']) {
      const other = await kakao.newPage();
      await other.goto(url + '?lang=' + language);
      await other.locator('[data-share-actions]').waitFor();
      assert.equal(await other.locator('[data-share-actions] button').count(), 1, `${language}: no Kakao button`);
      await other.close();
    }
    const ko = await kakao.newPage();
    ko.on('pageerror', error => errors.push(error.message));
    await ko.goto(url + '?lang=ko');
    await ko.locator('[data-model="ASKR"]').click();
    await ko.getByRole('button', { name: '카카오톡으로 공유', exact: true }).click();
    await ko.waitForFunction(() => window.__kakaoCalls?.length === 1);
    const [call] = await ko.evaluate(() => window.__kakaoCalls);
    assert.equal(call.key, 'test-js-key');
    assert.equal(call.options.objectType, 'text');
    assert.ok(call.options.text.length <= 200);
    assert.match(call.options.text, /ASKR/);
    assert.match(call.options.text, /세금·배송비 별도/);
    assert.equal(new URL(call.options.link.webUrl).searchParams.get('lang'), 'ko');
    assert.ok(new URL(call.options.link.mobileWebUrl).searchParams.get('cfg'));
    if (process.env.SHARE_QA_DIR) await ko.locator('#quote-summary-card').screenshot({ path: process.env.SHARE_QA_DIR + '/share-ko-mobile.png' });
    await kakao.close();

    assert.deepEqual(errors, []);
    console.log('PASS: configuration link copy/restore, tampered links, KakaoTalk button visibility and text template.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
