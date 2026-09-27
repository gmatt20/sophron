import { config } from '../config.js';
import type {
  AgentOrchestrator,
  PastThought,
  ReflectionContext,
  ReflectionRequest,
  ReflectionResult,
} from '../contract/types.js';
import { generate } from '../llm/ollamaClient.js';
import { SOCRATIC_SYSTEM_PROMPT, buildReflectionUserMessage } from '../llm/prompts.js';
import { createRetriever } from '../retrieval/oramaRetriever.js';
import { readVault } from '../vault/vaultReader.js';

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Pull exactly one question out of the model output, dropping any preamble
 * the model may have prepended before the question sentence.
 */
export function extractSingleQuestion(raw: string): string {
  const text = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
  const q = text.indexOf('?');
  if (q < 0) return text; // no question mark; caller may retry
  // Keep only the sentence that ends at the first '?'.
  const boundary = Math.max(
    text.lastIndexOf('.', q),
    text.lastIndexOf('!', q),
    text.lastIndexOf('\n', q),
  );
  return text.slice(boundary + 1, q + 1).trim();
}

/**
 * The V1 reflection workflow: read the vault, retrieve the most relevant past
 * note, ask the local model for one Socratic question, and validate it. This
 * is a direct implementation of AgentOrchestrator; a QM-backed adapter can
 * wrap the same interface later without changing callers.
 */
export class ReflectionOrchestrator implements AgentOrchestrator {
  private readonly retriever = createRetriever();

  async reflect(
    request: ReflectionRequest,
    context?: ReflectionContext,
  ): Promise<ReflectionResult> {
    const transcript = request.transcript.trim();
    if (!transcript) {
      throw new Error('There was nothing to reflect on — the transcript was empty.');
    }

    const notes = await readVault(request.vaultPath);
    if (notes.length === 0) {
      throw new Error('No notes were found in the vault to reflect on.');
    }

    const hits = await this.retriever.retrieve(transcript, notes, config.retrieval.topK);
    const top = hits[0];
    if (!top || top.score < config.retrieval.minScore) {
      throw new Error("I couldn't connect that to anything you've written yet — try saying a little more.");
    }
    const thought: PastThought = { content: top.content, source: top.source, date: top.date };

    const user = buildReflectionUserMessage({ transcript, past: thought, context });
    let question = extractSingleQuestion(await generate(SOCRATIC_SYSTEM_PROMPT, user));

    // One retry if the model returned nothing usable or overran the word budget.
    if (!question || countWords(question) > config.socratic.maxWords) {
      const stricter = `${user}\n\nYour previous answer was unusable. Respond with ONE open question only, under ${config.socratic.maxWords} words.`;
      const retry = extractSingleQuestion(await generate(SOCRATIC_SYSTEM_PROMPT, stricter));
      if (retry && (!question || countWords(retry) <= config.socratic.maxWords)) {
        question = retry;
      }
    }

    if (!question) {
      throw new Error('The model did not produce a reflection question.');
    }

    return { thought, question };
  }
}
