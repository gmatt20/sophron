import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { TranscriptionService } from './TranscriptionService';
import { WhisperCppTranscription } from './WhisperCppTranscription';
import { MockTranscription } from './MockTranscription';

/**
 * Chooses the transcription backend at startup.
 *
 * Resolution order:
 *   1. explicit env vars `SOPHRON_WHISPER_BIN` + `SOPHRON_WHISPER_MODEL`
 *   2. common install locations (Homebrew `whisper-cli` + a model under
 *      `~/.sophron/models/` or `~/whisper.cpp/models/`)
 *   3. `MockTranscription` fallback
 */
export function getTranscriptionService(): TranscriptionService {
  const resolved = resolveWhisper();
  if (resolved) {
    console.log(`[transcription] whisper.cpp: ${resolved.binaryPath}  model=${resolved.modelPath}`);
    return new WhisperCppTranscription(resolved);
  }
  console.log('[transcription] using MockTranscription — install whisper.cpp for real STT');
  return new MockTranscription();
}

function resolveWhisper(): { binaryPath: string; modelPath: string; language: string } | null {
  const language = process.env['SOPHRON_WHISPER_LANG'] ?? 'en';

  const envBin = process.env['SOPHRON_WHISPER_BIN'];
  const envModel = process.env['SOPHRON_WHISPER_MODEL'];
  if (envBin && envModel && existsSync(envBin) && existsSync(envModel)) {
    return { binaryPath: envBin, modelPath: envModel, language };
  }

  const binCandidates = [
    '/opt/homebrew/bin/whisper-cli',
    '/usr/local/bin/whisper-cli',
    '/opt/homebrew/bin/whisper-cpp',
    '/usr/local/bin/whisper-cpp',
    join(homedir(), 'whisper.cpp/main'),
    join(homedir(), 'whisper.cpp/build/bin/whisper-cli')
  ];
  const modelCandidates = [
    join(homedir(), '.sophron/models/ggml-base.en.bin'),
    join(homedir(), '.sophron/models/ggml-small.en.bin'),
    join(homedir(), '.sophron/models/ggml-tiny.en.bin'),
    join(homedir(), 'whisper.cpp/models/ggml-base.en.bin'),
    join(homedir(), 'whisper.cpp/models/ggml-small.en.bin')
  ];

  const bin = binCandidates.find(existsSync);
  const model = modelCandidates.find(existsSync);
  if (bin && model) return { binaryPath: bin, modelPath: model, language };
  return null;
}

export type { TranscriptionService } from './TranscriptionService';
