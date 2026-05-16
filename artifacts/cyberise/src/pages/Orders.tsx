import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useApi, type Order, getDaysLeft, getRegionFlag } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AppShell from "@/components/AppShell";
import {
  Loader2, Server, Clock, CheckCircle, XCircle, AlertTriangle,
  Copy, Check, Eye, Ban, ChevronDown, ChevronUp, Search, Plus
} from "lucide-react";
import { toast } from "sonner";

type StatusFilter = "ALL" | "ACTIVE" | "PENDING" | "TERMINATED" | "FAILED";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  ACTIVE:     { label: "Active",     color: "#00f0ff", bg: "rgba(0,240,255,0.08)",    border: "rgba(0,240,255,0.2)",    Icon: CheckCircle },
  PENDING:    { label: "Pending",    color: "#ff8800", bg: "rgba(255,136,0,0.08)",    border: "rgba(255,136,0,0.2)",    Icon: Clock },
  TERMINATED: { label: "Terminated", color: "#555",    bg: "rgba(255,255,255,0.04)",  border: "rgba(255,255,255,0.08)", Icon: XCircle },
  FAILED:     { label: "Failed",     color: "#ff4444", bg: "rgba(255,68,68,0.08)",    border: "rgba(255,68,68,0.2)",    Icon: AlertTriangle },
};

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(`${label} copied`);
  };
  return (
    <div className="flex items-center gap-2 bg-[#0a0a0f] rounded-lg px-3 py-2.5 border border-[rgba(255,255,255,0.06)]">
      <div className="flex-1 min-w-0">
        <p className="text-[#555] text-[9px] uppercase tracking-[1px] font-rajdhani mb-0.5">{label}</p>
        <p className="text-white text-xs font-mono truncate">{value || "N/A"}</p>
      </div>
      <button onClick={copy} className="flex-shrink-0 text-[#555] hover:text-[#00f0ff] transition-colors">
        {copied ? <Check className="w-3.5 h-3.5 text-[#00f0ff]" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function OrderCard({ order, onTerminate }: { order: Order; onTerminate: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.FAILED;
  const isPro = order.tier === "pro";
  const canTerminate = order.status === "ACTIVE" || order.status === "PENDING";
  const hasCredentials = !!(order.ip && order.rdpUsername);
  const daysLeft = order.expiresAt ? getDaysLeft(order.expiresAt) : null;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-[#0d0d14] overflow-hidden transition-all hover:border-[rgba(0,240,255,0.15)]"
        style={{ borderColor: expanded ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.07)" }}
      >
        <div
          className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isPro ? "bg-[rgba(123,47,247,0.1)]" : "bg-[rgba(0,240,255,0.07)]"
          }`}>
            <Server className={`${isPro ? "text-[#a855f7]" : "text-[#00f0ff]"}`} style={{ width: 16, height: 16 }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-white text-sm font-medium font-rajdhani">{order.plan}</p>
              <span className={`text-[9px] font-bold tracking-[1.5px] px-1.5 py-0.5 rounded border font-rajdhani uppercase flex-shrink-0 ${
                isPro
                  ? "bg-[rgba(123,47,247,0.1)] text-[#a855f7] border-[rgba(123,47,247,0.2)]"
                  : "bg-[rgba(0,240,255,0.06)] text-[#00f0ff] border-[rgba(0,240,255,0.15)]"
              }`}>
                {isPro ? "⚡ Pro" : "Basic"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-rajdhani font-bold uppercase"
                style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                {order.status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: cfg.color }} />}
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#555] text-xs flex-wrap">
              <span>{getRegionFlag(order.region?.split("-")[0])} {order.region}</span>
              {order.ip && <span className="font-mono">{order.ip}</span>}
              <span>${Number(order.amount).toFixed(2)}</span>
              {daysLeft !== null && order.status === "ACTIVE" && (
                <span className={daysLeft <= 3 ? "text-[#ff4444]" : daysLeft <= 7 ? "text-[#ff8800]" : "text-[#555]"}>
                  {daysLeft}d left
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[#555] text-[10px] hidden sm:block">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-[rgba(255,255,255,0.06)]"
            >
              <div className="px-4 py-4 space-y-4">
                {hasCredentials ? (
                  <div className="space-y-2">
                    <p className="text-[#a0a0b8] text-xs font-rajdhani uppercase tracking-[1px] mb-2">RDP Credentials</p>
                    <CopyField value={order.ip!} label="IP Address" />
                    <CopyField value={order.rdpUsername!} label="Username" />
                    <CopyField value={order.rdpPassword || ""} label="Password" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[#666] text-sm py-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-rajdhani">Server is being provisioned — credentials will appear shortly</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-[#666]">
                  <div className="bg-[rgba(255,255,255,0.02)] rounded-lg px-3 py-2 border border-[rgba(255,255,255,0.05)]">
                    <p className="text-[#444] uppercase tracking-[1px] text-[9px] font-rajdhani mb-1">Created</p>
                    <p className="text-[#a0a0b8]">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  {order.expiresAt && (
                    <div className="bg-[rgba(255,255,255,0.02)] rounded-lg px-3 py-2 border border-[rgba(255,255,255,0.05)]">
                      <p className="text-[#444] uppercase tracking-[1px] text-[9px] font-rajdhani mb-1">Expires</p>
                      <p className={daysLeft !== null && daysLeft <= 3 ? "text-[#ff4444]" : "text-[#a0a0b8]"}>
                        {new Date(order.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {canTerminate && (
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
                      className="border-[rgba(255,68,68,0.25)] text-[#ff4444] hover:bg-[rgba(255,68,68,0.08)] hover:border-[rgba(255,68,68,0.4)] font-rajdhani uppercase tracking-[1px] text-xs"
                    >
                      <Ban className="w-3 h-3 mr-1.5" />
                      Terminate
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[#0d0d14] border border-[rgba(255,68,68,0.2)] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-orbitron">Terminate Instance?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a0a0b8]">
              This will permanently shut down <span className="text-white font-medium">{order.plan}</span>
              {order.ip && <> ({order.ip})</>}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border-[rgba(255,255,255,0.1)] text-[#a0a0b8] hover:text-white font-rajdhani">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setConfirmOpen(false); onTerminate(order.id); }}
              className="bg-[rgba(255,68,68,0.15)] border border-[rgba(255,68,68,0.3)] text-[#ff4444] hover:bg-[rgba(255,68,68,0.25)] font-rajdhani font-bold uppercase tracking-[1px]"
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FILTERS(): { label: string; value: StatusFilter }[] {
  return [
    { label: "All", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Pending", value: "PENDING" },
    { label: "Terminated", value: "TERMINATED" },
    { label: "Failed", value: "FAILED" },
  ];
}

function OrdersContent() {
  const { api } = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [terminating, setTerminating] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const response = await api<{ success: boolean; data: Order[] }>("/orders");
      setOrders(response.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function terminateOrder(orderId: string) {
    try {
      setTerminating(orderId);
      await api(`/orders/${orderId}/terminate`, { method: "POST" });
      toast.success("Server terminated");
      await loadOrders();
    } catch {
      toast.error("Failed to terminate server");
    } finally {
      setTerminating(null);
    }
  }

  const displayed = orders.filter(o => {
    const matchFilter = filter === "ALL" || o.status === filter;
    const matchSearch = !search.trim() || [o.plan, o.ip, o.region]
      .filter(Boolean).some(v => v!.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
            <p className="text-[#a0a0b8] text-sm font-rajdhani tracking-widest uppercase">Loading orders...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[#0a0a0f] py-8 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-white mb-1">
            My <span className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] bg-clip-text text-transparent">Orders</span>
          </h1>
          <p className="text-[#a0a0b8] text-sm font-rajdhani">Manage and monitor your deployed servers.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by plan, IP, region..."
              className="w-full bg-[#0d0d14] border border-[rgba(255,255,255,0.07)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[rgba(0,240,255,0.3)] transition-colors font-rajdhani"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS().map(({ label, value }) => {
              const count = value === "ALL" ? orders.length : (counts[value] || 0);
              const active = filter === value;
              const cfg = STATUS_CONFIG[value];
              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-[1px] border transition-all ${
                    active
                      ? value === "ALL"
                        ? "bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)] text-white"
                        : ""
                      : "bg-transparent border-[rgba(255,255,255,0.06)] text-[#666] hover:text-[#a0a0b8] hover:border-[rgba(255,255,255,0.12)]"
                  }`}
                  style={active && cfg ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                >
                  {value === "ACTIVE" && active && <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: STATUS_CONFIG.ACTIVE.color }} />}
                  {label}
                  <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center mx-auto mb-4">
              <Server className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-white font-semibold font-rajdhani mb-1">
              {search ? "No results found" : "No orders yet"}
            </p>
            <p className="text-[#555] text-sm mb-5">
              {search ? "Try a different search term" : "Deploy your first server to get started."}
            </p>
            {!search && (
              <Link href="/market">
                <Button className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] text-[#0a0a0f] font-rajdhani font-bold uppercase tracking-[1.5px] hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Deploy Server
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="space-y-2"
          >
            {displayed.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onTerminate={terminateOrder}
              />
            ))}
          </motion.div>
        )}

        {terminating && (
          <div className="fixed bottom-5 right-5 flex items-center gap-2 bg-[#0d0d14] border border-[rgba(255,68,68,0.2)] rounded-xl px-4 py-3 z-50">
            <Loader2 className="w-4 h-4 animate-spin text-[#ff4444]" />
            <span className="text-[#ff4444] text-sm font-rajdhani">Terminating server...</span>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function Orders() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
