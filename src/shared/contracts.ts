/**
 * Shared contracts between the Electron main process, the preload bridge,
 * and the renderer. These are the ONLY types that cross the process boundary.
 *
 * Other engineers (Local Intelligence) implement these interfaces
 * without touching the desktop shell.
 */

export interface ReflectionRequest {
  transcript: string;
  vaultPath?: string;
}

export interface PastThought {
  content: string;
  source: string;
  date?: string;
}

export interface ReflectionResult {
  thought: PastThought;
  question: string;
}

export interface TranscriptionRequest {
  /** Raw audio bytes. WAV (PCM 16-bit, 16 kHz, mono) preferred. */
  audio: Uint8Array;
  mimeType: string;
}

export interface TranscriptionResult {
  transcript: string;
  durationMs?: number;
}

export interface VaultInfo {
  path: string;
  name: string;
}

/** Discriminated union for user-visible session phases. */
export type SessionPhase =
  | { kind: 'idle' }
  | { kind: 'listening' }
  | { kind: 'transcribing' }
  | { kind: 'searching' }
  | { kind: 'reflecting' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };
