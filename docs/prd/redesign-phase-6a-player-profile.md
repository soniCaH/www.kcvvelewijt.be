# PRD — Phase 6.A · Player Profile Redesign

**Status:** ready for `/prd-to-issues`. All 9 design drills (6.d0 → 6.d9) locked 2026-05-21.
**Authored:** 2026-05-21.
**Owner:** @climacon.
**Tracker:** #1528 (Phase 6 master).
**Lock docs (authoritative for design decisions):** `docs/design/mockups/phase-6-player-profile/*-locked.md` — 9 per-element locks. Do not re-derive in any sub-issue; quote the lock docs.
**Master plan:** `docs/plans/2026-04-27-redesign-master-design.md` §5.3 (rewritten 2026-05-21 to reflect the locks).
**Brief (historical):** `docs/design/phase-6-player-profile-brief.md` (closeout banner points to lock docs).

---

## 1. Problem statement

`/spelers/[slug]` ships in pre-redesign vocabulary while the rest of the site is moving to the retro-terrace-fanzine system locked across Phases 0–5. Players are the canonical interview subject (referenced by `subject.playerRef` on articles) and the building block of every team-detail squad grid (Phase 6.B). Without bringing the player profile into the new vocabulary, the redesign cascade has a visible gap — interview articles link out to a legacy-styled profile, and Phase 6.B can't ship 24 player cards per team page until the per-player surface they expand from also reads in the new voice. Phase 6.A closes that gap with a deliberately lean scope: ZERO new BFF endpoints, ZERO net-new editorial backlog, schema migrations limited to additive PT decorator + three removals of unused fields.

---

## 2. Scope

### In scope (packages touched)

- **`apps/web`** — rewire `/spelers/[slug]/page.tsx`; new `<PlayerHero>`; rework `<BioBlock>` + `<QuotesBlock>`; new `pullquote` PT serializer in the bio renderer
- **`packages/sanity-schemas`** — add `pullquote` PT decorator on `player.bio` marks; drop `player.nationality` + `player.height` + `player.weight` field declarations
- **`apps/api`** — stop forwarding `nationality` in PSD sync (`apps/api/src/sync/psd-sanity-sync.ts`) and Sanity mutation payload (`apps/api/src/sanity/mutation.ts`)
- **`apps/studio`** — Sanity migration scripts to `unset` the three removed fields on existing player documents

### Out of scope — explicit, named

These surfaces ARE on the player profile today but are NOT touched in Phase 6.A. Mixed-state styling is acceptable per master plan §7 ("Concurrent PRs on un-redesigned surfaces continue using legacy tokens — that's fine"):

