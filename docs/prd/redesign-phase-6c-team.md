# PRD — Phase 6.C · Team Detail + Listing Redesign

**Status:** issues cut — #1938–#1947, milestone `redesign-retro-terrace-fanzine`. PR #1937 (draft until merge).
**Authored:** 2026-05-29.
**Owner:** @climacon.
**Tracker:** #1528 (Phase 6 master).
**Issues:** #1938 (tracer) · #1939–#1945 (detail) · #1946 (listing) · #1947 (cleanup). Dependencies wired via GitHub blockedBy.
**Lock docs (authoritative for design decisions):** `docs/design/mockups/phase-6-team/*-locked.md` — `data-reality`, `detail-ia`, `teamhero`, `standings`, `squadgrid`, `staff`, `listing`. Do not re-derive in any sub-issue; quote the lock docs.
**Decision record:** memory `project_phase_6cde_remainder_decisions` (direction + cross-surface deltas).
**Master plan:** `docs/plans/2026-04-27-redesign-master-design.md` §6.4 (listing) + §6.5 (detail) — both carry status-notes pointing here.
**Precedent:** `docs/prd/redesign-phase-6b-match-detail.md` (structure, AC style, analytics + VR + CLAUDE.md conventions).
**Drill artefacts:** `docs/design/mockups/phase-6-team/6cd{1..6}-*/` — comparison HTML per drill. Historical record; lock docs supersede.

---

## 1. Problem statement

`/ploegen` (team listing) and `/ploegen/[slug]` (team detail) ship entirely in pre-redesign vocabulary — the detail page is a tabbed `<TeamDetail>` (Info / Spelers / Wedstrijden / Klassement) with a legacy `InteriorPageHero` and a `<TeamStandings>` table that uses **banned outcome colours** (green/yellow/red W-D-L badges), while the listing renders `InteriorPageHero` + `<TeamFeaturedCard>` + `<YouthTeamsDirectory>`. Both diverge from the retro-terrace-fanzine system locked across Phases 0–6.B. The detail page is also the most variant-dense surface in the redesign (A-team with full data → a U6 with only a squad), so it needs an IA that degrades gracefully. Phase 6.C rebuilds both surfaces to the locked single-scroll + sticky-nav composition, introduces a full-season match agenda on its own route, and aligns the squad/standings/staff to the design system — with **no new BFF endpoints, no new Effect schemas, no new editorial backlog beyond fields the `team` doc already has**.

---

## 2. Scope

### In scope (packages touched)

- **`apps/web`** — the bulk of Phase 6.C.
- **`packages/sanity-schemas`** — **one additive delta:** add the existing `pullquote` Portable-Text decorator (introduced for `player.bio` in 6.A) to `team.body` block marks, so `<TeamEditorial>` can render an optional styled coach/team pull-quote ("Het verhaal"). Additive; no migration; reuses the 6.A web-side serializer. No `apps/api` / `packages/api-contract` / `apps/studio` changes.
  - **New route** `src/app/(main)/ploegen/[slug]/wedstrijden/page.tsx` — full-season month-grouped agenda, auto-scroll to the next match on load. Uses the existing `bff.getMatches(psdId)`.
  - **Rebuild** `src/app/(main)/ploegen/[slug]/page.tsx` to the locked single-scroll composition (sticky section-nav; sections auto-hide on empty data).
  - **Rebuild** `src/app/(main)/ploegen/page.tsx` to the A+B paired-flagship + youth-directory listing.
  - **New components:** `<TeamHero>`, `<StandingsTable>` (redesigned, replaces legacy `<TeamStandings>`), `<SquadGrid>`, the match **agenda row + `<TeamMatchesSection>` teaser + full-schedule view**, `<TeamFlagship>` (listing A/B block), reskinned `<PlayerCard>`, reskinned staff card, reskinned youth-directory.
  - **Reuse:** already-reskinned `<MatchResultRow>` / `<MatchTeaser>` (Phase 6.B) where the agenda or schedule needs a match row; `<TapedCard>`, `<MonoLabel>`, `<EditorialHeading>`, `<StripedSeam>`, `<PlayerFigure>`, `<JerseyShirt>`, `<TapedFigure>`, `<SponsorsBlock>` (global), `<FilterTabs>`.
  - **Retire (Phase 4 cleanup):** legacy `<TeamDetail>`, `<TeamStandings>`, `<TeamSchedule>`, `<TeamRoster>`, `<StaffCard>`, `<TeamOverview>`, `<TeamCard>`, `<TeamFeaturedCard>`, `<YouthTeamsDirectory>` once no consumers remain.

