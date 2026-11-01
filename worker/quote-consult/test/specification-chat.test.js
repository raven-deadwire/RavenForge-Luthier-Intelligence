import test from 'node:test';
import assert from 'node:assert/strict';
import { handleChat } from '../src/index.js';
import { createOpenAIClient } from '../src/openai-client.js';
import { priceWithChanges, withPageNames } from '../src/pricing.js';
import { PDF_BUTTON_LABELS, SYSTEM_PROMPT } from '../src/prompt.js';
import { SPECIFICATION_CASES } from './fixtures/specification-cases.js';

// Simulated Responses transport only. Final text is deliberately a sentinel:
// these tests verify grounding data, not OpenAI's ability to obey the prompt.
const toolInput = (model, changes = [], extras = []) => ({ model, start_from: 'standard', changes, instrument_options: extras, accessories: [] });
const cases = [
  { id: 'powered-passive-buffer', family: 'xpure_power', input: toolInput('EDDA', [], ['delano_buffer']), check(quote) {
    assert.equal(quote.specification.selected.electronics.circuit_type, 'passive');
    assert.equal(quote.specification.selected.power.battery_required, true);
    assert.equal(quote.specification.selected.power.voltage, 9);
  } },
  { id: 'edda-product-scope', family: 'edda_electronics', input: toolInput('EDDA', ['john_east', 'glockenklang', 'lhz'].map(option => ({ category: 'electronics', option }))), check(quote) {
    assert.deepEqual(quote.not_applied.map(entry => entry.option), ['john_east', 'glockenklang', 'lhz']);
    const options = quote.specification.available_categories.find(entry => entry.category === 'electronics').options;
    assert.deepEqual(options.map(option => option.option), ['passive', 'nfp', 'eq01', 'dual_filter']);
    assert.equal(options.find(option => option.option === 'eq01').label, 'John East ACG EQ-01');
  } },
  { id: 'edda-current-embla-standard', family: 'embla_default', input: toolInput('EMBLA'), check(quote) {
    assert.equal(quote.specification.model, 'EMBLA');
    assert.equal(quote.specification.standard.electronics.option, 'zuta');
    assert.equal(quote.specification.selected.electronics.option, 'zuta');
  } },
  { id: 'gramr-no-exotic-menu', family: 'gramr_fretboard', input: toolInput('GRAMR', [{ category: 'fretboard', option: 'others' }]), check(quote) {
    assert.ok(quote.not_applied.some(entry => entry.option === 'others'));
    assert.deepEqual(quote.specification.available_categories.find(entry => entry.category === 'fretboard').options.map(option => option.option), ['guitar_indian_rosewood']);
  } }
];

for (const language of ['ko', 'en', 'de']) for (const scenario of cases) {
  test(`MOCK ${language}/${scenario.id}: real Worker loop sends catalog facts and preserves the quote`, async () => {
    const requests = [];
    const outputs = [
      [{ type: 'function_call', call_id: 'spec_call', name: 'price_configuration', arguments: JSON.stringify(scenario.input) }],
      [{ type: 'message', content: [{ type: 'output_text', text: 'MOCK_TRANSPORT_ONLY' }] }]
    ];
    const env = { OPENAI_API_KEY: 'test-placeholder', OPENAI_MODEL: 'gpt-5-mini' };
    const client = createOpenAIClient(env, async (url, request) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      requests.push(JSON.parse(request.body));
      return Response.json({ status: 'completed', output: outputs.shift(), usage: { output_tokens: 20 } });
    });
    const fixture = SPECIFICATION_CASES.find(entry => entry.language === language && entry.family === scenario.family);
    const request = structuredClone(fixture.request);
    request.configuration.specification = { model: 'INVENTED', selected: { electronics: { option: 'passive' } } };
    const before = structuredClone(request);
    const result = await handleChat(request, env, client);
    assert.deepEqual(request, before, 'a quote preview does not apply or mutate the requested configuration');
    assert.equal(result.reply, 'MOCK_TRANSPORT_ONLY');
    assert.equal(requests.length, 2);
    assert.equal(requests[0].store, false);
    assert.equal(requests[0].instructions, SYSTEM_PROMPT);
    assert.ok(requests[0].instructions.includes(PDF_BUTTON_LABELS[language]));
    const stateItem = requests[0].input.find(item => typeof item.content === 'string' && item.content.startsWith('<configurator_state>'));
    const state = JSON.parse(stateItem.content.replace(/^<configurator_state>\n|\n<\/configurator_state>$/g, ''));
    assert.equal(state.current_configuration.specification.model, request.configuration.model, 'browser-supplied facts are not trusted');
    assert.equal(state.current_configuration.specification.selected.electronics.option,
      request.configuration.model === 'GRAMR' ? 'guitar_zuta_core' : 'passive');
    assert.equal(state.current_configuration.specification.standard.power.battery_required,
      request.configuration.model === 'GRAMR' ? null : false);
    const returned = JSON.parse(requests[1].input.find(item => item.type === 'function_call_output').output);
    scenario.check(returned);
    assert.deepEqual(result.quote, returned, 'API preview carries the same resolved facts as the model saw');
    const { specification, ...legacyQuote } = result.quote;
    const expected = withPageNames(priceWithChanges({ model: scenario.input.model, selections: {}, specialOptions: [], accessories: [] }, {
      changes: scenario.input.changes, instrumentOptions: scenario.input.instrument_options, accessories: []
    }), language);
    assert.deepEqual(legacyQuote, expected, 'no changes to prices, options or rejection semantics');
    assert.ok(!JSON.stringify(requests).includes('test-placeholder'));
  });
}

test('a no-tool answer still receives authoritative current power facts in every page language', async () => {
  for (const language of ['ko', 'en', 'de']) {
    let params;
    const client = { beta: { messages: { create: async input => {
      params = input;
      return { stop_reason: 'end_turn', content: [{ type: 'text', text: 'MOCK_NO_TOOL' }], usage: { output_tokens: 1 } };
    } } } };
    const result = await handleChat({ language,
      configuration: { model: 'EDDA', selections: {}, specialOptions: ['delano_buffer'], accessories: [] },
      messages: [{ role: 'user', content: 'Battery?' }] }, {}, client);
    const state = JSON.parse(params.messages[0].content[0].text.replace(/^<configurator_state>\n|\n<\/configurator_state>$/g, ''));
    assert.equal(state.current_configuration.specification.selected.power.voltage, 9);
    assert.equal(state.current_configuration.specification.standard.power.battery_required, false);
    assert.equal(result.quote, null, 'no synthetic quote or unrequested selection is created');
  }
});
