import type { ReflectionService } from './ReflectionService';
import { MockReflectionService } from './MockReflectionService';
import { OllamaReflectionService } from './OllamaReflectionService';

/**
 * Wire-up point for the reflection backend.
 *
 * Uses the real local-intelligence backend (vault retrieval + Ollama). Set
 * SOPHRON_USE_MOCK=1 to fall back to the canned mock (e.g. to demo the shell
 * without a running Ollama).
 */
export function getReflectionService(): ReflectionService {
  if (process.env.SOPHRON_USE_MOCK === '1') {
    return new MockReflectionService();
  }
  return new OllamaReflectionService();
}

export type { ReflectionService } from './ReflectionService';
