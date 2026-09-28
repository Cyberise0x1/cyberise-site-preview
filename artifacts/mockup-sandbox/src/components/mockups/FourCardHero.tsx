import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Server,
  Wrench,
} from "lucide-react";

/*
 * 4-Card Hero — "network operations console" voice.
 *   Marketplace / Tools / What We Do rotate around a compact elliptical path;
 *   Who We Are is the terminal row beneath.
 * Selecting a card rotates it to the front; the active card carries the accent.
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

const ORDER: CardId[] = ["marketplace", "tools", "what-we-do"];

export default function FourCardHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  const prefersReducedMotion = useReducedMotion() ?? false;
  const active = ORDER[activeIndex];
  const orbitDistance = isNarrow ? 132 : 220;

  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 767px)");
    const updateLayout = () => setIsNarrow(breakpoint.matches);
    updateLayout();
    breakpoint.addEventListener("change", updateLayout);
    return () => breakpoint.removeEventListener("change", updateLayout);
  }, []);

  const moveActive = (offset: number) => {
    setActiveIndex(
      (current) => (current + offset + ORDER.length) % ORDER.length,
    );
  };

  const carouselStyle = (id: CardId) => {
    const idx = ORDER.indexOf(id);
    const relativePosition = (idx - activeIndex + ORDER.length) % ORDER.length;
    if (relativePosition === 0) {
      return { zIndex: 30, x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 };
    }
    if (relativePosition === 1) {
      return {
        zIndex: 20,
        x: orbitDistance,
        y: 18,
        rotate: 8,
        scale: 0.84,
        opacity: 0.88,
      };
    }
    return {
      zIndex: 10,
      x: -orbitDistance,
      y: 18,
      rotate: -8,
      scale: 0.84,
      opacity: 0.88,
    };
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
            Instant VPS & RDP, professional tools, and elite security work. One
            console, all of it.
          </p>
        </div>

        {/* ── Circular feature carousel ── */}
        <div
          id="feature-carousel"
          className="relative mx-auto h-[360px] max-w-3xl md:h-[420px]"
          role="region"
          aria-label="Featured services"
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              moveActive(1);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              moveActive(-1);
            }
          }}
        >
          {ORDER.map((id, idx) => {
            const card = CARDS[id];
            const Icon = card.Icon;
            const s = carouselStyle(id);
            const isActive = active === id;

            return (
              <motion.a
                key={id}
                href={card.href}
                onClick={(e) => {
                  if (!isActive) {
                    e.preventDefault();
                    setActiveIndex(idx);
                  }
                }}
                initial={false}
                animate={{
                  x: s.x,
                  y: s.y,
                  rotate: s.rotate,
                  scale: s.scale,
                  opacity: s.opacity,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.01 }
                    : { type: "spring", stiffness: 240, damping: 26 }
                }
                whileHover={prefersReducedMotion ? undefined : { y: s.y - 4 }}
                style={{ zIndex: s.zIndex }}
                aria-label={`Feature ${idx + 1} of ${ORDER.length}: ${card.label}${isActive ? ", current slide" : ""}`}
                aria-current={isActive ? "true" : undefined}
                aria-roledescription="slide"
                data-testid={`card-feature-${id}`}
                className={`absolute left-1/2 top-0 -ml-[130px] h-[300px] w-[260px] rounded-lg border p-6 flex flex-col justify-between text-left transition-colors duration-200 md:-ml-[150px] md:h-[340px] md:w-[300px] ${
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

          <div
            className="absolute inset-x-0 bottom-0 z-40 flex justify-center gap-3"
            role="group"
            aria-label="Carousel controls"
          >
            <button
              type="button"
              onClick={() => moveActive(-1)}
              aria-label="Previous feature"
              aria-controls="feature-carousel"
              data-testid="button-previous-feature"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-brand)]/60 hover:text-[var(--color-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => moveActive(1)}
              aria-label="Next feature"
              aria-controls="feature-carousel"
              data-testid="button-next-feature"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-brand)]/60 hover:text-[var(--color-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <p
            aria-live="polite"
            aria-atomic="true"
            data-testid="text-active-feature"
            className="sr-only"
          >
            {CARDS[active].label}, feature {activeIndex + 1} of {ORDER.length}
          </p>
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
