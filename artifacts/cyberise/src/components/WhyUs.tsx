export default function WhyUs() {
  const reasons = [
    {
      num: "01",
      title: "Elite Expertise",
      desc: "Our team consists of certified offensive security professionals, ex-intelligence operators, and master developers.",
    },
    {
      num: "02",
      title: "Global Reach",
      desc: "Based in Nigeria, delivering to 45+ countries. We understand global standards and local operational challenges.",
    },
    {
      num: "03",
      title: "Zero Trust Security",
      desc: "Every application we build and system we deploy is architected with a military-grade zero-trust framework.",
    },
    {
      num: "04",
      title: "Rapid Delivery",
      desc: "In the digital frontier, speed is survival. We deploy complex systems and execute operations faster than the industry average.",
    },
  ];

  return (
    <section
      id="why-us"
      className="bg-[rgba(18,18,26,0.3)] border-y border-[rgba(0,240,255,0.05)]"
    >
      <div className="text-center mb-[80px] reveal">
        <div className="inline-block font-rajdhani text-[0.85rem] font-semibold tracking-[3px] uppercase text-[#00f0ff] mb-[20px] relative before:content-['—'] before:mx-[10px] before:text-[rgba(0,240,255,0.4)] after:content-['—'] after:mx-[10px] after:text-[rgba(0,240,255,0.4)]">
          The Cyberise Advantage
        </div>
        <h2 className="font-orbitron text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.2] mb-[20px]">
          Why Choose <span className="text-gradient-1">Us</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px] max-w-[1400px] mx-auto">
        {reasons.map((r, i) => (
          <div
            key={i}
            className="p-[40px_30px] rounded-[20px] bg-[rgba(10,10,15,0.8)] border border-[rgba(255,255,255,0.05)] relative overflow-hidden transition-all duration-400 hover:-translate-y-[5px] hover:border-[rgba(0,240,255,0.3)] hover:shadow-[0_10px_30px_rgba(0,240,255,0.1)] hover:bg-[linear-gradient(to_bottom,rgba(0,240,255,0.05),rgba(10,10,15,0.9))] reveal"
          >
            <div className="absolute top-[20px] right-[20px] font-orbitron text-[4rem] font-black text-[rgba(255,255,255,0.03)] leading-none select-none transition-all duration-400">
              {r.num}
            </div>
            <h4 className="font-orbitron text-[1rem] font-bold mb-[12px] relative z-[2] text-white">
              {r.title}
            </h4>
            <p className="text-[#a0a0b8] text-[0.9rem] leading-[1.6] relative z-[2]">
              {r.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
