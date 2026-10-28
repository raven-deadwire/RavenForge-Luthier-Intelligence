'use strict';

// Deterministic high-density quote fixture. Select the most expensive finite
// option in each currently available category, then all compatible extras.
// This is not a global maximum across mutually exclusive/request-priced paths.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../configurator.html'), 'utf8');
const section = (start, end) => html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start)));
const context = vm.createContext({ RavenForgePlatforms: require('../assets/configurator-platforms.js') });
vm.runInContext(section('const specialOptionsList', 'const configData = {') +
  section('const configData = {', 'const App = () => {') +
  section('const isCategoryVisible =', 'const getDefaultSelections =') +
  '\nthis.fixture = {configData, specialOptionsList, accessoriesList, normalizeSelections, isCategoryVisible, isOptionVisible};', context);
const api = context.fixture;
require('../assets/configurator-preview.js').configureTestOptions(api.configData);

module.exports = async ({page, step, selectOption, model}) => {
  const selections = {};
  const category = id => api.configData.categories.find(c => c.id === id);
  // Revisit categories once so later parent changes expose their dependent fields.
  for (let pass = 0; pass < 2; pass++) {
    for (let number = 1; number <= 5; number++) {
      await step(number);
      const names = await page.locator('input[type="radio"][name]').evaluateAll(inputs => [...new Set(inputs.map(i => i.name))]);
      for (const name of names) {
        const group = category(name);
        if (!group) continue;
        const ids = await page.locator(`input[type="radio"][name="${name}"]:enabled`).evaluateAll(inputs => inputs.map(i => i.value));
        const current = api.normalizeSelections(model.id, selections);
        const priced = group.options.filter(o => ids.includes(o.id)).map(o => ({id:o.id, price:o.prices[name === 'top_wood_selection' ? current.top_type : model.id]})).filter(o => typeof o.price === 'number');
        priced.sort((a,b) => b.price-a.price);
        if (priced[0]) { await selectOption(name, priced[0].id); selections[name] = priced[0].id; }
      }
      Object.assign(selections, await page.locator('input[type="radio"]:checked').evaluateAll(inputs => Object.fromEntries(inputs.map(i => [i.name,i.value]))));
    }
  }
  if (model.fixtureType === 'fretless') {
    await step(2);
    await selectOption('fret_type', 'fretless');
    // #67 keeps the nut independent: first confirm an alternative is allowed.
    await selectOption('nut_material', 'nut_bone');
    assert.equal(await page.locator('input[name="fret_type"][value="fretless"]').isChecked(), true);
    await selectOption('nut_material', 'nut_verawood');
  }
  await step(4);
  const colour = {EDDA:'gold',EMBLA:'black',ASKR:'chrome',GRAMR:'gold'}[model.id];
  const hardware = category('hardware_color').options.find(o => o.id === colour || o.label === colour);
  assert.ok(hardware, 'Known hardware colour');
  await selectOption('hardware_color', hardware.id);
  await step(5);
  for (const input of await page.locator('input[type="checkbox"]:enabled').all()) await input.check();
  const specials = await page.locator('input[data-special-option]:checked').evaluateAll(inputs => inputs.map(i => i.dataset.specialOption));
  const accessories = await page.locator('input[data-accessory]:checked').evaluateAll(inputs => inputs.map(i => i.dataset.accessory));
  assert.ok(accessories.includes('leather_strap'));
  // Read the final UI selections again after dependencies have settled.
  const selected = {};
  for (let number = 1; number <= 5; number++) {
    await step(number);
    Object.assign(selected, await page.locator('input[type="radio"]:checked').evaluateAll(inputs => Object.fromEntries(inputs.map(i => [i.name,i.value]))));
  }
  const normalized = api.normalizeSelections(model.id, selected);
  let total = model.basePrice;
  const ledger = [];
  for (const c of api.configData.categories) {
    if (!api.isCategoryVisible(c, normalized)) continue;
    const o = c.options.find(o => o.id === normalized[c.id]);
    if (!o || !api.isOptionVisible(c.id, o.id, model.id, normalized)) continue;
    const price = o.prices[c.id === 'top_wood_selection' ? normalized.top_type : model.id];
    if (typeof price === 'number') total += price;
    ledger.push({category:c.id, option:o.id, price});
  }
  for (const [ids, catalog] of [[specials,api.specialOptionsList],[accessories,api.accessoriesList]]) {
    for (const id of ids) { const o=catalog.find(o=>o.id===id); assert.ok(o); total+=o.price; ledger.push({option:id,price:o.price}); }
  }
  await page.locator('textarea').fill('A'.repeat(1001));
  assert.equal((await page.locator('textarea').inputValue()).length,1000, 'Enforce cap, including paste/fill');
  await page.locator('textarea').fill('');
  const rows = await Promise.all((await page.locator('#quote-list-container > div').all()).map(row => row.innerText()));
  assert.ok(rows.length >= 35, 'Exercise a dense option summary');
  return {total, ledger, selections:normalized, specials, accessories, colour, rows};
};
