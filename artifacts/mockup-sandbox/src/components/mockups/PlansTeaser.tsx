import { ArrowRight } from "lucide-react";

const PLANS = [
  {
    tier: "basic",
    name: "Basic",
    spec: "linux vps",
    price: 5,
    features: [
      "1 vCPU / 1GB RAM",
      "25GB NVMe",
      "1Gbps network",
      "Instant deploy",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    spec: "windows rdp",
    price: 15,
    features: [
      "2 vCPU / 4GB RAM",
      "80GB NVMe",
      "1Gbps network",
      "Priority support",
    ],
  },
];

export default function PlansTeaser() {
  return (
    <section
      id="plans"
      className="py-20 md:py-28 border-t border-[var(--color-border)]"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div className="max-w-xl">
            <p className="label-mono text-[var(--color-brand)] mb-4">
              // marketplace
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-[var(--color-ink-dim)] leading-relaxed">
              Deploy in minutes. Pay with balance or crypto. No hidden fees.
            </p>
          </div>
          <a
            href="/market"
            className="inline-flex items-center gap-2 text-[var(--color-brand)] text-sm font-medium hover:gap-3 transition-all"
          >
            View all plans <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Spec-table pricing, not bordered cards with badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className="border border-[var(--color-border)] bg-[var(--color-surface)] p-7 rounded-lg hover:border-[var(--color-border-strong)] transition-colors"
            >
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-display text-xl font-semibold text-white">
                  {plan.name}
                </h3>
                <span className="label-mono text-[var(--color-ink-faint)]">
                  {plan.spec}
                </span>
              </div>

              <div className="mb-6">
                <span className="font-display text-4xl font-semibold text-white">
                  ${plan.price}
                </span>
                <span className="text-[var(--color-ink-faint)]">/mo</span>
              </div>

              <ul className="space-y-2.5 mb-7">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-[var(--color-ink-dim)]"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--color-brand)] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="/market"
                className={`inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded text-sm font-semibold transition-colors ${
                  plan.tier === "pro"
                    ? "bg-[var(--color-brand)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-brand-strong)]"
                    : "border border-[var(--color-border-strong)] text-white hover:border-[var(--color-brand)]/60"
                }`}
              >
                Deploy now <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        <p className="text-sm text-[var(--color-ink-faint)] mt-8">
          More plans, regions, and durations in the marketplace.
        </p>
      </div>
    </section>
  );
}
