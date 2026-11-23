import test from 'node:test';
import assert from 'node:assert/strict';
import { handleChat, RequestError } from '../src/index.js';
import { FIXED_REPLY } from '../src/scope.js';
import { fakeClient, route, answer, config } from './helpers.js';

const env = { MODEL: 'claude-opus-5-5', EFFORT: 'medium' };
const configuration = { model: 'EMBLA', selections: {}, specialOptions: [], accessories: [] };

test('prices a change from the current configuration and returns the answer', async () => {
  const client = fakeClient([
    route('quote', { configurations: [config('EMBLA', { start_from: 'current', changes: [{ category: 'fretboard', option: 'ebony' }] })] }),
    answer('Ebony adds €50, for €2600 in total.')
  ]);
  const result = await handleChat({ messages: [{ role: 'user', content: 'Ebony fretboard?' }], configuration, language: 'en' }, env, client);
  assert.equal(result.reply, 'Ebony adds €50, for €2600 in total.');
  assert.equal(result.quote.total, 2600);
  assert.equal(result.task, 'quote');
  const [routing, answering] = client.requests;
  assert.equal(routing.model, 'claude-opus-5-5');
  assert.match(routing.messages[0].content[0].text, /<configurator_state>/);
  assert.equal(routing.messages[0].content[1].text, 'Ebony fretboard?');
  assert.equal(answering.fallbacks, 'default');
  assert.deepEqual(answering.betas, ['server-side-fallback-2026-07-01']);
  assert.match(answering.messages[0].content[0].text, /<consultation_brief>/);
  assert.equal(answering.messages[0].content[1].text, 'Ebony fretboard?');
});

test('"current" falls back to the standard build when the page shows another model', async () => {
  const client = fakeClient([route('quote', { configurations: [config('ASKR', { start_from: 'current' })] }), answer('ok')]);
  const result = await handleChat({ messages: [{ role: 'user', content: 'ASKR?' }], configuration }, env, client);
  assert.equal(result.quote.total, 3200);
  assert.match(result.quote.note, /standard build/);
});

test('an answer refusal returns a fixed reply in the page language and keeps the quote', async () => {
  const client = fakeClient([route('quote', { configurations: [config('EDDA')] }), { stop_reason: 'refusal', content: [] }]);
  const result = await handleChat({ messages: [{ role: 'user', content: '…' }], language: 'ko' }, env, client);
  assert.equal(result.stop_reason, 'refusal');
  assert.equal(result.reply, FIXED_REPLY.refusal.ko);
  assert.equal(result.quote.total, 2100);
});

test('haiku answer requests carry no fallbacks', async () => {
  const client = fakeClient([route('option_explanation'), answer('Hi')]);
  await handleChat({ messages: [{ role: 'user', content: 'Hi' }] }, { MODEL: 'claude-haiku-5-5' }, client);
  assert.equal('fallbacks' in client.requests[1], false);
});

test('rejects malformed conversations', async () => {
  const client = fakeClient([]);
  for (const messages of [[], [{ role: 'assistant', content: 'x' }], [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }], [{ role: 'user', content: 'x'.repeat(2001) }]]) {
    await assert.rejects(handleChat({ messages }, env, client), RequestError);
  }
  assert.equal(client.requests.length, 0);
});

test('an unusable previous_quote is ignored rather than trusted', async () => {
  const client = fakeClient([route('quote', { configurations: [config('EMBLA', { start_from: 'previous' })] }), answer('ok')]);
  const result = await handleChat({ messages: [{ role: 'user', content: 'and?' }], previous_quote: { model: 'FAKE', selections: { fretboard: 'gold' } } }, env, client);
  assert.equal(result.quote.total, 2550);
  assert.match(result.quote.note, /No previous configuration/);
});
