import type { ReflectionService } from './ReflectionService';
import { MockReflectionService } from './MockReflectionService';

/**
 * Wire-up point for the reflection backend.
 *
 * The Local Intelligence engineer swaps this factory for their real
 * implementation without touching the desktop shell or the renderer.
 */
export function getReflectionService(): ReflectionService {
  return new MockReflectionService();
}

export type { ReflectionService } from './ReflectionService';
