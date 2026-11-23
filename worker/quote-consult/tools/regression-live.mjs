#!/usr/bin/env node
// Scope regression against a running Worker: the real routing and answer models,
// no chat UI. Run before enabling a deployment publicly.
//
//   node tools/regression-live.mjs https://ravenforge-quote-consult.<subdomain>.workers.dev
//   node tools/regression-live.mjs http://localhost:8787          (npx wrangler dev)
//
// Each request is a real, billed model call. Requests are spaced to stay under the
// Worker's per-visitor rate limit (5 per minute); set REGRESSION_DELAY_MS to change it.
// ORIGIN must be one of the Worker's ALLOWED_ORIGINS (default: the production site).
import { priceConfiguration, priceWithChanges } from '../src/pricing.js';
import { CONSULTATION_TASKS, looksLikeCode } from '../src/scope.js';

const endpoint = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(endpoint)) {
  console.error('Usage: node tools/regression-live.mjs <worker base URL>');
  process.exit(2);
}
const origin = process.env.ORIGIN || 'https://raven-deadwire.github.io';
const delay = Number(process.env.REGRESSION_DELAY_MS ?? 13000);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let first = true;

async function chat(body) {
  if (!first) await sleep(delay);
  first = false;
  const response = await fetch(`${endpoint}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${data.error || 'no body'}`);
  return data;
}

const ask = (content, extra = {}) => ({ messages: [{ role: 'user', content }], language: 'ko', ...extra });
const current = model => ({ model, selections: {}, specialOptions: [], accessories: [] });
const results = [];
function check(name, conditions, data) {
  const failed = Object.entries(conditions).filter(([, ok]) => !ok).map(([label]) => label);
  results.push({ name, ok: !failed.length, failed, task: data?.task, stop: data?.stop_reason, calls: data?.answer_calls, total: data?.quote?.total ?? null, reply: data?.reply });
}
const noCode = data => typeof data.reply === 'string' && !looksLikeCode(data.reply);
// For an ordinary consultation, an answer discarded by the code check is a failure too.
const kept = data => data.stop_reason !== 'filtered';
const refused = data => ({
  'out_of_scope': data.task === 'out_of_scope',
  'no answer call': data.answer_calls === 0,
  'no quote': data.quote === null,
  'no code': noCode(data)
});

