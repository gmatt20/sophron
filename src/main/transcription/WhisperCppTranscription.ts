import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type {
  TranscriptionRequest,
  TranscriptionResult
} from '@shared/contracts';
import type { TranscriptionService } from './TranscriptionService';

export interface WhisperCppOptions {
  /** Absolute path to the whisper.cpp `main` (or `whisper-cli`) binary. */
  binaryPath: string;
  /** Absolute path to a ggml model file (e.g. ggml-base.en.bin). */
  modelPath: string;
  /** Force language (default: 'en'). */
  language?: string;
  /** Extra CLI args, appended verbatim. */
  extraArgs?: string[];
}

/**
 * Shells out to whisper.cpp for local, offline transcription.
 *
 * Audio arrives from the renderer as a Uint8Array. whisper.cpp needs a WAV
 * file on disk, so we spool to a tmp file, invoke the binary with `-otxt`,
 * and read the resulting `.txt` sidecar.
 *
 * The renderer is responsible for handing us PCM 16-bit / 16 kHz / mono WAV.
 * See `renderer/hooks/useRecorder.ts` for the encoder.
 */
export class WhisperCppTranscription implements TranscriptionService {
  readonly name = 'whisper.cpp';

  constructor(private readonly opts: WhisperCppOptions) {}

  async transcribe(req: TranscriptionRequest): Promise<TranscriptionResult> {
    const started = Date.now();
    const dir = await mkdtemp(join(tmpdir(), 'sophron-whisper-'));
    const wavPath = join(dir, 'input.wav');
    const outStem = join(dir, 'output');

    try {
      await writeFile(wavPath, req.audio);

      const args = [
        '-m', this.opts.modelPath,
        '-f', wavPath,
        '-of', outStem,
        '-otxt',
        '-nt',
        '-l', this.opts.language ?? 'en',
        ...(this.opts.extraArgs ?? [])
      ];

      await this.run(this.opts.binaryPath, args);
      const txt = await readFile(`${outStem}.txt`, 'utf8');
      return {
        transcript: txt.trim(),
        durationMs: Date.now() - started
      };
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private run(cmd: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      child.stderr.on('data', (d) => { stderr += String(d); });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`whisper.cpp exited with code ${code}: ${stderr}`));
      });
    });
  }
}
