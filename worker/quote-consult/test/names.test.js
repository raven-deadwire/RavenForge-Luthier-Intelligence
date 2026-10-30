import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { configData, specialOptionsList, accessoriesList } from '../src/catalog.generated.js';
import { catalogText, pageCategoryTitle, pageOptionLabel, priceWithChanges, sanitizeConfiguration, withPageNames } from '../src/pricing.js';

// Read the page strings independently of the generated copy.
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(new URL('../../../assets/configurator-ui.js', import.meta.url), 'utf8'), context);
const pageCopy = context.window.RF_CONFIG_I18N;

test('category and option names match what configurator.html shows in each language', () => {
  for (const [language, ui] of Object.entries(pageCopy)) {
    for (const category of configData.categories) {
      assert.equal(pageCategoryTitle(language, category), ui.categoryTitles[category.id] || category.title, `${language} ${category.id}`);
      for (const option of category.options) {
        const shown = ui.optionLabels?.[option.id] || (option.label && ui.catalog?.[option.label]) || option.label;
        assert.equal(pageOptionLabel(language, option), shown, `${language} ${category.id}/${option.id}`);
      }
    }
    for (const option of [...specialOptionsList, ...accessoriesList]) {
      assert.equal(pageOptionLabel(language, option), ui.optionLabels?.[option.id] || ui.catalog?.[option.label] || option.label, `${language} ${option.id}`);
    }
  }
});

test('priced lines carry the page-language names', () => {
  const start = sanitizeConfiguration({ model: 'EMBLA', selections: {}, specialOptions: [], accessories: [] });
  const quote = withPageNames(priceWithChanges(start, { changes: [{ category: 'fretboard', option: 'ebony' }], accessories: ['flight_case'] }), 'ko');
  const fretboard = quote.lines.find(line => line.category === 'fretboard');
  assert.equal(fretboard.page_title, pageCopy.ko.categoryTitles.fretboard);
  assert.equal(fretboard.page_label, pageCopy.ko.catalog.ebony);
  assert.equal(quote.lines.find(line => line.category === 'accessories').page_title, pageCopy.ko.accessories);
  assert.equal(quote.total, 2550 + 50 + 400);
});

test('the catalog in the prompt lists the page names next to the catalog names', () => {
  const text = catalogText();
  assert.ok(text.includes(`fretboard — Fretboard (ko: ${pageCopy.ko.categoryTitles.fretboard}; de: ${pageCopy.de.categoryTitles.fretboard})`));
  assert.ok(text.includes(`ebony: ebony (ko: ${pageCopy.ko.catalog.ebony}; de: ${pageCopy.de.catalog.ebony})`));
});
