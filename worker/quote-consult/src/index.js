import Anthropic from '@anthropic-ai/sdk';
import { createOpenAIClient, OpenAIError } from './openai-client.js';
import { priceConfiguration, priceWithChanges, sanitizeConfiguration, withPageNames } from './pricing.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { FIXED_REPLY, PRICED_TASKS, ROUTER_PROMPT, ROUTE_TOOL, looksLikeCode, parseRoute, quoteOnlyReply } from './scope.js';
import { eurKrwRate, krwReference } from './exchange-rate.js';

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 2000;
const MAX_REPLY_CHARS = 6000;
const MAX_HISTORY_CHARS = 20000;
const MAX_BODY_BYTES = 128 * 1024;
const ROUTE_OUTPUT_TOKENS = 2048;
const MAX_OUTPUT_TOKENS = 4096;
const MAX_REQUEST_OUTPUT_TOKENS = 8192;
const REQUEST_TIMEOUT_MS = 90000;
export const BUILD_VERSION = '20261123-scope-gate-1';
const LANGUAGES = ['en', 'de', 'ko'];

export class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// The page keeps the conversation as plain text turns and sends it back each time.
function parseRequest(body) {
  if (!body || typeof body !== 'object') throw new RequestError(400, 'Expected a JSON object.');
  const { messages } = body;
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES) {
    throw new RequestError(400, `messages must hold 1–${MAX_MESSAGES} turns.`);
  }
  messages.forEach((message, index) => {
    const role = index % 2 === 0 ? 'user' : 'assistant';
    if (message?.role !== role || typeof message.content !== 'string' || !message.content.trim()) {
      throw new RequestError(400, `messages[${index}] must be a non-empty ${role} turn.`);
    }
    const limit = role === 'user' ? MAX_MESSAGE_CHARS : MAX_REPLY_CHARS;
    if (message.content.length > limit) {
      throw new RequestError(413, `messages[${index}] is longer than ${limit} characters.`);
    }
  });
  if (messages.reduce((total, message) => total + message.content.length, 0) > MAX_HISTORY_CHARS) {
    throw new RequestError(413, 'Conversation is too long. Start a new conversation.');
  }
  if (body.configuration != null && !sanitizeConfiguration(body.configuration)) throw new RequestError(400, 'Unknown configuration model.');
  if (messages.length % 2 === 0) throw new RequestError(400, 'The last turn must be from the user.');
  return {
    messages: messages.map(({ role, content }) => ({ role, content })),
    configuration: sanitizeConfiguration(body.configuration),
    // The configuration priced in the previous answer, so "and with the gigbag?" continues from it.
    previous: sanitizeConfiguration(body.previous_quote),
    language: LANGUAGES.includes(body.language) ? body.language : 'en'
  };
}

const extrasOf = quote => ({
  instrument_options: quote.lines.filter(line => line.category === 'instrument_options').map(line => line.option),
  accessories: quote.lines.filter(line => line.category === 'accessories').map(line => line.option)
});

// Prices one configuration the router asked for. Only catalog ids survive priceWithChanges.
function priceRouted(entry, current, previous, language) {
  const named = { current, previous }[entry.start_from];
  const start = named?.model === entry.model ? named : { model: entry.model, selections: {}, specialOptions: [], accessories: [] };
  const result = priceWithChanges(start, {
    changes: entry.changes,
    instrumentOptions: entry.instrument_options ?? undefined,
    accessories: entry.accessories ?? undefined
  });
  if (result.error) return null;
  if (entry.start_from !== 'standard' && start !== named) result.note = `No ${entry.start_from} configuration for this model; priced from the standard build.`;
  return withPageNames(result, language);
}

