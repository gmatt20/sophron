import { useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { JournalHeader } from './components/JournalHeader';
import { JournalPage } from './components/JournalPage';
import { Composer } from './components/Composer';
import { ErrorBanner } from './components/ErrorBanner';
import { useReflect } from './hooks/useReflect';
import { useSession } from './state/session';
import { useApplyTheme } from './state/theme';

export default function App() {
  useApplyTheme();

  const {
    phase,
    level,
    beginListening,
    finishAndReflect,
    submitText,
    cancel,
    dismissError
  } = useReflect();

  const vault = useSession((s) => s.vault);
  const pending = useSession((s) => s.pending);
  const entry = useSession((s) => s.entries.find((e) => e.id === s.activeId) ?? null);
  const turns = entry?.turns ?? [];

  // Keep the newest writing in view as the page grows.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns.length, pending, phase.kind]);

  const error = phase.kind === 'error' ? phase.message : null;

  return (
    <div className="h-screen flex bg-paper text-fg overflow-hidden">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        <JournalHeader phase={phase} vaultName={vault?.name ?? null} date={entry?.createdAt ?? Date.now()} />

        <div ref={scrollRef} className="ruled flex-1 overflow-y-auto px-10">
          <JournalPage turns={turns} pending={pending} phase={phase} />
        </div>

        <div className="px-10 pt-4 bg-paper">
          {error && <ErrorBanner message={error} onDismiss={dismissError} />}
          <Composer
            phase={phase}
            level={level}
            hasTurns={turns.length > 0}
            onStartListening={beginListening}
            onStopListening={finishAndReflect}
            onCancel={cancel}
            onSubmit={submitText}
          />
        </div>
      </main>
    </div>
  );
}
