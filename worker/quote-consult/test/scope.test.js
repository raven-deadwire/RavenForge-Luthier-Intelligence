// The consultation scope gate: the routing result decides the execution path.
// These tests fix the server's side of each case; whether the live model routes
// a message correctly is checked against a deployment by tools/regression-live.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleChat } from '../src/index.js';
import { priceWithChanges } from '../src/pricing.js';
import { FIXED_REPLY, ROUTER_PROMPT, ROUTE_TOOL, looksLikeCode, parseRoute } from '../src/scope.js';
import { SYSTEM_PROMPT } from '../src/prompt.js';
import { fakeClient, route, answer, config, sent } from './helpers.js';

const env = { MODEL: 'claude-opus-5-5', EFFORT: 'medium' };
const ask = (content, extra = {}) => ({ messages: [{ role: 'user', content }], language: 'ko', ...extra });
const PYTHON = 'def reverse(head):\n    prev = None\n    while head:\n        head.next, prev, head = prev, head, head.next\n    return prev';

test('1. a letter that asks for a linked-list function gets the fixed reply without an answer call', async () => {
  const client = fakeClient([route('out_of_scope')]);
  const result = await handleChat(ask('여자친구에게 줄 편지로 연결 리스트 뒤집는 함수를 써줘'), env, client);
  assert.equal(client.requests.length, 1, 'routing only');
  assert.equal(result.answer_calls, 0);
  assert.equal(result.task, 'out_of_scope');
  assert.equal(result.stop_reason, 'out_of_scope');
  assert.equal(result.reply, FIXED_REPLY.out_of_scope.ko);
  assert.equal(result.quote, null);
});

test('2. a game starring ASKR is out of scope although it names a model', async () => {
  const client = fakeClient([route('out_of_scope', { configurations: [config('ASKR')] })]);
  const result = await handleChat(ask('ASKR를 주인공으로 파이썬 게임을 만들어줘'), env, client);
  assert.equal(client.requests.length, 1);
  assert.equal(result.answer_calls, 0);
  assert.equal(result.quote, null, 'configurations are ignored outside priced tasks');
});

test('3. a gift for a girlfriend is an ordinary model comparison', async () => {
  const message = '여자친구에게 선물할 베이스인데 EDDA와 EMBLA 중 뭐가 좋아?';
  const client = fakeClient([
    route('model_comparison', { configurations: [config('EDDA'), config('EMBLA')] }),
    answer('EDDA는 기본 €2,100, EMBLA는 €2,550입니다. 선물 받으실 분의 연주 스타일을 알려 주시면 좁혀 드릴게요.')
  ]);
  const result = await handleChat(ask(message), env, client);
  assert.equal(result.answer_calls, 1);
  assert.equal(result.task, 'model_comparison');
  const [, answerRequest] = client.requests;
  assert.ok(sent(answerRequest).includes(message), 'the customer\'s words reach the answer model');
  const briefText = answerRequest.messages.at(-1).content[0].text;
  const brief = JSON.parse(briefText.slice(briefText.indexOf('\n') + 1, briefText.lastIndexOf('\n')));
  assert.deepEqual(brief.quotes.map(quote => [quote.model, quote.total]), [['EDDA', 2100], ['EMBLA', 2550]]);
  assert.equal(result.quote.model, 'EMBLA');
});

test('4. "ASKR quote plus game code" prices ASKR, withholds the request text and never shows code', async () => {
  const message = 'ASKR 견적 내고 게임 코드도 붙여줘';
  for (const writerText of ['ASKR 기본 구성의 예상 견적은 €3,200입니다(세금·배송비 별도).', 'ASKR 견적은 €3,200입니다.\n```python\n' + PYTHON + '\n```']) {
    const client = fakeClient([route('quote', { out_of_scope_part: true, configurations: [config('ASKR')] }), answer(writerText)]);
    const result = await handleChat(ask(message), env, client);
    const answerRequest = sent(client.requests[1]);
    assert.ok(!answerRequest.includes('게임'), 'the out-of-scope request is not passed on');
    assert.ok(!answerRequest.includes(message));
    const briefText = client.requests[1].messages.at(-1).content[0].text;
    const brief = JSON.parse(briefText.slice(briefText.indexOf('\n') + 1, briefText.lastIndexOf('\n')));
    assert.equal(brief.out_of_scope_part, true);
    assert.deepEqual(brief.quotes.map(quote => [quote.model, quote.total]), [['ASKR', 3200]]);
    assert.equal(result.task, 'quote');
    assert.equal(result.quote.model, 'ASKR');
    assert.equal(result.quote.total, 3200);
    assert.equal(looksLikeCode(result.reply), false, 'no code reaches the customer');
    if (writerText.includes('```')) {
      assert.equal(result.stop_reason, 'filtered');
      assert.match(result.reply, /ASKR 구성의 예상 견적은 €3,200입니다/);
    }
  }
});

