import { spawn } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteEntry = fileURLToPath(import.meta.resolve("vite"));
const viteCli = path.resolve(path.dirname(viteEntry), "../../bin/vite.js");
const basePath = (process.env.BASE_PATH ?? "/__mockup").replace(/\/+$/, "");
let spawnError;

function reservePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Could not reserve a local port for the route smoke test."));
        return;
      }

      probe.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

async function stopServer(child) {
  if (spawnError || child.exitCode !== null || child.signalCode !== null) return;

  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  const timeout = new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 1_000);
    timer.unref();
  });

  if ((await Promise.race([exited.then(() => true), timeout])) === false) {
    child.kill("SIGKILL");
    await exited;
  }
}

const port = await reservePort();
const origin = `http://127.0.0.1:${port}`;
const baseUrl = `${origin}${basePath}`;
const child = spawn(
  process.execPath,
  [viteCli, "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  {
    cwd: projectRoot,
    env: { ...process.env, BASE_PATH: basePath, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let serverOutput = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    serverOutput = `${serverOutput}${chunk}`.slice(-4_000);
  });
}
child.on("error", (error) => {
  spawnError = error;
});

async function waitForRootResponse() {
  const deadline = Date.now() + 15_000;
  let lastError;

  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (child.exitCode !== null) {
      throw new Error(`Vite exited before serving routes.\n${serverOutput}`);
    }

    try {
      return await fetch(`${baseUrl}/`);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(
    `Timed out waiting for the mockup server at ${baseUrl}/: ${lastError}\n${serverOutput}`,
  );
}

async function assertAppEntry(route, response) {
  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `Mockup route smoke test failed: ${route} returned HTTP ${response.status}.`,
    );
  }
  if (
    !response.headers.get("content-type")?.includes("text/html") ||
    !body.includes('id="root"') ||
    !body.includes("main.tsx")
  ) {
    throw new Error(
      `Mockup route smoke test failed: ${route} did not return the app entry HTML.`,
    );
  }

  console.log(`PASS ${route} returns the mockup app entry`);
}

try {
  const rootRoute = `${basePath}/`;
  await assertAppEntry(rootRoute, await waitForRootResponse());

  const previewRoute = `${basePath}/preview/LandingPage`;
  await assertAppEntry(previewRoute, await fetch(`${origin}${previewRoute}`));
} finally {
  await stopServer(child);
}