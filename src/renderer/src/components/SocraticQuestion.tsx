export function SocraticQuestion({ question }: { question: string }) {
  return (
    <section className="animate-fade-up max-w-3xl mx-auto text-center">
      <div className="text-[10px] uppercase tracking-[0.32em] text-accent-soft/80 mb-5">
        A question for you
      </div>
      <p
        className="font-serif italic text-3xl md:text-4xl leading-[1.25] text-bone-50"
        style={{ textWrap: 'balance' as unknown as 'balance' }}
      >
        {question}
      </p>
    </section>
  );
}
