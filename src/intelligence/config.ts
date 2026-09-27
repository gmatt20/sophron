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
    /** Model used to embed notes and queries for semantic retrieval. */
    embeddingModel: string;
    /** Low temperature keeps the Socratic question grounded. */
    temperature: number;
  };
  retrieval: {
    /** How the retriever ranks notes: lexical, semantic, or both. */
    mode: 'keyword' | 'vector' | 'hybrid';
    /** How many candidate notes to surface. */
    topK: number;
    /** Cap on excerpt length returned as a PastThought. */
    maxExcerptChars: number;
    /** Minimum top-hit score to accept a match; below this we ask for more. */
    minScore: number;
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
    embeddingModel: process.env.SOPHRON_EMBED_MODEL ?? 'nomic-embed-text',
    temperature: Number(process.env.SOPHRON_TEMPERATURE ?? 0.4),
  },
  retrieval: {
    mode:
      (process.env.SOPHRON_RETRIEVAL_MODE as IntelligenceConfig['retrieval']['mode']) ?? 'vector',
    topK: Number(process.env.SOPHRON_TOP_K ?? 4),
    maxExcerptChars: Number(process.env.SOPHRON_MAX_EXCERPT ?? 500),
    minScore: Number(process.env.SOPHRON_MIN_SCORE ?? 0.35),
  },
  socratic: {
    maxWords: Number(process.env.SOPHRON_MAX_WORDS ?? 40),
  },
};
