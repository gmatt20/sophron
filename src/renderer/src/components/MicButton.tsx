import type { SessionPhase } from '@shared/contracts';
import { MicIcon, StopIcon } from './Icons';

interface Props {
  phase: SessionPhase;
  level: number;
  onStart: () => void;
  onStop: () => void;
}

/** Round ink-well mic: idle → start, listening → stop, busy → disabled. */
export function MicButton({ phase, level, onStart, onStop }: Props) {
  const isListening = phase.kind === 'listening';
  const isBusy =
    phase.kind === 'transcribing' || phase.kind === 'searching' || phase.kind === 'reflecting';

  const label = isListening ? 'Stop and reflect' : isBusy ? 'Thinking' : 'Speak';
  const ringScale = 1 + Math.min(level, 1) * 0.45;

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={isBusy}
      aria-label={label}
      title={label}
      className={[
        'relative shrink-0 w-10 h-10 rounded-full grid place-items-center',
        'bg-accent text-accent-fg transition-all duration-300 ease-out-soft',
        isListening ? 'shadow-accent-ring' : 'hover:opacity-90',
        isBusy ? 'opacity-50 cursor-wait' : ''
      ].join(' ')}
    >
      {isListening && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-accent/25 transition-transform duration-150 ease-out"
            style={{ transform: `scale(${ringScale})` }}
          />
          <span aria-hidden className="absolute -inset-1.5 rounded-full border border-accent/40 animate-breathe" />
        </>
      )}
      <span className="relative">{isListening ? <StopIcon /> : <MicIcon />}</span>
    </button>
  );
}
