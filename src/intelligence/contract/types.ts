/**
 * Public integration contract for the Sophron intelligence layer.
 *
 * The Electron side depends ONLY on these types and on `reflect()`. It must not
 * need to know how reflection is orchestrated internally (QM, Ollama, vault),
 * so nothing provider-specific belongs in this file.
 */

/** What the user just said/wrote, transcribed upstream (mic/whisper are not ours). */
export interface ReflectionRequest {
  transcript: string;
  /** Absolute path to the vault the user selected; falls back to config when omitted. */
  vaultPath?: string;
}

/** A single relevant excerpt retrieved from the user's Markdown history. */
export interface PastThought {
  content: string;
  /** Vault-relative path or filename the excerpt came from. */
  source: string;
  /** ISO date if we could parse one from frontmatter or the file's mtime. */
  date?: string;
}

/** The only thing the Electron app receives back. */
export interface ReflectionResult {
  thought: PastThought;
  /** Exactly one Socratic question, ~40 words or fewer. */
  question: string;
}

/**
 * Optional context hooks for the Sponsor Engineer (Memorable / GBrain).
 * The core reflection path must work with this omitted.
 */
export interface ReflectionContext {
  proceduralMemory?: string[];
  externalContext?: string[];
}

/**
 * The orchestration boundary. The QM-backed implementation lives in
 * `orchestration/qmAdapter.ts`; the rest of the app codes against this
 * interface only.
 */
export interface AgentOrchestrator {
  reflect(request: ReflectionRequest, context?: ReflectionContext): Promise<ReflectionResult>;
}
