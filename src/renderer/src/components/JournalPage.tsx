import type { SessionPhase } from '@shared/contracts';
import { noteDate } from '../lib/format';
import { speak, stopSpeaking } from '../lib/speech';
import type { Turn } from '../state/session';
import { useVoice } from '../state/voice';
import { SpeakerIcon, StopIcon } from './Icons';

interface Props {
  turns: Turn[];
  pending: string | null;
  phase: SessionPhase;
}

/** The ruled page: every exchange in the active entry, plus any in-flight one. */
export function JournalPage({ turns, pending, phase }: Props) {
  const inFlight = phase.kind !== 'idle' && phase.kind !== 'ready' && phase.kind !== 'error';

  if (turns.length === 0 && !inFlight) return <EmptyPage />;

  return (
    <div className="w-full max-w-[600px] mx-auto pt-4 pb-16 flex flex-col gap-14">
      {turns.map((t) => (
        <TurnView key={t.id} turn={t} />
      ))}
      {inFlight && <PendingTurn said={pending} phase={phase} />}
    </div>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  return (
    <article className="animate-fade-up flex flex-col gap-8">
      <Said text={turn.said} />

      <div className="relative">
        {turn.thought.date && (
          <div className="hidden min-[1100px]:block absolute -left-[140px] top-2 w-[116px] text-right text-[11.5px] leading-snug text-accent-text">
            you wrote this
            <br />
            on {noteDate(turn.thought.date)}
          </div>
        )}
        <figure className="-rotate-[0.6deg] bg-paper-card border border-line shadow-clip px-5 py-4">
          <blockquote className="font-serif text-[15px] leading-relaxed text-fg">
            &ldquo;{turn.thought.content}&rdquo;
          </blockquote>
          <figcaption className="mt-2 text-[11px] text-fg-muted truncate" title={turn.thought.source}>
            {turn.thought.source}
            {turn.thought.date && (
              <span className="min-[1100px]:hidden"> · {noteDate(turn.thought.date)}</span>
            )}
          </figcaption>
        </figure>
      </div>

      <div className="group/q flex items-start gap-3">
        <p
          className="flex-1 font-display italic text-[30px] leading-[1.2] text-accent-text"
          style={{ textWrap: 'balance' as unknown as 'balance' }}
        >
          {turn.question}
        </p>
        <ReplayButton turn={turn} />
      </div>
    </article>
  );
}

function ReplayButton({ turn }: { turn: Turn }) {
  const canSpeak = useVoice((s) => s.info !== null && s.info.backend !== 'none');
  const speaking = useVoice((s) => s.speakingId === turn.id);
  if (!canSpeak) return null;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stopSpeaking() : speak(turn.question, turn.id, { force: true }))}
      aria-label={speaking ? 'Stop reading' : 'Read this question aloud'}
      title={speaking ? 'Stop' : 'Read aloud'}
      className={[
        'mt-2 p-1.5 rounded-full text-accent-text transition-opacity',
        speaking ? 'opacity-100' : 'opacity-0 group-hover/q:opacity-60 hover:!opacity-100 focus:opacity-100'
      ].join(' ')}
    >
      {speaking ? <StopIcon size={14} /> : <SpeakerIcon size={16} />}
    </button>
  );
}

const PENDING_COPY: Partial<Record<SessionPhase['kind'], string>> = {
  listening: 'Listening…',
  transcribing: 'Writing down what you said…',
  searching: 'Leafing through your vault…',
  reflecting: 'Thinking of a question…'
};

function PendingTurn({ said, phase }: { said: string | null; phase: SessionPhase }) {
  return (
    <article className="flex flex-col gap-6">
      {said && <Said text={said} />}
      <p className="flex items-center gap-2.5 font-serif italic text-[16px] text-fg-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-breathe" />
        {PENDING_COPY[phase.kind]}
      </p>
    </article>
  );
}

function Said({ text }: { text: string }) {
  return <p className="font-serif text-[20px] leading-8 text-fg">{text}</p>;
}

function EmptyPage() {
  return (
    <div className="w-full max-w-[600px] mx-auto pt-16 animate-fade-up">
      <p className="font-display italic text-[40px] leading-tight text-fg">What’s on your mind?</p>
      <p className="mt-4 font-serif text-[17px] leading-8 text-fg-muted">
        Speak or write it down. Sophron will find something you once wrote that’s related,
        and ask you one question about it.
      </p>
    </div>
  );
}
