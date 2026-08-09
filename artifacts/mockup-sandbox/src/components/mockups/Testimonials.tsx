const TESTIMONIALS = [
  {
    quote:
      "Deployed a production VPS in under two minutes. Credentials arrived instantly and the server has been rock solid for months.",
    author: "Backend Engineer",
    role: "SaaS startup",
  },
  {
    quote:
      "Their red team found critical vulnerabilities our previous auditors missed. Professional, thorough, and completely discrete.",
    author: "CTO",
    role: "Fintech firm",
  },
  {
    quote:
      "The best part is paying with crypto, no card required. Fast, flexible, and the dashboard is a pleasure to use.",
    author: "DevOps lead",
    role: "Web3 company",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28 border-t border-[var(--color-border)] bg-[var(--color-surface)]/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-14">
          <p className="label-mono text-[var(--color-brand)] mb-4">
            // from operators
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Trusted by people who run systems
          </h2>
        </div>

        {/* Asymmetric editorial stack — no equal cards */}
        <div className="space-y-px border-t border-[var(--color-border)]">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.author}
              className="grid md:grid-cols-[1fr_2fr] gap-2 md:gap-10 py-8 border-b border-[var(--color-border)]"
            >
              <div className="label-mono text-[var(--color-ink-faint)] pt-1">
                {t.author}
                <div className="text-[var(--color-ink-faint)] normal-case tracking-normal font-sans mt-1">
                  {t.role}
                </div>
              </div>
              <blockquote className="text-lg md:text-xl text-[var(--color-ink)] leading-relaxed">
                "{t.quote}"
              </blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
