export default function Projects() {
  const projects = [
    {
      tag: "Web Platform",
      title: "Government Digital Portal",
      bg: "bg-[linear-gradient(to_bottom,rgba(18,18,26,0.2),rgba(10,10,15,1)),linear-gradient(45deg,#002233,#001122)]",
    },
    {
      tag: "Cybersecurity",
      title: "Enterprise Red Team Operation",
      bg: "bg-[linear-gradient(to_bottom,rgba(18,18,26,0.2),rgba(10,10,15,1)),linear-gradient(45deg,#220011,#110000)]",
    },
    {
      tag: "Intelligence",
      title: "Real-Time Tracking System",
      bg: "bg-[linear-gradient(to_bottom,rgba(18,18,26,0.2),rgba(10,10,15,1)),linear-gradient(45deg,#110033,#000022)]",
    },
  ];

  return (
    <section id="projects">
      <div className="text-center mb-[80px] reveal">
        <div className="inline-block font-rajdhani text-[0.85rem] font-semibold tracking-[3px] uppercase text-[#00f0ff] mb-[20px] relative before:content-['—'] before:mx-[10px] before:text-[rgba(0,240,255,0.4)] after:content-['—'] after:mx-[10px] after:text-[rgba(0,240,255,0.4)]">
          Recent Missions
        </div>
        <h2 className="font-orbitron text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.2] mb-[20px]">
          Classified <span className="text-gradient-2">Deployments</span>
        </h2>
        <p className="text-[1.1rem] text-[#a0a0b8] max-w-[600px] mx-auto leading-[1.7]">
          We let our work speak for itself. Here is a glimpse into our
          high-stakes operations and digital builds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[40px] max-w-[1400px] mx-auto">
        {projects.map((p, i) => (
          <div
            key={i}
            className={`h-[400px] rounded-[24px] overflow-hidden relative group cursor-pointer border border-[rgba(255,255,255,0.05)] reveal ${p.bg}`}
          >
            <div className="absolute inset-0 bg-black/20 transition-opacity duration-500 group-hover:opacity-0"></div>
            <div className="absolute inset-0 border-[2px] border-transparent transition-colors duration-500 rounded-[24px] group-hover:border-[#00f0ff]/30"></div>

            <div className="absolute bottom-0 left-0 w-full p-[40px] transform translate-y-[20px] transition-transform duration-500 group-hover:translate-y-0">
              <span className="px-[12px] py-[6px] bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.2)] rounded-full text-[#00f0ff] font-rajdhani text-[0.8rem] font-bold tracking-[1px] uppercase mb-[15px] inline-block backdrop-blur-[5px]">
                {p.tag}
              </span>
              <h3 className="font-orbitron text-[1.5rem] font-bold text-white mb-[15px] leading-[1.3]">
                {p.title}
              </h3>
              <div className="w-[40px] h-[3px] bg-[#00f0ff] transition-all duration-500 group-hover:w-full group-hover:bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)]"></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
