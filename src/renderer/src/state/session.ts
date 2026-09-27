import { create } from 'zustand';
import type {
  PastThought,
  ReflectionResult,
  SessionPhase,
  VaultInfo
} from '@shared/contracts';

interface SessionState {
  phase: SessionPhase;
  vault: VaultInfo | null;
  transcript: string;
  result: ReflectionResult | null;

  setPhase: (phase: SessionPhase) => void;
  setVault: (vault: VaultInfo | null) => void;
  setTranscript: (t: string) => void;
  setResult: (r: ReflectionResult | null) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  phase: { kind: 'idle' },
  vault: null,
  transcript: '',
  result: null,

  setPhase: (phase) => set({ phase }),
  setVault: (vault) => set({ vault }),
  setTranscript: (transcript) => set({ transcript }),
  setResult: (result) => set({ result }),
  reset: () => set({
    phase: { kind: 'idle' },
    transcript: '',
    result: null
  })
}));

export type { PastThought, ReflectionResult, SessionPhase, VaultInfo };
