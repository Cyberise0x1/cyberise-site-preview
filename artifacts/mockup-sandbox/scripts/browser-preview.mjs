import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const browserExecutable =
  process.env.CHROMIUM_PATH ?? process.env.CHROME_BIN ?? "chromium";

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isLocalStylesheet(url, type, previewOrigin) {
  try {
    const resource = new URL(url);
    return (
      resource.origin === previewOrigin &&
      (type === "Stylesheet" || resource.pathname.toLowerCase().endsWith(".css"))
    );
  } catch {
    return false;
  }
}

async function waitForDevToolsPort(browser, profileDir, getOutput) {
  const activePortFile = path.join(profileDir, "DevToolsActivePort");
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if (browser.spawnError) {
      throw new Error(
        `Could not start Chromium (${browserExecutable}): ${browser.spawnError.message}`,
      );
    }
    if (browser.exitCode !== null) {
      throw new Error(
        `Chromium exited before opening DevTools.\n${getOutput()}`,
      );
    }

    try {
      const [port] = (await readFile(activePortFile, "utf8")).split(/\r?\n/);
      if (/^\d+$/.test(port)) return Number(port);
    } catch {
      // Chromium creates this file once its debugging endpoint is ready.
    }

    await delay(100);
  }

  throw new Error(
    `Timed out waiting for Chromium's DevTools endpoint.\n${getOutput()}`,
  );
}

function connectToPage(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const pending = new Map();
    const listeners = new Map();
    let nextId = 0;
    let settled = false;

    const openTimeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.close();
      reject(new Error("Timed out connecting to Chromium DevTools."));
    }, 5_000);

    socket.addEventListener("open", () => {
      if (settled) return;
      settled = true;
      clearTimeout(openTimeout);

      socket.addEventListener("message", ({ data }) => {
        let message;
        try {
          message = JSON.parse(String(data));
        } catch {
          return;
        }

        if (message.id !== undefined) {
          const command = pending.get(message.id);
          if (!command) return;
          pending.delete(message.id);
          clearTimeout(command.timeout);
          if (message.error) {
            command.reject(new Error(message.error.message));
          } else {
            command.resolve(message.result);
          }
          return;
        }

        for (const listener of listeners.get(message.method) ?? []) {
          listener(message.params);
        }
      });

      resolve({
        send(method, params = {}) {
          const id = ++nextId;
          return new Promise((commandResolve, commandReject) => {
            const timeout = setTimeout(() => {
              pending.delete(id);
              commandReject(
                new Error(`Chromium DevTools command timed out: ${method}`),
              );
            }, 5_000);
            pending.set(id, {
              resolve: commandResolve,
              reject: commandReject,
              timeout,
            });
            socket.send(JSON.stringify({ id, method, params }));
          });
        },
        on(method, listener) {
          const methodListeners = listeners.get(method) ?? new Set();
          methodListeners.add(listener);
          listeners.set(method, methodListeners);
          return () => methodListeners.delete(listener);
        },
        close() {
          if (socket.readyState === WebSocket.CLOSED) return Promise.resolve();
          return new Promise((closeResolve) => {
            const timeout = setTimeout(closeResolve, 500);
            socket.addEventListener(
              "close",
              () => {
                clearTimeout(timeout);
                closeResolve();
              },
              { once: true },
            );
            socket.close();
          });
        },
      });
    });

    socket.addEventListener(
      "error",
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(openTimeout);
        reject(new Error("Could not connect to Chromium DevTools."));
      },
      { once: true },
    );
  });
}

async function stopBrowser(browser) {
  if (
    browser.spawnError ||
    browser.exitCode !== null ||
    browser.signalCode !== null
  )
    return;

  const exited = new Promise((resolve) => browser.once("exit", resolve));
  browser.kill("SIGTERM");
  const stopped = await Promise.race([
    exited.then(() => true),
    delay(1_000).then(() => false),
  ]);

  if (!stopped) {
    browser.kill("SIGKILL");
    await exited;
  }
}

