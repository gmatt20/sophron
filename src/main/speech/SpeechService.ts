import type { SpeechRequest, SpeechResult, SpeechVoice } from '@shared/contracts';

/**
 * Contract for any text-to-speech backend.
 *
 * Implementations live in this folder. The rest of the app must depend on
 * this interface only — never on the concrete backend.
 */
export interface SpeechService {
  readonly name: 'fish' | 'system';
  /** Whether the backend can speak right now (e.g. the Fish server is up). */
  available(): Promise<boolean>;
  synthesize(request: SpeechRequest): Promise<SpeechResult>;
}

/** Slot-level identity of a voice, independent of which backend renders it. */
export interface VoiceSlot extends SpeechVoice {
  /** Fish Speech reference id: a folder under the server's `references/`. */
  fishReferenceId: string;
  /** macOS `say` voice used when Fish is unavailable. */
  systemVoice: string;
}

/**
 * The three voices Sophron offers. Each Fish reference id can be overridden
 * with SOPHRON_FISH_VOICE_1..3 to point at voices you've already cloned.
 */
export const VOICE_SLOTS: VoiceSlot[] = [
  {
    id: 'warm',
    label: 'Warm',
    description: 'Unhurried and close, like a friend across the table',
    fishReferenceId: process.env['SOPHRON_FISH_VOICE_1'] ?? 'sophron-warm',
    systemVoice: 'Samantha'
  },
  {
    id: 'steady',
    label: 'Steady',
    description: 'Low and even, a measured tutor',
    fishReferenceId: process.env['SOPHRON_FISH_VOICE_2'] ?? 'sophron-steady',
    systemVoice: 'Daniel'
  },
  {
    id: 'bright',
    label: 'Bright',
    description: 'Light and curious, quick to the point',
    fishReferenceId: process.env['SOPHRON_FISH_VOICE_3'] ?? 'sophron-bright',
    systemVoice: 'Karen'
  }
];

export function voiceSlot(id: string): VoiceSlot {
  return VOICE_SLOTS.find((v) => v.id === id) ?? VOICE_SLOTS[0]!;
}
