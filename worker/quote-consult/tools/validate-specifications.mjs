#!/usr/bin/env node
// Explicit opt-in live validation against THIS checkout, never a deployment.
//   node tools/validate-specifications.mjs --recorded --output /tmp/spec-recorded
//   OPENAI_API_KEY=... node tools/validate-specifications.mjs --live --output /tmp/spec-live
// --include-original adds the four original request/history bodies to the 12
// targeted cases. --case ko-xpure_power limits an investigation to one case.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { SPECIFICATION_CASES, evaluateSpecificationReply } from '../test/fixtures/specification-cases.js';

const workerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(workerRoot, '../..');
const evidenceRoot = path.join(repoRoot, 'docs/evidence/instrument-advisor-20261031');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const parseBody = body => typeof body === 'string' ? JSON.parse(body) : body;
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const relative = file => path.relative(repoRoot, file).split(path.sep).join('/');
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

export function recordedCases() {
  const entries = [
    ['ko-EDDA.json', 'explain', 'xpure_power', 'ko'],
    ['de-EDDA.json', 'explain', 'edda_electronics', 'de'],
    ['en-GRAMR.json', 'compare', 'gramr_fretboard', 'en']
  ].map(([filename, phase, family, language]) => {
    const file = path.join(evidenceRoot, 'live-api', filename);
    const evidence = readJson(file);
    const call = evidence.calls.find(entry => entry.phase === phase);
    if (!call) throw new Error(`Missing recorded phase ${phase}: ${relative(file)}`);
    return {
      id: `original-${language}-${family}`, family, language,
      kind: 'original_request_with_recorded_history', request: call.request,
      original: { file: relative(file), sha256: sha256(fs.readFileSync(file)),
        selector: `calls[phase=${phase}]`, source_commit: evidence.source,
        captured_at: call.at, http_status: call.status,
        worker_version: '20261031-instrument-advisor-1', response: parseBody(call.body) }
    };
  });
  const file = path.join(evidenceRoot, 'live-apply.json');
  const call = readJson(file).find(entry => entry.model === 'EMBLA' && entry.language === 'en');
  if (!call) throw new Error('Missing recorded EMBLA/en browser response.');
  entries.push({
    id: 'original-en-embla_default', family: 'embla_default', language: 'en',
    kind: 'original_request_with_recorded_history', request: call.request,
    original: { file: relative(file), sha256: sha256(fs.readFileSync(file)),
      selector: '[model=EMBLA,language=en]', source_commit: '2546afa584d662243cd48646a9100dba387cc74d',
      captured_at: null, http_status: call.response.status,
      worker_version: '20261031-instrument-advisor-1', response: parseBody(call.response.body) }
  });
  return entries;
}

function gitText(args) {
  try { return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

function candidateProvenance() {
  const sources = fs.readdirSync(path.join(workerRoot, 'src')).filter(name => name.endsWith('.js'))
    .map(name => path.join(workerRoot, 'src', name));
  sources.push(path.join(workerRoot, 'package-lock.json'), fileURLToPath(import.meta.url),
    path.join(workerRoot, 'test/fixtures/specification-cases.js'));
  const source_hashes = Object.fromEntries(sources.filter(file => fs.existsSync(file))
    .sort().map(file => [relative(file), sha256(fs.readFileSync(file))]));
  const index = fs.readFileSync(path.join(workerRoot, 'src/index.js'), 'utf8');
  return {
    git_head: gitText(['rev-parse', 'HEAD']),
    working_tree_status: gitText(['status', '--porcelain', '--', 'worker/quote-consult']),
    source_hashes,
    source_manifest_sha256: sha256(JSON.stringify(source_hashes)),
    build_version: index.match(/export const BUILD_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1] || null,
    system_prompt_sha256: null
  };
}

// Never log Authorization headers. Opaque encrypted reasoning is not useful to
// reviewers; retain its digest/length while the real client keeps the original.
function publicTrace(value, secret) {
  if (typeof value === 'string') return secret ? value.split(secret).join('[REDACTED_API_KEY]') : value;
  if (Array.isArray(value)) return value.map(entry => publicTrace(entry, secret));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) =>
    key === 'encrypted_content' && typeof entry === 'string'
      ? [key, { omitted: 'opaque encrypted reasoning', sha256: sha256(entry), characters: entry.length }]
      : [key, publicTrace(entry, secret)]));
  return value;
}

function options(args) {
  const result = { mode: null, output: null, includeOriginal: false, caseId: null };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--recorded' || arg === '--live') {
      if (result.mode) throw new Error('Select exactly one mode: --recorded or --live.');
      result.mode = arg.slice(2);
    } else if (arg === '--include-original') result.includeOriginal = true;
    else if (arg === '--output' || arg === '--case') {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`${arg} needs a value.`);
      result[arg === '--output' ? 'output' : 'caseId'] = value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!result.mode) throw new Error('Select --recorded (no API) or --live (explicit paid API calls).');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  result.output = path.resolve(result.output || path.join(workerRoot, 'validation', `specifications-${result.mode}-${timestamp}`));
  return result;
}

