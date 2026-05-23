# Cyberise Agent Protocol v2

This document is the single source of truth for how AI agents collaborate on cyberise.org. Up to three agents may work in parallel: **Replit Agent**, **CommandCode**, and **Claude**. The rules apply identically to all three — any agent can perform any task, and no agent is restricted to a role (frontend, backend, etc.).

Shared state lives in `.agent_context.json` at the project root. That file is the live state (claims, logs, conflicts, project notes). This markdown file is the rulebook.

---

## Tech stack (reality check)

- **Monorepo:** pnpm workspaces (NEVER npm)
- **Frontend:** React + Vite at `artifacts/cyberise/`
- **Backend:** Express 5 at `artifacts/api-server/`
- **Database:** PostgreSQL via Prisma (`lib/db/`, schema at `lib/db/prisma/schema.prisma`)
- **Auth:** Clerk — production keys locked to cyberise.org; dev-sandbox login errors are expected
- **Email:** Resend
- **Cache:** Upstash Redis
- **Provisioning:** Linode (Basic tier), rdp.monster (Pro tier — HMAC-SHA256 auth, NOT Bearer; key file `artifacts/api-server/src/services/rdpmonster.ts`)
- **Payments:** NowPayments.io (crypto)
- **Remote:** github.com/Cyberise0x1/cyberise-site-preview
- **CI:** 5 required checks on `main` — TypeCheck, Lint, Build, Test, Secret Scan. Branch protection is active.

---

## Protocol — applies identically to all three agents

### Step 1 — OBSERVE

Before touching any file in a fresh session (or if you have reason to suspect another agent has run since you last checked):

1. Read `.agent_context.json` fully.
2. Check `active_claims` for **all** agents. Do not touch any file currently claimed by another agent.
3. Read the other two agents' logs for recent activity on files you plan to edit.
4. Read `notes[]` for project conventions and warnings.

### Step 2 — CLAIM

Before editing any file, set your entry in `active_claims`:

```json
"<your_name>": {
  "since": "<ISO HH:MM:SS UTC>",
  "files": ["path/to/file1", "path/to/file2"],
  "task": "what you are doing"
}
```

- Get the timestamp with `date -u +"%Y-%m-%dT%H:%M:%SZ"`.
- Re-read `.agent_context.json` immediately before writing your claim to narrow the race window (claims are advisory, not locked — see "Race condition" below).
- If a file you need is already claimed by another agent, log a conflict (Step 6) and skip that file.

### Step 3 — EXECUTE

- No secrets in code. No plain-text credentials. All secrets live in Replit Secrets (env vars).
- Prefer Prisma migrations over `db push`.
- Never run destructive DB commands (drop, truncate, force resets) without explicit human approval.
- Never commit directly to `main`. All changes go through PRs that pass all 5 CI checks.
- Honor any conventions and warnings in `notes[]`.

### Step 4 — LOG

After each file edit, append to `<your_name>_log`:

```json
{
  "ts": "<ISO HH:MM:SS UTC>",
  "file": "path/to/file",
  "action": "edit" | "create" | "delete" | "rewrite",
  "summary": "what changed and why — one line, enough for another agent to understand"
}
```

Cap each log at **50 entries**. Drop the oldest if exceeded.

### Step 5 — RELEASE

When your task is fully complete:

- Set your `active_claims["<your_name>"]` back to `{ "since": "", "files": [], "task": "" }`.
- Update `notes[]` if you introduced a new convention or discovered a warning other agents should know.
- Update `last_updated_by` and `last_updated_at` (real `HH:MM:SS` UTC).

### Step 6 — CONFLICTS

If two agents need the same file and neither can yield, append to `conflicts[]`:

```json
{
  "ts": "<ISO HH:MM:SS UTC>",
  "agent": "<your name>",
  "file": "contested file",
  "reason": "why there is a conflict",
  "status": "pending_human_review"
}
```

Both agents skip the file once a conflict is logged. A human resolves.

---

## Timestamp policy (ENFORCED — pre-commit hook)

Effective for entries on or after **2026-05-21**:

