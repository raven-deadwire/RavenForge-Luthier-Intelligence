#!/usr/bin/env node
'use strict';

// Code-only contracts for stale selections. These do not replace browser/PDF QA.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'configurator.html'), 'utf8');
const platforms = require('../assets/configurator-platforms.js');
function between(start, end) {
  const first = html.indexOf(start);
  const last = html.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `Missing production source boundaries: ${start}`);
  return html.slice(first, last);
}
const dataSource = between('const configData = {', 'const App = () => {');
const normalizationSource = between('const isCategoryVisible =', 'const getDefaultSelections =');
const context = vm.createContext({ RavenForgePlatforms: platforms });
vm.runInContext(`${dataSource}\n${normalizationSource}\nthis.contract = { configData, normalizeSelections, isOptionVisible };`, context);
const { configData, normalizeSelections, isOptionVisible } = context.contract;
const group = id => configData.categories.find(category => category.id === id);
for (const entry of group('coil_switch').options) {
  const edda = normalizeSelections('EDDA', { coil_switch: entry.id });
  assert.equal(Object.hasOwn(edda, 'coil_switch'), false, `EDDA removes stale ${entry.id}`);
}
assert.equal(platforms.upcoming('EDDA', configData).some(category => category.categoryId === 'coil_switch'), false);
for (const entry of group('coil_switch').options.filter(option => platforms.isInitialOption('EMBLA', 'coil_switch', option.id))) {
  assert.equal(normalizeSelections('EMBLA', { coil_switch: entry.id }).coil_switch, entry.id, `EMBLA retains ${entry.id}`);
}
assert.equal(normalizeSelections('ASKR').coil_switch, undefined, 'Dedicated Fishman hides switching');
assert.equal(normalizeSelections('GRAMR').coil_switch, 'guitar_blade_selection');
for (const entry of group('nut_material').options) {
  assert.equal(normalizeSelections('GRAMR', { nut_material: entry.id }).nut_material, 'guitar_bone_nut');
}
for (const [model, count] of [['EDDA', 4], ['EMBLA', 7]]) {
  const bridges = group('hardware_bridge').options.filter(option => isOptionVisible('hardware_bridge', option.id, model, normalizeSelections(model)));
  assert.equal(bridges.length, count);
  for (const bridge of bridges) assert.equal(normalizeSelections(model, { hardware_bridge: bridge.id }).hardware_bridge, bridge.id);
}
for (const model of configData.models) {
  const cases = group('case').options;
  assert.equal(cases.find(option => option.id === 'case_premium').prices[model.id] - cases.find(option => option.id === 'case_standard').prices[model.id], 200);
  const dots = normalizeSelections(model.id, { inlay_type: 'inlay_dot' });
  assert.equal(dots.inlay_dot_mat, 'dot_bw', `${model.id}: choosing included dots defaults to the included material`);
  assert.equal(group('inlay_dot_mat').options.find(option => option.id === dots.inlay_dot_mat).prices[model.id], 0);
  const paidDots = normalizeSelections(model.id, { inlay_type: 'inlay_dot', inlay_dot_mat: 'dot_avalon' });
  assert.equal(paidDots.inlay_dot_mat, 'dot_avalon', `${model.id}: explicit paid material remains selectable`);
  assert.equal(group('inlay_dot_mat').options.find(option => option.id === paidDots.inlay_dot_mat).prices[model.id], 110);
  const noDots = normalizeSelections(model.id, { ...paidDots, inlay_type: 'inlay_none' });
  assert.equal(Object.hasOwn(noDots, 'inlay_dot_mat'), false, `${model.id}: hidden paid dot material is removed`);
  const reselectedDots = normalizeSelections(model.id, { ...noDots, inlay_type: 'inlay_dot' });
  assert.equal(reselectedDots.inlay_dot_mat, 'dot_bw', `${model.id}: reselecting dots starts with the included material`);
}
for (const category of configData.categories) {
  for (const entry of category.options) {
    for (const model of entry.isStandard || []) {
      assert.equal(entry.prices?.[model], 0, `${model} standard ${category.id}/${entry.id} is included at no charge`);
    }
  }
}
const i18nContext = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'assets', 'configurator-ui.js'), 'utf8'), i18nContext);
const i18n = i18nContext.window.RF_CONFIG_I18N;
for (const language of ['en', 'ko', 'de']) {
  const ui = i18n[language];
  for (const key of ['stepLabel', 'requestShort', 'included', 'recommended', 'instrumentOptions', 'accessories']) {
    assert.ok(ui[key], `${language} defines ${key}`);
  }
  assert.match(ui.stepLabel, /\{n\}/, `${language} step label carries the step number`);
  for (const key of Object.keys(i18n.en.supplies)) assert.ok(ui.supplies?.[key], `${language} power supply ${key}`);
  if (language !== 'en') {
    for (const model of configData.models) {
      const summary = platforms.summary(model.id);
      for (const field of ['strings', 'scale', 'joint'].filter(field => summary[field])) {
        assert.ok(ui.platformSummaries?.[model.id]?.[field], `${language} ${model.id} platform ${field}`);
      }
    }
  }
}
const catalogSource = new Set();
require('../assets/configurator-preview.js').configureTestOptions(configData, null);
const extraContext = vm.createContext({});
vm.runInContext(`${between('const specialOptionsList', 'const configData = {')}\nthis.extras = [...specialOptionsList, ...accessoriesList];`, extraContext);
const addSource = text => { if (typeof text === 'string' && text) catalogSource.add(text); };
for (const entry of [...configData.categories.flatMap(category => category.options), ...extraContext.extras]) {
  addSource(entry.label);
  addSource(entry.spec);
  Object.values(entry.specByModel || {}).forEach(addSource);
}
for (const model of configData.models) platforms.upcoming(model.id, configData).forEach(group => group.options.forEach(entry => addSource(entry.label)));
assert.deepEqual(Object.keys(i18n.de.catalog).sort(), Object.keys(i18n.ko.catalog).sort(), 'ko and de translate the same catalog text');
for (const text of Object.keys(i18n.ko.catalog)) assert.ok(catalogSource.has(text), `Catalog translation key matches current source text: ${text}`);
// Special instructions stay within 1,000 characters so the PDF fits two pages,
// and the quote is always rendered in English.
assert.match(html, /maxLength=\{1000\}/);
assert.match(html, /setSpecialInstructions\(e\.target\.value\.slice\(0, 1000\)\)/);
assert.match(html, /flushSync\(\(\) => setLanguage\('en'\)\)/);
// Fretless nuts are verawood (guayacan is no longer sourced), and the strap
// lock's Schaller S-Lock pins follow the selected hardware colour.
assert.doesNotMatch(html, /guayacan/i);
assert.match(html, /id: 'nut_verawood', label: 'verawood \(Argentine lignum vitae\)'/);
assert.match(html, /detail: opt\.id === 'leather_strap' && selections\.hardware_color \? ui\.strapPins\.replace\('\{colour\}', selectedOptionLabel\('hardware_color'\)\)/);
for (const language of ['en', 'ko', 'de']) assert.match(i18n[language].strapPins, /S-Lock.*\{colour\}/);
// Fretless defaults to verawood (fretless-only) and keeps bone, horn and other
// nuts; with no zero fret the brass guide and the retainer are hidden.
{
  const fretless = { ...normalizeSelections('EDDA'), fret_type: 'fretless' };
  assert.equal(normalizeSelections('EDDA', { ...fretless, nut_material: 'nut_bone' }).nut_material, 'nut_bone');
  for (const nut of ['nut_brass', 'nut_guide']) assert.equal(isOptionVisible('nut_material', nut, 'EDDA', fretless), false);
  assert.equal(isOptionVisible('nut_material', 'nut_verawood', 'EDDA', normalizeSelections('EDDA')), false);
  assert.equal(normalizeSelections('EDDA', { ...normalizeSelections('EDDA'), nut_material: 'nut_verawood' }).nut_material, 'nut_brass');
  assert.match(html, /if \(optionId === 'fretless'\) \{\s*nextSelections\['nut_material'\] = 'nut_verawood';/);
  for (const language of ['en', 'ko', 'de']) assert.ok(i18n[language].fretlessNutNote);
}
console.log('PASS: code-only stale coil/nut normalization, other models, bridges, €0 standard options, €200 gigbag difference, localized UI strings and catalog translations, 1,000-character instructions, English PDF, fretless-only verawood nut and S-Lock pin colour');