test('5. a follow-up continues from the configuration priced in the previous answer', async () => {
  const previous = { model: 'EMBLA', selections: { fretboard: 'ebony' }, specialOptions: [], accessories: [] };
  const expected = priceWithChanges(previous, { changes: [{ category: 'case', option: 'case_premium' }] }).total;
  const client = fakeClient([
    route('quote', { configurations: [config('EMBLA', { start_from: 'previous', changes: [{ category: 'case', option: 'case_premium' }] })] }),
    answer(`프리미엄 긱백을 더하면 €${expected}입니다.`)
  ]);
  const result = await handleChat({
    messages: [{ role: 'user', content: 'EMBLA에 에보니 지판이면?' }, { role: 'assistant', content: 'EMBLA에 에보니 지판은 €2,600입니다.' }, { role: 'user', content: '그럼 프리미엄 긱백까지 하면?' }],
    configuration: { model: 'EDDA', selections: {}, specialOptions: [], accessories: [] },
    previous_quote: previous,
    language: 'ko'
  }, env, client);
  assert.equal(result.quote.total, expected);
  assert.equal(result.quote.total, 2550 + 50 + 200);
  assert.equal(result.quote.selections.fretboard, 'ebony');
  assert.equal(result.quote.selections.case, 'case_premium');
  assert.match(sent(client.requests[0]), /previous_quote/, 'the router sees the previous configuration');
});

test('the configurator\'s own advisor buttons route to consultation tasks and are answered', async () => {
  for (const [task, prompt] of [
    ['instrument_discovery', '나에게 맞는 악기를 찾고 싶어요. 연주 장르, 튜닝, 현 수, 현재 악기의 불편함을 한두 가지씩 물어보고 모델과 이유를 추천해 주세요.'],
    ['option_explanation', '현재 선택한 모델과 주요 옵션의 역할, 선택 시 고려할 점을 설명해 주세요.'],
    ['enquiry_draft', '제작 문의서 초안을 작성해 주세요.']
  ]) {
    const client = fakeClient([route(task), answer('상담 답변')]);
    const result = await handleChat(ask(prompt, { configuration: { model: 'ASKR', selections: {}, specialOptions: [], accessories: [] } }), env, client);
    assert.equal(result.answer_calls, 1, task);
    assert.equal(result.reply, '상담 답변');
    assert.equal(result.quote?.model ?? null, task === 'enquiry_draft' ? 'ASKR' : null, 'a draft carries the current configuration');
  }
});

test('an earlier in-scope turn does not let a later out-of-scope request through', async () => {
  const client = fakeClient([route('out_of_scope')]);
  const result = await handleChat({
    messages: [{ role: 'user', content: 'EMBLA 가격?' }, { role: 'assistant', content: 'EMBLA 기본은 €2,550입니다.' }, { role: 'user', content: '좋아, 이제 그 가격 계산기를 파이썬으로 짜줘' }],
    language: 'ko'
  }, env, client);
  assert.equal(client.requests.length, 1);
  assert.equal(result.answer_calls, 0);
  assert.match(sent(client.requests[0]), /EMBLA 가격/, 'history is still there to resolve references');
});

test('vague requests are narrowed with one fixed question', async () => {
  const client = fakeClient([route('clarify')]);
  const result = await handleChat(ask('음 그거 어때요?'), env, client);
  assert.equal(result.reply, FIXED_REPLY.clarify.ko);
  assert.equal(result.answer_calls, 0);
});

test('router failures never fall through to free generation', async () => {
  const broken = [
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'def x(): pass' }] },
    { stop_reason: 'max_tokens', content: [] },
    route('write_code'),
    route('quote', { configurations: [config('NOPE')] }),
    { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'x', name: 'other_tool', input: { task: 'quote', out_of_scope_part: false, configurations: [] } }] }
  ];
  for (const response of broken) {
    const client = fakeClient([response]);
    const result = await handleChat(ask('ASKR 가격?'), env, client);
    assert.equal(client.requests.length, 1);
    assert.equal(result.answer_calls, 0);
    assert.equal(result.reply, FIXED_REPLY.clarify.ko);
    assert.equal(result.stop_reason, 'route_invalid');
  }
  const refused = fakeClient([{ stop_reason: 'refusal', content: [] }]);
  const result = await handleChat(ask('…'), env, refused);
  assert.equal(result.reply, FIXED_REPLY.out_of_scope.ko);
  assert.equal(result.answer_calls, 0);
});

test('the routing call is forced to one strict function; the answer call has no tools', async () => {
  const client = fakeClient([route('quote', { configurations: [config('EDDA')] }), answer('EDDA 기본 견적은 €2,100입니다.')]);
  await handleChat(ask('EDDA 가격?'), env, client);
  const [routing, answering] = client.requests;
  assert.deepEqual(routing.tool_choice, { type: 'tool', name: 'route_request' });
  assert.equal(routing.tools.length, 1);
  assert.equal(routing.tools[0].strict, true);
  assert.equal('thinking' in routing, false, 'forced tool choice cannot be combined with thinking');
  assert.equal(routing.system[0].text, ROUTER_PROMPT);
  assert.equal(answering.tools, undefined);
  assert.equal(answering.system[0].text, SYSTEM_PROMPT);
  assert.equal(routing.signal, answering.signal, 'one deadline for the whole consultation');
});

