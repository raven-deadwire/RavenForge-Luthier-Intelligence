import {
  RavenForgePlatforms, configData, specialOptionsList, accessoriesList,
  isCategoryVisible, isOptionVisible, normalizeSelections, applyOptionChange, pageCopy
} from './catalog.generated.js';

export const MODEL_IDS = configData.models.map(model => model.id);
export const PAGE_LANGUAGES = Object.keys(pageCopy);

// Mirror categoryTitle / optionLabel in configurator.html, so replies can use the names on screen.
export const pageCategoryTitle = (language, category) => pageCopy[language]?.categoryTitles?.[category.id] || category.title;
export const pageOptionLabel = (language, option) => {
  const ui = pageCopy[language];
  return ui?.optionLabels?.[option.id] || (option.label && ui?.catalog?.[option.label]) || option.label;
};
const extraGroups = {
  instrument_options: { title: 'Instrument Options', key: 'instrumentOptions', list: specialOptionsList },
  accessories: { title: 'Accessories', key: 'accessories', list: accessoriesList }
};

// Adds the page-language category and option names to every priced line.
export function withPageNames(quote, language) {
  if (!quote?.lines) return quote; // a rejected call: keep its error as is
  return {
    ...quote,
    lines: quote.lines.map(line => {
      const extra = extraGroups[line.category];
      const category = extra ? null : categoryById.get(line.category);
      const option = (extra ? extra.list : category?.options || []).find(entry => entry.id === line.option);
      return {
        ...line,
        page_title: extra ? pageCopy[language]?.[extra.key] || extra.title : category ? pageCategoryTitle(language, category) : line.title,
        page_label: option ? pageOptionLabel(language, option) : line.label
      };
    })
  };
}

// " (ko: 지판; de: Griffbrett)" for the languages whose page name differs from the catalog name.
const pageNames = (name, nameIn) => {
  const names = PAGE_LANGUAGES.map(language => [language, nameIn(language)]).filter(([, local]) => local && local !== name);
  return names.length ? ` (${names.map(([language, local]) => `${language}: ${local}`).join('; ')})` : '';
};

// Mirrors currentSpecialOptions / currentAccessories in configurator.html's App.
export const specialOptionsFor = modelId => modelId === 'GRAMR'
  ? specialOptionsList.filter(option => ['kill_switch', 'dual_tone'].includes(option.id))
  : specialOptionsList.filter(option => option.id !== 'locking_jack');
export const accessoriesFor = modelId => modelId === 'GRAMR'
  ? accessoriesList.filter(option => option.id === 'leather_strap') : accessoriesList;

const categoryById = new Map(configData.categories.map(category => [category.id, category]));
const isPassive = selections => ['passive', 'guitar_passive'].includes(selections.electronics);

// Keep only known category/option ids so page or model input cannot inject anything else.
export function sanitizeConfiguration(input) {
  if (!input || typeof input !== 'object' || !MODEL_IDS.includes(input.model)) return null;
  const selections = {};
  for (const [categoryId, optionId] of Object.entries(input.selections && typeof input.selections === 'object' && !Array.isArray(input.selections) ? input.selections : {})) {
    if (categoryById.get(categoryId)?.options.some(option => option.id === optionId)) selections[categoryId] = optionId;
  }
  const pick = (ids, list) => Array.isArray(ids) ? list.filter(option => ids.includes(option.id)).map(option => option.id) : [];
  return {
    model: input.model,
    selections,
    specialOptions: pick(input.specialOptions, specialOptionsFor(input.model)),
    accessories: pick(input.accessories, accessoriesFor(input.model))
  };
}

// The same lines and total as the configurator's `summary`, in English catalog labels (EUR).
export function priceConfiguration({ model, selections = {}, specialOptions = [], accessories = [] }) {
  const resolved = normalizeSelections(model, selections);
  const basePrice = configData.models.find(entry => entry.id === model)?.basePrice ?? null;
  let extraCosts = 0;
  let priceOnRequest = typeof basePrice !== 'number';
  const lines = [];

  for (const category of configData.categories) {
    if (!isCategoryVisible(category, resolved)) continue;
    const option = category.options.find(entry => entry.id === resolved[category.id]);
    if (!option || !isOptionVisible(category.id, option.id, model, resolved)) continue;
    const price = category.id === 'top_wood_selection'
      ? option.prices[resolved.top_type] || 0
      : option.prices[model];
    lines.push({ category: category.id, title: category.title, option: option.id, label: option.label, price });
    if (typeof price === 'number') extraCosts += price;
    else if (price === 'request') priceOnRequest = true;
  }

  const extras = [
    ...specialOptionsFor(model)
      .filter(option => specialOptions.includes(option.id) && (!option.requiresPassive || isPassive(resolved)))
      .map(option => ({ category: 'instrument_options', title: 'Instrument Options', option: option.id, label: option.label, price: option.price })),
    ...accessoriesFor(model)
      .filter(option => accessories.includes(option.id))
      .map(option => ({ category: 'accessories', title: 'Accessories', option: option.id, label: option.label, price: option.price }))
  ];
  extras.forEach(line => { extraCosts += line.price; });

  return {
    model,
    currency: 'EUR',
    base_price: basePrice,
    lines: [...lines, ...extras],
    total: typeof basePrice === 'number' ? basePrice + extraCosts : null,
    price_on_request: priceOnRequest,
    selections: resolved
  };
}

