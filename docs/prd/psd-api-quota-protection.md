# PRD: PSD API Quota Protection

**Status**: Ready for implementation
**Date**: 2026-03-19

---

## 1. Problem Statement

The club's PSD API key is shared across all systems (Gatsby lambda + new BFF) with a hard limit of 2000 calls/day. The BFF alone consumes ~650 calls/day across production and staging — not because of real traffic, but because TTLs are too short. The most expensive endpoint (`getNextMatches`) makes 19+ PSD calls per cache miss, and the staging environment shares the same quota as production. Next.js `<Link>` prefetching causes server-side BFF calls for all linked team pages even without user interaction. When the quota is exhausted mid-day, there is no fallback: a 429 from PSD causes a 500 to the user instead of serving the data that was valid an hour ago. Before go-live this needs to be fixed — the new site cannot be the system that depletes the shared API budget.

## 2. Scope

**Packages touched**: `apps/api`

**In scope**:

- Increase TTL constants in `cache/kv-cache.ts` for all endpoints
- Extend `TypedKvCache.getOrFetch` to support stale-on-error: serve expired cache data when PSD returns 429/500 instead of propagating the error
- Env-driven 365-day TTL for the staging environment (effectively "fixture" behaviour without a separate fixture system)
- `cache:clear:staging` and `cache:clear:staging:key` pnpm scripts for manual invalidation

**Out of scope**:

- Season caching — already implemented (`psd:current-season-id`, 24h TTL)
- Gatsby lambda call reduction — cannot change live behaviour
- Changes to `packages/api-contract`, `apps/web`, `apps/studio`
- A dedicated fixture refresh script — 365-day staging TTL makes this unnecessary
- Rate limiting or throttling of incoming requests to the BFF

## 3. Tracer Bullet

Change `NEXT_MATCHES` TTL from 30 minutes to 4 hours in `cache/kv-cache.ts`. Deploy to staging. Verify via the KV counter that staging calls for the `matches:next` key drop from ~12/day to ~4/day within 24 hours of deploy. No schema changes, no interface changes — one constant, immediate relief on the most expensive endpoint.

## 4. Phases

```
Phase 1: NEXT_MATCHES TTL 30min → 4h — tracer bullet → #877
Phase 2: All remaining TTL increases — MATCHES_TEAM, RANKING, STATS → 24h → #878
Phase 3: Stale-on-error — extend TypedKvCache with hard/soft TTL + stale fallback → #879
Phase 4: Staging long TTL + cache invalidation scripts → #880
```

## 5. Acceptance Criteria

### Phase 1 — Tracer bullet

- [ ] `TTL.NEXT_MATCHES` changed from `60 * 30` to `60 * 60 * 4`
- [ ] KV key `matches:next` is stored with 4h TTL (manual check: verify via Cloudflare dashboard after first request)
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2 — All TTL increases

- [ ] `TTL.MATCHES_TEAM` changed from 6h to 24h
- [ ] `TTL.RANKING` changed from 4h to 24h
- [ ] `TTL.STATS` changed from 12h to 24h
- [ ] `TTL.MATCH_DETAIL_LIVE` removed entirely — no live scores exist, 60s polling was pointless
- [ ] `TTL.MATCH_DETAIL_DEFAULT` added at 24h — used for all non-finished match details
- [ ] `TTL.MATCH_DETAIL_PAST` (7 days) unchanged
- [ ] Match detail TTL function: `finished AND match.date ≥ 48h ago → MATCH_DETAIL_PAST (7d)`; all other cases (upcoming, in-progress by timestamp, finished but recent) → `MATCH_DETAIL_DEFAULT (24h)`
- [ ] **Known tradeoff**: youth match scores can take longer than 48h to be entered in the association platform. A recently-finished youth match may serve a scoreless result for up to 24h before re-fetching. Accepted.
- [ ] TTL table in `apps/api/CLAUDE.md` updated to reflect new values
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 3 — Stale-on-error

- [ ] `TypedKvCache` stores values as `{ value: A, fetchedAt: number }` wrapper (breaks existing cache — acceptable one-time cold start)
- [ ] `getOrFetch` accepts a `softTtl` parameter (freshness threshold — current TTL constants) and stores with a `hardTtl` (safety-net storage TTL, e.g. 7 days)
- [ ] If `now - fetchedAt > softTtl`: attempt fresh fetch; on success → update cache; on failure (any error including 429/500) → return stale value + `Effect.logWarning`
- [ ] If `now - fetchedAt <= softTtl`: return cached value immediately (no PSD call)
- [ ] All handler call sites updated to pass `softTtl` (current TTL value) and `hardTtl` (7 days)
- [ ] Existing `TypedKvCache` tests updated; new tests cover: stale-on-error path, stale-on-success path, fresh path
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 4 — Staging long TTL + cache scripts

- [ ] `CACHE_LONG_TTL = "true"` added to `[env.staging.vars]` in `wrangler.toml`
- [ ] `WorkerEnv` type updated with `CACHE_LONG_TTL?: string`
- [ ] Handlers (or `TypedKvCache`) check `CACHE_LONG_TTL` and override `hardTtl` to 365 days when set
- [ ] Staging first-load cold-starts once per key, then serves from KV for up to a year
- [ ] `apps/api/package.json` scripts added:
  ```json
  "cache:clear:staging": "wrangler kv key list --binding=PSD_CACHE --env staging | jq -r '.[].name' | xargs -I{} wrangler kv key delete --binding=PSD_CACHE --env staging \"{}\"",
  "cache:clear:staging:key": "wrangler kv key delete --binding=PSD_CACHE --env staging"
  ```
- [ ] `apps/api/CLAUDE.md` documents cache invalidation under a new `## Cache invalidation` section with usage examples
- [ ] `pnpm --filter @kcvv/api check-all` passes

## 6. Effect Schema / api-contract Changes

None. The stale-on-error wrapper (`{ value, fetchedAt }`) is internal to `TypedKvCache` — it is not part of any api-contract schema and never crosses the BFF→web boundary.

## 7. Open Questions

- `[ ]` **Stale-on-error wrapper migration**: Existing KV entries store raw JSON (no `fetchedAt`). On Phase 3 deploy, all cache entries will fail to decode as the new wrapper format and trigger a one-time cold start across all endpoints. This is acceptable but will generate a spike of ~100–150 PSD calls at deploy time. Deploy outside of peak hours (not Saturday afternoon). — Resolved by timing; no code change needed.
- `[ ]` **`hardTtl` for production**: 7 days chosen as the production hard TTL safety net. This means a cache entry that hasn't been refreshed in 7 days will be deleted by Cloudflare KV even if PSD is still rate-limiting. Is 7 days long enough, or should it be 30 days? — Decide before Phase 3 implementation; 7 days covers a full match week.
- `[ ]` **`CACHE_LONG_TTL` placement**: Should the 365-day override live in `TypedKvCache` (reads env via `WorkerEnvTag`) or in each handler call site? Putting it in `TypedKvCache` is cleaner but couples the cache layer to env. Putting it in handlers is more explicit. — Decide during Phase 4; lean toward `TypedKvCache` for DRY.

## 8. Discovered Unknowns

_Filled during implementation._
