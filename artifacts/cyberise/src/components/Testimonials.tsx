import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const testimonials = [
    {
      text: "Cyberise completely overhauled our government agency's digital infrastructure. Their red team exposed critical vulnerabilities we didn't know existed.",
      author: "Director of Defense Tech",
      role: "GOVERNMENT AGENCY",
    },
    {
      text: "The web application they built for our fintech startup handles millions of transactions with zero downtime and ironclad security.",
      author: "Chief Technology Officer",
      role: "GLOBAL FINTECH FIRM",
    },
    {
      text: "Their bandit tracking intelligence system is unparalleled. It provided real-time actionable data that completely changed our operational success rate.",
      author: "Head of Operations",
      role: "SECURITY CONTRACTOR",
    },
  ];

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, testimonials.length]);

  return (
    <section id="testimonials">
      <div className="text-center mb-[80px] reveal">
        <div className="inline-block font-rajdhani text-[0.85rem] font-semibold tracking-[3px] uppercase text-[#00f0ff] mb-[20px] relative before:content-['—'] before:mx-[10px] before:text-[rgba(0,240,255,0.4)] after:content-['—'] after:mx-[10px] after:text-[rgba(0,240,255,0.4)]">
          Clearance Level: UNRESTRICTED
        </div>
        <h2 className="font-orbitron text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.2] mb-[20px]">
          Client <span className="text-gradient-1">Debriefs</span>
        </h2>
      </div>

      <div
        className="max-w-[900px] mx-auto relative reveal"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-[30px] md:p-[50px] bg-[rgba(18,18,26,0.6)] border border-[rgba(0,240,255,0.08)] rounded-[24px] backdrop-blur-[20px] text-center min-h-[300px] flex flex-col justify-center">
          <div className="text-[3rem] text-[#00f0ff] opacity-30 mb-[10px] leading-none">
            "
          </div>
          <p className="text-[1.1rem] md:text-[1.2rem] leading-[1.8] text-[#a0a0b8] mb-[30px] italic transition-opacity duration-500">
            {testimonials[activeIndex].text}
          </p>
          <div>
            <div className="font-orbitron text-[1rem] font-bold mb-[5px] text-white">
              {testimonials[activeIndex].author}
            </div>
            <div className="font-rajdhani text-[#00f0ff] text-[0.9rem] tracking-[1px] uppercase">
              {testimonials[activeIndex].role}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-[12px] mt-[30px]">
          {testimonials.map((_, i) => (
            <div
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "w-[12px] h-[12px] rounded-full cursor-pointer transition-all duration-300",
                i === activeIndex
                  ? "bg-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                  : "bg-[rgba(0,240,255,0.2)] hover:bg-[rgba(0,240,255,0.5)]",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
