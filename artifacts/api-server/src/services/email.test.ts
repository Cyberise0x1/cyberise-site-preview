import { describe, it, expect } from "vitest";
import {
  generateRDPCredentialsEmail,
  generateSSHCredentialsEmail,
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