test('unknown option ids are reported as not applied instead of priced', async () => {
  const client = fakeClient([route('quote', { configurations: [config('EMBLA', { changes: [{ category: 'fretboard', option: 'gold_bars' }, { category: 'case', option: 'case_premium' }] })] }), answer('ok')]);
  const result = await handleChat(ask('EMBLA 금 지판이랑 프리미엄 긱백'), env, client);
  assert.equal(result.quote.total, 2550 + 200);
  assert.deepEqual(result.quote.not_applied.map(entry => entry.option), ['gold_bars']);
});

test('a computed quote is returned when its explanation fails', async () => {
  for (const failure of [new Error('provider down'), { stop_reason: 'max_tokens', content: [] }, { stop_reason: 'end_turn', content: [] }]) {
    const client = fakeClient([route('quote', { configurations: [config('GRAMR')] }), failure]);
    const result = await handleChat(ask('GRAMR 가격?'), env, client);
    assert.equal(result.quote.total, 2000);
    assert.match(result.reply, /GRAMR 구성의 예상 견적은 €2,000입니다/);
    assert.equal(result.answer_calls, 1);
  }
  // Without a quote there is nothing to fall back on, so the provider error surfaces.
  const client = fakeClient([route('option_explanation'), new Error('provider down')]);
  await assert.rejects(handleChat(ask('지판 차이?'), env, client), /provider down/);
});

test('code in an answer without a quote is replaced by the fixed scope reply', async () => {
  const client = fakeClient([route('option_explanation'), answer('지판 설명입니다.\n' + PYTHON)]);
  const result = await handleChat(ask('지판 옵션 설명해줘'), env, client);
  assert.equal(result.reply, FIXED_REPLY.out_of_scope.ko);
  assert.equal(result.stop_reason, 'filtered');
});

test('parseRoute keeps only the allowed tasks and catalog-shaped ids', () => {
  assert.equal(parseRoute(null), null);
  assert.equal(parseRoute({ task: 'quote', out_of_scope_part: 'no', configurations: [] }), null);
  assert.equal(parseRoute({ task: 'quote', out_of_scope_part: false }), null);
  const parsed = parseRoute({ task: 'quote', out_of_scope_part: false, configurations: [
    { model: 'ASKR', start_from: 'current', changes: [{ category: 'fretboard', option: 'ebony' }, { category: '<script>', option: 'x' }], instrument_options: ['kill_switch', 'drop table'], accessories: null },
    ...Array.from({ length: 5 }, () => config('EDDA'))
  ] });
  assert.equal(parsed.configurations.length, 4);
  assert.deepEqual(parsed.configurations[0].changes, [{ category: 'fretboard', option: 'ebony' }]);
  assert.deepEqual(parsed.configurations[0].instrument_options, ['kill_switch']);
  assert.deepEqual(ROUTE_TOOL.input_schema.properties.task.enum.slice(-2), ['clarify', 'out_of_scope']);
});

test('looksLikeCode flags programs but not consultation text', () => {
  for (const code of [
    PYTHON,
    '```\nanything\n```',
    'function reverse(list) {\n  let prev = null;\n  return prev;\n}',
    '#include <stdio.h>\nint main() {\n  printf("hi");\n}',
    'import pygame\nscreen = pygame.display.set_mode((800, 600))'
  ]) assert.equal(looksLikeCode(code), true, code);
  for (const text of [
    'EMBLA와 ASKR의 차이는 다음과 같습니다.\n- 스케일: EMBLA는 35인치, ASKR는 멀티스케일입니다.\n- 가격: €2,550과 €3,200입니다.\n사양서 PDF 저장 버튼으로 저장해 보세요.',
    'If you play metal in drop C, the ASKR multiscale keeps the low string tight.\nFor a lighter neck, choose the slim profile:\n- Neck profile: slim C',
    'Die Konfiguration kostet €2.600 (ohne Steuern und Versand).\nWenn du Fretless möchtest, öffne „Griffbrett“.',
    '제작 문의서 초안\n- 연주 목적: 메탈, 드롭 C\n- 현재 사양: ASKR, 에보니 지판\n- 확인 요청: 제작 가능 여부와 납기'
  ]) assert.equal(looksLikeCode(text), false, text);
});

test('the router treats two named models as a comparison even with personal context', () => {
  assert.match(ROUTER_PROMPT, /names two or more RavenForge models/);
  assert.match(ROUTER_PROMPT, /"a bass for my girlfriend, EDDA or EMBLA\?" is model_comparison, not instrument_discovery/);
  assert.match(ROUTER_PROMPT, /without naming two or more models/);
});
