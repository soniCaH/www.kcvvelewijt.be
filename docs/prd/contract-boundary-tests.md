# PRD: Contract Boundary Tests

**Issue**: #847
**Status**: Ready for implementation
**Date**: 2026-03-18

---

## 1. Problem Statement

The BFF (apps/api) and the web client (apps/web) share types through `@kcvv/api-contract`, but no test verifies that BFF output actually satisfies those schemas before it reaches the wire. Transform functions in `transforms.ts` produce plain JS objects that are never validated against the api-contract schema classes — they're only checked with loose property assertions (`expect(result.id).toBe(1)`). This means a transform could produce `status: "unknown_status"` or a missing required field and all tests would pass; the failure would only surface at runtime when `HttpApiClient` on the web side tries to decode the response and throws `HttpApiDecodeError`. Additionally, the `Match`, `MatchDetail`, `RankingEntry`, and `TeamStats` schemas have no dedicated schema-level tests at all, even though `player.ts` and `search.ts` schemas do.

## 2. Scope

**Packages touched**: `packages/api-contract`, `apps/api`

**In scope**:

- Schema-level tests for `Match`, `MatchDetail`, `RankingEntry`, `TeamStats` in `packages/api-contract`
- Upgrade `transforms.test.ts` assertions to validate transform output against api-contract schemas using `S.decodeUnknownSync`
- Upgrade handler tests (`matches.test.ts`, `ranking.test.ts`, `stats.test.ts`) to schema-validate returned values
- Fix the inconsistency in BFF handlers: validate fresh data output against schema before caching (mirrors what already happens on cache read)

**Out of scope**:

- End-to-end HTTP integration tests spanning both apps — this PRD is unit/integration tests within each package
- Web client `BffService.test.ts` changes — `HttpApiClient` already provides runtime schema validation; the gap is on the BFF side
- `SearchApi` schema tests — `search.test.ts` already exists
- Any new endpoints or schema changes

## 3. Tracer Bullet

In `apps/api/src/footbalisto/transforms.test.ts`, add one schema-validation assertion to the existing `transformPsdGame` test:

```typescript
import * as S from "@effect/schema/Schema";
import { Match } from "@kcvv/api-contract";

// After existing property assertions:
expect(() => S.decodeUnknownSync(Match)(result)).not.toThrow();
```

This proves the pattern is viable (transforms.test.ts can import from api-contract, the schema can validate transform output) and immediately catches any existing schema violations before we write new tests. No new files, no structural changes.

## 4. Phases

```
Phase 1: Tracer bullet — schema assertion in transformPsdGame test → #859
Phase 2: api-contract schema tests — Match, MatchDetail, RankingEntry, TeamStats → #860
Phase 3: Upgrade all transform tests to schema-validate output → #861
Phase 4: Upgrade handler tests to schema-validate return values + fix fresh-data validation gap in handlers → #862
```

## 5. Acceptance Criteria

### Phase 1 — Tracer bullet

- [ ] `transforms.test.ts` imports `Match` from `@kcvv/api-contract` (no circular dep issues)
- [ ] Existing `transformPsdGame` test adds `S.decodeUnknownSync(Match)(result)` assertion
- [ ] Test passes (i.e. current transform output is already valid)
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2 — api-contract schema tests

- [ ] `packages/api-contract/src/schemas/match.test.ts` created with tests for:
  - Valid `Match` object decodes successfully
  - Valid `MatchDetail` object (with and without lineup) decodes successfully
  - Invalid `MatchStatus` value (`"unknown"`) throws on decode
  - Missing required field throws on decode
  - `DateFromStringOrDate` coerces ISO string to `Date` in `Match.date`
- [ ] `packages/api-contract/src/schemas/ranking.test.ts` created with tests for:
  - Valid `RankingEntry` decodes successfully
  - Valid `RankingArray` decodes successfully
  - Missing required field throws on decode
- [ ] `packages/api-contract/src/schemas/stats.test.ts` created with tests for:
  - Valid `TeamStats` decodes successfully
  - Valid `PlayerStats` decodes successfully
  - Numeric field type violations throw on decode
- [ ] `pnpm --filter @kcvv/api-contract check-all` passes

### Phase 3 — Transform tests with schema validation

- [ ] All transform functions in `transforms.test.ts` add `S.decodeUnknownSync(OutputSchema)(result)` assertions:
  - `transformPsdGame` → validates against `Match`
  - `transformFootbalistoMatch` → validates against `Match`
  - `transformFootbalistoMatchDetail` → validates against `MatchDetail`
  - `transformFootbalistoRankingEntry` → validates against `RankingEntry`
  - `transformPsdTeamStats` → validates against `TeamStats`
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 4 — Handler tests + fresh-data validation fix

- [ ] Handler tests upgraded to schema-validate return values:
  - `matches.test.ts`: `S.decodeUnknownSync(MatchesArray)(result)` / `S.decodeUnknownSync(Match)(result)` / `S.decodeUnknownSync(MatchDetail)(result)`
  - `ranking.test.ts`: `S.decodeUnknownSync(RankingArray)(result)`
  - `stats.test.ts`: `S.decodeUnknownSync(TeamStats)(result)`
- [ ] BFF handlers validate fresh data before caching using `S.decodeUnknown(Schema)` (same pattern as cache-read path) — if validation fails, `Effect.orDie` so it surfaces as a 500, not silently caches invalid data
- [ ] `pnpm --filter @kcvv/api check-all` passes

## 6. Effect Schema / api-contract Changes

None. No new schemas, no endpoint changes. Only new test files and upgraded assertions.

## 7. Open Questions

- `[ ]` **Circular dep risk**: `transforms.test.ts` (in `apps/api`) importing from `@kcvv/api-contract` — verify this doesn't create a circular dependency. Should be fine since `apps/api` already depends on `api-contract` for type imports, but confirm with `pnpm turbo build` during tracer bullet.
- `[ ]` **Fresh-data validation failure strategy**: If a transform produces schema-invalid data, should the handler fail fast (500) or log and return the raw data anyway? — Fail fast is safer; surprises in prod are worse than a 500 during development. Confirm during Phase 4.
- `[ ]` **`DateFromStringOrDate` in assertions**: Handler tests may need `S.encodeSync(MatchesArray)(result)` → `JSON.stringify` → `S.decodeUnknownSync` to simulate the full JSON round-trip (since `Date` objects are valid in-memory but need the string coercion to match the wire format). Whether this is needed will become clear during Phase 3.

## 8. Discovered Unknowns

_Filled during implementation._
