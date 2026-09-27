import type { SessionPhase } from '@shared/contracts';
import { pageDate } from '../lib/format';

const LABEL: Record<SessionPhase['kind'], string> = {
  idle: '',
  listening: 'Listening',
  transcribing: 'Transcribing',
  searching: 'Searching memory',
  reflecting: 'Reflecting',
  ready: '',
  error: 'Error'
};

interface Props {
  phase: SessionPhase;
  vaultName: string | null;
  date: number;
}

export function JournalHeader({ phase, vaultName, date }: Props) {
  const label = LABEL[phase.kind];
  return (
    <header className="drag-region h-12 shrink-0 px-10 flex items-center justify-between bg-paper text-[12px] text-fg-muted">
      <div className="flex items-center gap-3">
        <span>{vaultName ?? 'No vault chosen'}</span>
        {label && (
          <span
            className={[
              'flex items-center gap-1.5',
              phase.kind === 'error' ? 'text-danger' : 'text-accent-text'
            ].join(' ')}
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${phase.kind !== 'error' ? 'animate-breathe' : ''}`} />
            {label}
          </span>
        )}
      </div>
      <span>{pageDate(date)}</span>
    </header>
  );
}
