import { resolve } from 'node:path';

/**
 * Single source of truth for everything configurable in the intelligence layer.
 * The Ollama model in particular lives here and nowhere else, per the brief.
 * Every field can be overridden by an environment variable so the Electron
 * shell (or a demo run) can point at a real vault without code changes.
 */
export interface IntelligenceConfig {
  /** Absolute path to the Obsidian / Markdown vault. Never written to. */
  vaultPath: string;
  ollama: {
    /** Base URL of the local Ollama server. */
    host: string;
    /** The one place the reasoning model is chosen. */
    model: string;
    /** Low temperature keeps the Socratic question grounded. */
    temperature: number;
  };
  retrieval: {
    /** How many candidate notes to surface. */
    topK: number;
    /** Cap on excerpt length returned as a PastThought. */
    maxExcerptChars: number;
  };
  socratic: {
    /** Hard word ceiling for the final question. */
    maxWords: number;
  };
}

export const config: IntelligenceConfig = {
  vaultPath: process.env.SOPHRON_VAULT_PATH ?? resolve(process.cwd(), 'sample-vault'),
  ollama: {
    host: process.env.OLLAMA_HOST ?? 'http://localhost:11434',
    model: process.env.SOPHRON_MODEL ?? 'gemma4:26b-mlx',
    temperature: Number(process.env.SOPHRON_TEMPERATURE ?? 0.4),
  },
  retrieval: {
    topK: Number(process.env.SOPHRON_TOP_K ?? 4),
    maxExcerptChars: Number(process.env.SOPHRON_MAX_EXCERPT ?? 500),
  },
  socratic: {
    maxWords: Number(process.env.SOPHRON_MAX_WORDS ?? 40),
  },
};
