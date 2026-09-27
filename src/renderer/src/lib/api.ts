import type { SophronApi } from '../../../preload';

/**
 * Thin re-export so components import from `@renderer/lib/api` rather than
 * reaching into `window.sophron` directly. Makes it trivial to swap for a
 * mock in Storybook / tests.
 *
 * When loaded outside Electron (e.g. plain browser preview), we fall back to
 * an in-memory mock so the UI is still fully drivable.
 */
export const api: SophronApi = window.sophron ?? createBrowserMock();

function createBrowserMock(): SophronApi {
  let vault: { path: string; name: string } | null = null;
  const CANNED = [
    {
      thought: {
        content: "I keep saying yes to work that flatters me and no to work that would change me.",
        source: 'Journal / 2025-08-14.md',
        date: '2025-08-14'
      },
      question: 'What would you build if being seen doing it well was not part of the reward?'
    },
    {
      thought: {
        content: 'Momentum is not the same as direction. I noticed this on the drive back from Ojai.',
        source: 'Fieldnotes / Ojai trip.md',
        date: '2025-06-02'
      },
      question: 'If you removed the pace from this project, what would you still want to keep doing tomorrow?'
    }
  ];
  let i = 0;
  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  return {
    app: { version: async () => '0.1.0-browser' },
    vault: {
      get: async () => vault,
      pick: async () => {
        vault = { path: '/Users/you/Vault', name: 'Vault' };
        return vault;
      }
    },
    transcription: {
      transcribe: async () => {
        await wait(700);
        return { transcript: 'I keep circling back to whether I should leave the current project.' };
      }
    },
    reflection: {
      reflect: async () => {
        await wait(1000);
        const pick = CANNED[i % CANNED.length]!;
        i += 1;
        return pick;
      }
    },
    models: {
      // No real Ollama outside Electron — return nothing so the picker hides.
      list: async () => [],
      get: async () => '',
      set: async (name: string) => name
    }
  };
}
