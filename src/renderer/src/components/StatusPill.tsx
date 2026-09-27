import type { SessionPhase } from '@shared/contracts';

const LABEL: Record<SessionPhase['kind'], string> = {
  idle: 'Ready',
  listening: 'Listening',
  transcribing: 'Transcribing',
  searching: 'Searching memory',
  reflecting: 'Reflecting',
  ready: 'Reflected',
  error: 'Error'
};

const TONE: Record<SessionPhase['kind'], string> = {
  idle:         'text-bone-400 border-ink-700',
  listening:    'text-accent-soft border-accent/50 shadow-accent-ring',
  transcribing: 'text-bone-100 border-ink-600',
  searching:    'text-bone-100 border-ink-600',
  reflecting:   'text-accent-soft border-accent/40',
  ready:        'text-bone-50 border-ink-600',
  error:        'text-red-300 border-red-500/40'
};

export function StatusPill({ phase }: { phase: SessionPhase }) {
  const active = phase.kind !== 'idle' && phase.kind !== 'ready' && phase.kind !== 'error';
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] transition-colors duration-300 ease-out-soft ${TONE[phase.kind]}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${active ? 'animate-breathe' : ''}`}
      />
      {LABEL[phase.kind]}
    </div>
  );
}
