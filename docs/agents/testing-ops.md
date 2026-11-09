# Testing Operations — E2E & Visual Regression

How to run, scope, and debug the two page/pixel-level suites in `apps/web`.
Read this when you need to actually run a suite, capture baselines, or diagnose a
failing VR job. The conceptual four-layer model — including the Storybook
`play` layer, `pnpm test:storybook` (#3146) — lives in `apps/web/CLAUDE.md`.
The per-workspace test-layer notes and the addon-vitest gotchas are at the end of
this file ("Test layers per workspace").

---

## Page-Level E2E Testing (Playwright)

Functional smoke checks against `next start` (or a Vercel preview URL), one
test per route. PRD: `docs/prd/archive/2026/page-level-testing-rework.md`.

### Local workflow

```bash
# 0. First-run only: install Chromium for Playwright (one-time).
pnpm --filter @kcvv/web run test:e2e:install

# 1. Build the app — webServer in playwright.config.ts launches `next start`.
pnpm --filter @kcvv/web run build

# 2. Make sure the BFF is reachable. Either start it locally:
#       pnpm --filter @kcvv/api dev
#    OR point KCVV_API_URL at the staging worker in `apps/web/.env.local`.
#    Staging search is empty until someone backfills it by hand:
#       ./scripts/backfill-staging-search.sh

# 3. Run the suite. Always starts its own server — never on :3000: the port
#    is derived from this worktree's own path (#3141 member 5), and
#    `reuseExistingServer: false` means it never reuses one already running,
#    even your own (see "Running against an already-started server" below).
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

### Running against an already-started server

`webServer.reuseExistingServer` is hard-coded `false` (#3141 finding 9): a
`true` here would let the suite silently reuse ANY listener already on the
derived port — a second worktree's server, or an unrelated process — and test
the wrong build without ever failing loudly. That means `test:e2e` always
starts (and tears down) its own server, even if you already have one running
by hand. To point it at a server you started yourself instead — print this
worktree's derived port with `e2e:port`, and pass it as `BASE_URL` the same
way the deployed-environment form above does:

```bash
BASE_URL=http://localhost:$(pnpm --filter @kcvv/web run --silent e2e:port) \
  pnpm --filter @kcvv/web run test:e2e
```

`e2e:port` (`apps/web/scripts/e2e-port-cli.mjs`) prints the exact port
`playwright.config.ts`'s `webServer` block would derive for this worktree —
the two share `apps/web/scripts/e2e-dev-port.mjs`'s `derivePort`, so they
can never disagree.

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
no pages at start-up.

**Matches stay discovered.** A match is a PSD record, not a Sanity document,
so no match id can be pinned. `discoverMatchId()` reads one off the pinned
team's season list (`/ploegen/eerste-elftallen-a/wedstrijden`) each run. That
list keeps the whole season, past and future, so a week or a winter break
without a match does not turn the test red. Not the sitemap: it lists only the
last 7 days (#3625).

**A missing subject is a red, never a skip (#3149).** Against pinned data,
missing data is a regression, so no spec in this suite uses a data-shaped
`test.skip` any more — the two files that did (`scroll-arrows.spec.ts`,
`section-nav.spec.ts`) are gone (#3146; see the next section). If one goes
red, add the content to `staging` or delete the test (#3087 §6). A skip that
depends on the viewport, not on data, is fine.

Two of these reds read PSD match data, which `staging` cannot pin: the match
smoke test (a match in the first team's season list) and the MatchStrip toggle tap target
(a result and a fixture). The homepage "expand" test was the third; it
duplicated `UpcomingMatches.test.tsx`, so it was deleted instead (#3131 §0.4). In the summer break they can go red with no code change. That is
the accepted cost of the ruling: the fix then is to rework or delete the
test, never to put the skip back.

**What pinned data does not fix.** 6 of the 7 retries that green `main` runs
hid were hydration and `IntersectionObserver` races. No data choice touches
them: there is no hydration signal to wait for, and the framework's answer is
an app-side fix. They lived in `scroll-arrows.spec.ts` and
`section-nav.spec.ts` (both swept every team page at start-up to find one
whose section nav renders) — #3146 deleted both files and re-homed their
geometry as Storybook `play` against a fixture, which needs no such sweep:
the fixture guarantees the condition instead of hoping a live team happens
to render it.

### Pinned fixture documents in `staging` (#3147)

Six documents in the `staging` dataset are the fixed subjects the suite pins
(#3148), per the
E2E data contract (#3087): one `article` per type
(`e2e-article-{interview,announcement,transfer,event}`), one `event` dated
**2099** (`e2e-event-far-future`) so the calendar never runs out of future
events (the event article's fact is dated 2099 too), and one `photoGallery`
(`e2e-photo-gallery`). Slugs start with
`e2e-`, titles say `E2E-fixture, niet verwijderen`. Matches cannot be pinned —
they are PSD records, read off the first team's season list (see "Matches stay discovered" above).

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

### Sanity data facts (checked 2026-10-30)

Agents learned these the hard way. A count from the wrong place, or from a query
that quietly matched nothing, has gone onto a ticket as a finding.

- **Production is private since 2026-10-14 (#3469 / #3484); staging is public.**
  A query without `SANITY_API_READ_TOKEN` returns `0` or `[]` for production, not
  an error, so a production count of 0 from a tokenless `curl` means "no token",
  never "no data". `apps/web/.env.local` points at `staging`
  (`NEXT_PUBLIC_SANITY_DATASET`; `apps/web/src/lib/sanity/client.ts` defaults to
  `production` when it is unset): check a finding against production, with the
  token, before it goes on a ticket.
- **GROQ returns a number where you expect an error.** Three traps:
  - A misspelled field or type returns `0`. Add a nonzero control to the same
    query, for example `"total": count(*[_type=="event"])`, and check the names in
    `packages/sanity-schemas/src/<type>.ts`.
  - A nested filter like `count(players[]->[pred])` matches every item.
    Cross-check with a flat `count(*[_type=="player" && pred])`.
  - `match` splits text into tokens, so it finds false positives. Count stored URL
    shapes with an exact or substring test instead.
- **After a write, count the changed ids in both datasets.** A count that differs
  from what you changed means stop.

### CI

`.github/workflows/e2e.yml` runs the suite against `next start` on a Linux
runner using a pinned `mcr.microsoft.com/playwright` image. The tag must match
`@playwright/test` in `apps/web/package.json` — those two files own the version;
never restate it in prose here, it drifts.

Pull requests only (#3151) — the workflow no longer triggers on push to
`main`. Path filtering lives at **job** level (a `changes` job running
`dorny/paths-filter`, same pattern as `ci.yml`'s `changes` job), not on the
`on:` triggers, so a PR outside these paths still reports the `E2E` check
(skipped, counts as passing) instead of leaving it pending forever.

Path triggers match `ci.yml`'s `web` filter (#3285) — broad globs, so a new
build input can't fall outside them:

- Included: `apps/web/**`, `packages/api-contract/**`,
  `packages/sanity-schemas/**`, root `package.json`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`, `.nvmrc`, `.github/workflows/e2e.yml`.
- Nothing inside `apps/web/` is excluded, so a story- or baseline-only change
  also runs the suite (owner's call: a glob can't drift, about 3 extra runs a
  week).

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
committed to the repo. Background and rationale: `docs/prd/archive/2026/visual-regression-testing.md`.

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
  means **any** pixel change, including drift under the 0.05 % gate. The baseline bot is the exception (#3707): it sets
  `VR_UPDATE_PASSED=0`, so it rewrites only baselines that fail the gate, plus new ones. Locally,
  `VR_UPDATE_PASSED=0 pnpm --filter @kcvv/web run vr:update:story -- <prefix>` does the same. Discard **by prefix**, never the whole directory —
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

### The image build and the exclusive lock (#3141)

A wave guards named shared resources, never CPU — the full register lives in
`docs/agents/ralph.md` § Shared resources. Two of its five members live in
`vr-docker.mjs`:

- **The image is never built inside the wrapper.** Build it once, by hand or
  as ralph's pre-flight, with `pnpm --filter @kcvv/web run vr:build-image` — it
  stamps the image with a content-hash label of `pnpm-lock.yaml` +
  `Dockerfile.vr`. If `kcvv-vr-runner:latest` is missing, or that label no
  longer matches this worktree's own hash (every worktree on the machine
  shares this one tag, so a lockfile change elsewhere is enough), the wrapper
  fails fast and names that same rebuild command — it used to pass `--build`
  on every run instead, and a parallel rebuild on a stale image froze the
  machine for sixteen minutes (2026-09-21). A stopped Docker daemon gets its
  own message ("Docker does not appear to be running") rather than being
  misread as a missing image.
- **The container run is exclusive, and taken before anything else runs.**
  The lock is acquired first — before the Storybook build — so a busy lock is
  reported immediately instead of after a wasted rebuild. It is a
  `mkdir`+`rename`-based mutex in `os.tmpdir()` (shared by every worktree on
  the machine, never a path inside one): only one local VR container runs at
  a time — four would want the machine's entire memory, and parallel captures
  add sub-pixel noise to unrelated baselines. A second caller is refused with
  the holder's pid, the lock's path, and the command to clear it by hand if
  you are certain nothing is actually running; a lock whose holder process is
  dead is reclaimed automatically, but only once its container has also
  stopped (a killed wrapper does not orphan a running container into a second
  one starting on top of it).

Neither check runs in CI — `vr:ci` / `vr:ci:update` call `vr:run*` directly,
without Docker, so there is no image and no container to guard there.

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

Several story files go as **separate words** after the update flag
(`-- features-home-newsgrid features-home-featuredeventband`). Never an `a|b`
pattern: the arguments end up inside a shell string in the container, `|` becomes
a shell pipe, and the run dies with exit 127 after the Storybook build.

To test a prefix before spending the capture, match it against the story index
rather than the runner — no container, no rebuild, instant. Filter on the tags
the run itself selects on, or the answer counts stories the capture never
visits:

```bash
jq -r '.entries[] | select((.tags // []) | index("vr") and (index("vr-skip") | not)) | .id' \
  apps/web/storybook-static/index.json | grep '^features-share'
```

The tag pair is restated there; `.storybook/test-runner.ts`'s `postVisit`
(`shouldScreenshot = storyTags.includes("vr") && !storyTags.includes("vr-skip")`)
is the authoritative copy, so re-read that if the two ever disagree.
`index.json` is a build output and `vr:build-storybook` opens by
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

### Baselines are surgical, and every changed PNG is listed

A change to a shared primitive moves the baselines of every story that consumes
it. Keep the set exact:

1. Capture only what the change moved, through
   `pnpm vr:update:story -- <story-id-prefix>`, one prefix per run (see "Scoping a
   VR run"). The prefix matches the synthetic test file paths derived from story
   IDs (e.g. `ui-button.test.js`), not the source `.stories.tsx` paths.
2. Capture every consumer the change moves, in the same PR as the code.
3. The PR body has a `## VR baselines` section that lists every changed baseline
   PNG (a story prefix with its viewport count is one line) with a one-line
   rationale.

The Phase 2 variant that deferred consumers through `vr.disable` is in
`docs/agents/phase-history.md` → Visual regression: Phase 2 and 3 contracts.

### Opt-in via the `vr` tag

`test-storybook` visits every story now (#3188, review round 2) — `postVisit`
(`.storybook/test-runner.ts`) decides per story whether to screenshot, not the
CLI. A story only gets a baseline captured when its combined tags include
`vr` and exclude `vr-skip`. Add the tag at the meta level:

```typescript
const meta = {
  title: "UI/SomeComponent",
  component: SomeComponent,
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SomeComponent>;
```

Tagging is the only filter. Every `UI/*`, `Foundation/*` and `Layout/*` story
file carries `vr`; a `Features/*` file adopts it with its redesign. The Phase 2/3
history of that rollout: `docs/agents/phase-history.md` → Visual regression: Phase 2
and 3 contracts.

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
- **CSS animations and transitions** — forced to zero duration by a stylesheet
  injected per story before screenshot; Playwright's `animations: "disabled"`
  does not replace it (it leaves transitions firing on viewport resize), so the
  stylesheet's animation rules are required, not optional. It forces
  `animation-direction: normal` because Storybook's own `pauseAnimations`
  parks every animation paused at `reverse`, and a zero duration turns that
  into the FIRST frame: a `both`-fill enter animation (`.spotlight-pop`)
  froze at `opacity: 0` and blanked all 21 organigram-explorer baselines
  (#3314). `postVisit` now fails any story where a CSS animation with
  `forwards`/`both` fill is not on its final frame
  (`test/vr/animation-end-frame.ts`).
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
drift no longer needs a wide threshold — the `KCVV Elewijt CI Bot` GitHub App canonicalises
baselines on CI, so contributors never commit
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

### `vr-skip` — screenshot-only skip (the story is still visited)

`parameters.vr.disable = true` only suppresses **screenshot capture** in
`postVisit`; the test-runner still visits the story and runs its `play`
function — same as `vr-skip` now (#3188, review round 2): `test-storybook`
visits every story unconditionally, and `postVisit` decides per story whether
to screenshot. `vr-skip` no longer means "never load this story" — it means
"still axe-check it, never screenshot it" (the a11y check runs from
Storybook's own render lifecycle before `postVisit` gets a say either way).
Reach for it when a story's pixel output is inherently non-deterministic (a
clipboard-permission-dependent `play`, a live-clock artifact) rather than
broken:

```typescript
export const FlatHierarchy: Story = {
  tags: ["vr-skip"],
  render: () => /* ... */,
};
```

`.storybook/test-runner.ts`'s `postVisit` is the one place that reads this tag
(`shouldScreenshot = ... && !storyTags.includes("vr-skip")`) — no CLI flag
constructs it anymore. If a story genuinely cannot even RENDER under the
runner (not just "shouldn't be screenshotted"), that's a different, sharper
problem than `vr-skip` solves — fix the render path, or raise it as a blocker,
rather than reaching for this tag to hide it. Reserve `vr-skip` for stories
whose pixels can never be stable, not for stories that crash — a crashing
story still fails the run, tag or no tag. Document the reason inline (one
comment line).

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
  args: { entries: fullDivision, highlightClubId: 1235 },
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
exists to close** — the guard it backstops for StandingsTable was itself a
`test.skip()` on pre-season live data, in `scroll-arrows.spec.ts` (deleted by
#3146; see "What pinned data does not fix" above and
`apps/web/CLAUDE.md`'s "Storybook `play` is a separate layer" section).
`apps/web/test/vr/structural-assertions.test.ts` is
the static, always-runs-in-the-web-gate half — and review on #2861 found
that a naive "does the tag string appear anywhere in the file" scan misses
the more likely ways a tag stops actually running:

- **The tag only survives in a comment.** The test strips `//`/`/* */`
  comments (same pass as
  `apps/web/src/app/__tests__/cross-page-consistency.test.ts`) and parses
  real `tags: [...]` array literals out of what's left, rather than
  grepping raw file text.
