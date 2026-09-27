import { Ollama } from 'ollama';
import { config } from '../config.js';

/**
 * Thin wrapper around the official Ollama client, pinned to our configured
 * host. All local-LLM access (embeddings now, generation in the reasoning
 * step) goes through here so the provider stays in one place.
 */
const client = new Ollama({ host: config.ollama.host });

/**
 * Embed one or more strings with the configured embedding model.
 * Returns one vector per input, in order.
 */
export async function embed(input: string[]): Promise<number[][]> {
  if (input.length === 0) return [];
  const res = await client.embed({ model: config.ollama.embeddingModel, input });
  return res.embeddings;
}

/**
 * Run the reasoning model with a system + user turn and return its text.
 * `num_predict` is capped low — the target output is a single short question.
 */
export async function generate(system: string, user: string): Promise<string> {
  const res = await client.chat({
    model: config.ollama.model,
    // Disable "thinking": these local models otherwise spend the whole token
    // budget in a reasoning field and return empty content. We want the answer.
    think: false,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    options: { temperature: config.ollama.temperature, num_predict: 200 },
    stream: false,
  });
  return res.message.content.trim();
}

export { client as ollama };
