# PRD — Phase 6.B · Match Detail Redesign

**Status:** ready for `/prd-to-issues`. All 8 design drills (6.B.d0 → 6.B.d8) locked 2026-05-22.
**Authored:** 2026-05-22.
**Owner:** @climacon.
**Tracker:** #1528 (Phase 6 master).
**Lock docs (authoritative for design decisions):** `docs/design/mockups/phase-6-match-detail/*-locked.md` — 8 per-element locks. Do not re-derive in any sub-issue; quote the lock docs.
**Master plan:** `docs/plans/2026-04-27-redesign-master-design.md` §6.3 (updated 2026-05-22 to drop the live state).
**Drill artefacts:** `docs/design/mockups/phase-6-match-detail/6b{0..8}-*/` — comparisons HTML + `compare.md` per drill. Historical record; lock docs supersede.

---

## 1. Problem statement

`/wedstrijd/[matchId]` ships in pre-redesign vocabulary while the rest of the site is moving to the retro-terrace-fanzine system locked across Phases 0–5. Three cross-cutting match components carry visible drift:

- `<MatchResultRow>` (consumed by `<TeamSchedule>` on `/ploegen/[slug]`) uses retired tokens (`kcvv-green-bright`, `kcvv-success`, `kcvv-alert`, `rounded-card`) plus a result-coloured left border that conflicts with the new 2px ink card frame.
- `<MatchTeaser>` (consumed by `<CalendarMonth>` on `/kalender`) predates the editorial paper-card vocabulary.
- `<MatchStatusBadge>` uses the retired bright `--color-jersey` colour (see `[[feedback_no_bright_jersey]]`) and is missing coverage for the `finished` state required by the new `<MatchHero>`.

Plus a data-model gap surfaced during the audit: the BFF normalises PSD's `cancelled: boolean` flag and PSD code 2 (`afgelast`) into the same `MatchStatus` literal `"postponed"`, hiding a meaningful semantic distinction (cancelled = definitively dead, postponed = may reschedule).

Phase 6.B closes the match-detail gap, brings the cross-cutting components into Direction D / editorial-paper vocabulary, and adds `"cancelled"` to `MatchStatus` so the new badge tier system can express the correct severity. The scope is deliberately lean: **ONE BFF schema delta, ZERO new BFF endpoints, ZERO new editorial backlog**. Editorial-derived sections (match preview/recap article surfacing) are design-locked but build-deferred until #1470 ships the `linkedMatch` reference field on the article schema.

---

## 2. Scope

### In scope (packages touched)

- **`packages/api-contract`** — add `"cancelled"` to the `MatchStatus` literal in `src/schemas/match.ts`
- **`apps/api`** — `src/psd/transforms.ts` returns `"cancelled"` when PSD's `cancelled === true` (stops collapsing into `"postponed"`); test fixtures updated
- **`apps/web`** —
  - Rewire `src/app/(main)/wedstrijd/[matchId]/page.tsx` to the locked composition (`<MatchHero>` → `<StripedSeam>` → `<MatchLineupSection>` → `<MatchEventsSection>` → footer)
  - New `<MatchHero>` component (`src/components/match/MatchHero/`)
  - New `<MatchLineupSection>` + `<MatchEventsSection>` wrappers around existing `<MatchLineup>` + `<MatchEvents>` primitives
  - Extend `<MatchStatusBadge>` to render 5 statuses (FT/FF/PP/CANC/STOP) with Direction D paper-chrome + per-status severity tints
  - Reskin `<MatchTeaser>` to A2-italic (default variant only)
  - Reskin `<MatchResultRow>` to mini-teaser-row vocabulary
  - Introduce `--color-card-red` token for the CANC severity tier
- **Cleanup** (Phase 3 of this PRD):
  - Retire `<MatchesSlider>` component (orphan after Phase 4.B.2)
  - Retire `<MatchTeaser variant="compact">` (zero active consumers)
  - Retire legacy `<MatchDetailView>` + `<MatchHeader>` (superseded by `<MatchHero>` + sections)

