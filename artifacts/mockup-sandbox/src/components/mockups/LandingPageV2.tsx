import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Menu,
  X,
  Server,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe,
  Lock,
  Terminal,
  Cpu,
} from "lucide-react";

/*
 * Cyberise Landing V2 — "modern cloud SaaS" direction.
 * A deliberate contrast to V1's dark ops-console: light surface, soft
 * gradients, glass cards, indigo/violet accent, rounded geometry.
 * Preview at /preview/LandingPageV2.
 *
 * Styles are scoped under `.v2` so this page can live beside V1 without
 * disturbing the global dark tokens.
 */

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#customers" },
];

const FEATURES = [
  {
    Icon: Server,
    title: "Instant infrastructure",
    desc: "Provision VPS and RDP servers in under two minutes. No tickets, no waiting.",
  },
  {
    Icon: ShieldCheck,
    title: "Security-first",
    desc: "Hardened images, DDoS protection, and audit logs on every instance.",
  },
  {
    Icon: Zap,
    title: "Edge performance",
    desc: "Global regions with 1Gbps networking and sub-ms internal latency.",
  },
  {
    Icon: BarChart3,
    title: "Usage analytics",
    desc: "Track resource consumption, bandwidth, and spend in real time.",
  },
  {
    Icon: Globe,
    title: "Pay your way",
    desc: "Balance, cards, or crypto. Instant top-ups, no hidden fees.",
  },
  {
    Icon: Lock,
    title: "Private by design",
    desc: "Strict confidentiality on every inquiry. Your data stays yours.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Pick a plan",
    desc: "Choose a VPS or RDP configuration that fits your workload.",
  },
  {
    n: "02",
    title: "Deploy instantly",
    desc: "Pay with balance or crypto and get credentials in seconds.",
  },
  {
    n: "03",
    title: "Manage from one console",
    desc: "Monitor, scale, and secure everything from a single dashboard.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: 5,
    spec: "Linux VPS",
    features: [
      "1 vCPU / 1GB RAM",
      "25GB NVMe",
      "1Gbps network",
      "Instant deploy",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: 15,
    spec: "Windows RDP",
    features: [
      "2 vCPU / 4GB RAM",
      "80GB NVMe",
      "1Gbps network",
      "Priority support",
    ],
    highlight: true,
  },
];

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

export default function LandingPageV2() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div className="v2 min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight"
          >
            <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm">
              C
            </span>
            cyberise
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/dashboard"
              className="px-3.5 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </a>
            <a
              href="/market"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm"
            >
              Get started
            </a>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-slate-600"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/market"
              className="block mt-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold text-center"
            >
              Get started
            </a>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Soft gradient orbs */}
        <div className="pointer-events-none absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-indigo-200/60 to-violet-200/40 blur-3xl" />
        <div className="pointer-events-none absolute top-24 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-sky-200/60 to-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(255,255,255,0.9)_100%)]" />

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 md:pt-36 md:pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            New: instant crypto checkout
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mx-auto max-w-3xl text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.08]"
          >
            Servers in seconds.{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              Trust for years.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed"
          >
            Instant VPS & RDP, professional tools, and elite security work — one
            console, all of it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="/market"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
            >
              Deploy now <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Explore features
            </a>
          </motion.div>

          {/* Stats row */}
          <div className="mx-auto mt-16 max-w-3xl grid grid-cols-3 gap-6">
            {[
              { v: "99.99%", l: "Uptime SLA" },
              { v: "2 min", l: "Avg deploy" },
              { v: "12", l: "Global regions" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-slate-900">
                  {s.v}
                </div>
                <div className="mt-1 text-xs md:text-sm text-slate-500">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product preview (glass terminal) ── */}
      <section id="product" className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-2xl shadow-slate-200/60 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-200/80 px-5 py-3.5">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-slate-400 font-medium">
                console.cyberise.io
              </span>
            </div>
            <div className="p-6 md:p-8 bg-slate-950 font-mono text-sm text-slate-300">
              <p className="text-emerald-400">
                $ cyberise deploy --plan pro --region eu-west
              </p>
              <p className="mt-2 text-slate-400">
                <span className="text-indigo-400">→</span> Provisioning 2 vCPU /
                4GB RAM …
              </p>
              <p className="text-slate-400">
                <span className="text-indigo-400">→</span> Hardening image &
                firewall …
              </p>
              <p className="mt-2 text-emerald-400 font-semibold">
                ✓ Server ready in 94 seconds
              </p>
              <p className="mt-2 text-slate-400">
                <span className="text-slate-500">ssh</span> root@185.200.12.34
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <Cpu className="w-4 h-4 text-violet-400" />
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 mb-3">
              Everything included
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
              Run your entire stack on Cyberise
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              One platform for infrastructure, tools, and security. No piecemeal
              vendors, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.Icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-7 hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-1 transition-all"
                >
                  <div className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-indigo-600 group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 md:py-28 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
              From zero to deployed in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+3rem)] right-[calc(-50%+3rem)] border-t-2 border-dashed border-slate-200" />
                )}
                <div className="relative text-center">
                  <div className="mx-auto inline-flex w-12 h-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold shadow-lg shadow-indigo-500/25">
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 mb-3">
              Pricing
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Pay with balance or crypto. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-indigo-200 bg-gradient-to-b from-indigo-50 to-white shadow-xl shadow-indigo-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                    Most popular
                  </span>
                )}
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {plan.name}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    {plan.spec}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">
                    ${plan.price}
                  </span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm text-slate-600"
                    >
                      <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="w-3 h-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/market"
                  className={`mt-8 inline-flex items-center justify-center w-full gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5"
                      : "border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Deploy now <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            More plans, regions, and durations in the marketplace.
          </p>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        id="customers"
        className="py-20 md:py-28 bg-white border-y border-slate-200/70"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 mb-3">
              Customers
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
              Trusted by people who run systems
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.author}
                className="rounded-2xl border border-slate-200 bg-white p-7 flex flex-col justify-between"
              >
                <blockquote className="text-slate-700 leading-relaxed">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold">
                    {t.author.charAt(0)}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {t.author}
                    </div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / CTA ── */}
      <section id="contact" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-8 py-16 md:px-16 md:py-20 text-center">
            <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-violet-600/30 blur-3xl" />

            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl md:text-5xl font-bold tracking-tight text-white">
                Start your project today
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Servers, a full product build, or a security assessment. Our
                lines are open 24/7.
              </p>

              <div className="mx-auto mt-10 max-w-md">
                {sent ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-8">
                    <div className="text-emerald-400 font-semibold">
                      Message received
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      We'll get back to you shortly.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                    }}
                    className="flex flex-col gap-3"
                  >
                    <input
                      required
                      type="email"
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold hover:opacity-95 transition-opacity"
                    >
                      Get in touch <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-slate-400">
                      Typical response time: under 24 hours. Strictly
                      confidential.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="col-span-2">
              <a
                href="/"
                className="flex items-center gap-2 font-bold text-lg tracking-tight text-slate-900"
              >
                <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm">
                  C
                </span>
                cyberise
              </a>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs mt-4">
                Secure infrastructure and digital services. Build, secure, and
                deploy, all in one console.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: [
                  { label: "Marketplace", href: "/market" },
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "My Orders", href: "/orders" },
                  { label: "Tools", href: "/tools" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "Customers", href: "#customers" },
                  { label: "Contact", href: "#contact" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Cookie Policy", href: "/cookies" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              © 2026 Cyberise. All rights reserved.
            </p>
            <p className="text-xs text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />
              All systems operational
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
