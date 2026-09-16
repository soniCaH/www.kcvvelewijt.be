/**
 * Shared Sanity webhook signing helpers for tests.
 *
 * Signs with `@sanity/webhook` — the vendor's own encoder — so the tests
 * pin the header Sanity actually sends, not a format written from memory
 * (the Svix format this replaced never reached the worker, #2323).
 *
 * TEST_SECRET is a deliberately static test fixture — not a real credential.
 */
import { encodeSignatureHeader } from "@sanity/webhook";

export const TEST_SECRET = "test-webhook-secret-1234567890ab"; // gitguardian:ignore

/** A `sanity-webhook-signature` header value; `timestamp` is in milliseconds. */
export function signPayload(
  body: string,
  timestamp: number = Date.now(),
  secret: string = TEST_SECRET,
): Promise<string> {
  return encodeSignatureHeader(body, timestamp, secret);
}
