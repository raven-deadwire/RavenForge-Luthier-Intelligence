// Unit tests for the operations data collectors (no network):
//   node --test tools/test_ops_data.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as climate from './ops_climate.mjs';
import * as trends from './ops_search_trends.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quiet = () => {};

async function sandbox() {
  const root = await mkdtemp(path.join(tmpdir(), 'rf-ops-'));
  await mkdir(path.join(root, 'ops'), { recursive: true });
  await cp(path.join(ROOT, 'ops/config'), path.join(root, 'ops/config'), { recursive: true });
  return root;
}

const asosItem = (tm, avgTa, avgRhm) => ({ tm, stnId: '108', stnNm: '서울', avgTa: String(avgTa), minTa: String(avgTa - 4), maxTa: String(avgTa + 4), avgRhm: String(avgRhm), minRhm: String(avgRhm - 20), sumRn: '' });
const asosResponse = (items, total = items.length) => ({
  ok: true, status: 200,
  text: async () => JSON.stringify({ response: { header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' }, body: { totalCount: total, items: { item: items } } } })
});

test('EMC matches Wood Handbook table values at 21 °C', () => {
  assert.equal(climate.emc(21.1, 30), 6.2);
  assert.equal(climate.emc(21.1, 50), 9.2);
  assert.equal(climate.emc(21.1, 65), 12);
  assert.equal(climate.emc(21.1, 80), 16);
  assert.equal(climate.emc(null, 50), null);
  assert.equal(climate.emc(20, 100), null);
});

test('kstYesterday follows the Korean calendar', () => {
  assert.equal(climate.kstYesterday(Date.parse('2026-11-07T14:59:00Z')), '2026-11-06'); // 23:59 KST
  assert.equal(climate.kstYesterday(Date.parse('2026-11-07T15:00:00Z')), '2026-11-07'); // 00:00 KST on the 8th
});

test('climate: no key leaves everything unchanged', async () => {
  const result = await climate.run({ env: {}, root: await sandbox(), fetchImpl: () => assert.fail('no request without a key'), log: quiet });
  assert.deepEqual(result, { changed: false, skipped: true, status: 'SKIPPED_MISSING_SECRET' });
});

test('climate: backfills from config.since, then refetches only the last days', async () => {
  const root = await sandbox();
  const urls = [];
  const now = Date.parse('2026-01-05T03:00:00Z'); // 12:00 KST on Jan 5 → newest day Jan 4
  const first = await climate.run({ env: { DATA_GO_KR_API_KEY: 'k+ey/=' }, root, now, log: quiet, fetchImpl: async url => {
    urls.push(new URL(url));
    return asosResponse([asosItem('2026-01-01', -2.5, 55), asosItem('2026-01-02', 0.4, 61), asosItem('2026-01-03', 1.1, 70), asosItem('2026-01-04', 3, 40)]);
  } });
  assert.equal(first.changed, true);
  const request = urls[0].searchParams;
  assert.equal(request.get('serviceKey'), 'k+ey/=', 'decoding key is URL-encoded once');
  assert.equal(request.get('stnIds'), '108');
  assert.equal(request.get('startDt'), '20260101');
  assert.equal(request.get('endDt'), '20260104');
  assert.equal(request.get('dataCd'), 'ASOS');
  assert.equal(request.get('dateCd'), 'DAY');
  const saved = JSON.parse(await readFile(path.join(root, 'ops/data/climate-108.json'), 'utf8'));
  assert.equal(saved.station_name, '서울');
  assert.equal(saved.days.length, 4);
  assert.deepEqual(saved.days[3], { date: '2026-01-04', avg_temp_c: 3, min_temp_c: -1, max_temp_c: 7, avg_rh_pct: 40, min_rh_pct: 20, rain_mm: null, emc_pct: climate.emc(3, 40) });

  urls.length = 0;
  const second = await climate.run({ env: { DATA_GO_KR_API_KEY: 'k' }, root, now: now + 86400000, log: quiet, fetchImpl: async url => {
    urls.push(new URL(url));
    return asosResponse([asosItem('2026-01-04', 3.2, 41), asosItem('2026-01-05', 4, 45)]);
  } });
  assert.equal(urls[0].searchParams.get('startDt'), '20260101'); // last stored day minus 3
  assert.equal(urls[0].searchParams.get('endDt'), '20260105');
  assert.equal(second.days.length, 5);
  assert.equal(second.days.find(day => day.date === '2026-01-04').avg_temp_c, 3.2, 'revised day replaced');
});

test('climate: paginates and reports portal errors clearly', async () => {
  const root = await sandbox();
  let page = 0;
  const result = await climate.run({ env: { DATA_GO_KR_API_KEY: 'k' }, root, now: Date.parse('2026-06-01T03:00:00Z'), log: quiet, since: '2023-01-01', fetchImpl: async url => {
    page = Number(new URL(url).searchParams.get('pageNo'));
    const start = Date.parse('2023-01-01') + (page - 1) * 999 * 86400000;
    const count = page === 1 ? 999 : 247;
    return asosResponse(Array.from({ length: count }, (_, i) => asosItem(new Date(start + i * 86400000).toISOString().slice(0, 10), 10, 60)), 1246);
  } });
  assert.equal(page, 2);
  assert.equal(result.days.length, 1246);

  const xml = { ok: true, status: 200, text: async () => '<OpenAPI_ServiceResponse><cmmMsgHeader><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></cmmMsgHeader></OpenAPI_ServiceResponse>' };
  await assert.rejects(climate.run({ env: { DATA_GO_KR_API_KEY: 'bad' }, root: await sandbox(), now: Date.now(), log: quiet, fetchImpl: async () => xml }), /SERVICE_KEY_IS_NOT_REGISTERED_ERROR/);
});

test('climate: changing station starts a separate file', async () => {
  const root = await sandbox();
  const configFile = path.join(root, 'ops/config/climate.json');
  const config = JSON.parse(await readFile(configFile, 'utf8'));
  await writeFile(configFile, JSON.stringify({ ...config, station_id: '119', station_name: '수원' }));
  const result = await climate.run({ env: { DATA_GO_KR_API_KEY: 'k' }, root, now: Date.parse('2026-01-03T03:00:00Z'), log: quiet, fetchImpl: async url => {
    assert.equal(new URL(url).searchParams.get('stnIds'), '119');
    return asosResponse([asosItem('2026-01-01', 1, 50)]);
  } });
  assert.match(result.file, /climate-119\.json$/);
});

test('search trends: the shipped config is valid', async () => {
  const config = trends.validateConfig(JSON.parse(await readFile(path.join(ROOT, 'ops/config/search-trends.json'), 'utf8')));
  assert.ok(config.groups.length <= 5);
  assert.throws(() => trends.validateConfig({ ...config, groups: [...config.groups, ...config.groups] }), /1–5 groups/);
  assert.throws(() => trends.validateConfig({ ...config, since: '2015-12-31' }), /since/);
});

test('search trends: no credentials leave everything unchanged', async () => {
  const result = await trends.run({ env: { NAVER_API_HUB_CLIENT_ID: 'id' }, root: await sandbox(), fetchImpl: () => assert.fail('no request'), log: quiet });
  assert.equal(result.skipped, true);
});

test('API HUB: missing, blank or legacy credentials never cause a request', async () => {
  const legacy = { NAVER_CLIENT_ID: 'legacy-id', NAVER_CLIENT_SECRET: 'legacy-secret' };
  for (const env of [
    {}, legacy,
    { ...legacy, NAVER_API_HUB_CLIENT_ID: 'hub-id' },
    { ...legacy, NAVER_API_HUB_CLIENT_SECRET: 'hub-secret' },
    { NAVER_API_HUB_CLIENT_ID: ' ', NAVER_API_HUB_CLIENT_SECRET: 'hub-secret' },
    { NAVER_API_HUB_CLIENT_ID: 'hub-id', NAVER_API_HUB_CLIENT_SECRET: '\t' }
  ]) {
    const result = await trends.run({ env, root: '/unused-no-credentials', fetchImpl: () => assert.fail('no request') });
    assert.deepEqual(result, { changed: false, skipped: true, status: 'SKIPPED_MISSING_SECRET' });
  }
});

test('search trends: sends the configured groups and stores the series', async () => {
  const root = await sandbox();
  let sent;
  const result = await trends.run({ env: { NAVER_API_HUB_CLIENT_ID: 'id', NAVER_API_HUB_CLIENT_SECRET: 'secret' }, root, now: Date.parse('2026-11-07T16:00:00Z'), log: quiet,
    fetchImpl: async (url, options) => {
      sent = { url, options, body: JSON.parse(options.body) };
      return { ok: true, status: 200, text: async () => JSON.stringify({
        startDate: '2023-01-01', endDate: '2026-11-08', timeUnit: 'week',
        results: sent.body.keywordGroups.map((group, index) => ({ title: group.groupName, keywords: group.keywords, data: [{ period: '2023-01-02', ratio: 12.3456 + index }] }))
      }) };
    } });
  assert.equal(sent.url, trends.SEARCH_TREND_ENDPOINT);
  assert.equal(sent.url, 'https://naverapihub.apigw.ntruss.com/search-trend/v1/search');
  assert.equal(sent.options.method, 'POST');
  assert.deepEqual(sent.options.headers, {
    'X-NCP-APIGW-API-KEY-ID': 'id', 'X-NCP-APIGW-API-KEY': 'secret', 'Content-Type': 'application/json'
  });
  assert.equal(sent.options.redirect, 'error');
  assert.ok(sent.options.signal instanceof AbortSignal);
  const config = JSON.parse(await readFile(path.join(root, 'ops/config/search-trends.json'), 'utf8'));
  assert.deepEqual(sent.body, {
    startDate: config.since, endDate: '2026-11-08', timeUnit: config.time_unit,
    keywordGroups: config.groups.map(group => ({ groupName: group.name, keywords: group.keywords }))
  });
  assert.equal(sent.body.endDate, '2026-11-08', 'end date is today in KST');
  assert.equal(sent.body.timeUnit, 'week');
  assert.equal(result.changed, true);
  const saved = JSON.parse(await readFile(path.join(root, 'ops/data/search-trends.json'), 'utf8'));
  assert.equal(saved.source, 'NAVER API HUB search trend API (Naver DataLab)');
  assert.equal(saved.groups[0].points[0].ratio, 12.35);
  const again = await trends.run({ env: { NAVER_API_HUB_CLIENT_ID: 'id', NAVER_API_HUB_CLIENT_SECRET: 'secret' }, root, now: Date.parse('2026-11-07T16:00:00Z'), log: quiet,
    fetchImpl: async (url, options) => ({ ok: true, status: 200, text: async () => JSON.stringify({ startDate: '2023-01-01', endDate: '2026-11-08', timeUnit: 'week',
      results: JSON.parse(options.body).keywordGroups.map((group, index) => ({ title: group.groupName, keywords: group.keywords, data: [{ period: '2023-01-02', ratio: 12.3456 + index }] })) }) }) });
  assert.equal(again.changed, false, 'identical data is not rewritten');
});

test('search trends: API errors expose only the HTTP status and allowlisted code', async () => {
  await assert.rejects(trends.run({ env: { NAVER_API_HUB_CLIENT_ID: 'id', NAVER_API_HUB_CLIENT_SECRET: 'bad' }, root: await sandbox(), log: quiet,
    fetchImpl: async () => ({ ok: false, status: 401, text: async () => JSON.stringify({ error: { message: 'Authentication failed', errorCode: '200' } }) }) }), /API_ERROR HTTP=401 code=200/);
});
