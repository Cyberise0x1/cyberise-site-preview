---
name: explore-codebase
description: Navigate and understand the codebase structure using the code knowledge graph. Use when exploring an unfamiliar area, answering "how does X work", "where is Y", "what's the architecture", "understand this module".
---

# Explore Codebase

Navigate structure using the code knowledge graph.

## Workflow

1. **`list_graph_stats`** — metrics (nodes, edges, files, languages).
2. **`get_architecture_overview`** — high-level structure (use `detail_level=minimal`).
3. **`list_communities` → `get_community`** — modules and their cohesion.
4. **`semantic_search_nodes`** — find specific functions/classes by name/keyword.
5. **`query_graph`** — relationships (importers, callers, callees, tests).
6. **`list_flows` / `get_flow`** — execution paths (entry points → call chains).

## Principles

- Read `CLAUDE.md` / `AGENTS.md` first for repo conventions and invariants.
- Respect the intent layer: before modifying code in a subdirectory, read that subdir's `AGENTS.md`.
- Answer the actual question — don't tour the whole codebase.
- Fall back to Read/Grep only when the graph doesn't cover what you need.
