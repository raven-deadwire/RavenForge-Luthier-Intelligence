#!/usr/bin/env node
'use strict';

/*
 * Browser regression checks for the customer configurator.
 *
 *   node tools/test_configurator.cjs
 *   node tools/test_configurator.cjs --url http://localhost:8000/configurator.html
 *   node tools/test_configurator.cjs --bootstrap
 *   node tools/test_configurator.cjs --pdf-only
 *   node tools/test_configurator.cjs --case 'ASKR: electronics'
 *   node tools/test_configurator.cjs --from 'EDDA: neck'
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
const caseFilter = arg('--case');
const fromFilter = arg('--from');
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
const fixedCategories = ['orientation', 'strings', 'scale', 'nut_size', 'string_spacing', 'hardware_bridge', 'pickup_configuration', 'fretboard_extense'];
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
  const report = { started: new Date().toISOString(), bootstrapOnly, pdfOnly, caseFilter, fromFilter, ignoreHTTPSErrors, output, checks: [], pageErrors: [], failedRequests: [], consoleErrors: [] };
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

    let selectedChecks = 0;
    let reachedFrom = !fromFilter;
    const check = async (name, action, { pdf = false } = {}) => {
      if (!reachedFrom && name.toLowerCase().includes(fromFilter.toLowerCase())) reachedFrom = true;
      if (!reachedFrom) return;
      if (pdfOnly && !pdf) return;
      if (caseFilter && !name.toLowerCase().includes(caseFilter.toLowerCase())) return;
      selectedChecks += 1;
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
    const freshModel = async id => {
      await step(1);
      if (await page.locator(`button[data-model="${id}"]`).getAttribute('aria-pressed') === 'true') {
        await chooseModel(id === 'EDDA' ? 'EMBLA' : 'EDDA');
      }
      await chooseModel(id);
    };
    const summary = () => page.locator('#quote-summary-card').innerText();
    const option = (category, value) => page.locator(`input[type="radio"][name="${category}"][value="${value}"]`);
    const selectOption = async (category, value) => {
      const input = option(category, value);
      assert.ok(await input.count(), `${category}/${value} must be a current option`);
      assert.equal(await input.isEnabled(), true, `${category}/${value} must be enabled`);
      await input.check();
      assert.equal(await input.isChecked(), true, `${category}/${value} selection must survive normalization`);
      assert.equal(await page.locator(`[data-future-options] [data-planned-option="${value}"]`).count(), 0,
        `${category}/${value} cannot also be presented as a future option`);
    };
    const summaryRows = pattern => page.locator('#quote-list-container > div').filter({
      has: page.locator(':scope > div > div:first-child').filter({ hasText: pattern }),
    });
    const summaryValue = async (category, pattern) => {
      const row = summaryRows(category);
      assert.equal(await row.count(), 1, `Expected one summary row for ${category}`);
      assert.match(await row.innerText(), pattern);
    };
    const quotedAmount = async () => {
      const text = await page.locator('[data-summary-total]').innerText();
      assert.doesNotMatch(text, /€\s*(?:null|undefined|NaN)\b/);
      const match = text.match(/€\s*([\d,]+(?:\.\d+)?)/);
      assert.ok(match, 'Known bass prices must retain a numeric amount');
      const amount = Number(match[1].replaceAll(',', ''));
      assert.ok(Number.isFinite(amount) && amount > 0);
      return amount;
    };
    const observePdf = async () => page.evaluate(() => {
      window.__configuratorPdfInputs = [];
      if (window.__configuratorPdfObserved) return;
      window.__configuratorPdfObserved = true;
      const originalFrom = html2pdf.Worker.prototype.from;
      html2pdf.Worker.prototype.from = function (source, ...rest) {
        let text = source?.innerText || '';
        // Observe a rendered copy of detached input without changing the input
        // or mocking the renderer. This preserves its visible block separators.
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
          assert.equal(await quotedAmount(), 3100, 'ASKR includes the standard Payson bridge in its base price');
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
          const modelFixed = fixedCategories.filter(category => !(model.id === 'ASKR' && category === 'hardware_bridge'));
          for (const category of [...modelFixed, ...(model.id === 'GRAM' ? ['fret_type'] : [])]) {
            assert.equal(await page.locator(`input[name="${category}"]:enabled, select[name="${category}"]:enabled`).count(), 0, `${model.id}: ${category} must not be selectable`);
          }
          const reopenByStep = {
            2: ['neck', 'neck_profile', 'nut_material', 'radius'],
            3: ['body_construction'],
            4: ['hardware_machine_head', ...(model.id === 'ASKR' ? ['hardware_bridge'] : [])],
            5: ['pickups', 'electronics', 'control_layout'],
          };
          for (const category of reopenByStep[number] || []) {
            assert.ok(await page.locator(`input[name="${category}"]:enabled`).count() > 1,
              `${model.id}: ${category} must expose its current customization choices`);
          }
          assert.doesNotMatch(await page.locator('body').innerText(), noShortScale, 'Short scale cannot appear in the configurator');
        }
        assertSpecs(await summary(), model);
      });
    }

    await check('EDDA: neck customization and fretless dependencies remain available', async () => {
      await freshModel('EDDA');
      await step(2);
      await selectOption('neck', '3pc');
      await selectOption('neck_profile', 'profile_custom');
      await selectOption('radius', 'rad_compound');
      await selectOption('fret_material', 'mat_stainless');
      await summaryValue(/^Neck$/i, /3 piece maple/i);
      await summaryValue(/^Neck Profile/i, /custom profile/i);
      await summaryValue(/^Radius/i, /compound/i);
      await selectOption('fret_type', 'fretless');
      await summaryValue(/^Nut Material/i, /guayacan/i);
      await summaryValue(/^Fret Type/i, /fretless/i);
      assert.match(await page.locator('[data-fixed-platform]').innerText(), /fretless/i,
        'The current specification overview must reflect fretless selection');
      assert.equal(await page.locator('input[name="fret_material"], input[name="fret_size"]').count(), 0);
      assert.equal(await summaryRows(/^Fret (Material|Size)/i).count(), 0);
      await selectOption('fretline', 'line_yes');
      await selectOption('fret_type', 'fret_24');
      await summaryValue(/^Nut Material/i, /brass|zero.fret.*guide/i);
      assert.ok(await page.locator('input[name="fret_material"]').count());
      assert.ok(await page.locator('input[name="fret_size"]').count());
      assert.equal(await page.locator('input[name="fretline"]').count(), 0);
      assert.equal(await summaryRows(/^Fretline/i).count(), 0);
      assert.equal(await option('neck', '3pc').isChecked(), true);
      assert.equal(await option('neck_profile', 'profile_custom').isChecked(), true);
      assert.equal(await option('radius', 'rad_compound').isChecked(), true);
      await step(5);
      await selectOption('control_layout', 'control_custom');
      await selectOption('coil_switch', 'coil_2_pcts');
      await summaryValue(/^(Control Layout|Controls & Wiring)/i, /custom/i);
      await summaryValue(/^Select Coil Switch/i, /2.*parallel.*coil.*series/i);
      await quotedAmount();
    });

    await check('EMBLA: solid-body wood, tuner and EQ choices update independently', async () => {
      await freshModel('EMBLA');
      const base = await quotedAmount();
      await step(3);
      await selectOption('body_construction', '1pc_solid');
      await selectOption('body_wood_single', 'limba');
      assert.equal(await page.locator('input[name="body_core_wood"], input[name="body_wing_wood"]').count(), 0);
      assert.equal(await summaryRows(/^(Core Wood|Side Wing Wood)/i).count(), 0);
      await summaryValue(/^Body Wood/i, /limba/i);
      assert.equal(await quotedAmount(), base + 100, 'Solid body surcharge is counted once');
      for (const id of ['1pc_chambered', '3pc_chambered']) {
        assert.equal(await option('body_construction', id).count(), 0);
        assert.equal(await page.locator(`[data-planned-option="${id}"]`).getAttribute('aria-disabled'), 'true');
      }
      await step(5);
      await selectOption('electronics', 'underhill');
      await summaryValue(/^Onboard EQ/i, /Underhill Cali Dub/i);
      assert.equal(await quotedAmount(), base + 100 + 340);
      await selectOption('electronics', 'noll');
      await summaryValue(/^Onboard EQ/i, /Noll TCM-4XM/i);
      assert.equal(await quotedAmount(), base + 100 + 250);
      await step(4);
      await selectOption('hardware_machine_head', 'gotoh_350');
      await summaryValue(/^Hardware - Machine Head/i, /Gotoh GB350/i);
      await summaryValue(/^Body Construction/i, /1 piece solid/i);
      await summaryValue(/^Body Wood/i, /limba/i);
      assert.equal(await quotedAmount(), base + 100 + 250 + 70);
    });

    await check('ASKR: electronics synchronization, EMG selection, power and prices', async () => {
      await freshModel('ASKR');
      const base = await quotedAmount();
      await step(5);
      assert.equal(await option('pickups', 'fishman').isChecked(), true);
      assert.equal(await option('electronics', 'fishman').isChecked(), true);
      assert.match(await summary(), /Fishman Fluence/);
      await summaryValue(/^Power Supply/i, /9V/);
      await selectOption('electronics', 'darkglass');
      assert.notEqual(await page.locator('input[name="pickups"]:checked').inputValue(), 'fishman');
      await selectOption('pickups', 'emg');
      await summaryValue(/^Pickups/i, /EMG\s+40TWX/i);
      await summaryValue(/^Power Supply/i, /18V/);
      assert.equal(await quotedAmount(), base + 165 + 245);
      await step(4);
      await selectOption('hardware_color', 'hw_black');
      await step(5);
      assert.equal(await option('pickups', 'emg').isChecked(), true, 'An unrelated appearance change must retain EMG');
      await selectOption('electronics', 'lhz');
      assert.equal(await option('pickups', 'emg').isChecked(), true, 'Compatible EQ change must retain the selected pickup');
      await summaryValue(/^Power Supply/i, /9V/);
      await selectOption('lhz_voltage', 'lhz_18v');
      await summaryValue(/^Power Supply/i, /18V/);
      assert.equal(await quotedAmount(), base + 270 + 245);
      await selectOption('electronics', 'fishman');
      assert.equal(await option('pickups', 'fishman').isChecked(), true);
      assert.equal(await page.locator('input[name="lhz_voltage"], input[name="coil_switch"]').count(), 0);
      await summaryValue(/^Power Supply/i, /9V/);
      assert.equal(await quotedAmount(), base);
      await selectOption('pickups', 'emg');
      assert.notEqual(await page.locator('input[name="electronics"]:checked').inputValue(), 'fishman',
        'Choosing EMG directly must leave the dedicated Fishman EQ');
      await summaryValue(/^Pickups/i, /EMG\s+40TWX/i);
      await quotedAmount();
    });

    await check('ASKR: Payson and Nova Parts pricing stays explicit', async () => {
      await freshModel('ASKR');
      assert.match(await page.locator('button[data-model="ASKR"]').innerText(), /€\s*3,?100/);
      assert.match(await summary(), /Base Model\s*\(ASKR\)\s*€\s*3,?100/i);
      await step(4);
      assert.equal(await option('hardware_bridge', 'payson').isChecked(), true);
      assert.equal(await quotedAmount(), 3100);
      assert.equal(await page.locator('[data-nova-hardware-color-note]').count(), 0);
      await selectOption('hardware_bridge', 'nova_parts');
      await summaryValue(/^Hardware - Bridge/i, /Nova Parts 5-string multiscale bridge/i);
      await summaryValue(/^Hardware - Bridge/i, /Dingwall Retrofit; 18 mm spacing; black anodized aluminium/i);
      await summaryValue(/^Hardware - Bridge/i, /-\s*€\s*70/);
      assert.match(await page.locator('[data-fixed-platform]').innerText(), /Nova/i);
      assert.equal(await quotedAmount(), 3030, 'Nova reduces the included-bridge base price by €70');
      assert.match(await page.locator('[data-summary-total]').innerText(), /Estimated total/i);
      assert.doesNotMatch(await page.locator('[data-summary-total]').innerText(), /subtotal|on.request|quoted separately/i,
        'The standard black Nova bridge must have a priced total');
      const novaNote = await page.locator('[data-nova-hardware-color-note]').innerText();
      assert.match(novaNote, /black anodized aluminium/i);
      assert.match(novaNote, /selected hardware colour applies to the other hardware/i);
      assert.ok((await summaryRows(/^Hardware Color/i).innerText()).includes(novaNote),
        'The black bridge exception must also appear in the specification');
      await selectOption('hardware_color', 'hw_gold');
      await summaryValue(/^Hardware Color/i, /gold/i);
      await summaryValue(/^Hardware - Bridge/i, /black anodized aluminium/i);
      assert.equal(await quotedAmount(), 3180, 'The other hardware keeps its ordinary gold surcharge');
      const before = await summary();
      await chooseModel('ASKR');
      assert.equal(await summary(), before, 'Reselecting ASKR must preserve the Nova bridge and other hardware colour');
      await step(4);
      assert.equal(await option('hardware_bridge', 'nova_parts').isChecked(), true);
      assert.equal(await option('hardware_color', 'hw_gold').isChecked(), true);
      await selectOption('hardware_color', 'hw_chrome');
      assert.equal(await quotedAmount(), 3030);
      const future = page.locator('[data-future-options]');
      if (await future.getAttribute('open') === null) await future.locator('summary').click();
      assert.ok(await future.locator('[data-planned-option]').count());
      assert.equal(await future.locator('[data-planned-option]:not([aria-disabled="true"])').count(), 0);
      assert.equal(await future.locator('input:enabled, select:enabled, button:enabled, textarea:enabled, a[href]').count(), 0);
      assert.doesNotMatch(await future.innerText(), noShortScale);
      await selectOption('hardware_bridge', 'payson');
      assert.equal(await quotedAmount(), 3100);
      await summaryValue(/^Hardware - Bridge/i, /Payson/);
      assert.equal(await page.locator('[data-nova-hardware-color-note]').count(), 0);
      assert.doesNotMatch(await summaryRows(/^Hardware Color/i).innerText(), /Nova|other hardware|black anodized/i);
    });

    await check('ASKR: Nova PDF includes its discount, fit specification and black bridge note', async () => {
      await freshModel('ASKR');
      await step(4);
      await selectOption('hardware_bridge', 'nova_parts');
      assert.equal(await quotedAmount(), 3030);
      const novaNote = await page.locator('[data-nova-hardware-color-note]').innerText();
      await observePdf();
      const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
      await page.getByRole('button', { name: /Save.*PDF/i }).click();
      const download = await downloadPromise;
      assert.match(download.suggestedFilename(), /RavenForge_ASKR.*\.pdf/i);
      const pdf = path.join(output, download.suggestedFilename());
      await download.saveAs(pdf);
      assert.equal(await download.failure(), null);
      const buffer = await fs.readFile(pdf);
      assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
      assert.ok(buffer.length > 10000);
      const inputs = await page.evaluate(() => window.__configuratorPdfInputs);
      assert.equal(inputs.length, 1);
      const text = inputs[0].text;
      await fs.writeFile(path.join(output, 'askr-nova-pdf-source.txt'), text);
      assertSpecs(text, { ...expectedModels[2], bridge: /Nova Parts/i });
      assert.match(text, /Base Model\s*\(ASKR\)\s*€\s*3,?100/i);
      assert.match(text, /Dingwall Retrofit; 18 mm spacing; black anodized aluminium/i);
      assert.match(text, /saddle travel, mounting angle and screw positions to be confirmed/i);
      assert.match(text, /-\s*€\s*70/);
      assert.ok(text.includes(novaNote), 'The other-hardware colour exception must be exported');
      assert.match(text, /Estimated total\s*€\s*3,?030/i);
      assert.doesNotMatch(text, /Priced items subtotal|Price on request/i);
      report.novaPdf = { filename: path.basename(pdf), bytes: buffer.length };
      await page.getByRole('button', { name: /Save.*PDF/i }).waitFor();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(output, 'askr-nova-desktop.png'), fullPage: true });
    }, { pdf: true });

    await check('GRAM: passive HH, neck and material customization survives same-model selection', async () => {
      await freshModel('GRAM');
      assert.doesNotMatch(await summary(), /Inferno Red/i, 'Gram must not assume a specific finish color');
      await step(2);
      await selectOption('neck', 'guitar_neck_custom');
      await selectOption('neck_profile', 'guitar_profile_custom');
      await selectOption('nut_material', 'guitar_graphite_nut');
      await selectOption('radius', 'guitar_radius_compound');
      await step(3);
      assert.equal(await option('color_top', 'top_gloss').isChecked(), true);
      assert.equal(await option('color_back_side', 'back_gloss').isChecked(), true);
      assert.equal(await page.locator('input[value="guitar_inferno_red"]').count(), 0);
      const finish = 'Midnight blue body with a natural maple neck';
      await page.locator('input[data-finish-color]').fill(finish);
      await selectOption('body_construction', 'guitar_body_3pc');
      await selectOption('body_wood_single', 'guitar_body_maple');
      await step(4);
      await selectOption('hardware_machine_head', 'guitar_tuner_custom');
      await step(5);
      await selectOption('pickups', 'guitar_hh_passive_custom');
      await selectOption('electronics', 'guitar_passive');
      await selectOption('control_layout', 'guitar_custom_wiring');
      await summaryValue(/^Neck$/i, /custom/i);
      await summaryValue(/^Nut Material/i, /graphite/i);
      await summaryValue(/^Body Wood/i, /maple/i);
      await summaryValue(/^Pickups/i, /HH|humbucker/i);
      await summaryValue(/^Power Supply/i, /No battery/i);
      assert.ok((await summary()).includes(finish), 'Requested color must appear in the specification');
      assertSpecs(await summary(), expectedModels[3]);
      assert.doesNotMatch(await summary(), /€\s*(?:0|null|undefined|NaN)\b/);
      await page.locator('textarea').fill('Keep this custom guitar specification.');
      const before = await summary();
      await chooseModel('GRAM');
      assert.equal(await summary(), before, 'Selecting the current model must preserve options and notes');
      await step(2);
      assert.equal(await option('neck', 'guitar_neck_custom').isChecked(), true);
      await step(5);
      assert.equal(await option('pickups', 'guitar_hh_passive_custom').isChecked(), true);
      assert.equal(await option('electronics', 'guitar_passive').isChecked(), true);
      await chooseModel('EDDA');
      assertSpecs(await summary(), expectedModels[0]);
      assert.doesNotMatch(await summary(), /Keep this custom guitar specification|Midnight blue body|Gotoh 510T-FE1|graphite|guitar humbuckers/i);
      await step(3);
      assert.equal(await page.locator('input[data-finish-color]').inputValue(), '', 'Changing models clears the previous finish request');
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
      await freshModel('EDDA');
      await step(3);
      const finish = 'Deep blue body, natural neck';
      await page.locator('input[data-finish-color]').fill(finish);
      await step(4);
      await selectOption('hardware_color', 'hw_gold');
      for (const language of ['ko', 'de', 'en']) {
        await page.locator(`button[data-language="${language}"]`).click();
        assert.equal(await page.locator('html').getAttribute('lang'), language);
        assert.equal(await option('hardware_color', 'hw_gold').isChecked(), true);
        assertSpecs(await summary(), expectedModels[0]);
        assert.match(await summary(), /gold/i);
        assert.ok((await summary()).includes(finish), 'Language changes must retain the finish request');
      }
    });

    await check('Actual Gram PDF exports the current specification and quote status', async () => {
      await freshModel('GRAM');
      await step(3);
      const finish = 'Graphite grey body with a natural maple neck';
      await page.locator('input[data-finish-color]').fill(finish);
      await step(5);
      const note = 'QA specification note: keep approved 6-string 25.5-inch platform.';
      await page.locator('textarea').fill(note);
      await observePdf();
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
      assert.ok(inputs[0].text.includes(finish), 'Requested finish color must be exported');
      assert.match(inputs[0].text, /price on request|pricing.*confirm|quote.*request/i);
      assert.doesNotMatch(inputs[0].text, /€\s*(?:0(?:\.00)?|null|undefined|NaN)\b|Payson|LHZ|BEADG/i);
      await page.getByRole('button', { name: /Save.*PDF/i }).waitFor();
      assert.equal(await page.locator('#ui-header').isVisible(), true, 'Web summary must be restored after export');
      assert.equal(await page.locator('#pdf-header').isVisible(), false, 'PDF-only header must be hidden after export');
      report.pdf = { filename: path.basename(pdf), bytes: buffer.length };
    }, { pdf: true });

    await check('PDF export keeps its original model when selection changes during generation', async () => {
      await freshModel('GRAM');
      await step(3);
      const finish = 'Metallic silver requested for the export snapshot';
      await page.locator('input[data-finish-color]').fill(finish);
      await step(1);
      await observePdf();
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
      assert.ok(inputs[0].text.includes(finish), 'Model changes during export must not remove its finish request');
      assert.doesNotMatch(inputs[0].text, /Base Model\s*\(EDDA\)|4 strings|34["″”]\s*\(long scale\)/i,
        'Changing the live model must not put EDDA content in a GRAM-named PDF');
    }, { pdf: true });

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

    assert.ok(selectedChecks > 0, 'The requested test filter must select at least one check');
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
