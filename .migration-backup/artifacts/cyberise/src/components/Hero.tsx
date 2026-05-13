import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative px-8 md:px-[60px] perspective-[1000px] pt-32" id="hero">
      <div className="grid-bg"></div>
      <div className="absolute rounded-[20px] backdrop-blur-[10px] animate-[float_6s_ease-in-out_infinite] w-[120px] h-[120px] bg-[linear-gradient(135deg,rgba(0,240,255,0.1),rgba(123,47,247,0.1))] border border-[rgba(0,240,255,0.15)] top-[15%] left-[8%] [animation-delay:0s] rotate-[15deg] hidden md:block"></div>
      <div className="absolute rounded-[20px] backdrop-blur-[10px] animate-[float_6s_ease-in-out_infinite] w-[80px] h-[80px] bg-[linear-gradient(135deg,rgba(123,47,247,0.1),rgba(255,45,85,0.1))] border border-[rgba(123,47,247,0.15)] top-[25%] right-[10%] [animation-delay:2s] -rotate-[20deg] hidden md:block"></div>
      <div className="absolute rounded-[20px] backdrop-blur-[10px] animate-[float_6s_ease-in-out_infinite] w-[60px] h-[60px] bg-[linear-gradient(135deg,rgba(255,45,85,0.1),rgba(0,240,255,0.1))] border border-[rgba(255,45,85,0.15)] bottom-[20%] left-[12%] [animation-delay:4s] rotate-[45deg] hidden md:block"></div>

      <div className="text-center relative z-[2] max-w-[1000px] w-full">
        <div className="inline-flex items-center gap-[10px] px-[24px] py-[8px] bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.2)] rounded-full font-rajdhani text-[0.85rem] font-semibold tracking-[2px] uppercase text-[#00f0ff] mb-[30px] animate-[fadeInDown_1s_ease_0.5s_both]">
          <span className="w-2 h-2 bg-[#00f0ff] rounded-full animate-[blink_1.5s_ease-in-out_infinite]"></span>
          Securing The Digital Frontier
        </div>
        
        <h1 className="font-orbitron text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-[1.1] mb-[25px] animate-[fadeInUp_1s_ease_0.7s_both]">
          <span className="block text-white">We Build.</span>
          <span className="block text-gradient-1">We Secure.</span>
          <span className="block text-gradient-2 glitch" data-text="We Dominate.">We Dominate.</span>
        </h1>
        
        <p className="text-[1.1rem] md:text-[1.2rem] text-[#a0a0b8] max-w-[650px] mx-auto mb-[40px] leading-[1.8] animate-[fadeInUp_1s_ease_0.9s_both]">
          Cyberise Technology is a global powerhouse in digital solutions — from cutting-edge web & mobile development to elite cybersecurity, government consultancy, and intelligence-grade tracking systems across Africa.
        </p>
        
        <div className="flex gap-[20px] justify-center flex-wrap animate-[fadeInUp_1s_ease_1.1s_both]">
          <a href="#contact" className="btn-primary flex items-center gap-2 group">
            Start A Project <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="#services" className="btn-outline">
            Explore Services
          </a>
        </div>
      </div>

      <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-[10px] animate-[fadeIn_1s_ease_1.5s_both]">
        <span className="font-rajdhani text-[0.75rem] tracking-[3px] uppercase text-[#a0a0b8]">Scroll</span>
        <div className="w-[1px] h-[60px] bg-gradient-to-b from-[#00f0ff] to-transparent animate-[scroll-pulse_2s_ease-in-out_infinite]"></div>
      </div>
    </section>
  );
}
