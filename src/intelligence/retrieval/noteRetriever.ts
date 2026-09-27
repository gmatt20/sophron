import type { VaultNote } from '../vault/vaultReader.js';

/** A ranked, relevant slice of a past note. Maps cleanly onto PastThought. */
export interface RetrievedExcerpt {
  /** The excerpt text (may be a window of the note, capped by config). */
  content: string;
  /** Vault-relative source path. */
  source: string;
  /** Best-effort ISO date carried through from the note. */
  date?: string;
  /** Retriever score; higher is more relevant. Scale is retriever-specific. */
  score: number;
}

/**
 * The retrieval boundary. The orchestrator depends only on this, so the
 * ranking implementation (Orama today, something else later) can change
 * without touching the reflection workflow.
 */
export interface NoteRetriever {
  retrieve(query: string, notes: VaultNote[], topK?: number): Promise<RetrievedExcerpt[]>;
}
