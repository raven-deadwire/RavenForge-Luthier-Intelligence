import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { priceWithChanges, withPageNames } from '../src/pricing.js';
import { withSpecifications, standardSpecificationText } from '../src/specifications.js';

// Independent page oracle: execute the source helpers and runtime catalog, not
// the generated Worker copy being tested. No model/provider calls occur here.
const require = createRequire(import.meta.url);
const html = fs.readFileSync(new URL('../../../configurator.html', import.meta.url), 'utf8');
function between(start, end) {
  const first = html.indexOf(start);
  const last = html.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `${start} still exists in the page`);
  return html.slice(first, last);
}
const context = vm.createContext({ window: {}, RavenForgePlatforms: require('../../../assets/configurator-platforms.js') });
vm.runInContext(fs.readFileSync(new URL('../../../assets/configurator-ui.js', import.meta.url), 'utf8'), context);
context.ui = context.window.RF_CONFIG_I18N.en;
vm.runInContext(`${between('const specialOptionsList = [', 'const App = () => {')}
${between('const isCategoryVisible =', 'const getDefaultSelections =')}
${between('const stepConfig =', 'const getAutomaticPowerSupply =')}
${between('const getAutomaticPowerSupply =', 'const handleNext =')}
this.page = { configData, specialOptionsList, isCategoryVisible, isOptionVisible, getAutomaticPowerSupply, stepConfig };`, context);
const page = context.page;
require('../../../assets/configurator-preview.js').configureTestOptions(page.configData, context.window.RF_CONFIG_I18N);

const languages = ['ko', 'en', 'de'];
const change = (category, option) => ({ category, option });
const electronics = option => change('electronics', option);
const makeQuote = (model, changes = [], instrumentOptions = [], language = 'en') => withPageNames(
  priceWithChanges({ model, selections: {}, specialOptions: [], accessories: [] }, { changes, instrumentOptions }), language);
const ids = (specification, category) => specification.available_categories
  .find(entry => entry.category === category)?.options.map(option => option.option) || [];

const powerCases = [
  { id: 'EDDA default', model: 'EDDA', voltage: null, status: 'not_required' },
  { id: 'EDDA xPure', model: 'EDDA', extras: ['delano_buffer'], voltage: 9, status: 'required' },
  { id: 'EDDA NFP rejects xPure', model: 'EDDA', changes: [electronics('nfp')], extras: ['delano_buffer'], voltage: 9, status: 'required' },
  { id: 'EDDA supported John East', model: 'EDDA', changes: [electronics('eq01')], voltage: 9, status: 'required' },
  { id: 'EDDA custom filter', model: 'EDDA', changes: [electronics('dual_filter')], voltage: 9, status: 'required' },
  { id: 'EMBLA default', model: 'EMBLA', voltage: 9, status: 'required' },
  { id: 'EMBLA Noll', model: 'EMBLA', changes: [electronics('noll')], voltage: 9, status: 'required' },
  { id: 'EMBLA supported Uni Pre', model: 'EMBLA', changes: [electronics('john_east')], voltage: 9, status: 'required' },
  { id: 'ASKR Fishman', model: 'ASKR', voltage: 9, status: 'required' },
  { id: 'ASKR Tone Capsule', model: 'ASKR', changes: [electronics('darkglass')], voltage: 18, status: 'required' },
  { id: 'ASKR Glockenklang', model: 'ASKR', changes: [electronics('glockenklang')], voltage: 18, status: 'required' },
  { id: 'ASKR LHZ classic', model: 'ASKR', changes: [electronics('lhz')], voltage: 9, status: 'required' },
  { id: 'ASKR LHZ headroom', model: 'ASKR', changes: [electronics('lhz'), change('lhz_voltage', 'lhz_18v')], voltage: 18, status: 'required' },
  { id: 'GRAMR planned', model: 'GRAMR', voltage: null, status: 'confirmation_required' },
  { id: 'GRAMR passive', model: 'GRAMR', changes: [electronics('guitar_passive')], voltage: null, status: 'not_required' }
];

