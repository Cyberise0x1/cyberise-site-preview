import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useApi, type Order, getDaysLeft, getRegionFlag } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import {
  Loader2, Server, CreditCard, Clock, Plus, ExternalLink,
  Zap, AlertTriangle, Activity, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

function CountUp({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (to === 0) { setVal(0); return; }
    const steps = 30;
    const increment = to / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= to) { setVal(to); clearInterval(timer); }
      else setVal(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [to, duration]);
  return <>{val}</>;
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const days = getDaysLeft(expiresAt);
  const urgent = days <= 3;
  const warning = days <= 7;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-rajdhani font-bold tracking-[1px] uppercase px-2 py-0.5 rounded-full border ${
      urgent
        ? "bg-[rgba(255,68,68,0.1)] text-[#ff4444] border-[rgba(255,68,68,0.2)]"
        : warning
        ? "bg-[rgba(255,136,0,0.1)] text-[#ff8800] border-[rgba(255,136,0,0.2)]"
        : "bg-[rgba(0,240,255,0.08)] text-[#00f0ff] border-[rgba(0,240,255,0.15)]"
    }`}>
      <Clock className="w-2.5 h-2.5" />
      {days}d left
    </span>
  );
}

function InstanceRow({ order }: { order: Order }) {
  const isPro = order.tier === "pro";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(0,240,255,0.2)] hover:bg-[rgba(0,240,255,0.02)] transition-all group"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isPro ? "bg-[rgba(123,47,247,0.12)]" : "bg-[rgba(0,240,255,0.08)]"
      }`}>
        <Server className={`w-4.5 h-4.5 ${isPro ? "text-[#a855f7]" : "text-[#00f0ff]"}`} style={{ width: 18, height: 18 }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-white text-sm font-medium font-rajdhani truncate">{order.plan}</p>
          <span className={`text-[9px] font-bold tracking-[1.5px] uppercase px-1.5 py-0.5 rounded font-rajdhani border flex-shrink-0 ${
            isPro
              ? "bg-[rgba(123,47,247,0.12)] text-[#a855f7] border-[rgba(123,47,247,0.2)]"
              : "bg-[rgba(0,240,255,0.06)] text-[#00f0ff] border-[rgba(0,240,255,0.15)]"
          }`}>
            {isPro ? "⚡ Pro" : "Basic"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[#666] text-xs">
          <span>{getRegionFlag(order.region.split("-")[0])} {order.region}</span>
          {order.ip && <><span>·</span><span className="font-mono">{order.ip}</span></>}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
          <span className="text-[#00f0ff] text-[10px] font-rajdhani uppercase tracking-[1px]">Active</span>
        </div>
        {order.expiresAt && <ExpiryBadge expiresAt={order.expiresAt} />}
        <Link href="/orders">
          <ExternalLink className="w-3.5 h-3.5 text-[#555] hover:text-[#00f0ff] cursor-pointer transition-colors opacity-0 group-hover:opacity-100" />
        </Link>
      </div>
    </motion.div>
  );
}

function DashboardContent() {
  const { api } = useApi();
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const response = await api<{ success: boolean; data: Order[] }>("/orders");
      setOrders(response.data);
    } catch {
      toast.error("Failed to load instances");
    } finally {
      setLoading(false);
    }
  }

  const active = orders.filter(o => o.status === "ACTIVE");
  const pending = orders.filter(o => o.status === "PENDING");
  const expiringSoon = active.filter(o => o.expiresAt && getDaysLeft(o.expiresAt) <= 7);

  const stats = [
    {
      label: "Active Instances", value: active.length, Icon: Activity,
      color: "#00f0ff", bg: "rgba(0,240,255,0.08)", border: "rgba(0,240,255,0.15)",
    },
    {
      label: "Total Orders", value: orders.length, Icon: CreditCard,
      color: "#7b2ff7", bg: "rgba(123,47,247,0.08)", border: "rgba(123,47,247,0.15)",
    },
    {
      label: "Expiring Soon", value: expiringSoon.length, Icon: AlertTriangle,
      color: expiringSoon.length > 0 ? "#ff8800" : "#555",
      bg: expiringSoon.length > 0 ? "rgba(255,136,0,0.08)" : "rgba(255,255,255,0.03)",
      border: expiringSoon.length > 0 ? "rgba(255,136,0,0.2)" : "rgba(255,255,255,0.06)",
    },
  ];

  const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
  const item = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
            <p className="text-[#a0a0b8] text-sm font-rajdhani tracking-widest uppercase">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[#0a0a0f] py-8 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-[#a0a0b8] text-sm font-rajdhani mb-1">
            Welcome back, <span className="text-white">{user?.firstName || "User"}</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-white">
            Control <span className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] bg-clip-text text-transparent">Panel</span>
          </h1>
        </motion.div>

        <motion.div variants={stagger} initial="initial" animate="animate" className="grid sm:grid-cols-3 gap-4 mb-8">
          {stats.map(({ label, value, Icon, color, bg, border }) => (
            <motion.div key={label} variants={item}>
              <div className="rounded-xl p-5 border" style={{ background: bg, borderColor: border }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="w-4.5 h-4.5" style={{ color, width: 18, height: 18 }} />
                  </div>
                  <span className="text-[#a0a0b8] text-xs font-rajdhani uppercase tracking-[1px]">{label}</span>
                </div>
                <div className="text-3xl font-bold font-orbitron" style={{ color }}>
                  <CountUp to={value} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex gap-3 mb-8">
          <Link href="/market">
            <Button className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] text-[#0a0a0f] font-rajdhani font-bold uppercase tracking-[1.5px] hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Deploy New
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="border-[rgba(255,255,255,0.1)] text-[#a0a0b8] hover:text-white hover:border-[rgba(0,240,255,0.3)] font-rajdhani uppercase tracking-[1px]">
              View Orders
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#00f0ff]" />
              <h2 className="text-white font-semibold font-rajdhani tracking-wide">Active Instances</h2>
              {active.length > 0 && (
                <span className="bg-[rgba(0,240,255,0.1)] text-[#00f0ff] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[rgba(0,240,255,0.2)]">
                  {active.length}
                </span>
              )}
            </div>
          </div>

          {pending.length > 0 && (
            <div className="flex items-center gap-2 bg-[rgba(255,136,0,0.06)] border border-[rgba(255,136,0,0.15)] rounded-xl px-4 py-3 mb-4">
              <Clock className="w-4 h-4 text-[#ff8800] flex-shrink-0" />
              <p className="text-[#ff8800] text-sm font-rajdhani">
                {pending.length} order{pending.length > 1 ? "s" : ""} provisioning — usually ready in 2–5 minutes
              </p>
            </div>
          )}

          {active.length === 0 && pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgba(255,255,255,0.1)] p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(0,240,255,0.05)] border border-[rgba(0,240,255,0.1)] flex items-center justify-center mx-auto mb-4">
                <Server className="w-6 h-6 text-[#333]" />
              </div>
              <p className="text-white font-semibold mb-1 font-rajdhani">No active servers yet</p>
              <p className="text-[#666] text-sm mb-5">Deploy your first server and get credentials instantly.</p>
              <Link href="/market">
                <Button className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] text-[#0a0a0f] font-rajdhani font-bold uppercase tracking-[1.5px] hover:opacity-90">
                  <Zap className="w-4 h-4 mr-2" />
                  Browse Servers
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {active.map(order => <InstanceRow key={order.id} order={order} />)}
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
