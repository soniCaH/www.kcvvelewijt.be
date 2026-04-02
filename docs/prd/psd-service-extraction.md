# PRD: PSD Service Extraction — Separate Transforms from HTTP

**Status**: Ready for implementation
**Date**: 2026-04-02
**Supersedes**: Builds on #846 (FootbalistoService deep domain service — closed)
**Issues**: #1185 (extract transforms), #1186 (rename + cleanup)

---

## 1. Problem Statement

`FootbalistoService` (1,073 lines) successfully absorbed the old client+transform split from #846, but has since grown into a monolith where 58% of the code is pure transformation logic (mapCompetitionLabel, transformPsdGame, transformMatchEvent, buildPlayerCardMap, etc.) tangled with HTTP fetching, KV caching, and Sanity visibility filtering. Adding a new PSD field requires reading 600 lines of transforms to find the right function, then tracing how it's called from the fetch methods 400 lines below. The name "Footbalisto" no longer reflects what the service does — it wraps the ProSoccerData (PSD) API, not the defunct footbalisto.be Lambda stack.

## 2. Scope

**Packages touched**: `apps/api`

**In scope**:

- Extract all pure transform functions from `footbalisto/service.ts` into `footbalisto/transforms.ts` (or `psd/transforms.ts` after rename)
- Rename directory `footbalisto/` → `psd/` and service `FootbalistoService` → `PsdService`
- Update all handler imports, test imports, CLAUDE.md references
- Clean up dead `FOOTBALISTO_API_URL` constant in `apps/web/src/lib/constants.ts` and `.env.example`
- Maintain identical runtime behavior — this is a pure structural refactor

**Out of scope**:

- Caching strategy changes — `KvCacheService` stays as-is
- `@kcvv/api-contract` schema changes — normalized types unchanged
- `SanityWriteClient` split (separate PRD)
- The `footbalisto.be` custom domain for Workers (separate rework of #1083)
- `FOOTBALISTO_LOGO_CDN_URL` env var in `wrangler.toml` — rename deferred to domain rework

## 3. Tracer Bullet

Extract `mapCompetitionLabel()` and `resolveCompetitionLabel()` into a new `psd/transforms.ts` file:

- Create `src/psd/transforms.ts` with the two exported functions
- Import them from the service file
- Existing tests in `service.test.ts` still pass with no changes
- `pnpm --filter @kcvv/api check-all` passes

This proves the extraction pattern works before moving the remaining ~500 lines of transforms.

## 4. Phases

```text
Phase 1: Tracer bullet — extract first transforms
Phase 2: Extract all remaining transforms into psd/transforms.ts
Phase 3: Rename footbalisto/ → psd/, FootbalistoService → PsdService
Phase 4: Clean up dead footbalisto references in apps/web
```

## 5. Acceptance Criteria per Phase

### Phase 1: Tracer bullet

- [ ] `src/psd/transforms.ts` (or `src/footbalisto/transforms.ts` initially) exists with `mapCompetitionLabel` and `resolveCompetitionLabel`
- [ ] `service.ts` imports from `./transforms` instead of defining inline
- [ ] All existing tests pass without modification
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2: Extract all remaining transforms

- [ ] All pure functions (transform*, map*, parse*, build*, compute*, extract*) moved to `transforms.ts`
- [ ] `service.ts` reduced to ~400 lines (HTTP fetch + cache + business orchestration only)
- [ ] `transforms.ts` has no Effect service dependencies (pure functions only, may take env-derived values as parameters)
- [ ] `transforms.test.ts` created with tests extracted from `service.test.ts` (transform-specific tests)
- [ ] Remaining `service.test.ts` tests cover fetch + cache + orchestration
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 3: Rename footbalisto → psd

- [ ] Directory renamed: `src/footbalisto/` → `src/psd/`
- [ ] Service renamed: `FootbalistoService` → `PsdService`, `FootbalistoServiceLive` → `PsdServiceLive`
- [ ] All handler imports updated
- [ ] All test imports updated
- [ ] Error types: `Footbalisto*` prefixes reviewed (keep if they reference the external system, rename if they're internal)
- [ ] `apps/api/CLAUDE.md` updated with new paths
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 4: Clean up dead references

- [ ] `apps/web/src/lib/constants.ts` — remove `API_CONFIG.footbalisto` (unused)
- [ ] `.env.example` — remove `FOOTBALISTO_API_URL` line
- [ ] `apps/web/tests/setup.ts` — remove `FOOTBALISTO_API_URL` assignment if unused
- [ ] Grep confirms zero remaining `footbalisto` references outside of `apps/api/src/psd/` (excepting `FOOTBALISTO_LOGO_CDN_URL` in wrangler.toml, deferred)
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. This is an internal refactor within `apps/api`.

## 7. Open Questions

- [ ] Should `BffError` types (`UpstreamUnavailableError`, etc.) move to `src/psd/errors.ts` or stay in a shared `src/errors/` directory? — Decide during Phase 3
- [ ] Should schemas (`schemas.ts`, `schemas-player-team.ts`) also move into `src/psd/`? — Likely yes, decide during Phase 3
- [ ] The `PsdTeamClient` in `src/sync/` also wraps PSD calls — should it move under `src/psd/` too, or stay in `sync/`? — Decide during Phase 3

## 8. Discovered Unknowns

- [2026-04-02] Schemas (`schemas.ts`, `schemas-player-team.ts`) already live inside the renamed `src/psd/` directory — no separate move needed. `Footbalisto*` schema class names kept as internal implementation details (they reference the raw PSD API shapes).
- [2026-04-02] `PsdTeamClient` stays in `src/sync/` — it's a sync concern, not a PSD service concern. Its import path updated from `../footbalisto/` to `../psd/`.
- [2026-04-02] `BffError` types stay in `src/psd/errors.ts` — they're PSD-specific errors, shared location not needed.
- [2026-04-02] `FootbalistoError` in `apps/web` renamed to `PsdApiError` (only defined, never imported elsewhere).
- [2026-04-02] Pre-existing unused import (`PlayerSeasonStatsType`) in `matches.test.ts` — removed as part of cleanup.
