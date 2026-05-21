import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type LegalTab = "privacy" | "terms" | "nda" | "cookies";

const TABS: { id: LegalTab; label: string }[] = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Service" },
  { id: "nda", label: "NDA Information" },
  { id: "cookies", label: "Cookie Policy" },
];

const DOCS: Record<
  LegalTab,
  { title: string; effective: string; body: React.ReactNode }
> = {
  privacy: {
    title: "Privacy Policy",
    effective: "Effective: January 1, 2025",
    body: (
      <div className="space-y-4 text-[#a0a0b8] leading-[1.8] text-[0.95rem]">
        <p>
          Cyberise Technology ("we", "us") respects your privacy. This policy
          explains what personal data we collect when you use this website and
          how we use it.
        </p>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            What We Collect
          </h4>
          <p>
            When you submit the contact form we collect your name, email
            address, the service you selected, and the message you wrote. We
            collect nothing else — no tracking pixels, no fingerprinting.
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            How We Use It
          </h4>
          <p>
            Your data is used solely to respond to your inquiry. We do not sell,
            rent, or share your information with any third party, except Resend
            (our email delivery provider) which transmits your message to our
            inbox and is bound by its own privacy policy.
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            Retention & Deletion
          </h4>
          <p>
            Contact form data is retained for up to 12 months. To request
            deletion, email us at{" "}
            <span className="text-[#00f0ff]">
              Cyberisetecnologies@consultant.com
            </span>{" "}
            with the subject line "Data Deletion Request".
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            Jurisdiction
          </h4>
          <p>
            This policy is governed by the Nigeria Data Protection Regulation
            (NDPR). International users retain equivalent rights under their
            local laws.
          </p>
        </div>
      </div>
    ),
  },
  terms: {
    title: "Terms of Service",
    effective: "Effective: January 1, 2025",
    body: (
      <div className="space-y-4 text-[#a0a0b8] leading-[1.8] text-[0.95rem]">
        <p>
          By accessing this website you agree to the following terms. If you
          disagree, please exit now.
        </p>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            Informational Use Only
          </h4>
          <p>
            This site is provided for informational purposes. No content
            constitutes a binding offer, legal advice, or guarantee of specific
            outcomes. All actual engagements are governed by a separate signed
            contract.
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            Prohibited Conduct
          </h4>
          <p>
            You may not scrape, reverse-engineer, or misuse this site or its
            contact form. Any attempt to probe, test, or attack our
            infrastructure is strictly prohibited and will be reported to
            relevant authorities.
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            Limitation of Liability
          </h4>
          <p>
            Cyberise Technology is not liable for any damages arising from
            reliance on information presented on this site. All content is
            provided "as is" without warranties of any kind.
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            Governing Law
          </h4>
          <p>
            These terms are governed by the laws of the Federal Republic of
            Nigeria. Any disputes shall be resolved in Nigerian courts.
          </p>
        </div>
      </div>
    ),
  },
  nda: {
    title: "NDA Information",
    effective: "Effective: January 1, 2025",
    body: (
      <div className="space-y-4 text-[#a0a0b8] leading-[1.8] text-[0.95rem]">
        <p>
          Cyberise Technology operates in domains where discretion is
          non-negotiable. This page explains how we handle confidential
          information during pre-engagement conversations.
        </p>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            Default Confidentiality
          </h4>
          <p>
            All technical details, vulnerability disclosures, infrastructure
            information, and business intelligence shared with us during any
            pre-engagement discussion are treated as strictly confidential by
            default — regardless of whether a formal NDA has been signed.
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            Formal Mutual NDA
          </h4>
          <p>
            Prospective clients who require a formal, signed Mutual
            Non-Disclosure Agreement before a discovery call are welcome to
            request one. Contact us at{" "}
            <span className="text-[#00f0ff]">
              Cyberisetecnologies@consultant.com
            </span>{" "}
            and we will send a template within one business day.
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            Our Commitment
          </h4>
          <p>
            We do not disclose client names, project details, or findings to any
            third party. Engagement reports are delivered exclusively to the
            client and stored on encrypted, access-controlled infrastructure.
          </p>
        </div>
      </div>
    ),
  },
  cookies: {
    title: "Cookie Policy",
    effective: "Effective: January 1, 2025",
    body: (
      <div className="space-y-4 text-[#a0a0b8] leading-[1.8] text-[0.95rem]">
        <p>We keep this simple because our cookie footprint is minimal.</p>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            What We Don't Use
          </h4>
          <p>
            This site does not use advertising cookies, analytics trackers,
            social media pixels, or any third-party tracking technology. We do
            not build behavioral profiles or share browsing data with
            advertisers.
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            What May Be Stored
          </h4>
          <p>
            Your browser may store minimal session data purely for the site to
            function (for example, your scroll position or form state). This
            data never leaves your device and is cleared when you close your
            browser tab.
          </p>
        </div>
        <div>
          <h4 className="font-rajdhani font-semibold text-white uppercase tracking-[1.5px] text-[0.85rem] mb-1">
            No Consent Banner Needed
          </h4>
          <p>
            Because we do not use non-essential cookies, no cookie consent
            banner is displayed. If this policy changes in the future, we will
            update this page and add appropriate consent flows before activating
            any new tracking.
          </p>
        </div>
      </div>
    ),
  },
};

