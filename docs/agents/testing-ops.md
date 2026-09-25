# Testing Operations — E2E & Visual Regression

How to run, scope, and debug the two page/pixel-level suites in `apps/web`.
Read this when you need to actually run a suite, capture baselines, or diagnose a
failing VR job. The conceptual three-layer model lives in `apps/web/CLAUDE.md`.

---

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

To target a deployed environment instead of local `next start`, pick one
built against the `staging` dataset. `www.kcvvelewijt.be` serves production,
where the pinned fixtures do not exist, so their tests 404:

```bash
BASE_URL=https://<a-staging-built-deployment> pnpm --filter @kcvv/web run test:e2e
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

The suite runs against the **`staging`** dataset, always — the workflow pins
`NEXT_PUBLIC_SANITY_DATASET: staging`, and a local run needs a build made with
the same value. Production holds no event articles, so it cannot serve the
fixtures (#3087).

Dynamic routes test **pinned subjects**, listed in
`apps/web/test/e2e/helpers/fixtures.ts` (`FIXTURES`): the six fixture documents
below, plus one real staging player (`/spelers/778`) and team
(`/ploegen/eerste-elftallen-a`), pinned as they exist. The shared helper probes
no pages at start-up. `scroll-arrows.spec.ts` pins one more real staging
article, `/nieuws/2025-06-20-definitieve-reeksindeling-3e-nationale-bis`
(`TABLE_ARTICLE_SLUG`), because the `e2e-*` articles carry no HTML table and
no related row.

**Matches stay discovered.** A match is a PSD record, not a Sanity document,
and the sitemap lists only matches of the last 90 days — every match ages out
of its own window, so no match id can be pinned. `discoverMatchId()` reads one
off `/sitemap.xml` each run; with no match in the window, that test fails.

**A missing subject is a red, never a skip (#3149).** Against pinned data,
missing data is a regression, so no spec outside the two geometry specs above
uses a data-shaped `test.skip`. If one goes red, add the content to `staging`
or delete the test (#3087 §6). A skip that depends on the viewport, not on
data, is fine.

Two of these reds read PSD match data, which `staging` cannot pin: the match
smoke test (a match in the last 90 days) and the MatchStrip toggle tap target
(a result and a fixture). The homepage "expand" test was the third; it
duplicated `UpcomingMatches.test.tsx`, so it was deleted instead (#3131 §0.4). In the summer break they can go red with no code change. That is
the accepted cost of the ruling: the fix then is to rework or delete the
test, never to put the skip back.

**What pinned data does not fix.** 6 of the 7 retries that green `main` runs
hid were hydration and `IntersectionObserver` races. No data choice touches
them: there is no hydration signal to wait for, and the framework's answer is
an app-side fix. They live in `scroll-arrows.spec.ts` and
`section-nav.spec.ts`, which #3146 deletes. Until then, both specs still sweep
every team page at start-up to find a team whose section nav renders.

### Pinned fixture documents in `staging` (#3147)

Six documents in the `staging` dataset are the fixed subjects the suite pins
(#3148), per the
E2E data contract (#3087): one `article` per type
(`e2e-article-{interview,announcement,transfer,event}`), one `event` dated
**2099** (`e2e-event-far-future`) so the calendar never runs out of future
events (the event article's fact is dated 2099 too), and one `photoGallery`
(`e2e-photo-gallery`). Slugs start with
`e2e-`, titles say `E2E-fixture, niet verwijderen`. Matches cannot be pinned —
they come from PSD in a rolling 90-day window.

`apps/studio/scripts/seed-e2e-fixtures.ts` writes them. It uses fixed `_id`s,
rewrites only a fixture that drifted, deletes a pending Studio draft of one,
writes nothing when all six match, and refuses any dataset but `staging` — it
checks the client's own config, because `getCliClient({dataset})` ignores the
option and writes to production. Anyone logged in to the Sanity CLI with
write access to project `vhb33jaz` can run it:

```bash
cd apps/studio
npx sanity exec scripts/seed-e2e-fixtures.ts --with-user-token
```

**Staging is the E2E content surface, and Kevin owns it.** Nothing refreshes
it, on purpose. A missing fixture turns the suite red. An edited one may not: `smokeTest()` checks that the page renders, not that
its fields match the seed. Either way, re-run the script to repair the drift.

### CI

`.github/workflows/e2e.yml` runs the suite against `next start` on a Linux
runner using a pinned `mcr.microsoft.com/playwright` image. The tag must match
`@playwright/test` in `apps/web/package.json` — those two files own the version;
never restate it in prose here, it drifts.

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
to the Docker VM. Local runs use the same pinned `mcr.microsoft.com/playwright`
image tag as CI — set in `apps/web/Dockerfile.vr` (`FROM`), the single source
of truth for it — but the tag alone does not make font rendering match: CI
runs the image's amd64 build (`ubuntu-latest`), while an unpinned build on
Apple Silicon resolves arm64, whose Chromium/FreeType antialiases display
serif differently. `docker-compose.vr.yml` therefore pins
`platform: linux/amd64` — see "The amd64 pin — scoped runs only" below (#2370).

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
# Surgical run — the pattern only scopes when it FOLLOWS `-u` (see "Scoping
# a VR run" below), so update mode is the only scoped mode. To check a single
# story without keeping new baselines: scoped update, inspect `git status`,
# then discard that prefix only (see "The unscoped guard" below — never a
# blanket checkout of the whole __snapshots__ directory).
pnpm --filter @kcvv/web run vr:update:story -- ui-button   # update, scoped

# Refused by the guard — unscoped, ~2.5 h emulated. See below.
pnpm --filter @kcvv/web run vr:check
pnpm --filter @kcvv/web run vr:update

# Print the diff PNG path(s) for a failed story so the Read tool can inspect them.
pnpm --filter @kcvv/web run vr:diff layout-pagefooter--standalone
```

