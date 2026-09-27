import type {
  TranscriptionRequest,
  TranscriptionResult
} from '@shared/contracts';

/**
 * Contract for any speech-to-text backend.
 *
 * Implementations live in this folder. The rest of the app must depend on
 * this interface only — never on the concrete backend.
 */
export interface TranscriptionService {
  readonly name: string;
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}