### Out of scope — explicit, named

- **Team-filtered sponsors.** Sponsor docs don't reference teams; the detail page renders the **global** `<SponsorsBlock>` at the foot. No sponsor-schema work. (Per `listing`/decision record.)
- **Coach in the TeamHero.** Dropped — `staff[]` is unbounded and the only head-coach signal (`functionTitle` = `T1`/`Hoofdtrainer`, free-text, often null) is unreliable. Coaches appear in the Staff section only.
- **Dames / women's team.** No such team exists; the listing's senior side is A-ploeg + B-ploeg only.
- **Standings form (Vorm) column.** `RankingEntry.form` is optional and not populated for the other teams in the division — dropped. The win/draw/loss colour language applies to the **matches agenda only**, not standings.
- **`StatsStrip` on the detail page.** Redundant with the team's own highlighted standings row — dropped (matches the lock).
- **`getStatistics` / any new BFF endpoint.** The team's ranking row covers W/D/L + GF/GA. No statistics endpoint consumed.
- **Youth match/standings data sourcing.** Where PSD returns empty ranking/matches for a youth team, those sections auto-hide. No effort to source youth competitive data.
- **Player profile content** (`/spelers/[slug]`) — Phase 6.A, shipped. PlayerCard only links to it.
- **6.E events / 6.D kalender** — separate re-plans (sequence: this 6.C, then 6.E, then 6.D).

---

## 3. Tracer bullet

**Phase 1 = `<TeamHero>` rendered live on `/ploegen/[slug]` from real Sanity data, above the existing (legacy) page body.** Mixed-state is acceptable per master plan §7.

This is the thinnest slice that crosses every layer the redesign actually touches: a new design-system component → the `(main)/ploegen/[slug]/page.tsx` server component → `TeamRepository.findBySlug` → Sanity. It proves the sibling-per-surface hero pattern wires onto a team route with real data (name → category headline, division/season meta, `teamImage` → newsprint polaroid, `tagline` → lead, **no-photo → `<JerseyShirt>` fallback**) before any of the heavier sections are built. No data-layer change, no caching change, legacy tabs still render below it until Phase 2 rebuilds the shell.

---

## 4. Phases

Four phases. Each = one deployable unit, runnable tests, no broken state. **Milestone:** `redesign-retro-terrace-fanzine`.

```text
Phase 1: <TeamHero> live on /ploegen/[slug] — TRACER (new component + real Sanity wiring, legacy body below).
         → #1938 feat(teams): <TeamHero> + tracer mount on /ploegen/[slug]

Phase 2: Team-detail rebuild — parallel component sub-issues, then page assembly.
         → #1939 feat(teams): <StandingsTable> (redesigned; KCVV row highlighted; no Vorm)
         → #1940 feat(teams): <SquadGrid> + <PlayerCard> reskin (position-grouped; number disc)
         → #1941 feat(teams): <TeamStaff> section (compact cards; functionTitle→label)
         → #1942 feat(teams): match agenda row + <TeamMatchesSection> teaser
         → #1943 feat(teams): /ploegen/[slug]/wedstrijden full-season agenda route (auto-scroll)
         → #1944 feat(teams): <TeamEditorial> (body / trainingSchedule / contactInfo)
         → #1945 feat(teams): /ploegen/[slug] page assembly (single-scroll + sticky-nav, auto-hide) + e2e + analytics

Phase 3: Team-listing rebuild.
         → #1946 feat(teams): <TeamFlagship> (A+B paired) + youth directory + /ploegen assembly + e2e

Phase 4: Legacy cleanup + doc audit.
         → #1947 chore(teams): retire legacy team components + CLAUDE.md + master-plan §6.4/6.5 closeout
```

