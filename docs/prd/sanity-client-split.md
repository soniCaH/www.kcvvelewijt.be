# PRD: SanityWriteClient — Split Reads from Writes (Projections + Mutations)

**Status**: Ready for implementation
**Date**: 2026-04-02
**Issues**: #1187 (extract projections), #1188 (rename + test mutations)

---

## 1. Problem Statement

`SanityWriteClient` (480 lines) mixes two fundamentally different concerns: read projections (getVisibleTeamPsdIds, getPlayersImageState, getActivePlayerPsdIds, getActiveStaffPsdIds, getActiveTeamPsdIds) and write mutations (upsertPlayer, upsertTeam, upsertStaff, archivePlayers, archiveStaff, archiveTeams, uploadPlayerImage, writeFeedback). This creates a single 15-method service that couples the PSD sync pipeline (which needs reads + writes) to `FootbalistoService` (which only needs `getVisibleTeamPsdIds` for visibility filtering). The result: `FootbalistoService` → `SanityWriteClient` dependency exists solely for one read query, and the entire 480-line client has zero unit tests because testing mutations requires mocking the same interface that serves reads.

## 2. Scope

**Packages touched**: `apps/api`

**In scope**:

- Extract read methods into `SanityProjection` service (pure GROQ queries → typed results)
- Keep write methods in `SanityMutation` service (patches, creates, image uploads)
- `FootbalistoService` (or `PsdService` after rename) depends only on `SanityProjection`
- PSD sync depends on both `SanityProjection` + `SanityMutation`
- Add unit tests for projections (mock Sanity client, assert GROQ + result shape)
- Add unit tests for mutations (mock Sanity client, assert patch construction)

**Out of scope**:

- Changing GROQ queries themselves — same queries, just better organized
- `apps/web` Sanity repositories — those are a separate layer
- Webhook handler's direct Sanity client usage (separate PRD)
- Sanity schema changes

## 3. Tracer Bullet

Extract `getVisibleTeamPsdIds()` into a new `SanityProjection` service:

- Create `src/sanity/projection.ts` with `SanityProjection` Effect tag and one method: `getVisibleTeamPsdIds`
- `SanityProjectionLive` layer wraps a Sanity client and executes the GROQ query
- `FootbalistoService` depends on `SanityProjection` instead of `SanityWriteClient`
- Add `projection.test.ts` with a test that mocks the Sanity client and asserts the query + result shape
- `SanityWriteClient` still exports `getVisibleTeamPsdIds` (forwarding to `SanityProjection`) for backward compatibility during migration
- `pnpm --filter @kcvv/api check-all` passes

## 4. Phases

```text
Phase 1: Tracer bullet — extract getVisibleTeamPsdIds into SanityProjection
Phase 2: Move remaining read methods to SanityProjection
Phase 3: Rename SanityWriteClient → SanityMutation, add mutation tests
```

## 5. Acceptance Criteria per Phase

### Phase 1: Tracer bullet

- [ ] `src/sanity/projection.ts` exists with `SanityProjection` tag and `getVisibleTeamPsdIds` method
- [ ] `FootbalistoService` imports `SanityProjection` instead of `SanityWriteClient`
- [ ] `projection.test.ts` exists with at least 2 tests (happy path, empty result)
- [ ] All existing tests pass without modification
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2: Move remaining reads

- [ ] `getPlayersImageState`, `getActivePlayerPsdIds`, `getActiveStaffPsdIds`, `getActiveTeamPsdIds` moved to `SanityProjection`
- [ ] `SanityWriteClient` interface no longer contains any `get*` methods
- [ ] PSD sync imports `SanityProjection` for reads, `SanityWriteClient` for writes
- [ ] `projection.test.ts` covers all 5 projection methods
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 3: Rename + test mutations

- [ ] `SanityWriteClient` renamed to `SanityMutation` (file: `src/sanity/mutation.ts`)
- [ ] `mutation.test.ts` created with tests for: upsertPlayer patch construction, upsertTeam patch construction, archivePlayers batch operation, uploadPlayerImage flow
- [ ] `apps/api/CLAUDE.md` updated with new structure
- [ ] `pnpm --filter @kcvv/api check-all` passes

## 6. Effect Schema / api-contract Changes

None. This is an internal refactor within `apps/api`.

## 7. Open Questions

- [ ] Should `SanityProjection` use Effect Schema to validate GROQ results, or keep current unvalidated approach? — Decide during Phase 1 (tracer bullet will answer)
- [ ] Should `SanityWriteError` be split into `SanityQueryError` + `SanityMutationError`? — Decide during Phase 3
- [ ] The webhook handler creates its own Sanity client directly — should it use `SanityMutation` instead? — Deferred to webhook Effect migration PRD

## 8. Discovered Unknowns

_(filled during implementation)_
