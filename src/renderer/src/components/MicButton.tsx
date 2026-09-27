import type { SessionPhase } from '@shared/contracts';

interface Props {
  phase: SessionPhase;
  level: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

/**
 * The single, dominant control. Behavior is state-machine driven:
 * idle → start; listening → stop; anything terminal → reset.
 */
export function MicButton({ phase, level, onStart, onStop, onReset }: Props) {
  const isListening = phase.kind === 'listening';
  const isBusy = phase.kind === 'transcribing' || phase.kind === 'searching' || phase.kind === 'reflecting';
  const isTerminal = phase.kind === 'ready' || phase.kind === 'error';

  const handleClick = () => {
    if (isListening) return onStop();
    if (isTerminal) return onReset();
    if (phase.kind === 'idle') return onStart();
  };

  const label = isListening
    ? 'Tap to stop'
    : isBusy
    ? 'Thinking'
    : isTerminal
    ? 'Speak again'
    : 'Tap to speak';

  const ringScale = 1 + Math.min(level, 1) * 0.35;

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={handleClick}
        disabled={isBusy}
        aria-label={label}
        className={[
          'relative flex items-center justify-center w-40 h-40 rounded-full',
          'border transition-all duration-500 ease-out-soft',
          'bg-ink-900/70 hairline',
          isListening
            ? 'border-accent/70 shadow-accent-ring'
            : isBusy
            ? 'border-ink-700 opacity-70 cursor-wait'
            : 'border-ink-700 hover:border-ink-500 hover:bg-ink-850'
        ].join(' ')}
      >
        {/* Breathing ring reacting to mic level */}
        <span
          aria-hidden
          className={[
            'absolute inset-0 rounded-full',
            isListening ? 'bg-accent/10' : 'bg-transparent',
            'transition-transform duration-150 ease-out'
          ].join(' ')}
          style={{
            transform: isListening ? `scale(${ringScale})` : 'scale(1)'
          }}
        />
        {isListening && (
          <span aria-hidden className="absolute -inset-2 rounded-full border border-accent/30 animate-breathe" />
        )}

        <MicGlyph active={isListening} busy={isBusy} />
      </button>

      <div className="text-xs uppercase tracking-[0.32em] text-bone-300">
        {label}
      </div>
    </div>
  );
}

function MicGlyph({ active, busy }: { active: boolean; busy: boolean }) {
  const color = active ? 'text-accent-soft' : busy ? 'text-bone-300' : 'text-bone-100';
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className={color}>
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
