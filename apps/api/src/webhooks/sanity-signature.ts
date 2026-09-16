import {
  SIGNATURE_HEADER_NAME,
  decodeSignatureHeader,
  isValidSignature,
} from "@sanity/webhook";

const MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Verifies a Sanity webhook signature: the `sanity-webhook-signature` header
 * (`t=<ms>,v1=<sig>`), checked with Sanity's own `@sanity/webhook` — the same
 * check `apps/web`'s revalidate route uses. Sanity does not sign with Svix;
 * the Svix verifier this replaced rejected every real delivery (#2323).
 * Rejects a timestamp older than 5 minutes (replay protection).
 */
export async function verifySanitySignature(
  headers: Headers,
  rawBody: string,
  secret: string,
): Promise<boolean> {
  // An empty or malformed header, or an empty secret, makes
  // `isValidSignature` return false — it never throws for those.
  const signature = headers.get(SIGNATURE_HEADER_NAME) ?? "";
  if (!(await isValidSignature(rawBody, signature, secret))) return false;
  const { timestamp } = decodeSignatureHeader(signature);
  return Math.abs(Date.now() - timestamp) <= MAX_AGE_MS;
}
