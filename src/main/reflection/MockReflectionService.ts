import type {
  ReflectionRequest,
  ReflectionResult,
  PastThought
} from '@shared/contracts';
import type { ReflectionService } from './ReflectionService';

const CANNED: Array<{ thought: PastThought; question: string }> = [
  {
    thought: {
      content:
        "I keep saying yes to work that flatters me and no to work that would change me. That's the whole pattern.",
      source: 'Journal / 2025-08-14.md',
      date: '2025-08-14'
    },
    question: 'What would you build if being seen doing it well was not part of the reward?'
  },
  {
    thought: {
      content:
        'Momentum is not the same as direction. I noticed this on the drive back from Ojai.',
      source: 'Fieldnotes / Ojai trip.md',
      date: '2025-06-02'
    },
    question: 'If you removed the pace from this project, what would you still want to keep doing tomorrow?'
  },
  {
    thought: {
      content:
        'The version of me that started this thing wanted to prove something. The version of me now already knows the answer.',
      source: 'Journal / 2025-03-30.md',
      date: '2025-03-30'
    },
    question: 'What would you decide if you no longer needed to prove anything?'
  }
];

/**
 * Non-intelligent placeholder. Rotates through pre-written pairs so the
 * desktop shell can be demoed on its own. The Local Intelligence engineer
 * replaces this with the real retrieval + Ollama pipeline.
 */
export class MockReflectionService implements ReflectionService {
  readonly name = 'mock';
  private i = 0;

  async reflect(_req: ReflectionRequest): Promise<ReflectionResult> {
    await new Promise((r) => setTimeout(r, 1400));
    const pick = CANNED[this.i % CANNED.length]!;
    this.i += 1;
    return pick;
  }
}
