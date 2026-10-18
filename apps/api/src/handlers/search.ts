import { Effect, Option, Schema as S } from "effect";
import { HttpApiBuilder, HttpServerRequest } from "@effect/platform";
import {
  CLIENT_IP_HEADER,
  PsdApi,
  HttpServiceUnavailable,
  HttpTooManyRequests,
  SearchResponse,
  TeamGuessResponse,
  type SearchRequest,
  type TeamGuessRequest,
} from "@kcvv/api-contract";
import { asksForAnswer, handleSearch } from "../search/search-handler";
import { KvCacheService, TTL } from "../cache/kv-cache";
import { AiAnswerService } from "../search/ai-answer";
import { WorkerEnvTag } from "../env";

/** SHA-256 hex of `prefix` + the trimmed, lowercased, whitespace-collapsed
 * query — any query length fits KV's 512-byte key limit. */
const queryDigest = (query: string, prefix = "") =>
  Effect.promise(async () => {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(
        prefix + query.trim().toLowerCase().replace(/\s+/g, " "),
      ),
    );
    return Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
  });

/** Cache key of one search: same normalised query, type and limit → same
 * entry (#3468). */
export const searchCacheKey = (request: typeof SearchRequest.Type) =>
  Effect.map(
    queryDigest(request.query),
    (hex) => `search:v1:${request.type ?? "all"}:${request.limit}:${hex}`,
  );

/** Cache key of one team guess (#3559): the team list is part of the digest,
 * so a new season's teams never get last season's pick. */
export const teamGuessCacheKey = (request: typeof TeamGuessRequest.Type) =>
  Effect.map(
    queryDigest(request.query, `${request.ages.join(",")}|`),
    (hex) => `teamguess:v1:${hex}`,
  );

const decodeCached = S.decodeUnknownOption(S.parseJson(SearchResponse));
const decodeCachedGuess = S.decodeUnknownOption(S.parseJson(TeamGuessResponse));

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

    const key = yield* searchCacheKey(request);
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
    // A dropped answer (daily cap, LLM failure or timeout) is not stored: the
    // next search may get one. Stored: no answer asked for, or one produced.
    if (!asksForAnswer(response.results) || response.answer !== undefined)
      yield* cache.set(key, JSON.stringify(response), TTL.SEARCH);
    return response;
  });

/**
 * `/search/team-guess` (#3559) behind `/search`'s ceilings: the same two rate
 * limits and the same AI daily cap, its own cache prefix. The cap or an AI
 * error answers `age: null` and is not stored, so a later try may get a pick.
 */
export const teamGuessWithCeilings = (
  request: typeof TeamGuessRequest.Type,
  clientIp: string | undefined,
) =>
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const cache = yield* KvCacheService;

    if (!(yield* allowed(env.SEARCH_IP_LIMITER, `ip:${clientIp ?? "unknown"}`)))
      return yield* tooMany();

    const key = yield* teamGuessCacheKey(request);
    const cached = yield* cache.get(key);
    const hit = cached === null ? Option.none() : decodeCachedGuess(cached);
    if (Option.isSome(hit)) return hit.value;

    if (!(yield* allowed(env.SEARCH_GLOBAL_LIMITER, "global")))
      return yield* tooMany();

    const ai = yield* AiAnswerService;
    const age = yield* ai.guessTeam(request.query, request.ages);
    if (age === undefined) return { age: null };
    const response = { age };
    yield* cache.set(key, JSON.stringify(response), TTL.SEARCH);
    return response;
  });

export const SearchApiLive = HttpApiBuilder.group(
  PsdApi,
  "search",
  (handlers) =>
    handlers
      .handle("search", ({ payload }) =>
        Effect.flatMap(HttpServerRequest.HttpServerRequest, (request) =>
          searchWithCeilings(payload, request.headers[CLIENT_IP_HEADER]),
        ),
      )
      .handle("teamGuess", ({ payload }) =>
        Effect.flatMap(HttpServerRequest.HttpServerRequest, (request) =>
          teamGuessWithCeilings(payload, request.headers[CLIENT_IP_HEADER]),
        ),
      ),
);
