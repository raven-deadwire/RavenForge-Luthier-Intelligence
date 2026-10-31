// Adapt Responses to the existing bounded pricing conversation loop.
// Keys remain in the Worker; no automatic provider failover or retries.
export class OpenAIError extends Error {
  constructor(status) { super('OpenAI request failed'); this.status = status; }
}

export function createOpenAIClient(env, fetcher = fetch) {
  return { beta: { messages: { async create(params, { signal }) {
    const input = [];
    for (const message of params.messages) {
      if (typeof message.content === 'string') {
        input.push({ role: message.role, content: message.content });
        continue;
      }
      for (const block of message.content) {
        if (block.type === 'text') input.push({ role: message.role, content: block.text });
        if (block.type === 'openai_item') input.push(block.item);
        if (block.type === 'tool_use') input.push({ type: 'function_call', call_id: block.id, name: block.name, arguments: JSON.stringify(block.input) });
        if (block.type === 'tool_result') input.push({ type: 'function_call_output', call_id: block.tool_use_id, output: block.content });
      }
    }
    const response = await fetcher('https://api.openai.com/v1/responses', {
      method: 'POST', signal,
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-5-mini', store: false,
        include: ['reasoning.encrypted_content'],
        reasoning: { effort: env.OPENAI_EFFORT || 'low' },
        instructions: params.system.map(block => block.text).join('\n'), input,
        max_output_tokens: params.max_tokens,
        tools: params.tools.map(tool => ({ type: 'function', name: tool.name, description: tool.description, parameters: tool.input_schema, strict: tool.strict }))
      })
    });
    if (!response.ok) throw new OpenAIError(response.status);
    const result = await response.json();
    if (result.status !== 'completed' && result.status !== 'incomplete') throw new OpenAIError(502);
    const content = [];
    for (const item of result.output || []) {
      if (item.type === 'reasoning') content.push({ type: 'openai_item', item });
      if (item.type === 'function_call') {
        let args;
        try { args = JSON.parse(item.arguments); } catch { throw new OpenAIError(502); }
        content.push({ type: 'tool_use', id: item.call_id, name: item.name, input: args });
      }
      if (item.type === 'message') for (const block of item.content || []) {
        if (block.type === 'refusal') return { content: [], stop_reason: 'refusal', usage: result.usage };
        if (block.type === 'output_text') content.push({ type: 'text', text: block.text });
      }
    }
    return { content, usage: result.usage, stop_reason: result.status === 'incomplete' ? 'max_tokens' : content.some(block => block.type === 'tool_use') ? 'tool_use' : 'end_turn' };
  } } } };
}
