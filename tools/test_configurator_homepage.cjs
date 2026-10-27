'use strict';

// Invoked by test_configurator.cjs --homepage. Reuses its real browser, price
// helpers and PDF observer; no selections, quotes or PDF outputs are mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = async function homepageCases({ page, hostPage, report, output,
  expectedModels, step, selectOption, option, freshModel, quotedAmount, observePdf, summary }) {
  const verify = async (name, action) => {
    try {
      await action();
      report.checks.push({ name, result: 'PASS' });
      console.log(`PASS: ${name}`);
    } catch (error) {
      report.checks.push({ name, result: 'FAIL', error: error.stack });
      console.error(`FAIL: ${name}\n${error.message}`);
      // Continue independent cases so an existing live defect does not hide
      // the other models, language round trips or actual PDF evidence.
    }
  };
  const hostLanguage = async language => {
    await hostPage.locator(`#lang-${language === 'ko' ? 'kr' : language}-btn`).click();
    await page.waitForFunction(lang => document.documentElement.lang === lang, language);
  };
  const formState = async () => {
    const state = [];
    for (let number = 1; number <= 5; number++) {
      await step(number);
      state.push(await page.locator('input:checked, input[type="text"], textarea').evaluateAll(elements =>
        elements.map(element => ({ name: element.name, id: element.id,
          special: element.dataset.specialOption, accessory: element.dataset.accessory,
          value: element.value, checked: element.checked }))));
    }
    return state;
  };
  const norm = text => text.replace(/\s+/g, ' ').trim();
  const labels = {
    en: { colour: 'Desired colour', power: 'Power supply', notes: 'Special instructions', total: 'Estimated total', partial: 'Priced items subtotal' },
    ko: { colour: '원하는 색상', power: '전원', notes: '요청 사항', total: '예상 합계', partial: '가격 표시 항목 소계' },
    de: { colour: 'Gewünschte Farbe', power: 'Stromversorgung', notes: 'Besondere Wünsche', total: 'Geschätzter Gesamtpreis', partial: 'Zwischensumme mit Preisangabe' },
  };
  report.homepagePdfs = [];
  report.dotPrices = [];
  for (const model of expectedModels) {
    await hostLanguage('en');
    await freshModel(model.id);
    await step(2);
    await selectOption('inlay_type', 'inlay_dot');
    await verify(`${model.id}: included dot does not auto-select a paid material`, async () => {
      assert.equal(await option('inlay_dot_mat', 'dot_bw').isChecked(), true);
      assert.equal(await quotedAmount(), model.basePrice);
    });
    // Set explicitly after recording any failure above, so remaining live
    // checks can still examine identical representative configurations.
    await selectOption('inlay_dot_mat', 'dot_bw');
    await verify(`${model.id}: paid dot opt-in and free return`, async () => {
      await selectOption('inlay_dot_mat', 'dot_avalon');
      assert.equal(await quotedAmount(), model.basePrice + 110);
      await selectOption('inlay_dot_mat', 'dot_bw');
      assert.equal(await quotedAmount(), model.basePrice);
    });
    for (const language of ['ko', 'de', 'en']) {
      await verify(`${model.id}/${language}: paid dots survive language changes and reselection clears the surcharge`, async () => {
        await selectOption('inlay_dot_mat', 'dot_avalon');
        await hostLanguage(language);
        assert.equal(await option('inlay_dot_mat', 'dot_avalon').isChecked(), true);
        assert.equal(await quotedAmount(), model.basePrice + 110);
        await selectOption('inlay_type', 'inlay_none');
        assert.equal(await option('inlay_dot_mat', 'dot_avalon').count(), 0);
        assert.equal(await quotedAmount(), model.basePrice);
        await selectOption('inlay_type', 'inlay_dot');
        assert.equal(await option('inlay_dot_mat', 'dot_bw').isChecked(), true);
        assert.equal(await quotedAmount(), model.basePrice);
        report.dotPrices.push({ model: model.id, language, included: model.basePrice, abalone: model.basePrice + 110 });
      });
      // Recover the known deployed defect so independent checks still run.
      await selectOption('inlay_dot_mat', 'dot_bw');
    }
    await step(5);
    const passive = model.id === 'EDDA' ? 'passive' : model.id === 'GRAMR' ? 'guitar_passive' : null;
    if (passive) {
      await verify(`${model.id}: passive extras clear and require explicit reselection`, async () => {
        await selectOption('electronics', passive);
        const extras = model.id === 'EDDA' ? ['dual_tone', 'delano_buffer'] : ['dual_tone'];
        const extra = id => page.locator(`input[data-special-option="${id}"]`);
        const base = await quotedAmount();
        for (const id of extras) await extra(id).check();
        assert.equal(await quotedAmount(), base + extras.length * 100);
        await selectOption('electronics', model.id === 'EDDA' ? 'nfp' : 'guitar_zuta_core');
        for (const id of extras) assert.equal(await extra(id).count(), 0);
        assert.equal(await quotedAmount(), model.basePrice + (model.id === 'EDDA' ? 340 : 0));
        await selectOption('electronics', passive);
        for (const id of extras) assert.equal(await extra(id).isChecked(), false);
        assert.equal(await quotedAmount(), base);
        for (const id of extras) await extra(id).check();
        assert.equal(await quotedAmount(), base + extras.length * 100);
      });
    } else {
      await verify(`${model.id}: active-only catalog and EQ transition`, async () => {
        assert.equal(await option('electronics', 'passive').count(), 0, 'Do not fabricate an unsupported passive path');
        await selectOption('electronics', model.id === 'EMBLA' ? 'noll' : 'darkglass');
        assert.equal(await quotedAmount(), model.basePrice + (model.id === 'EMBLA' ? 250 : 165));
        assert.equal(await page.locator('[data-special-option="dual_tone"], [data-special-option="delano_buffer"]').count(), 0);
      });
    }
    await selectOption('case', 'case_premium');
    const note = `QA ${model.id} · 드롭 A · Öl finish · 2026-10-23`;
    const colour = '#234567';
    await page.locator('textarea').fill(note);
    await step(3);
    await page.locator('[data-finish-color]').fill(colour);
    const before = await formState();
    const totalAmount = await quotedAmount();
    const englishSummary = await summary();
    const frameSrc = await hostPage.locator('#configurator iframe').getAttribute('src');
    // replaceState intentionally changes ?lang and can emit framenavigated;
    // the document's time origin distinguishes that from a real reload.
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    for (const language of ['ko', 'de', 'en']) {
      await verify(`${model.id}/${language}: homepage language preserves full form and quote`, async () => {
        await hostLanguage(language);
        assert.deepEqual(await formState(), before);
        assert.equal(await quotedAmount(), totalAmount);
        assert.equal(await hostPage.locator('#configurator iframe').getAttribute('src'), frameSrc);
        assert.equal(await page.evaluate(() => performance.timeOrigin), timeOrigin, 'Language changes must not reload the iframe');
        const text = await summary();
        assert.ok(text.includes(model.id) && text.includes(note) && text.includes(colour));
        const localized = labels[language];
        for (const key of ['colour', 'power', 'notes', ['ASKR', 'GRAMR'].includes(model.id) ? 'partial' : 'total']) {
          assert.ok(text.toLocaleLowerCase().includes(localized[key].toLocaleLowerCase()), `${language}: ${key}`);
        }
        if (language === 'en') assert.equal(text, englishSummary, 'Full summary must survive a round trip');
      });
      for (const material of ['dot_bw', 'dot_avalon']) {
      await verify(`${model.id}/${language}/${material}: actual PDF matches every quote row and amount`, async () => {
        await step(2);
        await selectOption('inlay_dot_mat', material);
        const expectedAmount = totalAmount + (material === 'dot_avalon' ? 110 : 0);
        assert.equal(await quotedAmount(), expectedAmount);
        // The PDF is always issued in English; compare it with the English summary.
        await page.evaluate(() => window.RavenForgeConfigurator.setLanguage('en'));
        await page.waitForFunction(() => document.documentElement.lang === 'en');
        const rows = await page.locator('#quote-list-container > div').allInnerTexts();
        const total = await page.locator('[data-summary-total]').innerText();
        await page.evaluate(lang => window.RavenForgeConfigurator.setLanguage(lang), language);
        await page.waitForFunction(lang => document.documentElement.lang === lang, language);
        await observePdf();
        const pending = hostPage.waitForEvent('download', { timeout: 60000 });
        await page.locator('#quote-actions-area button').click();
        const download = await pending;
        const key = `${language}-homepage-${material}-${model.id}`;
        const filename = `${key}.pdf`;
        await download.saveAs(path.join(output, filename));
        assert.equal(await download.failure(), null);
        const bytes = await fs.readFile(path.join(output, filename));
        assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
        assert.ok(bytes.length > 10000);
        const inputs = await page.evaluate(() => window.__configuratorPdfInputs);
        assert.equal(inputs.length, 1);
        for (const row of rows) assert.ok(norm(inputs[0].text).includes(norm(row)), `Missing PDF row: ${row}`);
        assert.ok(norm(inputs[0].text).includes(norm(total)));
        assert.ok(inputs[0].text.includes(note) && inputs[0].text.includes(colour));
        await fs.writeFile(path.join(output, `${key}-pdf-source.txt`), inputs[0].text);
        await fs.writeFile(path.join(output, `${key}-summary.txt`), await summary());
        await hostPage.screenshot({ path: path.join(output, `${key}.png`), fullPage: true });
        report.homepagePdfs.push({ filename, bytes: bytes.length, totalAmount: expectedAmount, material, rows: rows.length });
      });
      }
      await selectOption('inlay_dot_mat', 'dot_bw');
    }
  }
  assert.equal(report.homepagePdfs.length, 24, 'All four models, both dot materials and all three languages must produce real PDFs');
};
