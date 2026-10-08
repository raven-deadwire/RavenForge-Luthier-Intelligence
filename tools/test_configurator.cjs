#!/usr/bin/env node
'use strict';

/*
 * Browser regression checks for the customer configurator.
 *
 *   node tools/test_configurator.cjs
 *   node tools/test_configurator.cjs --url http://localhost:8000/configurator.html
 *   node tools/test_configurator.cjs --bootstrap
 *   node tools/test_configurator.cjs --pdf-only
 *
 * Requires Playwright and Chromium (npx playwright install chromium).
 * CODEX_PRIMARY_RUNTIME_NODE_MODULES is supported for the workspace runtime.
 * CONFIGURATOR_BROWSER_PATH can select an existing Chromium executable.
 * HTTPS_PROXY/HTTP_PROXY are honored for CDN access, with loopback bypassed.
 * CONFIGURATOR_IGNORE_HTTPS_ERRORS=1 is available for a test proxy whose CA is
 * absent from Chromium's trust store; this choice is recorded in report.json.
 * CONFIGURATOR_QA_DIR selects the output directory; the default is a temporary
 * directory outside the repository. Real CDN scripts and real PDF generation
 * are used. No application selections, prices or React state are mocked.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');

const args = process.argv.slice(2);
const arg = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const bootstrapOnly = args.includes('--bootstrap');
const pdfOnly = args.includes('--pdf-only');
const root = path.resolve(__dirname, '..');
const runtimeRequire = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '__qa__.cjs'))
  : require;
const { chromium } = runtimeRequire('playwright');

const expectedModels = [
  { id: 'EDDA', strings: /\b4[ -]?strings?\b/i, scale: /\b34(?:["″”]|[ -]inch)/ },
  { id: 'EMBLA', strings: /\b5[ -]?strings?\b/i, scale: /\b34(?:["″”]|[ -]inch)/ },
  { id: 'ASKR', strings: /\b5[ -]?strings?\b/i, scale: /37["″”]?\s*[–—-]\s*34(?:["″”]|[ -]inch)/, bridge: /Payson/i },
  { id: 'GRAM', strings: /\b6[ -]?(?:guitar )?strings?\b/i, scale: /25\.5(?:["″”]|[ -]inch)/, bridge: /Gotoh\s+510T-FE1/i },
];
const fixedCategories = ['orientation', 'strings', 'scale', 'nut_size', 'string_spacing', 'hardware_bridge', 'pickup_configuration', 'pickups', 'electronics'];
const noShortScale = /short[ -]?scale|숏\s*스케일|\b(?:30|32|33)["″”]/i;

function browserProxy() {
  const value = process.env.CONFIGURATOR_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!value) return undefined;
  const url = new URL(value);
  return {
    server: `${url.protocol}//${url.host}`,
    bypass: 'localhost,127.0.0.1,[::1]',
    username: decodeURIComponent(url.username) || undefined,
    password: decodeURIComponent(url.password) || undefined,
  };
}

async function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const filename = path.resolve(root, '.' + pathname);
      if (filename !== root && !filename.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      const data = await fs.readFile(filename);
      response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' }).end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/configurator.html` };
}

async function run() {
  const output = process.env.CONFIGURATOR_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'ravenforge-configurator-qa-'));
  await fs.mkdir(output, { recursive: true });
  const ignoreHTTPSErrors = process.env.CONFIGURATOR_IGNORE_HTTPS_ERRORS === '1';
  const report = { started: new Date().toISOString(), bootstrapOnly, pdfOnly, ignoreHTTPSErrors, output, checks: [], pageErrors: [], failedRequests: [], consoleErrors: [] };
  let server;
  let browser;
  let page;
  let activeCheck = 'bootstrap';
  try {
    let url = arg('--url') || process.env.CONFIGURATOR_URL;
    if (!url) ({ server, url } = await serve());
    report.url = url;
    browser = await chromium.launch({ headless: true, executablePath: process.env.CONFIGURATOR_BROWSER_PATH || undefined, proxy: browserProxy() });
    report.browser = browser.version();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, acceptDownloads: true, ignoreHTTPSErrors });
    page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => {
      report.pageErrors.push(error.message);
      console.error(`PAGE ERROR: ${error.message}`);
    });
    page.on('requestfailed', request => {
      const failure = { url: request.url(), error: request.failure()?.errorText };
      report.failedRequests.push(failure);
      console.error(`REQUEST FAILED: ${failure.url} (${failure.error})`);
    });
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.getByRole('button', { name: /EDDA/ }).waitFor({ timeout: 30000 });
    assert.equal(await page.evaluate(() => typeof React), 'object', 'React must load from the actual page');
    assert.equal(await page.evaluate(() => typeof html2pdf), 'function', 'PDF dependency must load from the actual page');
    assert.equal(report.pageErrors.length, 0, 'Page must bootstrap without runtime errors');
    report.checks.push({ name: 'bootstrap with actual page dependencies', result: 'PASS' });
    console.log('PASS: bootstrap with actual page dependencies');
    if (bootstrapOnly) {
      await page.screenshot({ path: path.join(output, 'bootstrap.png'), fullPage: true });
      report.result = 'BOOTSTRAP_PASS';
      return;
    }

    const check = async (name, action, { pdf = false } = {}) => {
      if (pdfOnly && !pdf) return;
      activeCheck = name;
      await action();
      report.checks.push({ name, result: 'PASS' });
      console.log(`PASS: ${name}`);
    };
    const step = async number => {
      await page.locator(`button[data-step="${number}"]`).click();
    };
    const chooseModel = async id => {
      await step(1);
      await page.locator(`button[data-model="${id}"]`).click();
      await page.waitForFunction(model => document.querySelector('#ui-header')?.textContent.includes(model), id);
    };
    const summary = () => page.locator('#quote-summary-card').innerText();
    const option = (category, value) => page.locator(`input[type="radio"][name="${category}"][value="${value}"]`);
    const assertSpecs = (text, model, fullSummary = true) => {
      assert.match(text, new RegExp(`\\b${model.id}\\b`), `${model.id} must be identified`);
      assert.match(text, model.strings, `${model.id} string count`);
      assert.match(text, model.scale, `${model.id} scale`);
      if (model.bridge) assert.match(text, model.bridge, `${model.id} bridge`);
      if (model.id === 'GRAM') {
        assert.match(text, /\b24[ -]?(?:frets?|F)\b|frets?\s*24\b/i, 'Gram must identify 24 frets');
        if (fullSummary) assert.match(text, /\bHH\b|dual humbucker|2 humbuckers/i, 'Gram must retain its HH layout');
      }
    };

    for (const model of expectedModels) {
      await check(`${model.id}: fixed core and read-only future options`, async () => {
        await chooseModel(model.id);
        assertSpecs(await page.locator('[data-fixed-platform]').innerText(), model, false);
        assertSpecs(await summary(), model);
        if (model.id === 'ASKR') {
          assert.match(await page.locator('button[data-model="ASKR"]').innerText(), /€\s*3,?100/);
          assert.match(await summary(), /Base Model\s*\(ASKR\)\s*€\s*3,?100/i);
        }
        if (model.id === 'GRAM') {
          const card = await page.locator('button[data-model="GRAM"]').innerText();
          assert.match(card, /price on request|quote/i);
          assert.doesNotMatch(card, /€\s*(?:0|null|undefined|NaN)\b/);
        }
        const future = page.locator('[data-future-options]');
        assert.ok(await future.count(), `${model.id} must disclose future options`);
        if (await future.getAttribute('open') === null) await future.locator('summary').click();
        assert.match(await future.innerText(), /추후\s*추가\s*예정|planned|future|coming/i);
        assert.ok(await future.locator('[data-planned-option]').count(), 'Future options must be shown after expansion');
        assert.equal(await future.locator('[data-planned-option]:not([aria-disabled="true"])').count(), 0, 'Every future option must be marked disabled');
        assert.equal(await future.locator('input:enabled, select:enabled, button:enabled, textarea:enabled, a[href]').count(), 0, 'Future options cannot be configured');
        assert.doesNotMatch(await future.innerText(), noShortScale, 'Short scale cannot appear in future options');
        for (let number = 1; number <= 5; number++) {
          await step(number);
          for (const category of fixedCategories) {
            assert.equal(await page.locator(`input[name="${category}"]:enabled, select[name="${category}"]:enabled`).count(), 0, `${model.id}: ${category} must not be selectable`);
          }
          assert.doesNotMatch(await page.locator('body').innerText(), noShortScale, 'Short scale cannot appear in the configurator');
        }
        assertSpecs(await summary(), model);
      });
    }

    await check('ASKR: Fishman package is matched and alternative electronics are future options', async () => {
      await chooseModel('ASKR');
      await step(5);
      assert.match(await page.locator('[data-category="pickups"]').innerText(), /Fishman Fluence/);
      assert.match(await page.locator('[data-category="electronics"]').innerText(), /Fishman Fluence 2 band/);
      assert.equal(await page.locator('input[name="pickups"], input[name="electronics"]').count(), 0, 'Electronics package must stay fixed');
      assert.equal(await page.locator('input[name="coil_switch"]').count(), 0, 'Dedicated Fishman voice controls replace generic coil switching');
      assert.match(await summary(), /Fishman Fluence/);
      assert.match(await summary(), /9V/);
      const future = page.locator('[data-future-options]');
      if (await future.getAttribute('open') === null) await future.locator('summary').click();
      const alternative = future.locator('[data-planned-option="darkglass"]');
      assert.equal(await alternative.getAttribute('aria-disabled'), 'true');
      const before = await summary();
      await alternative.click({ force: true });
      assert.equal(await summary(), before, 'Clicking a future option cannot change the quote');
      await chooseModel('EMBLA');
      await step(5);
      if (await future.getAttribute('open') === null) await future.locator('summary').click();
      const underhill = future.locator('[data-planned-option="underhill"]');
      assert.equal(await underhill.getAttribute('aria-disabled'), 'true');
      const emblaBefore = await summary();
      await underhill.click({ force: true });
      assert.equal(await summary(), emblaBefore, 'Future Underhill package cannot override the current package');
    });

    await check('Model switching: bass configuration does not leak into Gram', async () => {
      await chooseModel('ASKR');
      await step(5);
      await page.getByRole('checkbox', { name: /Castle flight hard case/ }).check();
      await page.locator('textarea').fill('Bass-only setup: BEADG');
      assert.match(await summary(), /Castle flight hard case/);
      await chooseModel('GRAM');
      const text = await summary();
      assertSpecs(text, expectedModels[3]);
      assert.doesNotMatch(text, /Payson|LHZ|Tone Capsule|Bass Core|Fluence 2 band|Lusithand|Cali Dub|BEADG|fretless|slap ramp|finger ramp|Castle flight hard case/i);
      assert.match(text, /price on request|pricing.*confirm|quote.*request/i, 'Gram requires a quote');
      assert.doesNotMatch(text, /€\s*(?:0(?:\.00)?|null|undefined|NaN)\b/, 'Unknown Gram pricing must not render a zero or invalid total');
      await step(5);
      assert.equal(await page.locator('input[name="lhz_voltage"]').count(), 0);
      await chooseModel('EDDA');
      assertSpecs(await summary(), expectedModels[0]);
      assert.doesNotMatch(await summary(), /25\.5|Gotoh\s+510T-FE1|LHZ|Payson/i);
    });

    await check('Available appearance choices update the summary', async () => {
      await chooseModel('EDDA');
      await step(4);
      await option('hardware_color', 'hw_gold').check();
      assert.equal(await option('hardware_color', 'hw_gold').isChecked(), true);
      const row = page.locator('#quote-list-container > div').filter({ hasText: /Hardware Color/i });
      assert.match(await row.innerText(), /gold/i);
      assert.match(await row.innerText(), /150/);
      assertSpecs(await summary(), expectedModels[0]);
    });

    await check('Language changes preserve the configured instrument', async () => {
      for (const language of ['ko', 'de', 'en']) {
        await page.locator(`button[data-language="${language}"]`).click();
        assert.equal(await page.locator('html').getAttribute('lang'), language);
        assert.equal(await option('hardware_color', 'hw_gold').isChecked(), true);
        assertSpecs(await summary(), expectedModels[0]);
        assert.match(await summary(), /gold/i);
      }
    });

    await check('Actual Gram PDF exports the current specification and quote status', async () => {
      await chooseModel('GRAM');
      await step(5);
      const note = 'QA specification note: keep approved 6-string 25.5-inch platform.';
      await page.locator('textarea').fill(note);
      await page.evaluate(() => {
        window.__configuratorPdfInputs = [];
        // Observe the actual library boundary, then run the original export.
        // This does not replace PDF rendering or change the application state.
        const originalFrom = html2pdf.Worker.prototype.from;
        html2pdf.Worker.prototype.from = function (source, ...rest) {
          let text = source?.innerText || '';
          // Detached snapshots have textContent-style innerText without block
          // separators. Render an invisible copy briefly to read the text as
          // the export renderer will, while leaving its original input intact.
          if (source instanceof HTMLElement && !source.isConnected) {
            const probe = source.cloneNode(true);
            Object.assign(probe.style, { position: 'fixed', left: '-10000px', top: '0', opacity: '0', pointerEvents: 'none' });
            probe.removeAttribute('id');
            probe.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
            document.body.appendChild(probe);
            text = probe.innerText;
            probe.remove();
          }
          window.__configuratorPdfInputs.push({ text, id: source?.id || '' });
          return originalFrom.call(this, source, ...rest);
        };
      });
      const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
      await page.getByRole('button', { name: /Save.*PDF/i }).click();
      const download = await downloadPromise;
      assert.match(download.suggestedFilename(), /RavenForge_GRAM.*\.pdf/i);
      const pdf = path.join(output, download.suggestedFilename());
      await download.saveAs(pdf);
      assert.equal(await download.failure(), null);
      const buffer = await fs.readFile(pdf);
      assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
      assert.ok(buffer.length > 10000, 'PDF should contain rendered content');
      const inputs = await page.evaluate(() => window.__configuratorPdfInputs);
      assert.equal(inputs.length, 1);
      await fs.writeFile(path.join(output, 'gram-pdf-source.txt'), inputs[0].text);
      assertSpecs(inputs[0].text, expectedModels[3]);
      assert.ok(inputs[0].text.includes(note), 'Current special instructions must be exported');
      assert.match(inputs[0].text, /price on request|pricing.*confirm|quote.*request/i);
      assert.doesNotMatch(inputs[0].text, /€\s*(?:0(?:\.00)?|null|undefined|NaN)\b|Payson|LHZ|BEADG/i);
      await page.getByRole('button', { name: /Save.*PDF/i }).waitFor();
      assert.equal(await page.locator('#ui-header').isVisible(), true, 'Web summary must be restored after export');
      assert.equal(await page.locator('#pdf-header').isVisible(), false, 'PDF-only header must be hidden after export');
      report.pdf = { filename: path.basename(pdf), bytes: buffer.length };
    }, { pdf: true });

    await check('PDF export keeps its original model when selection changes during generation', async () => {
      await chooseModel('GRAM');
      await page.evaluate(() => { window.__configuratorPdfInputs = []; });
      const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
      await page.getByRole('button', { name: /Save.*PDF/i }).click();
      const edda = page.locator('button[data-model="EDDA"]');
      // A disabled selector or an immutable export snapshot are both valid.
      if (await edda.isEnabled()) await edda.click();
      const download = await downloadPromise;
      assert.match(download.suggestedFilename(), /RavenForge_GRAM.*\.pdf/i);
      await download.saveAs(path.join(output, 'race-' + download.suggestedFilename()));
      const inputs = await page.evaluate(() => window.__configuratorPdfInputs);
      assert.equal(inputs.length, 1);
      await fs.writeFile(path.join(output, 'gram-pdf-during-model-switch.txt'), inputs[0].text);
      assertSpecs(inputs[0].text, expectedModels[3]);
      assert.doesNotMatch(inputs[0].text, /Base Model\s*\(EDDA\)|4 strings|34["″”]\s*\(long scale\)/i,
        'Changing the live model must not put EDDA content in a GRAM-named PDF');
    });

    await check('Mobile layout retains accessible model selection', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await chooseModel('GRAM');
      const future = page.locator('[data-future-options]');
      if (await future.getAttribute('open') !== null) await future.locator('summary').click();
      assertSpecs(await page.locator('[data-fixed-platform]').innerText(), expectedModels[3], false);
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      assert.ok(dimensions.scrollWidth <= dimensions.width + 1, `Mobile page must not overflow horizontally (${JSON.stringify(dimensions)})`);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(output, 'gram-mobile.png'), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1080 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(output, 'gram-desktop.png'), fullPage: true });
    });

    assert.deepEqual(report.pageErrors, [], 'No browser runtime errors during interaction');
    assert.deepEqual(report.failedRequests, [], 'All requested application assets must load');
    report.result = 'PASS';
  } catch (error) {
    report.result = 'FAIL';
    report.checks.push({ name: activeCheck, result: 'FAIL', error: error.stack });
    if (page) {
      await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
      await fs.writeFile(path.join(output, 'failure-body.txt'), await page.locator('body').innerText().catch(() => '')).catch(() => {});
    }
    console.error(`FAIL: ${activeCheck}\n${error.stack}`);
    process.exitCode = 1;
  } finally {
    report.finished = new Date().toISOString();
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`Report: ${path.join(output, 'report.json')}`);
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
