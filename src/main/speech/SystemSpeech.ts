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

  /** Installed `say` voice names, listed once and cached. */
  private voicesCache: string[] | null = null;

  async synthesize(req: SpeechRequest): Promise<SpeechResult> {
    const dir = await mkdtemp(join(tmpdir(), 'sophron-say-'));
    const out = join(dir, 'speech.wav');
    try {
      const voice = await this.resolveVoice(voiceSlot(req.voiceId).systemVoice);
      const base = ['-o', out, '--data-format=LEI16@22050', req.text];
      try {
        await this.say(voice ? ['-v', voice, ...base] : base);
      } catch {
        // Chosen voice not usable — fall back to the system default.
        await this.say(base);
      }
      return { audio: new Uint8Array(await readFile(out)), mimeType: 'audio/wav' };
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  /**
   * Upgrade a plain voice name to its natural neural variant when available:
   * prefer a Premium/Enhanced build of the requested voice, then any Premium
   * voice at all, then the plain name. Returns null to let `say` use the
   * system default.
   */
  private async resolveVoice(base: string): Promise<string | null> {
    const voices = await this.listVoices();
    const better = (suffix: string) =>
      voices.find((v) => v.startsWith(`${base} (${suffix})`));
    return (
      better('Premium') ??
      better('Enhanced') ??
      voices.find((v) => /\(Premium\)/.test(v)) ??
      voices.find((v) => /\(Enhanced\)/.test(v)) ??
      (voices.includes(base) ? base : null)
    );
  }

  private async listVoices(): Promise<string[]> {
    if (this.voicesCache) return this.voicesCache;
    try {
      const raw = await this.exec('say', ['-v', '?']);
      // Each line: "Name (Variant)   en_US    # sample sentence"
      this.voicesCache = raw
        .split('\n')
        .map((line) => line.replace(/\s{2,}[a-z]{2}[_-][A-Z]{2}.*$/, '').trim())
        .filter(Boolean);
    } catch {
      this.voicesCache = [];
    }
    return this.voicesCache;
  }

  private say(args: string[]): Promise<void> {
    return this.exec('say', args).then(() => undefined);
  }

  private exec(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => { stdout += String(d); });
      child.stderr.on('data', (d) => { stderr += String(d); });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`${cmd} exited with code ${code}: ${stderr}`));
      });
    });
  }
}
