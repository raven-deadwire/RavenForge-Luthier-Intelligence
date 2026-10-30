import Anthropic from '@anthropic-ai/sdk';
import { MODEL_IDS, priceConfiguration, priceWithChanges, sanitizeConfiguration, withPageNames } from './pricing.js';
import { PRICE_TOOL, SYSTEM_PROMPT } from './prompt.js';

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 2000;
const MAX_REPLY_CHARS = 6000;
const MAX_HISTORY_CHARS = 20000;
const MAX_BODY_BYTES = 128 * 1024;
const MAX_TOOL_ROUNDS = 4;
const MAX_TOOL_CALLS = 8;
const MAX_OUTPUT_TOKENS = 4096;
const MAX_REQUEST_OUTPUT_TOKENS = 8192;
const REQUEST_TIMEOUT_MS = 90000;
export const BUILD_VERSION = '20261030-quote-review-1';
const LANGUAGES = ['en', 'de', 'ko'];

const FALLBACK_REPLY = {
  en: 'Sorry, I can\'t help with that here. Please contact RavenForge directly.',
  de: 'Dabei kann ich hier leider nicht helfen. Bitte wende dich direkt an RavenForge.',
  ko: '죄송하지만 이 부분은 여기서 도와드리기 어렵습니다. RavenForge에 직접 문의해 주세요.'
};

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
    language: LANGUAGES.includes(body.language) ? body.language : 'en'
  };
}

function runPriceTool(input, current, language) {
  if (!input || typeof input !== 'object') return { error: 'Invalid tool input.' };
  if (!MODEL_IDS.includes(input.model)) return { error: `Unknown model ${input.model}.` };
  const start = input.start_from === 'current' && current?.model === input.model
    ? current
    : { model: input.model, selections: {}, specialOptions: [], accessories: [] };
  const result = priceWithChanges(start, {
    changes: input.changes,
    instrumentOptions: input.instrument_options,
    accessories: input.accessories
  });
  if (input.start_from === 'current' && start !== current) result.note = 'No current configuration for this model; priced from the standard build.';
  return withPageNames(result, language);
}

// After a mid-output fallback, blocks of the declined attempt before the last
// fallback marker must not be echoed back (non-streaming responses omit them anyway).
function echoable(content) {
  const boundary = content.findLastIndex(block => block.type === 'fallback');
  return content.filter((block, index) =>
    index > boundary || !['thinking', 'redacted_thinking', 'tool_use', 'server_tool_use'].includes(block.type));
}

export async function handleChat(body, env, client) {
  const { messages, configuration, language } = parseRequest(body);
  const model = env.MODEL || 'claude-opus-5-5';
  const currentQuote = configuration ? withPageNames(priceConfiguration(configuration), language) : null;

  // The configurator state rides along with the newest user turn only.
  const state = { page_language: language, current_configuration: currentQuote
    ? { ...currentQuote, instrument_options: configuration.specialOptions, accessories: configuration.accessories }
    : null };
  const last = messages.pop();
  const conversation = [...messages, {
    role: 'user',
    content: [
      { type: 'text', text: `<configurator_state>\n${JSON.stringify(state)}\n</configurator_state>` },
      { type: 'text', text: last.content }
    ]
  }];

  const params = {
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    thinking: { type: 'adaptive' },
    output_config: { effort: env.EFFORT || 'medium' },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    tools: [PRICE_TOOL]
  };
  // Server-side refusal fallback; Haiku has none.
  if (!model.startsWith('claude-haiku')) Object.assign(params, { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });

  let lastQuote = null;
  let remainingTokens = MAX_REQUEST_OUTPUT_TOKENS;
  let toolCalls = 0;
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    if (remainingTokens <= 0) throw new RequestError(502, 'The consultant reached its response limit.');
    const requestedTokens = Math.min(MAX_OUTPUT_TOKENS, remainingTokens);
    const response = await client.beta.messages.create({ ...params, max_tokens: requestedTokens, messages: conversation }, { signal });
    remainingTokens -= Math.min(requestedTokens, Math.max(0, response.usage?.output_tokens ?? requestedTokens));
    if (response.stop_reason === 'max_tokens') throw new RequestError(502, 'The consultant reached its response limit. Please ask a shorter question.');

    if (response.stop_reason === 'refusal') return { reply: FALLBACK_REPLY[language], quote: lastQuote, stop_reason: 'refusal' };

    if (response.stop_reason === 'tool_use') {
      const echoed = echoable(response.content);
      conversation.push({ role: 'assistant', content: echoed });
      // Answer only the tool calls that were echoed back, so every tool_result has its tool_use.
      const calls = echoed.filter(block => block.type === 'tool_use');
      toolCalls += calls.length;
      if (!calls.length || toolCalls > MAX_TOOL_CALLS) throw new RequestError(502, 'Too many quote comparisons in one request.');
      const results = calls.map(block => {
        if (block.name !== PRICE_TOOL.name) {
          return { type: 'tool_result', tool_use_id: block.id, content: `Unknown tool ${block.name}.`, is_error: true };
        }
        const result = runPriceTool(block.input, configuration, language);
        if (!result.error) lastQuote = result;
        return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result), is_error: Boolean(result.error) };
      });
      conversation.push({ role: 'user', content: results });
      continue;
    }

    const reply = response.content.filter(block => block.type === 'text').map(block => block.text).join('\n\n').trim();
    if (reply.length > MAX_REPLY_CHARS) throw new RequestError(502, 'The answer is too long. Please ask a shorter question.');
    return { reply: reply || FALLBACK_REPLY[language], quote: lastQuote, stop_reason: response.stop_reason };
  }
  throw new RequestError(502, 'The consultant did not finish its answer.');
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

    if (!env.RATE_LIMITER || !env.ANTHROPIC_API_KEY) return json(503, { error: 'The consultant is not configured.' }, cors);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return json(415, { error: 'Use application/json.' }, cors);

    try {
      const { success } = await env.RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
      if (!success) return json(429, { error: 'Too many messages. Please wait a minute.' }, { ...cors, 'Retry-After': '60' });
      const body = await readBody(request);
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: REQUEST_TIMEOUT_MS });
      return json(200, await handleChat(body, env, client), cors);
    } catch (error) {
      if (error instanceof RequestError) return json(error.status, { error: error.message }, cors);
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
