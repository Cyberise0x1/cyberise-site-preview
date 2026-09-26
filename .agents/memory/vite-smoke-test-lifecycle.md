---
name: Vite smoke-test lifecycle
description: A Vite dev server used inside an automated smoke-test process can leave filesystem watchers keeping Node alive after close resolves.
---

Run Vite-backed route smoke checks in a disposable child process and explicitly stop that process when assertions finish.

**Why:** In this workspace, awaiting the Vite server's close method resolved but native filesystem watcher handles remained active, so a successful smoke check still hung until its runner timed out.

**How to apply:** When a test needs to exercise Vite's actual dev-server routing, spawn the local Vite CLI on a temporary port, poll for readiness, and use bounded graceful/forced shutdown.

For browser harnesses that mount React controls and then click them programmatically, use `flushSync` or wait for a committed UI state before querying and clicking. A zero-delay timer is not a reliable React commit boundary.

**Why:** In a headless Chromium run, the controls appeared in the final DOM, but the harness clicked before React had attached their event handlers. Waiting for a committed render made the clipboard fallback check deterministic.

**How to apply:** In a temporary Vite-served harness, wrap `root.render(...)` with `flushSync` before dispatching synthetic clicks, or wait on an explicit DOM-ready signal.