import type { SessionPhase } from '@shared/contracts';
import { MicIcon, StopIcon } from './Icons';

interface Props {
  phase: SessionPhase;
  level: number;
  onStop: () => void;
}

/**
 * Full-screen voice mode, in the spirit of the original Sophron: a single
 * large breathing mic on pure black. Shown while capturing (and briefly while
 * transcribing) so speaking takes over the whole surface; it dismisses back to
 * the journal once reflection begins.
 */
export function VoiceOverlay({ phase, level, onStop }: Props) {
  const listening = phase.kind === 'listening';
  const transcribing = phase.kind === 'transcribing';
  if (!listening && !transcribing) return null;

  const ringScale = 1 + Math.min(level, 1) * 0.6;

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col items-center justify-center gap-12 animate-fade-up">
      <button
        type="button"
        onClick={listening ? onStop : undefined}
        disabled={!listening}
        aria-label={listening ? 'Stop and reflect' : 'Transcribing'}
        className="no-drag relative w-44 h-44 rounded-full grid place-items-center disabled:cursor-default"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-accent/15 transition-transform duration-150 ease-out"
          style={{ transform: `scale(${ringScale})` }}
        />
        <span aria-hidden className="absolute -inset-3 rounded-full border border-accent/30 animate-breathe" />
        <span aria-hidden className="absolute inset-0 rounded-full border border-line" />
        <span className="relative text-accent-text [&>svg]:w-9 [&>svg]:h-9">
          {listening ? <StopIcon /> : <MicIcon />}
        </span>
      </button>

      <p className="text-[12px] tracking-[0.25em] uppercase text-fg-faint">
        {listening ? 'Tap when you’re done' : 'Transcribing…'}
      </p>
    </div>
  );
}
