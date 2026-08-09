import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Server, Wrench, Briefcase } from "lucide-react";

/*
 * 4-Card Hero — "network operations console" voice.
 *   Marketplace / Tools / What We Do fan asymmetrically left-anchored;
 *   Who We Are is the terminal row beneath.
 * Clicking a card fans it to the front; the active card carries the accent.
 * Amber is reserved for the active card + the primary action.
 */

type CardId = "marketplace" | "tools" | "what-we-do";

const CARDS: Record<
  CardId,
  {
    index: string;
    label: string;
    tagline: string;
    Icon: typeof Server;
    href: string;
  }
> = {
  marketplace: {
    index: "01",
    label: "Marketplace",
    tagline: "VPS & RDP servers. Deploy in minutes. Balance or crypto.",
    Icon: Server,
    href: "/market",
  },
  tools: {
    index: "02",
    label: "Tools",
    tagline: "Server manager, monitoring, security, analytics.",
    Icon: Wrench,
    href: "/tools",
  },
  "what-we-do": {
    index: "03",
    label: "What We Do",
    tagline: "Web & mobile builds. Red teaming. Threat intelligence.",
    Icon: Briefcase,
    href: "/#services",
  },
};

export default function FourCardHero() {
  const [active, setActive] = useState<CardId>("marketplace");
  const order: CardId[] = ["marketplace", "tools", "what-we-do"];

  const fanStyle = (id: CardId) => {
    const idx = order.indexOf(id);
    const activeIdx = order.indexOf(active);
    if (id === active) return { zIndex: 30, x: 0, y: 0, rotate: 0, scale: 1 };
    const behind = (idx - activeIdx + order.length) % order.length;
    if (behind === 1) return { zIndex: 20, x: 72, y: 16, rotate: 5, scale: 0.9 };
    if (behind === 2) return { zIndex: 10, x: -72, y: 30, rotate: -6, scale: 0.82 };
    return { zIndex: 10, x: 120, y: 40, rotate: 8, scale: 0.78 };
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-24 md:pt-32 md:pb-32">
        {/* Header — left-anchored, not centered */}
        <div className="max-w-2xl mb-20">
          <p className="label-mono text-[var(--color-brand)] mb-6">
            // cyberise — infrastructure & digital services
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight text-[var(--color-ink)] mb-6">
            Servers you deploy. Systems you trust. Ops that hold.
          </h1>
          <p className="text-lg text-[var(--color-ink-dim)] leading-relaxed max-w-xl">
            Instant VPS & RDP, professional tools, and elite security work.
            One console, all of it.
          </p>
        </div>

        {/* ── The fan ── */}
        <div className="relative h-[360px] md:h-[420px] max-w-3xl">
          {order.map((id) => {
            const card = CARDS[id];
            const Icon = card.Icon;
            const s = fanStyle(id);
            const isActive = active === id;

            return (
              <motion.a
                key={id}
                href={card.href}
                onClick={(e) => {
                  if (!isActive) {
                    e.preventDefault();
                    setActive(id);
                  }
                }}
                initial={false}
                animate={{
                  x: s.x,
                  y: s.y,
                  rotate: s.rotate,
                  scale: s.scale,
                  zIndex: s.zIndex,
                }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
                whileHover={{ y: s.y - 4 }}
                className={`absolute left-0 top-0 w-[260px] md:w-[300px] h-[300px] md:h-[340px] rounded-lg border p-6 flex flex-col justify-between text-left transition-colors duration-200 ${
                  isActive
                    ? "border-[var(--color-brand)]/60 bg-[var(--color-surface-2)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${isActive ? "text-[var(--color-brand)]" : "text-[var(--color-ink-faint)]"}`}
                    />
                    <span className="font-display text-2xl font-medium text-[var(--color-ink-faint)]">
                      {card.index}
                    </span>
                  </div>
                  <span className="label-mono text-[var(--color-ink-faint)]">
                    {isActive ? "open" : "closed"}
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-xl font-semibold text-white mb-2">
                    {card.label}
                  </h2>
                  <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">
                    {card.tagline}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-2 text-sm font-medium ${isActive ? "text-[var(--color-brand)]" : "text-[var(--color-ink-dim)]"}`}
                >
                  {isActive ? "Open console" : "Select"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </motion.a>
            );
          })}
        </div>

        {/* ── Who We Are — terminal row beneath ── */}
        <motion.a
          href="/#about"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ x: 4 }}
          className="group relative mt-16 flex items-center gap-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 max-w-2xl transition-colors hover:border-[var(--color-brand)]/50"
        >
          <span className="font-display text-2xl font-medium text-[var(--color-ink-faint)]">
            04
          </span>
          <div className="flex-1 min-w-0">
            <div className="label-mono text-[var(--color-brand)] mb-1">
              who we are
            </div>
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">
              A global team of engineers and security operators. Infrastructure
              and digital services you can trust.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-[var(--color-ink-faint)] transition-colors group-hover:text-[var(--color-brand)] shrink-0" />
        </motion.a>
      </div>
    </section>
  );
}
