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
  /** The recalled note, in socratic mode. Absent for a plain chat reply. */
  thought?: PastThought;
  /** The assistant's text: a Socratic question, or a normal reply in chat mode. */
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

/** One of the three voices Sophron can speak back in. */
export interface SpeechVoice {
  id: string;
  label: string;
  description: string;
}

/** Which backend is currently voicing replies, and the voices it offers. */
export interface SpeechInfo {
  /** 'fish' = local Fish Speech server, 'system' = macOS `say`, 'none' = unavailable. */
  backend: 'fish' | 'system' | 'none';
  voices: SpeechVoice[];
}

export interface SpeechRequest {
  text: string;
  voiceId: string;
}

export interface SpeechResult {
  /** Encoded audio, playable by the renderer as-is. */
  audio: Uint8Array;
  mimeType: string;
}
