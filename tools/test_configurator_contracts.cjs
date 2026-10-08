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
}
console.log('PASS: code-only stale coil/nut normalization, other models, bridges and €200 gigbag difference');
