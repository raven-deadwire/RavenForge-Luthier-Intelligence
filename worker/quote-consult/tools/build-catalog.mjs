#!/usr/bin/env node
// Copies the configurator's catalog and selection rules into an ES module the
// Worker can import, so consultation prices come from the same source as the
// configurator itself. Workers cannot eval, so the source is copied verbatim.
//   node tools/build-catalog.mjs          write src/catalog.generated.js
//   node tools/build-catalog.mjs --check  fail if the committed copy is stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, '../../..');
const output = path.resolve(here, '../src/catalog.generated.js');

const html = fs.readFileSync(path.join(site, 'configurator.html'), 'utf8').replace(/\r\n/g, '\n');
let platforms = fs.readFileSync(path.join(site, 'assets/configurator-platforms.js'), 'utf8').replace(/\r\n/g, '\n');

// The page's own names for categories and options in each language
// (assets/configurator-ui.js), so replies can name what the customer sees.
const uiContext = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(site, 'assets/configurator-ui.js'), 'utf8'), uiContext);
if (!uiContext.window.RF_CONFIG_I18N) throw new Error('assets/configurator-ui.js no longer sets window.RF_CONFIG_I18N');
const makePageCopy = () => Object.fromEntries(Object.entries(uiContext.window.RF_CONFIG_I18N).map(([language, ui]) => [language, {
  categoryTitles: ui.categoryTitles || {},
  optionLabels: ui.optionLabels || {},
  optionSpecs: ui.optionSpecs || {},
  catalog: ui.catalog || {},
  instrumentOptions: ui.instrumentOptions,
  accessories: ui.accessories,
  supplies: ui.supplies,
  supplyPending: ui.supplyPending,
  plannedElectronicsNote: ui.plannedElectronicsNote
}]));

function between(start, end) {
  const first = html.indexOf(start);
  const last = html.indexOf(end, first);
  if (first < 0 || last <= first) throw new Error(`configurator.html no longer contains: ${start} … ${end}`);
  return html.slice(first, last).trimEnd();
}

function replaceOnce(source, search, replacement) {
  if (source.split(search).length !== 2) throw new Error(`configurator-platforms.js: expected one "${search}"`);
  return source.replace(search, replacement);
}

// App calls this preview extension on the production page too. Bake its actual
// changes into the Worker at build time, including localized names, without
// bundling rendering code or maintaining a second hand-written option list.
const catalogContext = vm.createContext({
  RavenForgePlatforms: require(path.join(site, 'assets/configurator-platforms.js'))
});
vm.runInContext(`${between('const specialOptionsList = [', 'const App = () => {')}\nthis.catalog = configData;`, catalogContext);
const originalCategories = new Map(catalogContext.catalog.categories.map(category => [category.id, JSON.stringify(category)]));
require(path.join(site, 'assets/configurator-preview.js')).configureTestOptions(catalogContext.catalog, uiContext.window.RF_CONFIG_I18N);
const runtimeCategories = catalogContext.catalog.categories.filter(category => originalCategories.get(category.id) !== JSON.stringify(category));
const pageCopy = makePageCopy();

// Only categories assigned to an actual page step are selectable menus. Fixed
// platform rows are filtered at request time for the resolved model.
const stepContext = vm.createContext({ ui: uiContext.window.RF_CONFIG_I18N.en });
vm.runInContext(`${between('const stepConfig =', 'const getAutomaticPowerSupply =')}\nthis.ids = stepConfig.flatMap(step => step.categories);`, stepContext);
const menuCategoryIds = [...new Set(stepContext.ids)];

// Bind the UMD wrapper to a local object instead of globalThis / module.exports.
platforms = replaceOnce(platforms, "  if (typeof module === 'object' && module.exports) module.exports = api;\n", '');
platforms = replaceOnce(platforms, "typeof globalThis !== 'undefined' ? globalThis : this", 'platformsRoot');

// Reuse the actual click handler too: normalization alone omits Fishman/EQ,
// fretless nut and scale/bridge transitions. Fail the build if its shape changes.
let transition = between('const handleOptionChange =', 'const handleSpecialOptionToggle =').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
transition = replaceOnce(transition, 'const handleOptionChange = (categoryId, optionId) => {',
  'const applyOptionChange = (selectedModel, current, categoryId, optionId) => {\n  const selections = normalizeSelections(selectedModel, current);');
transition = replaceOnce(transition, 'if (!isOptionVisible(categoryId, optionId, selectedModel, selections)) return;',
  'if (!isOptionVisible(categoryId, optionId, selectedModel, selections)) return selections;');
transition = replaceOnce(transition, 'setSelections(prev => {', 'const prev = selections;');
transition = replaceOnce(transition, '  });\n};', '};');

// The power label is a derived specification on the page, not a priced option.
// Copy the production function and make its two React-scope inputs explicit;
// do not maintain a second set of voltage/passive/buffer rules in the Worker.
const powerSupply = replaceOnce(
  between('const getAutomaticPowerSupply =', 'const handleNext ='),
  'const getAutomaticPowerSupply = (currentSelections, currentSpecialOptions = []) => {',
  'const getAutomaticPowerSupply = (selectedModel, currentSelections, currentSpecialOptions = [], ui) => {'
);

const generated = `// Generated by tools/build-catalog.mjs from configurator.html and
// assets/configurator-platforms.js and the production preview catalog extension.
// Do not edit; run \`npm run build:catalog\`.
/* eslint-disable */
const platformsRoot = {};
${platforms.trimEnd()}
const RavenForgePlatforms = platformsRoot.RavenForgePlatforms;

${between('const specialOptionsList = [', 'const App = () => {')}

// Runtime categories added/updated by RavenForgePreview.configureTestOptions.
for (const category of ${JSON.stringify(runtimeCategories, null, 1)}) {
  const index = configData.categories.findIndex(current => current.id === category.id);
  if (index < 0) configData.categories.push(category);
  else configData.categories[index] = category;
}

${between('const isCategoryVisible =', 'const getDefaultSelections =')}

${transition}

${powerSupply}

const pageCopy = ${JSON.stringify(pageCopy, null, 1)};
const menuCategoryIds = ${JSON.stringify(menuCategoryIds)};

export { RavenForgePlatforms, configData, specialOptionsList, accessoriesList, isCategoryVisible, isOptionVisible, normalizeSelections, applyOptionChange, getAutomaticPowerSupply, pageCopy, menuCategoryIds };
`;

if (process.argv.includes('--check')) {
  const committed = fs.existsSync(output) ? fs.readFileSync(output, 'utf8').replace(/\r\n/g, '\n') : '';
  if (committed !== generated) {
    console.error('src/catalog.generated.js is stale: run `npm run build:catalog` in worker/quote-consult.');
    process.exit(1);
  }
  console.log('src/catalog.generated.js is up to date.');
} else {
  fs.writeFileSync(output, generated);
  console.log(`Wrote ${path.relative(process.cwd(), output)}`);
}