// Every request takes the same path:
//   1. route: one model call that may only return a task and catalog ids (ROUTE_TOOL);
//   2. the server validates that answer, refuses or narrows without another model call,
//      and computes every price itself;
//   3. answer: one model call without tools writes the text for the chosen task from
//      the server's brief; output that looks like code is discarded.
// A computed quote is returned even when its explanation fails.
export async function handleChat(body, env, client, { rateOptions } = {}) {
  const { messages, configuration, previous, language } = parseRequest(body);
  // Korean visitors get a KRW reference next to the EUR estimate. Fetched alongside the
  // model calls; a missing key or failed lookup leaves it out without affecting the reply.
  const ratePromise = language === 'ko' ? eurKrwRate(env, rateOptions) : Promise.resolve(null);
  let answerCalls = 0;
  const finish = async result => {
    const krw = krwReference(result.quote, await ratePromise);
    return { ...result, answer_calls: answerCalls, ...(krw ? { krw_reference: krw } : {}) };
  };
  const fixed = (kind, task, stopReason = kind) => finish({ reply: FIXED_REPLY[kind][language], quote: null, task, stop_reason: stopReason });

  const model = env.MODEL || 'claude-opus-5-5';
  const currentQuote = configuration ? withPageNames(priceConfiguration(configuration), language) : null;
  const previousQuote = previous ? withPageNames(priceConfiguration(previous), language) : null;
  const state = {
    page_language: language,
    current_configuration: currentQuote ? { ...currentQuote, ...extrasOf(currentQuote) } : null,
    previous_quote: previousQuote ? { ...previousQuote, ...extrasOf(previousQuote) } : null
  };
  const stateText = `<configurator_state>\n${JSON.stringify(state)}\n</configurator_state>`;
  const history = messages.slice(0, -1);
  const latest = messages.at(-1).content;
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  // 1. Route. Earlier turns only resolve references; the latest turn is what gets classified.
  const routed = await client.beta.messages.create({
    model,
    max_tokens: ROUTE_OUTPUT_TOKENS,
    system: [{ type: 'text', text: ROUTER_PROMPT, cache_control: { type: 'ephemeral' } }],
    tools: [ROUTE_TOOL],
    tool_choice: { type: 'tool', name: ROUTE_TOOL.name },
    messages: [...history, { role: 'user', content: [{ type: 'text', text: stateText }, { type: 'text', text: latest }] }]
  }, { signal });
  const remainingTokens = MAX_REQUEST_OUTPUT_TOKENS - Math.min(ROUTE_OUTPUT_TOKENS, Math.max(0, routed.usage?.output_tokens ?? ROUTE_OUTPUT_TOKENS));
  if (routed.stop_reason === 'refusal') return fixed('out_of_scope', 'out_of_scope', 'refusal');
  const call = routed.content?.find(block => block.type === 'tool_use' && block.name === ROUTE_TOOL.name);
  const route = parseRoute(call?.input);
  // A failed or malformed classification never falls through to free generation.
  if (!route) return fixed('clarify', 'clarify', 'route_invalid');

  // 2. Gate and price.
  if (route.task === 'out_of_scope') return fixed('out_of_scope', 'out_of_scope');
  if (route.task === 'clarify') return fixed('clarify', 'clarify');
  let quotes = [];
  if (PRICED_TASKS.includes(route.task)) {
    quotes = route.configurations.map(entry => priceRouted(entry, configuration, previous, language)).filter(Boolean);
    if (!quotes.length && route.task === 'quote' && currentQuote) quotes = [currentQuote];
    if (!quotes.length) return fixed('clarify', route.task, 'clarify');
  }
  const quote = quotes.at(-1) ?? (route.task === 'enquiry_draft' ? currentQuote : null);
  const degrade = stopReason => (quote
    ? finish({ reply: quoteOnlyReply(quote, language), quote, task: route.task, stop_reason: stopReason })
    : null);

  // 3. Answer. With an out-of-scope part, the customer's words are not passed on at all:
  // the answer model sees only the server's brief for the consultation task.
  const brief = {
    task: route.task,
    page_language: language,
    out_of_scope_part: route.out_of_scope_part,
    quotes: quotes.map(entry => ({ ...entry, ...extrasOf(entry) })),
    current_configuration: state.current_configuration,
    previous_quote: state.previous_quote
  };
  const briefText = `<consultation_brief>\n${JSON.stringify(brief)}\n</consultation_brief>`;
  const conversation = route.out_of_scope_part
    ? [{ role: 'user', content: [{ type: 'text', text: briefText }, { type: 'text', text: `Write the reply for the ${route.task} task in the page language.` }] }]
    : [...history, { role: 'user', content: [{ type: 'text', text: briefText }, { type: 'text', text: latest }] }];
  const params = {
    model,
    max_tokens: Math.min(MAX_OUTPUT_TOKENS, remainingTokens),
    thinking: { type: 'adaptive' },
    output_config: { effort: env.EFFORT || 'medium' },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: conversation
  };
  // Server-side refusal fallback; Haiku has none.
  if (!model.startsWith('claude-haiku')) Object.assign(params, { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });

  let response;
  answerCalls = 1;
  try {
    response = await client.beta.messages.create(params, { signal });
  } catch (error) {
    const degraded = degrade('answer_unavailable');
    if (degraded) return degraded;
    throw error;
  }
  if (response.stop_reason === 'refusal') {
    return finish({ reply: FIXED_REPLY.refusal[language], quote, task: route.task, stop_reason: 'refusal' });
  }
  const reply = (response.content || []).filter(block => block.type === 'text').map(block => block.text).join('\n\n').trim();
  if (reply && looksLikeCode(reply)) return degrade('filtered') ?? fixed('out_of_scope', route.task, 'filtered');
  if (response.stop_reason === 'max_tokens' || reply.length > MAX_REPLY_CHARS) {
    const degraded = degrade('answer_too_long');
    if (degraded) return degraded;
    throw new RequestError(502, 'The consultant reached its response limit. Please ask a shorter question.');
  }
  if (!reply) return degrade('answer_empty') ?? fixed('refusal', route.task, 'answer_empty');
  return finish({ reply, quote, task: route.task, stop_reason: response.stop_reason });
}

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(entry => entry.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

const json = (status, payload, headers = {}) => new Response(JSON.stringify(payload), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-RavenForge-Version': BUILD_VERSION, ...headers }
});

