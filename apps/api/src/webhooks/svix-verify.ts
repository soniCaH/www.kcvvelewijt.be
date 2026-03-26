/**
 * Verifies a Sanity SVIX webhook signature using the Web Crypto API.
 * Rejects if timestamp is older than 5 minutes (replay protection).
 *
 * Signed content format: "{svix-id}.{svix-timestamp}.{raw-body}"
 * Secret format: "whsec_<base64>"
 */
export async function verifySvixSignature(
  headers: Headers,
  rawBody: string,
  secret: string,
): Promise<boolean> {
  if (!secret || !secret.startsWith("whsec_")) return false;

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Replay protection: reject if older than 5 minutes
  const ts = Number(svixTimestamp);
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

  // Decode secret (strip "whsec_" prefix, base64 decode)
  let secretBytes: Uint8Array;
  try {
    secretBytes = Uint8Array.from(atob(secret.slice(6)), (c) =>
      c.charCodeAt(0),
    );
  } catch {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedContent),
  );
  const computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

  // svix-signature may contain multiple signatures: "v1,<sig1> v1,<sig2>"
  return svixSignature.split(" ").some((s) => {
    const [, sig] = s.split(",");
    return sig === computed;
  });
}
