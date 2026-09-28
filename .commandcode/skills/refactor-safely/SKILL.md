---
name: refactor-safely
description: Refactor code safely using the knowledge graph — find dead code, preview renames, check impact before applying. Use when refactoring, renaming, restructuring, extracting, or removing code.
---

# Refactor Safely

Use the knowledge graph to refactor without breaking things.

## Workflow

1. **`get_minimal_context()`** — start here.
2. **`refactor_tool(mode=suggest)`** — community-driven refactoring suggestions.
3. **`refactor_tool(mode=dead_code)`** — find unreferenced functions/classes (filter by `kind`, `file_pattern`).
4. **`refactor_tool(mode=rename)`** — preview a rename: returns edit list + `refactor_id`.
5. **`apply_refactor_tool`** — apply the previewed refactor (optionally `dry_run` first).
6. **`detect_changes`** — verify the result.

## Principles

- **Always preview before applying.** Renames return an edit list — review it.
- Check impact radius (`get_impact_radius`) before and after.
- Prefer `apply_refactor_tool` (exact string replacements, validated paths) over hand-editing many files.
- Run the repo checks (typecheck/test/build) after applying.
- Match existing style — surgical, minimal diffs.