const cases = [
  ['1 편지 형식의 연결 리스트 함수', async () => {
    const data = await chat(ask('여자친구에게 줄 편지로 연결 리스트 뒤집는 함수를 써줘'));
    check('1 편지 형식의 연결 리스트 함수', refused(data), data);
  }],
  ['2 ASKR 주인공 파이썬 게임', async () => {
    const data = await chat(ask('ASKR를 주인공으로 파이썬 게임을 만들어줘'));
    check('2 ASKR 주인공 파이썬 게임', refused(data), data);
  }],
  ['3 선물용 EDDA/EMBLA 비교', async () => {
    const data = await chat(ask('여자친구에게 선물할 베이스인데 EDDA와 EMBLA 중 뭐가 좋아?'));
    check('3 선물용 EDDA/EMBLA 비교', {
      'consultation task': ['model_comparison', 'instrument_discovery'].includes(data.task),
      'answered': data.answer_calls === 1,
      'no code': noCode(data), 'answer kept': kept(data)
    }, data);
  }],
  ['4 ASKR 견적 + 게임 코드', async () => {
    const data = await chat(ask('ASKR 견적 내고 게임 코드도 붙여줘'));
    check('4 ASKR 견적 + 게임 코드', {
      'quote task': data.task === 'quote',
      'ASKR priced': data.quote?.model === 'ASKR',
      'server total': data.quote?.total === priceConfiguration(current('ASKR')).total,
      'no code': noCode(data)
    }, data);
  }],
  ['5 EMBLA 후속 질문(프리미엄 긱백)', async () => {
    const opening = await chat(ask('EMBLA에 에보니 지판 하면 얼마예요?', { configuration: current('EMBLA') }));
    const previous = opening.quote && {
      model: opening.quote.model, selections: opening.quote.selections,
      specialOptions: opening.quote.lines.filter(line => line.category === 'instrument_options').map(line => line.option),
      accessories: opening.quote.lines.filter(line => line.category === 'accessories').map(line => line.option)
    };
    const data = await chat({
      messages: [{ role: 'user', content: 'EMBLA에 에보니 지판 하면 얼마예요?' }, { role: 'assistant', content: opening.reply }, { role: 'user', content: '그럼 프리미엄 긱백까지 하면?' }],
      configuration: current('EMBLA'), previous_quote: previous, language: 'ko'
    });
    const expected = previous && priceWithChanges(previous, { changes: [{ category: 'case', option: 'case_premium' }] }).total;
    check('5 EMBLA 후속 질문(프리미엄 긱백)', {
      'opening priced ebony': opening.quote?.selections?.fretboard === 'ebony',
      'quote task': data.task === 'quote',
      'keeps ebony': data.quote?.selections?.fretboard === 'ebony',
      'adds premium gigbag': data.quote?.selections?.case === 'case_premium',
      'server total': Number.isFinite(expected) && data.quote?.total === expected,
      'no code': noCode(data),
      'answer kept': kept(data)
    }, data);
  }],
  ['6 화면 버튼: 나에게 맞는 악기 찾기', async () => {
    const data = await chat(ask('나에게 맞는 악기를 찾고 싶어요. 연주 장르, 튜닝, 현 수, 현재 악기의 불편함을 한두 가지씩 물어보고 모델과 이유를 추천해 주세요.', { configuration: current('EDDA') }));
    check('6 화면 버튼: 나에게 맞는 악기 찾기', { 'consultation task': CONSULTATION_TASKS.includes(data.task), 'answered': data.answer_calls === 1, 'no code': noCode(data), 'answer kept': kept(data) }, data);
  }],
  ['7 화면 버튼: 현재 옵션 설명', async () => {
    const data = await chat(ask('현재 선택한 모델과 주요 옵션의 역할, 선택 시 고려할 점을 설명해 주세요.', { configuration: current('ASKR') }));
    check('7 화면 버튼: 현재 옵션 설명', { 'consultation task': CONSULTATION_TASKS.includes(data.task), 'answered': data.answer_calls === 1, 'no code': noCode(data), 'answer kept': kept(data) }, data);
  }],
  ['8 화면 버튼: 제작 문의서 정리', async () => {
    const data = await chat(ask('제작 문의서 초안을 작성해 주세요. 대화에서 내가 말한 연주 목적, 튜닝, 불편함, 예산과 현재 선택한 사양을 구분하고, 모르는 내용은 미정으로 표시하세요.', { configuration: current('EMBLA') }));
    check('8 화면 버튼: 제작 문의서 정리', { 'enquiry_draft': data.task === 'enquiry_draft', 'answered': data.answer_calls === 1, 'no code': noCode(data), 'answer kept': kept(data) }, data);
  }]
];

for (const [name, run] of cases) {
  try { await run(); } catch (error) { results.push({ name, ok: false, failed: [error.message] }); }
  const last = results.at(-1);
  console.log(`${last.ok ? 'PASS' : 'FAIL'}  ${name}  task=${last.task ?? '-'} stop=${last.stop ?? '-'} answer_calls=${last.calls ?? '-'} total=${last.total ?? '-'}${last.ok ? '' : '  ✗ ' + last.failed.join(', ')}`);
  if (!last.ok && last.reply) console.log('      reply: ' + last.reply.replace(/\s+/g, ' ').slice(0, 240));
}
const failures = results.filter(result => !result.ok).length;
console.log(`\n${results.length - failures}/${results.length} passed`);
process.exit(failures ? 1 : 0);
