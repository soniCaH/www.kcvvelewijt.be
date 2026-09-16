import { describe, it, expect } from "vitest";
import { verifySanitySignature } from "./sanity-signature";
import { TEST_SECRET, signPayload } from "../test-helpers/webhook-signing";

const body = '{"_id":"doc-1","_type":"article"}';

const headersWith = (signature: string) =>
  new Headers({ "sanity-webhook-signature": signature });

describe("verifySanitySignature", () => {
  it("accepts a valid signature", async () => {
    const headers = headersWith(await signPayload(body));
    expect(await verifySanitySignature(headers, body, TEST_SECRET)).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const headers = headersWith(await signPayload(body));
    const tampered = '{"_id":"doc-2","_type":"article"}';
    expect(await verifySanitySignature(headers, tampered, TEST_SECRET)).toBe(
      false,
    );
  });

  it("rejects a signature made with another secret", async () => {
    const headers = headersWith(
      await signPayload(body, Date.now(), "some-other-secret"),
    );
    expect(await verifySanitySignature(headers, body, TEST_SECRET)).toBe(false);
  });

  it("rejects a missing signature header", async () => {
    expect(await verifySanitySignature(new Headers(), body, TEST_SECRET)).toBe(
      false,
    );
  });

  it("rejects a malformed signature header", async () => {
    const headers = headersWith("v1,notasanityheader==");
    expect(await verifySanitySignature(headers, body, TEST_SECRET)).toBe(false);
  });

  it("rejects when the secret is unset", async () => {
    const headers = headersWith(await signPayload(body));
    expect(await verifySanitySignature(headers, body, "")).toBe(false);
  });

  it("rejects replayed requests (timestamp > 5 min old)", async () => {
    const old = Date.now() - 5 * 60 * 1000 - 1000;
    const headers = headersWith(await signPayload(body, old));
    expect(await verifySanitySignature(headers, body, TEST_SECRET)).toBe(false);
  });

  // The format this worker used to demand. Sanity never sends it (#2323).
  it("rejects Svix-style headers", async () => {
    const headers = new Headers({
      "svix-id": "msg_abc123",
      "svix-timestamp": String(Math.floor(Date.now() / 1000)),
      "svix-signature": "v1,anything==",
    });
    expect(await verifySanitySignature(headers, body, TEST_SECRET)).toBe(false);
  });
});
