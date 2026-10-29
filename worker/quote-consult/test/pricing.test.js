import test from 'node:test';
import assert from 'node:assert/strict';
import { configData } from '../src/catalog.generated.js';
import { MODEL_IDS, catalogText, priceConfiguration, priceWithChanges, sanitizeConfiguration } from '../src/pricing.js';

const standard = model => sanitizeConfiguration({ model, selections: {}, specialOptions: [], accessories: [] });

test('every model\'s standard build costs its base price', () => {
  for (const model of configData.models) {
    const quote = priceConfiguration({ model: model.id });
    assert.equal(quote.total, model.basePrice, model.id);
    assert.equal(quote.price_on_request, false, model.id);
  }
});

test('changes add their listed price for the model', () => {
  const quote = priceWithChanges(standard('EMBLA'), {
    changes: [{ category: 'fretboard', option: 'ebony' }], accessories: ['flight_case']
  });
  assert.equal(quote.total, 2550 + 50 + 400);
  assert.deepEqual(quote.not_applied, []);
});

test('options the rules reject are reported, not priced', () => {
  const quote = priceWithChanges(standard('EDDA'), {
    changes: [{ category: 'strings', option: '6_strings' }, { category: 'nope', option: 'x' }]
  });
  assert.equal(quote.total, 2100);
  assert.deepEqual(quote.not_applied.map(entry => entry.reason),
    ['not available for this model or combination', 'unknown category or option']);
});

test('an on-request option leaves the total incomplete', () => {
  const quote = priceWithChanges(standard('EDDA'), { changes: [{ category: 'factory_setup', option: 'setup_custom' }] });
  assert.equal(quote.price_on_request, true);
});

test('passive-only instrument options drop out under active electronics', () => {
  const active = configData.categories.find(category => category.id === 'electronics').options
    .find(option => option.id !== 'passive' && typeof option.prices.EMBLA === 'number');
  const quote = priceWithChanges(standard('EMBLA'), {
    changes: [{ category: 'electronics', option: active.id }], instrumentOptions: ['delano_buffer']
  });
  assert.equal(quote.lines.some(line => line.option === 'delano_buffer'), false);
});

test('page input is limited to known ids', () => {
  assert.equal(sanitizeConfiguration({ model: 'X' }), null);
  const clean = sanitizeConfiguration({ model: 'GRAMR', selections: { strings: 'guitar_6', evil: 'x' }, specialOptions: ['delano_buffer', 'kill_switch'], accessories: ['flight_case'] });
  assert.deepEqual(clean, { model: 'GRAMR', selections: { strings: 'guitar_6' }, specialOptions: ['kill_switch'], accessories: [] });
});

test('catalog text names every model', () => {
  const text = catalogText();
  for (const id of MODEL_IDS) assert.match(text, new RegExp(`- ${id} \\(`));
});