export async function main(args = process.argv.slice(2)) {
  const opts = options(args);
  fs.mkdirSync(opts.output, { recursive: true });
  const summaryFile = path.join(opts.output, 'summary.json');
  if (fs.existsSync(summaryFile)) throw new Error('This output already contains a summary; use a new directory to preserve the previous run.');
  const started = new Date().toISOString();

  if (opts.mode === 'recorded') {
    const cases = recordedCases().filter(entry => !opts.caseId || entry.id === opts.caseId);
    if (!cases.length) throw new Error(`Unknown recorded case: ${opts.caseId}`);
    const records = cases.map(entry => ({ ...entry,
      audit: evaluateSpecificationReply(entry.family, entry.language, entry.original.response.reply) }));
    const allDetected = records.every(entry => entry.audit.findings.length > 0);
    writeJson(path.join(opts.output, 'recorded-audit.json'), records);
    const summary = {
      format_version: 1, mode: 'recorded_baseline_audit', started_at: started,
      finished_at: new Date().toISOString(), status: allDetected ? 'known_errors_detected' : 'known_error_not_detected',
      scope: 'Reinspection of recorded old production replies. No new OpenAI request and no candidate quality claim.',
      counts: { records: records.length, records_with_findings: records.filter(entry => entry.audit.findings.length).length,
        openai_http_attempts: 0, openai_http_responses: 0, mock_requests: 0 },
      report: 'recorded-audit.json'
    };
    writeJson(summaryFile, summary);
    console.log(JSON.stringify(summary, null, 2));
    return allDetected ? 0 : 1;
  }

  let cases = [...SPECIFICATION_CASES, ...(opts.includeOriginal ? recordedCases() : [])];
  if (opts.caseId) cases = cases.filter(entry => entry.id === opts.caseId);
  if (!cases.length) throw new Error(`Unknown live case: ${opts.caseId}`);
  const summary = {
    format_version: 1, mode: 'live_openai_candidate', started_at: started,
    status: 'running',
    scope: 'Current local handleChat + OpenAI Responses adapter. This is not a deployed Worker, CORS, rate-limiter or browser test.',
    candidate: candidateProvenance(),
    provider: { name: 'openai', model: process.env.OPENAI_MODEL || 'gpt-5-mini', effort: process.env.OPENAI_EFFORT || 'low' },
    counts: { requested_cases: cases.length, completed_cases: 0, transport_failures: 0,
      records_with_findings: 0, openai_http_attempts: 0, openai_http_responses: 0, mock_requests: 0, manual_review_pending: 0 },
    manual_review_required: true,
    semantic_quality: 'not_certified',
    records: []
  };
  if (!process.env.OPENAI_API_KEY) {
    summary.status = 'blocked_missing_openai_api_key';
    summary.finished_at = new Date().toISOString();
    summary.reason = 'OPENAI_API_KEY is not available. No credentials were created, searched for or sent, and no API request was made.';
    writeJson(summaryFile, summary);
    console.error(summary.reason);
    return 2;
  }

  const [{ handleChat }, { createOpenAIClient }, { SYSTEM_PROMPT }] = await Promise.all([
    import('../src/index.js'), import('../src/openai-client.js'), import('../src/prompt.js')
  ]);
  summary.candidate.system_prompt_sha256 = sha256(SYSTEM_PROMPT);
  fs.writeFileSync(path.join(opts.output, 'system-prompt.txt'), SYSTEM_PROMPT);
  const env = { AI_PROVIDER: 'openai', OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: summary.provider.model, OPENAI_EFFORT: summary.provider.effort };
  writeJson(summaryFile, summary);

  for (const entry of cases) {
    const record = { id: entry.id, family: entry.family, language: entry.language,
      mode: 'live_openai_candidate', kind: entry.kind,
      started_at: new Date().toISOString(), request: entry.request,
      original_evidence: entry.original ? { ...entry.original, response: undefined } : null,
      review_requirements: entry.review_requirements || SPECIFICATION_CASES.find(item => item.family === entry.family).review_requirements,
      api_rounds: [] };
    const client = createOpenAIClient(env, async (url, request) => {
      const round = { started_at: new Date().toISOString(), url, request: JSON.parse(request.body) };
      record.api_rounds.push(round);
      summary.counts.openai_http_attempts += 1;
      const response = await fetch(url, request);
      summary.counts.openai_http_responses += 1;
      round.http_status = response.status;
      round.request_id = response.headers.get('x-request-id');
      round.finished_at = new Date().toISOString();
      const raw = await response.clone().text();
      try { round.response = JSON.parse(raw); }
      catch { round.response = { non_json_body_omitted: true, characters: raw.length }; }
      return response;
    });
    try {
      record.response = await handleChat(structuredClone(entry.request), env, client);
      record.audit = evaluateSpecificationReply(entry.family, entry.language, record.response.reply);
      record.status = record.audit.findings.length ? 'findings_require_review' : 'awaiting_manual_review';
      summary.counts.completed_cases += 1;
      summary.counts.manual_review_pending += 1;
      if (record.audit.findings.length) summary.counts.records_with_findings += 1;
    } catch (error) {
      record.status = 'transport_or_handler_failure';
      record.error = { name: error.name, status: error.status ?? null, message: error.message };
      summary.counts.transport_failures += 1;
    }
    record.finished_at = new Date().toISOString();
    const filename = `${entry.id}.json`;
    writeJson(path.join(opts.output, filename), publicTrace(record, env.OPENAI_API_KEY));
    summary.records.push({ id: entry.id, file: filename, status: record.status });
    writeJson(summaryFile, summary);
    console.log(`${entry.id}: ${record.status}`);
    // Authentication/configuration errors will affect every remaining case;
    // stop instead of making the same unsuccessful request twelve times.
    if (record.error && [401, 403].includes(record.error.status)) break;
  }
  summary.finished_at = new Date().toISOString();
  const hasFailures = summary.counts.transport_failures || summary.counts.records_with_findings;
  summary.status = hasFailures ? 'findings_or_failures_require_review' : 'awaiting_manual_review';
  writeJson(summaryFile, summary);
  console.log(JSON.stringify(summary, null, 2));
  return hasFailures ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    // Unexpected setup failures are local; avoid dumping provider objects or env.
    console.error(`Specification validation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
