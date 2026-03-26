import { describe, it, expect } from "vitest";
import { verifySvixSignature } from "./svix-verify";

// Test secret: base64 of "test-secret-key-1234567890ab"
const TEST_SECRET = "whsec_dGVzdC1zZWNyZXQta2V5LTEyMzQ1Njc4OTBhYg==";
const SECRET_BYTES = Uint8Array.from(
  atob("dGVzdC1zZWNyZXQta2V5LTEyMzQ1Njc4OTBhYg=="),
  (c) => c.charCodeAt(0),
);

async function signPayload(
  svixId: string,
  timestamp: number,
  body: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    SECRET_BYTES,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signedContent = `${svixId}.${timestamp}.${body}`;
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedContent),
  );
  return `v1,${btoa(String.fromCharCode(...new Uint8Array(sigBytes)))}`;
}

describe("verifySvixSignature", () => {
  it("returns true for a valid signature", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "responsibilityPath" });
    const svixId = "msg_abc123";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await signPayload(svixId, timestamp, body);

    const headers = new Headers({
      "svix-id": svixId,
      "svix-timestamp": String(timestamp),
      "svix-signature": signature,
    });

    const result = await verifySvixSignature(headers, body, TEST_SECRET);
    expect(result).toBe(true);
  });

  it("returns false for an invalid signature", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "responsibilityPath" });
    const headers = new Headers({
      "svix-id": "msg_abc123",
      "svix-timestamp": String(Math.floor(Date.now() / 1000)),
      "svix-signature": "v1,invalidbase64signature==",
    });

    const result = await verifySvixSignature(headers, body, TEST_SECRET);
    expect(result).toBe(false);
  });

  it("returns false when headers are missing", async () => {
    const result = await verifySvixSignature(new Headers(), "{}", TEST_SECRET);
    expect(result).toBe(false);
  });

  it("returns false for replayed requests (timestamp > 5 min old)", async () => {
    const body = JSON.stringify({ _id: "doc-1" });
    const svixId = "msg_replay";
    const oldTimestamp = Math.floor(Date.now() / 1000) - 301; // 5 min + 1 sec
    const signature = await signPayload(svixId, oldTimestamp, body);

    const headers = new Headers({
      "svix-id": svixId,
      "svix-timestamp": String(oldTimestamp),
      "svix-signature": signature,
    });

    const result = await verifySvixSignature(headers, body, TEST_SECRET);
    expect(result).toBe(false);
  });

  it("accepts multiple signatures (one valid)", async () => {
    const body = JSON.stringify({ _id: "doc-1" });
    const svixId = "msg_multi";
    const timestamp = Math.floor(Date.now() / 1000);
    const validSig = await signPayload(svixId, timestamp, body);

    const headers = new Headers({
      "svix-id": svixId,
      "svix-timestamp": String(timestamp),
      "svix-signature": `v1,invalidone== ${validSig}`,
    });

    const result = await verifySvixSignature(headers, body, TEST_SECRET);
    expect(result).toBe(true);
  });
});
