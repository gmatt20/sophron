import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SpeechInfo } from '@shared/contracts';

interface VoiceState {
  /** Read each new question aloud. */
  enabled: boolean;
  voiceId: string;
  /** What the main process can speak with right now; null until probed. */
  info: SpeechInfo | null;
  /** Id of the turn whose question is playing, if any. */
  speakingId: string | null;

  setEnabled: (enabled: boolean) => void;
  setVoiceId: (voiceId: string) => void;
  setInfo: (info: SpeechInfo) => void;
  setSpeakingId: (id: string | null) => void;
}

export const useVoice = create<VoiceState>()(
  persist(
    (set) => ({
      // Off by default — Sophron only speaks when the user enables voice.
      enabled: false,
      voiceId: 'warm',
      info: null,
      speakingId: null,

      setEnabled: (enabled) => set({ enabled }),
      setVoiceId: (voiceId) => set({ voiceId }),
      setInfo: (info) => set({ info }),
      setSpeakingId: (speakingId) => set({ speakingId })
    }),
    {
      name: 'sophron-voice-v2',
      partialize: (s) => ({ enabled: s.enabled, voiceId: s.voiceId })
    }
  )
);
