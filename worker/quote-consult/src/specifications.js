import {
  RavenForgePlatforms, configData, isCategoryVisible, isOptionVisible, normalizeSelections,
  getAutomaticPowerSupply, pageCopy, menuCategoryIds
} from './catalog.generated.js';
import { MODEL_IDS, pageCategoryTitle, pageOptionLabel, specialOptionsFor } from './pricing.js';

const categories = new Map(configData.categories.map(category => [category.id, category]));
const passiveElectronics = new Set(['passive', 'guitar_passive']);
const menuCategories = new Set(menuCategoryIds);
const pageLanguage = language => Object.hasOwn(pageCopy, language) ? language : 'en';

// Match the page's optionSpec helper, including model-specific specifications.
// Text is catalog evidence; an empty specification is not permission to invent it.
function optionFact(option, model, language, category) {
  if (!option) return null;
  const spec = option.specByModel?.[model] || option.spec || '';
  const ui = pageCopy[language];
  const fact = {
    option: option.id,
    label: option.label,
    page_label: pageOptionLabel(language, option),
    spec,
    page_spec: ui.optionSpecs?.[option.id] || ui.catalog?.[spec] || spec
  };
  if (category === 'electronics') {
    // GRAMR's planned package must not inherit EMBLA's confirmed Zuta supply.
    // The page explicitly leaves its electronics and power to confirmation.
    fact.circuit_type = model === 'GRAMR' && option.id !== 'guitar_passive'
      ? 'unconfirmed' : passiveElectronics.has(option.id) ? 'passive' : 'active';
  }
  if (option.requiresPassive) fact.requires_passive_controls = true;
  return fact;
}

function selectedFact(categoryId, selections, model, language) {
  return optionFact(categories.get(categoryId)?.options.find(option => option.id === selections[categoryId]),
    model, language, categoryId);
}

function powerFact(model, selections, appliedInstrumentOptions, language) {
  const source = getAutomaticPowerSupply(model, selections, appliedInstrumentOptions, pageCopy.en);
  const localized = getAutomaticPowerSupply(model, selections, appliedInstrumentOptions, pageCopy[language]);
  const voltage = source.label === '9V' ? 9 : source.label === '18V' ? 18 : null;
  const status = voltage !== null ? 'required'
    : source.label === pageCopy.en.supplies.noBattery ? 'not_required' : 'confirmation_required';
  return {
    status,
    battery_required: status === 'confirmation_required' ? null : status === 'required',
    voltage,
    label: source.label,
    page_label: localized.label,
    spec: source.spec,
    page_spec: localized.spec
  };
}

function specificationFor(model, selections, appliedInstrumentOptions, language) {
  const standard = normalizeSelections(model, {});
  const fixed = RavenForgePlatforms.fixed(model);
  const availableInstrumentOptions = specialOptionsFor(model)
    .filter(option => !option.requiresPassive || passiveElectronics.has(selections.electronics));
  return {
    schema_version: 1,
    model,
    standard: {
      electronics: selectedFact('electronics', standard, model, language),
      power: powerFact(model, standard, [], language),
      fretboard: selectedFact('fretboard', standard, model, language)
    },
    selected: {
      electronics: selectedFact('electronics', selections, model, language),
      power: powerFact(model, selections, appliedInstrumentOptions, language),
      instrument_options: availableInstrumentOptions
        .filter(option => appliedInstrumentOptions.includes(option.id))
        .map(option => optionFact(option, model, language, 'instrument_options'))
    },
    // These are facts shown in the platform overview/fixed rows, not controls
    // the visitor can open or change in the configurator.
    fixed_specifications: configData.categories
      .filter(category => fixed[category.id] && isCategoryVisible(category, selections))
      .map(category => ({
        category: category.id,
        page_title: pageCategoryTitle(language, category),
        value: selectedFact(category.id, selections, model, language)
      }))
      .filter(entry => entry.value),
    available_categories: configData.categories
      .filter(category => menuCategories.has(category.id) && !fixed[category.id] && isCategoryVisible(category, selections))
      .map(category => ({
        category: category.id,
        page_title: pageCategoryTitle(language, category),
        options: category.options
          .filter(option => isOptionVisible(category.id, option.id, model, selections) &&
            (category.id === 'top_wood_selection' || option.prices?.[model] != null))
          .map(option => optionFact(option, model, language, category.id))
      }))
      .filter(category => category.options.length > 0),
    available_instrument_options: availableInstrumentOptions
      .map(option => optionFact(option, model, language, 'instrument_options'))
  };
}

// Enrich a resolved quote without changing its prices, selections, or rejections.
// Only options retained in priced lines can affect the power requirement: raw
// requested extras may have been discarded by the configurator's dependencies.
export function withSpecifications(quote, language) {
  if (!quote || quote.error || !MODEL_IDS.includes(quote.model) || !Array.isArray(quote.lines) ||
      !quote.selections || typeof quote.selections !== 'object' || Array.isArray(quote.selections)) return quote;
  const selections = normalizeSelections(quote.model, quote.selections);
  const appliedInstrumentOptions = quote.lines
    .filter(line => line.category === 'instrument_options')
    .map(line => line.option);
  return {
    ...quote,
    specification: specificationFor(quote.model, selections, appliedInstrumentOptions, pageLanguage(language))
  };
}

// Small, model-scoped facts available even before a pricing call. The full menu
// for the current/resolved configuration accompanies the state/tool result.
export function standardSpecificationText() {
  return MODEL_IDS.map(model => {
    const facts = specificationFor(model, normalizeSelections(model, {}), [], 'en');
    return JSON.stringify({
      model,
      standard: facts.standard,
      available_electronics: facts.available_categories.find(category => category.category === 'electronics')?.options || [],
      available_fretboards: facts.available_categories.find(category => category.category === 'fretboard')?.options || [],
      available_instrument_options: facts.available_instrument_options
    });
  }).join('\n');
}
