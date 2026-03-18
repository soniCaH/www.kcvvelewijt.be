# PRD: FootbalistoService — Deep Domain Service

**Issue**: #846
**Status**: Ready for implementation
**Date**: 2026-03-18

---

## 1. Problem Statement

Every BFF handler manually orchestrates three things: call `FootbalistoClient.getRaw*()`, pipe the result through a transform function from `transforms.ts`, and apply inline business rules (e.g. filtering team 23). Handlers know far too much — they are tightly coupled to both the raw PSD shape and the normalisation logic. Adding or changing an endpoint requires touching the client, the transforms file, and the handler. The interface (8 raw methods + 10+ transform functions) is nearly as complex as the implementation it's supposed to hide. This makes the domain logic untestable at the right boundary: tests currently mock the client or transforms in isolation, but never test the combined behaviour that actually runs in production.

## 2. Scope

**Packages touched**: `apps/api`

**In scope**:

- New `FootbalistoService` Effect service that returns normalized domain types directly
- Absorbs `FootbalistoClient` (HTTP + schema decode) + `transforms.ts` (raw → domain mapping) + inline business rules currently in handlers
- Handlers become thin: yield `FootbalistoService`, call one method, return result
- Existing handler tests replaced by `FootbalistoService` boundary tests (mocking only the HTTP layer)

**Out of scope**:

- Cache layer — `KvCacheService` stays in handlers; this refactor does not move cache logic
- `api-contract` schema changes — normalized types (`Match`, `MatchDetail`, etc.) are unchanged
- Player/team data (`getRawTeams`, `getRawMembers`, `getRawStaff`) — these come from Drupal via `DrupalService`, not FootbalistoService; leave them untouched
- UI or `apps/web` changes — zero impact on the web app

## 3. Tracer Bullet

Implement `FootbalistoService.getTeamStats(teamId)` end-to-end:

- New `FootbalistoService` Effect tag with a single method: `getTeamStats`
- `FootbalistoServiceLive` layer that depends only on `HttpClient` (or equivalent fetch primitive) — no `FootbalistoClient` tag in its context
- Absorbs `getRawTeamStats` HTTP call + `transformPsdTeamStats` + inline season fetch
- `StatsApiHandler` yields `FootbalistoService` instead of `FootbalistoClient` + transform call
- One `FootbalistoService` boundary test: mock HTTP responses, assert `TeamStats` shape
- `pnpm --filter @kcvv/api check-all` passes

Stats is the simplest handler (one raw call, one transform, no business rules) — ideal tracer bullet.

## 4. Phases

```
Phase 1: FootbalistoService tracer bullet — getTeamStats → #855
Phase 2: Migrate matches — getTeamMatches, getNextMatches, getMatchById, getMatchDetail → #856
Phase 3: Migrate ranking — getRanking → #857
Phase 4: Delete FootbalistoClient + transforms.ts; clean up handler tests → #858
```

## 5. Acceptance Criteria

### Phase 1 — Tracer bullet

- [ ] `FootbalistoService` Effect tag defined with `getTeamStats(teamId: number): Effect<TeamStats, FootbalistoError>`
- [ ] `FootbalistoServiceLive` layer wires HTTP fetch + PSD schema decode + `transformPsdTeamStats` internally
- [ ] `stats.ts` handler yields `FootbalistoService`, calls `getTeamStats`, no direct import of transforms
- [ ] One new `FootbalistoService` boundary test: `getTeamStats` with mocked HTTP returns correct `TeamStats`
- [ ] Old `client.ts` and `transforms.ts` still exist (not deleted yet)
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2 — Matches

- [ ] `FootbalistoService` adds: `getTeamMatches`, `getNextMatches`, `getMatchById`, `getMatchDetail`
- [ ] `getNextMatches` internally filters out team 23 (Weitse Gans) — no filter logic in handler
- [ ] `getMatchDetail` returns `MatchDetail` directly (TTL selection stays in handler, not service)
- [ ] `matches.ts` handlers yield only `FootbalistoService` + `KvCacheService`
- [ ] Boundary tests cover all 4 methods with mocked HTTP
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 3 — Ranking

- [ ] `FootbalistoService` adds: `getRanking(teamId: number, logoCdnUrl: string): Effect<RankingEntry[], FootbalistoError>`
- [ ] Competition selection logic (prefer non-CUP, non-FRIENDLY; fallback to any with teams) moved into service
- [ ] `ranking.ts` handler yields only `FootbalistoService` + `KvCacheService`
- [ ] Boundary test covers competition selection logic with mocked HTTP
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 4 — Cleanup

- [ ] `FootbalistoClient` tag and `FootbalistoClientLive` layer deleted
- [ ] `transforms.ts` deleted
- [ ] Raw PSD types (`PsdGame`, `FootbalistoMatch`, etc.) moved inside `FootbalistoServiceLive` implementation — not exported
- [ ] All handler test files updated: no more `FootbalistoClient` mocks
- [ ] `pnpm --filter @kcvv/api check-all` passes

## 6. Effect Schema / api-contract Changes

None. Normalized output types (`Match`, `MatchDetail`, `RankingEntry`, `TeamStats`) are unchanged. Raw PSD types (`PsdGame`, `FootbalistoMatch`, etc.) become implementation details hidden inside `FootbalistoServiceLive`.

## 7. Open Questions

- `[ ]` **`logoCdnUrl` injection for ranking**: Currently passed as a parameter from the handler (from env). Should `FootbalistoService` take it as a constructor dependency (via a config layer), or keep it as a method argument? — Decide during Phase 1 design; method argument is simpler, config layer is cleaner.
- `[ ]` **Season fetch caching**: `getRawTeamStats` and `getRawMatches` both fetch the current season first. Should season lookup be a shared internal helper in `FootbalistoServiceLive`, or extracted into a tiny `SeasonService`? — Will become clear during Phase 2 when both match methods need it.
- `[ ]` **Error type unification**: `FootbalistoClient` exposes `FootbalistoError | FootbalistoValidationError`. Should `FootbalistoService` expose a single unified `FootbalistoServiceError`, or keep both? — Answered by tracer bullet: pick unified for a simpler interface.

## 8. Discovered Unknowns

_Filled during implementation._
