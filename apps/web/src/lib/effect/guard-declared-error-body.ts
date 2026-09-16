import { Effect, Either, Schema as S } from "effect";
import type * as AST from "effect/SchemaAST";
import {
  HttpApi,
  HttpApiSchema,
  HttpClient,
  HttpClientError,
  HttpClientResponse,
} from "@effect/platform";
import { PsdApi } from "@kcvv/api-contract";

/**
 * Every status `PsdApi` declares an error for, mapped to a schema decoding
 * against the *exact same AST* `HttpApiClient` itself would decode against —
 * reflected off the live contract via `HttpApi.reflect`
 * (`@effect/platform`'s own `HttpApiClient.make` builds its per-status decode
 * map the identical way; see its `HttpApiClient.js` `schemaToResponse`).
 *
 * Deliberately **not** a hand-typed `[404, 502, 503, 400]` tied to the four
 * classes in `@kcvv/api-contract`'s `http-errors` module: that was this
 * guard's first version, and it only derived the status *numbers* that way —
 * the class list itself was still hand-maintained, so a fifth error class
 * (or a fifth declared status on an existing one) would silently reintroduce
 * #2924 with no compiler error and no failing test (#2924 review finding 1).
 * Reflecting `PsdApi` directly closes that: every status any endpoint
 * declares an error for is picked up automatically the next time the
 * contract changes, nothing here needs editing, and there is no second list
 * to fall out of sync with the first.
 */
const DECLARED_ERROR_SCHEMAS: ReadonlyMap<
  number,
  S.Schema<unknown, unknown>
> = (() => {
  const astsByStatus = new Map<number, Set<AST.AST>>();
  HttpApi.reflect(PsdApi, {
    onGroup: () => {},
    onEndpoint: ({ errors }) => {
      errors.forEach(({ ast }, status) => {
        if (ast._tag === "None") return;
        const asts = astsByStatus.get(status) ?? new Set<AST.AST>();
        asts.add(ast.value);
        astsByStatus.set(status, asts);
      });
    },
  });
  return new Map(
    Array.from(astsByStatus, ([status, asts]) => {
      const schemas = Array.from(asts, (ast) => {
        // Every declared error in this contract is a plain JSON body
        // (HttpApiSchema's default encoding) — confirmed per-AST rather
        // than assumed, so a future error class on a different encoding
        // (multipart, url-encoded, …) fails loudly at module load instead
        // of this guard silently misjudging its body.
        const encoding = HttpApiSchema.getEncoding(ast);
        if (encoding.kind !== "Json") {
          throw new Error(
            `guard-declared-error-body: status ${status} declares a non-JSON-encoded error (${encoding.kind}); extend the guard before adding this to PsdApi.`,
          );
        }
        return S.make<unknown, unknown>(ast);
      });
      const schema = schemas.length === 1 ? schemas[0]! : S.Union(...schemas);
      return [status, schema] as const;
    }),
  );
})();

/**
 * True when `text` decodes as the declared error schema for `status` — a
 * real full-schema decode against `DECLARED_ERROR_SCHEMAS`, not merely a
 * check that a `_tag` string is present. `_tag` presence alone would still
 * pass a wrong-version body (an older deploy's `{ "_tag": "HttpNotFound",
 * "message": "…" }`, missing the `error` field this contract now requires)
 * through to `HttpApiClient`'s real decode, where it fails and reintroduces
 * exactly the silent-permanent-degrade #2924 exists to fix (review finding
 * 2) — a wrong-version body is not "this BFF's own error shape" in any
 * sense that matters here.
 *
 * `S.parseJson(schema)` composes the JSON parse into the schema decode
 * itself — malformed JSON is just another decode failure that schema
 * reports, not a separate step this function has to `try`/`catch` around.
 */
function decodesAsDeclaredError(status: number, text: string): boolean {
  const schema = DECLARED_ERROR_SCHEMAS.get(status);
  if (!schema) return false;
  return Either.isRight(S.decodeUnknownEither(S.parseJson(schema))(text));
}

/**
 * `HttpApiClient.make`'s `transformClient` hook (see `BffService.ts`).
 *
 * Fixing #2440 made every declared error status a real entry in the
 * client's decode map. That is correct for a genuine BFF error body, but a
 * response that merely *matches one of those statuses* without decoding as
 * that status's declared error — a stale or misconfigured worker's
 * unmatched-route reply, a routing/proxy layer's HTML error page, an older
 * deploy's now-outdated error shape — now fails `HttpApiClient`'s decode and
 * surfaces as a bare `ParseError`, which `PERMANENT_BFF_TAGS` treats as
 * permanent. That silently and permanently degrades a block that should
 * instead throw so ISR retries on the next regeneration (#2924).
 *
 * The distinction has to be drawn here, before the response reaches
 * `HttpApiClient`'s decode: by the time a bad decode becomes a `ParseError`,
 * the information that would tell "status matched but body doesn't decode as
 * ours" apart from "body IS ours but this deploy can't decode it" is gone —
 * both look identical to `classify-bff-failure.ts` (#2924 triage, "Reading
 * the body consumes it" trap). So this runs upstream of decoding, where both
 * the status and the raw body are still in hand:
 *
 * - Status not in `DECLARED_ERROR_SCHEMAS` (including every 2xx): pass the
 *   response through untouched. A `ParseError` from a *success*-status body
 *   that fails the success schema is a genuine contract mismatch and must
 *   stay permanent — this guard never touches that path.
 * - Status matches a declared error, body decodes against that status's
 *   declared error schema: rebuild the response from the text already read
 *   (the original's stream is now drained) and hand it onward —
 *   `HttpApiClient` decodes it again exactly as it would have without this
 *   guard (the same AST, the same JSON), so a genuine
 *   `HttpNotFound`/`HttpBadGateway`/`HttpServiceUnavailable`/`HttpBadRequest`
 *   still decodes to its typed class and still classifies as permanent.
 * - Status matches a declared error, body does NOT decode as that status's
 *   declared error (empty, HTML, malformed JSON, valid JSON in the wrong
 *   shape — including a `_tag`-bearing body from a mismatched contract
 *   version): fail with a transient `HttpClientError.ResponseError` instead
 *   of letting the decode fail into `ParseError` — the same tag an
 *   *undeclared* status already falls through to (see `BffService.test.ts`'s
 *   "an undeclared status surfaces as an untyped ResponseError" test), so
 *   this is not a new failure mode, only a wider gate for one that already
 *   exists.
 */
export function guardDeclaredErrorBody(
  client: HttpClient.HttpClient,
): HttpClient.HttpClient {
  return client.pipe(
    HttpClient.transformResponse((effect) =>
      effect.pipe(
        Effect.flatMap((response) => {
          if (!DECLARED_ERROR_SCHEMAS.has(response.status)) {
            return Effect.succeed(response);
          }
          return response.text.pipe(
            Effect.flatMap((text) => {
              if (decodesAsDeclaredError(response.status, text)) {
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
                  description: `status ${response.status} matches a declared BFF error, but the body does not decode as that error — likely a stale or misconfigured worker, not a genuine BFF error`,
                }),
              );
            }),
          );
        }),
      ),
    ),
  );
}