### Out of scope — explicit, named

These surfaces ARE on the match-detail page today (or are mentioned in the Phase 6 epic) but are NOT touched in Phase 6.B. Mixed-state styling acceptable per master plan §7:

- **`<MatchArticleLinkCard>`** — design-locked (Variant B hero-style cover card) but **build deferred to post-#1470**. The `linkedMatch: string` field that #1470 introduces is the only way to query articles tied to a specific match; without it, the card auto-hides on every match. The locked-but-deferred spec lives at `docs/design/mockups/phase-6-match-detail/article-link-card-locked.md` for the future implementer to follow.
- **`<RelatedArticles>` match-filtered surfacing** — same #1470 dependency. The page composition reserves the slot; Phase 6.B implementation renders nothing in it pre-#1470.
- **`<MatchStrip>`** — no changes. Phase 3.C lock (`docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`) remains authoritative; the d8 audit confirmed no drift between spec and current implementation.
- **Live match data + the live page state** — confirmed no BFF source; not in scope. Master plan §6.3 updated to a 2-state surface (upcoming + finished).
- **`<MatchHero>` mobile collapse** — straightforward stacked-stub-on-top layout; design sanity-check deferred to implementation kickoff (round 4 of d2).
- **Per-row visual refinements in `<MatchLineupSection>` / `<MatchEventsSection>`** — number badge style, captain glyph, card icon set inherit from existing primitives. Refinements deferred unless flagged in implementation review.
- **`<MatchResultRow>` round 2** — the L (loss) pill colour (warm vs bordered-cream) is open per the d7 lock. Phase 6.B implementation ships with warm; round 2 happens only if owner flags during PR review.
- **Phase 6.C surfaces** (`/ploegen/[slug]` team detail), **Phase 6.D** (`/kalender`), **Phase 6.E** (`/events`) — separate re-plans after Phase 6.B retrospective.

---

## 3. Tracer bullet

**Phase 1 (the BFF schema delta PR) is the tracer.** It crosses every layer end-to-end — Effect Schema literal → BFF transform → handler tests → downstream consumer types in apps/web — without touching UI. If the schema delta ships clean (api-contract types regenerate, BFF tests pass, no surprise downstream breakage), the data flow for the new `"cancelled"` literal is proven before any component work begins.

Thinnest possible end-to-end change: **the single Effect Schema literal addition plus the one-line transform change**, with the supporting test fixtures + downstream type adjustments. Validates the schema chain.

---

## 4. Phases

Three phases. Each = one deployable unit, runnable tests, no broken state.

```text
Phase 1: BFF schema delta — TRACER. Backend + contract only, no UI change.
         → chore(api): add "cancelled" to MatchStatus + fix transforms.ts

Phase 2: UI rebuild — parallel sub-issues for components, then integration via
         page assembly. Plus the cross-cutting reskins.
         → feat(matches): <MatchHero> new component
         → feat(matches): <MatchLineupSection> + <MatchEventsSection> wrappers
         → feat(matches): extend <MatchStatusBadge> to 5 statuses + Direction-D tints
         → feat(matches): reskin <MatchTeaser> to A2-italic (default only)
         → feat(matches): reskin <MatchResultRow> to mini-teaser-row
         → feat(matches): /wedstrijd/[matchId] page assembly + e2e

Phase 3: Legacy cleanup + doc audit closeout.
         → chore(matches): retire <MatchesSlider>, <MatchTeaser variant="compact">,
            legacy <MatchDetailView> + <MatchHeader>
```

**Milestone:** `redesign-retro-terrace-fanzine` (the Phase 6 umbrella).

**Dependency graph:**

