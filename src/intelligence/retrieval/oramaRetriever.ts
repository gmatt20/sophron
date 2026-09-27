import { create, insertMultiple, search, type AnyOrama } from '@orama/orama';
import { config } from '../config.js';
import { embed } from '../llm/ollamaClient.js';
import type { VaultNote } from '../vault/vaultReader.js';
import type { NoteRetriever, RetrievedExcerpt } from './noteRetriever.js';

type RetrievalMode = 'keyword' | 'vector' | 'hybrid';

/** Our config mode -> Orama's search mode. */
const ORAMA_MODE = {
  keyword: 'fulltext',
  vector: 'vector',
  hybrid: 'hybrid',
} as const;

/** A mode uses semantic vectors unless it's purely lexical. */
function needsVectors(mode: RetrievalMode): boolean {
  return mode !== 'keyword';
}

/** Stable signature of a note set, so we only rebuild the index when it changes. */
function signatureOf(notes: VaultNote[], mode: RetrievalMode): string {
  return `${mode}::${notes.map((n) => `${n.path}@${n.modified}`).join('|')}`;
}

function excerptOf(content: string): string {
  const max = config.retrieval.maxExcerptChars;
  return content.length <= max ? content : `${content.slice(0, max).trimEnd()}…`;
}

interface CachedIndex {
  signature: string;
  db: AnyOrama;
}

/**
 * Retriever backed by Orama, which handles full-text (BM25), vector, and
 * hybrid ranking in-memory. Embeddings come from the local Ollama model.
 * The built index is cached and only rebuilt when the note set changes.
 */
export class OramaRetriever implements NoteRetriever {
  private cache: CachedIndex | null = null;

  constructor(private readonly mode: RetrievalMode = config.retrieval.mode) {}

  private async buildIndex(notes: VaultNote[]): Promise<AnyOrama> {
    const withVectors = needsVectors(this.mode);
    const vectors = withVectors ? await embed(notes.map((n) => n.content)) : [];
    const dim = vectors[0]?.length ?? 0;

    const db = create({
      schema: withVectors
        ? { content: 'string', source: 'string', date: 'string', embedding: `vector[${dim}]` }
        : { content: 'string', source: 'string', date: 'string' },
    });

    await insertMultiple(
      db,
      notes.map((note, i) => ({
        content: note.content,
        source: note.path,
        date: note.date,
        ...(withVectors ? { embedding: vectors[i] } : {}),
      })),
    );

    return db;
  }

  private async index(notes: VaultNote[]): Promise<AnyOrama> {
    const signature = signatureOf(notes, this.mode);
    if (this.cache?.signature === signature) return this.cache.db;
    const db = await this.buildIndex(notes);
    this.cache = { signature, db };
    return db;
  }

  async retrieve(
    query: string,
    notes: VaultNote[],
    topK: number = config.retrieval.topK,
  ): Promise<RetrievedExcerpt[]> {
    if (notes.length === 0) return [];
    const db = await this.index(notes);

    const vector = needsVectors(this.mode)
      ? { value: (await embed([query]))[0], property: 'embedding' }
      : undefined;

    const results = await search(db, {
      mode: ORAMA_MODE[this.mode],
      term: query,
      ...(vector ? { vector, similarity: 0 } : {}),
      // When hybrid is explicitly chosen, lean on semantics — lexical overlap
      // on common words otherwise produces false positives in reflection text.
      ...(this.mode === 'hybrid' ? { hybridWeights: { text: 0.3, vector: 0.7 } } : {}),
      limit: topK,
    });

    return results.hits.map((hit) => ({
      content: excerptOf(String(hit.document.content)),
      source: String(hit.document.source),
      date: hit.document.date ? String(hit.document.date) : undefined,
      score: hit.score,
    }));
  }
}

/** Build the configured retriever. Swap point if we ever replace Orama. */
export function createRetriever(mode: RetrievalMode = config.retrieval.mode): NoteRetriever {
  return new OramaRetriever(mode);
}
