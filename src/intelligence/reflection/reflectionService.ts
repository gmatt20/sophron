import type { ReflectionContext, ReflectionRequest, ReflectionResult } from '../contract/types.js';
import { ReflectionOrchestrator } from '../orchestration/reflectionOrchestrator.js';
import { generate } from '../llm/ollamaClient.js';
import { CHAT_SYSTEM_PROMPT } from '../llm/prompts.js';

/**
 * Public entry point of the intelligence layer.
 *
 * The Electron reflection adapter calls `reflect()` and receives a
 * ReflectionResult. It never needs to know about the vault, retrieval,
 * Ollama, or (later) QM — all of that lives behind the orchestrator.
 *
 * A single orchestrator instance is reused so the retrieval index is cached
 * across calls.
 */
const orchestrator = new ReflectionOrchestrator();

/** Plain conversational reply — no retrieval, no forced question. */
async function chat(request: ReflectionRequest): Promise<ReflectionResult> {
  const said = request.transcript.trim();
  if (!said) {
    throw new Error('There was nothing to respond to.');
  }
  const question = await generate(CHAT_SYSTEM_PROMPT, said, 400);
  return { question };
}

export function reflect(
  request: ReflectionRequest,
  context?: ReflectionContext,
): Promise<ReflectionResult> {
  // Chat is the default; socratic recall is opt-in.
  return request.mode === 'socratic' ? orchestrator.reflect(request, context) : chat(request);
}

export type { ReflectionRequest, ReflectionResult, ReflectionContext } from '../contract/types.js';
