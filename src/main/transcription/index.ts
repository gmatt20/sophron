import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import type { TranscriptionService } from './TranscriptionService';
import { WhisperCppTranscription } from './WhisperCppTranscription';
import { MockTranscription } from './MockTranscription';

/** Binary names to look for on PATH, in order of preference. */
const WHISPER_BINARIES = ['whisper-cli', 'whisper-cpp', 'main'];

/** Conventional local model location (git-ignored). */
const DEFAULT_MODEL = join(process.cwd(), 'whisper-models', 'ggml-base.en.bin');

/** Resolve the whisper binary: explicit env override, else discover on PATH. */
function resolveBinary(): string | undefined {
  const fromEnv = process.env['SOPHRON_WHISPER_BIN'];
  if (fromEnv) return existsSync(fromEnv) ? fromEnv : undefined;

  for (const name of WHISPER_BINARIES) {
    try {
      const found = execFileSync('which', [name], { encoding: 'utf8' }).trim();
      if (found && existsSync(found)) return found;
    } catch {
      // not on PATH; try the next candidate
    }
  }
  return undefined;
}

/** Resolve the model file: explicit env override, else the conventional path. */
function resolveModel(): string | undefined {
  const fromEnv = process.env['SOPHRON_WHISPER_MODEL'];
  if (fromEnv) return existsSync(fromEnv) ? fromEnv : undefined;
  return existsSync(DEFAULT_MODEL) ? DEFAULT_MODEL : undefined;
}

/**
 * Chooses the transcription backend at startup.
 *
 * Uses whisper.cpp automatically when a binary is found (env override, else
 * discovered on PATH) and a model exists (env override, else
 * whisper-models/ggml-base.en.bin). Falls back to the canned mock so the app
 * still runs with no local speech-to-text installed.
 */
export function getTranscriptionService(): TranscriptionService {
  const binaryPath = resolveBinary();
  const modelPath = resolveModel();

  if (binaryPath && modelPath) {
    return new WhisperCppTranscription({
      binaryPath,
      modelPath,
      language: process.env['SOPHRON_WHISPER_LANG'] ?? 'en'
    });
  }
  return new MockTranscription();
}

export type { TranscriptionService } from './TranscriptionService';
