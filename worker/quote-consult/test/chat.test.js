import test from 'node:test';
import assert from 'node:assert/strict';
import { handleChat, RequestError } from '../src/index.js';

// Stands in for the Anthropic client: returns the queued responses and records each request.
function fakeClient(responses) {
  const requests = [];
  return { requests, beta: { messages: { create: async params => { requests.push(structuredClone(params)); return responses.shift(); } } } };
}

const env = { MODEL: 'claude-opus-5-5', EFFORT: 'medium' };
const configuration = { model: 'EMBLA', selections: {}, specialOptions: [], accessories: [] };

test('runs the price tool and returns the final reply', async () => {
  const client = fakeClient([
    { stop_reason: 'tool_use', content: [
      { type: 'thinking', thinking: '', signature: 'sig' },
      { type: 'tool_use', id: 'tu_1', name: 'price_configuration', input: { model: 'EMBLA', start_from: 'current', changes: [{ category: 'fretboard', option: 'ebony' }], instrument_options: [], accessories: [] } }
    ] },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Ebony adds €50, for €2600 in total.' }] }
  ]);
  const result = await handleChat({ messages: [{ role: 'user', content: 'Ebony fretboard?' }], configuration, language: 'en' }, env, client);
  assert.equal(result.reply, 'Ebony adds €50, for €2600 in total.');
  assert.equal(result.quote.total, 2600);

  const [first, second] = client.requests;
  assert.equal(first.model, 'claude-opus-5-5');
  assert.equal(first.fallbacks, 'default');
  assert.deepEqual(first.betas, ['server-side-fallback-2026-07-01']);
  assert.match(first.messages[0].content[0].text, /<configurator_state>/);
  assert.equal(first.messages[0].content[1].text, 'Ebony fretboard?');
  // The assistant turn is echoed unchanged, followed by the tool result.
  assert.equal(second.messages[1].content[0].type, 'thinking');
  assert.equal(second.messages[2].content[0].tool_use_id, 'tu_1');
  assert.equal(JSON.parse(second.messages[2].content[0].content).total, 2600);
});

test('a refusal returns a fixed reply in the page language', async () => {
  const client = fakeClient([{ stop_reason: 'refusal', content: [] }]);
  const result = await handleChat({ messages: [{ role: 'user', content: '…' }], language: 'ko' }, env, client);
  assert.equal(result.stop_reason, 'refusal');
  assert.match(result.reply, /RavenForge/);
});

test('haiku requests carry no fallbacks', async () => {
  const client = fakeClient([{ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Hi' }] }]);
  await handleChat({ messages: [{ role: 'user', content: 'Hi' }] }, { MODEL: 'claude-haiku-5-5' }, client);
  assert.equal('fallbacks' in client.requests[0], false);
});

test('rejects malformed conversations', async () => {
  const client = fakeClient([]);
  for (const messages of [[], [{ role: 'assistant', content: 'x' }], [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }], [{ role: 'user', content: 'x'.repeat(2001) }]]) {
    await assert.rejects(handleChat({ messages }, env, client), RequestError);
  }
  assert.equal(client.requests.length, 0);
});
