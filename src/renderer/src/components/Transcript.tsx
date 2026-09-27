interface Props {
  transcript: string;
}

export function Transcript({ transcript }: Props) {
  if (!transcript) return null;
  return (
    <section className="animate-fade-up max-w-2xl mx-auto">
      <div className="text-[10px] uppercase tracking-[0.28em] text-bone-400 mb-3">
        You said
      </div>
      <p className="text-lg leading-relaxed text-bone-100 font-serif">
        &ldquo;{transcript}&rdquo;
      </p>
    </section>
  );
}