```text
Phase 1 (tracer)
   ├─ blocks → <MatchHero>            (consumes MatchStatus literal in corner stamp)
   ├─ blocks → <MatchStatusBadge> ext  (renders 5 statuses incl. cancelled)
   ├─ blocks → <MatchLineupSection>   (auto-hide branch depends on status)
   ├─ blocks → <MatchEventsSection>   (auto-hide branch depends on status)
   ├─ blocks → <MatchTeaser> reskin   (consumes MatchStatus literal)
   ├─ blocks → <MatchResultRow> reskin (consumes MatchStatus literal)
   └─ blocks → page assembly + e2e   (consumes all above)
                  ↑
                  └─ blocks → Phase 3 cleanup
```

---

## 5. Acceptance criteria per phase

### Phase 1 — BFF schema delta (tracer)

- [ ] `packages/api-contract/src/schemas/match.ts` — `MatchStatus` literal expanded to `"scheduled" | "finished" | "forfeited" | "postponed" | "cancelled" | "stopped"`; JSDoc updated
- [ ] `apps/api/src/psd/transforms.ts` — return `"cancelled"` when `cancelled === true`; PSD code 2 still returns `"postponed"`; JSDoc updated
- [ ] `apps/api/src/psd/service.test.ts` — new test case: `cancelled: true` + PSD code 0 → status === `"cancelled"`; existing postponed tests still pass
- [ ] `apps/api/src/handlers/matches.test.ts` — fixtures or assertions updated wherever they branched on `"postponed"` (audit each)
- [ ] `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.tsx` (and any other web-side consumer) — accept the new literal in its `MatchStatus` import; render path may temporarily delegate to `null` until Phase 2 extends the badge — fine, just don't crash
- [ ] `pnpm --filter @kcvv/api check-all` passes
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] `pnpm turbo build --filter=@kcvv/api-contract` passes

### Phase 2 — UI rebuild

#### `<MatchHero>` new component

- [ ] Component shipped at `apps/web/src/components/match/MatchHero/` with `MatchHero.tsx`, `MatchHero.stories.tsx`, `MatchHero.test.tsx`, `index.ts`
- [ ] Story title `Features/Matches/MatchHero`; meta tags include `vr`
- [ ] Single `<TapedCard>` split into 2 zones by a 2px dashed ink divider (no perforation circles per d2 T2)
- [ ] Left stub (~110px) — `bg-cream-soft`, display-big date + time + venue (mono caps); typography per `matchhero-locked.md`
- [ ] Right body — kicker (`VOORBESCHOUWING` / `MATCHVERSLAG`), teams + score row, competition meta row
- [ ] Score region state-aware: `vs` (italic display lowercase) for `scheduled`; numeric score (display-big) for everything else
- [ ] Mounts `<MatchStatusBadge>` as a corner stamp top-right
- [ ] Stories cover: upcoming, finished, edge states (FF / PP / CANC / STOP)
- [ ] VR baselines captured + committed
- [ ] Unit tests cover state branching + edge-state badge rendering

#### `<MatchLineupSection>` + `<MatchEventsSection>` new wrappers

- [ ] Two wrappers at `apps/web/src/components/match/MatchLineupSection/` + `MatchEventsSection/`
- [ ] Each auto-hides (`return null`) when its data is empty (typically upcoming)
- [ ] `<MatchLineupSection>` — kicker `OPSTELLINGEN` + heading "Wie er stond." + 2-col home/away wrapping existing `<MatchLineup>`; `BANK` divider separates starters from subs
- [ ] `<MatchEventsSection>` — kicker `WEDSTRIJDVERLOOP` + heading "Hoe het ging." + single chronological timeline wrapping existing `<MatchEvents>`; 4-col grid (minute / glyph / player / team mono)
- [ ] `<StripedSeam>` between the two sections (`colorPair="ink-cream"`, `height="md"`)
- [ ] Stories per section cover: full data (finished match), empty data (auto-hide branch)
- [ ] VR baselines captured for the populated stories; auto-hide stories ship blank baselines per Phase 6.A `BioBlock.Empty` precedent
- [ ] Unit tests cover the auto-hide branch + the wrapper composition

