#!/usr/bin/env node
// Search interest for RavenForge's instrument categories from the Naver DataLab
// search trend API. Groups and keywords live in ops/config/search-trends.json.
//
//   NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... node tools/ops_search_trends.mjs
//
// Ratios are relative within one request (100 = the highest period of any group),
// so every run replaces the whole series. Without credentials the script exits
// successfully and changes nothing.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATALAB_ENDPOINT = 'https://openapi.naver.com/v1/datalab/search';
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

export async function run({ env = process.env, now = Date.now(), fetchImpl = fetch, root = ROOT, log = console.log } = {}) {
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
    log('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET are not set; search trends unchanged.');
    return { changed: false, skipped: true };
  }
  const config = validateConfig(JSON.parse(await readFile(path.join(root, 'ops/config/search-trends.json'), 'utf8')));
  const body = requestBody(config, now);
  const response = await fetchImpl(DATALAB_ENDPOINT, {
    method: 'POST',
    headers: { 'X-Naver-Client-Id': env.NAVER_CLIENT_ID, 'X-Naver-Client-Secret': env.NAVER_CLIENT_SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000)
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  if (!response.ok) throw new Error(`DataLab HTTP ${response.status}: ${data?.errorMessage || text.slice(0, 160)}`);
  if (!Array.isArray(data?.results)) throw new Error('DataLab response has no results');

  const output = {
    source: 'Naver DataLab search trend API',
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
  log(`DataLab ${output.start_date}..${output.end_date} (${output.time_unit}): ${output.groups.length} groups${changed ? '' : ' (no change)'}.`);
  return { changed, output, file };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch(error => { console.error(error.message); process.exit(1); });
}
