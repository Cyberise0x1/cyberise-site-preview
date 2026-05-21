import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import { useAuth } from "@clerk/clerk-react";
import { Code2, RefreshCw, AlertTriangle, FileCode } from "lucide-react";

interface LogEntry {
  ts: string;
  file: string;
  action: "edit" | "create" | "delete";
  summary: string;
}

interface Claim {
  since: string;
  files: string[];
  task: string;
}

interface Conflict {
  file: string;
  agent_a: string;
  agent_b: string;
  reason: string;
  timestamp: string;
}

interface AgentContext {
  protocol_version: number;
  last_updated_by: string;
  last_updated_at: string;
  sprint_goal: string;
  active_claims: Record<string, Claim>;
  replit_log: LogEntry[];
  commandcode_log: LogEntry[];
  notes: string[];
  conflicts: Conflict[];
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const actionColor: Record<string, string> = {
  edit: "text-[#00f0ff]",
  create: "text-[#7bd389]",
  delete: "text-[#ff6b9d]",
};

function LogPanel({
  title,
  entries,
  color,
}: {
  title: string;
  entries: LogEntry[];
  color: string;
}) {
  const recent = [...entries].reverse().slice(0, 15);
  return (
    <div className="bg-[#161616] border border-[#ffffff0a] rounded-xl px-5 py-4">
      <p
        className="text-xs font-medium uppercase tracking-wider mb-3"
        style={{ color }}
      >
        {title} Log
        <span className="ml-2 text-[#a0a0b8] normal-case font-normal">
          ({entries.length} total)
        </span>
      </p>
      {recent.length === 0 ? (
        <p className="text-[#a0a0b8] text-sm">No entries yet.</p>
      ) : (
        <div className="space-y-2.5">
          {recent.map((e, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-[#a0a0b8] shrink-0 w-14">
                {timeAgo(e.ts)}
              </span>
              <span
                className={`shrink-0 w-10 font-medium ${actionColor[e.action] ?? "text-[#a0a0b8]"}`}
              >
                {e.action}
              </span>
              <div className="min-w-0">
                <span className="font-mono text-[#e8e8e8] break-all">
                  {e.file}
                </span>
                <span className="text-[#a0a0b8] ml-1">— {e.summary}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MapFrame({ title, src }: { title: string; src: string }) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(src, { method: "HEAD" })
      .then((r) => setAvailable(r.ok))
      .catch(() => setAvailable(false));
  }, [src]);

  return (
    <div className="bg-[#161616] border border-[#ffffff0a] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ffffff0a]">
        <p className="text-sm text-white font-medium">{title}</p>
        {available === true && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00f0ff] hover:underline"
          >
            Open full screen
          </a>
        )}
        {available === false && (
          <span className="text-xs text-[#a0a0b8]">Not generated yet</span>
        )}
      </div>
      {available === true ? (
        <iframe src={src} className="w-full h-[480px] border-0" title={title} />
      ) : (
        <div className="h-[480px] flex flex-col items-center justify-center text-center px-6">
          <FileCode className="w-10 h-10 text-[#2a2a2a] mb-3" />
          <p className="text-[#a0a0b8] text-sm">Map not generated yet</p>
          <p className="text-[#a0a0b8] text-xs mt-2 max-w-xs leading-relaxed">
            Run the architecture-map prompt with an agent, then place the output
            HTML file in{" "}
            <code className="text-[#e8e8e8]">artifacts/cyberise/public/</code>{" "}
            as <code className="text-[#e8e8e8]">{src.replace("/", "")}</code>
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminDev() {
  const { getToken } = useAuth();
  const [ctx, setCtx] = useState<AgentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchContext = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/agent-context", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCtx(data.data);
      setLastFetch(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchContext();
    const interval = setInterval(fetchContext, 30000);
    return () => clearInterval(interval);
  }, [fetchContext]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Code2 className="w-6 h-6 text-[#00f0ff]" />
              Dev — Agent Activity
            </h1>
            <p className="text-[#a0a0b8] text-sm mt-1">
              Live feed from .agent_context.json · auto-refreshes every 30s
              {lastFetch && (
                <span className="ml-2">
                  · synced {timeAgo(lastFetch.toISOString())}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchContext}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#a0a0b8] hover:text-white hover:bg-[#ffffff08] border border-[#ffffff0a] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading && !ctx && (
          <p className="text-[#a0a0b8] text-sm">Loading...</p>
        )}

        {error && (
          <div className="flex items-center gap-2 text-[#ff6b9d] text-sm bg-[#ff6b9d]/10 border border-[#ff6b9d]/20 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {ctx && (
          <>
            {ctx.sprint_goal && (
              <div className="bg-[#161616] border border-[#00f0ff]/20 rounded-xl px-5 py-4">
                <p className="text-xs text-[#00f0ff] font-medium uppercase tracking-wider mb-1">
                  Sprint Goal
                </p>
                <p className="text-white text-sm leading-relaxed">
                  {ctx.sprint_goal}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#161616] border border-[#ffffff0a] rounded-xl px-5 py-4">
                <p className="text-xs text-[#a0a0b8] uppercase tracking-wider mb-1">
                  Last Updated By
                </p>
                <p className="text-white font-semibold capitalize">
                  {ctx.last_updated_by}
                </p>
                <p className="text-[#a0a0b8] text-xs mt-0.5">
                  {timeAgo(ctx.last_updated_at)}
                </p>
              </div>
              <div className="bg-[#161616] border border-[#ffffff0a] rounded-xl px-5 py-4">
                <p className="text-xs text-[#a0a0b8] uppercase tracking-wider mb-1">
                  Active Claims
                </p>
                <p className="text-white font-semibold">
                  {Object.keys(ctx.active_claims).length === 0
                    ? "None"
                    : Object.keys(ctx.active_claims).map((k) => (
                        <span key={k} className="capitalize">
                          {k}
                        </span>
                      ))}
                </p>
              </div>
              <div
                className={`bg-[#161616] border rounded-xl px-5 py-4 ${ctx.conflicts.length > 0 ? "border-[#ff6b9d]/30" : "border-[#ffffff0a]"}`}
              >
                <p className="text-xs text-[#a0a0b8] uppercase tracking-wider mb-1">
                  Conflicts
                </p>
                <p
                  className={`font-semibold ${ctx.conflicts.length > 0 ? "text-[#ff6b9d]" : "text-[#7bd389]"}`}
                >
                  {ctx.conflicts.length === 0
                    ? "None"
                    : `${ctx.conflicts.length} conflict${ctx.conflicts.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            {Object.keys(ctx.active_claims).length > 0 && (
              <div className="bg-[#161616] border border-[#f5b942]/20 rounded-xl px-5 py-4">
                <p className="text-xs text-[#f5b942] font-medium uppercase tracking-wider mb-3">
                  Active Claims
                </p>
                <div className="space-y-3">
                  {Object.entries(ctx.active_claims).map(([agent, claim]) => (
                    <div key={agent} className="space-y-1.5">
                      <p className="text-white text-sm font-medium capitalize">
                        {agent}{" "}
                        <span className="text-[#a0a0b8] font-normal">
                          — {claim.task}
                        </span>
                        <span className="text-[#a0a0b8] text-xs ml-2">
                          ({timeAgo(claim.since)})
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {claim.files.map((f) => (
                          <span
                            key={f}
                            className="text-xs bg-[#ffffff08] border border-[#ffffff0a] rounded px-2 py-0.5 text-[#a0a0b8] font-mono"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ctx.conflicts.length > 0 && (
              <div className="bg-[#161616] border border-[#ff6b9d]/20 rounded-xl px-5 py-4">
                <p className="text-xs text-[#ff6b9d] font-medium uppercase tracking-wider mb-3">
                  Conflicts — Needs Human Resolution
                </p>
                <div className="space-y-3">
                  {ctx.conflicts.map((c, i) => (
                    <div key={i} className="text-sm space-y-0.5">
                      <p>
                        <span className="font-mono text-[#ff6b9d]">
                          {c.file}
                        </span>
                        <span className="text-[#a0a0b8] ml-2 text-xs capitalize">
                          {c.agent_a} vs {c.agent_b}
                        </span>
                      </p>
                      <p className="text-[#a0a0b8] text-xs">{c.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LogPanel
                title="Replit"
                entries={ctx.replit_log}
                color="#00f0ff"
              />
              <LogPanel
                title="CommandCode"
                entries={ctx.commandcode_log}
                color="#a78bfa"
              />
            </div>

            <div>
              <p className="text-xs text-[#a0a0b8] font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5" />
                Architecture Maps
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MapFrame
                  title="Frontend Map"
                  src="/architecture-map-frontend.html"
                />
                <MapFrame
                  title="Backend Map"
                  src="/architecture-map-backend.html"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
