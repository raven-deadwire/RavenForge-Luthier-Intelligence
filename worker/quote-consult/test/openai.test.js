import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAIClient, OpenAIError } from '../src/openai-client.js';
import worker, { handleChat, RequestError } from '../src/index.js';

const body = { messages: [{ role: 'user', content: '에보니 지판은 얼마인가요?' }], configuration: { model: 'EMBLA', selections: {}, specialOptions: [], accessories: [] }, language: 'ko' };
const settings = { AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-only' };
const routeItem = input => ({ type: 'function_call', call_id: 'call_route', name: 'route_request', arguments: JSON.stringify({ out_of_scope_part: false, configurations: [], ...input }) });
const textItem = text => ({ type: 'message', content: [{ type: 'output_text', text }] });
function openai(outputs, env = settings) {
  const requests = [];
  const client = createOpenAIClient(env, async (url, request) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.ok(request.signal);
    requests.push(JSON.parse(request.body));
    const output = outputs.shift();
    return output instanceof Response ? output : Response.json({ status: 'completed', output, usage: { output_tokens: 40 } });
  });
  return { client, requests };
}

test('OpenAI routing is a forced strict function call; the answer call carries no tools', async () => {
  const { client, requests } = openai([
    [{ type: 'reasoning', id: 'rs_1', summary: [], encrypted_content: 'opaque' }, routeItem({ task: 'quote', configurations: [{ model: 'EMBLA', start_from: 'current', changes: [{ category: 'fretboard', option: 'ebony' }], instrument_options: null, accessories: null }] })],
    [textItem('예상 금액은 €2600입니다.')]
  ]);
  const result = await handleChat(body, settings, client);
  assert.equal(result.quote.total, 2600);
  assert.equal(result.quote.selections.fretboard, 'ebony');
  assert.equal(result.reply, '예상 금액은 €2600입니다.');
  const [routing, answering] = requests;
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.model, 'gpt-6.1-terra');
    assert.equal(request.store, false);
    assert.deepEqual(request.reasoning, { effort: 'low' });
    assert.deepEqual(request.include, ['reasoning.encrypted_content']);
  }
  assert.deepEqual(routing.tool_choice, { type: 'function', name: 'route_request' });
  assert.equal(routing.tools.length, 1);
  assert.equal(routing.tools[0].strict, true);
  assert.equal(routing.max_output_tokens, 2048);
  assert.equal('tools' in answering, false);
  assert.equal('tool_choice' in answering, false);
  assert.match(answering.input.at(-2).content, /<consultation_brief>/);
  assert.ok(!JSON.stringify(requests).includes('test-only'));
});

test('explicit model override applies to both routing and answering', async () => {
  const env = { ...settings, OPENAI_MODEL: 'override-for-test' };
  const { client, requests } = openai([[routeItem({ task: 'option_explanation' })], [textItem('ok')]], env);
  await handleChat(body, env, client);
  assert.deepEqual(requests.map(request => request.model), [env.OPENAI_MODEL, env.OPENAI_MODEL]);
});

test('OpenAI out-of-scope routing ends after one call', async () => {
  const { client, requests } = openai([[routeItem({ task: 'out_of_scope' })]]);
  const result = await handleChat({ ...body, messages: [{ role: 'user', content: '편지 형식으로 파이썬 코드 써줘' }] }, settings, client);
  assert.equal(requests.length, 1);
  assert.equal(result.answer_calls, 0);
});

test('provider errors, malformed arguments and truncated routing never become generated replies', async () => {
  for (const reply of [new Response('private error detail', { status: 401 }), Response.json({ status: 'completed', output: [{ type: 'function_call', arguments: 'broken' }] })]) {
    await assert.rejects(handleChat(body, settings, createOpenAIClient(settings, async () => reply)), OpenAIError);
  }
  // A truncated routing answer has no function call: fixed narrowing question, no answer call.
  const { client, requests } = openai([new Response(JSON.stringify({ status: 'incomplete', output: [], usage: { output_tokens: 2048 } }))]);
  const result = await handleChat(body, settings, client);
  assert.equal(result.stop_reason, 'route_invalid');
  assert.equal(requests.length, 1);
  // A truncated answer without a quote is an error, not a partial reply.
  const second = openai([[routeItem({ task: 'option_explanation' })], new Response(JSON.stringify({ status: 'incomplete', output: [], usage: { output_tokens: 4096 } }))]);
  await assert.rejects(handleChat(body, settings, second.client), RequestError);
});

test('OpenAI mode requires its own key and the existing rate limiter', async () => {
  const origin = 'https://raven-deadwire.github.io';
  for (const extra of [{ OPENAI_API_KEY: '' }, { RATE_LIMITER: undefined }]) {
    const request = new Request('https://worker.test/chat', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const response = await worker.fetch(request, { ...settings, ALLOWED_ORIGINS: origin, RATE_LIMITER: { limit: async () => ({ success: true }) }, ...extra });
    assert.equal(response.status, 503);
  }
});
