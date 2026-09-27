import { TitleBar } from './components/TitleBar';
import { VaultBar } from './components/VaultBar';
import { StatusPill } from './components/StatusPill';
import { MicButton } from './components/MicButton';
import { Transcript } from './components/Transcript';
import { PastThoughtCard } from './components/PastThoughtCard';
import { SocraticQuestion } from './components/SocraticQuestion';
import { ErrorBanner } from './components/ErrorBanner';
import { useReflect } from './hooks/useReflect';
import { useSession } from './state/session';

export default function App() {
  const {
    phase,
    level,
    recorderError,
    beginListening,
    finishAndReflect,
    reset
  } = useReflect();

  const transcript = useSession((s) => s.transcript);
  const result = useSession((s) => s.result);

  const showTranscript =
    phase.kind !== 'idle' && phase.kind !== 'listening' && transcript.length > 0;
  const showResult = phase.kind === 'ready' && result !== null;

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-bone-50">
      <TitleBar />

      <div className="no-drag flex items-center justify-between px-8 py-4 border-b border-ink-800/70">
        <VaultBar />
        <StatusPill phase={phase} />
      </div>

      <main className="no-drag flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-16 py-12">
          <MicButton
            phase={phase}
            level={level}
            onStart={beginListening}
            onStop={finishAndReflect}
            onReset={reset}
          />

          {(showTranscript || showResult) && (
            <div className="w-full flex flex-col gap-14">
              {showTranscript && <Transcript transcript={transcript} />}
              {showResult && result && (
                <>
                  <PastThoughtCard thought={result.thought} />
                  <SocraticQuestion question={result.question} />
                </>
              )}
            </div>
          )}

          {(recorderError || phase.kind === 'error') && (
            <ErrorBanner
              message={
                recorderError ??
                (phase.kind === 'error' ? phase.message : 'Something went wrong.')
              }
              onDismiss={reset}
            />
          )}
        </div>

        <footer className="px-8 py-5 border-t border-ink-800/70 text-[10px] uppercase tracking-[0.28em] text-bone-400/60 flex justify-between">
          <span>Speak · Remember · Reflect</span>
          <span>Local. Private. Yours.</span>
        </footer>
      </main>
    </div>
  );
}
