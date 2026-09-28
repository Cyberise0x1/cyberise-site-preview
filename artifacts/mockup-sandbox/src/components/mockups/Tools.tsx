import { ArrowRight } from "lucide-react";

const TOOLS = [
  {
    index: "01",
    title: "Server manager",
    desc: "Provision, monitor, and control every instance from one dashboard.",
  },
  {
    index: "02",
    title: "Network status",
    desc: "Real-time uptime and latency for all regions and data centers.",
  },
  {
    index: "03",
    title: "Security scanner",
    desc: "Quick vulnerability checks on your deployed infrastructure.",
  },
  {
    index: "04",
    title: "Usage analytics",
    desc: "Track resource consumption, bandwidth, and spend per server.",
  },
];

export default function Tools() {
  return (
    <section
      id="tools"
      className="py-20 md:py-28 border-t border-[var(--color-border)] bg-[var(--color-surface)]/40"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div className="max-w-xl">
            <p className="label-mono text-[var(--color-brand)] mb-4">
              // tools
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Everything to run your servers
            </h2>
            <p className="text-lg text-[var(--color-ink-dim)] leading-relaxed">
              Utilities that ship free with every Cyberise account.
            </p>
          </div>
          <a
            href="/tools"
            className="inline-flex items-center gap-2 text-[var(--color-brand)] text-sm font-medium hover:gap-3 transition-all"
          >
            View all tools <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Two-column index — compact, not equal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-[var(--color-border)] bg-[var(--color-border)] rounded-lg overflow-hidden">
          {TOOLS.map((tool) => (
            <a
              key={tool.index}
              href={`/tools/${tool.index}`}
              className="group flex items-start gap-4 p-6 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <span className="font-display text-lg text-[var(--color-ink-faint)] group-hover:text-[var(--color-brand)] transition-colors">
                {tool.index}
              </span>
              <div>
                <h3 className="font-display font-medium text-white mb-1.5">
                  {tool.title}
                </h3>
                <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