- **The tagged story is excluded from SCREENSHOTTING.** `test-storybook`
  visits every story now; `.storybook/test-runner.ts`'s `postVisit` only
  takes a screenshot when the story's Storybook-combined tags (meta `tags`
  ∪ the story's own, via `combineTags`) include `vr` and exclude `vr-skip`
  — a structural assertion (which runs inside that same screenshot branch)
  never fires for a story missing either condition. The test approximates
  that union per occurrence and fails if either condition doesn't hold —
  catching `vr-skip` added reactively to a story (or to a
  file's meta, which disables every story in that file) after a CI
  OOM/crash flake, and a story whose meta never opted into `vr` at all.
- **A file extension the scan didn't look at.** The glob
  (`**/*.stories.{js,jsx,mjs,ts,tsx}`) mirrors `.storybook/main.ts`'s own
  `stories` entry exactly, so a tag on a plain-TS `.stories.ts` file (no
  JSX required) isn't reported as "nowhere referenced".

Any of these failing fails the **Vitest** suite — part of
`pnpm turbo run lint type-check test build --filter=@kcvv/web`, which runs far more often than a full
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
regenerated PNGs to the PR branch as the `KCVV Elewijt CI Bot` GitHub App
(`kcvv-elewijt-ci-bot[bot]`), and pushes. The push
re-triggers `visual-regression` to verify the new baselines pass. CodeRabbit
ignores PNG-only commits and the bot identity (see `.coderabbit.yaml` and PRD §9).

**Bot identity:** the `KCVV Elewijt CI Bot` GitHub App. Each run mints its own
installation token with `actions/create-github-app-token`, from the repo variable
`KCVV_APP_CLIENT_ID` and the secret `KCVV_APP_PRIVATE_KEY` (see the header comment
and the "Mint an installation token" step in `.github/workflows/vr-baseline-update.yml`).
A push under an App token re-triggers CI; the built-in `GITHUB_TOKEN` does not.
Same-repo PRs only; fork PRs are rejected explicitly.

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

## Test layers per workspace

The workspace table in `.claude/CLAUDE.md` names each workspace's test layers. What each layer covers, and what it does not, is below (moved from the table's footnotes in #3716). Accessibility is owned and gated by the Storybook VR layer; the numbers live in the `apps/web` accessibility note and nowhere else.

### Every test file is picked up by a runner (#3277)

**Every test file is picked up by a runner (#3277).** A runner exits 0 when _some_ files match, so a test in a place no `include` reaches (a `*.test.tsx` under a `*.test.ts` include, a `*.spec.ts` outside `testDir`) passes every gate while running nowhere. `Quality Checks + Build`'s step "Every test file is picked up by a runner" (`apps/web/scripts/test-file-coverage.mjs`, tested in `apps/web/test/scripts/test-file-coverage.test.ts`) takes every tracked `*.test.*`, `*.spec.*` and `*.stories.*` file in the repo and requires that one layer of the script owns it (`apps/web` unit, stories and E2E, `apps/api`, `packages/api-contract`, `packages/sanity-studio`, `scripts/sanity-ops`) and that the layer's runner lists it (`vitest list --filesOnly`, `--config vitest.storybook.config.ts` for stories, `playwright test --list` for E2E). A test file in a workspace with no layer (a new workspace, `apps/studio/`, `packages/sanity-schemas/`) fails as owned by nobody; a layer that owns no files, or whose runner lists nothing, fails too. It lists rather than runs, so it costs seconds, and it adds no required check. It does **not** prove that a listed file's tests all execute (a `describe.skip` still lists) or that the runner ran in CI; the audit behind it, with per-layer should-run/did-run counts and the five gaps it filed, is `docs/research/test-layer-coverage-audit.md`. `vitest run` with an `include` that matches _nothing_ already exits 1 (measured); this step covers the partial case.

### `apps/web`: Storybook visual regression

`test-storybook` (`apps/web/package.json`'s `vr:run`) visits every story now, sharded 3 ways by story-file basename (`.storybook/stable-shard-sequencer.mjs`, #3275 — Jest's default hashed the random per-process temp dir, so each shard took a random third and ~61 of 209 files ran nowhere; `VR — Gate` and the baseline bot now fail unless every story was visited, via `apps/web/scripts/vr-coverage.mjs`) — no `--includeTags`/`--excludeTags` filter decides which stories get VISITED any more (#3188, review round 2). `.storybook/test-runner.ts`'s `postVisit` decides per story whether to screenshot: only when the story's combined tags include `vr` and exclude `vr-skip` (184 of 209 story files carry `vr`). Every other story — the 21 `Pages/*` files (carry no `vr` tag, consistent with `apps/web/CLAUDE.md`'s "not VR-tested" note) and any other component whose story was never tagged `vr` — still gets its accessibility check (see "`apps/web`: accessibility" below), just no screenshot and no baseline. Runtime geometry (`play`) moved to Storybook's own `play` exports, run by `@storybook/addon-vitest` (`pnpm test:storybook`, `apps/web/vitest.storybook.config.ts`) — [#3146](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3146) is done; `scroll-arrows.spec.ts`/`section-nav.spec.ts` no longer exist.

### `apps/web`: accessibility

**Authoritative text — `apps/web/CLAUDE.md` points here rather than repeating these numbers, so the two copies cannot drift.** `@storybook/addon-a11y` (`.storybook/main.ts`) runs on EVERY story `test-storybook` visits (see "`apps/web`: Storybook visual regression" above) — one run, no separate axe-only invocation: whether `postVisit` also takes a screenshot for a given story is orthogonal to whether the a11y check ran, since that check comes from Storybook's own render lifecycle before `postVisit` gets a say. `.storybook/test-runner.ts`'s `preVisit` also honours a story's `globals.viewport.value` (resolved against `.storybook/preview.ts`'s viewport options, `page.setViewportSize` before mount) — the same mechanism `@storybook/addon-vitest` uses for `pnpm test:storybook` — so a `play()` fixture that depends on a named viewport runs correctly under either runner, no runner-specific opt-out tag needed. **Decided by the owner on 2026-09-25: Storybook VR owns accessibility, and gates as of [#3188](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3188).** `parameters.a11y.test = "error"` (`.storybook/preview.ts`) fails the job on any violation. `color-contrast` is disabled globally, in exactly one place (that same `parameters.a11y.config.rules` entry) — the club has no WCAG conformance target; legibility is judged by eye, ties broken by contrast at most (#2395) — every other rule gates. The 2026-09-25 pre-fix census measured ~70 non-contrast violations over 13 components (`label`/`label-title-only`/`select-name` on the form atoms, `aria-allowed-role` and `heading-order` in `ArticleBody`/`QASectionDivider`, `aria-required-children` in `HubSearch`/`OrganigramExplorer`, `svg-img-alt` in the calendar subscribe QR code, `listitem` in `TapedCardGrid`, and `landmark-no-duplicate-banner`/`landmark-unique` in `ContactPage`); a fresh census with contrast off now shows 0, including on `MapEmbed`/`SkeletonBars`/`SectionNavChip`/`LoadingAnnouncement` and the 7 stories across 6 files that combine an inherited `vr` tag with a per-story `vr-skip` — none of which any single CLI-scoped invocation reached before this round.

### `apps/studio`

Config only (`sanity.config.ts`, `structure.ts`, `sanity.cli.ts`) plus migrations. `lint` and `type-check` (`tsgo --noEmit`, green since [#3204](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3204)) run in CI's "Lint + type check Studio" step, and `turbo build --filter=@kcvv/studio` (`sanity build`) runs in CI, as does the "Sanity types in sync" gate (`sanity schema extract && sanity typegen generate`, diffed against the committed types). All 22 migrations re-export a module from `@kcvv/sanity-studio/migrations`, where their logic is tested ([#3153](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3153)). One untested surface remains — type-checked since #3204, but no build, lint rule or test reads its behaviour: `apps/studio/scripts/` — 2 files, 332 lines (`seed-e2e-fixtures.ts`, `seed-pull-quote-example.ts`; the one-off writers were deleted in [#3479](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3479)) — which #3153 does **not** cover.

### `apps/studio-staging`

`turbo lint type-check --filter=@kcvv/studio-staging` runs in CI's "Lint + type check Studio" step alongside `@kcvv/studio`, `@kcvv/sanity-studio` and `@kcvv/sanity-schemas` ([#3118](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3118)) — with `type-check` (`tsgo --noEmit`) since [#3204](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3204); `sanity build` runs in CI's "Build Studios" step in the same Turbo invocation as `@kcvv/studio` ([#3287](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3287)), so a broken `sanity.config.ts`, structure or plugin setup fails the PR instead of the deploy. No typegen gate, on purpose: both studios consume the same `@kcvv/sanity-schemas` and only `apps/studio/`'s CLI config declares a typegen target (the web app's `sanity.types.ts`), so the production "Sanity types in sync" gate already covers the schemas and a staging run would write a file nothing reads. Its migrations folder matches `apps/studio/`'s — 22 re-export facades each ([#3153](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3153)). [#3120](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3120) deleted the five spent migrations that caused the rest of the drift. Unlike `apps/studio/`, it has no `scripts/` directory.

### `packages/sanity-schemas`

4 195 lines, 0 tests. `lint` (`eslint .`, `@sanity/eslint-config-studio` mirrored from `@kcvv/sanity-studio`) and `type-check` both run in CI's "Lint + type check Studio" step ([#3119](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3119)). Its `build` script (`tsgo --noEmit`, functionally identical to `type-check`) also runs transitively via `turbo.json`'s `^build` whenever `@kcvv/web` or `@kcvv/sanity-studio` type-checks or builds, and the "Sanity types in sync" gate's `sanity schema extract` parses every schema here too. `validation/`, `preview/` and `blocks/` (629 lines of pure logic) are Vitest's named gap ([#3100](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3100) decision D9) — decided, not shipped, no open ticket. Schema declarations stay untested by design.

### `packages/api-contract`

`lint` (`eslint .`, `typescript-eslint` mirrored from `@kcvv/api`) runs in CI's "Lint API" step ([#3119](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3119)). `type-check` (`tsgo --noEmit`) is never invoked — deliberately, since `build` (`tsgo --build`) checks the same code and also runs `tsgo --noEmit -p tsconfig.vitest.json`, the only CI check of `vitest.config.ts` ([#3286](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3286)) — transitively via `^build` when `@kcvv/web`/`@kcvv/api` type-check or build, and directly in the deploy and E2E workflows (`ci.yml` "Build api-contract" steps, `e2e.yml`).

### `apps/api`

Cache/TTL/single-flight semantics run in real workerd (`vitest.workers.config.ts`, `@cloudflare/vitest-plugin`); pure logic stays on the node pool (`vitest.node.config.ts`). Schema round-trip and cache-semantics work already shipped ([#3144](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3144), [#3145](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3145)).

## Storybook `play` through `@storybook/addon-vitest`: config and gotchas

Moved from `apps/web/CLAUDE.md` (#3716). The layer model and the two-runners rule stay there; this is the config rationale and what went wrong while wiring the addon.

**A separate config file, deliberately never folded into `pnpm test` (measured 2026-09-25).** `apps/web/vitest.storybook.config.ts` is its own standalone Vitest config, run only via `pnpm test:storybook` — never as a second entry in `vitest.config.ts`'s own project list, and never invoked in the same `vitest` CLI run as the `unit` suite. Tried first, and both reproduced the same class of breakage: `process.env.NODE_ENV` flips from Vitest's default `"test"` to `"development"` for the whole Node process the moment `storybookTest()` resolves `.storybook/main.ts` → `@storybook/nextjs-vite`'s own Next-config loading — `process.env` is shared by every project in one Vitest invocation, and Next's `next/image` loader only skips its `remotePatterns` hostname validation under `NODE_ENV === "test"`, so 12 **unrelated** unit-test files broke (`Invalid src prop … hostname "cdn.sanity.io" is not configured`). Patching that one leak (an explicit `test.env` override) surfaced a second, harder one: Vite's own SSR resolve `conditions` also leaked across projects, breaking 5 more files importing `next/dist/server/og/image-response.js` (`Cannot find module 'react-server-dom-webpack/static'`). A genuinely separate config file + CLI invocation sidesteps the whole class — CI runs it as its own step in `Quality Checks + Build`, after "Run tests", not through `turbo` (no upstream package build dependency to cache against, same as `test:e2e`).

**Known gotchas, measured 2026-09-25 while wiring the addon:**

- `@storybook/nextjs-vite` aliases bare `react`/`react-dom` to Next's own vendored copies via `require.resolve("next/dist/compiled/react")`, which resolves to that package's "main" entry FILE (`.../react/index.js`); Vite forwards that into esbuild's dependency-optimizer as a package-prefix alias, and esbuild auto-expands any UNLISTED subpath against the alias's resolved file path. `import "react/compiler-runtime"` (present in `@portabletext/react`'s dist under React 19, compiler on or off) breaks this way — the plugin already special-cases `jsx-runtime`/`jsx-dev-runtime` for the identical reason; `vitest.storybook.config.ts` points the subpath directly at the sibling `next/dist/compiled/react/compiler-runtime.js` file (Next's own copy, not the standalone `react` package — that would mix a different React module instance's helper into a Next-React render tree) rather than patching the plugin.
- A real anchor click (`userEvent.click`/`.click()` on an `<a href="#id">`) inside this addon's iframe reproducibly crashes the Vitest Browser Mode RPC channel ("Browser connection was closed"). Set `window.location.hash` directly instead — same `hashchange` dispatch, no native navigation.
- The addon already calls `setViewport()` from a story's composed `globals` before mount (`testStory()` in `@storybook/addon-vitest/dist/vitest-plugin/test-utils.js`), reading `.storybook/preview.ts`'s `parameters.viewport.options` — a geometry fixture that needs a specific viewport sets `globals: { viewport: { value: "…" } }` on the story (add a new named option to `preview.ts` if none of the existing ones is the right width; measured 2026-09-25, `kcvvMobile` at 375px is not interchangeable with an arbitrary "narrow" width — a table that overflows at 360px can stop overflowing at 375px). A manual `await import("vitest/browser")` + `page.viewport()` + `finally`-restore is unnecessary and was removed everywhere in favour of this (review finding 7) — the addon's own mechanism runs before `play`, not after, and never leaks into the next story the way a manual restore that forgets its `finally` can.
- Three story files (`JeugdLanding.loading.stories.tsx`, `TeamsLanding.loading.stories.tsx`, `NewsListingClient.stories.tsx`) used to fail to even **import** under this project — `ReferenceError: __dirname is not defined`, thrown while loading `next/server`'s `userAgent()` transitively via `src/lib/effect/runtime.ts` (each imported a route's `loading.tsx`, which imported data constants straight from its sibling `page.tsx`). #3188 decoupled `loading.tsx` from `page.tsx` (a standalone `copy.ts`) for an unrelated reason (the same crash, but under Storybook's Vite build) and closed this import-time gap too — all three now import and run cleanly, so `vitest.storybook.config.ts` no longer excludes them.
- addon-vitest's own default `runConfig` runs axe (`@storybook/addon-a11y`) against every story, standalone-CLI or not — there is no public plugin option to turn it off, but Vitest's own `test.provide`/`inject` lets a Node-side config value reach the browser test context under the SAME key the (UI-panel-only) provider would use, which `vitest.storybook.config.ts` uses to force it off for this run without touching `.storybook/preview.ts` or the interactive a11y panel. Measured 2026-09-25: 48.3s → 37.7s for the full run with it off.
- A synchronous "no arrow" / absence query right after mount can read a fixture before a late webfont-swap or coalesced `ResizeObserver` remeasure has run — `await settle(window)` (`test/storybook/settle.ts`, aliased as `@test-storybook/settle`) waits both out before asserting an absence.
- A cold-load fixture that needs `window.location.hash` set BEFORE mount cannot assign it inside a decorator's render body — the React Compiler ESLint rule (`react-hooks/immutability`) correctly rejects a component modifying a value outside itself. Use a `loaders` entry instead (`test/storybook/coldLoadHash.ts`'s `armColdLoadHash`, `@test-storybook/coldLoadHash`) — loaders run before mount too, but they are not a component render function. Pair it with `tags: ["!autodocs"]` on the story: the docs page renders every story's `loaders`/decorators on one shared page without ever running `play`, and this mutates the shared `location.hash` as a side effect of merely being displayed — `!autodocs` keeps it out of that page entirely, which is also why `play` (not an unmount effect) is where the reset belongs: with `!autodocs` in place, `play` is the only context this story's loader ever runs in.
