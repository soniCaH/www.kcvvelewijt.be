import { SIGNATURE_HEADER_NAME, decodeSignatureHeader } from "@sanity/webhook";

const MAX_AGE_MS = 5 * 60 * 1000;

const parseHeader = (header: string) => {
  try {
    return decodeSignatureHeader(header);
  } catch {
    return null;
  }
};

const base64UrlToBytes = (value: string) => {
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
};

/**
 * Verifies a Sanity webhook signature: the `sanity-webhook-signature` header
 * (`t=<ms>,v1=<base64url HMAC-SHA256 of "<t>.<body>">`). Sanity does not sign
 * with Svix; the Svix verifier this replaced rejected every real delivery
 * (#2323).
 *
 * The header is parsed by `@sanity/webhook`, and the tests sign with its
 * encoder, so the format stays pinned to the vendor's. The signature itself
 * is checked with `crypto.subtle.verify`, which compares in constant time —
 * the package's own `isValidSignature` compares with `!==`.
 * Rejects a timestamp older than 5 minutes (replay protection).
 */
export async function verifySanitySignature(
  headers: Headers,
  rawBody: string,
  secret: string,
): Promise<boolean> {
  if (!secret || !rawBody) return false;
  const parsed = parseHeader(headers.get(SIGNATURE_HEADER_NAME) ?? "");
  if (!parsed || Math.abs(Date.now() - parsed.timestamp) > MAX_AGE_MS) {
    return false;
  }
  const signature = base64UrlToBytes(parsed.hashedPayload);
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(`${parsed.timestamp}.${rawBody}`),
  );
}
