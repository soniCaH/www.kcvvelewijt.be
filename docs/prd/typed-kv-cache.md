# PRD: Typed KV Cache — eliminate duplicated decode pattern across BFF handlers

**GitHub issue:** [#845](https://github.com/soniCaH/www.kcvvelewijt.be/issues/845)
**Status:** Draft
**Scope:** `apps/api`

---

## 1. Problem statement

Every BFF handler that reads from KV cache implements the same 7-line protocol inline:

```typescript
const cached = yield * cache.get(cacheKey);
if (cached) {
  const decoded =
    yield *
    Effect.try({
      try: () => JSON.parse(cached),
      catch: () => null,
    }).pipe(Effect.flatMap(S.decodeUnknown(Schema)), Effect.option);
  if (Option.isSome(decoded)) return decoded.value;
}
```

This pattern appears in **5 handlers** (`getMatchesByTeamHandler`, `getNextMatchesHandler`, `getMatchDetailHandler`, `getRankingHandler`, `getTeamStatsHandler`). Two problems follow. First, decode failures are silently swallowed via `Effect.option` — a stale cache entry with an outdated schema is indistinguishable from a cache miss, making schema-evolution bugs invisible in production. Second, the TTL selection logic (`detail.status === "finished" ? TTL.PAST : TTL.LIVE`) is business logic embedded in a handler file rather than co-located with the caching concern. Changing cache strategy (adding versioning, logging stale hits, adding compression) requires touching every handler individually.

---

## 2. Scope

**In scope**

- `apps/api/src/cache/kv-cache.ts` — add `TypedKvCache<A>` factory on top of the existing `KvCacheService`
- `apps/api/src/handlers/matches.ts`, `ranking.ts`, `stats.ts` — migrate all 5 cache-read sites to `TypedKvCache`
- `apps/api/src/cache/kv-cache.test.ts` — add boundary tests for `TypedKvCache`

**Out of scope**

- Cache key versioning / namespacing (separate concern, separate issue)
- Cache compression
- Changing TTL values
- Any changes to `packages/api-contract` schemas
- Any changes to `apps/web`
- The `increment` method on `KvCacheService` (used for PSD call counting, unrelated)
- Refactoring `FootbalistoClient` or transforms (that is issue #846)

---

## 3. Tracer bullet

Implement `TypedKvCache<A>` and migrate **`getTeamStatsHandler`** (`stats.ts`) only. This handler has the simplest structure: one fetch, one fixed TTL, no conditional TTL logic. If the types, test setup, and Effect layer wiring all work correctly on this handler, the pattern is proven for the remaining four.

Acceptance: `getTeamStatsHandler` uses `typedCache.getOrFetch(...)`, existing `stats.test.ts` still passes, and a new `TypedKvCache` boundary test covers decode-failure fallthrough.

---

## 4. Phases

```
Phase 1: TypedKvCache factory + tracer bullet (stats handler) → #850
Phase 2: Migrate remaining 4 handlers (matches ×2, match-detail, ranking) → #851
Phase 3: Delete redundant decode tests from handler test files → #852
```

---

## 5. Acceptance criteria per phase

### Phase 1 — TypedKvCache factory + tracer bullet

- [ ] `TypedKvCache<A>` is a pure factory function (not a new Effect Context.Tag) in `apps/api/src/cache/kv-cache.ts`, parameterised by an Effect Schema
- [ ] `getOrFetch` signature: `(key: string, fetch: Effect<A, E, R>, ttl: number | ((value: A) => number)) => Effect<A, E, R | KvCacheService>`
- [ ] Cache hit with valid data: returns decoded value without calling `fetch`
- [ ] Cache hit with corrupted/unparseable JSON: logs a warning and falls through to `fetch` (not silent — observable)
- [ ] Cache hit with data that fails schema decode (e.g. stale schema): logs a warning and falls through to `fetch`
- [ ] Cache miss: calls `fetch`, caches result, returns value
- [ ] `getTeamStatsHandler` uses `typedCache.getOrFetch(...)` — inline pattern removed
- [ ] `pnpm --filter @kcvv/api test` passes
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2 — Migrate remaining handlers

- [ ] `getMatchesByTeamHandler` uses `typedCache.getOrFetch(...)` with `TTL.MATCHES_TEAM`
- [ ] `getNextMatchesHandler` uses `typedCache.getOrFetch(...)` with `TTL.NEXT_MATCHES`
- [ ] `getRankingHandler` uses `typedCache.getOrFetch(...)` with `TTL.RANKING`
- [ ] `getMatchDetailHandler` uses `typedCache.getOrFetch(...)` with `(detail) => detail.status === "finished" || detail.status === "forfeited" ? TTL.MATCH_DETAIL_PAST : TTL.MATCH_DETAIL_LIVE`
- [ ] No inline `JSON.parse` / `S.decodeUnknown` / `Effect.option` remains in any handler file
- [ ] All existing handler tests still pass

### Phase 3 — Test cleanup

- [ ] Handler tests that specifically test the cache decode protocol (e.g. `"returns cached MatchDetail without calling client or cache.set"`) are **replaced** by `TypedKvCache` boundary tests — they no longer need to live on the handler
- [ ] Handler tests that test handler-specific behaviour (TTL selection, filtering Weitse Gans, etc.) are kept
- [ ] `pnpm --filter @kcvv/api test` passes with no skipped tests

---

## 6. Effect Schema / api-contract changes

None. `TypedKvCache<A>` accepts any `Schema.Schema<A>` as a parameter. No new schemas are defined.

---

## 7. Open questions

- `[ ]` **Where should stale-decode warnings go?** `Effect.log` (structured) or a dedicated `LoggingService`? — decide during Phase 1 implementation; look at what the rest of `apps/api` does for logging
- `[ ]` **Should `TypedKvCache` be a Context.Tag or a factory function?** Factory is simpler (no new layer to wire); Tag allows injection of a mock in handler tests. The tracer bullet will answer this — if tests become awkward with the factory approach, switch to Tag.
- `[ ]` **Does `getOrFetch` need to accept `Effect<A, E, R>` lazily (as a thunk)?** In Effect, `Effect<A>` is already lazy — no thunk needed. Confirm during Phase 1.

---

## 8. Discovered unknowns

_(Filled during implementation)_
