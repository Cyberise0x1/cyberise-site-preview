# workflow

- Always read .agent_context.json fully before starting any task to check active claims, recent Replit activity, and project notes. Confidence: 0.80
- Log every file edit to commandcode_log with ts, file, action (edit|create|delete), and summary fields; keep only the last 50 entries. Confidence: 0.80
- Use active_claims.commandcode to claim files before editing and release them when done; never touch files claimed by Replit. Confidence: 0.80
- Always provide a local preview link so the user can review changes before pushing to GitHub. Confidence: 0.85
- Push changes to GitHub first; Vercel deployments must only come from GitHub, never directly from the local environment. Confidence: 0.85
- Push via a feature branch and open a PR — direct pushes to main are blocked by branch protection requiring pull requests and passing status checks. Confidence: 0.75
