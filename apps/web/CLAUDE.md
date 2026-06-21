# apps/web — Next.js App

This is the KCVV Elewijt club website. See root `.claude/CLAUDE.md` for monorepo-wide rules.

## Implemented Routes

`/`, `/nieuws`, `/nieuws/[slug]`, `/spelers/[slug]`, `/ploegen`, `/ploegen/[slug]`, `/jeugd`, `/kalender`, `/wedstrijd/[matchId]`, `/events`, `/events/[slug]`, `/sponsors`, `/club/geschiedenis`, `/hulp`, `/zoeken`, `/privacy`

`/nieuws/[slug]` shipped its Phase 5 redesign (Phase 5: article detail) — see `docs/prd/redesign-phase-5-article-detail.md`.

### Feature → route map

Audit/spec generators sometimes flag features as "missing" because no top-level URL matches the obvious name. Cross-check this map before opening an issue:

| Feature                                 | Where it lives                             | Component                                             |
| --------------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| League table / standings / `klassement` | `/ploegen/[slug]` (team detail page)       | `src/components/team/TeamStandings/TeamStandings.tsx` |
| Match-day league table snapshot         | `/wedstrijd/[matchId]` (match detail page) | `src/components/team/TeamStandings/TeamStandings.tsx` |
| Per-team match list                     | `/ploegen/[slug]`                          | `src/components/team/TeamMatches/`                    |
| Club-wide calendar                      | `/kalender`                                | `src/app/(main)/kalender/`                            |

## Design System & Storybook (MANDATORY)

### When to update UI stories

