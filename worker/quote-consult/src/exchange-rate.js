// EUR→KRW reference rate from the Export-Import Bank of Korea's public exchange-rate API
// (한국수출입은행 현재환율 API, data=AP01). Quotes stay in EUR; this only adds a
// rounded KRW reference for Korean visitors, and any failure simply omits it.
//
// The bank publishes one set of rates per business day, around 11:00 KST. Before that,
// and on weekends and public holidays, the API returns an empty list, so the lookup
// walks back to the most recent business day.

export const EXIM_ENDPOINT = 'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON';
const LOOKBACK_DAYS = 7; // covers long holidays such as Chuseok and Seollal
const REQUEST_TIMEOUT_MS = 2500;
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 10 * 60 * 1000; // after a failure, do not retry on every message
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

let cache = null; // { value, expires } per Worker isolate

export function resetRateCache() { cache = null; }

// YYYYMMDD of the KST calendar day `daysBack` days before `now`.
export function kstDate(now, daysBack = 0) {
  return new Date(now + KST_OFFSET_MS - daysBack * 86400000).toISOString().slice(0, 10).replaceAll('-', '');
}

// "1,512.34" → 1512.34; anything else → null.
const parseRate = text => {
  const rate = Number(String(text ?? '').replaceAll(',', ''));
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};

async function lookup(env, fetchImpl, now) {
  for (let daysBack = 0; daysBack < LOOKBACK_DAYS; daysBack += 1) {
    const date = kstDate(now, daysBack);
    const url = `${EXIM_ENDPOINT}?${new URLSearchParams({ authkey: env.KOREAEXIM_API_KEY, searchdate: date, data: 'AP01' })}`;
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`exchange rate HTTP ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('exchange rate response is not a list');
    if (!rows.length) continue; // no publication that day
    // result: 1 success, 2 data code error, 3 authentication error, 4 daily limit exceeded
    if (rows.some(row => row?.result !== undefined && row.result !== 1)) throw new Error(`exchange rate result ${rows[0]?.result}`);
    const rate = parseRate(rows.find(row => row?.cur_unit === 'EUR')?.deal_bas_r);
    if (!rate) throw new Error('no EUR rate in response');
    return { rate, date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}` };
  }
  throw new Error('no published exchange rate in the lookback window');
}

// Resolves to { rate, date } or null. Never throws.
export async function eurKrwRate(env, { fetchImpl = fetch, now = Date.now() } = {}) {
  if (!env?.KOREAEXIM_API_KEY) return null;
  if (cache && cache.expires > now) return cache.value;
  let value = null;
  try { value = await lookup(env, fetchImpl, now); }
  catch (error) { console.error('Exchange rate unavailable', error?.message || 'Error'); }
  cache = { value, expires: now + (value ? CACHE_TTL_MS : FAILURE_TTL_MS) };
  return value;
}

// The KRW reference for a priced quote, rounded to the nearest 1,000 won, or null.
export function krwReference(quote, rate) {
  if (!rate || !Number.isFinite(quote?.total)) return null;
  return {
    total_krw: Math.round((quote.total * rate.rate) / 1000) * 1000,
    rate: rate.rate,
    rate_date: rate.date,
    source: 'koreaexim-deal-bas-r',
    price_on_request: Boolean(quote.price_on_request)
  };
}
