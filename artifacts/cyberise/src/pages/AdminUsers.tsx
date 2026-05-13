import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useApi } from "@/lib/api";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Ban, CheckCircle, Users } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  banned: boolean;
  balance: number;
  createdAt: string;
  _count: { orders: number };
}

interface PaginatedUsers {
  users: AdminUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminUsers() {
  const { api } = useApi();
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const response = await api<{ success: boolean; data: PaginatedUsers }>(`/admin/users?${params}`);
      setData(response.data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [api, page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function toggleBan(userId: string, currentBanned: boolean) {
    try {
      const endpoint = currentBanned ? `/admin/users/${userId}/unban` : `/admin/users/${userId}/ban`;
      await api(endpoint, { method: "PATCH" });
      toast.success(currentBanned ? "User unbanned" : "User banned");
      loadUsers();
    } catch {
      toast.error("Action failed");
    }
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">User Management</h1>
            <p className="text-[#a0a0b8]">{data?.pagination.total ?? 0} total users</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0b8]" />
            <Input
              placeholder="Search users..."
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
        ) : data?.users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-[#ffffff1a] mx-auto mb-4" />
            <p className="text-[#a0a0b8]">No users found</p>
          </div>
        ) : (
          <Card className="bg-[#12121a]/80 border-[#00f0ff]/20 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#ffffff0a]">
                      <th className="text-left p-4 text-[#a0a0b8] text-sm font-medium">User</th>
                      <th className="text-left p-4 text-[#a0a0b8] text-sm font-medium">Role</th>
                      <th className="text-left p-4 text-[#a0a0b8] text-sm font-medium">Balance</th>
                      <th className="text-left p-4 text-[#a0a0b8] text-sm font-medium">Orders</th>
                      <th className="text-left p-4 text-[#a0a0b8] text-sm font-medium">Status</th>
                      <th className="text-left p-4 text-[#a0a0b8] text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.users.map((user) => (
                      <tr key={user.id} className="border-b border-[#ffffff05] hover:bg-[#ffffff03]">
                        <td className="p-4">
                          <p className="text-white text-sm font-medium">{user.email}</p>
                          <p className="text-[#666] text-xs font-mono">{user.id.slice(0, 16)}...</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "ADMIN" ? "bg-[#7b2ff7]/10 text-[#7b2ff7]" : "bg-[#ffffff0a] text-[#a0a0b8]"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 text-white text-sm">${Number(user.balance).toFixed(2)}</td>
                        <td className="p-4 text-[#a0a0b8] text-sm">{user._count.orders}</td>
                        <td className="p-4">
                          {user.banned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#ff4444]/10 text-[#ff4444]">
                              <Ban className="w-3 h-3" /> Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#00f0ff]/10 text-[#00f0ff]">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className={user.banned
                              ? "border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10"
                              : "border-[#ff4444]/30 text-[#ff4444] hover:bg-[#ff4444]/10"
                            }
                            onClick={() => toggleBan(user.id, user.banned)}
                          >
                            {user.banned ? "Unban" : "Ban"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="border-[#ffffff1a] text-[#a0a0b8]"
            >
              Previous
            </Button>
            <span className="text-[#a0a0b8] text-sm">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="border-[#ffffff1a] text-[#a0a0b8]"
            >
              Next
            </Button>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
