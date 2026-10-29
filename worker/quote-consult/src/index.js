import Anthropic from '@anthropic-ai/sdk';
import { MODEL_IDS, priceConfiguration, priceWithChanges, sanitizeConfiguration } from './pricing.js';
import { PRICE_TOOL, SYSTEM_PROMPT } from './prompt.js';

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TOOL_ROUNDS = 6;
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
    if (message.content.length > MAX_MESSAGE_CHARS) {
      throw new RequestError(413, `messages[${index}] is longer than ${MAX_MESSAGE_CHARS} characters.`);
    }
  });
  if (messages.length % 2 === 0) throw new RequestError(400, 'The last turn must be from the user.');
  return {
    messages: messages.map(({ role, content }) => ({ role, content })),
    configuration: sanitizeConfiguration(body.configuration),
    language: LANGUAGES.includes(body.language) ? body.language : 'en'
  };
}

function runPriceTool(input, current) {
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
  return result;
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
  const currentQuote = configuration ? priceConfiguration(configuration) : null;

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
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: env.EFFORT || 'medium' },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    tools: [PRICE_TOOL]
  };
  // Server-side refusal fallback; Haiku has none.
  if (!model.startsWith('claude-haiku')) Object.assign(params, { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });

  let lastQuote = null;
  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await client.beta.messages.create({ ...params, messages: conversation });

    if (response.stop_reason === 'refusal') return { reply: FALLBACK_REPLY[language], quote: lastQuote, stop_reason: 'refusal' };

    if (response.stop_reason === 'tool_use') {
      const echoed = echoable(response.content);
      conversation.push({ role: 'assistant', content: echoed });
      // Answer only the tool calls that were echoed back, so every tool_result has its tool_use.
      const results = echoed.filter(block => block.type === 'tool_use').map(block => {
        if (block.name !== PRICE_TOOL.name) {
          return { type: 'tool_result', tool_use_id: block.id, content: `Unknown tool ${block.name}.`, is_error: true };
        }
        const result = runPriceTool(block.input, configuration);
        if (!result.error) lastQuote = result;
        return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result), is_error: Boolean(result.error) };
      });
      conversation.push({ role: 'user', content: results });
      continue;
    }

    const reply = response.content.filter(block => block.type === 'text').map(block => block.text).join('\n\n').trim();
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
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/chat') return json(404, { error: 'Not found.' });
    const cors = corsHeaders(request.headers.get('Origin'), env);
    if (!cors) return json(403, { error: 'Origin not allowed.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json(405, { error: 'Use POST.' }, cors);

    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
      if (!success) return json(429, { error: 'Too many messages. Please wait a minute.' }, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json(400, { error: 'Invalid JSON.' }, cors); }

    try {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      return json(200, await handleChat(body, env, client), cors);
    } catch (error) {
      if (error instanceof RequestError) return json(error.status, { error: error.message }, cors);
      if (error instanceof Anthropic.RateLimitError) return json(429, { error: 'The consultant is busy. Please try again shortly.' }, cors);
      if (error instanceof Anthropic.APIConnectionError) return json(502, { error: 'Could not reach the consultant. Please try again.' }, cors);
      if (error instanceof Anthropic.APIError) {
        console.error('Anthropic API error', error.status, error.message);
        return json(502, { error: 'The consultant is unavailable right now.' }, cors);
      }
      console.error(error);
      return json(500, { error: 'Unexpected error.' }, cors);
    }
  }
};
