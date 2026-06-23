import { motion } from "framer-motion";
import { Cpu, HardDrive, Server } from "lucide-react";

interface PlanCardProps {
  plan: {
    id: string;
    label: string;
    price: {
      hourly: number;
      monthly: number;
    };
    vcpus: number;
    ram: number;
    disk: number;
    tier: "basic" | "pro";
  };
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

export function PlanCard({
  plan,
  selected,
  onSelect,
  disabled,
  comingSoon,
}: PlanCardProps) {
  const isPro = plan.tier === "pro";

  return (
    <motion.div
      whileHover={disabled ? {} : { y: -4, scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onSelect}
      className={`relative p-4 rounded-xl border-2 transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed border-[#ffffff0a] bg-[#0d0d14]"
          : selected
            ? isPro
              ? "border-[#7b2ff7] bg-[rgba(123,47,247,0.08)] cursor-pointer"
              : "border-[#00f0ff] bg-[rgba(0,240,255,0.06)] cursor-pointer"
            : "border-[#ffffff0a] bg-[#0d0d14] hover:border-[#ffffff1a] cursor-pointer"
      }`}
    >
      {comingSoon && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d14]/80 rounded-xl z-10">
          <div className="text-center">
            <span className="text-2xl">🚧</span>
            <p className="text-[#a0a0b8] text-sm mt-2 font-rajdhani">
              Coming Soon
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-[10px] font-bold tracking-[1.5px] uppercase px-2 py-1 rounded-md font-rajdhani ${
            isPro
              ? "bg-[rgba(123,47,247,0.15)] text-[#a855f7] border border-[rgba(123,47,247,0.25)]"
              : "bg-[rgba(0,240,255,0.08)] text-[#00f0ff] border border-[rgba(0,240,255,0.2)]"
          }`}
        >
          {isPro ? "⚡ Pro" : "Basic"}
        </span>
        {selected && !comingSoon && (
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${
              isPro ? "bg-[#7b2ff7]" : "bg-[#00f0ff]"
            }`}
          >
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>

      <h3 className="text-white font-semibold text-sm mb-1 font-rajdhani">
        {plan.label}
      </h3>
      <div
        className={`text-xl font-bold font-orbitron mb-3 ${
          isPro ? "text-[#a855f7]" : "text-[#00f0ff]"
        }`}
      >
        ${plan.price.monthly.toFixed(2)}
        <span className="text-[#666] text-xs font-sans font-normal">/mo</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { Icon: Cpu, val: `${plan.vcpus} vCPU` },
          {
            Icon: HardDrive,
            val: `${(plan.ram / 1024).toFixed(plan.ram < 1024 ? 1 : 0)}GB RAM`,
          },
          { Icon: Server, val: `${Math.round(plan.disk / 1024)}GB SSD` },
        ].map(({ Icon, val }) => (
          <div
            key={val}
            className="flex flex-col items-center gap-1 bg-[rgba(255,255,255,0.03)] rounded-lg py-2 px-1"
          >
            <Icon className="w-3.5 h-3.5 text-[#666]" />
            <span className="text-[10px] text-[#a0a0b8] font-medium leading-none">
              {val}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
