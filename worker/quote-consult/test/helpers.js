// Messages-shaped fakes for handleChat: the first call is the routing step, the second the answer.
export function fakeClient(responses) {
  const requests = [];
  return {
    requests,
    beta: { messages: { create: async (params, options) => {
      requests.push({ ...structuredClone(params), signal: options?.signal });
      const next = responses.shift();
      if (next instanceof Error) throw next;
      if (!next) throw new Error('unexpected model call');
      return next;
    } } }
  };
}

export const config = (model, extra = {}) => ({ model, start_from: 'standard', changes: [], instrument_options: null, accessories: null, ...extra });

export const route = (task, extra = {}) => ({
  stop_reason: 'tool_use',
  usage: { output_tokens: 60 },
  content: [{ type: 'tool_use', id: 'route_1', name: 'route_request', input: { task, out_of_scope_part: false, configurations: [], ...extra } }]
});

export const answer = text => ({ stop_reason: 'end_turn', usage: { output_tokens: 120 }, content: [{ type: 'text', text }] });

// Everything a model call was given, as one string: system prompt, messages and tools.
export const sent = request => JSON.stringify({ system: request.system, messages: request.messages, tools: request.tools });
