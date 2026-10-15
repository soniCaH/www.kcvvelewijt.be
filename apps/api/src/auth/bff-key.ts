/**
 * The worker's front door (#3485): only the website's Next.js server may call
 * the API. It sends `x-kcvv-bff-key` (`BFF_KEY_HEADER`) equal to the
 * `BFF_SHARED_SECRET` both sides hold; every other caller gets `401`. The
 * Sanity webhook is exempt — `index.ts` routes it before this check, and it
 * keeps its own HMAC.
 */
import { Effect } from "effect";
import { BFF_KEY_HEADER } from "@kcvv/api-contract";
import type { WorkerEnv } from "../env";

const encoder = new TextEncoder();

/**
 * Constant-time compare; unequal length (or no header) is a mismatch. A length
 * mismatch still runs a same-length compare (the secret against itself), so
 * the response time does not reveal whether the guessed length was right.
 */
export const bffKeyMatches = (given: string | null, expected: string) => {
  if (given === null) return false;
  const a = encoder.encode(given);
  const b = encoder.encode(expected);
  if (a.byteLength !== b.byteLength) {
    return !crypto.subtle.timingSafeEqual(b, b);
  }
  return crypto.subtle.timingSafeEqual(a, b);
};

/** `401` when the request may not reach the app, `null` when it may. */
export const refuseUnlessBffKey = (
  request: Request,
  env: WorkerEnv,
): Response | null => {
  const secret = env.BFF_SHARED_SECRET;
  if (!secret) {
    Effect.runSync(
      Effect.logError(
        "[auth] BFF_SHARED_SECRET not set — refusing all requests",
      ),
    );
  } else if (bffKeyMatches(request.headers.get(BFF_KEY_HEADER), secret)) {
    return null;
  }
  return new Response("Unauthorized", { status: 401 });
};
