import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SpeechRequest, SpeechResult } from '@shared/contracts';
import { voiceSlot, type SpeechService } from './SpeechService';

/**
 * Fallback text-to-speech using macOS `say`, so Sophron can speak back before
 * Fish Speech is set up. Renders to a WAV file rather than the speakers so
 * playback stays in the renderer, where it can be stopped and replayed.
 */
export class SystemSpeech implements SpeechService {
  readonly name = 'system';

  async available(): Promise<boolean> {
    return process.platform === 'darwin';
  }

  async synthesize(req: SpeechRequest): Promise<SpeechResult> {
    const dir = await mkdtemp(join(tmpdir(), 'sophron-say-'));
    const out = join(dir, 'speech.wav');
    try {
      const voice = voiceSlot(req.voiceId).systemVoice;
      try {
        await this.say(['-v', voice, '-o', out, '--data-format=LEI16@22050', req.text]);
      } catch {
        // Voice not installed on this Mac — use the system default instead.
        await this.say(['-o', out, '--data-format=LEI16@22050', req.text]);
      }
      return { audio: new Uint8Array(await readFile(out)), mimeType: 'audio/wav' };
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private say(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('say', args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';
      child.stderr.on('data', (d) => { stderr += String(d); });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`say exited with code ${code}: ${stderr}`));
      });
    });
  }
}
