import { ArrowRight } from "lucide-react";

const SERVICES = [
  {
    index: "01",
    title: "Web & web app development",
    desc: "Enterprise-grade sites and progressive web apps. Scalable, secure, built for global audiences.",
  },
  {
    index: "02",
    title: "Android & iOS apps",
    desc: "Native and cross-platform mobile apps for fintech, healthcare, and beyond.",
  },
  {
    index: "03",
    title: "Government consultancy",
    desc: "Strategic technology advisory for government bodies. Digital transformation and secure infrastructure.",
  },
  {
    index: "04",
    title: "Cybersecurity & red teaming",
    desc: "Authorized offensive security operations that expose vulnerabilities before adversaries do.",
  },
  {
    index: "05",
    title: "Threat & intelligence tracking",
    desc: "Advanced tracking systems for defense and law enforcement. Monitor, trace, neutralize.",
  },
  {
    index: "06",
    title: "Secure infrastructure",
    desc: "Hardened servers, firewalls, and monitoring. The backbone of everything we run.",
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="py-20 md:py-28 border-t border-[var(--color-border)]"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div className="max-w-xl">
            <p className="label-mono text-[var(--color-brand)] mb-4">
              // what we do
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Six disciplines. One standard.
            </h2>
            <p className="text-lg text-[var(--color-ink-dim)] leading-relaxed">
              From security operations to full product builds, delivered by the
              same team.
            </p>
          </div>
          <a
            href="/#contact"
            className="inline-flex items-center gap-2 text-[var(--color-brand)] text-sm font-medium hover:gap-3 transition-all"
          >
            Start a project <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Numbered list — table-like, not icon tiles */}
        <div className="border-t border-[var(--color-border)]">
          {SERVICES.map((s) => (
            <div
              key={s.index}
              className="group grid grid-cols-[3rem_1fr] md:grid-cols-[3rem_16rem_1fr] gap-4 md:gap-8 items-baseline py-6 border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)] px-2 -mx-2 rounded"
            >
              <span className="font-display text-lg text-[var(--color-ink-faint)]">
                {s.index}
              </span>
              <h3 className="font-display text-lg md:text-xl font-medium text-white group-hover:text-[var(--color-brand)] transition-colors">
                {s.title}
              </h3>
              <p className="text-[var(--color-ink-dim)] text-sm md:text-base leading-relaxed md:max-w-xl">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
