# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Agent Collaboration Protocol

**You are working in parallel with an external agent (CommandCode).** Both agents share `.agent_context.json` as the single source of truth. **Read it before any work. Update it after any work.**

### Rules

1. **MEMORY SYNC:** Read `.agent_context.json` before starting any task.
   - Check `active_claims.commandcode` — if CommandCode has files claimed, **skip them**.
   - Read `commandcode_log` for recent backend changes that affect your work.
   - Read `notes[]` for project conventions and warnings.

2. **CLAIM YOUR FILES:** Before editing any file, set `active_claims.replit`:
   ```json
   { "replit": { "since": "<ISO timestamp>", "files": ["path/to/file.tsx"], "task": "What you are doing" } }
   ```
   Clear it when done.

3. **WRITEBACK:** After each file edit, append to `replit_log`:
   ```json
   { "ts": "<ISO timestamp>", "file": "path/to/file.tsx", "action": "edit|create|delete", "summary": "What changed" }
   ```
   Keep log capped at 50 entries — remove oldest if exceeded.

4. **LOCKING:** If `active_claims.commandcode` exists and the task is backend-related, focus on frontend work to avoid merge conflicts.

5. **CONFLICTS:** If you can't avoid stepping on CommandCode's files, add to `conflicts[]` for human review.

6. **LAST UPDATED:** Set `last_updated_by` to `"replit"` and `last_updated_at` to current timestamp after every write.

### Protocol Files
- `.agent_context.json` — shared state (claims, logs, notes, conflicts)
- `AGENT_PROTOCOL.md` — full protocol documentation

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
