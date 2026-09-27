import { useState, type FormEvent } from 'react';
import type { SessionPhase } from '@shared/contracts';
import { MicButton } from './MicButton';
import { useSession } from '../state/session';

interface Props {
  phase: SessionPhase;
  level: number;
  hasTurns: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSubmit: (text: string) => void;
}

export function Composer({ phase, level, hasTurns, onStartListening, onStopListening, onSubmit }: Props) {
  const [text, setText] = useState('');
  const isListening = phase.kind === 'listening';
  const isBusy =
    phase.kind === 'transcribing' || phase.kind === 'searching' || phase.kind === 'reflecting';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isBusy || isListening) return;
    onSubmit(text);
    setText('');
  };

  const placeholder = isListening
    ? 'Listening… tap the button when you’re done'
    : hasTurns
    ? 'Write or speak your answer…'
    : 'Write, or tap the mic and speak…';

  return (
    <div className="w-full max-w-[600px] mx-auto mb-6">
      <div className="mb-2 flex justify-end">
        <SocraticToggle />
      </div>
      <form
        onSubmit={submit}
        className="flex items-center gap-3 bg-paper-card border border-line rounded pl-5 pr-2.5 py-2.5 focus-within:border-accent/50 transition-colors"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isListening || isBusy}
          placeholder={placeholder}
          aria-label="Your thought"
          className="flex-1 min-w-0 bg-transparent font-serif text-[16px] text-fg placeholder:italic placeholder:text-fg-faint outline-none disabled:cursor-not-allowed"
        />
        <MicButton phase={phase} level={level} onStart={onStartListening} onStop={onStopListening} />
      </form>
    </div>
  );
}

/** Toggles between plain chat and Socratic recall (past note + one question). */
function SocraticToggle() {
  const mode = useSession((s) => s.mode);
  const setMode = useSession((s) => s.setMode);
  const on = mode === 'socratic';

  return (
    <button
      type="button"
      onClick={() => setMode(on ? 'chat' : 'socratic')}
      aria-pressed={on}
      title="Recall a related note you wrote and ask one Socratic question about it"
      className={[
        'flex items-center gap-2 text-[11.5px] px-2.5 py-1 rounded-full border transition-colors',
        on
          ? 'border-accent/50 text-accent-text bg-accent/10'
          : 'border-line text-fg-muted hover:text-fg'
      ].join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-accent' : 'bg-fg-faint'}`} />
      Socratic questions
    </button>
  );
}
