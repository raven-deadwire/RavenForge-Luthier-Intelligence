#!/usr/bin/env node
// Workshop climate log: daily outdoor temperature and humidity from the Korea
// Meteorological Administration's ASOS daily data service (data.go.kr), with the
// equilibrium moisture content (EMC) that wood would approach in that air.
//
// This is OUTDOOR weather for context. It does not replace an in-shop hygrometer:
// NB01's measurement protocol records the workshop's own temperature and RH.
//
//   DATA_GO_KR_API_KEY=... node tools/ops_climate.mjs [--since YYYY-MM-DD]
//
// Use the portal's "Decoding" key; it is URL-encoded here. Without a key the
// script exits successfully and changes nothing.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ApiError, asosXmlCode, fetchText, runCli } from './ops_reporting.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ASOS_DAILY_ENDPOINT = 'https://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList';
const PAGE_SIZE = 999;
const REFETCH_DAYS = 3; // the service sometimes revises the most recent days
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const isoDay = time => new Date(time).toISOString().slice(0, 10);
// Yesterday in Korea: the newest day the daily service can return.
export const kstYesterday = now => isoDay(now + KST_OFFSET_MS - 86400000);
const compact = day => day.replaceAll('-', '');
const num = value => (value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) ? null : Number(value));

// Equilibrium moisture content (%) for temperature °C and relative humidity %,
// Hailwood–Horrobin model as given in the USDA Forest Products Laboratory Wood
// Handbook (FPL-GTR-282, eq. 4-5). Typical accuracy is about ±1 % MC.
export function emc(temperatureC, rhPct) {
  if (!Number.isFinite(temperatureC) || !Number.isFinite(rhPct) || rhPct <= 0 || rhPct >= 100) return null;
  const T = temperatureC;
  const h = rhPct / 100;
  const W = 349 + 1.29 * T + 0.0135 * T * T;
  const K = 0.805 + 0.000736 * T - 0.00000273 * T * T;
  const K1 = 6.27 - 0.00938 * T - 0.000303 * T * T;
  const K2 = 1.91 + 0.0407 * T - 0.000293 * T * T;
  const Kh = K * h;
  const value = (1800 / W) * (Kh / (1 - Kh) + (K1 * Kh + 2 * K1 * K2 * Kh * Kh) / (1 + K1 * Kh + K1 * K2 * Kh * Kh));
  return Math.round(value * 10) / 10;
}

export function toDay(item) {
  const avgTemp = num(item.avgTa);
  const avgRh = num(item.avgRhm);
  return {
    date: String(item.tm).slice(0, 10),
    avg_temp_c: avgTemp,
    min_temp_c: num(item.minTa),
    max_temp_c: num(item.maxTa),
    avg_rh_pct: avgRh,
    min_rh_pct: num(item.minRhm),
    rain_mm: num(item.sumRn),
    emc_pct: emc(avgTemp, avgRh)
  };
}

async function fetchPage({ key, stationId, start, end, page, fetchImpl }) {
  const params = new URLSearchParams({
    serviceKey: key, pageNo: String(page), numOfRows: String(PAGE_SIZE), dataType: 'JSON',
    dataCd: 'ASOS', dateCd: 'DAY', startDt: compact(start), endDt: compact(end), stnIds: stationId
  });
  const { response, text } = await fetchText(fetchImpl, `${ASOS_DAILY_ENDPOINT}?${params}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new ApiError(response.status);
  let data;
  // An unregistered or wrong key is answered with an XML error page and HTTP 200.
  try { data = JSON.parse(text); } catch { throw new ApiError(response.status, asosXmlCode(text)); }
  const header = data?.response?.header;
  if (header?.resultCode === '03') return { items: [], total: 0 }; // NODATA
  if (header?.resultCode !== '00') throw new ApiError(response.status, header?.resultCode);
  const body = data.response.body;
  if (!body || !Number.isFinite(Number(body.totalCount))) throw new ApiError(response.status, 'INVALID_RESPONSE');
  const items = body?.items?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];
  if (list.some(item => !/^\d{4}-\d{2}-\d{2}$/.test(item?.tm || ''))) throw new ApiError(response.status, 'INVALID_RESPONSE');
  return { items: list, total: Number(body.totalCount) };
}

export async function fetchDays({ key, stationId, start, end, fetchImpl = fetch }) {
  const days = [];
  for (let page = 1; ; page += 1) {
    const { items, total } = await fetchPage({ key, stationId, start, end, page, fetchImpl });
    days.push(...items.map(toDay));
    if (!items.length || page * PAGE_SIZE >= total) break;
  }
  return days;
}

// Newer days replace older entries with the same date; sorted by date.
export function mergeDays(existing, fresh) {
  const byDate = new Map(existing.map(day => [day.date, day]));
  fresh.forEach(day => byDate.set(day.date, day));
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function run({ env = process.env, now = Date.now(), fetchImpl = fetch, root = ROOT, since: sinceOverride } = {}) {
  const key = env.DATA_GO_KR_API_KEY;
  if (!key?.trim()) return { changed: false, skipped: true, status: 'SKIPPED_MISSING_SECRET' };
  const config = JSON.parse(await readFile(path.join(root, 'ops/config/climate.json'), 'utf8'));
  if (!/^\d{2,4}$/.test(String(config.station_id))) throw new Error('ops/config/climate.json: station_id must be a KMA ASOS station number');
  const file = path.join(root, `ops/data/climate-${config.station_id}.json`);
  let previous = null;
  try { previous = JSON.parse(await readFile(file, 'utf8')); } catch { previous = null; }
  const existing = previous?.days || [];

  const end = kstYesterday(now);
  const last = existing.at(-1)?.date;
  let start = sinceOverride || (last ? isoDay(Date.parse(last) - REFETCH_DAYS * 86400000) : config.since);
  if (start < config.since && !sinceOverride) start = config.since;
  if (start > end) return { changed: false, status: 'NO_DATA', count: 0 };

  const fresh = await fetchDays({ key, stationId: String(config.station_id), start, end, fetchImpl });
  // An empty response is not a successful collection and must not create an
  // empty public file or replace previously collected data.
  if (!fresh.length) return { changed: false, status: 'NO_DATA', count: 0 };
  const days = mergeDays(existing, fresh);
  const output = {
    station_id: String(config.station_id),
    station_name: config.station_name,
    source: 'KMA ASOS daily data (data.go.kr AsosDalyInfoService)',
    note: 'Outdoor air. EMC is the equilibrium wood moisture content for the daily mean temperature and RH (Wood Handbook eq. 4-5).',
    days
  };
  const changed = JSON.stringify(previous?.days) !== JSON.stringify(days) || previous?.station_name !== config.station_name;
  if (changed) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(output, null, 1) + '\n');
  }
  return { changed, days, file, status: 'SUCCESS', count: fresh.length, latest: days.at(-1)?.date };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sinceIndex = process.argv.indexOf('--since');
  const since = sinceIndex > 0 ? process.argv[sinceIndex + 1] : undefined;
  process.exitCode = await runCli('climate', () => {
    if (sinceIndex > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(since || '')) throw new Error('Invalid backfill date');
    return run({ since });
  });
}
