# Redesign — Phase History

Historical record of what each redesign phase added, renamed, or retired in the
`apps/web` design system, plus the per-phase analytics-taxonomy history at the
bottom. **This is archaeology, not current-state guidance.**
For what a component does today, read its source and its Storybook story —
`Foundation/*` and `UI/*` are the authoritative reference (see `apps/web/CLAUDE.md`).

Consult this only when tracing _why_ a primitive looks the way it does, or when a
review comment references a phase number or a retired component.

---

## Design system — primitives by phase

### Redesign primitives (Phase 0+)

Phase 0 of the editorial-redesign series ("retro-terrace fanzine") added the following design-system primitives. They live alongside legacy components per the dual-coexistence policy. See `docs/plans/2026-04-27-redesign-master-design.md` for the design language audit and `docs/prd/archive/2026/redesign-phase-0.md` for token + primitive specs.

- `<TapeStrip>` — diagonal washi-tape graphic for card corners.
- `<StripedSeam>` — SVG-backed diagonal barber-pole horizontal section divider.
- `<DottedDivider>`, `<DashedDivider>` — thin row dividers (interview Q&A, table rows).
- `<QuoteMark>` — two stacked italic open-quote glyphs.
- `<HighlighterStroke>` — hand-drawn marker underline beneath italic emphasis. Phase 1 added a `color: 'jersey' | 'jersey-deep' | 'ink' | 'cream'` prop (default `jersey`); previously fixed jersey green. Single-line CSS-bg SVG; multi-line wrapping is the deferred follow-up tracked in `docs/prd/archive/2026/redesign-phase-1.md` §11.1.
- `<MonoLabel>` — tracked uppercase pill or plain label. Pill variants gained vertical padding in Phase 1 to read as proper badges.

A new `Foundation/Patterns` MDX story documents `--pattern-jersey-stripes`, `--pattern-jersey-stripes-tight`, and `--pattern-seam`. The cream/ink/jersey colour, fluid display/body/mono typography, layout container, rotation pool, paper-shadow, and motion tokens added in Phase 0 are visible in `Foundation/Colors`, `Foundation/Typography`, and `Foundation/Spacing & Icons` MDX. The `--rotate-tape-*` pool was retuned in Phase 1 from the original master-design values to a sub-degree range (`-0.5°` / `-0.25°` / `0.25°` / `0.5°`) after `<TapedCardGrid>` rendered "seasick" on real card grids — see `docs/prd/archive/2026/redesign-phase-1.md` §11.5.

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
- `<FeaturedUitgelichtRow>` — R1.6.A equal-3-up featured row for the homepage spine. Drops itself when it gets no articles. Rendered fewer cards rather than padding from the recent-articles pool until #3696 made regular articles fill empty places.
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

---

## Visual regression: Phase 2 and 3 contracts

Moved out of `docs/agents/testing-ops.md` (#3716). These were the rules of the redesign rollout; the rules that still apply are in testing-ops under "Baselines are surgical, and every changed PNG is listed" and "Opt-in via the `vr` tag". Where a rule here conflicts with those (deferring consumer baselines through `vr.disable`), the testing-ops rule wins.

### Atom reskin PRs — surgical baselines, defer consumers via `vr.disable`

Phase 2+ atom reskins (Button, Input, Alert, …) intentionally change the visual
of every story that consumes them. The contract for these PRs:

1. **Update the atom's own baselines surgically.** Run `vr:update:story` with a
   tight positional regex anchored to the atom's story-ID prefix — e.g.
   `pnpm vr:update:story -- ui-button` (see "Scoping a VR run" above; a
   `--testPathPatterns=` flag is rejected outright). The pattern matches the
   synthetic test file paths derived from story IDs (e.g. `ui-button.test.js`),
   not the source `.stories.tsx` paths. The PR's `## VR baselines` section
   enumerates every changed baseline file with a one-line rationale.
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

Phase 2 covers every `UI/*`, `Foundation/*`, and `Layout/*` story file.
Phase 3 (`docs/prd/archive/2026/visual-regression-testing.md` §12 Phase 3 appendix)
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
  `docs/prd/archive/2026/visual-regression-testing.md` §12 Phase 3 appendix). If it is
  in the Defer list, no VR adoption is required by this redesign.
