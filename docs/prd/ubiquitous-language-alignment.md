# PRD: Ubiquitous Language Alignment

## 1. Problem statement

The codebase uses inconsistent terminology for the same domain concepts. `round` means "team label", `positionTitle` means "role label", `responsibilityPath` means "responsibility", and dead fields like `league`/`leagueId` linger in the Sanity schema. Match widget filtering is hardcoded to a single team ID instead of using the existing `showInNavigation` flag. These inconsistencies make the codebase harder to navigate, onboard to, and discuss — the same concept has different names in different packages.

## 2. Scope

**Touched:**

- `apps/api/` — rename `round` → `squadLabel`, remove hardcoded team filter, read `showInNavigation`
- `apps/web/` — consume renamed fields, update components
- `apps/studio/` — remove dead fields, rename staff fields, simplify `responsibilityPath` → `responsibility`
- `packages/api-contract/` — rename `round` → `squadLabel` in Match schema

**Out of scope:**

- URL renames (`/game → /wedstrijd`) — covered by [#819]
- Sponsor package redesign — internal club decision pending
- Competition Dutch label mapping — separate issue [#912]
- Opponent history tracking — separate wishlist [#914]
- `/club` landing page — separate enhancement [#913]

## 3. Tracer bullet

Rename `round` → `squadLabel` across all four packages end-to-end: schema change in `api-contract`, BFF transform in `apps/api`, web consumption in `apps/web`. One renamed field proving the cross-package rename workflow works without breaking anything.

## 4. Phases

### Phase 1: Rename `round` → `squadLabel` (tracer bullet) — [#907]

Rename the field across all layers. Proves the rename workflow.

- `packages/api-contract/src/schemas/match.ts` — rename field
- `apps/api/src/footbalisto/service.ts` — rename `roundLabel` → `squadLabel`
- `apps/web/` — update all consumers (match mapper, calendar, scheurkalender, UpcomingMatches)
- Update tests

### Phase 2: Remove dead Sanity fields — [#908]

Remove `league`, `leagueId` from Sanity team schema and all consumers.

- `apps/studio/schemaTypes/team.ts` — remove field definitions
- `apps/web/src/lib/sanity/queries/teams.ts` — remove from GROQ projections
- `apps/web/src/lib/effect/services/SanityService.ts` — remove from `SanityTeam` interface
- Verify `division`/`divisionFull` remain and are marked as editorial (remove `readOnly`)

### Phase 3: Rename staff terminology — [#909]

Align staff field names with ubiquitous language: role (not position).

- `apps/studio/schemaTypes/staffMember.ts` — rename `positionTitle` → `roleLabel`, `positionShort` → `roleCode`
- `apps/web/src/lib/sanity/queries/` — update GROQ projections
- `apps/web/src/lib/effect/services/SanityService.ts` — update interfaces
- `apps/web/src/components/organigram/` — update field references
- Sanity migration: rename existing document fields

### Phase 4: Simplify `responsibilityPath` → `responsibility` — [#910]

Rename the Sanity document type and all references.

- `apps/studio/schemaTypes/responsibilityPath.ts` → `responsibility.ts`
- `apps/studio/schemaTypes/index.ts` — update import
- `apps/web/src/lib/sanity/queries/` — update GROQ `_type == "responsibility"`
- `apps/web/src/types/responsibility.ts` — update types
- `apps/web/src/components/responsibility/` — update references
- `apps/api/src/search/sanity-index-sync.ts` — update GROQ query
- `packages/api-contract/src/schemas/search.ts` — `SearchContentType` already uses `"responsibility"` ✓
- Sanity migration: rename document type (requires data migration script)

### Phase 5: Replace hardcoded team filter with `showInNavigation` — [#911]

Remove the `t.id !== 23` filter and use Sanity's `showInNavigation` flag instead.

- `apps/api/src/footbalisto/service.ts` — fetch visible team IDs from Sanity, filter by those
- `apps/api/src/` — add a lightweight Sanity read for team visibility (cached)
- Remove hardcoded team 23 exclusion
- Update tests

## 5. Acceptance criteria per phase

### Phase 1: Rename `round` → `squadLabel`

- [ ] `Match` schema in api-contract uses `squadLabel` field (optional string)
- [ ] BFF `transformPsdGame` produces `squadLabel` instead of `round`
- [ ] All web components consume `squadLabel` (calendar, scheurkalender, UpcomingMatches, match mapper)
- [ ] No references to `round` remain (except unrelated CSS `rounded-*` classes)
- [ ] `pnpm --filter @kcvv/api-contract check-all` passes
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2: Remove dead Sanity fields

- [ ] `league` and `leagueId` removed from team schema definition
- [ ] `league` and `leagueId` removed from all GROQ queries and TypeScript interfaces
- [ ] `division`/`divisionFull` remain and are no longer marked `readOnly`
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] Sanity Studio builds without errors

### Phase 3: Rename staff terminology

- [ ] `positionTitle` → `roleLabel` in Sanity schema, queries, and components
- [ ] `positionShort` → `roleCode` in Sanity schema, queries, and components
- [ ] Organigram renders correctly with renamed fields
- [ ] Sanity migration script renames fields in existing documents
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4: Simplify `responsibilityPath` → `responsibility`

- [ ] Sanity document type is `responsibility`
- [ ] All GROQ queries use `_type == "responsibility"`
- [ ] Search index sync uses updated type
- [ ] Sanity migration script renames document types
- [ ] `/hulp` page renders correctly
- [ ] Search returns results for responsibilities
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 5: Replace hardcoded team filter

- [ ] No hardcoded team ID exclusions in BFF
- [ ] `getNextMatches()` reads visible team IDs from Sanity (cached)
- [ ] Teams with `showInNavigation: false` excluded from match widgets
- [ ] Setting `showInNavigation: false` on any team hides its matches from homepage/calendar/scheurkalender
- [ ] `pnpm --filter @kcvv/api check-all` passes

## 6. Effect Schema / api-contract changes

### Phase 1

```typescript
// packages/api-contract/src/schemas/match.ts
// Rename: round → squadLabel
class Match extends S.Class<Match>("Match")({
  // ... existing fields ...
  squadLabel: S.optional(S.String), // was: round
  competition: S.optional(S.String),
}) {}
```

No new endpoints. No new schemas. Phases 2–5 do not touch api-contract.

## 7. Open questions

- [x] **Sanity document type rename migration:** Patch `_type` only, keep existing `_id` values (`responsibility-path-{slug}`) unchanged. `_id` is purely internal — never exposed in URLs. Migration: `client.patch(id).set({_type: "responsibility"})` per document. Deploy order: migration first, then code.
- [x] **Sanity field rename migration:** Same PR (#909) includes PSD sync update (`apps/api`). Migration: `client.patch(id).set({roleLabel, roleCode}).unset(['positionTitle', 'positionShort'])` per staffMember. Deploy order: migration first, then code.
- [x] **BFF reading Sanity for team visibility:** Option B — nightly sync writes `teams:visible` list to KV. `getNextMatches()` reads from KV instead of hardcoding `t.id !== 23`. No new Sanity dependency in request path. Visibility changes take effect within 24h (acceptable — toggles ~twice a year).
- [x] **`divisionFull` editorial workflow:** Add `description` + `placeholder` to Sanity field definitions. `divisionFull`: placeholder `"3e Nationale A"`, description `"Volledige competitienaam. Wordt getoond als er geen tagline is ingesteld."`. `division`: placeholder `"3NA"`, description `"Korte competitiecode."`. No validation rules needed.

## 8. Discovered unknowns section (filled during implementation)

<!-- During Ralph loop, append here when hitting something unexpected:
- [date] Discovered: [what was found] → [action taken: new issue #N / PRD updated / resolved inline]
-->
