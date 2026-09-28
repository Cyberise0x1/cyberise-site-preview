const COLUMNS = [
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
      { label: "What We Do", href: "/#services" },
      { label: "Who We Are", href: "/#about" },
      { label: "Contact", href: "/#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "NDA Information", href: "/nda" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <a
              href="/"
              className="font-display font-semibold text-lg text-white tracking-tight"
            >
              cyberise<span className="text-[var(--color-brand)]">/</span>
            </a>
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed max-w-xs mt-4">
              Secure infrastructure and digital services. Build, secure, and
              deploy, all in one console.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="label-mono text-[var(--color-ink-faint)] mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[var(--color-ink-dim)] hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-ink-faint)]">
            © 2026 Cyberise. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-ink-faint)]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1.5 align-middle" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