**Dependency graph:**

```text
Phase 1 (tracer: <TeamHero>)
   └─ informs → Phase 2 components (all independent; parallel after the agenda-row settles)
        ├─ <StandingsTable>
        ├─ <SquadGrid> + <PlayerCard>
        ├─ <TeamStaff>
        ├─ agenda row ──┬─ <TeamMatchesSection> teaser
        │               └─ /ploegen/[slug]/wedstrijden route
        ├─ <TeamEditorial>
        └─ page assembly + e2e  ← consumes all Phase 2 components
              ↓
        Phase 3 (listing: <TeamFlagship> + youth directory + /ploegen assembly)
              ↓
        Phase 4 (cleanup — retire legacy once no consumers remain)
```

---

## 5. Acceptance criteria per phase

### Phase 1 — `<TeamHero>` tracer

- [ ] `<TeamHero>` at `apps/web/src/components/team/TeamHero/` (`.tsx`, `.stories.tsx`, `.test.tsx`, `index.ts`); story `Features/Teams/TeamHero`, meta tagged `vr`
- [ ] Category-forward: kicker `KCVV Elewijt` (`· Jeugd` for youth) + display-big headline = category (`A-ploeg.` / `U13.`) with jersey-deep italic period
- [ ] Meta row (MonoLabel pills): **division + season only**; pills auto-hide when absent; youth shows the youth band (Bovenbouw/Middenbouw/Onderbouw) + season
- [ ] `tagline` renders as italic display lead, auto-hides when empty
- [ ] Right artefact: taped squad polaroid (`<TapedFigure>` newsprint treatment) + dashed season ticket-stub; **no-`teamImage` → `<JerseyShirt>` fallback** in the same frame
- [ ] Two-column desktop; mobile stacks with the artefact above the headline (§5.4)
- [ ] Mounted at the top of `apps/web/src/app/(main)/ploegen/[slug]/page.tsx` using existing `TeamRepository.findBySlug` data; legacy body still renders below (temporary mixed state)
- [ ] Stories cover: A-team (photo), no-photo (JerseyShirt), youth (degraded meta)
- [ ] VR baselines captured + committed; unit tests cover headline/meta/fallback branches
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — Team-detail rebuild

#### `<StandingsTable>` (redesigned)

- [ ] New component `apps/web/src/components/team/StandingsTable/` (replaces legacy `<TeamStandings>`); story `Features/Teams/StandingsTable`, `vr`
- [ ] Classic retro table: mono uppercase headers, `border-b-2 ink` header rule, hairline row rules; columns `# · Ploeg · M · W · G · V · +/- · Ptn`
- [ ] KCVV row: `color-mix(jersey-deep 12%, cream)` tint + `inset 3px 0 jersey-deep` left accent + non-italic bold name
- [ ] Small neutral crest before each team name (real PSD `team_logo`; neutral placeholder fallback)
- [ ] **No Vorm column.** No green/yellow/red badges.
- [ ] Mobile: drop `W · G · V`
- [ ] Section auto-hides when `bff.getRanking` returns empty (most youth)
- [ ] Stories: full division (KCVV mid-table), empty (auto-hide). VR baselines. Unit tests for the highlight + auto-hide branch

#### `<SquadGrid>` + `<PlayerCard>` reskin

