/**
 * Shared SVIX webhook signing helpers for tests.
 *
 * TEST_SECRET is a deliberately static test fixture — not a real credential.
 */

// Test secret: base64 of "test-secret-key-1234567890ab"
export const TEST_SECRET = "whsec_dGVzdC1zZWNyZXQta2V5LTEyMzQ1Njc4OTBhYg=="; // gitguardian:ignore

export const SECRET_BYTES = Uint8Array.from(
  atob(TEST_SECRET.slice("whsec_".length)),
  (c) => c.charCodeAt(0),
);

export async function signPayload(
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
  return `v1,${Buffer.from(sigBytes).toString("base64")}`;
}
