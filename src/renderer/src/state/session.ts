import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PastThought,
  ReflectionResult,
  SessionPhase,
  VaultInfo
} from '@shared/contracts';

/** One exchange: what you said, the thought Sophron recalled, and its question. */
export interface Turn {
  id: string;
  said: string;
  via: 'voice' | 'text';
  /** The recalled note, in socratic mode. Absent for a plain chat reply. */
  thought?: PastThought;
  question: string;
  at: number;
}

export type ReflectMode = 'chat' | 'socratic';

/** A journal entry is a conversation: a titled run of turns. */
export interface Entry {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  turns: Turn[];
}

interface SessionState {
  phase: SessionPhase;
  vault: VaultInfo | null;
  /** Whether replies are plain chat or Socratic recall. */
  mode: ReflectMode;
  /** What the user said for the turn currently in flight, once known. */
  pending: string | null;

  entries: Entry[];
  /** null means a fresh, unsaved page. */
  activeId: string | null;

  setPhase: (phase: SessionPhase) => void;
  setVault: (vault: VaultInfo | null) => void;
  setMode: (mode: ReflectMode) => void;
  setPending: (said: string | null) => void;
  addTurn: (turn: Omit<Turn, 'id' | 'at'>) => void;
  newEntry: () => void;
  selectEntry: (id: string) => void;
  deleteEntry: (id: string) => void;
}

const uid = () => crypto.randomUUID();

const titleFrom = (said: string) => {
  const clean = said.trim().replace(/\s+/g, ' ');
  return clean.length > 48 ? `${clean.slice(0, 47).trimEnd()}…` : clean;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      phase: { kind: 'idle' },
      vault: null,
      mode: 'chat',
      pending: null,
      entries: [],
      activeId: null,

      setPhase: (phase) => set({ phase }),
      setVault: (vault) => set({ vault }),
      setMode: (mode) => set({ mode }),
      setPending: (pending) => set({ pending }),

      addTurn: (partial) =>
        set((s) => {
          const now = Date.now();
          const turn: Turn = { ...partial, id: uid(), at: now };
          const current = s.entries.find((e) => e.id === s.activeId);
          if (!current) {
            const entry: Entry = {
              id: uid(),
              title: titleFrom(turn.said),
              createdAt: now,
              updatedAt: now,
              turns: [turn]
            };
            return { entries: [entry, ...s.entries], activeId: entry.id };
          }
          const updated = { ...current, updatedAt: now, turns: [...current.turns, turn] };
          return {
            entries: [updated, ...s.entries.filter((e) => e.id !== current.id)]
          };
        }),

      newEntry: () => set({ activeId: null, pending: null, phase: { kind: 'idle' } }),
      selectEntry: (activeId) => set({ activeId, pending: null, phase: { kind: 'idle' } }),
      deleteEntry: (id) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
          activeId: s.activeId === id ? null : s.activeId
        }))
    }),
    {
      name: 'sophron-journal',
      version: 1,
      partialize: (s) => ({ entries: s.entries, activeId: s.activeId, mode: s.mode })
    }
  )
);

export type { PastThought, ReflectionResult, SessionPhase, VaultInfo };