- **New design system component** (`src/components/design-system/<Name>/`) → create `<Name>.stories.tsx` alongside with title `UI/<Name>`, add `tags: ["autodocs"]`, write a Playground + all variant stories. Also add to barrel `src/components/design-system/index.ts`.
- **New icon** added to `src/lib/icons.redesign.ts` (Phosphor Fill wrappers — the single icon source; Lucide was retired in #2154) → add a `fillWrapper` export there AND a `vi.mock` factory entry + import + wrappers-array row in `icons.redesign.test.tsx` (skipping the test sync makes `fillWrapper(undefined)` throw at module load → the whole file fails with 0 tests), and add it to the `Foundation/Spacing & Icons` icon grid in `src/stories/foundation/SpacingAndIcons.mdx`.
- **Existing component changed** (new variant, new prop) → update the corresponding story and test files.

### When to update Foundation MDX

- **New color token** in `src/app/globals.css` `@theme {}` → add a swatch to `src/stories/foundation/Colors.mdx`.
- **New font/type token** → add to `src/stories/foundation/Typography.mdx`.
- **New spacing / breakpoint / shadow token** → add to `src/stories/foundation/SpacingAndIcons.mdx`.

### Story authoring rules

- **Handlers:** use `fn()` from `storybook/test` in `meta.args`, never `argTypes: { prop: { action: "..." } }`.
- **Story type:** `StoryObj<typeof meta>`, not `StoryObj<typeof ComponentName>`.
- **No non-null assertions** on fixture lookups — use `?? fallback` so the story never crashes at import time.
- **Non-serialisable props** (e.g. `Set<string>`): define a `StoryArgs` type override with a serialisable equivalent and convert in a named render helper. No `as unknown as` casts in `args`.

### Storybook navigation structure (MANDATORY)

Use these top-level groups — enforced by `storySort` in `.storybook/preview.ts`:

| Group         | What goes here                                                                                                                                                                                       | title prefix         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `Foundation/` | Design tokens only — Colors, Typography, Spacing, Icons (MDX docs, no component stories)                                                                                                             | `Foundation/`        |
| `UI/`         | Pure design system primitives with zero domain knowledge — could ship as a standalone package                                                                                                        | `UI/`                |
| `Features/`   | Domain components that require KCVV data types (Articles, Calendar, Club, Contact, Editorial, Events, Forms, Home, Hulp, Jeugd, Matches, Organigram, Players, Search, Share, Sponsors, Staff, Teams) | `Features/<Domain>/` |
| `Layout/`     | Page infrastructure — PageHeader, PageFooter                                                                                                                                                         | `Layout/`            |
| `Pages/`      | Full-page compositions                                                                                                                                                                               | `Pages/`             |

**Rule:** If a new component knows about `MatchResult`, `Player`, `Sponsor`, or any other KCVV domain type → it goes in `Features/<Domain>/`. If it's a generic primitive → `UI/`. Never nest domain components directly at the top level.

### MDX table gotcha

MDX 2 (Storybook 10) does **not** parse GFM pipe-table syntax (`| col |`) without `remark-gfm`. Always use native HTML `<table>` elements in `.mdx` files.

### Redesign primitives (Phase 0+)

Phase 0 of the editorial-redesign series ("retro-terrace fanzine") added the following design-system primitives. They live alongside legacy components per the dual-coexistence policy. See `docs/plans/2026-04-27-redesign-master-design.md` for the design language audit and `docs/prd/redesign-phase-0.md` for token + primitive specs.

- `<TapeStrip>` — diagonal washi-tape graphic for card corners.
- `<StripedSeam>` — SVG-backed diagonal barber-pole horizontal section divider.
- `<DottedDivider>`, `<DashedDivider>` — thin row dividers (interview Q&A, table rows).
- `<QuoteMark>` — two stacked italic open-quote glyphs.
- `<HighlighterStroke>` — hand-drawn marker underline beneath italic emphasis. Phase 1 added a `color: 'jersey' | 'jersey-deep' | 'ink' | 'cream'` prop (default `jersey`); previously fixed jersey green. Single-line CSS-bg SVG; multi-line wrapping is the deferred follow-up tracked in `docs/prd/redesign-phase-1.md` §11.1.
- `<MonoLabel>` — tracked uppercase pill or plain label. Pill variants gained vertical padding in Phase 1 to read as proper badges.

A new `Foundation/Patterns` MDX story documents `--pattern-jersey-stripes`, `--pattern-jersey-stripes-tight`, and `--pattern-seam`. The cream/ink/jersey colour, fluid display/body/mono typography, layout container, rotation pool, paper-shadow, and motion tokens added in Phase 0 are visible in `Foundation/Colors`, `Foundation/Typography`, and `Foundation/Spacing & Icons` MDX. The `--rotate-tape-*` pool was retuned in Phase 1 from the original master-design values to a sub-degree range (`-0.5°` / `-0.25°` / `0.25°` / `0.5°`) after `<TapedCardGrid>` rendered "seasick" on real card grids — see `docs/prd/redesign-phase-1.md` §11.5.

**Phase 1 additions (Tier B composition primitives):**

- `<TapedCard>` — paper-card wrapper with rotation/tape/shadow/bg/padding props plus opt-in `interactive` hover tilt. Always renders a `border-2 border-ink` outline alongside the offset shadow.
- `<TapedCardGrid>` — auto-rotation grid that distributes the 4-rotation pool across slots via per-slot `--taped-card-rotation` and `--tape-left` / `--tape-rotation` CSS custom properties. Accepts an `emptyState` fallback prop.
- `<TapedFigure>` — editorial photo + caption primitive. Caller supplies the image element via `children` (works with `next/image`, plain `<img>`, `<SanityImage>`, etc.); aspect-ratio is enforced by the frame.
- `<MonoLabelRow>` — inline row of `<MonoLabel>` items with a configurable divider glyph. The default `·` divider is rendered as a CSS circle so it centres optically against uppercase labels.
- `<EditorialHeading>` — period-terminated heading with two mutually-exclusive emphasis modes: **accent** (italic + jersey-deep colour, default) or **marker** (italic + `<HighlighterStroke>`, opt-in via `emphasis.highlight=true`).
- `<PullQuote>` — taped quote block (`<TapedCard>` + heavy `<QuoteMark>` glyph + italic display body + attribution row). Three tones (cream / ink / jersey). Emphasis applies a `<HighlighterStroke>` only — body font stays italic.
- `<NumberDisplay>` — big serif number with optional prefix (`#` rendered in mono; other prefixes in italic Freight Display) / suffix / mono label.
- `<DropCapParagraph>` — lead paragraph with oversized first letter rendered via the W3C `initial-letter` CSS property (Chrome 110+ / Safari / Firefox 132+; graceful fallback on older browsers).

`<SectionHeader>` was reworked in Phase 1 to compose `<EditorialHeading>` + `<MonoLabelRow>`. The legacy `font-body!` / `font-black!` / `mb-0!` / green-left-border pattern is gone. CTA link no longer swaps colour on hover; instead a brand-jersey marker animates left-to-right under the link text.

`<Badge>` was retired in favour of `<MonoLabel variant="pill-…">`. The single consumer (`<MatchStatusBadge>`) was migrated to use MonoLabel pill variants directly.

**Phase 4.5 additions (homepage refinement series):**

- `<TapeStrip>` — added a `position: "left" | "right"` prop (anchors the strip on the host's top-left or top-right via `--tape-left` / `--tape-right`, both with a 12% fallback). Used by `<NewsCard>`'s R10 corner-pairing. The R9-locked `edge="torn"` variant was dropped at implementation (#1747) — `<TapeStrip>` ships clean-rectangular only and the `--tape-edge-{1..4}` / `--tape-mask-torn` tokens were never committed.
- `<TapedFigure>` — photo-treatment primitive. The newsprint filter + paper-grain overlay apply globally via `.taped-figure` / `.taped-figure__photo` CSS rules in `globals.css` (R9 photo-treatment system). Each instance accepts a single optional `tape?: TapeStripProps`; the R9-locked two-strip slot cycle was rejected at PR review and the prop is hard-capped at one. Pass `data-tint="none"` to opt out of the warm tint on non-photographic image content.
- `<EditorialHero>` — Phase 3 hero shell + R1.5 per-articleType variants (`announcement` / `interview` / `event` / `transfer`). Two `placement`s: `"detail"` (default — no link wrapper) and `"homepage"` (wrapped in `<Link>`, requires `slug`). Homepage placement adds a `hoverStyle?: "press" | "tilt-photo"` prop — `"press"` is the canonical paper-stamp press-down used by the (retired) `<HomepageHeroCarousel>`; `"tilt-photo"` lets only the cover `<TapedFigure>` tilt + scale on hover, used by the static `/` hero where a 2px translate on a full-width block reads as a twitch.
- `<FeaturedUitgelichtRow>` — R1.6.A equal-3-up featured row for the homepage spine. Drops itself when no featured articles are present and renders fewer cards rather than padding from the recent-articles pool.
- `<ClubshopBanner>` — renamed from `<WebshopBanner>` per R6.C. Jersey-deep-dark full-bleed band with mirrored `<StripedSeam>` top + bottom, the new copy ("Onze clubkledij." + Brandsfit attribution), and a small `<JerseyShirt>` flourish.
- `<JerseyShirt>` — new design-system primitive: paper-graphic jersey illustration (two-pass print, jersey-deep underprint + ink overprint, ink stripes; no Celtic green/white, no sponsors, no photo-realism) per `project_jersey_illustration_vocabulary`.
- `<HomepageHeroCarousel>` — retired and removed in Phase 9 cleanup (#1531). Replaced on `/` by a static `<EditorialHero placement="homepage" hoverStyle="tilt-photo">` + `<FeaturedUitgelichtRow>` per R1.B.

**New tokens (Phase 4.5, R9 photo-treatment system in `globals.css`):**

- `--color-tape-cream` — third tape colour (rgb(232 224 200 / 0.85)). Consumed by `<TapeStrip color="cream">` via inline `backgroundColor`.
- `--filter-photo-newsprint` — warm sepia/saturate/hue-rotate tint applied to `.taped-figure > .taped-figure__photo img` so editorial photos read as printed on paper.
- `--pattern-paper-grain` — fractal-noise SVG data-URL pattern overlaid on every `.taped-figure::after` at 4% opacity with `mix-blend-mode: multiply`.
- `--shadow-photo-tape` (`2px 4px 0 0 ink`) + `--shadow-photo-tape-lift` (`4px 8px 0 0 ink`) — asymmetric offset shadows for the photo-card system.

The R9-locked "layered hover Variant A" (photo `translateY(-2)` on parent `:hover`) was **retired in #1748** when R10 routed `<NewsCard>` hover through `<TapedCard interactive="press">` directly. The layered-lift idiom has no production consumers and the `--shadow-photo-tape-lift` token is intentionally orphaned for now in case a future surface re-introduces the model.

**Phase 5 additions (article-detail redesign — `/nieuws/[slug]`):**

- `<ArticleBody>` — Portable Text renderer for the article body; wires the per-block serializers below. Backs `/nieuws/[slug]`, `/club/[slug]`, and `/staf/[slug]` (the legacy `<SanityArticleBody>` it superseded has been removed).
- `<QARow>` — single Q&A row primitive (speaker avatar + question + answer body). Replaces the retired `<QaPairStandard>` / `<QaPairKey>` / `<QaPairQuote>` trio.
- `<QASection>` + `qaBlocksToTailSection` — groups trailing `groupAtTail`-tagged Q&A blocks into a single rapid-fire section under a tail-section header. Header composition locked to `<EditorialHeading size="display-xl" emphasis={{ text: "Q&A", highlight: true }}>` per `docs/design/mockups/phase-5-article-detail/tail-qa-header-locked.md` (#1874, supersedes the original `<MonoLabel>` from `interview-locked.md`).
- `<ArticleCredits>` — long-form credit panel (Door / Met / Beeld / Gepubliceerd) at article footer. Replaces the legacy `<InterviewCredits>`; cross-variant — renders whenever `author`, `photographer`, or `subjects[]` is populated. Schema additions: `article.author` + `article.photographer` (both optional strings).
- `<EventFactInline>` — inline factsheet for event-style facts inside article body.
- `<EventDetailBlock>` — event-variant hero-absorbed `eventFact`. On `event`-articleType articles, the FIRST `eventFact` in body is hoisted out and rendered as a polaroid card directly after `<ArticleBody>`; subsequent `eventFact`s render in-flow via `<EventFactInline>`.
- `<TransferFactCard>` + 2-up adjacency grouping — transfer-variant fact cards. Adjacent `transferFact` blocks render as a 2-up grid; isolated blocks render single-column.
- `<TapedFigure>` — Phase 5 extends its consumer set: `<ArticleBody>`'s `articleImage` serializer + Phase 5 hero variants.
- `<VideoBlock>` — responsive video (Vimeo / YouTube / uploaded) with width-aware framing.
- `<HtmlTableBlock>` — sanitised HTML table renderer for legacy embedded tables.
- Portable Text serializers — `qaBlock`, `eventFact`, `articleImage`, `videoBlock`, `fileAttachment`, `htmlTable`, `internalLink`, `link`, `blockquote`.
- `<DownloadButton>` — file attachment primitive with `card` and `chip` variants.
- `<EditorialHero>` — Phase 5 finalised the four `variant`s (`interview` / `announcement` / `transfer` / `event`); previously only stubbed.
- Schema additions in `@kcvv/sanity-schemas`: `articleImage.width` enum, `videoBlock.width` enum, `qaBlock.groupAtTail`, `article.author`, `article.photographer`.

**Phase 6.A additions (player-profile redesign — `/spelers/[slug]`):**

- `<PlayerHero>` (`apps/web/src/components/player/PlayerHero/`) — Phase 6.A hero band. Composes `<TapedFigure aspect="portrait-3-4" padding="none">` (photo state) OR the canonical `_jersey-paths.ts` illustration (fallback) per 6.d2; two-line name rhythm with the first name in upright Black display (`font-display-big font-black`) and the last name in italic display Regular with a period suffix per 6.d1; meta row age-graded per 6.d9 (adults render `DD·MM·YYYY`, minors render `<age> jaar · '<YY>`); `<NumberDisplay size="display-2xl" tone="jersey">` + inline ticket-stub composing `teamLabel · season`. No `<MonoLabel>NIEUW</MonoLabel>` — badge dropped at 6.d3. Page-level multi-team disambiguation: the consuming page resolves the active team via the `currentTeam` GROQ projection (first non-archived team that references the player, ordered alphabetically) and passes a single `teamLabel`; the component does not derive multi-team logic.
- `<BioBlock>` (`apps/web/src/components/player/BioBlock/`) — Phase 6.A bio section. Renders `player.bio` Portable Text via the article-body serializer pattern with a new `pullquote` PT decorator (added by tracer #1881) that dual-renders: marked spans render inline with `<HighlighterStroke>` AND the FIRST marked run is lifted into a right-column jersey-deep `<PullQuote>` card per 6.d5. Auto-hides on empty bio. Span-indexing shared with `<QuotesBlock>` via the utility at `apps/web/src/lib/portable-text/findPullquoteText.ts`.
- `<QuotesBlock>` (`apps/web/src/components/player/QuotesBlock/`) — Phase 6.A quote interlude. Renders the SECOND `pullquote`-marked run in `player.bio` as a single full-width `<PullQuote tone="ink">` card per 6.d8 (Variant C; the §5.3 ink+cream pair is rejected). Home for the dark-band aesthetic parked at 6.d4. Heading `In zijn eigen woorden.` with the `<HighlighterStroke>` marker on "woorden". Auto-hides when the bio has fewer than 2 marked runs.
- `<TapedFigure>` — new `padding?: "sm" | "none"` prop (default `"sm"` preserves the polaroid look used by Phase 5 article body + hero variants). `padding="none"` makes the photo bleed flush to the TapedCard's `border-2 border-ink` outline — used by `<PlayerHero>` so transparent-cutout PNGs don't appear to float against the cream backdrop.

**Phase 6.A — page-assembly primitives (`apps/web/src/components/analytics/`):**

- `<TrackInView>` — client wrapper that fires a single `trackEvent(eventName, params)` call the first time the wrapped subtree intersects the viewport at or above a `threshold` (clamped to `[0, 1]`, default `0.4`). Snapshots `params` at mount time so re-renders don't re-fire. SSR-safe; disconnects on unmount.
- `<PageViewTracker>` — client component that fires a single `trackEvent` on mount and renders nothing. Use for page-level `*_view` events that should fire on hydration regardless of scroll position.

**Phase 6.B additions (match-detail redesign — `/wedstrijd/[matchId]`):**

The legacy `<MatchDetailView>` (header + lineup + events in one component) and `<MatchHeader>` were retired (#1913); the page now composes a state-aware hero plus two auto-hiding sections at the page level.

- `<MatchHero>` (`apps/web/src/components/match/MatchHero/`) — state-aware match hero. Wraps a `<TapedCard>`; status drives the mono kicker (`VOORBESCHOUWING` for `scheduled`, `MATCHVERSLAG` for played/terminal states) and score display. Supersedes `<MatchHeader>`. Props: `homeTeam` / `awayTeam` (`MatchHeroTeam` = `{ name; logo?; score? }`), `date`, `time?`, `venue?`, `status`, `competition?`, `kcvvTeamLabel?`. The legacy `backUrl` back-link affordance was intentionally not carried over.
- `<MatchLineupSection>` (`apps/web/src/components/match/MatchLineupSection/`) — section wrapper around `<MatchLineup>` adding editorial chrome (mono kicker `OPSTELLINGEN` + display-md italic heading `Wie er stond.` + paper container). Owns its own render decision: returns `null` when both lineups are empty (typically upcoming matches).
- `<MatchEventsSection>` (`apps/web/src/components/match/MatchEventsSection/`) — section wrapper around `<MatchEvents>` with the same chrome pattern (kicker `WEDSTRIJDVERLOOP` + heading `Hoe het ging.`). Auto-hides (`null`) when `events` is empty.
- `<MatchStatusBadge>` — extended with a per-status spec table (`finished`/`forfeited`/`postponed`/`cancelled`/`stopped`) carrying abbreviation, long form, and tint class. The `cancelled` tint consumes the new `--color-card-red` token via `bg-card-red text-cream`.
- `<MatchTeaser>` / `<MatchResultRow>` — **retired (#2049).** Both were reskinned during Phase 6.B (MatchTeaser to the 6.B.d6 A2-italic ticket card, MatchResultRow to the 6.B.d7 result row) but ended Phase 6 with zero production consumers: `<MatchTeaser>`'s last consumer (`<CalendarMonth>`) switched to `<TeamAgendaRow>` in #1994, and `<MatchResultRow>`'s consumer (`<TeamSchedule>`) was retired in #1947. Upcoming matches now render via the homepage's inline `<MatchRow>` (`UpcomingMatchesClient.tsx`) and `<TeamAgendaRow>` (kalender + team pages); finished matches via `<TeamAgendaRow>`. The components, their stories/tests/VR baselines, the `MatchTeaserStatus` type, and the slider's match-card showcase stories were deleted.

New token: `--color-card-red` (`#c93f1c`) in `globals.css` — red-card / cancelled tint, consumed by `<MatchStatusBadge>`'s `cancelled` spec.

**Phase 6.C additions (team detail + listing redesign — `/ploegen` + `/ploegen/[slug]`):**

The legacy tabbed `<TeamDetail>` and its children `<TeamStandings>` / `<TeamSchedule>`, plus the listing's `<TeamFeaturedCard>` / `<YouthTeamsDirectory>`, were retired (#1947). Both team surfaces now compose page-level single-scroll sections. All new components live under `apps/web/src/components/team/`.

- `<TeamHero>` — category-forward detail hero (`A-ploeg.` / `U13.` from the team name); kicker, division/season MonoLabel pills, italic tagline lead; landscape `<TapedFigure>` newsprint photo or `<JerseyShirt>` fallback + dashed season stub.
- `<StandingsTable>` — classic retro standings; KCVV row tinted (`color-mix(jersey-deep 12%, cream)`) + jersey-deep left accent; no Vorm column; mobile drops `W·G·V`; auto-hides on empty.
- `<TeamAgendaRow>` + `<TeamMatchesSection>` — responsive match row (desktop symmetric scoreboard / mobile KCVV-centric column); outcome as a flat colour underline on the score (win jersey-deep / draw none / loss brick `--color-alert`); teaser = featured next match + recent rows + "Volledige kalender →". `"use client"` (imports ESM-only Phosphor icons).
- `<SquadGrid>` + `<PlayerCard>` — position-grouped squad (Doelmannen / Verdedigers / Middenvelders / Aanvallers + trailing "Spelers" catch-all); card = newsprint jersey-illustration vocabulary (`_jersey-paths.ts` / `<JerseyShirt>`) + jersey-deep number disc, links to `/spelers/[slug]`.
- `<TeamStaff>` — compact centred staff cards; round newsprint photo or jersey-deep monogram; `resolveFunctionLabel` maps PSD codes (T1→Hoofdtrainer, …) with role-bucket fallback.
- `<TeamEditorial>` — body / trainingSchedule / contactInfo blocks, each auto-hiding; reuses the 6.A `pullquote` decorator for a "Het verhaal" pull-quote. Schema delta: `pullquote` decorator added to `team.body` marks (no migration).
- `<TeamFlagship>` — listing A+B paired mirrored flagships (A jersey-deep content-left/photo-right; B cream mirrored). `<YouthDirectory>` — Bovenbouw/Middenbouw/Onderbouw age-code cards. `<TeamSectionNav>` — sticky in-page section nav (auto-hide aware).
- **Analytics:** `team_detail_view` / `team_list_view` page-views + `team_standings_/matches_/squad_in_view` intersection events. The `team_` prefix is in the live GTM trigger regex.
- **Contrast rule:** small text on jersey-deep uses `text-white` (cream #f5f1e6 is 4.04:1 there, below AA).
- **Phase 6.C deferred deletions — complete (#1960):** `<TeamOverview>` + `<TeamCard>` (retired with the `/jeugd` redesign, #2092), `<TeamRoster>` + the legacy `<StaffCard>` (retired with the board pages, #2044), and `<MatchResultRow>` (#2049) all lost their last consumers as Phase 7 rebuilt those surfaces and were deleted — files, stories, tests, and barrel exports. `git grep` confirms zero remaining consumers.

## Design Conventions

**Storybook is the authoritative design system reference.** Check `Foundation/Colors`, `Foundation/Typography`, and `Foundation/Spacing & Icons` stories for all design tokens (colors, spacing, border-radius, typography). Do not hardcode values not defined there.

### Page layout — `<PageContainer>` and the three body widths

Every page wraps its content in `<PageContainer>` (`@/components/design-system`). It is the single centered body container — `mx-auto w-full px-4 md:px-8` + a role-based max-width. Pick the width by the page's role; do **not** hand-roll `mx-auto max-w-… px-…` containers:

| `width`     | Max-width                  | Use for                                                    |
| ----------- | -------------------------- | ---------------------------------------------------------- |
| `"index"`   | 1280 (`--container-index`) | Card-grid index / listing / landing pages (incl. homepage) |
| _(default)_ | 1040 (`--container-wide`)  | Detail / single-subject pages                              |
| `"prose"`   | 680 (`--container-prose`)  | Long-form reading, forms, legal                            |

- Vertical rhythm (`py-*`, `scroll-mt-*`, …) goes on the consuming section via `className`; pass `as="section"` for sections and `id="…"` for in-page nav anchors. Heroes/bespoke grid layouts that can't wrap cleanly may apply the same width **loosely** (`max-w-[var(--container-wide)]` / `max-w-[var(--container-index)]`) — but only one of the three values.
- **A content container may use no other width.** Three exemptions, which are NOT content containers: (1) **chrome** — `<SiteHeader>`/`<SiteFooter>` use `max-w-[1440px]` (global nav/footer span wider than content; the only width above 1280, chrome-only); (2) **element-sizing** — a photo, illustration, reading-measure/quote/divider width, or scaled diagram (e.g. the organigram tree) keeps its own `max-w-[…]`; (3) **full-bleed** — `<StripedSeam>`, hero band backgrounds, `<CtaBand>`, coloured section bands span the viewport and are never wrapped.
- All three are named custom tokens: `--container-prose` (680), `--container-wide` (1040), `--container-index` (1280). The legacy `--max-width-inner*`/`--container-page`/`--container-default`/`--max-width-outer` tokens were all removed in #2155.

### Design system locations

| Concern           | Path                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| Component source  | `src/components/design-system/<Name>/`                                        |
| Component stories | `src/components/design-system/<Name>/<Name>.stories.tsx` (title: `UI/<Name>`) |
| Component tests   | `src/components/design-system/<Name>/<Name>.test.tsx`                         |
| Barrel export     | `src/components/design-system/index.ts`                                       |
| Icons             | `src/lib/icons.redesign.ts` (Phosphor Fill — `"use client"`)                  |
| Foundation docs   | `src/stories/foundation/`                                                     |
| Design tokens     | `src/app/globals.css` (`@theme {}`)                                           |

## Effect & Server Component Patterns

- **Never wrap `runPromise` in try/catch in Server Components.** Effect errors must bubble to the Next.js error boundary. The only permitted exception is converting `HttpNotFound` to `notFound()` via `Effect.catchTag("HttpNotFound", () => Effect.sync(() => notFound()))`.
- **Use `Effect.catchTag("HttpNotFound")`, not `Effect.catchAll`.** When fetching multiple items in `Effect.all`, only 404s should be silently treated as "failed". `Effect.catchAll` masks real upstream errors (503s, network failures) as empty results — document the reason if a broader catch is ever necessary.
- **The BFF owns all aggregated and derived values.** Summaries (W/D/L, goalsFor/Against), enriched flags (`is_home`), and labels (`kcvv_team_label`) are computed by the BFF. Never re-derive them in a Server Component — the preconditions (enrichment ordering, status guards) are already enforced by the BFF and cannot be replicated safely on the page.
- **Sort before you pick.** Any derivation of "most recent" or "best" record must reference the sorted array. Place all sort operations before any logic that depends on ordering.
- **Test fixtures for "use newest record" must have distinguishable field values.** If a test validates that the most-recent match is used, the older fixture record must have a detectably different value (e.g. different name or logo) — identical values make sort-order bugs invisible.
- **Discriminated union branching must be exhaustive.** In IIFE, `switch`, or if-chain handling of a discriminated union (`subject.kind`, `articleType`, etc.), check each known case explicitly and return `undefined` / throw / `assertNever` on the implicit branch — never let the last case be the implicit fallthrough. Future union members (e.g. a new `kind: "team"`) will silently be mis-handled because the types won't catch additive changes to the union.
- **Derive paired flags from the same source expression.** `hasX` + `xKind`, `enabled` + `mode`, etc. must flow from the same computed value: `const x = computeX(); const hasX = !!x; const xKind = x?.kind;` — not two independent `??` chains read from different places. Two sources drift silently while passing type checks, then lie to downstream consumers (analytics, JSON-LD, logs). Seen in #1333: `hasSubject` read from `about`, `subjectKind` read from raw `article.subject?.kind`.
- **Before adding a page-level runtime guard, trace the repository GROQ filter.** A page component gating on `article.publishedAt && …` is dead code if the repository's `findBySlug` already has `publishedAt <= now()` in its GROQ. Duplicate guards mislead reviewers into flagging legitimate emission paths and hide the real filter if it ever changes. Read the repo method first; gate only at the layer that owns the concern.

## Analytics Checklist for New Features

Every new user-facing feature or page **must** include an analytics section. Before closing any issue that adds interactive UI, verify:

- [ ] **Events defined**: new user interactions have named events in the PRD event taxonomy
- [ ] **`trackEvent` calls added**: all interactive components call `trackEvent` with the correct parameters
- [ ] **GTM updated** — _required manual step, call it out explicitly in the PR body (events do NOT fire to GA4 until done):_ append any new event-name prefix to the live Custom Event trigger's RegEx — currently `responsibility_|search_|organigram_|related_content_|homepage_|directions_|firstteam_strip_|article_|related_article_|event_|article_video_|player_|match_|team_|kalender_|sponsor_|jeugd_|hub_|error_|gallery_` (same trigger, never a new one). `sponsor_` (Phase 7.5, #2037) covers `sponsor_view`, `sponsor_click`, `sponsor_featured_click`, `sponsor_cta_click`; new params `sponsor_id` (hashed) + `tier` need DLVs + GA4 mapping — tracked in #1974 §7. `jeugd_` (Phase 7, #2042) covers `jeugd_view` (no params) + `jeugd_card_click` (params `card_type`, `tag`, `article_id_hashed`); new params need GA4 dimensions + DLVs + tag mapping — tracked in #1974 §8. `hub_` (Phase 7, #2058) covers `hub_view` (page-view on the unified `/hulp` hub, no params). The hub also fires `organigram_*` (incl. the new `organigram_search_contact_escape`, param `query_length` — already a registered dimension) and the `responsibility_*` family — all already matched by the `organigram_`/`responsibility_` tokens, so only `hub_` is net-new. Manual GTM/GA4 wiring tracked in #1974 §9. `kalender_` (Phase 6.D, #1992/#1995) covers `kalender_filter`, `kalender_view`, `kalender_view_toggle`, `kalender_item_click`, `kalender_subscribe_open`, `kalender_subscribe_copy` — manual GTM/GA4 wiring tracked in #1974 §6. The `event_` token (broadened from `event_cta_` in #1966) covers `event_cta_click` (article surface), `event_filter`, and — added in #1967 — `event_view` + `event_detail_cta_click`; `event_external_link_click` was retired in #1967 (the old `<EventCtaButton>` was replaced). No RegEx change is needed for #1967 — every name already starts with `event_`. New event parameters still need a Data Layer Variable (DLV) created in GTM and mapped into the GA4 Event tag's parameter fields (#1967 adds `event_slug` + `cta`; `event_type` already exists from `event_filter`). `error_` (Phase 8.5, #2108) covers `error_view` (params `error_code` ∈ {404,500}, `path`) + `error_action_click` (params `error_code`, `path`, `action` ∈ {home, search, retry}) on the 404/500 error pages; the new params `error_code` / `path` / `action` need DLVs + GA4 dimensions + tag mapping — tracked in #1974. `gallery_` (#1471) covers `gallery_open` (params `gallery_slug`, `image_count`, `source` ∈ {list, match, event}) + `gallery_image_view` (params `gallery_slug`, `image_index`) on the `/galerij/[slug]` detail page + lightbox; the new params need DLVs + GA4 dimensions + tag mapping — tracked in #1974. This regex is the single source of truth — keep it byte-identical to the deployed trigger; it drifted unnoticed through the `player_`/`match_` phases.
- [ ] **GA4 custom dimensions registered**: any new event parameters registered in GA4 → Admin → Data display → Custom definitions (run `node scripts/create-ga4-dimensions.mjs` or add manually)
- [ ] **GA4 explorations updated**: existing explorations updated, or new exploration created, if the feature introduces a new funnel or metric worth tracking
- [ ] **No PII**: no email addresses, phone numbers, names, or raw internal IDs in event parameters (hash internal IDs via `hashMemberId`)

When writing a PRD for a new feature, always include an **Analytics** section with:

- Event taxonomy table (event name, trigger, parameters)
- Which existing GA4 explorations need updating
- Whether new custom dimensions are needed, and which GTM DLVs and GA4 Event tag parameter mappings are required for any new event parameters

## SEO & Structured Data Checklist

When adding or updating a page route, verify:

- [ ] **Metadata**: `generateMetadata` exports title, description, and Open Graph fields appropriate for the page
- [ ] **Canonical URL**: page has a canonical URL (handled by `metadataBase` for most routes)
- [ ] **JSON-LD**: if the page represents a distinct Schema.org entity (article, event, person, organization, etc.), add or update a `<JsonLd>` block with the appropriate `schema-dts` type via a builder in `src/lib/seo/jsonld.ts`
- [ ] **Validate**: test new/changed JSON-LD output with [Google Rich Results Test](https://search.google.com/test/rich-results) or [Schema.org Validator](https://validator.schema.org/)

Structured data builders live in `src/lib/seo/jsonld.ts` and use `schema-dts` types for compile-time Schema.org validation. The generic `<JsonLd>` component (`src/components/seo/JsonLd.tsx`) renders any `WithContext<T>` to a `<script type="application/ld+json">` tag.

## Analytics & Instrumentation

- **Analytics belong in `useEffect`, never inside async fetch functions.** Async functions cannot see derived state (e.g. `filteredResults`) and are not re-triggered by client-side state changes. Use a `useEffect` with all terminal state variables in deps: `[data, isLoading, error, ...]`.
- **`error` is required in analytics effect deps and guard.** Without it, `trackNoResults` fires after failed fetches when `isLoading` becomes `false` and results are empty. Guard: `if (isLoading || error) return;`.
- **`AbortController`: abort on all exit paths.** Any early return in an async function that owns an `AbortController` must call `.abort()` and null the ref before returning — not just the happy path.
- **Analytics data source must match what the UI renders.** If the UI applies client-side filters, analytics must use the post-filter list, not the raw API response.
- **Privacy: classify each field before remediating.** User-generated input (e.g. query text) → sanitize/truncate via `sanitizeQuery`. Public editorial content (e.g. result titles) → keep as-is. Never remove non-user-authored fields.
- **Internal IDs in analytics events must be hashed.** Sanity document IDs and other internal identifiers sent to analytics are pseudonymous PII — hash them (e.g. djb2 via `hashMemberId`) before sending. Never forward raw internal IDs to `trackEvent`.
- **Dedup guard is required on any multi-side-effect handler.** Any event handler that calls `setState`, `localStorage`, navigation, or `trackEvent` must open with an early-return guard for the no-op case (`if (newValue === currentValue) return`) before any side effect fires. Reselecting the same tab/view must never emit duplicate analytics events.
- **Audit sibling analytics hooks before writing a new one.** Before creating a new `use*Analytics.ts` hook, read every existing hook in `src/hooks/` to extract data-transformation constraints (sanitization, hashing, field shape) — not just event-name inspiration. The peer hook is the reference implementation for what privacy constraints apply.
- **Grep before implementing any utility function.** Before writing a sanitization, hashing, or formatting helper, grep `src/lib/` for the function name. If it already exists, import it. Shared analytics utilities live in `src/lib/analytics/`.
- **Analytics test assertions must encode the privacy policy, not the wire format.** Write `expect(...).toHaveBeenCalledWith("event", { member_id: hashMemberId(id), query_text: sanitizeQuery(q) })` — not the raw input values. A test that passes against a privacy-violating implementation is not a privacy test.
- **Bug fix commits need a regression test.** If a fix adds a guard condition, add a test case that exercises the unguarded path.

## Layered testing model

Three independent test layers, each owning a specific concern. Don't blur them — each layer's value comes from the bounded thing it asserts about.

| Layer                           | Tool                                                   | What it catches                                                                               | Lives at                                                                            |
| ------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Unit / component logic          | Vitest (`pnpm test`)                                   | Component behaviour, hooks, utility correctness                                               | `**/*.test.tsx`, `**/*.test.ts`                                                     |
| Component visual regression     | Storybook + `@storybook/test-runner` (`pnpm vr:check`) | Pixel-level regressions on `UI/*`, `Features/*`, `Layout/*` stories                           | `apps/web/src/**/*.stories.tsx` + baselines under `apps/web/test/vr/__snapshots__/` |
| **Page-level functional smoke** | **Playwright e2e (`pnpm test:e2e`)**                   | **Page renders 200/404, `<h1>` + nav + footer present, no broken images, no `console.error`** | **`apps/web/test/e2e/`**                                                            |

`Pages/*` Storybook stories exist as design references but are **not** VR-tested — page composition correctness is the e2e suite's job. See `docs/prd/page-level-testing-rework.md` for the rationale.

## Page-Level E2E Testing (Playwright)

Functional smoke checks against `next start` (or a Vercel preview URL), one
test per route. PRD: `docs/prd/page-level-testing-rework.md`.

### Local workflow

```bash
# 0. First-run only: install Chromium for Playwright (one-time).
pnpm --filter @kcvv/web run test:e2e:install

# 1. Build the app — webServer in playwright.config.ts launches `next start`.
pnpm --filter @kcvv/web run build

# 2. Make sure the BFF is reachable. Either start it locally:
#       pnpm --filter @kcvv/api dev
#    OR point KCVV_API_URL at the staging worker in `apps/web/.env.local`.

# 3. Run the suite. Auto-starts a server on :3000 if one isn't already up.
pnpm --filter @kcvv/web run test:e2e

# 4. Interactive UI mode (re-run on save, screenshots, trace viewer).
pnpm --filter @kcvv/web run test:e2e:ui
```

To target a deployed environment instead of local `next start`:

```bash
BASE_URL=https://www.kcvvelewijt.be pnpm --filter @kcvv/web run test:e2e
```

When `BASE_URL` is set, the config's `webServer` block stays inactive and the
suite hits the supplied URL directly.

### What each test asserts

The shared `smokeTest()` helper (`apps/web/test/e2e/helpers/smoke.ts`) enforces
the same contract on every route:

- HTTP status matches the expected status (200 for content routes, 404 for the
  unknown-slug test).
- `<h1>` is rendered and visible. Page-shells without a visible heading carry a
  `sr-only` h1 — see `apps/web/src/app/(landing)/page.tsx` and
  `apps/web/src/app/(landing)/nieuws/page.tsx`.
- Primary `<nav>` and `<footer>` are visible.
- No visible `<img>` is broken (`naturalWidth > 0`).
- No `console.error` was emitted during page load (modulo a small known-noise
  ignore-list in the helper).

Per-route deep assertions are deliberately **out of scope** for this layer —
the goal is broad coverage of "did the page render at all", not "did this
specific value render correctly". Deep assertions belong in component-level
unit tests or, for cross-component contracts, dedicated integration tests
under the same `apps/web/test/e2e/` umbrella.

### Dynamic-route fixtures

Slugs for `/nieuws/[slug]`, `/spelers/[slug]`, `/ploegen/[slug]`,
`/wedstrijd/[matchId]`, and `/events/[slug]` are discovered at suite startup
by parsing `${BASE_URL}/sitemap.xml`. articleType variants are detected by
fetching candidate article pages and matching the type-specific
`data-testid="<type>-hero"` markers. If a route family has zero entries in
the sitemap, that test is skipped (visible in runner output) rather than
failing.

### CI

`.github/workflows/e2e.yml` runs the suite against `next start` on a Linux
runner using the pinned `mcr.microsoft.com/playwright:v1.59.1-noble` image
(same version as `@playwright/test` in `apps/web/package.json`).

Path triggers are deliberately **distinct from the VR job's**:

- Included: `apps/web/src/**`, `apps/web/public/**`,
  `apps/web/package.json`, `apps/web/test/e2e/**`,
  `packages/api-contract/**`, root `package.json`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`, `.nvmrc`, `.github/workflows/e2e.yml`.
- Excluded: `apps/web/.storybook/**`, `apps/web/test/vr/**` (Storybook-only
  paths that don't affect a Playwright-against-`next start` run).

Failure uploads `playwright-report/` and `test-results/` (traces,
screenshots, video) as artifacts with 14-day retention.

### When to add a new e2e test

Add a route smoke test when you ship a **new top-level route** under
`apps/web/src/app/`. Don't add e2e tests for sub-page interactions or
component variants — those are component-level concerns.

The `smokeTest()` helper already covers the structural contract. New tests
are typically two lines:

```typescript
test("/new-route", async ({ page }) => {
  await smokeTest(page, { path: "/new-route" });
});
```

If the new route doesn't have a visible `<h1>` (page-shell pattern), add a
`sr-only` h1 to the page rather than weakening the smoke contract.

## Visual Regression Testing

Self-hosted Playwright + `@storybook/test-runner`. Baselines live under
`apps/web/test/vr/__snapshots__/` as `<story-id>--<viewport>.png` and are
committed to the repo. Background and rationale: `docs/prd/visual-regression-testing.md`.

### Local workflow (Docker required)

Prerequisite: Docker Desktop running with **at least 8 GB of memory allocated**
to the Docker VM. Local runs use the pinned `mcr.microsoft.com/playwright:v1.59.1-noble`
image so font rendering matches CI exactly.

**Minimum Docker Desktop memory:** 8 GB (measured against the full Phase 2+3
story surface). Below this floor, Chromium runs out of memory mid-story and
produces `page.goto: Page crashed` failures on `Features/*` and `Pages/*` stories.
If your machine allocates less than 8 GB, use the `vr:update:single` script
(see "Single-worker fallback" below).

**CI / local parity contract:** GitHub-hosted `ubuntu-latest` runners provide
16 GB RAM — 2× the 8 GB local floor, satisfying the ≥ 25 % headroom requirement.
If either the runner spec or the local floor changes, re-verify the other before
merging.

**Node.js heap:** `docker-compose.vr.yml` sets `NODE_OPTIONS=--max-old-space-size=4096`
to raise the Node.js heap limit to 4 GB. Without this, the test runner OOMs
after ~80 story visits regardless of Docker memory allocation (Node.js defaults
to ~1.4 GB heap on 64-bit systems).

```bash
# Compare against committed baselines.
pnpm --filter @kcvv/web run vr:check

# Accept the current rendering as the new baseline (commit the resulting PNGs).
pnpm --filter @kcvv/web run vr:update

# Surgical baseline update — only stories matching the path pattern.
# The `--` separator hands the rest to test-storybook, which forwards
# `--testPathPatterns=<regex>` to Jest. The regex matches the synthetic
# test file paths the runner generates from story IDs (e.g. `ui-button`,
# `layout-pagefooter`), NOT the source `.stories.tsx` paths. Use a tight
# anchor like `ui-button` to scope to one atom (without dragging in
# `ui-linkbutton`/`ui-downloadbutton`/etc.).
pnpm --filter @kcvv/web run vr:update:story -- --testPathPatterns=ui-button

# Print the diff PNG path(s) for a failed story so the Read tool can inspect them.
pnpm --filter @kcvv/web run vr:diff layout-pagefooter--standalone
```

`vr:check` and `vr:update` rebuild Storybook first, then run the test-runner
inside Docker. First run pulls the Playwright image (~1.3 GB). Steady-state run
time on a warm cache is ~30 s for the Phase 1 tracer-bullet set.

### Single-worker fallback

If `vr:update` crashes mid-run with `page.goto: Page crashed` (Chromium OOM
inside the Docker container), use the single-worker variants:

```bash
# Compare — single worker, lower peak memory.
pnpm --filter @kcvv/web run vr:run:single

# Update baselines — single worker, lower peak memory.
pnpm --filter @kcvv/web run vr:update:single
```

These scripts pass `--maxWorkers=1` to `test-storybook`, serialising story
visits instead of parallelising them. Run time roughly doubles, but peak RSS
drops significantly, allowing the full suite to complete on hosts below the
8 GB memory floor.

### Path-based triggering

VR runs in CI only when a PR touches one of these globs (path-based, not
label-based — see PRD §4):

```text
apps/web/src/**
apps/web/.storybook/**
apps/web/public/**
apps/web/package.json
```

PRs that change only `apps/api/**`, `packages/**`, or infrastructure don't run
VR. There is no `visual` label and none should be introduced.

### Decision tree on a failing VR job

When `pnpm vr:check` (or the CI `visual-regression` job) reports a diff:

1. **Read each diff PNG** via the `Read` tool (vision-enabled — Claude sees the
   actual visual difference). For CI, check the sticky PR comment — diff images
   are posted inline automatically by the `vr-diff-comment` job (no artifact
   download required). The comment embeds baseline / actual / diff side-by-side
   for each changed story.
2. **Cross-reference with the issue's acceptance criteria.**
3. **If the diff aligns with the issue's stated goal** (e.g. the issue says
   "redesign card shadow" and the diff shows a changed shadow):
   - Run `pnpm --filter @kcvv/web run vr:update` locally (or post the PR
     comment `@kcvv-bot update-vr-baselines`).
   - Commit with message `chore(vr): update baselines — issue #<N>` plus a
     one-line rationale per changed baseline (`- <story-id>: shadow adjusted
per AC#3`).
   - Continue.
4. **If the diff is unexpected or outside the issue's scope** (e.g. the issue
   says "fix footer safe area" but the diff shows a changed button colour on an
   unrelated story):
   - **Halt.**
   - Report the unexpected regression to the user as a blocker, including the
     diff PNG path.
   - Do **not** auto-update baselines to paper over the regression.
5. **PR body** must include a `## VR baselines` section enumerating changed
   baselines and their justifications, so the reviewer sees the intentional
   visual scope at a glance.

This loop is canonical for any Claude session — Ralph, `/spec`, ad-hoc — not
Ralph-specific.

### Atom reskin PRs — surgical baselines, defer consumers via `vr.disable`

Phase 2+ atom reskins (Button, Input, Alert, …) intentionally change the visual
of every story that consumes them. The contract for these PRs:

1. **Update the atom's own baselines surgically.** Run `vr:update:story` with a
   tight `--testPathPatterns` regex anchored to the atom's story-ID prefix —
   e.g. `pnpm vr:update:story -- --testPathPatterns=ui-button`. The pattern
   matches the synthetic test file paths derived from story IDs (e.g.
   `ui-button.test.js`), not the source `.stories.tsx` paths. The PR's
   `## VR baselines` section enumerates every changed baseline file with a
   one-line rationale.
2. **Defer consumer baselines via `parameters.vr.disable: true`, not `vr-skip`.**
   A consumer story that has the `vr` tag and visually changes because it
   imports the redesigned atom should NOT have its baseline auto-updated in the
   atom's PR — that bleeds half-redesigned state into the consumer's committed
   baseline before the consumer itself is redesigned. The right opt-out is the
   per-story escape hatch documented under "Per-story escape hatch" below
   (`parameters: { vr: { disable: true } }` on the affected story export). Use
   the same annotation template that section requires (reason, repro, approver,
   re-evaluate date) — pointing the re-evaluate date at the consumer's redesign
   issue. **Do not use `tags: ["vr-skip"]` for this.** `vr-skip` is reserved
   for stories that crash during render or `play()` (see `vr-skip` section
   below); using it for deferred-redesign opt-outs would prevent the test
   runner from even visiting the story, masking unrelated crashes from the
   moment the tag lands.

   **Carve-out for structural twins** — atoms that share the same
   source-of-truth style file as the reskinned atom (e.g. `<LinkButton>`
   imports `getButtonClasses` directly from `Button/button-styles.ts` and
   cannot visually drift from `<Button>` without editing that same file)
   update _alongside_ the atom, not deferred. Their baselines belong in the
   atom's PR. This carve-out is narrow and structural: it requires a literal
   shared style module, not a shared design language. Composed consumers that
   render the atom (feature components, page sections) always defer via
   `vr.disable`.

3. **PR `## VR baselines` section** lists the atom's updated baselines, plus
   any consumer stories transitioned to `vr.disable` and the issue/phase they
   re-acquire VR coverage in. Example:

   ```markdown
   ## VR baselines

   - Updated `ui-button--*` (16 baselines × 3 viewports) — primary variant
     reskinned to jersey-on-cream (PRD §6.1).
   - First-degree consumers opted out via `vr.disable` until their phase:
     - `features-homepage-matchesslideremptystate--*` → re-baselined in #<NN>
     - `features-homepage-webshopsection--*` → re-baselined in #<NN>
   ```

This precedent was established in the Phase 2 tracer-bullet PR (#1568).

### Opt-in via the `vr` tag

The VR suite runs `test-storybook --includeTags vr`, so only story files tagged
with `vr` in their meta participate. Add the tag at the meta level:

```typescript
const meta = {
  title: "UI/SomeComponent",
  component: SomeComponent,
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SomeComponent>;
```

Phase 2 covers every `UI/*`, `Foundation/*`, and `Layout/*` story file.
Phase 3 (`docs/prd/visual-regression-testing.md` §12 Phase 3 appendix)
defines a 36-file Include list of `Features/*` components that **must**
adopt the `vr` tag — but adoption is staged with the upcoming full
component redesign rather than landed in one big capture. See the next
section for the per-redesign contract.

Tagging is the only filter — the `PHASE1_STORIES` allowlist that previously
gated specific exports has been removed.

### Definition of Ready / Done — `Features/*` redesign PRs

A PR that redesigns a `Features/*` component named in the **Phase 3
Include list** (PRD §12 Phase 3 appendix) is **not done** until VR coverage
lands with the redesign. This is the contract that keeps Phase 3 honest
without paying the throwaway-baseline cost up front.

**Definition of Ready** — before opening the redesign PR:

- Confirm the component's story file is in the Phase 3 Include list (see
  `docs/prd/visual-regression-testing.md` §12 Phase 3 appendix). If it is
  in the Defer list, no VR adoption is required by this redesign.
- If the redesign splits or renames an Included story file (e.g.
  `MatchDetailView.stories.tsx` becomes `MatchDetailHero.stories.tsx` +
  `MatchDetailBody.stories.tsx`), every resulting story file inherits the
  `vr` obligation, and the Phase 3 Include list in
  `docs/prd/visual-regression-testing.md` is updated in the same PR to
  reflect the new file names.
- Confirm Docker Desktop is running locally (required for `pnpm vr:update`).

**Definition of Done** — before requesting review on the redesign PR:

1. The redesigned story file's meta has `"vr"` in its `tags` array
   (`tags: ["autodocs", "vr"]`, or `"vr"` merged into whatever array
   already exists).
2. Baselines were captured by running `pnpm vr:update` from `apps/web/`
   inside the pinned Docker container (never native macOS — see
   anti-patterns below).
3. The new
   `apps/web/test/vr/__snapshots__/features-<area>-<component>--<story>--<viewport>.png`
   files are committed alongside the redesign code.
4. CI's `visual-regression` job is green.
5. Any story that genuinely cannot be made deterministic has
   `parameters: { vr: { disable: true } }` on **that specific story export
   only** (never the whole file), with an inline comment explaining the
   precise non-determinism that fixture pinning could not fix. Crashing
   stories use `tags: ["vr-skip"]` on the story export instead — see the
   `vr-skip` section below.
6. The PR description's "VR baselines" section enumerates which baselines
   are first-time captures (acceptable) versus updates to existing
   baselines (must be justified per §10 of the PRD).

If the redesign touches a component **not** in the Include list, no VR
adoption is required — but the criterion in §12 Phase 3 of the PRD still
applies: if the failure mode is visual-structural rather than
data-presentational, propose adding the component to Phase 3 in the same
PR (doc edit + tag + baselines).

### Foundation MDX docs

Foundation docs are authored as plain MDX under `src/stories/foundation/<Name>.mdx`
and register **directly as native Docs pages** via an explicit
`<Meta title="Foundation/<Name>" />` at the top of each file (import `Meta` from
`@storybook/addon-docs/blocks`). There are **no `.stories.tsx` wrappers** — to add
a new Foundation page, add a single `.mdx` with its `<Meta>` block.

These docs are **not** visual-regression tested: `@storybook/test-runner` skips
`type === "docs"` entries, and Foundation pages are documentation rather than
shipped UI (the real tokens are VR-covered through the component stories that
consume them). The previous "sibling `.stories.tsx` VR wrapper" pattern was
removed in #2155 because it double-registered every topic in the sidebar (once
as `Foundation/<Name>` and once as an auto-titled `stories/foundation/<Name>`).

### Determinism stubs (Phase 2)

To stop pixel drift between runs, `apps/web/.storybook/test-runner.ts` installs
the following stubs before any story renders:

- **`Date` / `Date.now`** — pinned to `2026-01-15T12:00:00.000Z` via an
  `addInitScript` injected in the runner's `prepare` hook. Stories deriving
  "today" or relative timestamps render against a fixed instant.
- **`Math.random`** — replaced with a seeded mulberry32 PRNG (seed
  `0x1234abcd`). The runner re-seeds before every story (`preVisit` calls
  `__VR_RESET_PRNG__()`) so consumption order is independent of which other
  story rendered first in the same `.stories.tsx` file.
- **CSS animations and transitions** — disabled via a stylesheet injected per
  story before screenshot. Belt-and-braces alongside Playwright's
  `animations: "disabled"` screenshot option, which only stops CSS keyframes
  but not transition firing on viewport resize.
- **Font loading** — every viewport awaits `document.fonts.ready` after the
  resize so web fonts are committed before each capture.
- **Caret blink** — `caret-color: transparent` ensures `<input>` and
  `<textarea>` stories do not flicker between paint frames.
- **Next/Image responsive `srcset`** — viewport changes can swap in a
  different optimized variant after the resize fires. Each viewport waits
  (capped at 1500ms) for any in-flight `<img>` to finish loading before the
  screenshot. Broken images log a `[VR] image failed to load: <url>` warning
  to the runner output so the cause is grep-able from CI logs.

If a story remains non-deterministic after these stubs, fix the story's
fixtures rather than reaching for `parameters.vr.disable = true`. The escape
hatch is reserved for genuinely dynamic debug stories, not for masking
fixable pixel drift.

Whenever `parameters.vr.disable = true` ships, an adjacent inline comment
must record the unavoidable source of non-determinism, the steps to
reproduce it, who approved the opt-out (or a link to the approval ticket /
PR), and an expected re-evaluation date. Use this template so reviewers can
validate the opt-out at a glance:

```typescript
parameters: {
  // vr.disable: <one-line reason this story cannot be made deterministic>
  // Repro: <minimal steps that reproduce the non-determinism>
  // Approved by: @<github-handle> / <issue-or-PR-link>
  // Re-evaluate: YYYY-MM-DD
  vr: { disable: true },
},
```

The `prepare()` hook in `apps/web/.storybook/test-runner.ts` overrides
`@storybook/test-runner`'s default `defaultPrepare` body. Re-audit it against
`node_modules/@storybook/test-runner/dist/index.js` after every test-runner
dep bump — silent drift here breaks the connection-refused error message and
the determinism guarantees.

### Threshold note

`toMatchImageSnapshot` uses `failureThreshold: 0.0005` (percent = 0.05%). This absorbs
sub-pixel anti-aliasing noise while catching real visual regressions. ARM ↔ x86
drift no longer needs a wide threshold — `kcvv-vr-bot` canonicalises baselines
on CI (`KCVV_VR_BOT_TOKEN` is configured), so contributors never commit
Apple-Silicon baselines directly. Real regressions (diagonal seam hairlines,
layout reflows, gradient breaks) produce >0.05% diffs and trip the gate reliably.

### Per-story escape hatch

A story can opt out of VR via its meta:

```typescript
export default {
  title: "UI/SomeComponent",
  component: SomeComponent,
  parameters: {
    vr: { disable: true },
  },
};
```

Reserved for dev-debug stories only, never for routine opt-out. If a non-debug
story tempts you to disable VR, that's a signal the story's fixture
determinism needs fixing instead. A custom viewport set is also supported —
`parameters.vr.viewports = ["desktop"]` — for stories that only render
meaningfully at one breakpoint.

### `vr-skip` — discovery-time skip for crashing stories

`parameters.vr.disable = true` only suppresses **screenshot capture** in
`postVisit`; the test-runner still visits the story and runs its `play`
function. For stories that crash during render or `play` (a missing fixture,
an inherently broken edge case), tag the story with `vr-skip` so the runner
excludes it at discovery — before the page is evaluated:

```typescript
export const FlatHierarchy: Story = {
  tags: ["vr-skip"],
  render: () => /* ... */,
};
```

The `vr:run` / `vr:run:update` scripts in `apps/web/package.json` (and the
matching `Dockerfile.vr` ENTRYPOINT) pass `--excludeTags vr-skip` to the
test-runner so tagged stories never load. Reserve `vr-skip` for stories whose
crash mode cannot be addressed by adjusting fixtures alone — e.g. an edge-case
story that intentionally exercises an unsupported path of the underlying
component or library. Document the reason inline (one comment line).

### Inspecting diffs

When the CI `visual-regression` job fails on a PR, the `vr-diff-comment` job
automatically pushes the diff PNGs to the orphan branch `vr-diffs/pr-<N>` and
posts a sticky comment on the PR. The comment embeds baseline / actual / diff
images inline via `raw.githubusercontent.com` links — no artifact download
needed. The orphan branch (and the sticky comment) are cleaned up automatically
when the PR closes via `vr-diff-cleanup.yml`.

Locally, `pnpm --filter @kcvv/web run vr:diff <story-id>` prints the on-disk
path(s) under `apps/web/test/vr/__diff_output__/`. The `vr-diff-output`
artifact is still uploaded as a fallback for programmatic access.

### Baseline-update bot flow

A maintainer can comment `@kcvv-bot update-vr-baselines` on a PR. The
`vr-baseline-update.yml` workflow re-runs the suite with `-u`, commits the
regenerated PNGs to the PR branch as `kcvv-vr-bot`, and pushes. The push
re-triggers `visual-regression` to verify the new baselines pass. CodeRabbit
ignores PNG-only commits and the bot identity (see `.coderabbit.yaml` and PRD §9).

**Bot setup (one-time):** see the header comment in
`.github/workflows/vr-baseline-update.yml` — requires a GitHub user
`kcvv-vr-bot` with a PAT scoped for `contents: write` on this repo, stored as
the `KCVV_VR_BOT_TOKEN` secret. Same-repo PRs only; fork PRs are rejected
explicitly. A GitHub App is the cleaner long-term replacement.

### Anti-patterns

- **No `[skip ci]`** in baseline-update commits. CodeRabbit quota is handled
  separately; GitHub CI must run to verify the new baselines.
- **No native Playwright** outside Docker on macOS. Local font rendering
  diverges from Linux CI and produces false-positive diffs. Always use
  `vr:check` / `vr:update`.
- **No baselines committed from macOS or Windows hosts.** Only Docker-local
  (Linux-matched) or the CI bot.
- **No `visual` label.** Triggering is path-based; never introduce a label gate.
- **Do not run multi-worker `vr:update` on hosts under the 8 GB memory floor.**
  Chromium will crash mid-story inside the Docker container and produce phantom
  `page.goto: Page crashed` failures. Use `vr:run:single` / `vr:update:single`
  instead (see "Single-worker fallback" above). CI runners have 16 GB and are
  not affected, but contributor machines under the floor must use the single-worker
  variants.
- **Do not remove `NODE_OPTIONS=--max-old-space-size=4096` from `docker-compose.vr.yml`.**
  Node.js defaults to ~1.4 GB heap — the test runner OOMs after ~80 story visits
  regardless of Docker memory allocation.