#### `<MatchStatusBadge>` extension (Direction-D + per-status tint)

- [ ] `BadgeStatus` extended from 3 → 5 statuses (`finished` + `forfeited` + `postponed` + `cancelled` + `stopped`); `scheduled` still returns `null`
- [ ] Visual chrome migrated from `<MonoLabel variant="pill-jersey">` to Direction D paper-chrome (`border-2 border-ink shadow-paper-sm bg-cream` + mono caps + sharp corners) — styled inline on the component, no new `<MonoLabel>` variant
- [ ] Per-status tint applied: FT → `cream`, PP + FF → `cream-deep`, STOP → `warm`, CANC → `card-red`
- [ ] Copy: abbreviations only (`FT` / `FF` / `PP` / `CANC` / `STOP`); `title=` attribute carries long-form Dutch (`Voltijd` / `Forfait` / `Uitgesteld` / `Geannuleerd` / `Gestopt`) for accessibility
- [ ] New token `--color-card-red` introduced wherever Phase 4.5 / Phase 5 tokens live (likely `apps/web/src/app/globals.css`)
- [ ] Stories cover each of the 5 statuses + the `scheduled` null branch
- [ ] VR baselines captured
- [ ] Unit tests: one assertion per status (render text, tint class, tooltip title)

#### `<MatchTeaser>` reskin (default only)

- [ ] Component rewritten to A2-italic: stub (~76px, `bg-cream-soft`, 30px display-big date number + 14px italic display month label) + body (mono kicker + teams + score)
- [ ] `variant` prop simplified — drop `compact` from the union, simplify the API
- [ ] Highlighted team (KCVV) gets `font-weight: 600`
- [ ] Mounts `<MatchStatusBadge>` as a corner stamp when applicable
- [ ] Light theme only — the dark `theme` prop is dropped
- [ ] Stories cover: upcoming, finished, edge states; existing `<CalendarMonth>` integration confirmed via the consumer's tests
- [ ] VR baselines captured + committed
- [ ] Unit tests for each rendered state

#### `<MatchResultRow>` reskin (mini-teaser row)

- [ ] Component rewritten to a scaled-down mini-teaser shape: 64px stub (display-big date + italic month) + body (italic display teams + display-big score) + result pill at the row end
- [ ] Result pill: W → `pill-jersey`, G → cream-soft + ink border, L → `warm` (round-2 sub-decision; can downgrade to bordered-cream if owner flags during PR review)
- [ ] Result-coloured left border from the legacy component **dropped** — conflicts with the new 2px ink card frame
- [ ] Light theme only — `theme="dark"` prop dropped (no current dark consumer)
- [ ] Mounts `<MatchStatusBadge>` as a corner stamp when applicable
- [ ] Whole row is a `<Link>` to `/wedstrijd/[matchId]` (matches legacy behaviour)
- [ ] Stories cover W / G / L + edge states
- [ ] VR baselines captured + committed
- [ ] Unit tests for each result state + status integration

#### Page assembly + e2e