### The amd64 pin — scoped runs only (#2370)

`docker-compose.vr.yml` pins the `vr` service to `platform: linux/amd64`.
Measured on the `features-articles-editorialhero` cluster (57 baselines, 19
tests), same commit, same image tag:

| Build                    | Changed baselines after a scoped `-u` run | Wall-clock             |
| ------------------------ | ----------------------------------------- | ---------------------- |
| arm64 (unpinned)         | 52 / 57                                   | 46 s                   |
| amd64 (pinned, emulated) | **0 / 57**                                | 179 s cold, 164 s warm |

The 0/57 row means architecture was the sole cause of the drift: pinned local
renders are **byte-identical to the committed baselines CI passes against**,
so a scoped local capture is trustworthy on Apple Silicon. (Measured before
#3136, when `-u` rewrote only captures that failed the 0.05 % gate — so 0/57
proves "under the gate", not strictly byte-identical.) Two consequences:

- **Scoped runs only — enforced (#2380).** Emulation costs ~3.6×: the ~40 min
  full suite projects to ~2.5 h. The full suite is CI's job; see "The unscoped
  guard" below.
- **Never remove the pin to speed a run up.** Unpinned arm64 output fails ~83
  stories that CI passes, and arm64-rendered baselines must never be committed
  (see "Anti-patterns" below).

### The unscoped guard (#2380)

`vr:check`, `vr:update`, `vr:update:single` and `vr:update:story` all route
through `apps/web/scripts/vr-docker.mjs`, which refuses an unscoped local run
**before** the Storybook build and before any Docker image build or pull:

- **`vr:check` is always refused.** Check mode has no scoped form at all — a
  bare positional is silently dropped (see "Scoping a VR run" below), so every
  local `vr:check` is the full ~2.5 h suite. To check one component, run a
  scoped **update** and read `git status test/vr/__snapshots__/`: modified =
  drift, untracked = new. Since #3136 (`updatePassedSnapshot: true`), modified
  means **any** pixel change, including drift under the 0.05 % gate. Discard **by prefix**, never the whole directory —
  a blanket `git checkout -- test/vr/__snapshots__/` also throws away baselines
  you legitimately updated earlier on the branch:

  ```bash
  git checkout -- "test/vr/__snapshots__/<story-id-prefix>--"*   # tracked
  git clean -f -- "test/vr/__snapshots__/<story-id-prefix>--"*   # newly added
  ```

- **The update modes are refused without a positional pattern.** Flags do not
  count; `pnpm vr:update -- --maxWorkers=1` is still unscoped.

**The refusal is a guard, not a budget.** The pin that buys byte-identity is
the same pin that costs the wall-clock, so no speed-up ever reopens the
unscoped local run.

`VR_FULL_RUN=1` is the only override, and a deliberate human one — when the
guard blocks an agent the answer is a scoped run, never this variable:

```bash
VR_FULL_RUN=1 pnpm --filter @kcvv/web run vr:update
```

CI is unaffected — `.github/workflows/ci.yml` and `vr-baseline-update.yml` call
`vr:ci` / `vr:ci:update`, which run `vr:run*` directly without Docker. The guard
decision is a pure function covered by `apps/web/test/scripts/vr-docker.test.ts`,
and `apps/web/test/scripts/vr-command-surface.test.ts` holds this file and the
rest of the agent instruction surface to the wrapper — no doc may hand out the
raw runner, the raw container command or an argument-carrying `-u` (#3140).

`vr:run:update` — the one script that writes baselines without this wrapper —
refuses to start unless `CI` is exactly `true`. A developer can still set it by
hand, so the arm64 capture it would produce locally is blocked by default, not
impossible (#3140).

The wrapper exists as a script rather than a prefix on the package.json script
bodies because pnpm appends `-- <args>` to the **end** of the script string — a
guard in front of the `&&` chain would never see the scoping pattern.

### Scoping a VR run

A full capture is ~40 min — ~2.5 h locally under the amd64 pin — so always
scope, and always through the workspace script:

```bash
pnpm --filter @kcvv/web run vr:update:story -- <story-id-prefix>
```

That script, and its low-memory twin `vr:update:single` below the 8 GB Docker
floor, are the only ways to write a scoped baseline locally — the full-run
override above (`VR_FULL_RUN=1 … vr:update`) is the one unscoped path. Each owns three things,
and every raw form drops at least one: the runner flag, the Storybook rebuild,
and the `docker compose` call carrying `platform: linux/amd64`. Reach the runner
directly — a bare flag, or `vr:run:update` — and the capture renders on arm64,
which does not match CI (#2370). Hand-write the container run and the pin still
holds, but the rebuild and the scoping guard are gone (#2380).

The runner's CLI is why the wrapper has to own that flag. `test-storybook`
parses it with commander against a closed option allowlist (`--maxWorkers`,
`--testTimeout`, `--includeTags`, `--excludeTags`, `--listTests`, `--ci`,
`--shard`, … — see `getParsedCliOptions` in
`node_modules/@storybook/test-runner/dist/test-storybook.js`). Any unrecognised
`--flag` prints the help text and exits 1 — including Jest's own
`--testPathPatterns`, which is **not** passed through. Positional operands
(`program.args`) do reach Jest, but only the ones following the update flag
scope; a bare positional in check mode is silently dropped and the whole suite
runs instead.

The pattern is a regex over the synthetic test files the runner writes to a
temp dir, one per story **title** (component), named from the story ID:
`features-share-goalkcvvtemplate.test.js`, `ui-button.test.js`. It does **not**
match source `.stories.tsx` paths, and it cannot select a single story export
within a component. Anchor tightly — `ui-button` matches nothing else, but
`share` would pull in every `features-share-*` file.

To test a prefix before spending the capture, match it against the story index
rather than the runner — no container, no rebuild, instant. Filter on the tags
the run itself selects on, or the answer counts stories the capture never
visits:

```bash
jq -r '.entries[] | select((.tags // []) | index("vr") and (index("vr-skip") | not)) | .id' \
  apps/web/storybook-static/index.json | grep '^features-share'
```

The tag pair is restated there; `apps/web/package.json`'s `--includeTags vr
--excludeTags vr-skip` is the authoritative copy, so re-read that if the two
ever disagree. `index.json` is a build output and `vr:build-storybook` opens by
deleting it — run `pnpm --filter @kcvv/web run vr:build-storybook` first if it
is not there.

Tag-based scoping is the other axis, and it goes through the same script. The
wrapper forwards extra options, and `--includeTags` is on its value-option list,
so the flag's value is not mistaken for the scoping pattern:

```bash
pnpm --filter @kcvv/web run vr:update:story -- --includeTags <tag> <story-id-prefix>
```

The `STORYBOOK_INCLUDE_TAGS` / `STORYBOOK_EXCLUDE_TAGS` / `STORYBOOK_SKIP_TAGS`
env vars (comma-separated) are that same axis read from the compose file's
`environment:` block — CI's channel, not a local one.

### Captures are viewport-clipped, not full-page

The runner screenshots the **viewport**, so anything below the fold of the
tallest viewport is not in the baseline. This matters for the `Features/Share/*`
templates: they render a 1080×1920 Instagram Story, and the baselines only cover
roughly its top third — the crest, kicker, and headline. The crest matchup,
player name, meta line, and footer are **never captured at any viewport**.

Do not add a `Features/Share/*` story expecting VR to guard something in the
lower two-thirds of the canvas (a long-name auto-fit, the footer matchup, the
score meta row) — it cannot. Guard those with a unit test instead; the auto-fit
regression in #2316 is the worked example.

The local `vr:*` Docker scripts rebuild Storybook first, then run the
test-runner inside Docker (after the unscoped guard passes). First run pulls the
Playwright image (~1.3 GB). Steady-state run time on a warm cache is ~30 s for
the Phase 1 tracer-bullet set (measured unpinned; expect ~3.6× that under the
amd64 pin).

### Single-worker fallback

If `vr:update` crashes mid-run with `page.goto: Page crashed` (Chromium OOM
inside the Docker container), use the single-worker variants:

```bash
# Compare — single worker, lower peak memory. Native, NOT in Docker: use it to
# triage an OOM, never to judge a diff, and never commit baselines from it
# (see "Anti-patterns" below).
pnpm --filter @kcvv/web run vr:run:single

# Update baselines — single worker, lower peak memory. Guarded: needs a pattern.
pnpm --filter @kcvv/web run vr:update:single -- ui-button
```

These scripts pass `--maxWorkers=1` to `test-storybook`, serialising story
visits instead of parallelising them. Run time roughly doubles, but peak RSS
drops significantly, allowing a run to complete on hosts below the 8 GB memory
floor.

### Path-based triggering

VR runs in CI only when a change touches one of these globs (path-based, not
label-based — see PRD §4). Since #3138, the same filter applies uniformly to
pull requests **and** pushes to `main` — the old unconditional push arm (23
runs, zero catches) is gone:

```text
apps/web/src/**
apps/web/.storybook/**
apps/web/test/**
apps/web/public/**
apps/web/package.json
apps/web/Dockerfile.vr
.nvmrc
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
.github/workflows/ci.yml
```

PRs that change only `apps/api/**`, `packages/**` other than what's listed
above, or infrastructure don't run VR. There is no `visual` label and none
should be introduced.

**Known limit on `main`: a queued run can be superseded, not just the
in-progress one.** `cancel-in-progress` is off for `main` (deploys must not be
interrupted), but GitHub still cancels a _pending_ run in the same
concurrency group when a newer push queues behind it — only the run that
actually executes gets to diff `before..after`. A push whose VR-relevant
change was superseded this way is never independently verified against `main`
by this job. No last-successful-SHA lookup is built for this: every such
change was already VR-tested on its own pull request before merging.

### Decision tree on a failing VR job

When the CI `visual-regression` job (or a scoped local `vr:update:story`)
reports a diff:

1. **Read each diff PNG** via the `Read` tool (vision-enabled — Claude sees the
   actual visual difference). For CI, check the sticky PR comment — diff images
   are posted inline automatically by the `vr-diff-comment` job (no artifact
   download required). The comment embeds baseline / actual / diff side-by-side
   for each changed story.
2. **Cross-reference with the issue's acceptance criteria.**
3. **If the diff aligns with the issue's stated goal** (e.g. the issue says
   "redesign card shadow" and the diff shows a changed shadow):
   - Run `pnpm --filter @kcvv/web run vr:update:story -- <story-id-prefix>`
     locally, once per affected component. This is the only route for a diff
     your own change caused — not `@kcvv-bot update-vr-baselines`, which is
     reserved for drift you cannot reproduce locally (see "Baseline-update bot
     flow").
   - Commit with message `chore(ui): update VR baselines — issue #<N>` plus a
     one-line rationale per changed baseline (`- <story-id>: shadow adjusted
per AC#3`). **`vr` is not a valid commitlint scope** — use `ui`, or the
     surface scope the change belongs to (see the scope list in
     `.claude/CLAUDE.md`).
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

### Opt-in via the `vr` tag

The VR suite runs with `--includeTags vr`, so only story files tagged
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
    // vr.disable: <one-line reason this story cannot be made deterministic>
    // Repro: <minimal steps that reproduce the non-determinism>
    // Approved by: @<github-handle> / <issue-or-PR-link>
    // Re-evaluate: YYYY-MM-DD
    vr: { disable: true },
  },
};
```

Reserved for dev-debug stories only, never for routine opt-out. If a non-debug
story tempts you to disable VR, that's a signal the story's fixture
determinism needs fixing instead. A custom viewport set is also supported —
`parameters.vr.viewports = ["desktop"]` — for stories that only render
meaningfully at one breakpoint.

### Scoping a story's viewports (#2803)

A story can point the Storybook **preview pane** at a narrow width two ways —
`globals: { viewport: { value: "…" } }` (the live Storybook 10 API) or the
Storybook-10-**removed** `parameters: { viewport: { defaultViewport: "…" } }`
(inert: it scopes neither the preview nor the VR capture, kept around only by
copy-paste habit). **Neither one scopes the VR capture.** The runner
(`.storybook/test-runner.ts`) reads `parameters.vr.viewports` — or every
viewport — regardless of what `globals.viewport` or `parameters.viewport` say.
A story that sets a preview viewport without declaring `vr.viewports` (or
opting out via `vr.disable`, see above) still gets every viewport captured; a
`postVisit` throw catches this class of mistake and names both escapes:

```typescript
export const Mobile: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
  // Declares the escape the throw above is asking for — required whenever
  // globals.viewport (or the removed parameters.viewport.defaultViewport) is
  // set on a `vr`-tagged story.
  parameters: {
    vr: { viewports: ["mobile"] },
  },
};
```

**The stale-baseline trap:** narrowing a story from three viewports to one
does not delete the tablet/desktop PNGs it already has — a green scoped `-u`
run only writes the viewports it actually requests, so the other two stay on
disk, untouched and uncompared, forever. Delete them by hand after narrowing:

```bash
rm test/vr/__snapshots__/<story-id>--{desktop,tablet}.png
```

then re-run the scoped capture to confirm nothing else in the same component
moved.

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

### Structural assertions — opt-in, tag-scoped DOM checks beyond pixels (#2861)

`postVisit` can also assert something about a story's rendered DOM beyond
the pixel-snapshot comparison every `vr`-tagged story already gets — e.g.
"this scroll track must actually overflow at mobile", a property no
screenshot diff verifies on its own. The registry lives in
`apps/web/test/vr/structural-assertions.ts`; each entry is:

```typescript
{
  tag: "vr-assert-mobile-overflow",
  description: "…",
  viewport: "mobile",
  trackSelector: '[data-testid="standings-table"] [role="region"]',
}
```

Opt a story in the same way `vr-skip` opts one out — a plain tag on the
story export, never a hard-coded story id in a `postVisit` conditional:

```typescript
export const FullDivision: Story = {
  args: { entries: fullDivision, highlightTeamId: 1235 },
  tags: ["vr-assert-mobile-overflow"],
};
```

`postVisit` reads `story.tags`, matches it against the registry, and —
while visiting the assertion's declared `viewport` — measures real
`scrollWidth` vs `clientWidth` on `trackSelector`, queried under
`#storybook-root` (the story's own rendered root, never the bare
document — exactly one match required there) and throws if the invariant
the tag promises doesn't hold. Two further throws close off ways the check
could silently stop running rather than fail: a tagged story that also sets
`parameters.vr.disable = true` (which returns before any assertion runs),
and a tagged story whose own `parameters.vr.viewports` excludes the
assertion's `viewport`.

**A tag with no story left carrying it is the failure mode this mechanism
exists to close** — the guard it backstops for StandingsTable
(`apps/web/test/e2e/scroll-arrows.spec.ts`) is itself a `test.skip()` on
pre-season live data. `apps/web/test/vr/structural-assertions.test.ts` is
the static, always-runs-in-`check-all` half — and review on #2861 found
that a naive "does the tag string appear anywhere in the file" scan misses
the more likely ways a tag stops actually running:

- **The tag only survives in a comment.** The test strips `//`/`/* */`
  comments (same pass as
  `apps/web/src/app/__tests__/cross-page-consistency.test.ts`) and parses
  real `tags: [...]` array literals out of what's left, rather than
  grepping raw file text.
- **The tagged story is excluded from the VR run itself.** The run carries
  `--includeTags vr --excludeTags vr-skip`
  (`apps/web/package.json`) — a story is only ever visited when its
  Storybook-combined tags (meta `tags` ∪ the story's own, via
  `combineTags`) include `vr` and exclude `vr-skip`. The test
  approximates that union per occurrence and fails if either condition
  doesn't hold — catching `vr-skip` added reactively to a story (or to a
  file's meta, which disables every story in that file) after a CI
  OOM/crash flake, and a story whose meta never opted into `vr` at all.
- **A file extension the scan didn't look at.** The glob
  (`**/*.stories.{js,jsx,mjs,ts,tsx}`) mirrors `.storybook/main.ts`'s own
  `stories` entry exactly, so a tag on a plain-TS `.stories.ts` file (no
  JSX required) isn't reported as "nowhere referenced".

Any of these failing fails the **Vitest** suite — part of
`pnpm --filter @kcvv/web check-all`, which runs far more often than a full
VR pass — the moment a tag stops actually running, instead of the runtime
assertion just quietly never firing again.

The next component that needs this shape of guard adds an entry to
`STRUCTURAL_ASSERTIONS` and a tag on one of its own stories — no changes to
`postVisit` itself.

### Inspecting diffs

When the CI `visual-regression` job fails on a PR, the `vr-diff-comment` job
automatically pushes the diff PNGs to the orphan branch `vr-diffs/pr-<N>` and
posts a sticky comment on the PR. Only `diff-*.png` is actually pushed — the
`actual-*.png` URLs the sticky comment embeds 404. Each
`vr-diffs/diff-<story-id>--<viewport>-diff.png` is a 3-panel composite laid
out `baseline | diff-mask | actual`, unscaled, so the right third **is** CI's
exact render: crop `x >= width * 2/3` to verify — or replace — a locally
regenerated baseline (#2370). The orphan branch (and the sticky comment) are
cleaned up automatically when the PR closes via `vr-diff-cleanup.yml`.

Locally, `pnpm --filter @kcvv/web run vr:diff <story-id>` prints the on-disk
path(s) under `apps/web/test/vr/__diff_output__/`. Since #3138 shards the job
3x, the fallback artifact for programmatic access is uploaded per shard as
`vr-diff-output-1`, `vr-diff-output-2` and `vr-diff-output-3`, not a single
`vr-diff-output`:

```bash
gh run download <run-id> --pattern 'vr-diff-output-*'
```

### Baseline-update bot flow

Reserved for drift a developer cannot reproduce locally (cross-platform
canonicalisation, flaky external asset). Baselines your own change caused are
captured locally and committed in the same PR — never routed through the bot.

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
- **No native Playwright** outside Docker on macOS for capture or judgement.
  Local font rendering diverges from Linux CI, so a native run can neither
  produce a committable baseline nor tell you whether a diff is real. The one
  sanctioned native run is `vr:run:single` as **OOM triage** — to find which
  story is exhausting Chromium (see "Single-worker fallback"). Everything else
  goes through the Docker `vr:*` scripts.
- **`VR_FULL_RUN=1` is not a way past the guard.** If a scoped run does not
  cover what you need, scope it differently or let CI run the full suite —
  the override exists for a deliberate ~2.5 h local run, not for convenience.
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
- **Do not treat a local VR failure on an unpinned (arm64) container
  as a regression** without first checking the story against CI's render
  (extract it per "Inspecting diffs" above) — Apple Silicon drifts on
  display-serif stories. With the `platform: linux/amd64` pin a local failure
  is real (see "The amd64 pin — scoped runs only").
