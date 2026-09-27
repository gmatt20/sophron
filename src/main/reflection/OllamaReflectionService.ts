import type { ReflectionRequest, ReflectionResult } from '@shared/contracts';
import type { ReflectionService } from './ReflectionService';
import { reflect } from '../../intelligence/reflection/reflectionService.js';
import { createSponsorServices, type ReflectionMoment } from '../../sponsors/index.js';

/**
 * Real reflection backend. Bridges the desktop shell's ReflectionService to
 * the local intelligence layer (vault retrieval + Ollama reasoning) and
 * optionally enriches it with sponsor context.
 *
 * Everything about retrieval, embeddings, prompting, and (later) QM lives
 * behind `reflect()`; this class only maps types and gathers optional context.
 */
export class OllamaReflectionService implements ReflectionService {
  readonly name = 'ollama';

  private readonly sponsors = createSponsorServices({
    enableMemorable: process.env.SOPHRON_ENABLE_MEMORABLE === '1',
    gbrainToken: process.env.GBRAIN_MCP_TOKEN,
  });

  async reflect(request: ReflectionRequest): Promise<ReflectionResult> {
    const context = await this.gatherContext(request.transcript);
    return reflect({ transcript: request.transcript, vaultPath: request.vaultPath }, context);
  }

  /**
   * Best-effort, non-fatal sponsor context. Both providers no-op (return [])
   * when not enabled or on any error, so the core reflection path never
   * depends on them. Only a coarse, non-transcript signal is sent outward.
   */
  private async gatherContext(
    transcript: string,
  ): Promise<{ proceduralMemory: string[]; externalContext: string[] }> {
    const moment = classifyMoment(transcript);
    try {
      const [proceduralMemory, externalContext] = await Promise.all([
        this.sponsors.proceduralMemory.recall(moment),
        this.sponsors.externalContext.getRelevantContext(topicForMoment(moment)),
      ]);
      return { proceduralMemory, externalContext };
    } catch {
      return { proceduralMemory: [], externalContext: [] };
    }
  }
}

/**
 * Map a transcript to a predefined reflection moment. Deliberately coarse and
 * local — this label (never the transcript) is the only thing shared with
 * sponsor providers.
 */
function classifyMoment(transcript: string): ReflectionMoment {
  const s = transcript.toLowerCase();
  if (/\b(should i|what should|advice|recommend|worth it)\b/.test(s)) return 'asking-for-advice';
  if (/\b(stuck|can't|cannot|impossible|overwhelmed|no idea)\b/.test(s)) return 'feeling-stuck';
  if (/\b(again|keep|always|every time|habit|pattern)\b/.test(s)) return 'repeated-pattern';
  if (/\b(used to|i thought|i believed|i realize|turns out)\b/.test(s)) return 'revisiting-belief';
  if (/\b(ready|going to|plan to|next step|start)\b/.test(s)) return 'ready-to-act';
  return 'exploring';
}

/** A short, category-level topic (not the transcript) for external context lookups. */
function topicForMoment(moment: ReflectionMoment): string {
  switch (moment) {
    case 'asking-for-advice':
      return 'decisions and priorities';
    case 'feeling-stuck':
      return 'current challenges';
    case 'repeated-pattern':
      return 'recurring habits';
    case 'revisiting-belief':
      return 'changing views';
    case 'ready-to-act':
      return 'upcoming plans';
    default:
      return 'recent focus';
  }
}
