import { config } from '../config.js';
import type {
  AgentOrchestrator,
  PastThought,
  ReflectionContext,
  ReflectionRequest,
  ReflectionResult,
} from '../contract/types.js';
import { generate } from '../llm/ollamaClient.js';
import { REFLECT_SYSTEM_PROMPT, buildReflectionUserMessage } from '../llm/prompts.js';
import { createRetriever } from '../retrieval/oramaRetriever.js';
import { readVault } from '../vault/vaultReader.js';

/**
 * The reflection workflow: always check the vault, attach the most relevant
 * past note when one clears the relevance floor, and let the local model reply
 * — connecting past to present and weaving in a Socratic question when a note
 * is present, or just responding warmly when none is. A direct implementation
 * of AgentOrchestrator; a QM-backed adapter can wrap the same interface later.
 */
export class ReflectionOrchestrator implements AgentOrchestrator {
  private readonly retriever = createRetriever();

  /** Find the most relevant past note, or undefined if none clears the floor. */
  private async recall(transcript: string, vaultPath?: string): Promise<PastThought | undefined> {
    const notes = await readVault(vaultPath);
    if (notes.length === 0) return undefined;

    const hits = await this.retriever.retrieve(transcript, notes, config.retrieval.topK);
    const top = hits[0];
    if (!top || top.score < config.retrieval.minScore) return undefined;

    return { content: top.content, source: top.source, date: top.date };
  }

  async reflect(
    request: ReflectionRequest,
    context?: ReflectionContext,
  ): Promise<ReflectionResult> {
    const transcript = request.transcript.trim();
    if (!transcript) {
      throw new Error('There was nothing to reflect on — the transcript was empty.');
    }

    const thought = await this.recall(transcript, request.vaultPath);
    const user = buildReflectionUserMessage({ transcript, past: thought, context });

    let reply = await generate(REFLECT_SYSTEM_PROMPT, user, thought ? 280 : 220);
    if (!reply) {
      // One retry if the model returned nothing usable.
      reply = await generate(REFLECT_SYSTEM_PROMPT, `${user}\n\nRespond now, briefly.`, 280);
    }
    if (!reply) {
      throw new Error('The model did not produce a response.');
    }

    return { thought, question: reply };
  }
}
