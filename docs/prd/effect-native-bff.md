# PRD: Effect-Native BFF — typed errors, structured logging, idiomatic Effect

**Parent issue:** [#938](https://github.com/soniCaH/www.kcvvelewijt.be/issues/938) (broader scope)
**Depends on:** [External Data Resilience PRD](./external-data-resilience.md) (PRD 1 establishes schema pipelines; this PRD builds on them)
**Status:** Draft
**Scope:** `apps/api`

---

## 1. Problem statement

Every BFF handler wraps its Effect pipeline in `Effect.orDie`, collapsing all errors — PSD unreachable, rate-limited (429, daily limit), schema decode failure, missing resource — into an undifferentiated HTTP 500. The user sees the same broken page whether PSD is down for the day or a team ID doesn't exist. Meanwhile, the BFF's stale-serve cache mechanism (`TypedKvCache` hardTTL fallback) cannot distinguish "upstream failed, serve stale" from "genuinely no data" because the error channel carries no information. The result: pages break unnecessarily when stale data could have been served, and debugging requires log-diving because errors are untyped.

---

## 2. Scope

**In scope**

- `apps/api/src/footbalisto/service.ts` — replace `FootbalistoServiceError` (single error class) with a discriminated union of typed errors
- `apps/api/src/handlers/*.ts` — replace `Effect.orDie` with error-to-HTTP-status mapping
- `apps/api/src/footbalisto/service.ts` — replace `console.warn` with `Effect.log` in transform helpers
- `apps/api/src/cache/kv-cache.ts` — leverage typed errors to improve stale-serve decisions (serve stale on upstream failure, fail on missing resource)
- Tests for error mapping behavior

**Out of scope**

- Changes to `packages/api-contract` — error types are BFF-internal; HTTP status codes are the contract
- Changes to `apps/web` — frontend graceful error handling (showing "temporarily unavailable" UI) is a separate initiative; this PRD provides the correct status codes for it to build on
- Observability infrastructure (Slack/Sentry/dashboards) — `Effect.log` is the seam; Logger Layer is swappable later
- Retry logic for PSD 429 — PSD rate limits are daily, retry is pointless; stale-serve is the only strategy
- Schema pipeline changes (→ PRD: External Data Resilience)

---

## 3. Tracer bullet

Replace `Effect.orDie` on **`getMatchesByTeamHandler`** with typed error handling:

- PSD returns 429 → BFF returns 503 + serves stale cache if available
- PSD returns 5xx → BFF returns 503 + serves stale cache if available
- Schema decode fails → BFF returns 502
- Invalid teamId (PSD returns empty/404) → BFF returns 404

This single handler exercises all error branches and validates the pattern before rolling out to the other handlers.

---

## 4. Phases

```
Phase 1: Typed error taxonomy + tracer bullet (matches handler) → #944
Phase 2: Migrate remaining handlers (ranking, stats, match-detail, search) → #945
Phase 3: Logging cleanup — replace all console.warn with Effect.log → #946
```

---

## 5. Acceptance criteria per phase

### Phase 1 — Typed error taxonomy + tracer bullet

- [ ] `FootbalistoServiceError` is replaced (or augmented) with a discriminated union of tagged errors:

  | Error                      | `_tag`                  | Meaning                                                     |
  | -------------------------- | ----------------------- | ----------------------------------------------------------- |
  | `UpstreamUnavailableError` | `"UpstreamUnavailable"` | PSD returned 429, 5xx, or network failure                   |
  | `UpstreamDecodeError`      | `"UpstreamDecode"`      | PSD returned 200 but response failed schema decode          |
  | `ResourceNotFoundError`    | `"ResourceNotFound"`    | PSD returned 404 or empty result for a valid-shaped request |

- [ ] Error-to-HTTP mapping is centralized (single function or middleware, not per-handler):

  | Error tag             | HTTP status | Body                                           |
  | --------------------- | ----------- | ---------------------------------------------- |
  | `UpstreamUnavailable` | 503         | `{ error: "Service temporarily unavailable" }` |
  | `UpstreamDecode`      | 502         | `{ error: "Bad gateway" }`                     |
  | `ResourceNotFound`    | 404         | `{ error: "Not found" }`                       |
  | Unhandled / defects   | 500         | `{ error: "Internal server error" }`           |

- [ ] `getMatchesByTeamHandler` uses typed errors instead of `Effect.orDie`
- [ ] When PSD returns 429/5xx, `TypedKvCache` stale-serve kicks in and returns 200 with cached data (existing behavior, but now explicitly wired via error type)
- [ ] When PSD returns 429/5xx and no stale cache exists, handler returns 503
- [ ] `fetchJson` preserves HTTP status code from PSD response in the error (already has `status` field)
- [ ] `pnpm --filter @kcvv/api test` passes
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2 — Migrate remaining handlers

- [ ] `getRankingHandler` uses typed errors — 503 on upstream failure, 404 on empty ranking
- [ ] `getTeamStatsHandler` uses typed errors — 503 on upstream failure, 404 on no stats
- [ ] `getMatchDetailHandler` uses typed errors — 503 on upstream failure, 404 on unknown match
- [ ] `getNextMatchesHandler` uses typed errors — individual team failures are caught (existing `Effect.catchAll`), only returns 503 if all teams fail
- [ ] Search handler uses typed errors where applicable
- [ ] No `Effect.orDie` remains in any handler file
- [ ] `pnpm --filter @kcvv/api test` passes
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 3 — Logging cleanup

- [ ] All `console.warn` in `apps/api/src/` are replaced with `Effect.log` or `Effect.logWarning`
- [ ] `mapGameStatus` unknown-code warning uses `Effect.log` (requires signature change to return `Effect`)
- [ ] No `console.log` or `console.warn` remains in `apps/api/src/` (excluding test files)
- [ ] `pnpm --filter @kcvv/api test` passes
- [ ] `pnpm --filter @kcvv/api check-all` passes

---

## 6. Effect Schema / api-contract changes

None. Error types are BFF-internal. HTTP status codes are the contract between BFF and apps/web.

The error types use Effect's `Data.TaggedError` pattern:

```typescript
import { Data } from "effect";

export class UpstreamUnavailableError extends Data.TaggedError(
  "UpstreamUnavailable",
)<{
  readonly message: string;
  readonly status?: number;
  readonly cause?: unknown;
}> {}

export class UpstreamDecodeError extends Data.TaggedError("UpstreamDecode")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ResourceNotFoundError extends Data.TaggedError(
  "ResourceNotFound",
)<{
  readonly message: string;
  readonly resourceType: string;
  readonly resourceId: string | number;
}> {}
```

Handler error mapping (centralized):

```typescript
const mapErrorToResponse = (error: BffError) => {
  switch (error._tag) {
    case "UpstreamUnavailable":
      return HttpApiBuilder.error(503, {
        error: "Service temporarily unavailable",
      });
    case "UpstreamDecode":
      return HttpApiBuilder.error(502, { error: "Bad gateway" });
    case "ResourceNotFound":
      return HttpApiBuilder.error(404, { error: "Not found" });
  }
};
```

> Note: The exact API for returning non-200 responses from `HttpApiBuilder` handlers needs investigation during Phase 1. The `@effect/platform` HTTP layer may require errors to be declared on the endpoint definition in api-contract. If so, we add error schemas to the endpoint definitions — but the types remain simple (status + message), not domain-specific.

---

## 7. Open questions

- [ ] **How does `HttpApiBuilder` handle non-200 responses?** Effect's `@effect/platform` may require error types to be declared on `HttpApiEndpoint` definitions. If so, api-contract endpoints need `setError(...)` — but the error schemas would be generic HTTP error shapes, not domain errors. → Answered by tracer bullet in Phase 1
- [ ] **Should `TypedKvCache.getOrFetch` become error-type-aware?** Today it catches all errors and attempts stale-serve. With typed errors, it could selectively stale-serve on `UpstreamUnavailable` but propagate `ResourceNotFound`. → Decide during Phase 1
- [ ] **`mapGameStatus` signature change** — replacing `console.warn` with `Effect.log` means this pure function must return an `Effect`. Alternatives: (a) make it effectful, (b) collect warnings and log them in the caller, (c) use `Effect.logWarning` in a separate pass. → Decide during Phase 3
- [ ] **What about the sync pipeline?** `psd-sanity-sync.ts` and `psd-team-client.ts` also use `fetchJson` and will inherit the new error types. Sync has different error handling needs (retry on transient failures, skip on decode errors). → Evaluate after Phase 2

---

## 8. Discovered unknowns

_(Filled during implementation)_