- [ ] `apps/web/src/app/(main)/wedstrijd/[matchId]/page.tsx` rewired to the locked composition: `<MatchHero>` → `<StripedSeam>` → `<MatchLineupSection>` → `<MatchEventsSection>` → `<FooterSafeArea>`
- [ ] `<MatchStripSlot>` mounted inline once at the top (per d1 — same opt-in as `/spelers/[slug]`)
- [ ] Reserved (unrendered) slots in the composition for `<MatchArticleLinkCard>` + `<RelatedArticles>` documented with a TODO comment pointing at the post-#1470 follow-up
- [ ] Legacy `<MatchDetailView>` consumption removed (component retirement in Phase 3)
- [ ] `getMatchDetail` BFF call shape unchanged; lineup + events flow through the new sections directly
- [ ] `generateMetadata` preserved; OG image unchanged
- [ ] `<JsonLd>` preserved (breadcrumb + `SportsEvent` per existing builder; no scope creep on the schema-dts side)
- [ ] Analytics: `match_detail_view` page-view event fires on mount (pattern from Phase 6.A `<PageViewTracker>`); `match_lineup_section_in_view` + `match_events_section_in_view` intersection events fire when each section enters view (pattern from Phase 6.A `<TrackInView>`); only mount the wrappers when the section will actually render (no orphan events on auto-hide)
- [ ] GTM regex update: extend the existing `responsibility_|search_|organigram_|related_content_|homepage_|player_` regex to include `match_` (CLAUDE.md analytics-checklist line update + manual GTM trigger change documented in PR body)
- [ ] Playwright e2e smoke test for `/wedstrijd/[matchId]` still passes (no broken images, `<h1>` visible, console clean)
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] `pnpm --filter @kcvv/web run test:e2e` passes locally against this route family

#### Cross-cutting

- [ ] `apps/web/CLAUDE.md` "Redesign primitives (Phase 0+)" section updated with `<MatchHero>`, `<MatchLineupSection>`, `<MatchEventsSection>`, extended `<MatchStatusBadge>`, reworked `<MatchTeaser>`, reworked `<MatchResultRow>`
- [ ] `--color-card-red` token registered in the Foundation/Colors Storybook reference
- [ ] No staging seed matrix required — match data is BFF-synced (no per-record fixtures to author). E2e smoke validates the page assembly against staging data

### Phase 3 — Cleanup

- [ ] `apps/web/src/components/match/MatchesSlider/` deleted entirely (component file + tests + stories + index)
- [ ] `<MatchTeaser variant="compact">` code path removed; `variant` prop simplified per Phase 2 lock
- [ ] Legacy `<MatchDetailView>` + `<MatchHeader>` deleted (`apps/web/src/components/match/MatchDetailView/`, `apps/web/src/components/match/MatchHeader/`); barrel exports cleaned; no remaining consumers (`rg` confirms)
- [ ] `apps/web/src/components/design-system/HorizontalSlider/HorizontalSlider.stories.tsx` inline `MatchCard*` mock + `mockMatches` array — **out of scope** per #1528's own follow-up cleanup note; flag if it surfaces in review but defer to a separate ticket
- [ ] `pnpm --filter @kcvv/web check-all` passes

---

## 6. Effect Schema / api-contract changes

One literal expansion; no new shapes.

```typescript
// packages/api-contract/src/schemas/match.ts
export const MatchStatus = S.Literal(
  "scheduled",
  "finished",
  "forfeited",
  "postponed",
  "cancelled",   // NEW (#6.B.d5)
  "stopped",
);
```

```typescript
// apps/api/src/psd/transforms.ts — BEFORE
if (cancelled) return "postponed";

// AFTER
if (cancelled) return "cancelled";
```

**No other api-contract changes.** No new endpoints. No new Schema classes. The PSD response schemas (`apps/api/src/psd/schemas-*.ts`) stay untouched — PSD's `cancelled: boolean` is already in them; the transform just stops collapsing it.

---

## 7. Open questions

These do NOT block the PRD. They surface during implementation and resolve via tracer feedback, audit at PR time, or owner direction.

