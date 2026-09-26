import { createRoot } from "react-dom/client";
import { CopyButton } from "./pages/Market";

const credentialRows = [
  { label: "SSH Command", value: "ssh root@203.0.113.24" },
  { label: "IP Address", value: "203.0.113.24" },
  { label: "Username", value: "root" },
  { label: "Password", value: "temporary-test-password" },
];
const copied: Array<{ command: string; value: string }> = [];

Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: undefined,
});
Object.defineProperty(document, "execCommand", {
  configurable: true,
  value: (command: string) => {
    const textarea = document.activeElement as HTMLTextAreaElement | null;
    copied.push({ command, value: textarea?.value ?? "" });
    return true;
  },
});

createRoot(document.getElementById("root")!).render(
  <div>
    {credentialRows.map((row) => (
      <CopyButton key={row.label} label={row.label} value={row.value} />
    ))}
  </div>,
);

window.setTimeout(() => {
  document
    .querySelectorAll<HTMLButtonElement>("#root button")
    .forEach((button) => button.click());

  window.setTimeout(() => {
    const expected = credentialRows.map((row) => ({
      command: "copy",
      value: row.value,
    }));
    const passed = JSON.stringify(copied) === JSON.stringify(expected);
    const results = document.getElementById("results")!;
    results.textContent = JSON.stringify({
      clipboardUnavailable: navigator.clipboard === undefined,
      copied,
      passed,
    });
    results.dataset.pass = String(passed);
  }, 0);
}, 0);