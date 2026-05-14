# Redesign — Phase 4.5: Homepage refinement

> **Master design reference:** `docs/plans/2026-04-27-redesign-master-design.md`
> **Phase 4.5 audit + decisions log:** `docs/plans/2026-05-13-phase-4.5-refinement-audit.md`
> **Design brief (locked rounds):** `docs/design/mockups/phase-4-homepage/` — 11 `*-locked.md` files covering R1 through R10 (all locked 2026-05-13 / 2026-05-14)
> **Interface contract:** `docs/design/articles-query-interface.md` (ARTICLES_QUERY projection shape)
> **Tracking issue:** [#1745](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1745)
> **Milestone:** `redesign-retro-terrace-fanzine`
> **Epic:** KCVV Elewijt redesign — retro-terrace fanzine aesthetic
> **Predecessor:** [#1526](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1526) — Phase 4 (homepage rebuild)
> **Blocks:** Phase 5+ (article-detail / player / match rebuild) — none structurally, but Phase 4.5's data-projection extension and photo-treatment tokens are reused by downstream phases.
> **Owner:** @climacon
> **Estimate:** ~1.5–2 weeks (design exploration ✅ done · 1 week implementation · 0.5 week VR baselines + analytics rename)

---

## 1. Problem statement

Phase 4 shipped the homepage rebuild in May 2026 — new section ordering, retro-fanzine chrome, EditorialHero shell, FeaturedEventBand, rebuilt NewsGrid (1+4 asymmetric), renamed UpcomingMatches, palette-swapped Youth + Webshop, homepage-variant SponsorsBlock. The result functions correctly but, on review against the original retro-terrace-fanzine source mockups, the owner identified that several locked Phase 4 decisions had drifted from the visual brief during implementation. Notable gaps:

1. **Hero is a rotating carousel that takes too much space, jumps in height between slides, and feels like a UX regression.** Phase 4 Round 1 locked the carousel pattern but the in-production rendering does not feel like the marquee moment the source design implied.
2. **EditorialHero variant flourishes were never shipped.** `EditorialHero.tsx` still reads "Today every variant renders the same shell content" — #1638 closed without filling in the per-articleType artefacts (interview chips, transfer directional chip, event day-block, etc.). The source design relied on these flourishes to differentiate variants.
3. **NewsGrid's 1+4 layout duplicates editorial hierarchy that Uitgelicht would carry better.** No "Uitgelicht" section exists today; featured articles live inside the carousel only.
4. **NewsCard has nested paper frames** — an outer `<TapedCard>` plus an inner `<TapedFigure>` containing the image — which reads as "polaroid placed on a paper card" rather than the single-frame flush-edge photograph cards in the source image.
5. **Per-card backgrounds cycle by slot for paper-stamp rhythm**, but the source design assigns backgrounds by article type (transfer = jersey-deep, others = cream) to give the grid a semantic signal.
6. **The Brandsfit clubshop band ranks above sponsors**, but the source design demotes the partner shop and lets sponsors be the editorial close.
7. **Youth section is missing the diagonal stripe top frame** (a signature retro-fanzine flourish) and lacks a registration-funnel secondary CTA.
8. **Photo treatment is generic** — no tape-and-rotation "scrapbook polaroid" treatment, no consistent warm-tint filter / paper-grain overlay across the site's photographic content, no torn-edge tape variants.

Phase 4.5 closes these gaps. It does NOT rebuild Phase 4 from scratch; it patches the locked decisions that drifted, plus the photo-treatment tokens that should have shipped with Phase 0+1's primitive set but never did.

The refinement is a single deliverable: a homepage that visually matches the retro-terrace-fanzine source design closely enough that future article-detail / player / match work (Phase 5+) can reference it as the exemplar.

---

## 2. Scope

**Packages touched:** `apps/web` (primary). All work is `apps/web/src/components/home/*` + `apps/web/src/lib/repositories/article.repository.ts` (GROQ projection extension) + `apps/web/src/app/(landing)/page.tsx` (spine reorder + hero swap) + design-system token additions in `apps/web/src/app/globals.css` + primitive updates (`<TapeStrip>`, `<TapedFigure>`, `<NewsCard>`).

**Sanity migrations required:** **0.** All projection changes use existing schema fields (`articleType` enum, `subjects[]`, body block types). The 11 locked rounds explicitly preserved the original Phase 4 IA-lock "0 migrations" promise.

**In scope:**

- **ARTICLES_QUERY projection extension** — adds `articleType` + `subjects[]` + `firstTransferFact` + `firstEventFact` per the locked interface (`docs/design/articles-query-interface.md`). Drops the hardcoded `variant: "announcement"` fallback in `page.tsx`.
- **`<EditorialHero placement="homepage">` per-variant rendering** — fills in the per-articleType artefacts the shell has staged since Phase 3 (#1637, #1638). Interview: name-credit chips with 16px psdImage thumbnails (R1.5 IV.3). Announcement: clean cover, ported `category · date` kicker. Event: day-block overlay + EventStrip below the hero card (R1.5 EV.3). Transfer: directional dir-chip in kicker + grounded meta line `age · position · van otherClubName` (R1.5 TR.1', no jersey number on hero per `card-semantics-locked.md`).
- **Hero placement switch — single static + Uitgelicht 3-card row** — drops the `<HomepageHeroCarousel>` Phase 4 D.1 lock. Hero is one static `<EditorialHero>` rendering the top featured article. Below it, the new `<FeaturedUitgelichtRow>` renders positions 2..4 of the featured-ordered query (locked R1.B).
- **New `<FeaturedUitgelichtRow>` component** — 3 equal-sized featured cards on cream paper, larger than news-grid cards (display-md heading ~22px, optional 1-line dek, padding `lg`). Drop-if-empty per slot. (R1.6.A)
- **`<NewsCard>` flush-edge refactor** — drops the nested `<TapedFigure>` inside the card. Image fills the outer card's top region edge-to-edge; ink rule divides image from meta panel; tape strips move to the outer card's corners. (R10)
- **NewsGrid 3×2 geometry** — supersedes Phase 4 Round 5b's 1+4 asymmetric layout. Six chronological cards in a 3-column × 2-row grid. Slice changes from `articles[3..8]` (5 cards) to `articles[4..10]` (6 cards). (R2.B)
- **Per-articleType card backgrounds** — supersedes Phase 4 Round 5b's slot-deterministic background cycle. Background is determined by `article.articleType`: `transfer → jersey-deep`, `interview / announcement / event → cream`. Slot-deterministic rotation + tape colour cycle preserved. (R3.B)
- **Spine reorder — clubshop AFTER sponsors** — supersedes Phase 4 Round 4 "Sponsors stays the commercial close". `<SponsorsBlock>` becomes the editorial close on cream; `<ClubshopBanner>` (renamed from `<WebshopBanner>`) is the final dark band before footer. BannerSlot c moves up to sit between Youth and Sponsors. (R4.B)
- **`<YouthSection>` updates** — adds a `<StripedSeam>` band at the top of the section (jersey-deep + jersey-light alternating, ~28px tall). Adds a second CTA `Schrijf je in →` alongside the existing `Ontdek onze jeugd →`. Shifts the EditorialHeading italic+warm-accent emphasis from "De toekomst" to "Elewijt" per brief §8. (R5.B)
- **`<ClubshopBanner>` — renamed from `<WebshopBanner>`** — mirrored `<StripedSeam>` top + bottom (jersey-dark + jersey-deep alternating). New copy: "Onze clubkledij." italic-emphasis heading + "Beschikbaar via Brandsfit, onze kledingpartner." subheading + "Naar de Brandsfit clubshop ↗" single CTA. Small `<JerseyShirt>` illustration corner-anchored top-right. Drops the generic "Webshop · onze partner" eyebrow. Analytics events renamed (`webshop_banner_*` → `clubshop_banner_*`). (R4 + R6.C)
- **Photo treatment system tokens** — adds `--color-tape-cream` token (3rd tape colour), `--filter-photo-newsprint` warm-tint CSS filter, `--pattern-paper-grain` overlay (~4% opacity, multiply blend), `--shadow-photo-tape` asymmetric shadow (2px right / 4px down), and Variant A layered hover (card press-down + photo lift). (R9 — torn-edge variant and 2-strip cycle dropped at implementation; see lock doc.)
- **`<HomepageHeroCarousel>` retirement** — moves to `apps/web/src/components/home/_legacy/` for blame trace per the Phase 4 `_legacy/` convention. Deletion deferred to a future cleanup phase.
- **`<NewsCard>` callers across the site** — `NewsGrid`, `RelatedContentSection` on article detail, the `/nieuws` archive, the `/jeugd` news section. Phase 4.5 ships the flush-edge refactor across all callers (single-pass), not just NewsGrid. (Implementer to confirm caller list at PR time.)
- **CLAUDE.md update** — `apps/web/CLAUDE.md` "Implemented Routes" section unchanged; the design-system "Redesign primitives" subsection adds the new tape edge, photo filter, and grain tokens.

**Out of scope:**

- **Sanity schema migrations.** R7 (stripe meta-panel accent) was dropped specifically to avoid a schema migration. No new article fields, no `subcategory` enum, no `editorialPhoto` ref.
- **Full-bleed editorial photo band (R8).** `<FeaturedEventBand>` (Phase 4) already covers the editorial-breather role between Uitgelicht and NewsGrid. No new band component.
- **Horizontal stripe meta-panel accent (R7).** Dropped wholesale — the differentiation read as too subtle to justify the schema or tagging work.
- **Article-detail page rebuild.** Phase 5+ scope. The detail-page `InterviewHero` / `TransferHero` / `EventHero` / `AnnouncementHero` legacy components stay as they ship today (pre-redesign tokens); a future phase ports them to retro-fanzine vocabulary.
- **NewsCard display variants (event ticket stub / transfer jersey-stamp / column pull-quote).** R10b explored these and the owner rejected the typographic compositions — they need imagery to shine, deferred to a future phase. All Phase 4.5 cards always render a photo.
- **Match preview / match recap article types (#1470).** Open issue, marked "nice to have", no committed milestone. The Phase 4.5 query projection is forward-compatible (new article types just need extra optional `firstMatchPreviewFact` / `firstMatchRecapFact` fields when #1470 lands) but doesn't ship those today.
- **Phase 3 chrome surfaces** (`<SiteHeader>`, `<MatchStrip>`, `<SiteFooter>`). Audit items C1–C3 explicitly noted these as out of scope for Phase 4.5.
- **`/nieuws` archive page redesign.** `<NewsCard>` ships its flush-edge structure on the archive page (single-pass refactor), but the archive page's filters, pagination, and overall layout stay Phase 4 state.
- **PSD or BFF changes.** All work is Sanity + web app.

---

## 3. Tracer bullet

The thinnest cross-layer slice that proves Phase 4.5 architecture works:

> **Extend `ARTICLES_QUERY` projection per `docs/design/articles-query-interface.md`, wire homepage hero to use the real `article.articleType` instead of the hardcoded `"announcement"`, and verify all five existing callers (`page.tsx`, `nieuws`, `jeugd`, `sponsors`, `events`) keep type-checking.**

Demonstrated by:

- `apps/web/src/lib/repositories/article.repository.ts` `ARTICLES_QUERY` extended to project `articleType`, `subjects[]` (full per-kind dispatch), `firstTransferFact`, `firstEventFact`.
- `apps/web/src/lib/repositories/article.repository.ts` `ArticleVM` type updated to include the four new optional fields.
- `npx sanity@latest typegen generate` re-run; emitted types align with the new shape; no manual type fudging needed.
- `apps/web/src/app/(landing)/page.tsx` `toHeroCarouselArticle` (or its successor) reads `article.articleType ?? "announcement"` instead of the hardcoded literal. Hero displays the correct variant prop for the top article (even though the EditorialHero shell still renders a uniform layout — per-variant artefacts ship in Phase 2 below).
- All four other call sites (`nieuws`, `jeugd`, `sponsors`, `events`) keep working — they receive the new optional fields and ignore them. No TypeScript errors. No runtime errors.
- `pnpm --filter @kcvv/web check-all` green.
- VR baselines for `<Pages/Homepage>` and `<EditorialHero>` regenerated if any visual changes leak through (none expected from the tracer — visual changes start in Phase 2).

If the tracer passes, the rest of Phase 4.5 can fan out into parallel implementation tracks (tokens → components → integration). If the tracer fails (e.g. typegen emits something unexpected, or a non-homepage caller breaks), the whole phase is blocked until the data layer is sound.

---

## 4. Phases

```text
4.5.0  #1746  TRACER · ARTICLES_QUERY projection + hero variant wiring
   ↓
   ├── 4.5.A — Tokens track (parallel after tracer)
   │     4.5.A.1  #1747  Photo treatment system tokens (R9) — TapeStrip edge prop,
   │                     --color-tape-cream, --filter-photo-newsprint,
   │                     --pattern-paper-grain, --shadow-photo-tape, layered hover
   │
   ├── 4.5.B — Components track (parallel after 4.5.A)
   │     4.5.B.1  #1748  <NewsCard> flush-edge refactor (R10) — drop nested
   │                     TapedFigure, image flush, tape on outer card corners
   │     4.5.B.2  #1749  <EditorialHero> per-variant rendering (R1.5 hybrid) —
   │                     interview / announcement / event / transfer flourishes
   │     4.5.B.3  #1750  <FeaturedUitgelichtRow> new component (R1.6.A) —
   │                     3 equal-sized featured cards above NewsGrid
   │     4.5.B.4  #1751  NewsGrid 3×2 + per-articleType bg (R2.B + R3.B) —
   │                     supersedes locked 1+4; consumes new NewsCard (B.1)
   │     4.5.B.5  #1752  <YouthSection> updates (R5.B) — StripedSeam top +
   │                     dual CTA + headline emphasis shift
   │     4.5.B.6  #1753  <ClubshopBanner> rename + composition (R6.C) — mirrored
   │                     stripes, JerseyShirt, new copy, analytics events renamed
   │
   ├── 4.5.C — Integration (after all 4.5.B)
   │     4.5.C.1  #1754  page.tsx spine reorder (R4.B) + HomepageHeroCarousel
   │                     retirement to _legacy/
   │
   └── 4.5.D — Cleanup
         4.5.D.1  #1755  CLAUDE.md update (Phase 4.5 IA + photo tokens) +
                         plan-doc audit cleanup
```

All blockedBy relationships wired via GraphQL `addBlockedBy` mutations (17 total). `ready` label applied to all 10 implementation issues; `tracer-bullet` additionally on #1746. Parent #1745 is the umbrella tracker (no `ready` label, not Ralph-picked).

**Dependency edges (`addBlockedBy` GraphQL mutations):**

- All 4.5.A / 4.5.B sub-issues blocked by `4.5.0` (tracer must pass first).
- `4.5.B.1` (NewsCard flush-edge) blocked by `4.5.A.1` (consumes asymmetric photo-shadow token and layered hover).
- `4.5.B.4` (NewsGrid + per-type bg) blocked by `4.5.B.1` (consumes new NewsCard structure).
- `4.5.B.3` (FeaturedUitgelichtRow) blocked by `4.5.B.1` (likely reuses NewsCard primitive at larger scale).
- `4.5.B.2` (EditorialHero per-variant) blocked by `4.5.0` only — uses its own composition, not NewsCard.
- `4.5.B.5` (YouthSection) and `4.5.B.6` (ClubshopBanner) blocked by `4.5.0` only — independent of the card track.
- `4.5.C.1` (page.tsx integration) blocked by ALL 4.5.B sub-issues.
- `4.5.D.1` (cleanup) blocked by `4.5.C.1`.

Per `feedback_blockedby_not_subissues` memory, dependencies use the GitHub GraphQL `addBlockedBy` mutation — never `addSubIssue`. Per `feedback_inherit_milestone_on_spinout`, every new issue copies the parent's milestone (`redesign-retro-terrace-fanzine`).

---

## 5. Acceptance criteria per sub-issue

### 5.5.0 — Tracer: ARTICLES_QUERY projection + hero variant wiring

- [ ] `ARTICLES_QUERY` in `apps/web/src/lib/repositories/article.repository.ts` extended exactly per §5 of `docs/design/articles-query-interface.md`. Includes `articleType`, `subjects[]` (full per-kind dispatch — player / staff / custom), `firstTransferFact`, `firstEventFact`.
- [ ] `ArticleVM` Pick/Omit list includes the four new fields. Manual overrides (title/slug/featured/tags) preserved.
- [ ] `npx sanity@latest typegen generate` re-run; `apps/web/src/lib/sanity/sanity.types.ts` regenerated; no `any` or `unknown` leaks in the emitted types for the new fields.
- [ ] `apps/web/src/app/(landing)/page.tsx:64-76` `toHeroCarouselArticle` reads `article.articleType ?? "announcement"` for the `variant` prop instead of the hardcoded literal.
- [ ] Manual check: open the homepage locally with an article whose `articleType` is `interview` at the top of `order(featured desc, publishedAt desc)`. Confirm the EditorialHero receives `variant="interview"` via React DevTools (shell still renders uniform content — per-variant artefacts ship in 5.5.B.2).
- [ ] All four non-homepage call sites compile clean: `apps/web/src/app/(landing)/nieuws/page.tsx`, `jeugd/page.tsx`, `sponsors/page.tsx`, `events/page.tsx`.
- [ ] `pnpm --filter @kcvv/web check-all` passes.
- [ ] No new Sanity schema files in the diff.

### 5.5.A.1 — Photo treatment system tokens (R9)

- [ ] ~~`<TapeStrip>` extended with `edge: "clean" | "torn"` prop.~~ **Dropped at implementation (#1747)** — both polygon and feathered-mask implementations read wrong at design review. Clean rectangular tape stays canonical. See `photo-treatment-system-locked.md` "Revisions during implementation".
- [ ] ~~Four canonical torn-edge SVG masks shipped as `--tape-edge-{1,2,3,4}`.~~ **Dropped at implementation (#1747).**
- [ ] New token `--color-tape-cream: rgb(232 224 200 / 0.85)` in `apps/web/src/app/globals.css`.
- [ ] New CSS variable `--filter-photo-newsprint: sepia(0.06) saturate(0.94) hue-rotate(-4deg) contrast(1.02) brightness(1.01)`.
- [ ] New token `--pattern-paper-grain: url("data:image/svg+xml,…")` — inline-encoded SVG `<feTurbulence>` noise. Default opacity 0.04, blend mode `multiply`.
- [ ] New tokens `--shadow-photo-tape: 2px 4px 0 0 var(--color-ink)` and `--shadow-photo-tape-lift: 4px 8px 0 0 var(--color-ink)`.
- [ ] ~~`<TapedFigure>` extended to accept up to 2 strips with independent colour / rotation per strip.~~ **Reduced to 1 at implementation (#1747)** — type signature hard-caps at a single `TapeStripProps`.
- [ ] `<TapedFigure>` images receive `filter: var(--filter-photo-newsprint)` via CSS.
- [ ] `<TapedFigure>` containers receive `::after` paper-grain overlay.
- [ ] Layered hover Variant A: card press-down (`translate(1px, 1px) shadow→none`) + photo independent `translate(0, -2px)`. Tape strips anchored to card frame.
- [ ] Storybook stories cover: `<TapedFigure>` with grain + filter on/off (opt-out via `tint="none"`); hover state captured in a separate story per `feedback_state_coverage_stories`.
- [ ] VR baselines regenerated for all `<TapeStrip>` and `<TapedFigure>` stories.
- [ ] Foundation MDX (`Colors.mdx`, `Patterns.mdx`, `SpacingAndIcons.mdx`) updated for new tokens per `apps/web/CLAUDE.md` "When to update Foundation MDX".

### 5.5.B.1 — `<NewsCard>` flush-edge refactor (R10)

- [ ] `<NewsCard>` no longer renders an inner `<TapedFigure>`. Image fills the outer `<TapedCard>`'s top region edge-to-edge.
- [ ] Outer `<TapedCard>` switches to `padding="none"` (new prop value) for the top + sides; meta panel section receives its own internal padding.
- [ ] Meta panel section has `border-top: 1px solid var(--color-ink)` separating image from text.
- [ ] Tape strips move from inner figure to outer card top-left + top-right corners, consuming slot index for deterministic colour cycle.
- [ ] All existing `<NewsCard>` callers compile clean: `<NewsGrid>`, `<RelatedContentSection>`, `/nieuws` archive page, `/jeugd` news section.
- [ ] Storybook stories regenerated: per articleType, per slot, per bg variant. Existing `aspectRatio` + `rotation` props preserved.
- [ ] VR baselines regenerated.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### 5.5.B.2 — `<EditorialHero>` per-variant rendering (R1.5 hybrid)

- [ ] `EditorialHero.tsx:8` "Today every variant renders the same shell content" comment removed; variant-specific rendering now ships.
- [ ] **Interview variant:** kicker meta segment `#${jerseyNumber} · ${POSITION}` populated when N=1 player subject and the fields are present (port `buildKickerParts` logic from `InterviewHero`). Below the H1: credit-chip row with one chip per subject, each carrying a 16px `psdImage` thumbnail + name. Falls back to a coloured initial-block when no `psdImage` URL is available.
- [ ] **Announcement variant:** kicker `${category} · ${date}`. Clean 16:9 landscape `<TapedFigure>` cover. No overlays. Byline retained.
- [ ] **Event variant:** kicker `Event | ${ageGroup || competitionTag}` (port `EventHero` kicker logic). H1 only — no venue strip inside the H1+lead column. Day-block overlay on photo lower-left (`ZA 27/4`-style mono stamp, cream-on-cream, rotated -2°, paper-shadow). Compressed `<EventStrip>` rendered BELOW the hero card (inside the click target): single horizontal row `▸ ${location} · ${dutchDate} · ${startTime}–${endTime}` with 1px ink rule top + bottom.
- [ ] **Transfer variant:** kicker `Transfer | ${dirChip} · ${date}` where `dirChip` is a jersey-filled inline chip with the arrow glyph + label (`↓ Inkomend` / `↑ Uitgaand` / `↻ Verlengd`). H1: `transferFact.playerName` italic-serif. Meta line below H1, graceful-omit per missing optional field: `${age} jaar · ${position} · van ${otherClubName}` (incoming), `… naar …` (outgoing), `… verlengd tot ${until}` (extension). No pull-quote on homepage hero. No jersey number.
- [ ] All variants share: 50/50 grid, `<EditorialHeading level={1} size="display-xl">` italic serif with optional accent decorator, `<EditorialLead>`, `<EditorialByline>`, "Lees verder →" link. Right column: single landscape `<TapedFigure>` (3:2 or 16:9 per variant) — landscape only per the `I1` constraint in the audit.
- [ ] Existing `placement: "detail" | "homepage"` discriminated union unchanged. `placement="homepage"` wraps the shell in a `<Link>` to `/nieuws/${slug}` per the existing pattern.
- [ ] Storybook stories per variant + per placement; subjects N=1/N=2/N=3 cases for interview; incoming/outgoing/extension for transfer; with/without optional fields for graceful-omit.
- [ ] VR baselines per variant + per scenario.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### 5.5.B.3 — `<FeaturedUitgelichtRow>` new component (R1.6.A)

- [ ] New component at `apps/web/src/components/home/FeaturedUitgelichtRow/`. Exported from the home barrel.
- [ ] Props: `articles: ArticleVM[]` (0..3 elements; N=0 returns null).
- [ ] Layout: 3 equal-width cards on cream paper, in a single row at desktop. Mobile collapses to 1-column stack.
- [ ] Per-card sizing: padding `lg`, `<EditorialHeading level={3} size="display-md">` (~22px italic serif), 16:9 `<TapedFigure>` cover, optional 1-line `<EditorialLead>` dek (graceful-omit when `article.lead` is empty), `Lees verder →` mono-uppercase footer pinned to card bottom.
- [ ] Section header: `<EditorialHeading level={2}>` "Uitgelicht." with italic emphasis on "gelicht" + period. No `Alle berichten →` right-link (that lives on the news grid below).
- [ ] Per-articleType backgrounds per R3.B (transfer → jersey-deep, others → cream). Use the new `BG_BY_TYPE` lookup from `card-semantics-locked.md`.
- [ ] Drop-if-empty graceful behaviour for fewer-than-3 featured articles.
- [ ] Storybook stories: N=3 (full), N=2, N=1, N=0 (returns null).
- [ ] VR baselines for the visible states.

### 5.5.B.4 — NewsGrid 3×2 + per-articleType backgrounds (R2.B + R3.B)

- [ ] `<NewsGrid>` geometry changes from the locked Phase 4 Round 5b 1+4 asymmetric layout to a flat 3-column × 2-row grid. `grid-template-columns: repeat(3, 1fr)`. No lead-spanning row; no asymmetric supporting cluster.
- [ ] Slice changes from `articles[3..8]` (5 cards) to `articles[4..10]` (6 cards). Callers: `apps/web/src/app/(landing)/page.tsx` `toHomepageArticles` invocation (or its successor) passes the new slice.
- [ ] `SLOT_BGS` array (`NewsGrid.tsx:33-40`) deleted. Replaced with `BG_BY_TYPE: Record<ArticleType, NewsCardBg>` lookup: `transfer → "jersey-deep"`, `interview / announcement / event → "cream"`. `<NewsCard>` `bg` prop set from this lookup at the call site, defaulting to `"cream"` for legacy untyped articles.
- [ ] `SLOT_ROTATIONS` extends to 6 entries (`a / b / c / d / a / b`). Tape colour per slot continues to cycle deterministically.
- [ ] Mobile (<640px): single column stack of 6 cards. Same composition; full-width.
- [ ] All 6 cards render the flush-edge structure from 5.5.B.1.
- [ ] Storybook stories: balanced grid (1 transfer · 2 interviews · 1 event · 2 announcements), transfer-heavy stress (4 transfers · 2 others), all-interview (mono-type stress), N=0 (returns null).
- [ ] VR baselines for each scenario.

### 5.5.B.5 — `<YouthSection>` updates (R5.B)

- [ ] `<StripedSeam>` rendered at the top of the youth section, full-bleed, jersey-deep + jersey-light alternating, ~28px tall, ink borders top + bottom. Path: implementation places it as the first child inside `<YouthSection>` (per the "path 1" recommendation in `youth-revisit-locked.md`).
- [ ] `<EditorialHeading>` `emphasis` prop changes from `{ text: "De toekomst", tone: "warm" }` to `{ text: "Elewijt", tone: "warm" }`.
- [ ] Second CTA added next to the existing `Ontdek onze jeugd →`: `<LinkButton variant="inverted" withArrow>Schrijf je in</LinkButton>` pointing to `/jeugd#inschrijven` (anchor URL is an open follow-up — see §7).
- [ ] CTAs render in a flex row with gap; mobile stacks vertically.
- [ ] Eyebrow `Word jeugdspeler`, body copy, inline stats `220+ spelers · 16 ploegen` unchanged.
- [ ] Storybook stories: default state, with-stripe-band state, narrow viewport stack.
- [ ] VR baselines regenerated.
- [ ] `<StripedSeam>` primitive extended IF it doesn't already support a configurable height + the jersey-light colour stop (additive prop changes, not parallel primitive).

### 5.5.B.6 — `<ClubshopBanner>` rename + composition (R6.C)

- [ ] File rename: `apps/web/src/components/home/WebshopBanner/` → `apps/web/src/components/home/ClubshopBanner/`. Export `ClubshopBanner`. Update barrel `apps/web/src/components/home/index.ts`.
- [ ] Section background unchanged (`bg-jersey-deep-dark`).
- [ ] Mirrored `<StripedSeam>` at TOP and BOTTOM of the section. Bottom seam flips the diagonal angle from -45° to +45° to mirror the top.
- [ ] Eyebrow `Webshop · onze partner` deleted.
- [ ] `<EditorialHeading>` text becomes `Onze clubkledij.` with `emphasis={{ text: "clubkledij", tone: "warm" }}`.
- [ ] Subheading: `Beschikbaar via Brandsfit, onze kledingpartner.`
- [ ] CTA label becomes `Naar de Brandsfit clubshop` with `↗` external glyph.
- [ ] `<JerseyShirt>` rendered top-right of the inner container, `~140px` wide, `aria-hidden="true"`, z-index behind heading. Hidden at mobile width (<640px).
- [ ] Analytics events renamed: `webshop_banner_impression` → `clubshop_banner_impression`; `webshop_banner_cta_click` → `clubshop_banner_cta_click`. `EXTERNAL_LINKS.webshop` → `EXTERNAL_LINKS.brandsfit` (or keep `webshop` if the URL constant is shared and rename feels disruptive — implementer to decide).
- [ ] GTM trigger / GA4 custom-dimension list updated for the renamed events. PR body documents the analytics taxonomy change per `feedback_analytics_prd_requirement`.
- [ ] Storybook stories: default, with `<StripedSeam>` mirroring visible, narrow viewport (illustration hidden), no-illustration fallback.
- [ ] VR baselines regenerated.

### 5.5.C.1 — page.tsx spine reorder + HomepageHeroCarousel retirement (R4.B)

- [ ] `apps/web/src/app/(landing)/page.tsx` section composition changes to:

  ```text
  EditorialHero (static, top featured article)
    → FeaturedUitgelichtRow (positions 2..4 of featured-ordered query)
    → FeaturedEventBand (existing, drop-if-empty)
    → BannerSlot a
    → NewsGrid (3×2 · articles[4..10])
    → UpcomingMatches
    → BannerSlot b
    → YouthSection
    → BannerSlot c                  (moved up from after Webshop)
    → SponsorsSection
    → ClubshopBanner                (moved down from after Youth)
  ```

- [ ] `<HomepageHeroCarousel>` no longer imported. Component files moved to `apps/web/src/components/home/_legacy/` per the Phase 4 `_legacy/` convention. Storybook stories for the legacy component switch to `parameters: { vr: { disable: true } }` with the required annotation block per `apps/web/CLAUDE.md` per-story escape hatch convention.
- [ ] `toHeroCarouselArticle` mapper retired or replaced; the new static-hero call site consumes `ArticleVM` directly (or via a thin `toEditorialHeroProps(article)` helper — implementer's call).
- [ ] `SectionStack` `reserveFooterSafeArea` re-evaluated: with `<ClubshopBanner>` (jersey-deep-dark full-bleed) as the last section before the footer, the safe-area-padding flag may need to flip back from `false` to `true`. Verify visually.
- [ ] Playwright e2e for `/` (`apps/web/test/e2e/home.test.ts`) passes — page renders 200, `<h1>` present, no console.error, no broken images.
- [ ] `Pages/Homepage` Storybook story rebuilt to reflect the new composition. Not vr-tagged (per Phase 4 / Phase 0.5 page-level testing rework convention — Playwright covers the page-level smoke).
- [ ] PR body's `## VR baselines` section enumerates every regenerated baseline with a one-line rationale per `apps/web/CLAUDE.md` requesting-VR-baselines convention.

### 5.5.D.1 — CLAUDE.md update + plan-doc audit cleanup

- [ ] `apps/web/CLAUDE.md` "Implemented Routes" section unchanged.
- [ ] `apps/web/CLAUDE.md` "Redesign primitives" subsection adds Phase 4.5 additions: new `<TapeStrip edge>` prop, `--color-tape-cream`, `--filter-photo-newsprint`, `--pattern-paper-grain`, `--shadow-photo-tape`, `<TapedFigure>` multi-strip support, layered hover Variant A.
- [ ] `docs/plans/2026-05-13-phase-4.5-refinement-audit.md` final decisions log audited — confirm every locked round is reflected in shipped code. Update the round table to `Implemented` per row.
- [ ] If any open follow-up from the audit (§F) resolved during implementation (Brandsfit prominence tier, registration URL), update the entry in-place.
- [ ] `docs/design/mockups/phase-4-homepage/*-locked.md` files audited — every "Implementation note" item that ended up being decided differently at PR time gets noted in the lock file as a post-implementation amendment.

---

## 6. Effect Schema / api-contract changes

**None.** Phase 4.5 is `apps/web`-only.

- `apps/api` (Cloudflare Worker BFF) unchanged.
- `packages/api-contract` unchanged. No HttpApiGroup endpoints added, modified, or removed.
- `packages/sanity-schemas` unchanged. No schema migrations.

The only data-layer change is `apps/web/src/lib/repositories/article.repository.ts` `ARTICLES_QUERY` projection extension — a GROQ change, not a schema change. New TypeScript types flow from `npx sanity@latest typegen generate`; no manual `Schema` definitions are added.

The interface contract for the GROQ projection lives at `docs/design/articles-query-interface.md` and is locked at Option A (fat single shape). Implementer to follow that contract verbatim.

---

## 7. Open questions

These are NOT blockers to writing the PRD. List of what is genuinely unknown — resolve in-PR or as separate issues:

- [ ] **Brandsfit partnership prominence tier.** Owner accepted the demotion of the clubshop band (R4.B) as their editorial call but didn't explicitly check with Brandsfit. If the partnership agreement specified an "above the fold" or "mid-page" tier, the R4.B spine reorder may need to revert. **Resolves:** owner confirmation with Brandsfit before 5.5.C.1 lands.
- [ ] **Youth secondary CTA registration URL.** R5.B locked `<LinkButton href="/jeugd#inschrijven">Schrijf je in</LinkButton>` as the secondary CTA, but the actual registration target might be `/inschrijven`, `/jeugd/inschrijven`, or an external form URL. **Resolves:** owner specifies at PR time for 5.5.B.5.
- [ ] **`<StripedSeam>` primitive API.** R5 + R6 both consume `<StripedSeam>`. Confirm the existing primitive (Phase 0) ships configurable height + colour-stop props. If not, extend additively as part of 5.5.A.1 or 5.5.B.5 (whichever lands first). **Resolves:** implementer audit at the top of 5.5.A.1.
- [ ] **`<NewsCard>` flush-edge refactor blast radius.** The refactor affects `<NewsGrid>`, `<RelatedContentSection>`, `/nieuws` archive page, `/jeugd` news section. Confirm the visual regression on archive/jeugd is acceptable (cards there may currently look slightly different). **Resolves:** VR baselines in 5.5.B.1 PR; if regressions look wrong on archive/jeugd, defer that surface to a follow-up.
- [ ] **`--filter-photo-newsprint` value tuning.** The R9 lock proposed concrete values (`sepia(0.06) saturate(0.94) hue-rotate(-4deg) contrast(1.02) brightness(1.01)`). These need real-photo validation at hero scale — if the warm tint reads wrong on action shots (green pitch turning swampy, jerseys looking dated in a bad way), dial back at PR time. **Resolves:** implementer judgment in 5.5.A.1 PR review.
- [x] ~~**Torn-edge tape geometry at small scale.**~~ **Resolved (#1747):** torn-edge variant dropped entirely at implementation. Both polygon clip-path and feathered alpha-mask approaches read wrong at design review. Clean rectangular tape is the only variant.
- [ ] **Display variants for image-less cards (future phase).** Per `feedback_display_variants_need_imagery`, if a future round revisits cards without photos, the variants must incorporate imagery (illustrations, photo collages, jersey graphics), not pure typography. Phase 4.5 doesn't address this — all cards always render the article's `coverImage`. **Resolves:** future phase scope decision, not Phase 4.5.
- [ ] **`/nieuws`, `/jeugd`, `/sponsors`, `/events` projection adoption.** The new `ARTICLES_QUERY` projection adds optional fields the non-homepage pages don't need today. If those pages later want per-articleType card backgrounds (R3.B applied off-homepage), they'd consume the same projection. **Resolves:** out of Phase 4.5 scope; revisit when off-homepage adoption is desired.
- [ ] **Subject portrait image sizing in projection.** Detail-page query uses `?w=600`; homepage R1.5 IV.3 only needs ~16px thumbs. Worth `?w=64` for the homepage variant to reduce payload, OR keep `?w=600` for parity with detail use? **Resolves:** implementer judgment in 5.5.0 or 5.5.B.2 PR review.

---

## 8. Discovered unknowns (filled during implementation)

_Empty at PRD authoring time. During Ralph loop, append entries here when implementation surfaces something unexpected._

```text
- [date] Discovered: [what was found] → [action taken: new issue #N / PRD updated / resolved inline]
```
