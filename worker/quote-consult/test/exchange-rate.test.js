import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { eurKrwRate, krwReference, kstDate, resetRateCache, EXIM_ENDPOINT } from '../src/exchange-rate.js';
import { handleChat } from '../src/index.js';

const env = { KOREAEXIM_API_KEY: 'test-key' };
// 2026-11-09 (Monday) 01:00 UTC = 10:00 KST, before that day's publication.
const MONDAY_MORNING = Date.parse('2026-11-09T01:00:00Z');
const eurRow = rate => [{ result: 1, cur_unit: 'USD', deal_bas_r: '1,398.5' }, { result: 1, cur_unit: 'EUR', deal_bas_r: rate }];

// Answers by searchdate; records every URL requested.
function fakeFetch(byDate, { status = 200 } = {}) {
  const urls = [];
  const impl = async url => {
    urls.push(url);
    const date = new URL(url).searchParams.get('searchdate');
    return { ok: status === 200, status, json: async () => byDate[date] ?? [] };
  };
  return { urls, impl };
}

beforeEach(() => resetRateCache());

test('kstDate uses the Korean calendar day', () => {
  assert.equal(kstDate(Date.parse('2026-11-08T16:30:00Z')), '20261109'); // 01:30 KST next day
  assert.equal(kstDate(MONDAY_MORNING, 3), '20261106');
});

test('walks back over an unpublished morning and the weekend to Friday', async () => {
  const fetch = fakeFetch({ 20261106: eurRow('1,512.34') });
  const rate = await eurKrwRate(env, { fetchImpl: fetch.impl, now: MONDAY_MORNING });
  assert.deepEqual(rate, { rate: 1512.34, date: '2026-11-06' });
  assert.equal(fetch.urls.length, 2); // Mon, Fri; skip weekend without requests
  const url = new URL(fetch.urls[0]);
  assert.equal(url.origin + url.pathname, EXIM_ENDPOINT);
  assert.equal(url.searchParams.get('authkey'), 'test-key');
  assert.equal(url.searchParams.get('data'), 'AP01');
});

test('caches a rate and does not call the API again within the TTL', async () => {
  const fetch = fakeFetch({ 20261109: eurRow('1,500') });
  await eurKrwRate(env, { fetchImpl: fetch.impl, now: MONDAY_MORNING });
  await eurKrwRate(env, { fetchImpl: fetch.impl, now: MONDAY_MORNING + 60 * 60 * 1000 });
  assert.equal(fetch.urls.length, 1);
});

test('returns null, without throwing, on a missing key, HTTP errors and API error codes', async () => {
  assert.equal(await eurKrwRate({}, { fetchImpl: () => assert.fail('no fetch without a key') }), null);
  assert.equal(await eurKrwRate(env, { fetchImpl: fakeFetch({}, { status: 500 }).impl, now: MONDAY_MORNING }), null);
  resetRateCache();
  const authError = fakeFetch({ 20261109: [{ result: 3 }] });
  assert.equal(await eurKrwRate(env, { fetchImpl: authError.impl, now: MONDAY_MORNING }), null);
  resetRateCache();
  assert.equal(await eurKrwRate(env, { fetchImpl: async () => { throw new Error('network'); }, now: MONDAY_MORNING }), null);
});

test('a failure is remembered briefly so each message does not retry', async () => {
  const failing = fakeFetch({}, { status: 503 });
  await eurKrwRate(env, { fetchImpl: failing.impl, now: MONDAY_MORNING });
  await eurKrwRate(env, { fetchImpl: failing.impl, now: MONDAY_MORNING + 60 * 1000 });
  assert.equal(failing.urls.length, 1);
});

test('krwReference rounds to 1,000 won and keeps the on-request flag', () => {
  assert.deepEqual(krwReference({ total: 2600, price_on_request: false }, { rate: 1512.34, date: '2026-11-06' }),
    { total_krw: 3932000, rate: 1512.34, rate_date: '2026-11-06', source: 'koreaexim-deal-bas-r', price_on_request: false });
  assert.equal(krwReference({ total: null }, { rate: 1500, date: '2026-11-06' }), null);
  assert.equal(krwReference({ total: 2600 }, null), null);
});

const fakeClient = responses => ({ beta: { messages: { create: async () => responses.shift() } } });
const pricedTurn = () => [
  { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'tu_1', name: 'price_configuration', input: { model: 'EMBLA', start_from: 'standard', changes: [], instrument_options: [], accessories: [] } }] },
  { stop_reason: 'end_turn', content: [{ type: 'text', text: '기본 사양 견적입니다.' }] }
];

test('handleChat adds a KRW reference for Korean pages only', async () => {
  const fetch = fakeFetch({ 20261109: eurRow('1,500') });
  const rateOptions = { fetchImpl: fetch.impl, now: MONDAY_MORNING };
  const body = language => ({ messages: [{ role: 'user', content: 'EMBLA 기본 가격?' }], language });

  const ko = await handleChat(body('ko'), env, fakeClient(pricedTurn()), { rateOptions });
  assert.equal(ko.krw_reference.total_krw, Math.round(ko.quote.total * 1.5) * 1000);
  assert.equal(ko.krw_reference.rate_date, '2026-11-09');
  assert.equal(ko.quote.currency, 'EUR');

  const en = await handleChat(body('en'), env, fakeClient(pricedTurn()), { rateOptions });
  assert.equal(en.krw_reference, undefined);
});

test('handleChat answers normally when the rate lookup fails', async () => {
  const result = await handleChat({ messages: [{ role: 'user', content: '가격?' }], language: 'ko' }, env,
    fakeClient(pricedTurn()), { rateOptions: { fetchImpl: async () => { throw new Error('down'); }, now: MONDAY_MORNING } });
  assert.equal(result.reply, '기본 사양 견적입니다.');
  assert.ok(Number.isFinite(result.quote.total));
  assert.equal(result.krw_reference, undefined);
});
