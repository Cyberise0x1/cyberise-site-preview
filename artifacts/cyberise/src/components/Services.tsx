import {
  Globe,
  Smartphone,
  Building2,
  Shield,
  Target,
  Crosshair,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    title: "Web & Web App Development",
    desc: "Enterprise-grade websites and progressive web applications built with cutting-edge frameworks. Scalable, secure, and blazing fast for global audiences.",
    icon: Globe,
    color: "primary",
    glow: "glow-primary",
  },
  {
    title: "Android & iOS Apps",
    desc: "Native and cross-platform mobile applications designed for performance. From fintech to healthcare — we build apps that millions of users love.",
    icon: Smartphone,
    color: "secondary",
    glow: "glow-secondary",
  },
  {
    title: "Government Consultancy",
    desc: "Strategic technology consultancy for government bodies. We advise on digital transformation, secure infrastructure, and large-scale tech contracts.",
    icon: Building2,
    color: "accent",
    glow: "glow-primary",
  },
  {
    title: "Cyber Equipment Procurement",
    desc: "We source, supply, and deploy enterprise cybersecurity hardware and software. Firewalls, IDS/IPS, surveillance systems, and more — globally.",
    icon: Shield,
    color: "primary",
    glow: "glow-secondary",
  },
  {
    title: "Red Team & Penetration Testing",
    desc: "Legally authorized offensive security operations. We simulate real-world attacks to expose vulnerabilities before malicious actors do. Certified. Trusted.",
    icon: Target,
    color: "accent",
    glow: "glow-primary",
  },
  {
    title: "Threat & Bandit Tracking",
    desc: "Advanced intelligence tracking systems designed for law enforcement and defense agencies to monitor, trace, and neutralize organized crime networks.",
    icon: Crosshair,
    color: "secondary",
    glow: "glow-primary",
  },
];

export default function Services() {
  return (
    <section id="services">
      <div className="text-center mb-[80px] reveal">
        <div className="inline-block font-rajdhani text-[0.85rem] font-semibold tracking-[3px] uppercase text-[#00f0ff] mb-[20px] relative before:content-['—'] before:mx-[10px] before:text-[rgba(0,240,255,0.4)] after:content-['—'] after:mx-[10px] after:text-[rgba(0,240,255,0.4)]">
          What We Do
        </div>
        <h2 className="font-orbitron text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.2] mb-[20px]">
          Our Core <span className="text-gradient-1">Services</span>
        </h2>
        <p className="text-[1.1rem] text-[#a0a0b8] max-w-[600px] mx-auto leading-[1.7]">
          From concept to deployment, we deliver end-to-end digital solutions
          that transform businesses and secure nations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px] max-w-[1400px] mx-auto">
        {services.map((s, i) => {
          const Icon = s.icon;

          let gradientClass = "bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)]";
          let iconBg =
            "bg-[rgba(0,240,255,0.08)] border-[rgba(0,240,255,0.15)] text-[#00f0ff]";
          let shadowClass =
            "hover:shadow-[0_30px_60px_rgba(0,0,0,0.3),0_0_30px_rgba(0,240,255,0.3)]";

          if (s.color === "secondary") {
            gradientClass = "bg-[linear-gradient(135deg,#7b2ff7,#ff2d55)]";
            iconBg =
              "bg-[rgba(123,47,247,0.08)] border-[rgba(123,47,247,0.15)] text-[#7b2ff7]";
            shadowClass =
              "hover:shadow-[0_30px_60px_rgba(0,0,0,0.3),0_0_30px_rgba(123,47,247,0.3)]";
          } else if (s.color === "accent") {
            gradientClass = "bg-[linear-gradient(135deg,#ff2d55,#00f0ff)]";
            iconBg =
              "bg-[rgba(255,45,85,0.08)] border-[rgba(255,45,85,0.15)] text-[#ff2d55]";
            shadowClass =
              "hover:shadow-[0_30px_60px_rgba(0,0,0,0.3),0_0_30px_rgba(255,45,85,0.3)]";
          }

          if (s.glow === "glow-secondary") {
            shadowClass =
              "hover:shadow-[0_30px_60px_rgba(0,0,0,0.3),0_0_30px_rgba(123,47,247,0.3)]";
          }

          return (
            <div
              key={i}
              className={cn(
                "p-[50px_40px] bg-[rgba(18,18,26,0.6)] border border-[rgba(255,255,255,0.05)] rounded-[20px] backdrop-blur-[20px] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden group hover:-translate-y-[10px] hover:border-[rgba(0,240,255,0.2)] reveal",
                shadowClass,
              )}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  gradientClass,
                )}
              ></div>

              <div
                className={cn(
                  "w-[70px] h-[70px] rounded-[16px] flex items-center justify-center mb-[25px] border transition-transform duration-300 group-hover:scale-110",
                  iconBg,
                )}
              >
                <Icon size={32} />
              </div>

              <h3 className="font-orbitron text-[1.2rem] font-bold mb-[15px] text-white">
                {s.title}
              </h3>

              <p className="text-[#a0a0b8] leading-[1.7] text-[0.95rem]">
                {s.desc}
              </p>

              <a
                href="#contact"
                className="inline-flex items-center gap-[8px] mt-[20px] text-[#00f0ff] no-underline font-rajdhani font-semibold tracking-[1px] uppercase text-[0.9rem] transition-all duration-300 hover:gap-[15px] group/link"
              >
                Learn More{" "}
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
