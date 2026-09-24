---
name: Vite smoke-test lifecycle
description: A Vite dev server used inside an automated smoke-test process can leave filesystem watchers keeping Node alive after close resolves.
---

Run Vite-backed route smoke checks in a disposable child process and explicitly stop that process when assertions finish.

**Why:** In this workspace, awaiting the Vite server's close method resolved but native filesystem watcher handles remained active, so a successful smoke check still hung until its runner timed out.

**How to apply:** When a test needs to exercise Vite's actual dev-server routing, spawn the local Vite CLI on a temporary port, poll for readiness, and use bounded graceful/forced shutdown.