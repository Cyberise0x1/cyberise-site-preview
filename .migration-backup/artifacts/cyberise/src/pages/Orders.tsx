import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useApi, type Order } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Server, Clock, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Eye, Ban } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/20",
  PENDING: "bg-[#ff8800]/10 text-[#ff8800] border-[#ff8800]/20",
  TERMINATED: "bg-[#666]/10 text-[#666] border-[#666]/20",
  FAILED: "bg-[#ff4444]/10 text-[#ff4444] border-[#ff4444]/20",
};

const statusIcons: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="w-4 h-4 text-[#00f0ff]" />,
  PENDING: <Clock className="w-4 h-4 text-[#ff8800]" />,
  TERMINATED: <XCircle className="w-4 h-4 text-[#666]" />,
  FAILED: <AlertTriangle className="w-4 h-4 text-[#ff4444]" />,
};

function OrdersContent() {
  const { api } = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [terminating, setTerminating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  async function loadOrders() {
    try {
      setLoading(true);
      const qs = filter !== "ALL" ? `?status=${filter}` : "";
      const response = await api<{ success: boolean; data: Order[] }>(`/orders${qs}`);
      setOrders(response.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function terminateOrder(orderId: string) {
    try {
      setTerminating(true);
      await api(`/orders/${orderId}/terminate`, { method: "POST" });
      toast.success("Order terminated");
      loadOrders();
      setSelectedOrder(null);
    } catch {
      toast.error("Failed to terminate order");
    } finally {
      setTerminating(false);
    }
  }

  const showCredentials = (order: Order) => {
    alert(
      `RDP Credentials\n\n` +
      `IP: ${order.ip}\n` +
      `Username: ${order.rdpUsername}\n` +
      `Password: ${order.rdpPassword || "N/A"}\n` +
      `Status: ${order.status}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a2e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a2e] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#a0a0b8] hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] bg-clip-text text-transparent">
              Orders
            </span>
          </h1>
          <div className="flex items-center justify-between mt-4">
            <p className="text-[#a0a0b8]">View and manage your RDP orders</p>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 bg-[#0a0a0f] border-[#ffffff1a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-[#ffffff1a]">
                <SelectItem value="ALL" className="text-white">All</SelectItem>
                <SelectItem value="ACTIVE" className="text-[#00f0ff]">Active</SelectItem>
                <SelectItem value="PENDING" className="text-[#ff8800]">Pending</SelectItem>
                <SelectItem value="TERMINATED" className="text-[#666]">Terminated</SelectItem>
                <SelectItem value="FAILED" className="text-[#ff4444]">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Server className="w-16 h-16 text-[#ffffff1a] mx-auto mb-4" />
            <p className="text-[#a0a0b8] text-lg mb-4">No orders found</p>
            <Link href="/market">
              <Button className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] hover:opacity-90 text-white">
                Deploy RDP Instance
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="bg-[#12121a]/80 border-[#ffffff1a] backdrop-blur-sm hover:border-[#00f0ff]/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center">
                          <Server className="w-5 h-5 text-[#00f0ff]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">{order.plan}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                              {statusIcons[order.status]}
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[#a0a0b8] text-sm">
                            {order.ip || "No IP"} · {order.region} · ${Number(order.amount).toFixed(2)}
                          </p>
                          <p className="text-[#a0a0b8] text-xs mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString()}
                            {order.expiresAt && ` → Expires ${new Date(order.expiresAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(order.status === "ACTIVE" || order.status === "PENDING") && (
                          <>
                            {order.ip && order.rdpUsername && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10"
                                onClick={() => showCredentials(order)}
                              >
                                <Eye className="w-3 h-3 mr-1" /> Credentials
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#ff4444]/30 text-[#ff4444] hover:bg-[#ff4444]/10"
                              onClick={() => terminateOrder(order.id)}
                              disabled={terminating}
                            >
                              <Ban className="w-3 h-3 mr-1" /> Terminate
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Orders() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