- [ ] `<SquadGrid>` at `components/team/SquadGrid/`; `<PlayerCard>` reskin at `components/player/PlayerCard/` (or `components/team/`); stories `vr`
- [ ] Position-grouped (Doelmannen / Verdedigers / Middenvelders / Aanvallers) from `player.position || positionPsd`; mono group headers + hairline rule
- [ ] PlayerCard = `<TapedCard>` + `<PlayerFigure>` photo (3:4 newsprint) with **jersey-deep number disc overlaid top-left** + name (first semibold + last italic) + position; whole card links to `/spelers/[slug]`; press-down hover
- [ ] No-`psdImage` → `<PlayerFigure>` illustration fallback; minors reuse PlayerFigure's locked treatment
- [ ] Stories cover: photo, illustration-fallback, a full position-grouped grid. VR baselines. Unit tests

#### `<TeamStaff>` section

- [ ] New section component (reskins/retires legacy `<StaffCard>`); story `vr`
- [ ] Compact centred cards: round photo (newsprint) **or monogram fallback** + name + function
- [ ] Function = `staffMember.functionTitle` rendered readable via a code→label map (`T1→Hoofdtrainer`, `T2→Assistent-trainer`, `TK→Keeperstrainer`, `TVJO→Jeugdcoördinator`); pass through already-readable values; **fall back to the role bucket** (`Trainer`/`Afgevaardigde`) when null
- [ ] Section auto-hides when `staff` empty. Stories: with photos, with monograms. VR + unit tests

#### Match agenda row + `<TeamMatchesSection>` teaser

