# PRD: Web View-Model Layer

**Issue**: #848
**Status**: Ready for implementation
**Date**: 2026-03-18

---

## 1. Problem Statement

The `game/` and `team/` pages already follow a healthy pattern: BFF types flow through a tested `utils.ts` file that produces display-ready props before reaching components. But this pattern isn't consistent — the calendar page has an untested inline transform (a `matches.map()` call inside the page component), and display logic that should live in the transform layer has leaked into components: the score/VS display condition (`hasScore`) appears in 4 separate components, `StatusBadge` is defined twice (once in `CalendarView`, once in `TeamSchedule`), and result color logic is hardcoded inline in `TeamSchedule`. This duplication means adding a new match status or changing how scores display requires hunting across multiple files with no shared test coverage.

## 2. Scope

**Packages touched**: `apps/web`

**In scope**:

- Extract calendar page inline transform to `src/app/(main)/calendar/utils.ts` with tests (matches pattern of `game/` and `team/` pages)
- Create `src/lib/utils/match-display.ts` with shared display utilities (`hasScore`, `getScoreDisplay`, `getStatusColor`, `getResultColor`)
- Consolidate `StatusBadge` into a single shared component (`src/components/match/StatusBadge/StatusBadge.tsx`) and remove the two inline duplicates

**Out of scope**:

- Date formatting unification (`dates.ts` is already centralized; the inconsistent usage is a separate concern)
- Component redesigns or visual changes — this is purely a logic/structure refactor
- Storybook stories for the new StatusBadge (can be added after)
- `apps/api` or `packages/api-contract` — zero changes

## 3. Tracer Bullet

Extract the calendar page inline transform to `src/app/(main)/calendar/utils.ts`:

- Move the `matches.map((m) => ({ ... }))` block from `calendar/page.tsx` into a named `transformMatchToCalendar(match: Match): CalendarMatch` function in a new `utils.ts`
- Add a `calendar/utils.test.ts` with at least 3 tests: basic field mapping, `round → team` field rename, `date.toISOString()` serialization
- `calendar/page.tsx` imports and calls `transformMatchToCalendar` instead of inlining
- `pnpm --filter @kcvv/web check-all` passes

This is safe, mechanical, and immediately adds test coverage to an untested transform.

## 4. Phases

```
Phase 1: Extract calendar inline transform to calendar/utils.ts with tests → #864
Phase 2: Create src/lib/utils/match-display.ts — shared score/status/result display logic → #865
Phase 3: Consolidate StatusBadge into shared component; remove CalendarView and TeamSchedule inline duplicates → #866
```

## 5. Acceptance Criteria

### Phase 1 — Calendar utils

- [ ] `src/app/(main)/calendar/utils.ts` created with `transformMatchToCalendar(match: Match): CalendarMatch`
- [ ] `CalendarMatch` type defined in `utils.ts` (move from `calendar/page.tsx` or `CalendarView.tsx` if defined there)
- [ ] `calendar/utils.test.ts` covers: field mapping, `round → team` rename, `date.toISOString()` serialization, null/undefined score passthrough
- [ ] `calendar/page.tsx` no longer contains inline `.map()` transform
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — Shared match-display utilities

- [ ] `src/lib/utils/match-display.ts` created with:
  - `hasScore(match: Pick<Match, 'home_team' | 'away_team' | 'status'>): boolean` — true when status is "finished" and both scores are defined
  - `getScoreDisplay(match: Match): { type: 'score'; home: number; away: number } | { type: 'vs' }` — used for score/VS rendering decisions
  - `getStatusColor(status: MatchStatus): string` — maps status to Tailwind color token (for StatusBadge)
  - `getResultColor(homeScore: number, awayScore: number, isHome: boolean): 'win' | 'draw' | 'loss'` — replaces inline logic in TeamSchedule
- [ ] `src/lib/utils/match-display.test.ts` covers all functions including edge cases (undefined scores, forfeited, postponed)
- [ ] At least 2 of the 4 components currently duplicating `hasScore` logic are updated to use `match-display.ts`
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3 — Shared StatusBadge component

- [ ] `src/components/match/StatusBadge/StatusBadge.tsx` created, accepting `status: MatchStatus` and optional `className`
- [ ] Renders the same badge UI currently duplicated in `CalendarView.tsx` and `TeamSchedule.tsx`
- [ ] Uses `getStatusColor` from `match-display.ts` (Phase 2)
- [ ] Both `CalendarView.tsx` and `TeamSchedule.tsx` import the shared `StatusBadge` — inline definitions removed
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. This refactor operates entirely within `apps/web` on the display side.

## 7. Open Questions

- `[ ]` **`CalendarMatch` type ownership**: Currently the inline transform in `calendar/page.tsx` produces an anonymous shape. Should `CalendarMatch` be defined in `calendar/utils.ts` (co-located, page-specific) or in a shared types file? — Co-located matches the `game/` and `team/` pattern; prefer that unless it needs to be shared.
- `[ ]` **`getStatusColor` return type**: Should it return raw Tailwind class strings (`"text-orange-500"`) or semantic tokens? Tailwind v4 may affect this if CSS variables are used for color tokens. Investigate during Phase 2.
- `[ ]` **Phase 2 adoption scope**: "At least 2 of 4 components" is the minimum — do all 4 in Phase 2 or leave the remaining 2 for a follow-up? — Decide based on complexity when starting Phase 2; if all 4 are trivial, do them all.

## 8. Discovered Unknowns

_Filled during implementation._
