import type {
  ReflectionRequest,
  ReflectionResult
} from '@shared/contracts';

/**
 * The single boundary the Local Intelligence engineer implements.
 *
 * Given a transcript (and optionally the vault path), produce a matched past
 * thought and exactly one Socratic question. Everything upstream — retrieval,
 * embeddings, Ollama, prompt engineering — lives behind this interface.
 */
export interface ReflectionService {
  readonly name: string;
  reflect(request: ReflectionRequest): Promise<ReflectionResult>;
}
