# Agent Collaboration Protocol

Both CommandCode and Replit Agent share `.agent_context.json` as their source of truth.
Before doing any work, read it. After doing any work, update it.

---

## For CommandCode (External Agent)

Paste this into CommandCode's initial instructions:

```
PROTOCOL: You are working in parallel with the Replit Agent on the site cyberise.org.

1. OBSERVE: Before any task, read .agent_context.json fully.
   - Check active_claims.replit — if Replit has files claimed, skip them.
   - Check replit_log for recent activity on files you plan to touch.
   - Read notes[] for project conventions and warnings.

2. CLAIM: Add your files to active_claims.commandcode before editing.
   Example:
   {
     "active_claims": {
       "commandcode": {
         "since": "<ISO timestamp>",
         "files": ["src/auth.ts", "src/middleware/rate-limit.ts"],
         "task": "Adding rate limiting"
       }
     }
   }

3. EXECUTE: Perform your terminal/code tasks.

4. LOG: After each file edit, append to commandcode_log:
   {
     "ts": "<ISO timestamp>",
     "file": "src/auth.ts",
     "action": "edit|create|delete",
     "summary": "Added sliding-window rate limit"
   }
   Keep only the last 50 entries — remove oldest if exceeded.

5. RELEASE: Clear your active_claims.commandcode when the task is complete.

6. NON-DISRUPTION: If you see Replit has a file claimed, do not touch it.
   Add the conflict to the conflicts[] array for human review.
```

---

## For Replit Agent (Internal Agent)

Paste this into the Replit Agent chat:

```
COLLABORATION MODE: You are working with an external agent (CommandCode).

1. MEMORY SYNC: Read .agent_context.json before starting any UI or logic changes.
   - Check active_claims.commandcode for claimed files — avoid them.
   - Read commandcode_log for recent backend changes that might affect your work.

2. WRITEBACK: Every time you modify a file:
   - Add your entry to replit_log (ts, file, action, summary).
   - Keep replit_log capped at 50 entries.

3. CLAIM YOUR FILES: Before editing, set active_claims.replit:
   {
     "active_claims": {
       "replit": {
         "since": "<timestamp>",
         "files": ["src/dashboard/index.tsx"],
         "task": "Fixing pagination bug"
       }
     }
   }
   Clear it when done.

4. LOCKING: If active_claims.commandcode exists and the task is related to the Backend,
   focus your efforts on the Frontend to avoid merge conflicts.

5. CONFLICTS: If you can't avoid stepping on CommandCode's files, add to conflicts[]
   for human review.
```

---

## Conflict Resolution

When both agents need the same file and neither can yield:

1. Add an entry to `conflicts[]` in .agent_context.json:
   ```json
   {
     "file": "src/shared.ts",
     "agent_a": "commandcode",
     "agent_b": "replit",
     "reason": "Both need to modify the export signature",
     "timestamp": "2026-05-14T10:35:00Z"
   }
   ```
2. Both agents skip the file and move on.
3. A human reviews conflicts[] and resolves.

---

## Log Format

Each log entry:

```json
{
  "ts": "2026-05-14T10:30:00Z",
  "file": "src/auth.ts",
  "action": "edit|create|delete",
  "summary": "Short description of what changed"
}
```

- `ts`: ISO 8601 UTC timestamp with **real HH:MM:SS** (never `T00:00:00Z` unless you actually committed at midnight UTC)
- `file`: relative path from project root
- `action`: what kind of change
- `summary`: one-line description — enough for the other agent to understand

### Timestamp policy (enforced)

Batched end-of-session logging — where every entry shares the same `T00:00:00Z` — is **not allowed** for entries on or after `2026-05-21`. Earlier entries are grandfathered.

Rules:

1. Use real `HH:MM:SS` UTC. Get the current time with `date -u +"%Y-%m-%dT%H:%M:%SZ"` before each append.
2. Don't reuse the same `ts` across 3+ entries — if you batched multiple edits, spread them by at least 1 second.
3. `last_updated_at` follows the same rules.

The pre-commit hook (`.husky/pre-commit`) runs `pnpm --filter @workspace/scripts run check:agent-context` whenever `.agent_context.json` is staged. Violations block the commit.