export async function assertRenderedPreview(url) {
  const profileDir = await mkdtemp(
    path.join(os.tmpdir(), "mockup-preview-chromium-"),
  );
  let browserOutput = "";
  let cdp;
  let browser;

  try {
    browser = spawn(
      browserExecutable,
      [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-breakpad",
        "--disable-crash-reporter",
        "--remote-debugging-address=127.0.0.1",
        "--remote-debugging-port=0",
        `--user-data-dir=${profileDir}`,
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    browser.exitCode = null;
    browser.spawnError = null;
    browser.stderr.setEncoding("utf8");
    browser.stderr.on("data", (chunk) => {
      browserOutput = `${browserOutput}${chunk}`.slice(-4_000);
    });
    browser.on("error", (error) => {
      browser.spawnError = error;
    });
    browser.on("exit", (code) => {
      browser.exitCode = code;
    });

    const port = await waitForDevToolsPort(
      browser,
      profileDir,
      () => browserOutput,
    );
    const targetsResponse = await fetch(`http://127.0.0.1:${port}/json/list`);
    if (!targetsResponse.ok) {
      throw new Error(
        `Chromium DevTools returned HTTP ${targetsResponse.status} while listing pages.`,
      );
    }
    const targets = await targetsResponse.json();
    const page = targets.find((target) => target.type === "page");
    if (!page?.webSocketDebuggerUrl) {
      throw new Error("Chromium did not open a page for the preview check.");
    }

    cdp = await connectToPage(page.webSocketDebuggerUrl);
    const pageErrors = [];
    const scriptRequests = new Map();
    const stylesheetRequests = new Map();
    const previewOrigin = new URL(url).origin;
    cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
      const detail =
        exceptionDetails.exception?.description ?? exceptionDetails.text;
      pageErrors.push(`Uncaught page error: ${detail}`);
    });
    cdp.on("Network.requestWillBeSent", (event) => {
      const request = {
        url: event.request.url,
        type: event.type,
      };
      scriptRequests.set(event.requestId, request);
      if (isLocalStylesheet(request.url, request.type, previewOrigin)) {
        stylesheetRequests.set(event.requestId, request);
      }
    });
    cdp.on("Network.responseReceived", ({ requestId, response, type }) => {
      const stylesheet =
        stylesheetRequests.get(requestId) ??
        (isLocalStylesheet(response.url, type, previewOrigin)
          ? { url: response.url }
          : null);
      if (stylesheet && response.status >= 400) {
        pageErrors.push(
          `Local stylesheet request failed with HTTP ${response.status}: ${stylesheet.url}`,
        );
      }
      if (!stylesheet && type === "Script" && response.status >= 400) {
        pageErrors.push(
          `JavaScript module request failed with HTTP ${response.status}: ${response.url}`,
        );
      }
    });
    cdp.on("Network.loadingFailed", ({ requestId, type, errorText }) => {
      const request = scriptRequests.get(requestId);
      const stylesheet =
        stylesheetRequests.get(requestId) ??
        (request &&
        isLocalStylesheet(request.url, type ?? request.type, previewOrigin)
          ? request
          : null);
      if (stylesheet) {
        pageErrors.push(
          `Local stylesheet failed to load: ${stylesheet.url} (${errorText})`,
        );
      } else if (type === "Script" || request?.type === "Script") {
        pageErrors.push(
          `JavaScript module failed to load${request?.url ? `: ${request.url}` : ""} (${errorText})`,
        );
      }
    });

    await Promise.all([
      cdp.send("Runtime.enable"),
      cdp.send("Page.enable"),
      cdp.send("Network.enable"),
    ]);

    let loadTimer;
    const loadEvent = new Promise((resolve, reject) => {
      const unsubscribe = cdp.on("Page.loadEventFired", () => {
        clearTimeout(loadTimer);
        unsubscribe();
        resolve();
      });
      loadTimer = setTimeout(() => {
        unsubscribe();
        reject(new Error("Timed out waiting for the preview page to load."));
      }, 15_000);
    });

    const navigation = await cdp.send("Page.navigate", { url });
    if (navigation.errorText) {
      throw new Error(`Preview navigation failed: ${navigation.errorText}`);
    }
    await loadEvent;

    const deadline = Date.now() + 15_000;
    let lastSnapshot;
    while (Date.now() < deadline) {
      if (pageErrors.length > 0) {
        throw new Error(pageErrors.join("\n"));
      }

      const evaluation = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const root = document.querySelector("#root");
          const hero = root?.querySelector("h1");
          const carousel = root?.querySelector("#feature-carousel");
          const text = root?.innerText ?? "";
          return {
            text,
            heroText: hero?.innerText ?? "",
            heroVisible: Boolean(hero && hero.getClientRects().length),
            heroFontFamily: hero ? getComputedStyle(hero).fontFamily : "",
            featureCards:
              carousel?.querySelectorAll("[data-testid^='card-feature-']")
                .length ?? 0,
            previewLoadError:
              /Failed to load preview|No component found|No exported React component/.test(
                text,
              ),
          };
        })()`,
        returnByValue: true,
      });
      lastSnapshot = evaluation.result?.value;

      if (lastSnapshot?.previewLoadError) {
        throw new Error(
          `Preview displayed a component-load error: ${lastSnapshot.text.slice(0, 500)}`,
        );
      }
      if (
        lastSnapshot?.heroVisible &&
        lastSnapshot.heroText.includes(
          "Servers you deploy. Systems you trust. Ops that hold.",
        ) &&
        lastSnapshot.featureCards >= 3
      ) {
        if (!lastSnapshot.heroFontFamily.includes("IBM Plex Mono")) {
          throw new Error(
            `Preview hero is missing its expected local font styling. Computed font-family: ${lastSnapshot.heroFontFamily || "(empty)"}`,
          );
        }
        console.log(
          "PASS /preview/LandingPage renders its hero and feature cards with local styles in Chromium",
        );
        return;
      }

      await delay(100);
    }

    if (pageErrors.length > 0) {
      throw new Error(pageErrors.join("\n"));
    }
    throw new Error(
      `Preview did not render the expected content in Chromium. Last page state: ${JSON.stringify(lastSnapshot)}`,
    );
  } finally {
    if (cdp) await cdp.close();
    if (browser) await stopBrowser(browser);
    await rm(profileDir, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }
}
