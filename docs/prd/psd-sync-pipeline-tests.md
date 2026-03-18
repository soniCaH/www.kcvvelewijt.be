# PRD: PSD→Sanity Sync Pipeline Tests

**Issue**: #849
**Status**: Ready for implementation
**Date**: 2026-03-18

---

## 1. Problem Statement

The PSD→Sanity sync pipeline has clear boundaries on paper (PSD fetch → transform → Sanity upsert → cursor advance), and the transform functions are already well-tested in isolation (34 unit tests). But the two stages that actually cause outages have zero test coverage: `SanityWriteClient` (upsertPlayer, upsertTeam, upsertStaff, uploadPlayerImage) has no mock layer and no tests, and `runSync` — the 136-line Effect that orchestrates the entire nightly cron — has never been tested. This means image upload dedup logic, cursor wrapping behavior, partial failure recovery, and the coupling between transform output and Sanity mutation inputs are all verified only by running the live cron against production Sanity. The pattern for how to test this already exists in the codebase: `sanity-index-sync.test.ts` (the search sync) uses injectable fetch and Effect layer mocking — the PSD sync just hasn't followed it.

## 2. Scope

**Packages touched**: `apps/api`

**In scope**:

- Mock layer for `SanityWriteClient` Effect tag (analogous to how `FootbalistoClient` is mocked in handler tests)
- Unit tests for `runSync` using mocked `FootbalistoClient` + mocked `SanityWriteClient` + mocked `KvCacheService`
- Extract image upload decision logic (`needsUpload`, `extractStableImageUrl`) into pure, tested functions
- Tests for cursor wrapping behavior (cursor 0→1→N→0)

**Out of scope**:

- Decomposing `runSync` into smaller named sub-effects — that's a separate refactor; this PRD adds tests to the existing structure first
- Changes to Sanity schema or document types
- `apps/web` or `packages/api-contract` — zero changes
- Live integration tests against the real Sanity API

## 3. Tracer Bullet

Write one test for `runSync` that mocks all external dependencies and asserts `upsertPlayer` is called:

- Create a mock `SanityWriteClient` layer (using `Layer.succeed` pattern, same as FootbalistoClient mocks in handler tests)
- Mock `FootbalistoClient.getRawTeams()` to return 1 team with 1 player
- Mock `KvCacheService` to return cursor `0` and accept writes
- Run `runSync` via `Effect.provide(runSync, mockLayer)`
- Assert `upsertPlayer` was called once with the correct `psdId`
- `pnpm --filter @kcvv/api check-all` passes

This immediately proves the mock pattern is viable and that `runSync` is testable without hitting Sanity or PSD APIs.

## 4. Phases

```
Phase 1: Tracer bullet — one runSync test with mocked SanityWriteClient → #869
Phase 2: Full runSync test suite — cursor behavior, player/staff/team upsert ordering, image upload triggering → #870
Phase 3: Extract and test image upload decision logic as pure functions → #871
```

## 5. Acceptance Criteria

### Phase 1 — Tracer bullet

- [ ] `SanityWriteClientMock` layer created (analogous to `FootbalistoClientMock` pattern in handler tests) with jest/vitest spy functions for `upsertPlayer`, `upsertTeam`, `upsertStaff`, `uploadPlayerImage`
- [ ] `psd-sanity-sync.test.ts` gains one `runSync` test: 1 team, 1 player, no image URL → `upsertPlayer` called once, `upsertTeam` called once, `upsertStaff` not called
- [ ] Mock `KvCacheService` accepts cursor read (returns `"0"`) and cursor write
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2 — Full runSync test suite

- [ ] **Cursor behavior**: cursor wraps correctly — with 3 teams, after 3 runs the cursor returns to 0
- [ ] **Player/staff split**: `partitionMembers` result: players go to `upsertPlayer`, staff to `upsertStaff`, unknowns are logged but not upserted
- [ ] **Team upsert ordering**: `upsertTeam` is called after all players and staff are upserted (so references are correct)
- [ ] **Image upload trigger**: when `profilePictureURL` is present AND `needsUpload` is true, `uploadPlayerImage` is called; when `needsUpload` is false, it is not called
- [ ] **Image upload failure does not block player upsert**: if `uploadPlayerImage` throws, `upsertPlayer` was still called and cursor still advances
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 3 — Image upload decision logic as pure functions

- [ ] `extractStableImageUrl(profilePictureURL: string): string | null` extracted as pure function — strips auth params, retains `?v=N`
- [ ] `needsUpload(stableUrl: string | null, existingPsdImageUrl: string | null | undefined): boolean` extracted as pure function
- [ ] Both functions have dedicated unit tests covering: null URL, URL with auth params, URL with `?v=N`, version change detection, no existing image
- [ ] `transformMember` and sync orchestration updated to use the extracted functions
- [ ] `pnpm --filter @kcvv/api check-all` passes

## 6. Effect Schema / api-contract Changes

None. No new schemas, no endpoint changes. Only new test helpers and extracted pure functions.

## 7. Open Questions

- `[ ]` **`SanityWriteClient` interface**: Is `SanityWriteClient` already defined as an Effect tag with a typed interface, or is it only `SanityWriteClientLive` with an inferred type? If only Live, an explicit interface needs to be extracted before a mock layer can be created. — Check at the start of Phase 1 before writing the mock.
- `[ ]` **Concurrency in tests**: `runSync` uses `Effect.forEach(..., { concurrency: 2 })` for player upserts. Vitest spy call counts may be non-deterministic with concurrent effects. May need `concurrency: 1` in tests or order-independent assertions. — Resolve during Phase 1.
- `[ ]` **Existing image state fetch**: `runSync` fetches existing image URLs from Sanity before deciding on upload. This fetch is currently done via `SanityWriteClient` (or a direct GROQ query). The mock needs to cover this too. — Clarify which service method handles this and include it in the `SanityWriteClientMock`.

## 8. Discovered Unknowns

_Filled during implementation._
