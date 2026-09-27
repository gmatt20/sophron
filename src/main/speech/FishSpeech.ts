import type { SpeechRequest, SpeechResult } from '@shared/contracts';
import { voiceSlot, type SpeechService } from './SpeechService';

export interface FishSpeechOptions {
  /** Base URL of a running `tools/api_server.py` (default 127.0.0.1:8080). */
  baseUrl: string;
  /** Matches the server's `--api-key`, if it was started with one. */
  apiKey?: string;
}

/** How long a health result is trusted before re-probing the server. */
const HEALTH_TTL_MS = 15_000;

/**
 * Local text-to-speech via a Fish Speech API server.
 *
 * Voices are Fish "references": folders under the server's `references/`
 * directory, each holding a short sample clip plus a `.lab` transcript. A
 * voice whose reference isn't registered is still spoken, just in the
 * model's default voice, so a missing clip degrades rather than fails.
 */
export class FishSpeech implements SpeechService {
  readonly name = 'fish';

  private healthy: { ok: boolean; at: number } | null = null;
  private references: Set<string> | null = null;

  constructor(private readonly opts: FishSpeechOptions) {}

  async available(): Promise<boolean> {
    if (this.healthy && Date.now() - this.healthy.at < HEALTH_TTL_MS) {
      return this.healthy.ok;
    }
    let ok = false;
    try {
      const res = await this.fetch('/v1/health', { method: 'GET' }, 1_000);
      ok = res.ok;
      if (ok) this.references = await this.listReferences();
    } catch {
      ok = false;
    }
    this.healthy = { ok, at: Date.now() };
    return ok;
  }

  async synthesize(req: SpeechRequest): Promise<SpeechResult> {
    const slot = voiceSlot(req.voiceId);
    const hasReference = this.references?.has(slot.fishReferenceId) ?? false;

    const res = await this.fetch(
      '/v1/tts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: req.text,
          format: 'mp3',
          reference_id: hasReference ? slot.fishReferenceId : null,
          normalize: true
        })
      },
      60_000
    );
    if (!res.ok) {
      // Force a re-probe next time; the server may have gone away.
      this.healthy = null;
      throw new Error(`Fish Speech returned ${res.status}: ${await res.text().catch(() => '')}`);
    }
    return { audio: new Uint8Array(await res.arrayBuffer()), mimeType: 'audio/mpeg' };
  }

  private async listReferences(): Promise<Set<string>> {
    try {
      const res = await this.fetch('/v1/references/list', { method: 'GET' }, 2_000);
      const body = (await res.json()) as { reference_ids?: string[] };
      return new Set(body.reference_ids ?? []);
    } catch {
      return new Set();
    }
  }

  private fetch(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.opts.apiKey) headers.set('authorization', `Bearer ${this.opts.apiKey}`);
    return fetch(`${this.opts.baseUrl}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(timeoutMs)
    });
  }
}
