# Redesign — Phase 4: Homepage rebuild

> **Master design reference:** `docs/plans/2026-04-27-redesign-master-design.md`
> **Design brief:** `docs/design/mockups/phase-4-homepage/` (10 rounds + sub-rounds, all locked 2026-05-07)
> **Tracking issue:** [#1526](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1526)
> **Implementation plan:** `docs/plans/2026-05-07-redesign-phase-4-plan.md` _(authored after this PRD)_
> **Milestone:** `redesign-retro-terrace-fanzine`
> **Epic:** KCVV Elewijt redesign — retro-terrace fanzine aesthetic
> **Predecessor:** [#1525](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1525) — Phase 3 (Tier C figures + EditorialHero + chrome)
> **Blocks:** Phase 5 (article-detail rebuild), Phase 6 (player profiles + match detail), Phase 7 (landings) — all later phases consume the homepage's components on other surfaces
> **Owner:** _you_
> **Estimate:** ~3 weeks (1 week design exploration ✅ done · 1.5 weeks implementation · 0.5 week migration / VR baselines)

---

## 1. Problem statement

The homepage today is a stack of legacy components (`<FeaturedArticles>` rotating carousel, hardcoded `<MatchWidget>`, `<MatchesSlider>`, `<NewsGrid>` with embedded event card, `<YouthSection>`, static `<WebshopSection>`, `<SponsorsBlock>`) that all predate the retro-terrace-fanzine redesign. With Phase 3 chrome merged (`<SiteHeader>` + `<MatchStrip>` + `<SiteFooter>` + `<EditorialHero>`), the homepage body is the most visible surface still on legacy aesthetics.

Three problems are open today:

1. **Body sections render as legacy components.** `<FeaturedArticles>` is a rotating carousel with no visual identity tied to the redesign. `<NewsGrid>` mixes events into the article grid, breaking the "events are calendar items, news is editorial" distinction. `<MatchWidget>` + `<MatchesSlider>` duplicate work that the new chrome `<MatchStrip>` already covers (next-match peek). `<YouthSection>` works but is on the legacy palette. `<WebshopSection>` is a static photo with no editorial register. `<SponsorsBlock>` shows tier hierarchy that doesn't match the redesign's flat-grid aesthetic.

2. **Editorial workflow is invisible to editors.** Today's hero just slices the 3 most-recent articles — no editorial control over which articles surface as the homepage lead. There's no way to flag a story as "this is the lead this week."

3. **The featured event hides inside the news grid.** Events tagged `featuredOnHome` render as a special card inside `<NewsGrid>`, where they compete visually with article cards. The event-vs-article hierarchy is muddled.

Without Phase 4, the redesign chrome (header / matchstrip / footer / hero) frames a homepage body that's still on legacy register. Phase 5+ blocks until the homepage exemplar exists.

---

## 2. Scope

**Packages touched:** `apps/web` (primary). `apps/web/src/components/home/*` is essentially rewritten. One Phase 0/1 primitive update (`<TapeStrip>` warm variant). No Sanity schema migrations.

**In scope:**

- **`<EditorialHero placement="homepage">`** — already shipped in Phase 3 (#1637, #1638). Phase 4 wires it into the homepage and ships the **D.1 carousel + strip-below thumbnails** behaviour: 3 articles auto-rotating with all 3 thumbs visible below, slot-deterministic rotation cycle, `article.featured` boolean source. **New "use client" component** for the rotation state.
- **`<FeaturedEventBand>`** — NEW component. Jersey-deep band between hero and NewsGrid. Image-left (TapedFigure with warm-yellow tape variant) + text-right + CTA. Drop-if-empty. Driven by `event.featuredOnHome`.
- **`<NewsGrid>`** — rebuilt. 1 lead + 4 supporting · 50/50 split · 2×2 supporting cluster · all `landscape-16-9` aspect · slot-index rotation cycle (matches Phase 1 `<TapedCardGrid>`). Sparse states E.1 (graceful collapse). Receives `articles.slice(3, 8)` (5 articles, was 6). Featured event slot removed (now lives in FeaturedEventBand).
- **`<NewsCard>`** — primitive update. Adds `aspectRatio` and `rotation` props per locked NewsGrid spec. Storybook + VR for new variants. `landscape-16-9 / square / portrait-3-4` ship; `text-only` deferred (no clear data trigger; coverImage is required).
- **`<UpcomingMatches>`** — RENAMED from `<ScheduleStandingsBlock>`. Schedule-only block (standings dropped per Round 6a); 5 chronological matches default + inline-expand-to-all (use client) + `/kalender` link visible only when expanded. Replaces today's `<MatchWidget>` + `<MatchesSlider>`.
- **`<YouthBlock>`** — palette swap on the existing `<YouthSection>` + `<YouthBackdrop>`. Keep blurred-photo backdrop pattern; change overlay tokens from kcvv-green-dark to jersey-deep. Update typography to retro vocabulary (`<EditorialHeading>` with accent decorator). Photo asset stays as `/images/youth-trainers.jpg`.
- **`<WebshopBanner>`** — RENAMED from `<WebshopStrip>`. Single-purpose ink-palette banner pointing to external supplier. No specific products. Editorial copy + single CTA. Ink (not jersey-deep) to avoid adjacency conflict with YouthBlock.
- **`<SponsorsBlock>`** — homepage variant. Single equal grid (no tier-size hierarchy on `/`); cream-soft tile per logo (M.3 — no border, no shadow, no rotation, just a subtle tone shift); greyscale-default + colour-on-hover. `/sponsors` link at the bottom.
- **`<TapeStrip>`** — primitive update. Adds `color="warm"` variant for use on jersey-deep sections (cream/yellow tape contrast).
- **Homepage `page.tsx` integration** — re-wire `apps/web/src/app/(landing)/page.tsx` to compose the new section ordering: Hero → FeaturedEventBand → bannerSlotA → NewsGrid → UpcomingMatches → bannerSlotB → YouthBlock → WebshopBanner → bannerSlotC → SponsorsBlock. Drop `<FeaturedArticles>`, `<MatchWidget>`, `<MatchesSlider>`, `<WebshopSection>` legacy components.

**Out of scope:**

- **Article detail page** (Phase 5).
- **Player profiles, match detail, team detail, kalender, events list / detail** (Phase 6).
- **Sponsors page** (Phase 7).
- **Sanity schema migrations.** No new fields needed — `article.featured` and `event.featuredOnHome` already exist.
- **`<PosterWordmark>`** — explicitly retired in Phase 3 PRD §2; `<SiteFooter>` H3 wordmark plays the closing-band role.
- **Standings on the homepage.** Round 6a dropped them — too incoherent to pair with all-team schedule. Standings live on `/ranking` only (unchanged).
- **`<NewsCard>` text-only aspect variant.** Article schema requires `coverImage`; no natural data trigger. Master design's 4th aspect variant deferred to a future phase if a use case appears.
- **WebshopBanner imagery.** Owner explicitly preferred solid-colour version; `/images/jerseys.png` is not used in the new banner.
- **YouthBlock photo replacement.** Existing `/images/youth-trainers.jpg` stays. New photo curation is a future ticket.

---

## 3. Tracer bullet

The thinnest cross-layer slice that proves the Phase 4 architecture works:

> **Land `<TapeStrip color="warm">` variant + Storybook story + VR baseline.**

The warm-tape variant is the only new primitive Phase 4 introduces, and it cuts across multiple sub-issues (`<FeaturedEventBand>` requires it; future jersey-deep surfaces will reuse it). Demonstrated by:
- `<TapeStrip>` extended `color` union to include `"warm"`.
- `--tape-warm: rgba(240, 194, 100, 0.85)` token added to `globals.css`.
- `TapeStrip.stories.tsx` adds a story group `WarmOnJerseyDeep` showing the new variant against a jersey-deep panel.
- VR baseline captured.
- `pnpm --filter @kcvv/web check-all` green.

If the tracer fails, every Phase 4 sub-issue depending on the warm tape (`<FeaturedEventBand>`, future jersey-deep surfaces) is at risk. If it passes, the four tracks below can fan out.

---

## 4. Sub-issues — children of #1526

```text
4.0   #TBA  — Tracer bullet · <TapeStrip color="warm"> primitive variant
   ↓
   ├── 4.A — Primitives track (parallel after 4.0)
   │     4.A.1  #TBA  <NewsCard> aspectRatio + rotation props
   │
   ├── 4.B — Section components track (parallel after 4.A.1)
   │     4.B.1  #TBA  <NewsGrid> rebuild (1+4 · 50/50 geometry)
   │     4.B.2  #TBA  <UpcomingMatches> renamed + schedule-depth + expand
   │     4.B.3  #TBA  <SponsorsBlock> homepage variant (single grid · M.3 tiles)
   │     4.B.4  #TBA  <YouthBlock> palette swap on existing <YouthSection>/<YouthBackdrop>
   │     4.B.5  #TBA  <WebshopBanner> renamed + ink palette
   │     4.B.6  #TBA  <FeaturedEventBand> NEW component (depends on 4.0 warm tape)
   │
   ├── 4.C — EditorialHero homepage placement track (after 4.B.* ready)
   │     4.C.1  #TBA  Carousel client component (D.1 strip-below thumbnails) wraps <EditorialHero placement="homepage">
   │     4.C.2  #TBA  Article query update — `order(featured desc, publishedAt desc)`; fallback to most-recent if < 3 flagged
   │
   └── 4.D — Homepage page.tsx integration (final, after all 4.B/4.C merged)
         4.D.1  #TBA  Compose new section ordering; drop legacy components
         4.D.2  #TBA  Pages/Homepage Storybook story rebuild
```

**Dependency edges (`addBlockedBy` GraphQL mutations):**

- All 4.A / 4.B sub-issues blocked by `4.0` (tracer must pass first)
- `4.B.6` (FeaturedEventBand) explicitly blocked by `4.0` (consumes warm-tape variant)
- `4.B.1` (NewsGrid) blocked by `4.A.1` (consumes new NewsCard props)
- `4.C.1` (carousel client component) blocked by `4.B.*` design completeness (no specific component dep)
- `4.D.1` (page.tsx integration) blocked by ALL 4.B + 4.C sub-issues
- `4.D.2` (Storybook) blocked by `4.D.1`

Per `feedback_blockedby_not_subissues` memory, dependencies use GraphQL `addBlockedBy` mutation — never `addSubIssue`.

---

## 5. Acceptance criteria per sub-issue

### 5.0 Tracer (`<TapeStrip color="warm">` end-to-end)

- `<TapeStrip>` `color` prop accepts `"warm"` in addition to existing values.
- Token `--tape-warm: rgba(240, 194, 100, 0.85)` added to `apps/web/src/app/globals.css`.
- `TapeStrip.stories.tsx` adds a `WarmOnJerseyDeep` story showing the variant against a jersey-deep panel.
- VR baseline captured.
- `pnpm --filter @kcvv/web check-all` green.

### 5.A.1 — `<NewsCard>` props update

- New `aspectRatio` prop: `"landscape-16-9" | "square" | "portrait-3-4"`. Default `"landscape-16-9"`.
- New `rotation` prop: `"a" | "b" | "c" | "d" | "none"`. Default `"none"`.
- Storybook stories per aspect variant + per rotation.
- VR baselines for each new story.
- No regression on existing NewsCard usages.

### 5.B.1 — `<NewsGrid>` rebuild

- Implements the 1 lead + 4 supporting layout (50/50 split, 2×2 supporting cluster).
- Receives `articles: Article[]` (1–5 elements). N=0 returns null.
- Geometry adapts per N per Round 5f E.1 lock (sparse states).
- All cards render with `aspectRatio="landscape-16-9"` (Round 5c C.1).
- Slot-index rotation cycle: `[a, b, c, d, a]` (Round 5d T.1).
- Featured event prop removed (now in FeaturedEventBand).
- Articles slice changes to `[3..8]` (5 articles, was 6).
- Mobile collapse: 1+2+2 (Round 5b D mobile spec).
- Stories: Default5, Sparse4, Sparse3, Sparse2, Sparse1, Empty.

### 5.B.2 — `<UpcomingMatches>` (renamed)

- Renamed from `<ScheduleStandingsBlock>`. Component file moves; references to old name purged.
- Default render: 5 chronological matches across all KCVV teams.
- "Toon alle X wedstrijden ↓" inline expand button when `totalUpcoming > 5`. Uses "use client" for state.
- When expanded: renders all upcoming + "Volledige kalender →" link to `/kalender`.
- `/kalender` link hidden in collapsed state.
- KCVV team-name highlighted (font-weight: 700) when team_id === 1235 on either side.
- Each row links to `/match/{id}`.
- Empty state (0 upcoming): return null.

### 5.B.3 — `<SponsorsBlock>` (homepage variant)

- Filter: `tier in ["hoofdsponsor", "sponsor"] && active === true`. Order: hoofdsponsors first.
- Single equal grid (5 cols desktop, 3 tablet, 2 mobile).
- Per-logo treatment: cream-soft tile, no border, no shadow, no rotation (Round 7c M.3).
- Greyscale-default, colour-on-hover via CSS `filter: grayscale(100%)` + transition. Respect `prefers-reduced-motion`.
- "Alle sponsors & sympathisanten →" link to `/sponsors` at section bottom.
- Empty state: return null.

### 5.B.4 — `<YouthBlock>` palette swap

- Existing `<YouthSection>` + `<YouthBackdrop>` retained. Token swap only.
- Backdrop gradient: `kcvv-green-dark/90 → 75 → 50` becomes `jersey-deep/88 → 65 → 92` (per Round 8b N.2).
- Typography migrates to `<EditorialHeading>` italic with accent decorator on "De toekomst".
- Stats (220+ spelers · 16 ploegen) hardcoded.
- CTA stays "Ontdek onze jeugd →" (current copy).

### 5.B.5 — `<WebshopBanner>` (renamed)

- Renamed from `<WebshopStrip>`. Component file moves.
- Section background: solid `var(--ink)` (not jersey-deep — per F.1 lock to avoid adjacency conflict).
- Top tape strip: full-width jersey-tape green (-0.5° rotation).
- Editorial copy: `Trainingsgear bestel je rechtstreeks bij onze partner.` (with accent on "Trainingsgear").
- Single CTA: "Naar de webshop ↗" → `EXTERNAL_LINKS.webshop` (existing constant).
- No image. No products. No editor input.

### 5.B.6 — `<FeaturedEventBand>` NEW

- Server component. Returns null if no future event with `featuredOnHome === true && coverImage`.
- Section background: `var(--jersey-deep)`.
- Layout: image left 1fr (TapedFigure with `tape="warm"`) + text right 1.4fr.
- Text fields: meta line "AANSTAAND EVENEMENT", `<EditorialHeading>` for title with accent decorator, when-line (`formatDateTime(dateStart, dateEnd)` + location fallback "Kantine"), CTA.
- CTA: `event.externalLink.label || "Meer info →"` → `event.externalLink.url || /evenementen/{slug}`.
- Mobile: stacks image-above-text.

### 5.C.1 — Homepage carousel client component

- "Use client" wrapper around `<EditorialHero placement="homepage">` rendering 3 articles (slice 0..3).
- Strip-below thumbnails (Round 1b D.1): all 3 thumbs in a row beneath the active hero. Active outlined `#f0c264` jersey-yellow, inactives at 60% opacity. Click jumps the carousel.
- Auto-rotate every 5s. Pause on hover or focus.
- Pause/play button + progress bar (existing FeaturedArticles UX, retro chrome reskin).
- Reduced-motion: drop transitions; static initial slide; arrow keys still work.

### 5.C.2 — Article query update

- `ARTICLES_QUERY` order changes from `order(publishedAt desc)` to `order(featured desc, publishedAt desc)`.
- Slot 0..2 fill the carousel (S.2 hero source per Round 2). Slot 3..7 fill NewsGrid.
- Fewer than 3 flagged → fallback uses most-recent (current behaviour for slots not flagged).

### 5.D.1 — Homepage `page.tsx` integration

- New section order:
  ```text
  EditorialHero D.1 → FeaturedEventBand → bannerSlotA → NewsGrid → UpcomingMatches → bannerSlotB → YouthBlock → WebshopBanner → bannerSlotC → SponsorsBlock
  ```
- Drop imports + usages of `<FeaturedArticles>`, `<MatchWidget>`, `<MatchesSlider>`, `<WebshopSection>`. Move legacy components to `apps/web/src/components/home/_legacy/` for blame trace; delete in Phase 9 cleanup.
- All three bannerSlots retained (BS.1 lock); each drop-if-empty.

### 5.D.2 — Pages/Homepage Storybook

- `Pages/Homepage` story rebuilt with full new composition. Not vr-tagged (per Phase 0.5 decision; Playwright e2e covers `/` smoke test).
- Includes empty states for FeaturedEventBand, NewsGrid sparse, UpcomingMatches empty, SponsorsBlock empty.

---

## 6. Data flow per section

| Section | Source | Filter / Sort | Empty state |
| --- | --- | --- | --- |
| EditorialHero D.1 carousel | Sanity `article` | `order(featured desc, publishedAt desc)`, slice [0..3] | Hide if 0; render 1 / 2 thumbs if 1–2 |
| FeaturedEventBand | Sanity `event` | `featuredOnHome && dateStart >= now()`, sort dateStart asc, take 1 | Return null |
| NewsGrid | Sanity `article` | Same query as carousel, slice [3..8] | Return null at N=0; graceful collapse 1–4 |
| UpcomingMatches | BFF `getNextMatches()` | sort date asc, all KCVV teams | Return null at 0 |
| YouthBlock | Hardcoded | n/a | n/a |
| WebshopBanner | Hardcoded | n/a | n/a |
| SponsorsBlock | Sanity `sponsor` | `tier in ['hoofdsponsor','sponsor'] && active`, hoofdsponsors first | Return null |
| Banner slots A/B/C | Sanity `homePage.bannerSlot[A/B/C]` ref | n/a | Each drop-if-empty |

No new schema fields. `article.featured` and `event.featuredOnHome` already exist. Query change for hero ordering is the only data-side change.

---

## 7. VR baseline contract

Per `docs/prd/visual-regression-testing.md` §12, every new `UI/<Name>` story and modified `Layout/<Component>` story commits baselines in the same PR.

Phase 4 baselines:

- **Tracer:** `UI/TapeStrip/WarmOnJerseyDeep`.
- **NewsCard variants:** `Article/NewsCard/Default`, `Article/NewsCard/Lead`, `Article/NewsCard/SquareAspect`, `Article/NewsCard/PortraitAspect`.
- **NewsGrid sparse states:** `Home/NewsGrid/Default5`, `Home/NewsGrid/Sparse4`, `Home/NewsGrid/Sparse3`, `Home/NewsGrid/Sparse2`, `Home/NewsGrid/Sparse1`, `Home/NewsGrid/Empty`.
- **UpcomingMatches:** `Home/UpcomingMatches/Default5`, `Home/UpcomingMatches/ExactlyFive`, `Home/UpcomingMatches/SparseUnder5`, `Home/UpcomingMatches/Empty`.
- **SponsorsBlock:** `Home/SponsorsBlock/Default`, `Home/SponsorsBlock/HoofdsponsorsOnly`, `Home/SponsorsBlock/SponsorsOnly`, `Home/SponsorsBlock/Empty`, `Home/SponsorsBlock/MissingLogos`.
- **FeaturedEventBand:** `Home/FeaturedEventBand/Default`, `Home/FeaturedEventBand/NoExternalLink`, `Home/FeaturedEventBand/MultiDay`, `Home/FeaturedEventBand/Empty`.
- **YouthBlock:** `Home/YouthBlock/Default`, `Home/YouthBlock/Mobile`.
- **WebshopBanner:** `Home/WebshopBanner/Default`, `Home/WebshopBanner/Mobile`.
- **Pages/Homepage:** Storybook only, not VR-tagged (per Phase 0.5 decision; Playwright e2e covers `/`).

Per `feedback_vr_baseline_in_same_pr` memory: all baselines captured and committed in the same PR as the source diff. Per `feedback_vr_storybook_static_freshness`: rebuild storybook-static immediately before `vr:update`.

---

## 8. Analytics

Per `feedback_analytics_prd_requirement` memory, every new user-facing feature ships analytics events.

New events for Phase 4:

- **`hero_carousel_view`** — fires when carousel comes into viewport. Properties: `{ activeSlug }`.
- **`hero_carousel_advance`** — fires on auto-advance. Properties: `{ fromSlug, toSlug, slot }`.
- **`hero_carousel_thumb_click`** — fires when user clicks a thumb to jump. Properties: `{ targetSlug, fromSlot, toSlot }`.
- **`hero_carousel_pause`** — pause toggled. Properties: `{ paused: boolean }`.
- **`featured_event_click`** — fires on FeaturedEventBand CTA click. Properties: `{ eventSlug, externalLink: boolean }`.
- **`upcoming_matches_expand`** — fires when user clicks "Toon alle X wedstrijden". Properties: `{ totalCount }`.
- **`upcoming_matches_kalender_click`** — fires on "Volledige kalender →". Properties: `{ wasExpanded }`.
- **`webshop_banner_click`** — fires on WebshopBanner CTA. Properties: `{ source: "homepage" }`.
- **`sponsor_logo_click`** — fires when a sponsor tile is clicked. Properties: `{ sponsorId, tier, source: "homepage" }`.

GTM tags + GA4 reports updated in same PR.

---

## 9. Risks + mitigations

| Risk | Mitigation |
| --- | --- |
| Carousel "use client" component is the first non-server-rendered piece on `/` since Phase 3 | Lazy-mount; skeleton first paint matches first slide static; reduced-motion fallback static |
| `article.featured` flag drift (editors forget to flip off) | Phase 4 includes a Studio editor-ux guidance update on the article doc explaining the homepage hero behaviour |
| Two adjacent jersey-deep bands (YouthBlock + originally WebshopBanner) | Resolved at design time: WebshopBanner uses ink instead of jersey-deep |
| Green-on-green tape on FeaturedEventBand | Resolved at design time: warm-tape variant introduced |
| Mobile collapse complexity for 1+2+2 NewsGrid | Storybook viewport testing + explicit Mobile story; CSS Grid `auto-flow` handles graceful collapse |
| Featured event coverImage missing in editor data | Drop-if-empty rule treats missing coverImage same as no event |
| `getNextMatches()` might return 100s of upcoming matches | Inline expand reveals all but pagination not needed for KCVV's typical match volume; revisit if data exceeds ~30 matches |

---

## 10. Definition of done

- All sub-issues closed.
- All VR baselines committed.
- `pnpm --filter @kcvv/web check-all` green.
- Storybook `Pages/Homepage` reviewable.
- Playwright e2e `homepage.spec.ts` updated for new section ordering.
- Owner review of `/` on staging (e2e build).
- CodeRabbit feedback addressed.
- Issue #1526 closed with sign-off comment linking each section's `*-locked.md` file.

---

## 11. Concurrent feature work

Per master design §7 rules: concurrent PRs that touch a redesigned component must use the new primitives (no new code on retired patterns). Concurrent PRs on un-redesigned surfaces (player profiles, match detail, kalender, event detail) continue using legacy tokens — that's fine until Phase 6 picks them up.

Token additions (`--tape-warm`) are append-only — no token gets removed until Phase 9.

---

## 12. Locked design references

Source-of-truth specs for each section live in `docs/design/mockups/phase-4-homepage/`:

- `ia-locked.md` — homepage IA, section order, banner slots, palette rhythm
- `newsgrid-locked.md` — NewsGrid + NewsCard composition
- `upcoming-matches-locked.md` — UpcomingMatches (renamed from ScheduleStandingsBlock)
- `sponsorsblock-locked.md` — SponsorsBlock
- `youthblock-locked.md` — YouthBlock
- `webshopbanner-locked.md` — WebshopBanner (renamed from WebshopStrip)
- `featuredeventband-locked.md` — FeaturedEventBand (new)
- `round-*.html` — comparison HTMLs preserved for diff history

If implementation reveals a locked decision was wrong, halt the relevant sub-issue, re-enter the design checkpoint per master design §8.5, document the failure mode in the phase issue close-out comment.