- If the redesign splits or renames an Included story file (e.g.
  `MatchDetailView.stories.tsx` becomes `MatchDetailHero.stories.tsx` +
  `MatchDetailBody.stories.tsx`), every resulting story file inherits the
  `vr` obligation, and the Phase 3 Include list in
  `docs/prd/archive/2026/visual-regression-testing.md` is updated in the same PR to
  reflect the new file names.
- Confirm Docker Desktop is running locally (required for `pnpm vr:update:story`).

**Definition of Done** — before requesting review on the redesign PR:

1. The redesigned story file's meta has `"vr"` in its `tags` array
   (`tags: ["autodocs", "vr"]`, or `"vr"` merged into whatever array
   already exists).
2. Baselines were captured by running `pnpm vr:update:story -- <story-id-prefix>`
   from `apps/web/` inside the pinned Docker container (never native macOS —
   see anti-patterns below).
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

## Analytics taxonomy — per-prefix history

Which phase/issue introduced each event-name prefix, and what GTM/GA4 wiring it
still needs. **The live regex is not recorded here** — `scripts/analytics-taxonomy.mjs`
(`prefixes` + `buildTriggerRegex()`) is the single source of truth, and `scripts/sync-gtm.mjs`
pushes it. This section is history and outstanding-wiring tracking only.

- `sponsor_` (Phase 7.5, #2037) — `sponsor_view`, `sponsor_click`, `sponsor_featured_click`, `sponsor_cta_click`. New params `sponsor_id` (hashed) + `tier` need DLVs + GA4 mapping — tracked in #1974 §7.
- `jeugd_` (Phase 7, #2042) — `jeugd_view` (no params) + `jeugd_card_click` (params `card_type`, `tag`, `article_id_hashed`). New params need GA4 dimensions + DLVs + tag mapping — tracked in #1974 §8.
- `hub_` (Phase 7, #2058) — `hub_view` (page-view on the unified `/hulp` hub, no params). The hub also fires `organigram_*` (incl. `organigram_search_contact_escape`, param `query_length` — already a registered dimension) and the `responsibility_*` family; both already matched, so only `hub_` was net-new. Manual wiring tracked in #1974 §9.
- `kalender_` (Phase 6.D, #1992/#1995) — `kalender_filter`, `kalender_view`, `kalender_view_toggle`, `kalender_item_click`, `kalender_subscribe_open`, `kalender_subscribe_copy`, `kalender_subscribe_webcal` (#3643; both carry `teams_count`, `side`, `events`, `source`). Manual GTM/GA4 wiring tracked in #1974 §6.
- `event_` (broadened from `event_cta_` in #1966) — `event_cta_click` (article surface), `event_filter`, and (added #1967) `event_view` + `event_detail_cta_click`. `event_external_link_click` was retired in #1967 with the old `<EventCtaButton>`. #1967 needed no regex change; its new params `event_slug` + `cta` still need DLVs + GA4 tag mapping (`event_type` already exists from `event_filter`).
- `error_` (Phase 8.5, #2108) — `error_view` (params `error_code` ∈ {404,500}, `path`) + `error_action_click` (params `error_code`, `path`, `action` ∈ {home, search, retry, news}) on the 404/500 pages. New params need DLVs + GA4 dimensions + tag mapping — tracked in #1974.
- `gallery_` (#1471) — `gallery_open` (params `gallery_slug`, `image_count`, `source` ∈ {list, match, event}) + `gallery_image_view` (params `gallery_slug`, `image_index`) on `/galerij/[slug]` + lightbox. New params need DLVs + GA4 dimensions + tag mapping — tracked in #1974.

**Reconciliation (#1974)**, against a `trackEvent` code grep: dropped `homepage_` / `directions_` / `firstteam_strip_` (zero code matches) and the redundant `article_video_` (covered by `article_`); added `clubshop_banner_` / `board_` / `geschiedenis_` / `ultras_` / `membership_`, which fired in code but were missing from the trigger — those events never reached GA4.
