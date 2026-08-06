---
name: debug-issue
description: Systematically debug an issue using the code knowledge graph. Use when investigating a bug, error, failing test, crash, or unexpected behavior — or when the user says "debug", "why is this broken", "trace this error".
---

# Debug Issue

Systematically debug using the code knowledge graph.

## Workflow

1. **`get_minimal_context()`** — start here (compact graph stats + risk + suggested tools).
2. **`semantic_search_nodes`** — find related code by name/keyword.
3. **`query_graph`** with `callers_of` / `callees_of` — trace call chains.
4. **`get_flow`** (via `list_flows`) — find execution paths through the buggy code.
5. **`detect_changes`** — recent changes that may have introduced the bug.
6. **`get_impact_radius`** — affected code and blast radius.

## Principles

- Reproduce the bug first if possible (test, repro script, or trace).
- Find the *root cause*, not the symptom. Don't paper over it.
- Check tests: `query_graph(pattern="tests_for")` for existing coverage.
- Verify the fix with the repo's checks (typecheck/test/build).
- If the graph lacks coverage, fall back to Grep/Read — but graph first.
