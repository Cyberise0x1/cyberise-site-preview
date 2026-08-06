# workflow

- Always read .agent_context.json fully before starting any task to check active claims, recent Replit activity, and project notes. Confidence: 0.80
- Log every file edit to commandcode_log with ts, file, action (edit|create|delete), and summary fields; keep only the last 50 entries. Confidence: 0.80
- Use active_claims.commandcode to claim files before editing and release them when done; never touch files claimed by Replit. Confidence: 0.80
- Always provide a local preview link so the user can review changes before pushing to GitHub. Confidence: 0.85
- Push changes to GitHub first; Vercel deployments must only come from GitHub, never directly from the local environment. Confidence: 0.85
- Push via a feature branch and open a PR — never commit directly to main; PRs must pass the 5 CI checks (TypeCheck, Lint, Build, Test, Secret Scan). Confidence: 0.85
- Prefer Prisma migrations over `db push` for schema changes, and never run destructive DB commands without explicit human approval. Confidence: 0.85
- Use real HH:MM:SS UTC timestamps in agent logs — no midnight placeholder timestamps, and no three entries may share the same timestamp (enforced by a pre-commit hook). Confidence: 0.85
- Use pnpm workspaces, never npm. Confidence: 0.7
- Never show provider names to buyers (Basic=Linode, Pro=rdp.monster) — internal provider identities must stay hidden. Confidence: 0.7
- Don't touch lib/db/prisma/schema.prisma without coordinating with other agents first. Confidence: 0.7
- When done with a task, reset active claims, record any new conventions in notes[], and update last_updated_by and last_updated_at. Confidence: 0.75
- Reuses a personal skill set across AI coding tools (Caveman Mode, Karpathy Guidelines, Token Efficiency, etc. from Claude Code) and wants those same skills/rules usable in Command Code with minimal friction — "as easy as possible" — so the agent should set them up in a natively-supported location (e.g., skills/SKILL.md) rather than leave them as silently ignored config. Confidence: 0.95
- Maintains a single shared system prompt across multiple AI agents that share the same memory (e.g., three agents), and expects the agent to remember it, save it on request, and reproduce it verbatim so it can be reused/ported into other tools like Command Code. Confidence: 0.8
- Expects the agent to activate and follow the matching skill for a task (e.g., "use the proper skill to scan the codebase" → explore-codebase; "activate the agent-browser" → use it for browsing) rather than improvising an ad-hoc approach when a skill clearly matches the request. Confidence: 0.75
- When asked to check/review a site or product, inspect the actual live deployed state (fetch the site, check deployed repo state) rather than judging from the codebase alone. Confidence: 0.55
