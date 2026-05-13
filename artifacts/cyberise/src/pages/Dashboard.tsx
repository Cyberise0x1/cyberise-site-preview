import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useApi, type Order } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Server, CreditCard, Clock, AlertTriangle, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";

function DashboardContent() {
  const { api } = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

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

  const activeOrders = orders.filter(o => o.status === "ACTIVE");
  const pendingOrders = orders.filter(o => o.status === "PENDING");

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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="text-[#a0a0b8] max-w-2xl">
            Manage your RDP instances, track usage, and deploy new servers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-[#12121a]/80 border-[#00f0ff]/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center">
                    <Server className="w-5 h-5 text-[#00f0ff]" />
                  </div>
                  <span className="text-[#a0a0b8] text-sm">Active Instances</span>
                </div>
                <div className="text-3xl font-bold text-white">{activeOrders.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card className="bg-[#12121a]/80 border-[#7b2ff7]/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#7b2ff7]/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[#7b2ff7]" />
                  </div>
                  <span className="text-[#a0a0b8] text-sm">Total Orders</span>
                </div>
                <div className="text-3xl font-bold text-white">{orders.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-[#12121a]/80 border-[#ff4444]/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ff4444]/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-[#ff4444]" />
                  </div>
                  <span className="text-[#a0a0b8] text-sm">Pending</span>
                </div>
                <div className="text-3xl font-bold text-white">{pendingOrders.length}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex gap-4 mb-8"
        >
          <Link href="/market">
            <Button className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] hover:opacity-90 text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Deploy New Instance
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="border-[#ffffff1a] text-[#a0a0b8] hover:text-white hover:border-[#00f0ff]/50">
              View All Orders
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-[#12121a]/80 border-[#00f0ff]/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-[#00f0ff]" />
                Active Instances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Server className="w-12 h-12 text-[#ffffff1a] mx-auto mb-4" />
                  <p className="text-[#a0a0b8] mb-4">No active instances yet</p>
                  <Link href="/market">
                    <Button className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] hover:opacity-90 text-white">
                      Deploy Your First Instance
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0f] border border-[#ffffff1a] hover:border-[#00f0ff]/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center">
                          <Server className="w-5 h-5 text-[#00f0ff]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{order.plan}</p>
                          <p className="text-[#a0a0b8] text-sm">
                            {order.ip || "Provisioning..."} · {order.region}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#00f0ff]/10 text-[#00f0ff]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
                            {order.status}
                          </span>
                          {order.expiresAt && (
                            <p className="text-[#a0a0b8] text-xs mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires {new Date(order.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Link href={`/orders/${order.id}`}>
                          <ExternalLink className="w-4 h-4 text-[#a0a0b8] hover:text-[#00f0ff] cursor-pointer" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
