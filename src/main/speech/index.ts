import type { SpeechInfo, SpeechRequest, SpeechResult } from '@shared/contracts';
import { FishSpeech } from './FishSpeech';
import { SystemSpeech } from './SystemSpeech';
import { VOICE_SLOTS, type SpeechService } from './SpeechService';

/**
 * Chooses the speech backend per request, preferring a running Fish Speech
 * server and falling back to macOS `say`. Resolved lazily (not at startup) so
 * starting or stopping Fish takes effect without restarting Sophron.
 *
 * Env:
 *   SOPHRON_FISH_URL      Fish API server (default http://127.0.0.1:8080)
 *   SOPHRON_FISH_API_KEY  if the server was started with --api-key
 *   SOPHRON_TTS=system    skip Fish entirely; SOPHRON_TTS=off disables speech
 */
export class SpeechRouter {
  private readonly backends: SpeechService[];

  constructor() {
    const mode = process.env['SOPHRON_TTS'];
    const fish = new FishSpeech({
      baseUrl: (process.env['SOPHRON_FISH_URL'] ?? 'http://127.0.0.1:8080').replace(/\/$/, ''),
      apiKey: process.env['SOPHRON_FISH_API_KEY']
    });
    const system = new SystemSpeech();

    this.backends = mode === 'off' ? [] : mode === 'system' ? [system] : [fish, system];
  }

  async info(): Promise<SpeechInfo> {
    const backend = await this.pick();
    if (!backend) return { backend: 'none', voices: [] };
    return {
      backend: backend.name,
      voices: VOICE_SLOTS.map(({ id, label, description }) => ({ id, label, description }))
    };
  }

  async synthesize(req: SpeechRequest): Promise<SpeechResult> {
    const text = req.text.trim();
    if (!text) throw new Error('Nothing to speak.');

    let lastError: unknown = new Error('No speech backend is available.');
    for (const backend of this.backends) {
      if (!(await backend.available())) continue;
      try {
        return await backend.synthesize({ ...req, text });
      } catch (e) {
        console.warn(`[speech] ${backend.name} failed, trying next backend:`, e);
        lastError = e;
      }
    }
    throw lastError;
  }

  private async pick(): Promise<SpeechService | null> {
    for (const backend of this.backends) {
      if (await backend.available()) return backend;
    }
    return null;
  }
}

export function getSpeechService(): SpeechRouter {
  return new SpeechRouter();
}