- **`<PlayerShare>`** — existing share card with QR. Page-level supplementary feature, not part of any design drill. Visually clashes with new vocabulary but ships unchanged. **Redesign deferred to Phase 6.D follow-up** (or earlier if owner directs). Tracked as open question #5.
- **`<RelatedArticlesSection>`** — existing related-content list driven by `ArticleRepository.findRelated(player.id)`. Same rationale, same deferral.
- **`<JsonLd>` + SEO** — pre-existing; audited but not redesigned (open question #3 on minor emission policy).
- **`<PlayerProfile>` legacy component** — retired in Phase 3 of this PRD (removed from `/spelers/[slug]` consumption); other surfaces are not consumers.

Also out of scope (separate phases / not introduced here):

- **Multi-team disambiguation logic** — partially surfaces (open question #4); rule documented at Phase 2, but no new data model
- **Keeper-specific stats** — `StatsStrip` was dropped at 6.d4 entirely
- **`player.publicConsent` opt-in field** — Phase 6.D candidate; not introduced in 6.A
- **`<PlayerCard>` in `<SquadGrid>`** — Phase 6.B (team detail); will inherit `<PlayerHero>` typography rhythm
- **`<PlayerFigure>` illustration refinement at hero scale** — queued as 6.d2.a, deferred until Phase 2 lands so we can see the canonical figure at production size
- **Phase 6.B surfaces** (match detail, team detail, kalender, events) — separate re-plan after Phase 6.A retrospective

---

## 3. Tracer bullet

**Phase 1 (the schema-cleanup PR) is the tracer.** It crosses every layer end-to-end — Sanity schema declarations → PSD sync forward → mutation payload → web GROQ projection → repository row mapping → Studio migration script → staging dataset — without touching UI. If the schema cleanup ships clean (staging migration runs, type regen is green, tests pass), the cross-package data flow is proven before any component work begins.

Thinnest possible end-to-end change: **the single Sanity migration that unsets three player fields, with the supporting code changes to stop reading/writing them.** Validates the entire backend chain.

---

## 4. Phases

Three phases. Each = one deployable unit, runnable tests, no broken state. Q8 picked "two PRs" — phases 1 and 2 are the two main PRs; Phase 3 is a small cleanup that can ride with Phase 2 or ship separately at Ralph's choice.

```text
Phase 1: Schema cleanup — TRACER. Backend-only, no UI change.
         → #1881 chore(schema): Phase 6.A tracer — drop nationality/height/weight + add bio pullquote decorator

Phase 2: UI rebuild — parallel sub-issues for PlayerHero / BioBlock / QuotesBlock
         then integration via page assembly.
         → #1882 feat(players): <PlayerHero> new component
         → #1883 feat(players): <BioBlock> rework + pullquote PT serializer
         → #1884 feat(players): <QuotesBlock> rework (single ink card)
         → #1885 feat(players): /spelers/[slug] page assembly + seeds + VR baselines

Phase 3: Legacy cleanup + doc audit closeout.
         → #1886 chore(players): retire legacy <PlayerProfile> + close Phase 6.A doc audit
```

**Milestone:** `player-profile-redesign` (#53).

**Dependency graph:**

```text
#1881 (tracer)
   ├─ blocks → #1882 (PlayerHero)
   ├─ blocks → #1883 (BioBlock)
   ├─ blocks → #1884 (QuotesBlock)
   └─ blocks → #1885 (page assembly)
                 ↑ also blocked by #1882, #1883, #1884
                 └─ blocks → #1886 (cleanup)
```

---

## 5. Acceptance criteria per phase

### Phase 1 — Schema cleanup (tracer)

- [ ] `player.nationality`, `player.height`, `player.weight` field declarations removed from `packages/sanity-schemas/src/player.ts`
- [ ] `pullquote` PT decorator added to `player.bio` block marks; Studio toolbar surfaces the new mark button
- [ ] `apps/api/src/sync/psd-sanity-sync.ts` no longer writes `nationality`
- [ ] `apps/api/src/sanity/mutation.ts` `PlayerDocument` type no longer carries `nationality`
- [ ] `apps/api/src/psd/schemas-player-team.ts` UNCHANGED — that's PSD's response schema; we just stop forwarding the field
- [ ] `apps/web/src/lib/repositories/player.repository.ts` GROQ + TS types + row mapping updated for the 3 removals
- [ ] `apps/web/src/lib/sanity/sanity.types.ts` regenerated from the new queries
- [ ] Sanity migration at `apps/studio/migrations/drop-player-unused-fields/index.ts` (or per-field variants) `unset`s the three fields on existing docs; idempotent; unit-tested
- [ ] Migration ran on staging (`npx sanity@latest migration run <name> --dataset=staging`) — verified in PR body
- [ ] All existing `/spelers/[slug]` page renders unchanged (no UI breakage from schema removal — verified manually on staging)
- [ ] Test fixtures updated: `apps/web/src/lib/repositories/player.repository.test.ts`, `apps/api/src/sync/psd-sanity-sync.test.ts`, `apps/api/src/sync/run-sync.test.ts`, `apps/api/src/sanity/mutation.test.ts`
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] `pnpm --filter @kcvv/api check-all` passes
- [ ] `pnpm turbo build --filter=@kcvv/sanity-schemas` passes
- [ ] PR body includes the migration command and verification step as explicit manual instructions per `[[feedback_sanity_migrations]]`

### Phase 2 — UI rebuild

#### `<PlayerHero>` new component

- [ ] Component shipped at `apps/web/src/components/player/PlayerHero/` with `PlayerHero.tsx`, `PlayerHero.stories.tsx`, `PlayerHero.test.tsx`, `index.ts` per `apps/web/CLAUDE.md` design-system structure
- [ ] Story title `Features/Players/PlayerHero`; meta tags include `vr` for VR baselines
- [ ] Composes `<TapedFigure aspect="portrait-3-4">` rendering `player.psdImage` with newsprint filter + paper grain
- [ ] Falls back to canonical `<PlayerFigure>` illustration variant when `psdImage` is missing (per 6.d2 lock — illustration only, no hybrid per `[[feedback_playerfigure_no_hybrid]]`)
- [ ] Name rhythm: first name in upright Black display + last name in italic display (per 6.d1 lock); period suffix on last name
- [ ] Meta row: `position · birthDate` only — age-graded per 6.d9 (adults: full DOB `DD·MM·YYYY`; minors `<18`: `<age> jaar · '<YY>`)
- [ ] `<NumberDisplay size="display-2xl" tone="jersey">` + `<TicketStub>` (team / season) composed per locked spec
- [ ] No `<MonoLabel>NIEUW</MonoLabel>` badge (dropped at 6.d3)
- [ ] Storybook stories cover: A-team with photo + bio + 2 quotes; A-team with photo + no bio; adult without photo; U17 minor with photo; U8 minor without photo; long-surname stress test (Van den Broeck)
- [ ] VR baselines captured + committed for all stories
- [ ] Unit tests cover age-grading branch and illustration fallback branch

#### `<BioBlock>` rework + pullquote PT serializer

- [ ] `<BioBlock>` rebuilt to consume `player.bio` Portable Text via the article body serializer pattern
- [ ] New PT decorator serializer for `pullquote` mark: renders inline highlight in the paragraph AND lifts the first marked span into the right-column `<PullQuote tone="jersey">` card
- [ ] If `player.bio` is empty, component returns `null` (auto-hide branch)
- [ ] If no `pullquote` span is marked, paragraph renders alone; right-column collapses
- [ ] Storybook stories cover: full bio with 2 marks; bio with 1 mark; bio with 0 marks; empty bio (returns null)
- [ ] VR baselines captured
- [ ] Unit tests for each branch

#### `<QuotesBlock>` rework (single ink card)

- [ ] `<QuotesBlock>` rebuilt to render a single full-width `<PullQuote tone="ink">` (per 6.d8 lock — NOT the canonical ink+cream pair)
- [ ] Sources content from the **second** `pullquote`-marked span in `player.bio`
- [ ] If only span #1 is marked OR no marks, component returns `null` (auto-hide branch)
- [ ] Heading: `In zijn eigen woorden.` with highlight marker on "woorden"
- [ ] Storybook stories cover: bio with 2+ marks (renders); bio with 1 mark (hidden); empty bio (hidden)
- [ ] VR baselines captured

#### Page assembly

- [ ] `apps/web/src/app/(main)/spelers/[slug]/page.tsx` rewired to compose: `<MatchStrip>` → `<PlayerHero>` → `<StripedSeam>` → `<BioBlock>` → `<QuotesBlock>` → `<MatchStrip>` → `<PlayerShare>` → `<RelatedArticlesSection>` → `<FooterSafeArea>`
- [ ] Legacy `<PlayerProfile>` consumption removed (retired in Phase 3)
- [ ] `<PlayerShare>` + `<RelatedArticlesSection>` rendered unchanged below the new content
- [ ] `getPlayerStats` BFF call removed from page (was only feeding the dropped `<StatsStrip>`)
- [ ] `generateMetadata` preserved; OG image still uses `player.imageUrl`
- [ ] `<JsonLd>` preserved (open question #3 on minor emission may revisit)

#### Cross-cutting

- [ ] Analytics: `player_profile_view` event continues to fire (regression check); new events `player_bio_pullquote_in_view` + `player_quotes_block_in_view` instrumented per `apps/web/CLAUDE.md` Analytics Checklist
- [ ] GTM regex covers `player_` namespace (verify; extend if needed)
- [ ] Staging seeds run per §12 of the verification table (see "Verification" below); 7 seeds match the matrix
- [ ] Staging URLs resolved into PR body BEFORE requesting review per `[[feedback_run_seed_yourself]]`
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] Playwright smoke test for `/spelers/[slug]` still passes

### Phase 3 — Cleanup

- [ ] Legacy `<PlayerProfile>` component file deleted; barrel exports cleaned; no remaining consumers
- [ ] `apps/web/CLAUDE.md` "Redesign primitives (Phase 0+)" section updated with `<PlayerHero>` + reworked `<BioBlock>` + `<QuotesBlock>` entries
- [ ] No stale references to `<StatsStrip>` / `<CareerLogTable>` / `<RecentMatchesGrid>` / `<MonoLabel>NIEUW` / `<QuotesBlock>` cream-half in `docs/` (grep verifies)
- [ ] No stale references to `player.nationality` / `player.height` / `player.weight` outside the migration script + tests (grep verifies)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Verification matrix (Phase 2 staging seeds)

Per `[[feedback_variant_coverage_matrix_in_seeds]]`. Implementer runs the seeds on staging and resolves real psdIds + URLs into the PR body BEFORE requesting review.

| Seed | Player               | Age      | Team   | `psdImage` | bio    | Pullquote spans | Renders                              | Branch covered                |
| ---- | -------------------- | -------- | ------ | ---------- | ------ | --------------- | ------------------------------------ | ----------------------------- |
| 1    | Maxim Breugelmans    | Adult 26 | A-team | ✓          | ✓ full | 2               | Hero photo + BioBlock + QuotesBlock  | Full path                     |
| 2    | Real A-team player B | Adult    | A-team | ✓          | ✓      | 1               | Hero photo + BioBlock inline only    | QuotesBlock-hide              |
| 3    | Real A-team player C | Adult    | A-team | ✓          | ✓      | 0               | Hero photo + BioBlock paragraph only | Inline-pullquote-hide         |
| 4    | Real A-team player D | Adult    | A-team | ✓          | empty  | n/a             | Hero photo only                      | BioBlock-hide                 |
| 5    | Real adult, no photo | Adult    | B-team | missing    | empty  | n/a             | Hero illustration fallback only      | Illustration fallback (adult) |
| 6    | Real U17 player      | Minor 16 | U17    | ✓          | empty  | n/a             | Hero photo + age-graded DOB          | Minor DOB grading + photo     |
| 7    | Real U8 player       | Minor 7  | U8     | missing    | empty  | n/a             | Hero illustration + age-graded DOB   | Illustration fallback (minor) |

Privacy policing: do not author bios for seeds 6-7 (minors) per `[[project_player_profile_all_ages]]`.

---

## 6. Effect Schema / api-contract changes

Phase 6.A introduces **no new BFF endpoints** and **no new `@kcvv/api-contract` schemas**. The changes cascade from the schema removals only:

- `apps/api/src/sanity/mutation.ts` — `PlayerDocument` type drops `nationality: string | null`
- `apps/api/src/sync/psd-sanity-sync.ts` — function body drops `nationality: psd.nationality` assignment
- `apps/web/src/lib/repositories/player.repository.ts` — `Player` row type drops `nationality?` / `height?` / `weight?` fields; GROQ projection drops the three field selections
- `apps/web/src/lib/sanity/sanity.types.ts` — regenerates from query changes (build artifact, not authored)

`apps/api/src/psd/schemas-player-team.ts` (PSD response schema) **is not touched** — that schema describes what PSD sends; we just stop forwarding `nationality` downstream.

`getPlayerStats` BFF call is **removed from the page** but the endpoint stays alive — other surfaces (team detail standings, future match recaps) consume it.

---

## 7. Open questions

These are NOT blockers to writing this PRD. They surface during implementation and either resolve via tracer feedback, audit at PR time, or owner direction.

- [ ] **Upright Black display weight font-subset audit.** 6.d1 introduces upright Black to the heading vocabulary for the first time (every prior `<EditorialHeading>` ships italic). **Resolved by**: PlayerHero PR author audits `globals.css` `@font-face` rules at start of Phase 2; if italic-only today, font subset needs re-cutting in a small follow-up PR before the visible upright-Black render lands.
- [ ] **`<EditorialHeading>` API extension for name-split rhythm.** Two viable approaches: (a) new `nameWeight="split"` prop accepting `first` + `last` strings; (b) consumer-level `<span>` override with explicit weight classes; no primitive change. **Resolved by**: PlayerHero PR author picks during component design; documented in PR.
- [ ] **Cross-age `Person` JSON-LD emission for minors.** Currently `<JsonLd buildPersonJsonLd>` fires for all players. Privacy stance vs SEO trade-off. Tentative recommendation: emit for adults only. **Resolved by**: page-assembly PR review with owner sign-off.
- [ ] **Multi-team disambiguation for hero team kicker.** When a player is rostered to multiple teams, which team's name appears in the kicker? **Resolved by**: PlayerHero PR author audits the legacy `<PlayerProfile>` page logic and documents the rule in the new component's docstring.
- [ ] **`<PlayerShare>` + `<RelatedArticlesSection>` redesign deferral.** Both ship unchanged in Phase 6.A — mixed-state acceptable per master plan §7. Confirm Phase 6.D is the right home, OR open follow-up issues tagged for an earlier phase. **Resolved by**: owner direction during Phase 6.A closeout retrospective.
- [ ] **`player.publicConsent` opt-in field** for minor-photo opt-out. Out of Phase 6.A scope; documented in `cross-age-locked.md` as forward path. **Resolved by**: Phase 6.D scoping (not now).
- [ ] **`<PlayerFigure>` illustration at hero scale.** Canonical illustration (currently rendered at ~60px avatar) gets rendered at ~280px hero — may read too sparse / too geometric. **Resolved by**: 6.d2.a sub-drill, deferred until Phase 2 components land and we can see the figure in real context.

---

## 8. Discovered unknowns

Filled during implementation. Append entries like:

```text
- [date] Discovered: [what was found] → [action taken: new issue #N / PRD updated / resolved inline]
```

_(empty at PRD authoring time)_
