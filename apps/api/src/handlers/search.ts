import { Effect, Option, Schema as S } from "effect";
import { HttpApiBuilder, HttpServerRequest } from "@effect/platform";
import {
  CLIENT_IP_HEADER,
  PsdApi,
  HttpServiceUnavailable,
  HttpTooManyRequests,
  SearchResponse,
  type SearchRequest,
} from "@kcvv/api-contract";
import { handleSearch } from "../search/search-handler";
import { KvCacheService, TTL } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";

/** Cache key of one search: same normalised query, type and limit → same
 * entry (#3468). */
export const searchCacheKey = (request: typeof SearchRequest.Type): string =>
  `search:v1:${request.type ?? "all"}:${request.limit}:${request.query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")}`;

const decodeCached = S.decodeUnknownOption(S.parseJson(SearchResponse));

const tooMany = () =>
  new HttpTooManyRequests({
    error: "Too many searches, try again in a minute",
  });

/** One rate-limit check. Fails open on a binding error: the AI daily cap
 * (search/ai-answer.ts) stays as the backstop, and search stays up. */
const allowed = (limiter: RateLimit, key: string) =>
  Effect.tryPromise(() => limiter.limit({ key })).pipe(
    Effect.map((outcome) => outcome.success),
    Effect.catchAll((cause) =>
      Effect.logWarning(`[search] rate limiter failed for "${key}"`, {
        cause,
      }).pipe(Effect.as(true)),
    ),
  );

/**
 * `/search` with its ceilings (#3468): the per-visitor limit, then the
 * 1-hour response cache (a hit makes no AI or Vectorize call), then the
 * global limit on a miss only.
 */
export const searchWithCeilings = (
  request: typeof SearchRequest.Type,
  clientIp: string | undefined,
) =>
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const cache = yield* KvCacheService;

    if (!(yield* allowed(env.SEARCH_IP_LIMITER, `ip:${clientIp ?? "unknown"}`)))
      return yield* tooMany();

    // shortcut: a query whose key passes KV's 512-byte key limit is never
    // cached (the put fails silently); the rate limits still bound it.
    const key = searchCacheKey(request);
    const cached = yield* cache.get(key);
    const hit = cached === null ? Option.none() : decodeCached(cached);
    if (Option.isSome(hit)) return hit.value;

    if (!(yield* allowed(env.SEARCH_GLOBAL_LIMITER, "global")))
      return yield* tooMany();

    const response = yield* handleSearch(request).pipe(
      Effect.tapError((error) =>
        Effect.logError(`[search] failed: ${error.message}`),
      ),
      Effect.mapError(
        () =>
          new HttpServiceUnavailable({ error: "Search service unavailable" }),
      ),
    );
    yield* cache.set(key, JSON.stringify(response), TTL.SEARCH);
    return response;
  });

export const SearchApiLive = HttpApiBuilder.group(
  PsdApi,
  "search",
  (handlers) =>
    handlers.handle("search", ({ payload }) =>
      Effect.flatMap(HttpServerRequest.HttpServerRequest, (request) =>
        searchWithCeilings(payload, request.headers[CLIENT_IP_HEADER]),
      ),
    ),
);
