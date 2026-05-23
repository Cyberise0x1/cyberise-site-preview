import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type LogEntry = {
  ts?: string;
  file?: string;
  action?: string;
  summary?: string;
};
type AgentContext = {
  last_updated_at?: string;
  commandcode_log?: LogEntry[];
  replit_log?: LogEntry[];
  claude_log?: LogEntry[];
};

function findWorkspaceRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `Could not find workspace root (pnpm-workspace.yaml) above ${start}`,
  );
}

const CONTEXT_PATH = resolve(
  findWorkspaceRoot(process.cwd()),
  ".agent_context.json",
);

// Entries on or after this date must use real HH:MM:SS timestamps.
// Older entries are grandfathered (legacy batched logs).
const POLICY_START = "2026-05-21";

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function isMidnight(ts: string): boolean {
  return /T00:00:00(?:\.0+)?Z$/.test(ts);
}

function loadContext(): AgentContext {
  const raw = readFileSync(CONTEXT_PATH, "utf8");
  return JSON.parse(raw) as AgentContext;
}

function checkLog(name: string, entries: LogEntry[] | undefined): string[] {
  if (!entries) return [];
  const errors: string[] = [];
  const tsCounts = new Map<string, number>();

  for (const [i, entry] of entries.entries()) {
    if (!entry.ts) {
      errors.push(`${name}[${i}]: missing 'ts' field`);
      continue;
    }
    if (!ISO_RE.test(entry.ts)) {
      errors.push(
        `${name}[${i}]: 'ts' (${entry.ts}) is not ISO-8601 UTC (YYYY-MM-DDTHH:MM:SSZ)`,
      );
      continue;
    }

    // Only enforce on entries from POLICY_START onward
    if (entry.ts.slice(0, 10) >= POLICY_START) {
      if (isMidnight(entry.ts)) {
        errors.push(
          `${name}[${i}]: 'ts' (${entry.ts}) is T00:00:00Z — likely batched, not per-edit. Use real HH:MM:SS.`,
        );
      }
      tsCounts.set(entry.ts, (tsCounts.get(entry.ts) ?? 0) + 1);
    }
  }

  for (const [ts, count] of tsCounts) {
    if (count >= 3) {
      errors.push(
        `${name}: ${count} entries share identical ts=${ts} — likely batched. Use distinct timestamps per edit.`,
      );
    }
  }

  return errors;
}

function main(): void {
  let ctx: AgentContext;
  try {
    ctx = loadContext();
  } catch (err) {
    console.error(`[check-agent-context] failed to load ${CONTEXT_PATH}:`, err);
    process.exit(2);
  }

  const errors = [
    ...checkLog("commandcode_log", ctx.commandcode_log),
    ...checkLog("replit_log", ctx.replit_log),
    ...checkLog("claude_log", ctx.claude_log),
  ];

  if (ctx.last_updated_at) {
    if (!ISO_RE.test(ctx.last_updated_at)) {
      errors.push(
        `last_updated_at (${ctx.last_updated_at}) is not ISO-8601 UTC`,
      );
    } else if (
      ctx.last_updated_at.slice(0, 10) >= POLICY_START &&
      isMidnight(ctx.last_updated_at)
    ) {
      errors.push(
        `last_updated_at (${ctx.last_updated_at}) is T00:00:00Z — use real HH:MM:SS.`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("[check-agent-context] FAIL");
    for (const e of errors) console.error("  - " + e);
    console.error(
      `\nPolicy: entries on or after ${POLICY_START} must use real HH:MM:SS UTC timestamps and may not share a ts with 2+ other entries.`,
    );
    process.exit(1);
  }

  console.log("[check-agent-context] OK");
}

main();
