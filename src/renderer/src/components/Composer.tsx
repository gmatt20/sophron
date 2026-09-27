import { useState, type FormEvent } from 'react';
import type { SessionPhase } from '@shared/contracts';
import { MicButton } from './MicButton';

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
    <form
      onSubmit={submit}
      className="w-full max-w-[600px] mx-auto mb-6 flex items-center gap-3 bg-paper-card border border-line rounded pl-5 pr-2.5 py-2.5 focus-within:border-accent/50 transition-colors"
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
  );
}
