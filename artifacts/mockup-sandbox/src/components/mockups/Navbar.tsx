import { useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { label: "Marketplace", href: "/market" },
  { label: "What We Do", href: "/#services" },
  { label: "Tools", href: "/tools" },
  { label: "Who We Are", href: "/#about" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — mono wordmark, no glow */}
        <a
          href="/"
          className="font-display font-semibold text-lg text-white tracking-tight"
        >
          cyberise<span className="text-[var(--color-brand)]">/</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 rounded text-sm text-[var(--color-ink-dim)] hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/dashboard"
            className="px-3.5 py-2 text-sm text-[var(--color-ink-dim)] hover:text-white transition-colors"
          >
            Sign in
          </a>
          <a
            href="/market"
            className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-primary-foreground)] text-sm font-semibold hover:bg-[var(--color-brand-strong)] transition-colors"
          >
            Deploy now
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-[var(--color-ink-dim)] hover:text-white"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-4 space-y-1">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded text-sm text-[var(--color-ink-dim)] hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/market"
            className="block mt-2 px-4 py-2.5 rounded bg-[var(--color-brand)] text-[var(--color-primary-foreground)] text-sm font-semibold text-center"
          >
            Deploy now
          </a>
        </div>
      )}
    </header>
  );
}
