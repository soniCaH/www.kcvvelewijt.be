# PRD: Visual Regression Testing

**Status**: Ready for implementation
**Date**: 2026-04-22
**Issues**: TBD (Phase 1), TBD (Phase 2), TBD (Phase 3), TBD (Phase 4), TBD (Phase 5)
**Blocked-by**: #1360

---

## 1. Problem statement

`apps/web` has no automated visual regression coverage. Storybook builds are produced in CI but not diffed. Every visual change relies on manual Storybook review plus side-by-side production screenshots, which scales poorly and routinely misses cross-component regressions (layout shifts, seam hairlines, gradient reflows).

The diagonal section boundary has been an especially painful source of silent regressions across the past months (see #1322, #1350, #1360). Without visual regression testing, each fix risks reintroducing a bug the previous fix resolved.

This PRD establishes visual regression testing as foundational infrastructure that every future visual change — primitive-level or consumer-level — is automatically tested against.

## 2. Goals

- Catch rendering regressions across the design system, layout primitives, and (eventually) composed pages.
- Integrate with Claude-led workflows (Ralph, `/spec`, ad-hoc sessions) without relying on fragile human-applied labels.
- Zero additional CodeRabbit review quota consumed when baselines change.
- Scale from a 5-baseline tracer bullet to full Storybook coverage without architectural rework.

## 3. Tooling

**Playwright + `@storybook/test-runner`.** Self-hosted, file-based, open source.

Chosen over Chromatic/Percy because Claude can read diff PNGs directly via the vision-enabled `Read` tool and run the `pnpm vr:update` command in-session. This file-based property is the critical enabler for Claude integration — SaaS tools hide diffs behind web UIs and require API indirection.

**Removed: `@chromatic-com/storybook`.** Currently installed in `apps/web/package.json` but never used. Phase 1 uninstalls it to avoid confusion about which tool is authoritative.

## 4. Triggering: path-based, not label-based

VR is triggered by file paths, not by any `visual` label on the issue or PR.

### Rationale

A `visual` label only gates VR correctly if it is applied consistently across every issue-creation path: `/spec`, `/prd-to-issues`, manual `gh issue create`, GitHub UI, and third-party bots (CodeRabbit, Renovate). Any path that forgets the label silently skips VR → regressions ship. Path-based detection has no such gap.

### CI workflow

The VR job in `.github/workflows/ci.yml` uses `on.pull_request.paths`:

```yaml
on:
  pull_request:
    paths:
      - "apps/web/src/**"
      - "apps/web/.storybook/**"
      - "apps/web/public/**"
      - "apps/web/package.json"
```

PRs touching any of these paths run VR. PRs touching only `apps/api/**`, `packages/api-contract/**`, or infrastructure don't.

### Ralph integration

Ralph's validation step inspects `git diff --name-only <base>...HEAD` against the same glob. Any match → run `pnpm vr:check` as part of final validation. No match → skip VR entirely.

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

Reserved for dev-debug stories, never for routine opt-out. If the temptation to disable VR on a non-debug story arises, that is a signal the story's fixture determinism needs fixing instead.

### The `visual` label is not introduced

`/spec`, `/prd-to-issues`, and ad-hoc issue flows remain unchanged. No new checklist items, no label drift risk.

## 5. Local iteration (Docker-based)

Developer-ergonomics layer over the CI source-of-truth. Playwright's official Docker image pinned by tag, producing Linux baselines identical to CI.

### Scripts

- `pnpm vr:check` — runs the full VR suite against the built Storybook inside Docker. ~30s on warm cache.
- `pnpm vr:update` — accepts current rendering as new baselines. Writes PNGs into `apps/web/test/vr/__snapshots__/` for the developer to commit.
- `pnpm vr:diff <story-id>` — prints the diff PNG path for a specific failure so Claude can read it via the `Read` tool.

### Why Docker and not native Playwright

Playwright on local macOS vs CI Linux produces different font rendering → false-positive diffs. Docker running Playwright's official multi-arch image (Apple Silicon native) eliminates this category of flakiness.

### Prerequisite

Docker Desktop installed and running. Documented in `apps/web/CLAUDE.md` under a new `Visual Regression Testing` section.

## 6. CI workflow

New job `visual-regression` in `.github/workflows/ci.yml`:

- Runs after the existing `build` job (`needs: build` — uses the Storybook static output).
- Same `ubuntu-latest` runner. Playwright runs directly (no Docker-in-CI); OS match with Docker-local is guaranteed because both use the same Linux Playwright image family and version.
- On failure, uploads diff PNGs as artifacts so Claude (or a reviewer) can download and inspect them.
- Gates merge to `main` the same way the other quality-checks jobs do.

### Baseline-update workflow

A separate workflow listens for PR comments containing the literal string `@kcvv-bot update-vr-baselines`:

1. Re-runs `pnpm vr:update` against the current PR branch.
2. Commits the updated PNGs to the PR branch as a dedicated bot identity (see §8).
3. Pushes, which re-triggers the `visual-regression` job and verifies the new baselines pass.

This is the primary mechanism by which Ralph and humans accept intentional visual changes without leaving the PR.

**Explicit anti-pattern: do NOT use `[skip ci]` in baseline-update commits.** `[skip ci]` is a GitHub-wide convention that skips all workflows, including the VR verification job we need to run. CodeRabbit quota is handled separately (§8). GitHub CI must run.

## 7. Baseline storage

**Committed directly to the repo** under `apps/web/test/vr/__snapshots__/`. Linear naming: `<story-id>--<viewport>.png`.

No Git LFS, no external store. At Phase 5 worst case, total storage is ~30–80 MB, comfortably negligible for a repo this size. Baselines travel with the code, `git bisect` works across baseline changes, and no extra tooling is required of contributors.

## 8. Viewports

**Three viewports at 1x DPR per story by default:**

- Mobile: 375px
- Tablet: 768px
- Desktop: 1440px

### Per-story override

A story can declare a different set in its meta:

```typescript
parameters: {
  vr: { viewports: ["desktop"] },
},
```

Used for stories that only render meaningfully at one breakpoint (e.g., a desktop-only sidebar).

### Retina and additional breakpoints

Deferred unless a specific bug motivates them. Retina 2x doubles the baseline count and storage for marginal real-world regression catching; we add it when we have evidence, not speculatively.

## 9. CodeRabbit config

Two additions to `.coderabbit.yaml`:

### 9.1 Path filter excluding baselines

```yaml
reviews:
  path_filters:
    - "!apps/web/test/vr/__snapshots__/**/*.png"
```

CodeRabbit never reviews baseline PNGs. When the bot's push contains only PNGs, CodeRabbit sees no reviewable content and consumes zero quota.

### 9.2 Ignore bot identity

```yaml
reviews:
  auto_review:
    ignore_usernames:
      - "kcvv-vr-bot"
```

Even if the bot's push contains non-PNG metadata files, CodeRabbit skips the commits entirely based on author.

### 9.3 Anti-pattern

Do **not** use GitHub's `[skip ci]` in bot commit messages. It skips our own VR verification job. The two mechanisms above are sufficient — and they don't affect whether GitHub Actions runs.

## 10. Ralph integration & decision loop

When Ralph executes an issue whose touched files match the visual-paths glob, the validation step runs `pnpm vr:check`. On failure, Claude applies this decision tree:

1. **Read each diff PNG** via the `Read` tool (vision enabled — Claude sees the actual visual difference).
2. **Cross-reference with the issue's acceptance criteria.**
3. **If the diff aligns with the issue's stated goal** (e.g., issue says "redesign card shadow" and the diff shows a changed shadow):
   - Run `pnpm vr:update` locally.
   - Commit with message `chore(vr): update baselines — issue #<N>` plus a one-line rationale per changed baseline (`- <story-id>: shadow adjusted per AC#3`).
   - Continue.
4. **If the diff is unexpected or outside the issue's scope** (e.g., issue says "fix footer safe area" but the diff shows a changed button color on an unrelated story):
   - Halt.
   - Report the unexpected regression to the user as a blocker, with the diff PNG path.
   - Do **not** auto-update baselines to paper over the regression.
5. **Ralph's PR body** includes a `## VR baselines` section enumerating changed baselines and their justifications, so the reviewer sees the intentional visual scope at a glance.

This loop is canonical for any Claude session — Ralph, `/spec`, ad-hoc — not Ralph-specific. It lives in `apps/web/CLAUDE.md`.

## 11. CLAUDE.md additions

`apps/web/CLAUDE.md` grows a new section: `Visual Regression Testing`. Contents:

- How to run locally (Docker prereq, `pnpm vr:check` / `vr:update` / `vr:diff`).
- The decision tree from §10, verbatim.
- Path-based triggering behavior, with the glob.
- Per-story escape hatch and when it's appropriate.
- Explicit anti-patterns (`[skip ci]`, native Playwright without Docker, committing baselines from macOS).
- Reference to this PRD for rationale.

No changes to root `CLAUDE.md` — VR is `apps/web`-scoped.

## 12. Phase plan

Each phase is a separate GitHub issue. Phases ship sequentially; later phases assume earlier phases are live.

### Phase 1 — Tracer bullet

Scope: 5 stories × 3 viewports = 15 baselines. Stories: `Layout/PageFooter`, two `UI/SectionTransition` variants, two `UI/SectionStack` compositions.

Work:

- Install `@playwright/test` + `@storybook/test-runner` dev dependencies.
- Uninstall `@chromatic-com/storybook`.
- Scaffold `apps/web/playwright.config.ts` and `apps/web/test/vr/` setup.
- Scaffold `apps/web/Dockerfile.vr` (or `apps/web/docker-compose.vr.yml`) pinning Playwright's official image.
- Add `pnpm vr:check`, `pnpm vr:update`, `pnpm vr:diff` scripts.
- Add `visual-regression` CI job to `.github/workflows/ci.yml`.
- Add baseline-update workflow listening for `@kcvv-bot update-vr-baselines` PR comments.
- Update `.coderabbit.yaml` with path filter + bot ignore.
- Capture the 15 baselines.
- Document in `apps/web/CLAUDE.md`.

Exit criterion: a deliberate visual change → CI produces a readable diff artifact → Claude executes the §10 decision loop end-to-end successfully.

### `vr-skip` escape hatch (introduced alongside Phase 1)

Some stories crash the test-runner during render or `play` — a missing fixture
provider, a `play` step asserting a UI that no longer exists, or an
intentional edge-case story that exercises an unsupported path of the
underlying component. Per-story `parameters.vr.disable = true` only suppresses
screenshot capture in `postVisit`; the runner still visits the page and the
crash propagates as a test failure.

For these stories, add `tags: ["vr-skip"]` at the story level. The `vr:run`
script and `Dockerfile.vr` ENTRYPOINT pass `--excludeTags vr-skip` so tagged
stories are dropped at discovery, before the page is evaluated.

`vr-skip` is intended as a narrow escape hatch — reserve it for stories whose
crash cannot be addressed by adjusting fixtures alone, and document the reason
inline. Routine fixture issues should still be fixed in the story.

### Phase 2 — Design system, Foundation, Layout

All `UI/*`, `Foundation/*`, `Layout/*` stories get baselines. ~30–50 stories.

Determinism work happens once in this phase for the whole repo:

- Disable CSS transitions/animations under a VR environment flag.
- `document.fonts.ready` awaited before capture.
- Next/Image behavior pinned (either mocked as regular `<img>` or configured to skip optimization).
- `Date.now` and `Math.random` stubbed via a deterministic seed in the test-runner hook.

### Phase 3 — Selective `Features/*`

Not every `Features/*` story. Criterion: **include if the story's failure mode is visual-structural (layout, composition, spacing) rather than data-presentational.**

Examples that qualify (titles below match story-file metas in the repo):

- `Features/Matches/MatchStripClient` (composition across breakpoints)
- `Features/Articles/ArticleHeader` / `Features/Articles/InterviewHero` (editorial layout)
- `Features/Homepage/YouthSection` (backgrounded section — primitive consumer)

Examples that do not:

- Individual cards rendering a single fixture (unit/RTL tests already cover rendering correctness)
- Data-driven list items

Curation happens per-domain when the phase is executed. The Phase 3
classification of every `Features/*` story file (Include / Defer to Phase 5 /
Skip) lives in the appendix below.

#### Phase 3 appendix — `Features/*` curation (executed 2026-04-27, issue #1374)

The repo had **103** story files titled `Features/*` at the time of curation.
Each was classified using the criterion above: layout/composition/spacing risk
across breakpoints qualifies for Phase 3; pure data-presentational variance
defers to Phase 5; stories that cannot be stabilised even with fixture
pinning are skipped via `tags: ["vr-skip"]` on the meta (or
`parameters.vr.disable = true` per story when only a subset of exports is
problematic).

##### Staged adoption — captures land with each component redesign

A full visual redesign of every `Features/*` component is queued. Capturing
baselines today against the pre-redesign rendering would invalidate every
PNG within weeks, so Phase 3 ships as a **doc-only contract**:

- The Include list below is the binding contract: each listed component
  **must** add `"vr"` to its meta `tags` array and capture baselines as part
  of its redesign PR.
- No `tags: ["vr"]` adds and no baseline captures land on the Phase 3
  merge commit itself — that work moves to per-component redesign PRs.
- Defer / Skip classifications are still authoritative — Phase 5 starts from
  the same list.

This is an **explicit deviation from #1374's acceptance criteria**
("Baselines captured for every Included story"). The PR body for #1374 calls
this out and references the imminent redesign as the reason. The infra
itself is already proven by Phase 1 + 2; Phase 3's load-bearing artifact is
the curation, not the captures.

##### Include (36 files — must add `tags: ["autodocs", "vr"]` + baselines as part of their redesign PR)

All defaults to the standard mobile/tablet/desktop viewport set unless noted.

The list was deliberately trimmed against a wall-time review (each new file
adds ~30s to the local Docker capture). Files where the failure mode is
captured equally well by an adjacent composition were moved to Defer — see
"Trim rationale" below the Defer list.

**Articles** — editorial composition (hero/footer):

- `Features/Articles/ArticleFooter`
- `Features/Articles/ArticleHeader`
- `Features/Articles/InterviewHero`

**Calendar** — month/week grids and event lists:

- `Features/Calendar/CalendarMonth`
- `Features/Calendar/CalendarWeek`
- `Features/Calendar/EventsList`

**Club** — editorial grid + mission banner:

- `Features/Club/ClubEditorialGrid`
- `Features/Club/MissionBanner`

**Homepage** — section-level compositions consumed by the home page-shell:

- `Features/Homepage/BannerSlot`
- `Features/Homepage/FeaturedArticles`
- `Features/Homepage/NewsGrid`
- `Features/Homepage/SponsorsSection`
- `Features/Homepage/WebshopSection`
- `Features/Homepage/YouthSection` (also referenced in §12 examples above —
  same component)

**Hulp / Jeugd** — editorial grids + skeleton loaders (skeletons are
visual-structural placeholders):

- `Features/Hulp/QuestionCardSkeleton`
- `Features/Jeugd/JeugdEditorialGrid`

**Matches** — page-level match view, slider, lineup formation, match-strip:

- `Features/Matches/MatchDetailView` (page-level composition)
- `Features/Matches/MatchLineup` (formation visual on a pitch backdrop)
- `Features/Matches/MatchStripClient`
- `Features/Matches/MatchStripSkeleton`
- `Features/Matches/MatchesSlider`

**Organigram** — hierarchical layouts and overlays:

- `Features/Organigram/UnifiedOrganigram`
- `Features/Organigram/MemberDetailsModal`
- `Features/Organigram/ContactOverlay`

**Players** — page-level profile composition only; single-card variants
defer:

- `Features/Players/PlayerProfile`

**Related** — strip and section compositions:

- `Features/Related/MentionedEntitiesStrip`
- `Features/Related/RelatedContentSection`

**Search** — results-page compositions per the spec; single-result and
form/filter UIs defer to Phase 5:

- `Features/Search/SearchInterface`
- `Features/Search/SearchResults`

**Sponsors** — page + section compositions; per-card and per-logo variants
defer:

- `Features/Sponsors/SponsorGrid`
- `Features/Sponsors/SponsorsPage`

**Teams** — page-level overview + roster/standings/schedule grids and the
youth directory; single team-card variants defer:

- `Features/Teams/TeamOverview`
- `Features/Teams/TeamRoster`
- `Features/Teams/TeamSchedule`
- `Features/Teams/TeamStandings`
- `Features/Teams/YouthTeamsDirectory`

##### Defer to Phase 5 (67 files)

Either pure data-presentational (single fixture per story, variance is
text/data only), or a wide state-variance space that wants fixture pinning
before VR can be useful:

- **Articles**: `ArticleMetadata`, `CategoryFilters`, `EventFact/Overview`,
  `NewsCard`, `QaBlock` + `QaBlock/QaPairKey` + `QaBlock/QaPairQuote` +
  `QaBlock/QaGroupRapidFire`, `SanityArticleBody` (long-form portable text —
  baselines would churn on every PT change), `SubjectAttribution`,
  `TransferFact/Overview`, `VideoBlock`
- **Calendar**: `CalendarSubscribePanel` (form panel; multi-step `play()`),
  `CalendarWidget` (overlaps Month/Week coverage; has `play()` flake risk),
  `EventCard`
- **Contact**: `MapEmbed` (third-party Google Maps tile — non-deterministic)
- **Homepage**: `MatchesSliderSection` (section-shell already covered by
  Layout/SectionStack from Phase 2; the slider itself is captured via
  `Features/Matches/MatchesSlider`), `MatchesSliderEmptyState` (10 state
  variants of an empty-state — high baseline cost, narrow value),
  `MatchWidget` (single feature widget with `play()`)
- **Matches**: `MatchEvents` (event-list data variance), `MatchHeader`
  (status/score/team variants of one layout — already exercised by
  `MatchDetailView` which embeds it), `MatchResultRow` (single-row card),
  `MatchTeaser` (15 state variants)
- **Organigram (utility/widgets + heavy duplicates, defer)**:
  `CardHierarchy` (18 stories — composed view captured via
  `UnifiedOrganigram`), `InteractiveChart`/`EnhancedOrgChart` (18 stories —
  same rationale), `ContactCard`, `ContactQuickActions`, `DepartmentFilter`,
  `ExpandableCard`, `HierarchyLevel`, `KeyboardShortcuts`, `MobileBottomNav`,
  `MobileNavigationDrawer`, `ScreenReaderAnnouncer`, `SearchBar`, `SkipLink`,
  `UnifiedSearchBar`
- **Players (defer)**: `PlayerBio`, `PlayerCard`, `PlayerShare`,
  `PlayerStats`, `PlayerTeamHistory`
- **Responsibility (defer)**: `FeedbackWidget`, `RelatedPaths`,
  `ResponsibilityBlock` (4 card-composition variants — pin fixtures first
  alongside the rest of Responsibility), `ResponsibilityFinder` (21
  interactive states)
- **Search (defer)**: `SearchFilters`, `SearchForm`, `SearchResult`
- **Share (defer)**: every `Features/Share/*` template — fixed-canvas
  social-share renderers; data-driven per match; OG image generation has its
  own contract testing path
- **Sponsors (defer)**: `Sponsors`, `SponsorsGrid` (legacy
  `Sponsors.stories.tsx`), `SponsorsSpotlight`, `SponsorsBlock`,
  `SponsorCallToAction`, `SponsorCard`, `SponsorEmptyState`, `SponsorLogo`
- **Teams (defer)**: `TeamCard`, `TeamFeaturedCard`

##### Trim rationale (post-curation review)

The first execution of this curation included 8 additional files. Once the
local Docker capture wall time was measured (~30s of test-runner time per
new file at 3 viewports), those 8 were moved to Defer because either:

1. their failure mode is already covered by an embedding composition that
   stays Included (e.g. `MatchHeader` is exercised by `MatchDetailView`,
   `MatchesSliderSection` is the shell around `MatchesSlider` which is
   itself in Layout/SectionStack territory from Phase 2), **or**
2. their per-file story count is unusually high relative to the
   visual-structural risk caught (e.g. `CardHierarchy` and
   `InteractiveChart` ship 18 stories each — `UnifiedOrganigram` covers the
   composed view at one third the baseline cost), **or**
3. baseline churn outweighs regression catching (`SanityArticleBody`
   re-renders on every portable-text update; `MatchesSliderEmptyState` is
   10 different "empty" variants of a slot that's better tested as one).

The 8 moved files: `Articles/SanityArticleBody`, `Calendar/CalendarWidget`,
`Homepage/MatchesSliderSection`, `Homepage/MatchesSliderEmptyState`,
`Matches/MatchHeader`, `Organigram/CardHierarchy`,
`Organigram/InteractiveChart`, `Responsibility/ResponsibilityBlock`. They
remain candidates for Phase 5 once fixture pinning lands.

##### Skip (zero today)

No `parameters.vr.disable = true` is preemptively added on a `Features/*`
story file. Every Included story is expected to be deterministic given the
Phase 2 stubs (fixed `Date.now`, seeded `Math.random`, animations off, font
ready, image-load wait). The `vr-skip` precedent on the
`CardHierarchy/FlatHierarchy` and `UnifiedOrganigram/Empty` exports from
Phase 2 stays as-is — those crash before `postVisit` and are excluded at
discovery.

When a redesign PR captures baselines for an Included file, if a specific
story export turns out to be non-deterministic (e.g. a third-party widget
that paints its own canvas with a per-frame timestamp), that PR adds
`parameters: { vr: { disable: true } }` to that specific story export —
never the entire file — with an inline code comment explaining the precise
non-determinism that fixture pinning could not fix.

##### Per-component PR checklist (when you redesign an Included component)

When opening a PR that redesigns one of the 36 Included components above,
the PR must:

1. Change `tags: ["autodocs"]` → `tags: ["autodocs", "vr"]` on the meta of
   the redesigned story file (or merge `"vr"` into the existing tags array
   if it already exists).
2. Run `pnpm vr:update` from `apps/web/` (Docker required) to capture
   baselines for the now-vr-tagged stories.
3. Commit the new `apps/web/test/vr/__snapshots__/<story-id>--<viewport>.png`
   files alongside the redesign code.
4. Verify CI's `visual-regression` job passes.

The full Definition of Ready / Done — including the "split or rename"
case, the PR-description "VR baselines" section requirement, and the
Docker-required reminder — lives in `apps/web/CLAUDE.md` under
"Definition of Ready / Done — `Features/*` redesign PRs". The four items
above are the load-bearing acceptance criteria; the CLAUDE.md contract
is the actionable checklist.

Subsequent visual changes to the same component follow the standard §10
decision loop — `pnpm vr:check` produces diffs; intentional changes
re-update baselines; unexpected diffs halt and report.

### Phase 4 — Real-page compositions

Full-page Playwright snapshots for ~10 critical routes, captured against a Next.js dev server seeded with deterministic mock data (mock Sanity client returning pinned fixtures, mock PSD response fixtures).

Routes: `/`, `/nieuws`, `/nieuws/[slug]`, `/kalender`, `/wedstrijd/[matchId]`, `/ploegen`, `/sponsors`, `/club/organigram`, `/jeugd`, one dynamic player page.

Catches cross-component regressions that story-level VR cannot see — e.g., a primitive change that looks fine in isolation but breaks composition on the home page.

Runs in a separate CI job because it's slower and has different dependencies (Next.js dev server, mock infrastructure).

### Phase 5 — Full Storybook coverage

Every remaining `Features/*` story gets VR coverage.

**Prerequisite work:** convert all data-variance stories to pinned JSON fixtures. A story currently reading from `faker.seed()`, live data, or random inputs is swapped to a fixed fixture file so its baseline does not churn on unrelated changes.

This prerequisite is the bulk of the phase — the VR setup itself is already proven by earlier phases. Endpoint: zero Storybook stories without a VR baseline.

## 13. Anti-goals / non-goals

- No `visual` label introduced or required.
- No `[skip ci]` anywhere in the baseline-update flow.
- No custom diff UI built — CI artifacts + Claude vision are sufficient.
- No baselines committed from developer macOS or Windows machines. Only Docker-local (Linux-matched) or the CI bot. Prevents cross-OS drift.
- No VR on every `Features/*` story prematurely — Phase 3 criterion governs which are worth covering.
- No retina 2x viewport by default — added only if a specific regression justifies the storage cost.

## 14. Dependencies

**Blocked-by #1360.** The entire VR initiative waits for #1360 to ship first. Rationale: #1360 establishes the `--footer-diagonal` CSS custom property and semantic-landmark `<main>` structure that Phase 2 baselines will capture; starting VR before #1360 means either re-capturing baselines immediately after #1360 lands or shipping Phase 1 with known-stale structural markup.

## 15. Open implementation questions

These do not block the design but must be decided when Phase 1 is implemented:

1. **Bot identity**: GitHub App vs PAT-owned bot user for the baseline-update commits. A GitHub App is cleaner (no personal token rotation, better audit trail), a PAT is simpler to set up. Phase 1 picks one and documents.
2. **Parallelization**: run viewports per story in parallel (faster CI, more runner cores, potentially flakier) vs serial (simpler, slower). Start serial; optimize if CI wall time becomes a pain point.
3. **Determinism stubs**: exact mechanism for font-loading waits, animation disabling, Next/Image neutralization, and date/random seeding. Standard patterns exist — Phase 1 implementer selects and documents the specific set chosen.

## 16. References

- #1322, PR #1353 — prior diagonal seam fix that would have benefited from VR coverage.
- #1350 — YouthSection diagonal refactor (downstream consumer of the primitive, will benefit from VR).
- #1360 — footer safe-area fix, blocker for this initiative.
- `docs/prd/section-backdrop-pattern.md` — related PRD that VR will help protect against regression.
- Playwright docs: https://playwright.dev
- `@storybook/test-runner` docs: https://github.com/storybookjs/test-runner
- CodeRabbit config reference: https://docs.coderabbit.ai