- [ ] Agenda row component (`components/team/TeamMatchRow/` or shared) — **responsive: A symmetric scoreboard (desktop ≥~640px) / B KCVV-centric column (mobile)**, one component + one breakpoint
- [ ] Date stub; club crests (real PSD `home_team.logo`/`away_team.logo`; neutral placeholder fallback); centred score-or-time headline in the display font (kickoff time, no `vs`); competition caption (ink, one weight, no tag) inside the centre column under the score
- [ ] **Outcome = flat colour underline on the score**, wider than the digits, climbing toward the "–": **win = `color-mix(jersey-deep 34%, cream)` · draw = none · loss = `color-mix(--color-alert 38%, cream)`** (brick). NOT a separate column; NOT `<HighlighterStroke>`.
- [ ] Long team names: ellipsis + `title="<full name>"`. Mobile home/away = **Phosphor Fill** `House`/`Bus` (`weight="fill"`, via `@/lib/icons.redesign` — the redesign's canonical icon set; **not** Lucide)
- [ ] `<TeamMatchesSection>` (teaser on the detail page): featured next match (jersey-deep filled card) + a few recent rows (same vocabulary) + **"Volledige kalender →"** linking to `/ploegen/[slug]/wedstrijden`
- [ ] Section auto-hides when `bff.getMatches` empty. Stories: mid-season (W/D/L mix), season-start (all upcoming), empty. VR + unit tests

#### `/ploegen/[slug]/wedstrijden` full-schedule route

- [ ] New route `apps/web/src/app/(main)/ploegen/[slug]/wedstrijden/page.tsx`; ISR like the detail page; `generateMetadata`
- [ ] Renders the full season as a **month-grouped newspaper agenda** (display-big month headings, no rule beneath; agenda rows) ascending Aug→Jun
- [ ] **Auto-scrolls to the next match on load** (`scrollIntoView`, `block:center`, `prefers-reduced-motion` safe)
- [ ] **No next match (end / off-season):** render the full season and **skip auto-scroll** (or scroll to top) — never crash on a missing anchor
- [ ] **`bff.getMatches` returns empty:** render a localized empty state (e.g. "Geen wedstrijden gepland") — **no 404, no redirect**
- [ ] Handles a 40–50-fixture season; Beker/Oefen distinguished by the competition caption text
- [ ] Playwright e2e smoke: route renders + console clean; asserts the **empty-state UI** when there are no fixtures, and that **auto-scroll is skipped** when there is no next match

#### `<TeamEditorial>` (body / training / contact)

- [ ] **Schema (additive):** add the 6.A `pullquote` decorator to `team.body` block marks in `packages/sanity-schemas/src/team.ts` (reuse the existing decorator + web serializer; no migration)
- [ ] Renders `team.body` (Portable Text) via a prose serializer **incl. the `pullquote` decorator → a styled "Het verhaal" pull-quote** (reuse the 6.A `<BioBlock>` serializer), `team.trainingSchedule[]` (day/time/location/type) as a compact list/table, `team.contactInfo` (PT); each block auto-hides when empty
- [ ] Uses article-prose primitives (`<EditorialHeading>` subheads + prose width); no new PT block types beyond reusing the pullquote decorator. Story + unit test for the empty/auto-hide path + the pull-quote render

#### `/ploegen/[slug]` page assembly + e2e

- [ ] Page rewired to locked composition: SiteHeader → `<MatchStripSlot>` (top, per the /spelers + /wedstrijd opt-in) → `<TeamHero>` → sticky **section-nav** → `<StandingsTable>` → `<TeamMatchesSection>` → `<SquadGrid>` → `<TeamStaff>` → `<TeamEditorial>` → global `<SponsorsBlock>` → footer; `<StripedSeam>` between sections
- [ ] Sticky section-nav lists only sections that render (auto-hide aware); native anchors
- [ ] Every non-hero section auto-hides on empty data → a U6 page = hero + squad + staff
- [ ] Legacy tabbed `<TeamDetail>` consumption removed (component retired in Phase 4)
- [ ] `generateMetadata` + `<JsonLd>` (`SportsTeam` / breadcrumb per existing builder) preserved
- [ ] Analytics: `team_detail_view` page-view on mount; `team_standings_in_view` / `team_squad_in_view` / `team_matches_in_view` intersection events (Phase 6.A `<TrackInView>` pattern); mount trackers only when the section renders
- [ ] GTM regex: extend the existing `responsibility_|search_|…|match_` regex to include `team_` (CLAUDE.md analytics-checklist line + manual GTM trigger change documented in PR body)
- [ ] Playwright e2e for `/ploegen/[slug]` passes (h1 visible, no broken images, console clean); `pnpm --filter @kcvv/web check-all` + `run test:e2e` pass

### Phase 3 — Team-listing rebuild

- [ ] `<TeamFlagship>` component (A+B paired): A = jersey-deep block (content left / photo right); B = same block **mirrored** (photo left / content right) in **cream**; equal block dims; story `vr`
- [ ] `apps/web/src/app/(main)/ploegen/page.tsx` rebuilt: editorial page-header (`Onze ploegen.`) → A flagship → B flagship (larger gap between) → youth directory grouped **Bovenbouw / Middenbouw / Onderbouw** (compact crest + age-code cards) → footer
- [ ] Youth directory reskinned (retires `<YouthTeamsDirectory>`); each card links to its detail
- [ ] No Dames team; squad count omitted unless reliably available
- [ ] Uses existing `TeamRepository.findAllForLanding()` data shape (extend the VM only if a needed field is missing — flag as a discovered unknown, don't pre-add)
- [ ] Analytics `team_list_view` page-view; Playwright e2e for `/ploegen`; VR baselines for `<TeamFlagship>`
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4 — Cleanup + doc audit

- [ ] Retire (delete file + tests + stories + barrel exports, `rg` confirms no consumers): `<TeamDetail>`, `<TeamStandings>`, `<TeamSchedule>`, `<TeamRoster>`, `<StaffCard>`, `<TeamOverview>`, `<TeamCard>`, `<TeamFeaturedCard>`, `<YouthTeamsDirectory>`
- [ ] `apps/web/CLAUDE.md` "Redesign primitives (Phase 0+)" updated with the new team components
- [ ] Master plan §6.4 + §6.5 status-notes updated to "shipped"; decision-record memory updated
- [ ] `pnpm --filter @kcvv/web check-all` passes

---

## 6. Effect Schema / api-contract changes

**One additive Sanity-schema delta** (the `pullquote` decorator on `team.body`, reused verbatim from 6.A's `player.bio` — same decorator + same `<BioBlock>` serializer; additive, no migration). No api-contract / endpoint changes. Everything else already flows: Sanity `team` (name, slug, age, division/divisionFull, season, tagline, body, contactInfo, teamImage, trainingSchedule, `players[]→player`, `staff[]→staffMember`) via `TeamRepository`; BFF `getRanking(psdId)→RankingEntry[]` and `getMatches(psdId)→Match[]` (both already consumed by the current detail page). The matches outcome underline reuses existing tokens `--color-jersey-deep` + `--color-alert` (#b84a3a, already in `globals.css`) — **no new token**. The new `/ploegen/[slug]/wedstrijden` route is a Next.js page reusing `bff.getMatches`, not an api-contract change.

**Documented palette exception:** the matches outcome language (win jersey-deep / draw none / loss brick) is a deliberate, single exception to the redesign's "no outcome colours / no loss-red" lock — it applies to the matches agenda only (standings has no form indicator). `--color-alert` is a muted retro terracotta, not bright red.

---

## 7. Open questions

Not blockers. Resolve via tracer feedback, audit at PR time, or owner direction.

- [ ] **Club crest coverage/quality.** Standings + agenda rows want real PSD logos (`RankingEntry.team_logo?`, `MatchTeam.logo`). Coverage may be partial. **Resolved by:** implementer renders with real data; neutral monogram/placeholder fallback already specced.
- [ ] **`functionTitle` value set.** The code→label map assumes `T1/T2/TK/TVJO` + readable strings. Live staff data may contain other codes. **Resolved by:** inspect live staff at impl; unmapped values pass through verbatim, role-bucket fallback covers null.
- [ ] **PT serializer for `team.body` / `team.contactInfo`.** Reuse the article `ArticleBody` serializers or a lighter team-local renderer? **Resolved by:** implementer audits the existing serializer's coupling; default to reusing it.
- [ ] **Extra senior teams (veterans).** Does the club have a senior team beyond A/B that needs a flagship/row slot? **Resolved by:** owner / `TeamRepository` data at Phase 3.
- [ ] **Staging seed.** Editorial team fields (tagline/body/trainingSchedule/contactInfo) are manual — a representative seeded team (full data + a no-photo + a youth) is likely needed to VR/e2e the editorial + fallback paths. **Resolved by:** author + run a team seed in Phase 2 page-assembly issue (per Phase 6.A seed precedent), or confirm staging already has one.
- [ ] **`<TeamHero>` mobile artefact-above order** — straightforward; sanity-check at impl.

---

## 8. Discovered unknowns

Filled during implementation.

```text
- [date] Discovered: ... → [new issue #N / PRD updated / resolved inline]
```

---

## 9. Implementation order suggestion

Not a hard requirement (Phase 2 sub-issues are parallel-executable), but pragmatic for one-engineer execution:

1. **Phase 1** (TeamHero tracer) ships first — proves the new-component + Sanity wiring.
2. **Agenda row** ships next within Phase 2 — it's the most-drilled, highest-risk component and gates both `<TeamMatchesSection>` and the `/wedstrijden` route.
3. **`<StandingsTable>` + `<SquadGrid>`/`<PlayerCard>` + `<TeamStaff>` + `<TeamEditorial>`** ship in parallel — independent, each its own story/test suite.
4. **`/ploegen/[slug]/wedstrijden` route** ships once the agenda row lands.
5. **Page assembly + e2e** ships last in Phase 2 — consumes everything above.
6. **Phase 3 listing** after the detail page is live (shares `<TeamHero>`/crest vocabulary; flagship reuses the hero's jersey-deep treatment).
7. **Phase 4 cleanup** rides after, once `rg` confirms no legacy consumers — separate-ship is the cleaner default (per Phase 6.A #1886).
