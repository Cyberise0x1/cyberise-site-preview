import { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className="py-20 md:py-28 border-t border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="label-mono text-[var(--color-brand)] mb-4">
              // contact
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Start a project
            </h2>
            <p className="text-lg text-[var(--color-ink-dim)] leading-relaxed mb-8">
              Servers, a full product build, or a security assessment. Our
              lines are open 24/7.
            </p>

            <div className="space-y-3 text-sm text-[var(--color-ink-dim)]">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] shrink-0" />
                All inquiries treated with strict confidentiality.
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] shrink-0" />
                Typical response time: under 24 hours.
              </div>
            </div>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-7 rounded-lg">
            {sent ? (
              <div className="text-center py-12">
                <div className="font-display text-5xl font-medium text-[var(--color-success)] mb-4">
                  ✓
                </div>
                <h3 className="font-display font-semibold text-xl text-white mb-2">
                  Message received
                </h3>
                <p className="text-sm text-[var(--color-ink-dim)]">
                  We'll get back to you shortly.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5"
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      required
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-white placeholder-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-white placeholder-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contact-service"
                    className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5"
                  >
                    What do you need?
                  </label>
                  <select
                    id="contact-service"
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
                  >
                    <option>VPS / RDP server</option>
                    <option>Web or app development</option>
                    <option>Cybersecurity & red teaming</option>
                    <option>Government consultancy</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-white placeholder-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors resize-none"
                    placeholder="Tell us about your project..."
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded bg-[var(--color-brand)] text-[var(--color-primary-foreground)] text-sm font-semibold hover:bg-[var(--color-brand-strong)] transition-colors"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
