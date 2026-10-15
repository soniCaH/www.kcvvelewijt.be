import { Effect } from "effect";
import { WorkerEnvTag } from "../env";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify a Cloudflare Turnstile token server-side. Fails closed (#3464).
 *
 * - No secret configured → reject and log an error. Only the local dev flag
 *   `ALLOW_MISSING_FORM_SECRETS === "true"` skips verification (warning).
 * - `success: true` from Cloudflare → pass; `success: false` → reject.
 * - Non-2xx, non-JSON body, network error or timeout → reject and log an error.
 *   The form keeps a local draft (#3299), so a visitor loses nothing by
 *   retrying; failing open let spam through (and made Resend mail made-up
 *   addresses) during a Cloudflare outage. The honeypot is checked first.
 */
export const verifyTurnstile = (
  token: string,
): Effect.Effect<boolean, never, WorkerEnvTag> =>
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    if (!env.TURNSTILE_SECRET) {
      if (env.ALLOW_MISSING_FORM_SECRETS === "true") {
        yield* Effect.logWarning(
          "[turnstile] TURNSTILE_SECRET not set — skipping verification (ALLOW_MISSING_FORM_SECRETS)",
        );
        return true;
      }
      yield* Effect.logError(
        "[turnstile] TURNSTILE_SECRET not set — rejecting submission",
      );
      return false;
    }

    return yield* Effect.tryPromise({
      try: async () => {
        const response = await fetch(SITEVERIFY_URL, {
          method: "POST",
          signal: AbortSignal.timeout(5000),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET,
            response: token,
          }),
        });
        if (!response.ok) {
          throw new Error(`siteverify responded ${response.status}`);
        }
        const data = (await response.json()) as { success?: boolean };
        return data.success === true;
      },
      catch: (cause) => cause,
    }).pipe(
      Effect.catchAll((cause) =>
        Effect.as(
          Effect.logError(
            `[turnstile] verification call failed, rejecting: ${String(cause)}`,
          ),
          false,
        ),
      ),
    );
  });
