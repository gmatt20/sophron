import { existsSync } from 'node:fs';
import type { TranscriptionService } from './TranscriptionService';
import { WhisperCppTranscription } from './WhisperCppTranscription';
import { MockTranscription } from './MockTranscription';

/**
 * Chooses the transcription backend at startup.
 *
 * If both `SOPHRON_WHISPER_BIN` and `SOPHRON_WHISPER_MODEL` point at real
 * files on disk we use whisper.cpp; otherwise we fall back to the mock so
 * the app still runs end-to-end.
 */
export function getTranscriptionService(): TranscriptionService {
  const bin = process.env['SOPHRON_WHISPER_BIN'];
  const model = process.env['SOPHRON_WHISPER_MODEL'];

  if (bin && model && existsSync(bin) && existsSync(model)) {
    return new WhisperCppTranscription({
      binaryPath: bin,
      modelPath: model,
      language: process.env['SOPHRON_WHISPER_LANG'] ?? 'en'
    });
  }
  return new MockTranscription();
}

export type { TranscriptionService } from './TranscriptionService';
