# PRD: Persistent First-Team Match Strip

**Issue:** #1259
**Milestone:** Mobile UX audit 2026-04-09
**Date:** 2026-04-09

## 1. Problem statement

Fans, parents, and visiting supporters bounce between news articles, youth team pages, and the calendar throughout a session — but the single most-checked data point (first team: last result or next match) is only visible on the homepage. Getting back to it requires navigating home or drilling through the menu. This creates a high-friction loop on every session that spans more than one page. A persistent, glanceable first-team shortcut on non-homepage routes would eliminate that friction and keep the most important match context always within one tap.

## 2. Scope

### In scope

| Package    | Changes                                                                              |
| ---------- | ------------------------------------------------------------------------------------ |
| `apps/web` | New `MatchStrip` component, root layout data pass, PageHeader integration, analytics |

### Out of scope

- **Match detail page enrichment** — the strip links to the existing match detail route; no changes there.
- **Multiple team strips** — only the first team (Eerste Elftal). Youth team strips are a separate feature.
- **Push notifications / live score** — the strip shows static data refreshed at ISR cadence (1 hour). Live score is a future feature.
- **Desktop sticky behavior** — desktop gets the strip too, but no special sticky/floating treatment. Standard document flow under the header.
- **New BFF endpoints** — reuse `getNextMatches()` entirely.

## 3. Tracer bullet

A hardcoded-looking `MatchStrip` rendered below `PageHeader` on all non-homepage `(main)` routes, consuming real data from the existing `BffService.getNextMatches()` call hoisted to the root layout. No skeleton, no analytics, no dismiss — just the score line or "next match" line linking to the match detail page.

This proves:

- Layout-level data fetch works without per-page overhead
- The strip renders correctly below the fixed header without layout shift
- The link to match detail resolves

## 4. Phases

### Phase 1: Tracer bullet — layout fetch + static strip (#1269)

Hoist `BffService.getNextMatches()` into a shared server utility. Call from root layout, pass `nextMatch: UpcomingMatch | null` as prop through to a new `MatchStrip` component rendered between `PageHeader` and `{children}`. Strip shows:

- **Finished match:** `KCVV 2 – 1 Opponent` with date
- **Upcoming match:** `Volgende: vs Opponent · za 20:00`
- **No data:** strip doesn't render (graceful degradation)

Renders on all routes except `/` (homepage already has the full MatchWidget).

### Phase 2: Mobile polish + skeleton + dismiss (#1270)

- Loading skeleton while the layout fetch resolves (thin bar with pulsing placeholder)
- Dismiss button (× icon) that stores dismissal in `sessionStorage` (resets each session)
- Compact mobile styling: single line, truncated opponent name, full-width tap target
- Ensure no layout shift when strip appears/disappears (reserve space or use CSS animation)

### Phase 3: Analytics + accessibility (#1271)

- Fire `firstteam_strip_clicked` event with `{ source: "match_strip", matchId, matchStatus }` — reuse existing analytics hook pattern
- Fire `firstteam_strip_dismissed` event
- `aria-label` on the strip link: "Laatste uitslag: KCVV 2-1 Opponent" or "Volgende wedstrijd: vs Opponent, zaterdag 20:00"
- Keyboard navigable (it's a link, so this should come free)
- Reduced motion: no entrance animation if `prefers-reduced-motion`

## 5. Acceptance criteria per phase

### Phase 1

- [ ] `MatchStrip` renders on `/nieuws`, `/ploegen/*`, `/kalender`, `/hulp`, `/club/*`, `/jeugd/*`
- [ ] `MatchStrip` does NOT render on `/` (homepage)
- [ ] Shows last result when most recent match is finished
- [ ] Shows next match when most recent match is upcoming/scheduled
- [ ] Tapping navigates to `/wedstrijd/{matchId}`
- [ ] No additional BFF API call beyond what the layout already fetches
- [ ] No layout shift on page transitions
- [ ] When no match data available (off-season), strip does not render and surrounding layout has no empty sections, double stacks, or layout gaps
- [ ] Renders on both mobile and desktop without disrupting existing page design
- [ ] Competition name shown on desktop, hidden on mobile
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2

- [ ] Loading skeleton renders while data is fetching
- [ ] Dismiss button hides the strip for the current session
- [ ] Dismissed state persists across route navigations within the same session
- [ ] New session (new tab / cleared sessionStorage) shows the strip again
- [ ] Mobile: strip is single-line, opponent name truncates gracefully at 360px width
- [ ] Strip appearance/disappearance has no CLS impact

### Phase 3

- [ ] `firstteam_strip_clicked` fires with correct payload on click
- [ ] `firstteam_strip_dismissed` fires on dismiss
- [ ] Screen reader announces match context on focus
- [ ] Reduced motion respected
- [ ] GTM tag created for both events (or documented as manual step in PR)

## 6. Effect Schema / api-contract changes

**None.** The strip consumes `UpcomingMatch` which is already defined in `apps/web` and derived from the existing `Match` type in `@kcvv/api-contract`. No new schemas, no new endpoints.

The only new code is:

- A shared server utility in `apps/web/src/lib/` that wraps `BffService.getNextMatches()` + `mapMatchesToUpcomingMatches()` for reuse between the homepage and the layout
- The `MatchStrip` component itself

## 7. Open questions (resolved)

- [x] **Should the strip show on desktop too, or mobile-only?** — **Both.** Show on desktop and mobile, as long as the existing page design/visual stays unchanged (strip is additive, not disruptive).
- [x] **What happens during off-season (no upcoming matches, no recent results)?** — Strip doesn't render. Ensure diagonal/stacked layouts handle the missing strip gracefully: no double stacks, no empty sections, no layout shift from a conditionally absent element.
- [x] **Should the strip show the competition name?** — Omit on mobile, show on desktop.
- [x] **ISR revalidation cadence** — 1 hour (3600s) is fine. Scores are submitted to the league association AFTER the match and then synced through intermediate systems — there is no live score feed. A live match tracker (à la Instagram stories) is a separate future project, not in scope here.

## 8. Discovered unknowns section (filled during implementation)

```text
- [2026-04-12] Discovered: homepage needs full matches array for MatchesSliderSection, not just first match — shared utility used by (main) layout only; homepage retains its own BFF call → resolved inline
```
