import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useApi } from "@/lib/api";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Server, Clock, Ban, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface AdminOrder {
  id: string;
  userId: string;
  plan: string;
  region: string;
  ip: string | null;
  status: "PENDING" | "ACTIVE" | "TERMINATED" | "FAILED";
  amount: number;
  createdAt: string;
  expiresAt: string | null;
  linodeInstanceId: number | null;
  user?: { email: string };
}

interface PaginatedOrders {
  orders: AdminOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-[#00f0ff]/10 text-[#00f0ff]",
  PENDING: "bg-[#ff8800]/10 text-[#ff8800]",
  TERMINATED: "bg-[#666]/10 text-[#666]",
  FAILED: "bg-[#ff4444]/10 text-[#ff4444]",
};

export default function AdminOrders() {
  const { api } = useApi();
  const [data, setData] = useState<PaginatedOrders | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const response = await api<{ success: boolean; data: PaginatedOrders }>(`/admin/orders?${params}`);
      setData(response.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [api, page, search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function terminateOrder(orderId: string) {
    try {
      await api(`/admin/orders?id=${orderId}`, { method: "DELETE" });
      toast.success("Order terminated");
      loadOrders();
    } catch {
      toast.error("Failed to terminate order");
    }
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Order Management</h1>
            <p className="text-[#a0a0b8]">{data?.pagination.total ?? 0} total orders</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0b8]" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-[#0a0a0f] border-[#ffffff1a] text-white w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
          </div>
        ) : data?.orders.length === 0 ? (
          <div className="text-center py-16">
            <Server className="w-12 h-12 text-[#ffffff1a] mx-auto mb-4" />
            <p className="text-[#a0a0b8]">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <Card className="bg-[#12121a]/80 border-[#ffffff1a] backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <Server className="w-5 h-5 text-[#00f0ff]" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                              {order.status}
                            </span>
                            <span className="text-white font-medium">{order.plan}</span>
                            <span className="text-[#666]">|</span>
                            <span className="text-[#a0a0b8] text-sm">{order.region}</span>
                          </div>
                          <div className="text-[#a0a0b8] text-sm space-y-0.5">
                            <p>User: {order.user?.email || order.userId.slice(0, 12)}...</p>
                            <p>IP: {order.ip || "N/A"} · Instance: {order.linodeInstanceId || "N/A"} · ${Number(order.amount).toFixed(2)}</p>
                            <p className="flex items-center gap-1 text-xs">
                              <Clock className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleDateString()}
                              {order.expiresAt && ` → ${new Date(order.expiresAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#666] text-xs font-mono">{order.id.slice(0, 8)}</span>
                        {(order.status === "ACTIVE" || order.status === "PENDING") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#ff4444]/30 text-[#ff4444] hover:bg-[#ff4444]/10"
                            onClick={() => terminateOrder(order.id)}
                          >
                            <Ban className="w-3 h-3 mr-1" /> Terminate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-[#ffffff1a] text-[#a0a0b8]">Previous</Button>
            <span className="text-[#a0a0b8] text-sm">Page {data.pagination.page} of {data.pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="border-[#ffffff1a] text-[#a0a0b8]">Next</Button>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
