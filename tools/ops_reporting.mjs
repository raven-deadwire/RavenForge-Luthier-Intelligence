// Only fixed status labels, allowlisted API codes and numeric metrics may leave
// the collectors through logs, Actions outputs or job summaries. Never stringify
// a response, URL, request headers, arbitrary error.message, or error cause.
import { appendFile } from 'node:fs/promises';

const API_CODES = new Set([
  '01', '02', '04', '05', '10', '11', '12', '20', '21', '22', '23', '29', '30', '31', '32', '99',
  '024', 'INVALID_RESPONSE', 'NETWORK_ERROR', 'TIMEOUT',
  // NAVER API HUB documented Gateway authentication and common error codes.
  '200', '300', '400', '401', '403', '429', '500',
  'SERVICE_KEY_IS_NOT_REGISTERED_ERROR', 'SERVICE_ACCESS_DENIED_ERROR',
  'DEADLINE_HAS_EXPIRED_ERROR', 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR'
]);

export class ApiError extends Error {
  constructor(httpStatus, code) {
    const status = Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? httpStatus : null;
    const safeCode = API_CODES.has(code) ? code : 'UNKNOWN';
    super(`API_ERROR HTTP=${status ?? 'none'} code=${safeCode}`);
    this.httpStatus = status;
    this.code = safeCode;
  }
}

// Transport errors can contain credential-bearing URLs, including encoded keys.
// Redirects are rejected so credentials never travel to a different endpoint.
export async function fetchText(fetchImpl, url, options) {
  try {
    const response = await fetchImpl(url, { ...options, redirect: 'error' });
    return { response, text: await response.text() };
  } catch (error) {
    throw new ApiError(null, error?.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR');
  }
}

export function asosXmlCode(text) {
  const code = text.match(/<returnAuthMsg>\s*([^<]+?)\s*<\/returnAuthMsg>/)?.[1];
  return API_CODES.has(code) ? code : 'INVALID_RESPONSE';
}

const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : 'none';

export async function runCli(collector, action, { env = process.env, log = console.log } = {}) {
  const name = collector === 'climate' ? 'climate' : 'trends';
  let result;
  let failure;
  try { result = await action(); } catch (error) { failure = error; }
  const allowed = new Set(['SKIPPED_MISSING_SECRET', 'NO_DATA', 'SUCCESS']);
  const status = failure instanceof ApiError ? 'API_ERROR' : failure ? 'COLLECTOR_ERROR'
    : allowed.has(result?.status) ? result.status : 'COLLECTOR_ERROR';
  const failed = status === 'API_ERROR' || status === 'COLLECTOR_ERROR';
  const changed = !failed && result?.changed === true;
  const metrics = `fetched=${count(result?.count)} latest=${day(result?.latest)} changed=${changed}`;
  const detail = failure instanceof ApiError
    ? `HTTP=${failure.httpStatus ?? 'none'} code=${failure.code}` : metrics;
  log(`${name}: ${status} ${detail}`);
  try {
    if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `status=${status}\nchanged=${changed}\n`);
    if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY,
      `### ${name}\n\n- Status: **${status}**\n- ${detail}\n\n`);
  } catch {
    log(`${name}: REPORTING_ERROR`);
    return 1;
  }
  return failed ? 1 : 0;
}
