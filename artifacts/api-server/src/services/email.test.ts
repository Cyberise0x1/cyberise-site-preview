import { describe, it, expect } from "vitest";
import {
  generateRDPCredentialsEmail,
  generateSSHCredentialsEmail,
  generateRenewalReminderEmail,
  generateTerminationEmail,
} from "./email";

const BASE_PARAMS = {
  ip: "1.2.3.4",
  username: "Administrator",
  password: "secret-pass",
  expiresAt: new Date("2026-12-31"),
};

describe("generateRDPCredentialsEmail", () => {
  it("renders the passed-in username, not a hardcoded value", () => {
    const { html, text } = generateRDPCredentialsEmail({
      ...BASE_PARAMS,
      username: "Administrator",
    });
    expect(html).toContain("Administrator");
    expect(text).toContain("Administrator");
  });

  it("reflects a custom username when one is supplied", () => {
    const { html, text } = generateRDPCredentialsEmail({
      ...BASE_PARAMS,
      username: "custom-user",
    });
    expect(html).toContain("custom-user");
    expect(text).toContain("custom-user");
    expect(html).not.toContain("Administrator");
    expect(text).not.toContain("Administrator");
  });

  it("includes the IP address in both html and text output", () => {
    const { html, text } = generateRDPCredentialsEmail(BASE_PARAMS);
    expect(html).toContain("1.2.3.4");
    expect(text).toContain("1.2.3.4");
  });

  it("includes the password in both html and text output", () => {
    const { html, text } = generateRDPCredentialsEmail(BASE_PARAMS);
    expect(html).toContain("secret-pass");
    expect(text).toContain("secret-pass");
  });
});

describe("generateSSHCredentialsEmail", () => {
  it("renders the passed-in username in both the SSH command and username field", () => {
    const { html, text } = generateSSHCredentialsEmail({
      ...BASE_PARAMS,
      username: "root",
    });
    expect(html).toContain("root");
    expect(text).toContain("root");
    expect(html).toContain("ssh root@1.2.3.4");
    expect(text).toContain("ssh root@1.2.3.4");
  });

  it("does not hardcode 'Administrator' — username slot uses the parameter", () => {
    const { html, text } = generateSSHCredentialsEmail({
      ...BASE_PARAMS,
      username: "root",
    });
    expect(html).not.toContain("Administrator");
    expect(text).not.toContain("Administrator");
  });
});

describe("generateTerminationEmail", () => {
  const terminatedAt = new Date("2026-08-15T12:30:00.000Z");

  it("labels Linux termination as SSH in the subject content and both bodies", () => {
    const { html, text } = generateTerminationEmail({
      ip: "1.2.3.4",
      terminatedAt,
      connectionType: "SSH",
    });

    expect(html).toContain("SSH Service Terminated");
    expect(html).toContain("Connection Type:");
    expect(html).toContain(">SSH</span>");
    expect(text).toContain("Connection Type: SSH");
    expect(text).not.toContain("RDP Service Terminated");
  });

  it("keeps Windows termination explicitly labeled as RDP", () => {
    const { html, text } = generateTerminationEmail({
      ip: "1.2.3.4",
      terminatedAt,
      connectionType: "RDP",
    });

    expect(html).toContain("RDP Service Terminated");
    expect(html).toContain("Connection Type:");
    expect(html).toContain(">RDP</span>");
    expect(text).toContain("Connection Type: RDP");
  });
});

describe("generateRenewalReminderEmail", () => {
  const expiresAt = new Date("2026-12-31T00:00:00.000Z");

  it("includes the Linux username in both email formats", () => {
    const { html, text } = generateRenewalReminderEmail({
      ip: "1.2.3.4",
      expiresAt,
      username: "root",
    });

    expect(html).toContain("Username:");
    expect(html).toContain(">root</span>");
    expect(text).toContain("Username: root");
  });

  it("includes the saved Windows username in both email formats", () => {
    const { html, text } = generateRenewalReminderEmail({
      ip: "1.2.3.4",
      expiresAt,
      username: "Administrator",
    });

    expect(html).toContain(">Administrator</span>");
    expect(text).toContain("Username: Administrator");
  });
});
