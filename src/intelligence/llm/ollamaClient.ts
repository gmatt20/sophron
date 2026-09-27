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

export { client as ollama };