1. Use real `HH:MM:SS` UTC. Get the current time with `date -u +"%Y-%m-%dT%H:%M:%SZ"` before each append.
2. `T00:00:00Z` is rejected unless the commit really happened at midnight UTC.
3. No three or more entries may share the same `ts`. If you batch multiple edits, spread them by at least one second.
4. `last_updated_at` follows the same rules.

**Enforcement:** `.husky/pre-commit` runs `pnpm --filter @workspace/scripts run check:agent-context` whenever `.agent_context.json` is staged. The check (`scripts/src/check-agent-context.ts`) blocks the commit on violation. Entries dated before 2026-05-21 are grandfathered.

---

## Race condition (claims are advisory, not locked)

There is no file lock on `.agent_context.json`. Two agents can read claims at the same instant, both see a file as unclaimed, both write — last write wins. To minimize the window:

- Re-read `.agent_context.json` immediately before writing your claim.
- Keep claims small and short-lived. Release as soon as you stop editing.
- If you discover your claim was overwritten, log a conflict and pause.

This is acceptable for three semi-supervised agents. A real lock isn't worth the complexity at this scale.

---

## Initial `.agent_context.json` structure

If — and only if — the file does not exist, create it with this shape. **Never recreate it if it already exists** — read and update in place to preserve sprint state.

```json
{
  "protocol_version": 2,
  "last_updated_by": "<agent name>",
  "last_updated_at": "<ISO HH:MM:SS UTC>",
  "_protocol_note": "All three agents follow AGENT_PROTOCOL.md v2. This file is the shared live state — claims, logs, notes, conflicts.",
  "sprint_goal": "",
  "active_claims": {
    "replit": { "since": "", "files": [], "task": "" },
    "commandcode": { "since": "", "files": [], "task": "" },
    "claude": { "since": "", "files": [], "task": "" }
  },
  "replit_log": [],
  "commandcode_log": [],
  "claude_log": [],
  "conflicts": [],
  "notes": [
    "Use pnpm, not npm.",
    "All DB changes via Prisma migrations only.",
    "Never commit .env files. Use Replit Secrets.",
    "Branch protection is active on main — all PRs must pass 5 CI checks.",
    "RDP Monster auth is HMAC-SHA256, NOT Bearer token.",
    ".replit is gitignored — secrets cannot re-enter via that file."
  ]
}
```

---

## Paste-ready system prompt (identical for all three agents)

```
You are an AI agent working on cyberise.org — an RDP/VPS marketplace. Up to two other agents (out of: Replit Agent, CommandCode, Claude) may be working in parallel. Any agent can perform any task; there are no role assignments. Coordination is via .agent_context.json at the project root and the rules in AGENT_PROTOCOL.md.

Before any work:
1. Read .agent_context.json fully. Check active_claims for all agents; do not touch files claimed by another agent. Read notes[] for project conventions. Skim the other agents' logs for recent activity on files you plan to edit.

When starting work on a file:
2. Add your claim to active_claims["<your_name>"]: { "since": "<ISO HH:MM:SS UTC>", "files": [...], "task": "..." }. Get the timestamp with `date -u +"%Y-%m-%dT%H:%M:%SZ"`. If a file is already claimed by another agent, log a conflict and skip it.

While working:
3. No secrets in code. No plain-text credentials. Prefer Prisma migrations over db push. Never run destructive DB commands without explicit human approval. Never commit directly to main — all changes go through PRs that pass the 5 required CI checks.

After each file edit:
4. Append to <your_name>_log: { "ts": "<ISO HH:MM:SS UTC>", "file": path, "action": "edit"|"create"|"delete"|"rewrite", "summary": "what and why" }. Cap each log at 50 entries; drop the oldest if over.

When done:
5. Reset your active_claims["<your_name>"] to { "since": "", "files": [], "task": "" }. Update notes[] if you introduced a new convention or warning. Update last_updated_by and last_updated_at.

CRITICAL — timestamp policy is enforced by a pre-commit hook (scripts/src/check-agent-context.ts):
- Real HH:MM:SS UTC only — no T00:00:00Z for entries dated 2026-05-21 or later.
- No three or more entries may share the same ts — spread batched edits by at least one second.
- Violations block the commit.

Full protocol: see AGENT_PROTOCOL.md.
```
