import { Effect } from "effect";
import {
  HttpApiSchema,
  HttpClient,
  HttpClientError,
  HttpClientResponse,
} from "@effect/platform";
import {
  HttpServiceUnavailable,
  HttpBadGateway,
  HttpNotFound,
  HttpBadRequest,
} from "@kcvv/api-contract";

/**
 * The HTTP statuses `PsdApi`'s error union declares, derived from the error
 * classes themselves via `HttpApiSchema.getStatusError` — never a hand-typed
 * `[404, 502, 503, 400]`. A literal list would silently go stale the day a
 * fifth error class is added, the same drift trap
 * `classify-bff-failure.ts`'s `PERMANENT_BFF_TAGS` closes with its
 * `as const satisfies` guard. `http-errors.test.ts` already pins that
 * `getStatusError` resolves each of these four classes correctly.
 */
const DECLARED_ERROR_STATUSES: ReadonlySet<number> = new Set([
  HttpApiSchema.getStatusError(HttpServiceUnavailable),
  HttpApiSchema.getStatusError(HttpBadGateway),
  HttpApiSchema.getStatusError(HttpNotFound),
  HttpApiSchema.getStatusError(HttpBadRequest),
]);

/**
 * True when `text` looks like one of this BFF's own tagged error bodies
 * (`{ error: string, _tag: "HttpNotFound" }` and siblings) — deliberately
 * loose (any JSON object with a string `_tag`) rather than re-decoding
 * against the four schemas here, because that decode is exactly what
 * `HttpApiClient` is about to do properly once this guard hands the
 * response onward; this only needs to tell "ours" from "not ours".
 */
function looksLikeBffErrorBody(text: string): boolean {
  if (text.trim() === "") return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return false;
  }
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    typeof (parsed as { _tag?: unknown })._tag === "string"
  );
}

/**
 * `HttpApiClient.make`'s `transformClient` hook (see `BffService.ts`).
 *
 * Fixing #2440 made every declared error status (404/502/503/400) a real
 * entry in the client's decode map. That is correct for a genuine BFF error
 * body, but a response that merely *matches one of those statuses* without
 * being our own error shape — a stale or misconfigured worker's
 * unmatched-route reply, a routing/proxy layer's HTML error page — now fails
 * `HttpApiClient`'s decode and surfaces as a bare `ParseError`, which
 * `PERMANENT_BFF_TAGS` treats as permanent. That silently and permanently
 * degrades a block that should instead throw so ISR retries on the next
 * regeneration (#2924).
 *
 * The distinction has to be drawn here, before the response reaches
 * `HttpApiClient`'s decode: by the time a bad decode becomes a `ParseError`,
 * the information that would tell "status matched but body isn't ours"
 * apart from "body IS ours but this deploy can't decode it" is gone — both
 * look identical to `classify-bff-failure.ts` (#2924 triage, "Reading the
 * body consumes it" trap). So this runs upstream of decoding, where both the
 * status and the raw body are still in hand:
 *
 * - Status not in `DECLARED_ERROR_STATUSES` (including every 2xx): pass the
 *   response through untouched. A `ParseError` from a *success*-status body
 *   that fails the success schema is a genuine contract mismatch and must
 *   stay permanent — this guard never touches that path.
 * - Status matches a declared error, body reads back as `{ _tag: string,
 *   … }` JSON: rebuild the response from the text already read (the
 *   original's stream is now drained) and hand it onward — `HttpApiClient`
 *   decodes it exactly as it would have without this guard, so a genuine
 *   `HttpNotFound`/`HttpBadGateway`/`HttpServiceUnavailable`/`HttpBadRequest`
 *   still decodes to its typed class and still classifies as permanent.
 * - Status matches a declared error, body does NOT read back as ours (empty,
 *   HTML, JSON without a string `_tag`, malformed JSON): fail with a
 *   transient `HttpClientError.ResponseError` instead of letting the decode
 *   fail into `ParseError` — the same tag an *undeclared* status already
 *   falls through to (see `BffService.test.ts`'s "an undeclared status
 *   surfaces as an untyped ResponseError" test), so this is not a new
 *   failure mode, only a wider gate for the one that already exists.
 */
export function guardDeclaredErrorBody(
  client: HttpClient.HttpClient,
): HttpClient.HttpClient {
  return client.pipe(
    HttpClient.transformResponse((effect) =>
      effect.pipe(
        Effect.flatMap((response) => {
          if (!DECLARED_ERROR_STATUSES.has(response.status)) {
            return Effect.succeed(response);
          }
          return response.text.pipe(
            Effect.flatMap((text) => {
              if (looksLikeBffErrorBody(text)) {
                // Rebuild from the text already read — the original web
                // Response's body stream is drained and can't be replayed.
                return Effect.succeed(
                  HttpClientResponse.fromWeb(
                    response.request,
                    new Response(text, { status: response.status }),
                  ),
                );
              }
              return Effect.fail(
                new HttpClientError.ResponseError({
                  request: response.request,
                  response,
                  reason: "Decode",
                  description: `status ${response.status} matches a declared BFF error, but the body is not this BFF's own error shape — likely a stale or misconfigured worker, not a genuine BFF error`,
                }),
              );
            }),
          );
        }),
      ),
    ),
  );
}