interface LegalModalProps {
  open: boolean;
  activeTab: LegalTab;
  onTabChange: (tab: LegalTab) => void;
  onClose: () => void;
}

const TRANSITION_MS = 220;

export default function LegalModal({
  open,
  activeTab,
  onTabChange,
  onClose,
}: LegalModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabKey, setTabKey] = useState(activeTab);
  const [tabVisible, setTabVisible] = useState(true);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      unmountTimer.current = setTimeout(
        () => setMounted(false),
        TRANSITION_MS + 20,
      );
    }
    return () => {
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
    };
  }, [open]);

  useEffect(() => {
    if (activeTab === tabKey) return;
    if (tabTimer.current) clearTimeout(tabTimer.current);
    setTabVisible(false);
    tabTimer.current = setTimeout(() => {
      setTabKey(activeTab);
      setTabVisible(true);
    }, 120);
    return () => {
      if (tabTimer.current) clearTimeout(tabTimer.current);
    };
  }, [activeTab]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const doc = DOCS[tabKey];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(12px)",
        opacity: visible ? 1 : 0,
        transition: `opacity ${TRANSITION_MS}ms ease`,
      }}
    >
      <div
        className="relative w-full max-w-[720px] max-h-[90vh] flex flex-col rounded-[20px] overflow-hidden"
        style={{
          background: "#12121a",
          border: "1px solid rgba(0,240,255,0.12)",
          boxShadow:
            "0 0 60px rgba(0,240,255,0.08), 0 32px 64px rgba(0,0,0,0.6)",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.95)",
          transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            height: "3px",
            background: "linear-gradient(90deg,#00f0ff,#7b2ff7,#ff2d55)",
          }}
        />

        <div className="flex items-center justify-between px-8 pt-6 pb-0 shrink-0">
          <span className="font-rajdhani text-[0.75rem] font-semibold tracking-[3px] uppercase text-[#00f0ff]">
            // LEGAL DOCS
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#a0a0b8] transition-all hover:bg-[rgba(0,240,255,0.08)] hover:text-[#00f0ff]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-0 px-8 mt-5 border-b border-[rgba(255,255,255,0.06)] shrink-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative shrink-0 px-4 pb-3 font-rajdhani text-[0.85rem] font-semibold tracking-[1px] uppercase transition-colors"
              style={{ color: activeTab === tab.id ? "#00f0ff" : "#a0a0b8" }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{
                    background: "linear-gradient(90deg,#00f0ff,#7b2ff7)",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div
            style={{
              opacity: tabVisible ? 1 : 0,
              transform: tabVisible ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 120ms ease, transform 120ms ease",
            }}
          >
            <div className="mb-5">
              <h2 className="font-orbitron text-[1.4rem] font-extrabold text-white mb-1">
                {doc.title}
              </h2>
              <p className="font-rajdhani text-[0.8rem] tracking-[1.5px] text-[#a0a0b8] uppercase">
                {doc.effective}
              </p>
            </div>
            <div
              className="h-[1px] mb-6"
              style={{
                background:
                  "linear-gradient(90deg,rgba(0,240,255,0.3),transparent)",
              }}
            />
            {doc.body}
          </div>
        </div>

        <div className="px-8 py-4 shrink-0 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-[#a0a0b8] text-[0.8rem] text-center">
            Questions? Contact us at{" "}
            <a
              href="mailto:Cyberisetecnologies@consultant.com"
              className="text-[#00f0ff] hover:underline"
            >
              Cyberisetecnologies@consultant.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