- [ ] **`--color-card-red` token reusability.** Phase 6.B introduces it for CANC. If a future system-alert / error / destructive-action vocabulary needs a red, this token covers it. Worth registering in Foundation/Colors story; worth a sentence in CLAUDE.md flagging "this is the redesign's alert-red — reuse, don't re-introduce a sibling". **Resolved by**: design-system review at Phase 2 PR time.
- [ ] **L pill colour on `<MatchResultRow>`.** Current spec: warm. Risk: a difficult season → many warm pills in a row → "traffic light" feel. Fallback: downgrade to bordered-cream (same as G). **Resolved by**: implementer renders a screenful of mixed results in Storybook + owner sanity-checks at PR review.
- [ ] **`<MatchArticleLinkCard>` follow-up issue.** Design-locked + build-deferred. A follow-up issue should be filed alongside #1470 (when it lands) so the link card ships as part of #1470's implementation or as an immediate follow-up. **Resolved by**: file the follow-up issue when this Phase 6.B PRD's `/prd-to-issues` run completes — title it `feat(matches): implement <MatchArticleLinkCard> per locked design (post-#1470)` and add `blocked-by: #1470` via GraphQL.
- [ ] **`<MatchHero>` mobile collapse.** Two-zone stub stacks vertically; design is straightforward but unverified at production scale. **Resolved by**: implementer renders the hero at narrow widths in Storybook; if the stack feels broken, a small round-4 mockup in `6b2-matchhero/` sub-folder + owner sign-off.
- [ ] **`<MatchStripClient>` epic reference.** The Phase 6 epic (#1528) mentioned `<MatchStripClient>` as a cross-cutting deliverable, but no such component exists in the current codebase — actual files are `<MatchStripSlot>` / `<MatchStrip>` / `<MatchStripView>`. d8 audit closed this as no-op (Phase 3.C lock authoritative). **Resolved by**: nothing to do; this PRD acknowledges the epic's reference is outdated.

---

## 8. Discovered unknowns

Surfaced during the 8 drills, not blockers, no owner direction needed at PRD-authoring time. Captured for the implementer.

- The current `<MatchStripView>` already conforms to Phase 3.C locked Direction D. No drift between spec and implementation; d8 audit returned a clean no-op.
- `<HorizontalSlider>`'s inline `MatchCard*` mock from PR #1594 is unrelated to Phase 6.B's MatchTeaser reskin — they're separate components living in different folders. The #1528 follow-up cleanup that swaps the slider stories to render the real reskinned MatchTeaser still applies but stays its own ticket (not bundled with Phase 6.B).
- `<UpcomingMatches>` on the homepage (the post-Phase-4.B.2 successor of `<MatchesSliderSection>`) does NOT use `<MatchTeaser>` — it composes its own primitives (`<TapedCard>` + `<EditorialHeading>` + `<MonoLabel>`) via `<UpcomingMatchesClient>`. No knock-on impact from Phase 6.B's teaser reskin.
- `<TeamSchedule>` is in `apps/web/src/components/team/` (Phase 6.C scope), but its sole reskin requirement (the per-row `<MatchResultRow>` component) lands in Phase 6.B per the Phase 6 epic's cross-cutting designation. When Phase 6.C drills `<TeamDetail>`, the rows already use the locked vocabulary.

---

## 9. Implementation order suggestion

Not a hard requirement (sub-issues are written to be parallel-executable after Phase 1), but a pragmatic order for one-engineer execution:

1. **Phase 1** ships first (tracer) — every Phase 2 component depends on the cancelled literal landing in the shared types.
2. **`<MatchStatusBadge>` extension** ships second — it's the smallest of the Phase 2 components and unblocks visual review of the badge across every other component's stories.
3. **`<MatchHero>` + `<MatchLineupSection>` + `<MatchEventsSection>`** ship in parallel — they're independent components, each with its own story + test suite, all consumed only by the page assembly.
4. **`<MatchTeaser>` reskin** ships in parallel with the above — the only consumer (`<CalendarMonth>`) doesn't change its API call.
5. **`<MatchResultRow>` reskin** ships in parallel — same reasoning (`<TeamSchedule>` is the sole consumer; API unchanged).
6. **Page assembly + e2e** ships last in Phase 2 — depends on all of the above.
7. **Phase 3 cleanup** rides with the page-assembly PR or ships immediately after at the implementer's choice. Per Phase 6.A precedent (where #1886 was a separate cleanup PR after #1885), separate-ship is the cleaner default.
