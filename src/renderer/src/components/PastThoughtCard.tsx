import type { PastThought } from '@shared/contracts';

export function PastThoughtCard({ thought }: { thought: PastThought }) {
  return (
    <section className="animate-fade-up max-w-2xl mx-auto">
      <div className="text-[10px] uppercase tracking-[0.28em] text-bone-400 mb-3">
        A past thought
      </div>
      <div className="relative pl-5">
        <span
          aria-hidden
          className="absolute left-0 top-1 bottom-1 w-px bg-gradient-to-b from-accent/60 via-accent/20 to-transparent"
        />
        <p className="text-[15px] leading-relaxed text-bone-200">
          {thought.content}
        </p>
        <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-bone-400">
          <span className="truncate max-w-[320px]" title={thought.source}>
            {thought.source}
          </span>
          {thought.date && <span className="opacity-60">· {thought.date}</span>}
        </div>
      </div>
    </section>
  );
}
