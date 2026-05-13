import { Twitter, Linkedin, Github, MessageSquare } from "lucide-react";
import type { LegalTab } from "./LegalModal";

interface FooterProps {
  onOpenLegal: (tab: LegalTab) => void;
}

export default function Footer({ onOpenLegal }: FooterProps) {
  return (
    <footer className="pt-[80px] pb-[30px] px-8 md:px-[60px] relative z-[2] border-t border-[rgba(0,240,255,0.08)] bg-[#0a0a0f]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-[40px] lg:gap-[60px] max-w-[1400px] mx-auto mb-[60px]">
        
        <div>
          <a href="#" className="font-orbitron text-[1.8rem] font-extrabold tracking-[2px] text-gradient-1 no-underline inline-block mb-[20px]">
            CYBERISE <span className="font-normal text-[1.4rem] !text-white !bg-none" style={{ WebkitTextFillColor: "white" }}>TECHNOLOGY</span>
          </a>
          <p className="text-[#a0a0b8] leading-[1.8] text-[0.95rem] max-w-[350px]">
            The elite force in global digital solutions and offensive cybersecurity. Securing the present, building the future.
          </p>
          <div className="flex gap-[15px] mt-[25px]">
            <a href="#" className="w-[45px] h-[45px] rounded-[12px] bg-[rgba(0,240,255,0.05)] border border-[rgba(0,240,255,0.1)] flex items-center justify-center text-[#a0a0b8] transition-all hover:bg-[rgba(0,240,255,0.15)] hover:border-[#00f0ff] hover:text-[#00f0ff] hover:-translate-y-[3px]">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-[45px] h-[45px] rounded-[12px] bg-[rgba(0,240,255,0.05)] border border-[rgba(0,240,255,0.1)] flex items-center justify-center text-[#a0a0b8] transition-all hover:bg-[rgba(0,240,255,0.15)] hover:border-[#00f0ff] hover:text-[#00f0ff] hover:-translate-y-[3px]">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="w-[45px] h-[45px] rounded-[12px] bg-[rgba(0,240,255,0.05)] border border-[rgba(0,240,255,0.1)] flex items-center justify-center text-[#a0a0b8] transition-all hover:bg-[rgba(0,240,255,0.15)] hover:border-[#00f0ff] hover:text-[#00f0ff] hover:-translate-y-[3px]">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="w-[45px] h-[45px] rounded-[12px] bg-[rgba(0,240,255,0.05)] border border-[rgba(0,240,255,0.1)] flex items-center justify-center text-[#a0a0b8] transition-all hover:bg-[rgba(0,240,255,0.15)] hover:border-[#00f0ff] hover:text-[#00f0ff] hover:-translate-y-[3px]">
              <MessageSquare className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-orbitron text-[0.9rem] font-bold tracking-[2px] uppercase mb-[25px] text-white">Services</h4>
          <ul className="flex flex-col gap-[12px] list-none">
            <li><a href="#" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">Web Development</a></li>
            <li><a href="#" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">Mobile Applications</a></li>
            <li><a href="#" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">Penetration Testing</a></li>
            <li><a href="#" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">Govt Consultancy</a></li>
            <li><a href="#" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">Hardware Procurement</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-orbitron text-[0.9rem] font-bold tracking-[2px] uppercase mb-[25px] text-white">Company</h4>
          <ul className="flex flex-col gap-[12px] list-none">
            <li><a href="#about" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">About Us</a></li>
            <li><a href="#projects" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">Our Projects</a></li>
            <li><a href="#why-us" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">Why Cyberise</a></li>
            <li><a href="#" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">Careers</a></li>
            <li><a href="#contact" className="text-[#a0a0b8] text-[0.95rem] hover:text-[#00f0ff] hover:pl-[5px] transition-all inline-block">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-orbitron text-[0.9rem] font-bold tracking-[2px] uppercase mb-[25px] text-white">Legal</h4>
          <ul className="flex flex-col gap-[12px] list-none">
            {(
              [
                { tab: "privacy" as LegalTab, label: "Privacy Policy" },
                { tab: "terms" as LegalTab, label: "Terms of Service" },
                { tab: "nda" as LegalTab, label: "NDA Information" },
                { tab: "cookies" as LegalTab, label: "Cookie Policy" },
              ] as const
            ).map(({ tab, label }) => (
              <li key={tab}>
                <button
                  onClick={() => onOpenLegal(tab)}
                  className="group flex items-center gap-[8px] text-[0.95rem] font-medium transition-all text-left"
                  style={{ color: "#00f0ff" }}
                >
                  <span
                    className="inline-block w-[6px] h-[6px] rounded-full shrink-0 transition-all group-hover:scale-[1.4]"
                    style={{ background: "#00f0ff", boxShadow: "0 0 6px rgba(0,240,255,0.7)" }}
                  />
                  <span className="relative">
                    {label}
                    <span
                      className="absolute bottom-0 left-0 h-[1px] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                      style={{ background: "linear-gradient(90deg,#00f0ff,#7b2ff7)" }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className="pt-[30px] border-t border-[rgba(255,255,255,0.05)] flex flex-col md:flex-row items-center justify-between gap-[15px] max-w-[1400px] mx-auto text-center md:text-left">
        <p className="text-[#a0a0b8] text-[0.85rem]">
          © 2025 Cyberise Technology. All Rights Reserved.
        </p>
        <p className="text-[#a0a0b8] text-[0.85rem]">
          System Status: <span className="text-[#00f0ff]">SECURE & ONLINE</span>
        </p>
      </div>
    </footer>
  );
}
