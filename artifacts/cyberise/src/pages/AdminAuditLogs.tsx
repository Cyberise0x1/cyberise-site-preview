import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/lib/api";
import { AdminLayout } from "./AdminLayout";
import { Input } from "@/components/ui/input";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { email: string } | null;
}

interface PaginatedLogs {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const PROVISION_ACTIONS = ["PROVISION_FAILED", "PROVISION_FAILED_AFTER_PAYMENT"];

const ACTION_FILTERS = [
  { label: "All", value: "" },
  { label: "Provision Failed", value: "PROVISION_FAILED" },
  { label: "Failed After Payment", value: "PROVISION_FAILED_AFTER_PAYMENT" },
  { label: "User Banned", value: "USER_BANNED" },
  { label: "User Unbanned", value: "USER_UNBANNED" },
  { label: "Order Terminated", value: "ORDER_TERMINATED_ADMIN" },
  { label: "Settings Updated", value: "SETTINGS_UPDATED" },
];

const ACTION_BADGE: Record<string, string> = {
  PROVISION_FAILED: "bg-[#ff6b9d]/15 text-[#ff6b9d] border-[#ff6b9d]/30",
  PROVISION_FAILED_AFTER_PAYMENT: "bg-[#ff6b9d]/15 text-[#ff6b9d] border-[#ff6b9d]/30",
  USER_BANNED: "bg-[#f5b942]/15 text-[#f5b942] border-[#f5b942]/30",
  USER_UNBANNED: "bg-[#7bd389]/15 text-[#7bd389] border-[#7bd389]/30",
  ORDER_TERMINATED_ADMIN: "bg-[#f5b942]/15 text-[#f5b942] border-[#f5b942]/30",
  SETTINGS_UPDATED: "bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/30",
  PROMO_CODE_CREATED: "bg-[#7bd389]/15 text-[#7bd389] border-[#7bd389]/30",
  PROMO_CODE_UPDATED: "bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/30",
  PROMO_CODE_DELETED: "bg-[#ff6b9d]/15 text-[#ff6b9d] border-[#ff6b9d]/30",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetadataCell({ metadata, action }: { metadata: Record<string, unknown> | null; action: string }) {
  const isProvisionFailure = PROVISION_ACTIONS.includes(action);

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-[#a0a0b8] text-xs italic">—</span>;
  }

  const linodeError = metadata.linodeError as string | undefined;

  return (
    <div className="space-y-1.5 max-w-sm">
      {isProvisionFailure && linodeError && (
        <div className="flex items-start gap-1.5 bg-[#ff6b9d]/10 border border-[#ff6b9d]/20 rounded-lg px-2.5 py-1.5">
          <AlertTriangle className="w-3 h-3 text-[#ff6b9d] shrink-0 mt-0.5" />
          <span className="text-xs text-[#ff6b9d] font-mono break-all">{linodeError}</span>
        </div>
      )}
      {Object.entries(metadata)
        .filter(([k]) => !(isProvisionFailure && k === "linodeError"))
        .map(([k, v]) => (
          <div key={k} className="flex gap-1.5 text-xs">
            <span className="text-[#a0a0b8] shrink-0">{k}:</span>
            <span className="text-[#e8e8e8] font-mono break-all">
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
    </div>
  );
}

export default function AdminAuditLogs() {
  const { api } = useApi();
  const [data, setData] = useState<PaginatedLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (actionFilter) {
        params.set("action", actionFilter);
      } else if (search) {
        params.set("search", search);
      }
      const response = await api<{ success: boolean; data: PaginatedLogs }>(
        `/admin/audit-logs?${params}`,
      );
      setData(response.data);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [api, page, search, actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setActionFilter("");
    setPage(1);
  }

  function handleActionFilter(value: string) {
    setActionFilter(value);
    setSearch("");
    setPage(1);
  }

  const provisionFailureCount = data?.logs.filter((l) =>
    PROVISION_ACTIONS.includes(l.action),
  ).length ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-[#00f0ff]" />
              Audit Logs
            </h1>
            <p className="text-[#a0a0b8] text-sm mt-1">
              System-wide event history · provisioning failures highlighted
            </p>
          </div>
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#a0a0b8] hover:text-white hover:bg-[#ffffff08] border border-[#ffffff0a] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {provisionFailureCount > 0 && (
          <div className="flex items-center gap-2 bg-[#ff6b9d]/10 border border-[#ff6b9d]/20 rounded-xl px-4 py-3 text-sm text-[#ff6b9d]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {provisionFailureCount} provisioning failure{provisionFailureCount !== 1 ? "s" : ""} on this page — check Linode error details below.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0b8]" />
            <Input
              className="pl-9 bg-[#0a0a0f] border-[#ffffff12] text-white placeholder:text-[#a0a0b8] focus:border-[#00f0ff]/40"
              placeholder="Search action, entity, ID…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0b8] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ACTION_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleActionFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  actionFilter === f.value
                    ? "bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30"
                    : "text-[#a0a0b8] border-[#ffffff0a] hover:text-white hover:bg-[#ffffff08]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0d0d14] border border-[#ffffff0a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#ffffff08]">
                  <th className="text-left px-4 py-3 text-xs text-[#a0a0b8] font-medium uppercase tracking-wider whitespace-nowrap">Time</th>
                  <th className="text-left px-4 py-3 text-xs text-[#a0a0b8] font-medium uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-xs text-[#a0a0b8] font-medium uppercase tracking-wider">Entity</th>
                  <th className="text-left px-4 py-3 text-xs text-[#a0a0b8] font-medium uppercase tracking-wider">Actor</th>
                  <th className="text-left px-4 py-3 text-xs text-[#a0a0b8] font-medium uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#a0a0b8] text-sm">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && data?.logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#a0a0b8] text-sm">
                      No audit log entries found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.logs.map((log) => {
                    const isProvision = PROVISION_ACTIONS.includes(log.action);
                    return (
                      <tr
                        key={log.id}
                        className={`border-b border-[#ffffff05] transition-colors ${
                          isProvision
                            ? "bg-[#ff6b9d]/[0.03] hover:bg-[#ff6b9d]/[0.06]"
                            : "hover:bg-[#ffffff03]"
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className="text-[#a0a0b8] text-xs"
                            title={new Date(log.createdAt).toLocaleString()}
                          >
                            {timeAgo(log.createdAt)}
                          </span>
                          <div className="text-[#606070] text-[10px] mt-0.5">{formatDate(log.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-mono font-medium ${
                              ACTION_BADGE[log.action] ?? "bg-[#ffffff08] text-[#a0a0b8] border-[#ffffff10]"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white text-xs">{log.entity}</span>
                          {log.entityId && (
                            <div className="text-[#606070] font-mono text-[10px] mt-0.5 truncate max-w-[120px]" title={log.entityId}>
                              {log.entityId}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[#a0a0b8] text-xs">
                            {log.actor?.email ?? <span className="italic text-[#606070]">system</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <MetadataCell metadata={log.metadata} action={log.action} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#ffffff08]">
              <p className="text-xs text-[#a0a0b8]">
                {data.pagination.total} total · page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg text-[#a0a0b8] hover:text-white hover:bg-[#ffffff08] border border-[#ffffff0a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg text-[#a0a0b8] hover:text-white hover:bg-[#ffffff08] border border-[#ffffff0a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
