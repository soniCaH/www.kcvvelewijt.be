# Storybook Hygiene — Dead Code Removal, Component Extraction & Navigation Consistency

## 1. Problem statement

A Storybook coverage audit revealed 9+ dead components (with stories and tests but unused in the website), inconsistent navigation structure (`Home/` vs `Homepage/`, mixed singular/plural naming), and 21 stories missing TypeScript best practices (`satisfies Meta<>`). This creates confusion for developers browsing Storybook, inflates bundle analysis, and makes the component library unreliable as a source of truth. Additionally, `TeamSchedule` contains ~90 lines of inline match-row JSX that should be extracted, and `Sponsors` duplicates grid logic that already exists in `SponsorGrid`.

## 2. Scope

**Touched:** `apps/web` only (components, stories, tests)

**Out of scope:**

- `apps/api`, `packages/api-contract`, `apps/studio` — no backend changes
- TeamStats removal — tracked separately in #557
- MatchEvents BFF integration — separate issue (needs data availability investigation)
- The 3 missing stories in #729 (SanityArticleBody, SponsorsBlock, CookieConsentBanner) — that issue stands on its own
- Visual redesign work — this is housekeeping, not design changes
- Any behavioral changes to existing components — extract/refactor only

## 3. Tracer bullet

Remove `MatchCountdown` (dead component + story + test), verify `pnpm --filter @kcvv/web check-all` passes and `storybook build` succeeds. This proves the removal workflow is safe and catches any hidden imports.

## 4. Phases

```
Phase 1: Dead code removal — tracer bullet + all component deletions (#979)
Phase 2: MatchResultRow extraction from TeamSchedule (#980)
Phase 3: SponsorGrid refactoring — make Sponsors delegate to SponsorGrid (#981)
Phase 4: Storybook navigation & naming consistency (#982)
Phase 5: Technical debt — satisfies Meta<> and autodocs fixes (#983)
Phase 6: MatchEvents BFF investigation — blocked until PSD API data is confirmed (#984)
Phase 7: MatchEvents frontend integration — blocked by Phase 6 (#985)
```

## 5. Acceptance criteria per phase

### Phase 1: Dead code removal

- [ ] Remove `MatchCountdown` (component, story, test, barrel export)
- [ ] Remove `MatchReport` (component, story, test, barrel export)
- [ ] Remove `MatchResult` (component, story, test, barrel export)
- [ ] Remove `MatchStats` (component, story, test, barrel export)
- [ ] Remove `MatchesOverview` (component, story, test, barrel export)
- [ ] Remove `MatchesTabs` (component, story, test, barrel export)
- [ ] Remove `CoachProfile` (component, story, test, barrel export)
- [ ] Remove `SponsorGrid` story only (component kept for Phase 3)
- [ ] Remove `UpcomingMatches` (component, story, test, barrel export) — replaced by `MatchesSliderSection`
- [ ] No broken imports anywhere in `src/app/` or `src/components/`
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] `pnpm --filter @kcvv/web storybook:build` passes

### Phase 2: MatchResultRow extraction

- [ ] New `MatchResultRow` component in `src/components/match/MatchResultRow/`
- [ ] Handles both upcoming (VS placeholder) and past (scores with win/loss coloring) matches
- [ ] Handles status badges (postponed, stopped, forfeited)
- [ ] Handles "Volgende" (next match) highlight
- [ ] `TeamSchedule` refactored to use `MatchResultRow` — no inline match-row JSX
- [ ] `MatchResultRow.stories.tsx` with stories: Upcoming, Win, Draw, Loss, Postponed, NextMatch, WithoutLogos
- [ ] Visual regression: TeamSchedule renders identically before/after (verify in Storybook)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3: SponsorGrid refactoring

- [ ] `Sponsors` component refactored to delegate grid rendering to `SponsorGrid`
- [ ] `SponsorGrid` updated if needed to accept the props `Sponsors` requires
- [ ] `SponsorGrid.stories.tsx` updated/created under `Features/Sponsors/SponsorGrid`
- [ ] Visual regression: SponsorsPage renders identically before/after
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4: Storybook navigation & naming consistency

- [ ] All `Features/Home/*` stories moved to `Features/Homepage/*`
- [ ] `LatestNews` component renamed to `NewsGrid` (component, story, test, barrel export)
- [ ] `NewsGrid` story moved from `Features/News/NewsGrid` to `Features/Homepage/NewsGrid`
- [ ] `SponsorsCallToAction` renamed to `SponsorCallToAction` (component + story + test)
- [ ] `SponsorsEmptyState` renamed to `SponsorEmptyState` (component + story + test)
- [ ] No duplicate or orphaned Storybook nav entries
- [ ] `pnpm --filter @kcvv/web storybook:build` passes

### Phase 5: Technical debt — satisfies Meta & autodocs

- [ ] All 21 stories missing `satisfies Meta<typeof Component>` updated
- [ ] `Homepage.stories.tsx` gets `tags: ["autodocs"]`
- [ ] `pnpm --filter @kcvv/web storybook:build` passes

### Phase 6: MatchEvents BFF investigation (blocked)

- [ ] Investigate PSD API `/games/{id}` response for event data (goals, cards, substitutions)
- [ ] Document which event types are available and which are missing
- [ ] Define Effect Schema for match events in `packages/api-contract`
- [ ] Add match events to the BFF `/matches/{id}` endpoint response
- [ ] **Blocked until**: PSD API data availability is confirmed

### Phase 7: MatchEvents frontend integration (blocked by Phase 6)

- [ ] Export `MatchEvents` from the match barrel (`src/components/match/index.ts`)
- [ ] Wire `MatchEvents` into `MatchDetailView`
- [ ] Update `MatchDetailView` story to include events section
- [ ] Handle empty/missing events gracefully
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] **Blocked by**: Phase 6

## 6. Effect Schema / api-contract changes

Phases 1–5: None — `apps/web` only.

Phase 6 (blocked): Will require new `MatchEvent` schema in `packages/api-contract` and BFF endpoint changes in `apps/api`. Exact shape TBD pending PSD API investigation.

## 7. Open questions

- [ ] **MatchEvents BFF data**: What match event data is actually available from the PSD API? Needs a dedicated investigation issue for the BFF work (schema + endpoint) before the frontend integration can happen. — _Separate issue, blocks MatchEvents integration_
- [ ] **SponsorGrid props**: Does `SponsorGrid` already accept all the props `Sponsors` needs for delegation, or does it need extending? — _Will be answered in Phase 3_
- [x] **LatestNews naming**: Renamed to `NewsGrid` — the component renders a grid of news cards regardless of context. "Latest" is a page-level concern. Story was already titled `NewsGrid`.

## 8. Discovered unknowns section (filled during implementation)

_(empty — to be filled during implementation)_
