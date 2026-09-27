import type {
  TranscriptionRequest,
  TranscriptionResult
} from '@shared/contracts';
import type { TranscriptionService } from './TranscriptionService';

const SAMPLES = [
  "I keep circling back to whether I should leave the current project. Something about it feels finished but I'm afraid to admit it.",
  "I've been trying to work on the book every morning but I keep pushing it later and later in the day. I'm not sure what I'm avoiding.",
  "The conversation with Maya stayed with me. She said I sound like I want permission to slow down.",
  "I think I've been mistaking motion for progress this whole quarter."
];

/**
 * Deterministic-ish mock so the UI is fully driveable without whisper.cpp
 * installed. Rotates through canned transcripts and pretends to take a moment.
 */
export class MockTranscription implements TranscriptionService {
  readonly name = 'mock';
  private i = 0;

  async transcribe(_req: TranscriptionRequest): Promise<TranscriptionResult> {
    const started = Date.now();
    await new Promise((r) => setTimeout(r, 900));
    const transcript = SAMPLES[this.i % SAMPLES.length]!;
    this.i += 1;
    return { transcript, durationMs: Date.now() - started };
  }
}
