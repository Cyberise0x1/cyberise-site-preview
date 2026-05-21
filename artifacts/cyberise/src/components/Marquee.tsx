export default function Marquee() {
  const items = [
    "Web Development",
    "Mobile Apps",
    "Penetration Testing",
    "Red Team Operations",
    "Government Consultancy",
    "Cyber Equipment",
    "Threat Intelligence",
    "Bandit Tracking",
  ];

  // Duplicate items for continuous scroll effect
  const displayItems = [...items, ...items, ...items];

  return (
    <div className="py-[30px] overflow-hidden relative z-[2] border-y border-[rgba(0,240,255,0.05)]">
      <div className="flex animate-[marquee_30s_linear_infinite] w-max">
        {displayItems.map((item, i) => (
          <div key={i} className="flex items-center">
            <div className="font-orbitron text-[1.5rem] font-bold text-[rgba(255,255,255,0.05)] whitespace-nowrap px-[50px] uppercase tracking-[5px]">
              {item}
            </div>
            {i < displayItems.length - 1 && (
              <div className="font-orbitron text-[1.5rem] font-bold text-[rgba(255,255,255,0.05)] whitespace-nowrap uppercase tracking-[5px]">
                •
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
