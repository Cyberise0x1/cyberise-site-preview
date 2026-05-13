import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Preloader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  if (hidden) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100000] flex flex-col items-center justify-center transition-all duration-800 ease-in-out",
        hidden ? "opacity-0 invisible" : "bg-[#0a0a0f]"
      )}
    >
      <div className="font-orbitron text-[2.5rem] font-black text-gradient-1 mb-10 animate-[pulse-glow_2s_ease-in-out_infinite]">
        CYBERISE
      </div>
      <div className="w-[200px] h-[3px] bg-white/10 rounded-[10px] overflow-hidden">
        <div className="h-full rounded-[10px] bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)] animate-[load-bar_2s_ease-in-out_forwards]"></div>
      </div>
    </div>
  );
}
