#!/usr/bin/env node
// Search interest for RavenForge's instrument categories from NAVER API HUB's
// search trend API. Groups and keywords live in ops/config/search-trends.json.
//
// Provide NAVER_API_HUB_CLIENT_ID and NAVER_API_HUB_CLIENT_SECRET through the
// environment, then run: node tools/ops_search_trends.mjs
// Legacy NAVER Developers credentials are not accepted or used as a fallback.
//
// Ratios are relative within one request (100 = the highest period of any group),
// so every run replaces the whole series. Without credentials the script exits
// successfully and changes nothing.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ApiError, fetchText, runCli } from './ops_reporting.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SEARCH_TREND_ENDPOINT = 'https://naverapihub.apigw.ntruss.com/search-trend/v1/search';
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function validateConfig(config) {
  const groups = config?.groups;
  if (!Array.isArray(groups) || !groups.length || groups.length > 5) throw new Error('search-trends.json: 1–5 groups');
  groups.forEach((group, index) => {
    if (typeof group.name !== 'string' || !group.name.trim()) throw new Error(`group ${index + 1}: name is required`);
    if (!Array.isArray(group.keywords) || !group.keywords.length || group.keywords.length > 20 ||
      group.keywords.some(keyword => typeof keyword !== 'string' || !keyword.trim())) throw new Error(`group ${group.name}: 1–20 keywords`);
  });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.since || '') || config.since < '2016-01-01') throw new Error('search-trends.json: since must be YYYY-MM-DD from 2016-01-01');
  if (!['date', 'week', 'month'].includes(config.time_unit)) throw new Error('search-trends.json: time_unit must be date, week or month');
  return config;
}

export function requestBody(config, now) {
  return {
    startDate: config.since,
    endDate: new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10),
    timeUnit: config.time_unit,
    keywordGroups: config.groups.map(group => ({ groupName: group.name, keywords: group.keywords }))
  };
}

export async function run({ env = process.env, now = Date.now(), fetchImpl = fetch, root = ROOT } = {}) {
  if (!env.NAVER_API_HUB_CLIENT_ID?.trim() || !env.NAVER_API_HUB_CLIENT_SECRET?.trim()) {
    return { changed: false, skipped: true, status: 'SKIPPED_MISSING_SECRET' };
  }
  const config = validateConfig(JSON.parse(await readFile(path.join(root, 'ops/config/search-trends.json'), 'utf8')));
  const body = requestBody(config, now);
  const { response, text } = await fetchText(fetchImpl, SEARCH_TREND_ENDPOINT, {
    method: 'POST',
    headers: { 'X-NCP-APIGW-API-KEY-ID': env.NAVER_API_HUB_CLIENT_ID, 'X-NCP-APIGW-API-KEY': env.NAVER_API_HUB_CLIENT_SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000)
  });
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  // API Gateway wraps errorCode; search validation errors instead use errMsg,
  // errId and sometimes the submitted body. Never expose those arbitrary fields.
  if (!response.ok) throw new ApiError(response.status, data?.error?.errorCode ?? data?.errorCode);
  if (!Array.isArray(data?.results)) throw new ApiError(response.status, 'INVALID_RESPONSE');
  if (!data.results.length) return { changed: false, status: 'NO_DATA', count: 0 };
  // Never overwrite a valid series with a partial or malformed API response.
  if (data.results.length !== config.groups.length || data.results.some(result => !Array.isArray(result?.data))) {
    throw new ApiError(response.status, 'INVALID_RESPONSE');
  }
  if (data.results.every(result => !result.data.length)) return { changed: false, status: 'NO_DATA', count: 0 };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(data.endDate || '') || data.timeUnit !== body.timeUnit ||
    data.results.some(result => result.data.some(point => !/^\d{4}-\d{2}-\d{2}$/.test(point?.period || '') ||
      !['number', 'string'].includes(typeof point.ratio) || String(point.ratio).trim() === '' ||
      !Number.isFinite(Number(point.ratio)) || Number(point.ratio) < 0 || Number(point.ratio) > 100))) {
    throw new ApiError(response.status, 'INVALID_RESPONSE');
  }

  const output = {
    source: 'NAVER API HUB search trend API (Naver DataLab)',
    note: 'Relative search interest: 100 is the highest period across all groups in this request.',
    start_date: data.startDate,
    end_date: data.endDate,
    time_unit: data.timeUnit,
    groups: data.results.map(result => ({
      name: result.title,
      keywords: result.keywords,
      points: (result.data || []).map(point => ({ period: point.period, ratio: Math.round(Number(point.ratio) * 100) / 100 }))
    }))
  };
  const file = path.join(root, 'ops/data/search-trends.json');
  let previous = '';
  try { previous = await readFile(file, 'utf8'); } catch { previous = ''; }
  const next = JSON.stringify(output, null, 1) + '\n';
  const changed = previous !== next;
  if (changed) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, next);
  }
  const points = output.groups.flatMap(group => group.points);
  return { changed, output, file, status: 'SUCCESS', count: points.length,
    latest: points.map(point => point.period).sort().at(-1) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await runCli('trends', () => run());
}
