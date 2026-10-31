import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAIClient, OpenAIError } from '../src/openai-client.js';
import worker, { handleChat, RequestError } from '../src/index.js';

const body = { messages: [{ role: 'user', content: '에보니 지판은 얼마인가요?' }], configuration: { model: 'EMBLA', selections: {}, specialOptions: [], accessories: [] }, language: 'ko' };
const settings = { AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-only', OPENAI_MODEL: 'gpt-5-mini' };
test('OpenAI pricing round preserves reasoning, call ids, limits and server-computed prices', async () => {
  const requests = [];
  const outputs = [
    [{ type: 'reasoning', id: 'rs_1', summary: [], encrypted_content: 'opaque' }, { type: 'function_call', call_id: 'call_1', name: 'price_configuration', arguments: JSON.stringify({ model: 'EMBLA', start_from: 'current', changes: [{ category: 'fretboard', option: 'ebony' }], instrument_options: [], accessories: [] }) }],
    [{ type: 'message', content: [{ type: 'output_text', text: '예상 금액은 €2600입니다.' }] }]
  ];
  const client = createOpenAIClient(settings, async (url, request) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.ok(request.signal);
    requests.push(JSON.parse(request.body));
    return Response.json({ status: 'completed', output: outputs.shift(), usage: { output_tokens: 40 } });
  });
  const result = await handleChat(body, settings, client);
  assert.equal(result.quote.total, 2600);
  assert.equal(result.quote.selections.fretboard, 'ebony');
  assert.equal(requests[0].store, false);
  assert.equal(requests[0].tools[0].strict, true);
  assert.ok(requests[1].input.some(item => item.type === 'reasoning' && item.encrypted_content === 'opaque'));
  const toolResult = requests[1].input.find(item => item.type === 'function_call_output');
  assert.equal(toolResult.call_id, 'call_1');
  assert.equal(JSON.parse(toolResult.output).total, 2600);
  assert.ok(!JSON.stringify(requests).includes('test-only'));
});
test('provider errors, malformed arguments and truncated answers never become successful replies', async () => {
  for (const reply of [new Response('private error detail', { status: 401 }), Response.json({ status: 'completed', output: [{ type: 'function_call', arguments: 'broken' }] })]) {
    await assert.rejects(handleChat(body, settings, createOpenAIClient(settings, async () => reply)), OpenAIError);
  }
  await assert.rejects(handleChat(body, settings, createOpenAIClient(settings, async () => Response.json({ status: 'incomplete', output: [], usage: { output_tokens: 4096 } }))), RequestError);
});
test('OpenAI mode requires its own key and the existing rate limiter', async () => {
  const origin = 'https://raven-deadwire.github.io';
  for (const extra of [{ OPENAI_API_KEY: '' }, { RATE_LIMITER: undefined }]) {
    const request = new Request('https://worker.test/chat', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const response = await worker.fetch(request, { ...settings, ALLOWED_ORIGINS: origin, RATE_LIMITER: { limit: async () => ({ success: true }) }, ...extra });
    assert.equal(response.status, 503);
  }
});