for (const language of languages) {
  test(`${language}: power, visible menus and localized specs match the actual page; all quote fields survive`, () => {
    for (const scenario of powerCases) {
      const original = makeQuote(scenario.model, scenario.changes, scenario.extras, language);
      const before = structuredClone(original);
      const result = withSpecifications(original, language);
      const { specification, ...unchangedQuote } = result;
      assert.deepEqual(unchangedQuote, before, scenario.id);
      assert.deepEqual(original, before, 'enrichment must not mutate the quote');
      assert.equal(specification.model, scenario.model);
      assert.equal(specification.selected.power.status, scenario.status, scenario.id);
      assert.equal(specification.selected.power.voltage, scenario.voltage, scenario.id);
      assert.equal(specification.selected.power.battery_required,
        scenario.status === 'confirmation_required' ? null : scenario.status === 'required', scenario.id);

      const ui = context.window.RF_CONFIG_I18N[language];
      context.selectedModel = scenario.model;
      context.ui = ui;
      const applied = original.lines.filter(line => line.category === 'instrument_options').map(line => line.option);
      const power = page.getAutomaticPowerSupply(original.selections, applied);
      assert.equal(specification.selected.power.page_label, power.label, scenario.id);
      assert.equal(specification.selected.power.page_spec, power.spec, scenario.id);

      const visible = [...page.configData.categories]
        .filter(category => page.stepConfig.some(step => step.categories.includes(category.id)))
        .filter(category => !context.RavenForgePlatforms.fixed(scenario.model)[category.id] && page.isCategoryVisible(category, original.selections))
        .map(category => ({ category, options: [...category.options].filter(option =>
          page.isOptionVisible(category.id, option.id, scenario.model, original.selections) &&
          (category.id === 'top_wood_selection' || option.prices?.[scenario.model] != null)) }))
        .filter(entry => entry.options.length);
      assert.deepEqual(specification.available_categories.map(category => category.category),
        visible.map(entry => entry.category.id), scenario.id);
      for (const { category, options } of visible) {
        const actual = specification.available_categories.find(entry => entry.category === category.id);
        assert.equal(actual.page_title, ui.categoryTitles[category.id] || category.title);
        assert.deepEqual(actual.options.map(option => option.option), options.map(option => option.id));
        options.forEach((option, index) => {
          const spec = option.specByModel?.[scenario.model] || option.spec || '';
          assert.equal(actual.options[index].page_label, ui.optionLabels?.[option.id] || ui.catalog?.[option.label] || option.label);
          assert.equal(actual.options[index].spec, spec);
          assert.equal(actual.options[index].page_spec, ui.optionSpecs?.[option.id] || ui.catalog?.[spec] || spec);
        });
      }
      const offeredExtras = [...page.specialOptionsList]
        .filter(option => scenario.model === 'GRAMR' ? ['kill_switch', 'dual_tone'].includes(option.id) : option.id !== 'locking_jack')
        .filter(option => !option.requiresPassive || ['passive', 'guitar_passive'].includes(original.selections.electronics));
      assert.deepEqual(specification.available_instrument_options.map(option => option.option), offeredExtras.map(option => option.id));
      assert.deepEqual(specification.selected.instrument_options.map(option => option.option), applied);
    }
  });

  test(`${language}: regress xPure, exact EDDA products, EMBLA defaults and GRAMR menus`, () => {
    const edda = withSpecifications(makeQuote('EDDA', [], ['delano_buffer'], language), language);
    assert.equal(edda.specification.standard.power.status, 'not_required');
    assert.equal(edda.specification.selected.electronics.circuit_type, 'passive');
    assert.equal(edda.specification.selected.power.voltage, 9);
    assert.equal(edda.total, 2200);
    assert.equal(edda.specification.selected.instrument_options[0].requires_passive_controls, true);
    assert.deepEqual(ids(edda.specification, 'electronics'), ['passive', 'nfp', 'eq01', 'dual_filter']);

    for (const option of ['john_east', 'glockenklang', 'lhz']) {
      const rejected = withSpecifications(makeQuote('EDDA', [electronics(option)], [], language), language);
      assert.ok(rejected.not_applied.some(entry => entry.option === option));
      assert.equal(rejected.specification.selected.electronics.option, 'passive');
      assert.ok(!ids(rejected.specification, 'electronics').includes(option));
    }
    const eq01 = withSpecifications(makeQuote('EDDA', [electronics('eq01')], [], language), language);
    assert.equal(eq01.specification.selected.electronics.label, 'John East ACG EQ-01');
    assert.equal(eq01.not_applied.length, 0);
    assert.equal(eq01.total, 2500);

    const embla = withSpecifications(makeQuote('EMBLA', [electronics('passive')], [], language), language);
    assert.equal(embla.specification.standard.electronics.option, 'zuta');
    assert.equal(embla.specification.selected.electronics.label, 'Zuta Bass Core');
    assert.equal(embla.specification.selected.electronics.circuit_type, 'active');
    assert.ok(embla.not_applied.some(entry => entry.option === 'passive'));
    assert.ok(!ids(embla.specification, 'electronics').includes('passive'));
    assert.equal(embla.specification.standard.fretboard.option, 'wenge', 'free rosewood is not the default');

    for (const option of ['ebony', 'others']) {
      const gramr = withSpecifications(makeQuote('GRAMR', [change('fretboard', option)], [], language), language);
      assert.deepEqual(ids(gramr.specification, 'fretboard'), ['guitar_indian_rosewood']);
      assert.equal(gramr.specification.standard.electronics.circuit_type, 'unconfirmed');
      assert.equal(gramr.specification.selected.power.battery_required, null);
      assert.ok(gramr.not_applied.some(entry => entry.option === option));
      assert.equal(gramr.total, 2000);
    }
  });
}

