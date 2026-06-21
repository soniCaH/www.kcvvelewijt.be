import { Effect } from "effect";
import { WorkerEnvTag } from "../env";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify a Cloudflare Turnstile token server-side.
 *
 * - No secret configured (local/dev) → skip, treat as passed.
 * - Explicit `success: false` from Cloudflare → fail (reject the submission).
 * - Network/parse error → fail-open (log + pass) so a Turnstile outage never
 *   loses a legit applicant; the honeypot still guards against trivial bots.
 */
export const verifyTurnstile = (
  token: string,
): Effect.Effect<boolean, never, WorkerEnvTag> =>
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    if (!env.TURNSTILE_SECRET) {
      yield* Effect.logWarning(
        "[turnstile] TURNSTILE_SECRET not set — skipping verification",
      );
      return true;
    }

    const result = yield* Effect.tryPromise({
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
        const data = (await response.json()) as { success?: boolean };
        return data.success === true;
      },
      catch: (cause) => cause,
    }).pipe(
      Effect.catchAll((cause) =>
        Effect.as(
          Effect.logWarning(
            `[turnstile] verification call failed, allowing through: ${String(cause)}`,
          ),
          true,
        ),
      ),
    );

    return result;
  });