// Applies requested changes on top of a starting configuration and reports the
// ones the configurator's rules did not keep (unknown, unavailable, or replaced).
export function priceWithChanges(start, { changes = [], instrumentOptions, accessories }) {
  if (!Array.isArray(changes) || changes.length > 50 || changes.some(change =>
    !change || typeof change.category !== 'string' || typeof change.option !== 'string') ||
    [instrumentOptions, accessories].some(ids => ids !== undefined &&
      (!Array.isArray(ids) || ids.length > 50 || ids.some(id => typeof id !== 'string')))) {
    return { error: 'Invalid configuration changes.' };
  }
  let requested = normalizeSelections(start.model, start.selections);
  for (const { category, option } of changes) {
    const definition = categoryById.get(category);
    if (definition && isCategoryVisible(definition, requested)) {
      requested = applyOptionChange(start.model, requested, category, option);
    }
  }
  const sanitized = sanitizeConfiguration({
    model: start.model,
    selections: requested,
    specialOptions: instrumentOptions ?? start.specialOptions,
    accessories: accessories ?? start.accessories
  });
  if (!sanitized) return { error: 'Unknown model.' };
  const quote = priceConfiguration(sanitized);
  const notApplied = changes
    .filter(({ category, option }) => quote.selections[category] !== option)
    .map(({ category, option }) => ({
      category, option,
      reason: categoryById.get(category)?.options.some(entry => entry.id === option)
        ? 'not available for this model or combination' : 'unknown category or option'
    }));
  const extrasDropped = [
    ...(instrumentOptions || []).filter(id => !quote.lines.some(line => line.category === 'instrument_options' && line.option === id)),
    ...(accessories || []).filter(id => !sanitized.accessories.includes(id))
  ];
  return { ...quote, not_applied: notApplied, extras_not_available: extrasDropped };
}

const formatPrice = price => price === 'request' ? 'on request'
  : price === 0 ? 'included'
    : price < 0 ? `-€${-price}` : `+€${price}`;

// Compact catalog text for the system prompt: every option offered at launch, with its price per model.
export function catalogText() {
  const out = [];
  for (const model of configData.models) {
    const summary = RavenForgePlatforms.summary(model.id);
    out.push(`- ${model.id} (${model.desc}): base €${model.basePrice}. ${summary.description || ''} Standard: ${[summary.strings, summary.scale, summary.frets, summary.bridge].filter(Boolean).join(', ')}.`);
  }
  out.push('', 'Options per category. Format: option_id: label (page names where they differ) [spec] — price per model; models not listed do not offer it.');
  for (const category of configData.categories) {
    const rows = [];
    for (const option of category.options) {
      const prices = [];
      for (const { id } of configData.models) {
        if (!RavenForgePlatforms.isInitialOption(id, category.id, option.id)) continue;
        if (category.id === 'top_wood_selection') {
          if (option.availableFor && !option.availableFor.includes(id)) continue;
          prices.push(`${id} ${Object.entries(option.prices).map(([type, price]) => `${type} ${formatPrice(price)}`).join(' / ')}`);
          continue;
        }
        const price = option.prices?.[id];
        if (price === undefined || price === null) continue;
        prices.push(`${id} ${formatPrice(price)}`);
      }
      if (!prices.length) continue;
      const spec = option.spec ? ` [${option.spec}]` : '';
      rows.push(`  ${option.id}: ${option.label}${pageNames(option.label, language => pageOptionLabel(language, option))}${spec} — ${prices.join('; ')}`);
    }
    if (!rows.length) continue;
    const dependency = category.dependsOn ? ` (only when ${Object.entries(category.dependsOn).map(([key, value]) => `${key} = ${[].concat(value).join(' or ')}`).join(', ')})` : '';
    out.push(`${category.id} — ${category.title}${pageNames(category.title, language => pageCategoryTitle(language, category))}${dependency}`, ...rows);
  }
  const extras = (id, list, forModel) => {
    const { title, key } = extraGroups[id];
    out.push(`${id} — ${title}${pageNames(title, language => pageCopy[language]?.[key])}`);
    for (const option of list) {
      const models = MODEL_IDS.filter(id => forModel(id).some(entry => entry.id === option.id));
      const passive = option.requiresPassive ? ' (passive electronics only)' : '';
      out.push(`  ${option.id}: ${option.label}${pageNames(option.label, language => pageOptionLabel(language, option))}${option.spec ? ` [${option.spec}]` : ''}${passive} — ${formatPrice(option.price)}; ${models.join(', ')}`);
    }
  };
  extras('instrument_options', specialOptionsList, specialOptionsFor);
  extras('accessories', accessoriesList, accessoriesFor);
  return out.join('\n');
}
