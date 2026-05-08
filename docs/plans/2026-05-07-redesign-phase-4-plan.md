# Phase 4 — Implementation plan

> **PRD:** `docs/prd/redesign-phase-4.md`
> **Tracking issue:** [#1526](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1526)
> **Master design:** `docs/plans/2026-04-27-redesign-master-design.md`
> **Design brief:** `docs/design/mockups/phase-4-homepage/` — 24 round HTMLs + 7 `*-locked.md` specs (all locked 2026-05-07)
> **Predecessor plan:** `docs/plans/2026-05-03-redesign-phase-3-plan.md` (structure mirrored)
> **Sub-issues to create:** 12 children of #1526 (see §15 for `gh` recipes + GraphQL `addBlockedBy` script)

This plan executes the 12 Phase 4 sub-issues. Each is a separate Ralph-eligible work item with its own PR. This document is the source of execution order, file paths, acceptance criteria, and `addBlockedBy` graph.

---

## Pre-flight

Run once before opening any sub-issue:

1. **Worktree:** `pnpm ralph create 1526` to create the isolated worktree on `feat/issue-1526-tracer` (sub-branches per issue thereafter).
2. **Phase 3 merged on `main`:** verify `<EditorialHero>`, `<SiteHeader>`, `<MatchStrip>`, `<SiteFooter>`, `<PlayerFigure>`, `<JerseyShirt>`, `<EndMark>`, `<QASectionDivider>` are all merged. `gh pr list --state merged --search "Phase 3"` should list #1632, #1633, #1634, #1635, #1636, #1637, #1638, #1640, #1641, #1642.
3. **VR baseline drift check:** `pnpm vr` against current `main` to confirm no pre-existing failures before the redesign work starts.
4. **Audit existing call sites of legacy components to be retired:**
   - `<FeaturedArticles>`: `apps/web/src/components/home/FeaturedArticles/`. Single consumer in `apps/web/src/app/(landing)/page.tsx`.
   - `<MatchWidget>`: `apps/web/src/components/home/MatchWidget/`. Single consumer in `(landing)/page.tsx`.
   - `<MatchesSliderSection>`: `apps/web/src/components/home/MatchesSliderSection/`. Single consumer.
   - `<WebshopSection>`: `apps/web/src/components/home/WebshopSection/`. Single consumer.
   - Today's `<NewsGrid>`: `apps/web/src/components/home/NewsGrid/` — will be rebuilt in place; existing tests need rewrites.
   - Today's `<YouthSection>` + `<YouthBackdrop>`: stays, palette swap only.
   - Today's `<SponsorsSection>` + `<SponsorsBlock>`: SponsorsSection wrapper stays; SponsorsBlock gets rewritten internally.
5. **No Sanity migrations needed.** Confirm `article.featured` and `event.featuredOnHome` exist in `packages/sanity-schemas/src/`.
6. **Master design doc** open in another tab — §6 deltas of the PRD fold back into this doc as sub-issues complete.

---

## Task 4.0 — Tracer · `<TapeStrip color="warm">` variant

**Sub-issue:** create as child of #1526, no `blockedBy`. Title: `4.0 · Tracer — <TapeStrip color="warm"> primitive variant`.

**Goal:** Smallest cross-layer slice that proves the Phase 4 architecture works. The warm-tape variant is the only new primitive Phase 4 introduces; landing it first unblocks `<FeaturedEventBand>` and any future jersey-deep surface.

**Files to modify:**

- `apps/web/src/app/globals.css` — add `--tape-warm: rgba(240, 194, 100, 0.85);` token.
- `apps/web/src/components/design-system/TapeStrip/TapeStrip.tsx` — extend `color` prop union to `"jersey" | "warm"`. Add CSS branch.
- `apps/web/src/components/design-system/TapeStrip/TapeStrip.stories.tsx` — add `WarmOnJerseyDeep` story (jersey-deep panel + warm tape strip).
- `apps/web/src/components/design-system/TapedFigure/TapedFigure.tsx` — extend `tape[].color` enum to accept `"warm"`. Pass through to underlying TapeStrip.

**Implementation:**

1. Add the token to `globals.css` next to `--tape-jersey`. Append-only; do not remove `--tape-jersey`.
2. Update `TapeStrip` `color` prop. Default stays `"jersey"`.
3. Update `TapedFigure` `tape[]` array element type.
4. New story `WarmOnJerseyDeep` — single tape strip on a jersey-deep panel for VR.
5. `pnpm vr:update:story TapeStrip` to capture baseline.
6. `pnpm --filter @kcvv/web check-all` must be green before opening PR.

**Acceptance:**

- `<TapeStrip color="warm">` renders.
- `<TapedFigure tape={[{ color: "warm" }]}>` renders.
- VR baseline committed.
- `pnpm --filter @kcvv/web check-all` green.

**Closes:** PRD §3 tracer.

---

## Task 4.A.1 — `<NewsCard>` aspectRatio + rotation props

**Sub-issue:** `4.A.1 · <NewsCard> aspectRatio + rotation props`. `addBlockedBy 4.0`.

**Goal:** Extend the existing `<NewsCard>` primitive with the props `<NewsGrid>` will require.

**Files to modify:**

- `apps/web/src/components/article/NewsCard/NewsCard.tsx` — add props per `newsgrid-locked.md`.
- `apps/web/src/components/article/NewsCard/NewsCard.stories.tsx` — add stories per aspect + per rotation.

**Implementation:**

1. Add `aspectRatio?: "landscape-16-9" | "square" | "portrait-3-4"` (default `"landscape-16-9"`).
2. Add `rotation?: "a" | "b" | "c" | "d" | "none"` (default `"none"`).
3. Wire props to underlying `<TapedFigure>` for the inner image and `<TapedCard>` for the card rotation.
4. Update Storybook with `Article/NewsCard/Default` (16:9), `Article/NewsCard/SquareAspect`, `Article/NewsCard/PortraitAspect`, plus rotation variants on the default aspect.
5. VR baselines for each new story.
6. No regression on existing NewsCard usages — verify by running `pnpm vr` and checking diffs.

**Acceptance:**

- All new props work; defaults preserve current rendering.
- Storybook + VR baselines committed.
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 4.B.1 — `<NewsGrid>` rebuild

**Sub-issue:** `4.B.1 · <NewsGrid> rebuild (1+4 · 50/50 · slot rotation)`. `addBlockedBy 4.A.1`.

**Goal:** Rebuild `<NewsGrid>` from a 1+2 to a 1+4 layout per `newsgrid-locked.md`.

**Files to modify:**

- `apps/web/src/components/home/NewsGrid/NewsGrid.tsx` — full rewrite of geometry.
- `apps/web/src/components/home/NewsGrid/NewsGrid.stories.tsx` — sparse-state stories.
- `apps/web/src/components/home/NewsGrid/NewsGrid.test.tsx` — tests for sparse-N renders.

**Implementation:**

1. Drop the `featuredEvent` prop entirely. `<FeaturedEventBand>` now owns event display (separate component, separate section in page.tsx).
2. New geometry: CSS Grid, `grid-template-columns: 1fr 1fr`, lead spans both rows in left column, supporting cards fill 2x2 right cluster.
3. Sparse states (E.1): if articles.length < 5, conditionally render only the slots that have data. Sub-grid for 2x2 collapses to single row when < 4 supporting.
4. Mobile (<880px) collapses to: lead full-width on top, 2x2 grid below = 1+2+2 layout.
5. Per-slot rotation cycle `[a, b, c, d, a]` passed to `<NewsCard rotation={...}>`.
6. `aspectRatio="landscape-16-9"` forced on every card.
7. Stories: Default5, Sparse4, Sparse3, Sparse2, Sparse1, Empty (returns null — captured deliberately).
8. Tests: assert returns null at N=0, assert correct slot count at N=1..5, assert lead is always slot 0.

**Acceptance:**

- All sparse states render correctly.
- VR baselines for each.
- Existing tests retained where still valid; new tests added for sparse rendering.
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 4.B.2 — `<UpcomingMatches>` rename + rebuild

**Sub-issue:** `4.B.2 · <UpcomingMatches> rename + schedule depth + expand`. `addBlockedBy 4.0`.

**Goal:** Build `<UpcomingMatches>` per `upcoming-matches-locked.md`. Two lineage threads converge here:

1. **Replaces the original Phase 4 issue's `<ScheduleStandingsBlock>` proposal** — standings are dropped from the homepage entirely (Round 6a S.4 lock; standings live on `/ranking` only). Component is schedule-only — no tabs, no standings table.
2. **Absorbs today's `<MatchesSliderSection>` and `<MatchWidget>` legacy components** — both are deleted (moved to `_legacy/`). The new component renders 5 chronological matches default + inline expand-to-all.

This dual-rename matters for implementation drift: the spec's name (`<ScheduleStandingsBlock>`) and the legacy code's name (`<MatchesSliderSection>` / `<MatchWidget>`) are both retired in favour of `<UpcomingMatches>`.

**Files to create:**

- `apps/web/src/components/home/UpcomingMatches/UpcomingMatches.tsx`
- `apps/web/src/components/home/UpcomingMatches/UpcomingMatchesClient.tsx` (use client — handles expand state)
- `apps/web/src/components/home/UpcomingMatches/UpcomingMatches.stories.tsx`
- `apps/web/src/components/home/UpcomingMatches/UpcomingMatches.test.tsx`
- `apps/web/src/components/home/UpcomingMatches/index.ts`

**Files to delete (or move to _legacy/):**

- `apps/web/src/components/home/MatchWidget/`
- `apps/web/src/components/home/MatchesSliderSection/`

**Implementation:**

1. Server component shell — receives `matches: Match[]`, calls `<UpcomingMatchesClient>` with `initialMatches`.
2. Client component — renders 5 rows by default. State `expanded: boolean`. Expand button only renders when `totalUpcoming > 5`. `/kalender` link only renders when expanded (per Round 6b D.5 lock).
3. Row format: 56px when column (day + time mono) + matchup column (home — away italic, KCVV side bold when team_id === 1235) + badge (THUIS / UIT). Each row is a `<Link>` to `/match/{id}`.
4. Empty state: return null at 0 upcoming.
5. Mobile <640px: when column stacks above matchup column inside each row.
6. Stories: Default5 (5 matches), ExactlyFive (5 matches with no expand), SparseUnder5 (3 matches), Empty (returns null), Expanded (12 matches in expanded state via Storybook arg).
7. Tests: assert returns null at 0, assert expand button only when >5, assert row count + click target.

**Acceptance:**

- All states render correctly.
- VR baselines committed.
- Page.tsx integration updated to call `<UpcomingMatches>` instead of `<MatchWidget>` + `<MatchesSliderSection>` (this happens in 4.D.1).
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 4.B.3 — `<SponsorsBlock>` homepage variant

**Sub-issue:** `4.B.3 · <SponsorsBlock> homepage variant (single grid + cream-soft tile)`. `addBlockedBy 4.0`.

**Goal:** Rewrite SponsorsBlock per `sponsorsblock-locked.md`.

**Files to modify:**

- `apps/web/src/components/sponsors/SponsorsBlock/SponsorsBlock.tsx` — rewrite layout + tile treatment.
- `apps/web/src/components/sponsors/SponsorsBlock/SponsorsBlock.stories.tsx` — new stories.
- `apps/web/src/components/sponsors/SponsorsBlock/SponsorsBlock.test.tsx` — tier filter tests.

**Files to verify untouched:**

- `apps/web/src/components/home/SponsorsSection/SponsorsSection.tsx` — wrapper stays.

**Implementation:**

1. Filter: `tier in ["hoofdsponsor", "sponsor"] && active === true`. Order: hoofdsponsors first.
2. Single equal grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`. Gap 14px desktop, 10px mobile.
3. Per-logo tile: cream-soft background (`bg-cream-soft`), no border, no shadow, no rotation. Min-height 70px.
4. Greyscale-default + colour-on-hover via CSS `filter: grayscale(100%)` + `transition-property: filter`. Wrap in `motion-reduce:transition-none` for reduced-motion.
5. Each tile is `<Link href={s.url} target="_blank" rel="noopener">`.
6. Below the grid: `<Link href="/sponsors">Alle sponsors &amp; sympathisanten →</Link>` (mono uppercase styling).
7. Empty state: return null.
8. Stories: Default (3 hoofd + 10 sponsor), HoofdsponsorsOnly, SponsorsOnly, Empty, MissingLogos (italic Freight Display name fallback).

**Acceptance:**

- Tile treatment matches lock spec (M.3).
- VR baselines for all 5 stories.
- `/sponsors` link renders.
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 4.B.4 — `<YouthBlock>` palette swap

**Sub-issue:** `4.B.4 · <YouthBlock> palette swap to retro vocabulary`. `addBlockedBy 4.0`.

**Goal:** Migrate the existing `<YouthSection>` + `<YouthBackdrop>` to the retro tokens per `youthblock-locked.md`. Optional component rename to `<YouthBlock>`.

**Files to modify:**

- `apps/web/src/components/home/YouthSection/YouthSection.tsx` (or rename `YouthBlock.tsx`).
- `apps/web/src/components/home/YouthSection/YouthBackdrop.tsx` — gradient palette token swap.
- `apps/web/src/components/home/YouthSection/YouthSection.stories.tsx`.

**Implementation:**

1. Backdrop gradient swap: `from-kcvv-green-dark/90 via-kcvv-green-dark/75 to-kcvv-green-dark/50` → use jersey-deep tokens at 88/65/92 (matches Round 8b N.2).
2. `bg` SectionConfig in `(landing)/page.tsx` changes from `"kcvv-green-dark"` to a redesign token (still effectively the same colour family, but uses retro tokens).
3. Headline: `<EditorialHeading>` italic with accent decorator on "De toekomst" (yellow #f0c264).
4. Meta-line "Word jeugdspeler" (mono uppercase, opacity 0.7).
5. Stats line: `<MonoLabel>` for "220+ spelers · 16 ploegen". Verify accuracy at implementation; copy is hardcoded.
6. CTA: `<Button variant="primary">` with "Ontdek onze jeugd →" text (current copy preserved).
7. Mobile: gradient flips to vertical (existing behaviour).
8. Stories: Default (desktop) + Mobile (375px viewport).

**Acceptance:**

- Backdrop palette swapped; photo asset unchanged.
- Typography migrated to retro vocabulary.
- VR baselines updated.
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 4.B.5 — `<WebshopBanner>` rename + rebuild

**Sub-issue:** `4.B.5 · <WebshopBanner> rename + ink palette + single CTA`. `addBlockedBy 4.0`.

**Goal:** Replace `<WebshopSection>` with a new `<WebshopBanner>` per `webshopbanner-locked.md`.

**Files to create:**

- `apps/web/src/components/home/WebshopBanner/WebshopBanner.tsx`
- `apps/web/src/components/home/WebshopBanner/WebshopBanner.stories.tsx`
- `apps/web/src/components/home/WebshopBanner/index.ts`

**Files to delete (or move to _legacy/):**

- `apps/web/src/components/home/WebshopSection/`

**Files to retain (out of deletion scope):**

- `apps/web/public/images/jerseys.png` — retained in the repo for other surfaces. WebshopBanner does not import it; just remove the import in the legacy WebshopSection move.

**Implementation:**

1. Section background: solid `var(--ink)`. Tape strip on top with default jersey color (now contrasts cleanly against ink).
2. Meta line: "WEBSHOP · ONZE PARTNER" (mono uppercase, opacity 0.85, cream).
3. Headline: `<EditorialHeading>` italic with accent on "Trainingsgear".
4. Lead: "Trainingskledij, clubpakketten en personalisatie voor onze jeugd- en seniorenspelers."
5. CTA: cream paper button with ink text, jersey-deep shadow, "↗" indicator. `<Link>` to `EXTERNAL_LINKS.webshop` (existing constant). `target="_blank"` + `rel="noopener"`.
6. No image. No products.
7. Stories: Default + Mobile.

**Acceptance:**

- Renders per `webshopbanner-locked.md` spec.
- VR baselines.
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 4.B.6 — `<FeaturedEventBand>` NEW

**Sub-issue:** `4.B.6 · <FeaturedEventBand> new component (depends on warm-tape)`. `addBlockedBy 4.0`.

**Goal:** New component per `featuredeventband-locked.md`.

**Files to create:**

- `apps/web/src/components/home/FeaturedEventBand/FeaturedEventBand.tsx`
- `apps/web/src/components/home/FeaturedEventBand/FeaturedEventBand.stories.tsx`
- `apps/web/src/components/home/FeaturedEventBand/FeaturedEventBand.test.tsx`
- `apps/web/src/components/home/FeaturedEventBand/index.ts`

**Implementation:**

1. Server component. Props: `event: FeaturedEventStub | null`.
2. Drop-if-empty: `if (!event || !event.coverImage) return null;`.
3. Section background: `var(--jersey-deep)`.
4. Layout: CSS Grid `1fr 1.4fr`, gap 32px, padding 36px 28px, items-center.
5. Image column: `<TapedFigure aspect="landscape-16-9" rotation="a" tape={[{ color: "warm" }]}>` containing `<Image src={event.coverImage.url} fill alt={event.coverImage.alt} />`.
6. Text column: meta-line "AANSTAAND EVENEMENT", `<EditorialHeading>` for title with accent decorator, when-line `formatDateTime(dateStart, dateEnd)` + " · " + `event.location || "Kantine"`, CTA.
7. CTA: `event.externalLink?.label || "Meer info →"` linking to `event.externalLink?.url || /evenementen/${event.slug}`.
8. Mobile: grid collapses to single column. Image stays above text (no order reversal).
9. Date helper: extend `formatDateTime` to handle dateEnd range. If same day, show single date. If multi-day, show "10 mei – 12 mei" range.
10. Stories: Default (typical event), NoExternalLink (internal `/evenementen/{slug}` fallback CTA), MultiDay (dateStart + dateEnd), Empty (returns null).
11. Tests: assert returns null when event is null, when coverImage missing, when dateStart in the past.

**Acceptance:**

- Renders per `featuredeventband-locked.md`.
- Drop-if-empty works.
- VR baselines for all stories.
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 4.C.1 — Homepage carousel client component

**Sub-issue:** `4.C.1 · Homepage hero carousel (D.1 strip-below thumbnails)`. `addBlockedBy 4.0`.

**Goal:** Wrap `<EditorialHero placement="homepage">` in a client carousel per Round 1b D.1 lock.

**Files to create:**

- `apps/web/src/components/home/HomepageHeroCarousel/HomepageHeroCarousel.tsx` ("use client")
- `apps/web/src/components/home/HomepageHeroCarousel/HomepageHeroCarousel.stories.tsx`
- `apps/web/src/components/home/HomepageHeroCarousel/HomepageHeroCarousel.test.tsx`
- `apps/web/src/components/home/HomepageHeroCarousel/index.ts`

**Implementation:**

1. "use client" directive.
2. Props: `articles: HeroArticle[]` (typically 3, supports 1–3).
3. State: `activeIndex: number`, `paused: boolean`.
4. Auto-advance every 5s when not paused. `useEffect` with `setInterval`. Pause on hover, focus, or `prefers-reduced-motion: reduce`.
5. Active slide: `<EditorialHero placement="homepage" {...articles[activeIndex]} />`.
6. Strip below: 3 thumb buttons in a row. Active thumb: outlined `#f0c264`, opacity 1. Inactives: opacity 0.6. Each thumb is a `<button>` (a11y: aria-label "Toon artikel: {title}", aria-pressed when active).
7. Pause/play button + progress bar: monospace styling, sits with the strip.
8. Reduced-motion: drop transitions; auto-advance disabled; arrows still work.
9. Stories: Default (3 articles), TwoArticles (2 thumbs), SingleArticle (no carousel chrome), Paused (initial state).
10. Tests: arrow keys advance, click thumb jumps, pause toggles paused state, auto-advance interval.

**Acceptance:**

- Carousel renders, auto-advances, thumbs work.
- Reduced-motion fallback static.
- VR baselines on the active-slide states (rotation animation deliberately not VR-tested).
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 4.C.2 — Article query update

**Sub-issue:** `4.C.2 · ARTICLES_QUERY featured-first ordering`. `addBlockedBy 4.0`.

**Goal:** Update the homepage article fetch query to surface `featured: true` articles in the carousel.

**Files to modify:**

- `apps/web/src/lib/sanity/queries/articles.ts` (or wherever `ARTICLES_QUERY` lives)
- `apps/web/src/lib/sanity/sanity.types.ts` — regenerated via `sanity typegen` after the query change.
- Tests in `apps/web/src/lib/effect/services/repositories/article.repository.test.ts`.

**Implementation:**

1. Change `order(publishedAt desc)` to `order(featured desc, publishedAt desc)`.
2. Run `pnpm --filter @kcvv/studio typegen` to regenerate types.
3. Verify Effect Schema decodes against the new shape (no schema change since `featured` was already included in the projection).
4. Tests: assert flagged articles surface first, fallback to recency when fewer than 3 are flagged.

**Acceptance:**

- Query updated; types regenerated; tests pass.
- No regression in NewsGrid (it now receives slice [3..8] = articles 3..7 of the ordered list).
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 4.D.1 — Homepage page.tsx integration

**Sub-issue:** `4.D.1 · Homepage page.tsx new section ordering + legacy drop`. `addBlockedBy 4.B.1, 4.B.2, 4.B.3, 4.B.4, 4.B.5, 4.B.6, 4.C.1, 4.C.2`.

**Goal:** Re-wire the homepage to compose all new sections per the IA lock.

**Files to modify:**

- `apps/web/src/app/(landing)/page.tsx` — main integration.
- `apps/web/src/app/(landing)/loading.tsx` — skeleton matches new sections.
- `apps/web/src/components/home/index.ts` — barrel export updates.

**Files to delete or move to `_legacy/`:**

- `apps/web/src/components/home/FeaturedArticles/`
- `apps/web/src/components/home/MatchWidget/` (already deleted in 4.B.2)
- `apps/web/src/components/home/MatchesSliderSection/` (already deleted in 4.B.2)
- `apps/web/src/components/home/WebshopSection/` (already deleted in 4.B.5)

Move (not delete) into a `_legacy/` directory for blame trace; deletion happens in Phase 9 cleanup.

**Implementation:**

1. New section ordering:
   ```text
   <HomepageHeroCarousel articles={featuredArticles} />
   <FeaturedEventBand event={featuredEvent} />
   <BannerSlot a />
   <NewsGrid articles={newsGridArticles} />
   <UpcomingMatches matches={matches} />
   <BannerSlot b />
   <YouthBlock />
   <WebshopBanner />
   <BannerSlot c />
   <SponsorsBlock />
   ```
2. Data fetches:
   - Articles: existing fetch, ordering now `featured desc, publishedAt desc`. Slice `[0..3]` for hero, `[3..8]` for grid.
   - Featured event: existing `EventRepository.findNextFeatured()` (no change).
   - Matches: existing `getNextMatches()` (no change).
   - Banners: existing fetch (unchanged).
   - Sponsors: existing fetch (unchanged).
3. Drop imports for `FeaturedArticles`, `MatchWidget`, `MatchesSliderSection`, `WebshopSection`.
4. Delete the old `youthSection` `bg: "kcvv-green-dark"` SectionConfig — `<YouthBlock>` self-contains its background now.
5. Skeleton (`loading.tsx`) matches new section heights.
6. Section-stack handling: bannerSlots remain optional refs on `homePage`. Each drop-if-empty.

**Acceptance:**

- Homepage renders the full new composition end-to-end.
- Legacy components moved (not deleted) to `_legacy/`.
- Playwright e2e `homepage.spec.ts` updated for new section ordering.
- `pnpm --filter @kcvv/web check-all` green.
- Manual smoke test: load `/` in dev server, verify all sections render, hover all interactive elements.

---

## Task 4.D.2 — Pages/Homepage Storybook + e2e

**Sub-issue:** `4.D.2 · Pages/Homepage Storybook story + Playwright e2e update`. `addBlockedBy 4.D.1`.

**Goal:** Storybook coverage for the assembled homepage + e2e regression.

**Files to modify:**

- `apps/web/src/app/(landing)/page.stories.tsx` (or create — Storybook can mount full pages).
- `apps/web/e2e/homepage.spec.ts` — Playwright spec.

**Implementation:**

1. Storybook Pages/Homepage story with realistic mock data covering: full data, sparse NewsGrid, no FeaturedEventBand, no UpcomingMatches, no SponsorsBlock.
2. NOT vr-tagged (per Phase 0.5 decision; VR is at component level only).
3. Playwright e2e:
   - Section ordering: hero carousel first, then event band (when present), then NewsGrid…
   - Carousel auto-advances + thumb click works.
   - UpcomingMatches expand button works.
   - Sponsors logos hover transitions through colour.
4. Run `pnpm --filter @kcvv/web e2e` to verify.

**Acceptance:**

- Pages/Homepage story loads cleanly.
- Playwright e2e green.
- `pnpm --filter @kcvv/web check-all` green.

---

## Definition of done — overall

- All 12 sub-issues closed.
- All VR baselines committed in their respective sub-issue PRs.
- `pnpm --filter @kcvv/web check-all` green on `main` after final merge.
- Storybook `Pages/Homepage` reviewable.
- Playwright e2e `homepage.spec.ts` green.
- Owner review of `/` on staging (e2e build).
- CodeRabbit feedback addressed.
- Issue #1526 closed with sign-off comment linking each section's `*-locked.md` file.
- Master design `§5.1 Homepage` section updated to reflect locked composition (this happens during the final close-out of issue #1526).

---

## §15 — Sub-issue creation recipes

After PRD lock, run from inside the worktree:

```bash
# 4.0 Tracer
gh issue create \
  --title "feat(ui): redesign phase 4.0 — <TapeStrip color=\"warm\"> primitive variant" \
  --body "$(cat <<'EOF'
> Phase 4 tracer per PRD `docs/prd/redesign-phase-4.md` §3.

Lands the warm-tape variant + Storybook + VR baseline. Unblocks 4.B.6 and any future jersey-deep surface.

## Scope

- `--tape-warm: rgba(240, 194, 100, 0.85)` token in `apps/web/src/app/globals.css`
- `<TapeStrip>` color prop union extended to include "warm"
- `<TapedFigure>` tape[].color enum extended
- `TapeStrip.stories.tsx` adds `WarmOnJerseyDeep` story
- VR baseline captured

## Acceptance

- [ ] Token added (append-only, --tape-jersey preserved)
- [ ] TapeStrip + TapedFigure prop unions extended
- [ ] WarmOnJerseyDeep story
- [ ] VR baseline committed
- [ ] check-all green
EOF
)" \
  --label "redesign,ready,tracer-bullet" \
  --milestone "redesign-retro-terrace-fanzine"
```

Repeat similarly for 4.A.1, 4.B.1–6, 4.C.1–2, 4.D.1–2. Each issue body lists files-to-modify + acceptance bullets sourced from this plan.

After all issues exist, wire `addBlockedBy` via the GraphQL mutation:

```bash
# Get issue node IDs
PARENT_ID=$(gh api graphql -f query='query { repository(owner:"soniCaH", name:"www.kcvvelewijt.be") { issue(number: 1526) { id } } }' --jq '.data.repository.issue.id')

# Per child, add blockedBy edges per the dependency graph in PRD §4
# (use the addBlockedBy mutation; NEVER addSubIssue per feedback_blockedby_not_subissues memory)
```

A scripted version lives at `scripts/phase-4-issues.sh` (created in 4.0 PR).