// Bound the stream before parsing; Content-Length alone can be omitted or forged.
async function readBody(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) throw new RequestError(413, 'Request is too large.');
  if (!request.body) throw new RequestError(400, 'Expected JSON.');
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestError(413, 'Request is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new RequestError(400, 'Invalid JSON.'); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/chat') return json(404, { error: 'Not found.' });
    const cors = corsHeaders(request.headers.get('Origin'), env);
    if (!cors) return json(403, { error: 'Origin not allowed.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json(405, { error: 'Use POST.' }, cors);

    const provider = env.AI_PROVIDER || 'anthropic';
    if (!['anthropic', 'openai'].includes(provider) || !env.RATE_LIMITER || !(provider === 'openai' ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY)) return json(503, { error: 'The consultant is not configured.' }, cors);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return json(415, { error: 'Use application/json.' }, cors);

    try {
      const { success } = await env.RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
      if (!success) return json(429, { error: 'Too many messages. Please wait a minute.' }, { ...cors, 'Retry-After': '60' });
      const body = await readBody(request);
      const client = provider === 'openai' ? createOpenAIClient(env) : new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: REQUEST_TIMEOUT_MS });
      return json(200, await handleChat(body, env, client), cors);
    } catch (error) {
      if (error instanceof RequestError) return json(error.status, { error: error.message }, cors);
      if (error instanceof OpenAIError) return json(error.status === 429 ? 429 : 502, { error: 'The consultant is unavailable right now. Please try again later.' }, cors);
      if (error instanceof Anthropic.RateLimitError) return json(429, { error: 'The consultant is busy. Please try again shortly.' }, cors);
      if (error instanceof Anthropic.APIConnectionError) return json(502, { error: 'Could not reach the consultant. Please try again.' }, cors);
      if (error instanceof Anthropic.APIError) {
        console.error('Anthropic API error', error.status);
        return json(502, { error: 'The consultant is unavailable right now.' }, cors);
      }
      console.error('Consultation failed', error?.name || 'Error');
      return json(500, { error: 'Unexpected error.' }, cors);
    }
  }
};
