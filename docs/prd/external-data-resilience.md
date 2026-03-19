# PRD: External Data Resilience — tolerant decode of external API data

**Parent issue:** [#938](https://github.com/soniCaH/www.kcvvelewijt.be/issues/938)
**Status:** Draft
**Scope:** `apps/api` | `packages/api-contract` (cleanup only)

---

## 1. Problem statement

The BFF decodes external PSD/Footbalisto API responses using strict Effect Schemas where every field is required and every array item must be valid. When PSD returns one malformed item — a ghost match with null clubs (#937), a player with missing stats, a ranking entry with a null team — the **entire endpoint fails** with an HTTP 500. The user sees a broken page instead of 95% correct data. This fragility compounds with PSD's undocumented data quality: forfeited teams, mid-season restructures, and admin errors can produce dirty data at any time. We need a systematic pattern to tolerate faulty external data while guaranteeing strict internal types after the decode boundary.

---

## 2. Scope

**In scope**

- `apps/api/src/footbalisto/service.ts` — add service-level resilient decoding using `Effect.partition` + `S.decodeUnknown` per item; replace manual filter/guard patterns; remove `isValidGame()`-style type guards
- `apps/api/src/footbalisto/schemas.ts` — schemas stay strict (no tolerant variants); only touched if fields need to be corrected (required vs optional)
- `packages/api-contract/src/schemas/player.ts` — move `PsdMember`/`PsdTeam` out of api-contract into `apps/api` (they are external PSD shapes, not normalized output types)
- Tests for the new schema pipelines

**Out of scope**

- Typed error channels / replacing `Effect.orDie` (→ PRD: Effect-Native BFF)
- HTTP status code mapping (→ PRD: Effect-Native BFF)
- Replacing `console.warn` with `Effect.log` across the board (→ PRD: Effect-Native BFF, though new code in this PRD uses `Effect.log` from the start)
- Observability infrastructure (Slack alerts, dashboards) — `Effect.log` is the seam; the backend is swappable via Logger Layer later
- Changes to `apps/web` (it consumes normalized types from api-contract; benefits automatically)
- Changes to `apps/studio`
- Gold-plating `Footbalisto*` schemas — these are being phased out in favor of direct PSD endpoints; apply the pattern only where it prevents real failures today

---

## 3. Tracer bullet

Add resilient decoding to **`getTeamMatches`** (the `/games/team/{teamId}/seasons/{seasonId}` endpoint). This is the service method that caused #937, has a known real-world failure mode (ghost matches), and already has a manual filter pattern from the #937 fix that can be replaced.

The approach: `fetchJson` returns the raw JSON array (decoded as `unknown[]`), then `Effect.partition` + `S.decodeUnknown(PsdGame)` splits valid/invalid items in the service method. Schemas stay strict.

The tracer bullet proves:

- `Effect.partition` + `S.decodeUnknown` per item works in the service layer
- Item-level filtering with `Effect.log` for rejected items works in production (Cloudflare Workers)
- The strict `PsdGame` schema is the only game schema — no separate tolerant variant needed
- Existing handler tests and cache behavior are unaffected

---

## 4. Phases

```
Phase 1: Tracer bullet — resilient match list decoding (Effect.partition + S.decodeUnknown) → #940
Phase 2: PsdTeamStatsResponse + FootbalistoRankingArray resilient decoding → #941
Phase 3: FootbalistoMatchDetailResponse resilient decoding → #942
Phase 4: Cleanup — move PsdMember/PsdTeam out of api-contract into apps/api → #943
```

**Migration order rationale:**

- Phase 1: Known failure mode, highest risk, validates the `Effect.partition` pattern
- Phase 2: Two independent endpoints with array-of-items structure (natural fit for item-level filtering)
- Phase 3: Nested structure (general + lineup + events) — more complex, but Footbalisto API is being phased out so only do this if the endpoint is still active
- Phase 4: Housekeeping — no behavior change, just moving schemas to the correct package

---

## 5. Acceptance criteria per phase

### Phase 1 — Resilient match list decoding

- [ ] **No separate `PsdRawGame` schema** — the strict `PsdGame` is the only game schema
- [ ] `PsdMatchListSchema` decodes only the wrapper structure: `S.Struct({ content: S.Array(S.Unknown) })` (or equivalent)
- [ ] `getTeamMatches` uses `Effect.partition` + `S.decodeUnknown(PsdGame)` to split valid/invalid items from the raw array
- [ ] Invalid items are logged via `Effect.log` with count and IDs where extractable
- [ ] Valid items pass through unchanged — no data loss
- [ ] Manual `isValidGame()` type guard and `Array.filter` in service.ts are removed (if present from #937)
- [ ] `transformPsdGame` input type remains `PsdGame` (strict) — no changes downstream
- [ ] `getNextMatches` uses the same resilient decode pattern
- [ ] `pnpm --filter @kcvv/api test` passes
- [ ] `pnpm --filter @kcvv/api check-all` passes
- [ ] Manual test: `curl /matches/18` returns 200 with ghost matches filtered (not 500)

### Phase 2 — PsdTeamStatsResponse + FootbalistoRankingArray

- [ ] `PsdTeamStatsResponse.squadPlayerStatistics` uses `Effect.partition` + per-item decode — invalid player entries are filtered, valid ones pass through
- [ ] `FootbalistoRankingArray` uses `Effect.partition` + per-item decode — invalid ranking entries are filtered
- [ ] Each service method logs filtered items with `Effect.log`
- [ ] `transformPsdTeamStats` and `transformFootbalistoRankingEntry` input types remain strict
- [ ] Heuristic applied: ranking with 0 valid entries after filtering → request-level failure (nonsensical to serve empty ranking)
- [ ] `pnpm --filter @kcvv/api test` passes
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 3 — FootbalistoMatchDetailResponse

- [ ] `FootbalistoMatchDetailResponse` lineup and events arrays use `Effect.partition` + per-item decode
- [ ] Invalid lineup players are filtered; invalid events are filtered
- [ ] `general` (the match itself) remains strict — if the core match data is invalid, the request fails (nonsensical to serve a detail page without the match)
- [ ] `pnpm --filter @kcvv/api test` passes
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 4 — Move PsdMember/PsdTeam to apps/api

- [ ] `PsdMember`, `PsdMembersPage`, `PsdTeam`, `PsdTeamsArray` moved from `packages/api-contract/src/schemas/player.ts` to `apps/api/src/footbalisto/schemas.ts` (or a new `schemas-sync.ts`)
- [ ] `packages/api-contract` no longer exports raw PSD shapes
- [ ] `apps/api/src/sync/psd-team-client.ts` imports from local schemas instead of `@kcvv/api-contract`
- [ ] No other consumer of these types exists in `apps/web` (verify before moving)
- [ ] `pnpm turbo build` passes across all packages
- [ ] `pnpm --filter @kcvv/api check-all` passes

---

## 6. Effect Schema / api-contract changes

### Changed in `apps/api/src/footbalisto/schemas.ts` (Phase 1)

```typescript
// PsdGame stays strict — no PsdRawGame needed
// PsdMatchListSchema decodes only the wrapper; item validation moves to service
export const PsdMatchListSchema = S.Struct({
  content: S.Array(S.Unknown),
});
```

### Pattern in `apps/api/src/footbalisto/service.ts` (Phase 1)

```typescript
// Service-level resilient decoding using Effect.partition
getTeamMatches: (teamId: number) =>
  Effect.gen(function* () {
    const season = yield* getCurrentSeason();
    const data = yield* countedFetch(
      `${base}/games/team/${teamId}/seasons/${season.id}`,
      PsdMatchListSchema,
    );

    const [errors, games] = yield* Effect.partition(
      data.content,
      (item) => S.decodeUnknown(PsdGame)(item),
    );

    if (errors.length > 0) {
      yield* Effect.log(
        `getTeamMatches(${teamId}): filtered ${errors.length} invalid game(s)`,
      );
    }

    return games.map(transformPsdGame);
  }),
```

### Removed from `packages/api-contract` (Phase 4)

- `PsdMember`, `PsdMembersPage`, `PsdTeam`, `PsdTeamsArray` — moved to `apps/api`

### No changes to internal schemas

`Match`, `MatchDetail`, `RankingEntry`, `TeamStats` in api-contract are unchanged. The tolerant→strict boundary lives entirely in `apps/api`.

---

## 7. Open questions

- [ ] **`PsdMatchListSchema` with `S.Array(S.Unknown)` vs raw JSON.** Using `S.Array(S.Unknown)` in the wrapper schema is pragmatic but the only place `S.Unknown` appears. Alternative: skip the wrapper schema entirely and extract the `content` array from raw JSON in the service. → Decide during Phase 1 implementation
- [ ] **Should `PsdSeason` get the tolerant treatment?** Seasons are a small array (< 10 items) and a bad season would mean "no active season found" anyway. Likely not worth it — will be answered during Phase 2 if stats/ranking pipelines surface issues. → Decide during implementation
- [ ] **Phase 3 worth doing?** Footbalisto match detail API is being phased out. If the migration to PSD-direct endpoints happens before Phase 3, skip it entirely. → Decide based on migration timeline
- [ ] **`PsdMember`/`PsdTeam` consumers in apps/web?** Must verify no direct imports exist before Phase 4 move. → Answered by codebase search during Phase 4
- [ ] **Item-level filtering heuristic per schema** — "serve partial" vs "fail request" — the default is serve partial, but Phase 2 needs to decide: is an empty ranking after filtering meaningful or should it 404? → Decide during Phase 2

---

## 8. Discovered unknowns

_(Filled during implementation)_
