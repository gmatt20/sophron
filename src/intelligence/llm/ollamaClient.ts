import { Ollama } from 'ollama';
import { config } from '../config.js';

/**
 * Thin wrapper around the official Ollama client, pinned to our configured
 * host. All local-LLM access (embeddings now, generation in the reasoning
 * step) goes through here so the provider stays in one place.
 */
const client = new Ollama({ host: config.ollama.host });

/** Runtime model override chosen in the UI; wins over env and auto-detect. */
let selectedModel: string | undefined;
/** Cached auto-detected default so we only hit /api/tags once. */
let autoModel: string | undefined;

/** List installed chat models (embedding models filtered out). */
export async function listChatModels(): Promise<string[]> {
  try {
    const { models } = await client.list();
    return models.map((m) => m.name).filter((n) => !/embed/i.test(n));
  } catch {
    return [];
  }
}

/**
 * Resolve which chat model to use: explicit UI selection, then SOPHRON_MODEL,
 * then the first installed non-embedding model (preferring a general model over
 * a "coder" one), then the configured fallback.
 */
export async function getModel(): Promise<string> {
  if (selectedModel) return selectedModel;
  if (process.env.SOPHRON_MODEL) return process.env.SOPHRON_MODEL;
  if (autoModel) return autoModel;

  const chat = await listChatModels();
  autoModel = chat.find((n) => !/coder/i.test(n)) ?? chat[0] ?? config.ollama.model;
  return autoModel;
}

/** Set the active chat model (from the UI picker). Empty string clears it. */
export function setModel(name: string): void {
  selectedModel = name.trim() || undefined;
}

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
    model: await getModel(),
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
