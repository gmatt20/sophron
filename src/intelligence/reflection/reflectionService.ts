import type { ReflectionContext, ReflectionRequest, ReflectionResult } from '../contract/types.js';
import { ReflectionOrchestrator } from '../orchestration/reflectionOrchestrator.js';

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

export function reflect(
  request: ReflectionRequest,
  context?: ReflectionContext,
): Promise<ReflectionResult> {
  return orchestrator.reflect(request, context);
}

export type { ReflectionRequest, ReflectionResult, ReflectionContext } from '../contract/types.js';
