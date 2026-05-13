export default function StatsBar() {
  return (
    <div className="px-8 md:px-[60px] py-[40px] md:py-[60px] grid grid-cols-2 md:grid-cols-4 gap-[20px] md:gap-[40px] relative z-[2] bg-[rgba(18,18,26,0.5)] border-y border-[rgba(0,240,255,0.05)]">
      <div className="text-center p-6 md:p-[30px] rounded-[16px] bg-[rgba(0,240,255,0.02)] border border-[rgba(0,240,255,0.05)] transition-all duration-300 hover:bg-[rgba(0,240,255,0.05)] hover:border-[rgba(0,240,255,0.15)] hover:-translate-y-[5px] reveal stat-item">
        <div className="font-orbitron text-[2rem] md:text-[3rem] font-black text-gradient-1 stat-number" data-target="200" data-suffix="+">0</div>
        <div className="font-rajdhani text-[0.9rem] md:text-[1rem] text-[#a0a0b8] tracking-[2px] uppercase mt-[8px]">Projects Delivered</div>
      </div>
      <div className="text-center p-6 md:p-[30px] rounded-[16px] bg-[rgba(0,240,255,0.02)] border border-[rgba(0,240,255,0.05)] transition-all duration-300 hover:bg-[rgba(0,240,255,0.05)] hover:border-[rgba(0,240,255,0.15)] hover:-translate-y-[5px] reveal stat-item">
        <div className="font-orbitron text-[2rem] md:text-[3rem] font-black text-gradient-1 stat-number" data-target="45" data-suffix="+">0</div>
        <div className="font-rajdhani text-[0.9rem] md:text-[1rem] text-[#a0a0b8] tracking-[2px] uppercase mt-[8px]">Countries Served</div>
      </div>
      <div className="text-center p-6 md:p-[30px] rounded-[16px] bg-[rgba(0,240,255,0.02)] border border-[rgba(0,240,255,0.05)] transition-all duration-300 hover:bg-[rgba(0,240,255,0.05)] hover:border-[rgba(0,240,255,0.15)] hover:-translate-y-[5px] reveal stat-item">
        <div className="font-orbitron text-[2rem] md:text-[3rem] font-black text-gradient-1 stat-number" data-target="10" data-suffix="+">0</div>
        <div className="font-rajdhani text-[0.9rem] md:text-[1rem] text-[#a0a0b8] tracking-[2px] uppercase mt-[8px]">Years Experience</div>
      </div>
      <div className="text-center p-6 md:p-[30px] rounded-[16px] bg-[rgba(0,240,255,0.02)] border border-[rgba(0,240,255,0.05)] transition-all duration-300 hover:bg-[rgba(0,240,255,0.05)] hover:border-[rgba(0,240,255,0.15)] hover:-translate-y-[5px] reveal stat-item">
        <div className="font-orbitron text-[2rem] md:text-[3rem] font-black text-gradient-1 stat-number" data-target="500" data-suffix="+">0</div>
        <div className="font-rajdhani text-[0.9rem] md:text-[1rem] text-[#a0a0b8] tracking-[2px] uppercase mt-[8px]">Satisfied Clients</div>
      </div>
    </div>
  );
}
