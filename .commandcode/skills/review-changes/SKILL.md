---
name: review-changes
description: Structured code review using the knowledge graph — risk-scored analysis, affected flows, test coverage, merge recommendation. Use when reviewing a PR, a diff, staged changes, or when the user says "review my changes", "review this PR", "check this diff".
---

# Review Changes

Structured code review. Output grouped by risk level with a merge recommendation.

## Workflow

1. **`get_minimal_context()`** — start here (risk score, top communities/flows).
2. **`detect_changes`** — risk-scored, priority-ordered review guidance (use `include_source` for snippets).
3. **`get_affected_flows`** — which execution paths are impacted.
4. **`query_graph(pattern="tests_for")`** — test coverage for changed code.
5. **`get_impact_radius`** — blast radius (use `detail_level=minimal`).

## Principles

- Group findings by risk: **Critical / High / Medium / Low**.
- For untested changes, suggest concrete test cases.
- Check for: secrets, injection, authz gaps, error handling, backwards-incompat changes.
- End with a clear recommendation: merge / merge with fixes / needs work.
- Respect this repo's rules: no secrets in code, no plain-text credentials, PRs must pass 5 CI checks.