test('conditional LHZ menu appears only after a real dependency transition; rejected xPure is absent', () => {
  const initial = withSpecifications(makeQuote('ASKR'), 'en');
  assert.deepEqual(ids(initial.specification, 'lhz_voltage'), []);
  const changed = withSpecifications(makeQuote('ASKR', [electronics('lhz')]), 'en');
  assert.deepEqual(ids(changed.specification, 'lhz_voltage'), ['lhz_9v', 'lhz_18v']);
  assert.notEqual(changed.selections.pickups, 'fishman');
  const active = withSpecifications(makeQuote('EDDA', [electronics('nfp')], ['delano_buffer']), 'ko');
  assert.ok(active.extras_not_available.includes('delano_buffer'));
  assert.deepEqual(active.specification.selected.instrument_options, []);
  assert.ok(!active.specification.available_instrument_options.some(option => option.option === 'delano_buffer'));
});

test('standard facts are generated per model and bad quotes pass through without invented facts', () => {
  const summaries = standardSpecificationText().split('\n').map(JSON.parse);
  assert.deepEqual(summaries.map(entry => [entry.model, entry.standard.electronics.option]), [
    ['EDDA', 'passive'], ['EMBLA', 'zuta'], ['ASKR', 'fishman'], ['GRAMR', 'guitar_zuta_core']
  ]);
  for (const invalid of [null, { error: 'rejected' }, { model: 'OTHER', lines: [], selections: {} }]) {
    assert.equal(withSpecifications(invalid, 'ko'), invalid);
  }
  assert.deepEqual(withSpecifications(makeQuote('EDDA'), 'xx'), withSpecifications(makeQuote('EDDA'), 'en'));
});

test('fixed platform specifications are never described as selectable menus', () => {
  for (const model of ['EDDA', 'EMBLA', 'ASKR', 'GRAMR']) for (const language of languages) {
    const { specification } = withSpecifications(makeQuote(model), language);
    const fixed = context.RavenForgePlatforms.fixed(model);
    assert.equal(specification.fixed_specifications.length, Object.keys(fixed).length);
    for (const [category, option] of Object.entries(fixed)) {
      assert.equal(specification.fixed_specifications.find(entry => entry.category === category).value.option, option);
      assert.deepEqual(ids(specification, category), [], `${model}/${category} is a fixed value, not a menu`);
    }
    assert.ok(ids(specification, 'electronics').length > 0);
    assert.ok(ids(specification, 'fretboard').length > 0);
  }
});
