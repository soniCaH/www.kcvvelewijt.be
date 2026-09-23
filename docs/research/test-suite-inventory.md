# Test-suite inventory — measured 2026-09-22

Wayfinder ticket [#3079](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3079), map [#3078](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078). Nothing here is a decision; it is the measured baseline the map's decisions stand on.

**How to read the numbers.** Local numbers were measured on `main` at `2aac592a` on an Apple M1 Pro (8 cores, 32 GB), Node 24.20.0, pnpm 10.34.5, with the desktop in use: the 1-minute load average was 7.6 before the first run and 12–32 during the Vitest runs. They are _contended_ numbers, which is also what a `/ralph-afk` wave sees. CI numbers come from GitHub Actions (`ubuntu-latest`, 4 vCPU) over the 30 days 2026-08-23 → 2026-09-22: 925 `ci.yml` runs, 793 `e2e.yml` runs, a 40-run job-level sample, and the logs of the latest green run of each workflow. Every number has its command in [§11](#11-commands-that-produced-the-numbers).

## 1. The suite at a glance

| Layer                     | Where                                                           | Files                          | Tests / captures                  | Local wall                          | CI wall (step)                             | Runs on                                             |
| ------------------------- | --------------------------------------------------------------- | ------------------------------ | --------------------------------- | ----------------------------------- | ------------------------------------------ | --------------------------------------------------- |
| Vitest, happy-dom         | `apps/web`                                                      | 370                            | 13 608                            | 130 s (146 s with `--coverage`)     | 238 s median, 299 s p90 (with coverage)    | `check-all`, `ci.yml` quality-checks                |
| Vitest, node              | `apps/api`                                                      | 39                             | 681                               | 5 s                                 | 12 s (1 s when Turbo-cached)               | `ci.yml` quality-checks                             |
| Vitest, happy-dom         | `packages/sanity-studio`                                        | 46                             | 324                               | 11 s                                | 1 s cached, 23 s max                       | `check-all` (studio), `ci.yml`                      |
| Vitest, node              | `packages/api-contract`                                         | 5                              | 49                                | 0.7 s                               | 1 s                                        | `ci.yml`                                            |
| Vitest                    | `packages/sanity-schemas`, `apps/studio`, `apps/studio-staging` | 0                              | 0                                 | —                                   | — (no `test` script; Turbo skips them)     | nowhere                                             |
| Storybook VR              | `apps/web`                                                      | 208 story files, 183 VR-tagged | 1 037 story runs, 3 044 baselines | refused (projected ~2.5 h emulated) | 535 s suite, 639 s job median              | every push to `main`; PRs that touch visual paths   |
| Playwright E2E            | `apps/web`                                                      | 7 specs                        | 56 tests                          | see [§4](#4-playwright-e2e)         | 68 s suite, 191 s run median               | `e2e.yml` on PRs and `main` pushes                  |
| Lint / type-check / build | `apps/web`                                                      | —                              | —                                 | 30 s / 4 s / 29 s                   | 25 s / 5 s / 2 s median (cache), 60 s miss | `check-all`, pre-commit, `ci.yml`                   |
| Storybook build           | `apps/web`                                                      | —                              | —                                 | 27 s                                | 34 s                                       | `ci.yml` quality-checks, VR bot, every local `vr:*` |

Totals: 460 Vitest files and 14 662 Vitest tests across four workspaces; 3 044 VR baselines; 56 E2E tests. Of the 13 608 web tests, **7 382 live in one file** (`src/app/__tests__/cross-page-consistency.test.ts`, a parametric matrix) — it runs in 1.1 s.

## 2. Vitest

### 2.1 `apps/web` — where the time goes

Vitest's own phase breakdown (CPU seconds summed across workers, so they exceed the wall time):

| Run                               | Wall  | transform | setup | import | environment | tests |
| --------------------------------- | ----- | --------- | ----- | ------ | ----------- | ----- |
| Local, no coverage                | 130 s | 22 s      | 94 s  | 509 s  | 142 s       | 81 s  |
| Local, `--coverage`               | 144 s | 22 s      | 112 s | 527 s  | 149 s       | 74 s  |
| CI latest green run, `--coverage` | 289 s | 9 s       | 89 s  | 436 s  | 143 s       | 81 s  |

The assertions themselves are ~80 s of CPU in every run, about 10 % of the total; module import is ~60 %, environment (happy-dom boot per file) ~17 %, setup ~11 %. `tests/setup.ts` is 20 lines (jest-dom, RTL cleanup, a `next/font/google` mock); the setup cost is per-file fixed overhead × 370 files, not the file's content.

Per-file distribution, local: median 57 ms, p90 317 ms, 2 files over 5 s, 1 over 10 s; the sum of per-file times is 78 s against a 130 s wall.

### 2.2 `apps/web` — slowest 20 files

| Local ms | CI ms | File                                                                             | Note                                                   |
| -------: | ----: | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
|   12 957 | 8 638 | `test/hooks/pre-commit.test.ts`                                                  | spawns real ESLint through lint-staged                 |
|    7 079 | 6 333 | `test/hooks/trigger-psd-sync.test.ts`                                            | spawns the shell script                                |
|    4 838 | 1 658 | `test/hooks/check-branch.test.ts`                                                | spawns the hook                                        |
|    4 023 | 4 269 | `src/components/search/SearchInterface.test.tsx`                                 | StrictMode timing, `waitFor` 1–3 s budgets             |
|    3 764 | 5 241 | `src/components/share/SharePage/SharePage.test.tsx`                              |                                                        |
|    2 803 | 2 862 | `src/components/organigram/HubSearch/HubSearch.test.tsx`                         |                                                        |
|    1 951 | 1 462 | `src/components/design-system/JerseyIllustration/player-figure-variant.test.ts`  | one 1.4 s property-style test (known starvation flake) |
|    1 855 |     — | `test/hooks/wave-check.test.ts`                                                  | spawns `git merge-tree`                                |
|    1 104 | 1 082 | `src/components/hulp/HulpFinder/HulpFinder.test.tsx`                             |                                                        |
|      873 |     — | `src/components/layout/MatchStrip/MatchStripView.test.tsx`                       |                                                        |
|      778 | 1 375 | `src/components/calendar/CalendarWidget/CalendarWidget.test.tsx`                 |                                                        |
|      624 |   743 | `src/components/calendar/CalendarSubscribePanel/CalendarSubscribePanel.test.tsx` |                                                        |
|      608 |     — | `src/app/(main)/club/geschiedenis/HistoryContent.test.tsx`                       |                                                        |
|      593 |   702 | `src/components/search/SearchForm.test.tsx`                                      |                                                        |
|      589 | 1 361 | `src/components/home/UpcomingMatches/UpcomingMatches.test.tsx`                   |                                                        |
|      581 |   842 | `src/components/club/ContactPage/ContactPage.test.tsx`                           |                                                        |
|      547 |   665 | `src/components/team/TeamMatchesSection/TeamAgendaRow.test.tsx`                  |                                                        |
|      519 |     — | `src/components/jeugd/JeugdEditorialGrid/JeugdEditorialGrid.test.tsx`            |                                                        |
|      508 |     — | `src/components/organigram/MemberDetailPanel/MemberDetailPanel.test.tsx`         |                                                        |
|      496 |     — | `src/components/event/EventsBrowser/EventsBrowser.test.tsx`                      |                                                        |

CI-only entries in its top 20 that are not in the local top 20: `src/app/__tests__/cross-page-consistency.test.ts` 1 148 ms (7 382 tests), `src/app/__tests__/loading-envelope.test.tsx` 766 ms, `CalendarMonth.test.tsx` 758 ms, `MembershipForm.test.tsx` 728 ms.

The four `test/hooks/*` files are the four slowest files and together cost 27 s of the 78 s file total locally: they are process-spawning integration tests of shell scripts, run inside the unit runner.

### 2.3 `apps/web` — slowest 20 individual tests (local)

|    ms | File                                  | Test                                                                             |
| ----: | ------------------------------------- | -------------------------------------------------------------------------------- |
| 5 681 | `test/hooks/pre-commit.test.ts`       | apps/web ESLint config in the lint-staged context enforces the Motion rules      |
| 4 018 | `test/hooks/pre-commit.test.ts`       | … skips apps/web/scripts — and only it                                           |
| 2 350 | `test/hooks/trigger-psd-sync.test.ts` | summarises what actually committed, players and staff counted separately         |
| 2 314 | `test/hooks/trigger-psd-sync.test.ts` | requests /\_\_scheduled exactly once                                             |
| 2 301 | `test/hooks/trigger-psd-sync.test.ts` | names the target dataset before it writes                                        |
| 2 183 | `test/hooks/pre-commit.test.ts`       | … leaves a deliberate eslint-disable comment alone                               |
| 1 405 | `player-figure-variant.test.ts`       | lever ranges keeps every lever inside its documented span                        |
|   734 | `test/hooks/pre-commit.test.ts`       | .husky/pre-commit succeeds, and says so, when every check passes                 |
|   673 | `test/hooks/wave-check.test.ts`       | rule vs code — names the rule branch                                             |
|   593 | `test/hooks/wave-check.test.ts`       | rule vs code — does not pair a rule branch …                                     |
|   588 | `test/hooks/wave-check.test.ts`       | rule vs code — stays quiet when no branch …                                      |
|   429 | `SearchInterface.test.tsx`            | Double-fetch guard on submit and typeahead (#2784) issues exactly one fetch      |
|   383 | `SearchInterface.test.tsx`            | keeps the search field focused while a debounced auto-search runs                |
|   321 | `SharePage.test.tsx`                  | picking a match by its unique datalist label keeps the rendered matchup          |
|   310 | `HubSearch.test.tsx`                  | opens the member panel when a person is chosen and a provider is present         |
|   303 | `SharePage.test.tsx`                  | picking the second of two matches that share a matchName badges the second squad |
|   279 | `SharePage.test.tsx`                  | picking a different known match replaces the badge                               |
|   274 | `EventMonthList.test.tsx`             | renders a month heading per chronological group                                  |
|   270 | `HubSearch.test.tsx`                  | Escape closes the listbox but keeps focus in the input                           |
|   270 | `HulpFinder.test.tsx`                 | caps the "Alles" preview to the top 3 per category                               |

### 2.4 The other workspaces

| Workspace                 | Files | Tests | Local wall | Phase split (local)                          | Slowest files                                                                                                                                                                                                |
| ------------------------- | ----: | ----: | ---------: | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api`                |    39 |   681 |      5.0 s | import 20 s, tests 6.4 s                     | `src/search/sanity-index-sync.test.ts` 3 256 ms, `src/search/vectorize.test.ts` 1 024 ms, `src/psd/service.test.ts` 379 ms, `src/cache/kv-cache.test.ts` 262 ms, `src/webhooks/index-handler.test.ts` 194 ms |
| `packages/sanity-studio`  |    46 |   324 |     10.8 s | import 45 s, environment 15.5 s, tests 0.5 s | `src/inputs/respondent-picker.test.tsx` 94 ms; nothing else above 40 ms                                                                                                                                      |
| `packages/api-contract`   |     5 |    49 |      0.7 s | import 2 s, tests 49 ms                      | —                                                                                                                                                                                                            |
| `packages/sanity-schemas` |     0 |     0 |          — | no `test` script                             | —                                                                                                                                                                                                            |

`apps/api`'s two search tests are 84 % of its runtime. `packages/sanity-studio` spends 0.5 s in assertions and 60 s of CPU booting happy-dom and importing Sanity UI.

Config facts: `apps/web` and `packages/sanity-studio` run happy-dom with `globals: true`; `apps/api` and `packages/api-contract` run node. No workspace sets `pool`, `isolate`, `testTimeout`, `maxWorkers`, `retry` or `sequence` — all Vitest defaults (5 s test timeout, forks pool, full isolation, workers = CPU count). `apps/web` disables happy-dom child-frame navigation (iframe fetch noise) and excludes `test/e2e/**`. `packages/api-contract` pins `include: ['src/**/*.test.ts']` so a stale `dist/` twin cannot double-count.

## 3. Storybook visual regression

### 3.1 Coverage of the story set

| Count | What                                                                                                                                                                                                                                                                      |
| ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   208 | story files                                                                                                                                                                                                                                                               |
|   183 | files with the `vr` tag → run in CI (Jest reports them as 183 suites)                                                                                                                                                                                                     |
|    25 | files with no `vr` tag → never captured. `Pages/*` and `*.loading.stories.tsx` by design; also `SectionNavChip`, `SkeletonBars`, `LoadingAnnouncement`, `MapEmbed`, `BestuurPage`, `ContactPage`, `SharePage`, `SponsorsPage`, `ScheurkalenderPage`, `Homepage`, `Ultras` |
|    20 | `vr-skip` story tags across 10 files (discovery-time exclusion; not counted as skipped)                                                                                                                                                                                   |
|     9 | stories with `parameters.vr.disable = true` across 6 files (visited, not captured)                                                                                                                                                                                        |
|    20 | stories with a scoped `parameters.vr.viewports` (fewer than 3 captures)                                                                                                                                                                                                   |
|     1 | structural-assertion tag (`vr-assert-mobile-overflow`)                                                                                                                                                                                                                    |
| 1 037 | story runs in the latest CI job; 1 062 total with the 25 untagged                                                                                                                                                                                                         |
| 3 044 | committed baselines under `apps/web/test/vr/__snapshots__/` (3 viewports × 1 037 minus the scoped ones)                                                                                                                                                                   |

### 3.2 Runtime

| Where                                 | Wall                                        | Evidence                                                             |
| ------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| CI `Visual Regression` job            | 639 s median, 664 s p90, 721 s max (n = 26) | 40-run sample                                                        |
| … of which the suite step             | 535–538 s                                   | latest green run: Jest `Time: 534.688 s`                             |
| … container init + install + download | ~85 s                                       | `Initialize containers` 40 s, checkout 12 s, node 15 s, install 11 s |
| CI `Build Storybook` step             | 34 s median (n = 29)                        |                                                                      |
| VR bot `update-baselines` job         | 682 s (suite step 558 s), 2 runs in 30 days |                                                                      |
| Local Storybook build (native)        | 27 s                                        |                                                                      |
| Local full capture                    | **refused** by `scripts/vr-docker.mjs`      | projected ~2.5 h under the `linux/amd64` pin (3.6× emulation, #2370) |
| Local scoped capture                  | 164–179 s for a 57-baseline scope           | `docs/agents/testing-ops.md` §"The amd64 pin"                        |

Jest prints a time for 143 of the 183 story files: median 7.9 s, p90 15.3 s, max 34.5 s; the printed times sum to 1 395 s against a 535 s wall, so the runner is achieving ~2.6× parallelism on the 4-vCPU runner (Jest's default `cores − 1` workers).

Slowest 20 story files on CI (seconds): `features-articles-newscard` 34.5, `features-teams-teamagendarow` 31.6, `features-articles-editorialhero` 31.0, `features-articles-articlebody` 23.4, `ui-button` 19.8, `features-home-firstteamsblock` 19.7, `features-articles-videoblock` 19.2, `ui-monolabel` 18.9, `ui-input` 18.3, `ui-tapedfigure` 18.2, `ui-select` 16.7, `ui-sectionheader` 16.4, `ui-spinner` 16.4, `features-calendar-calendaragenda` 16.4, `ui-pullquote` 15.3, `ui-tapestrip` 15.3, `ui-textarea` 15.2, `features-matches-matchhero` 15.1, `ui-editorialheading` 15.0, `ui-downloadbutton` 14.7. A story file's time is its story count × 3 viewports × the per-capture settle sequence, so the wide atom files (`ui-*`) dominate without any single slow story.

### 3.3 The capture contract (`apps/web/.storybook/test-runner.ts`)

Per story and viewport: determinism stylesheet (animations, transitions, caret off), mouse parked off-page, `waitForPageReady`, font settle (race against 2 s), viewport resize with a `clientWidth` wait (race against 2 s, **swallowed**), font settle again, scroll to bottom and back, `networkidle` (race against 3 s, **swallowed**), lazy images forced eager and awaited (race against 1.5 s), image decode, two animation frames, structural assertions, then a full-height clip screenshot compared with `failureThreshold: 0.0005` percent. Clock frozen to `VR_FROZEN_NOW_ISO`, `Math.random` seeded and reset per story, YouTube/Vimeo/googlevideo hosts aborted. Jest `--testTimeout 120000`; first navigation timeout 90 s; `--includeTags vr --excludeTags vr-skip`.

Every wait that races a timeout is a soft wait: when the budget expires the capture proceeds anyway. That is where #1731 (image race) and #2834 (Typekit swap) lived.

## 4. Playwright E2E

### 4.1 Shape

7 spec files, 56 tests, one `chromium` project (Desktop Chrome), `fullyParallel`, `workers: 2` on CI, `retries: 1` on CI and 0 locally, `trace/video: retain-on-failure`, `screenshot: only-on-failure`. `webServer` runs `next start` on `localhost:3000` with `reuseExistingServer: true` locally and a 180 s start budget; `BASE_URL` bypasses it. Reporters on CI: `github`, `list`, `html`, and `test/reporters/github-summary.ts` (writes flaky/skipped counts to the job summary, never fails the run — #2971).

The suite reads a **different backend per trigger**. `e2e.yml` and `ci.yml` select the GitHub environment by ref: PRs get `Preview` (`KCVV_API_URL` = the staging Worker `kcvv-api-staging`, dataset `staging`); pushes to `main` get `Production` (the production Worker, dataset `production`). The map's note that E2E runs "against live production" is only true for `main` pushes.

### 4.2 Runtime and condition on CI

| Metric (30 days)                                | Value                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `e2e.yml` runs                                  | 793: 444 success, 17 failure, 60 cancelled, 272 skipped (draft PRs)            |
| Run wall, successes                             | 191 s median, 235 s p90, 480 s max, 111 s min                                  |
| Latest green job breakdown                      | 260 s: init 25 s, install 15 s, `next build` 78 s, suite 68 s, post-steps 51 s |
| Manual re-runs (`run_attempt > 1`)              | 8                                                                              |
| Green runs with ≥ 1 `flaky` test, last 12 green | **9 of 12** (1 flaky in 8 runs, 3 flaky in 1 run)                              |
| `skipped` on PR runs (staging data)             | 0–1                                                                            |
| `skipped` on `main` pushes (production data)    | 4–5                                                                            |

Slowest tests in the latest green run (seconds, first attempt): `section-nav.spec.ts:313` cold-load-with-hash 8.0 (failed, passed on retry 3.1), `homepage.spec.ts:103` hero hover at three widths 7.3, `section-nav.spec.ts:217` OrganigramSectionNav scroll-spy 7.0 (failed, retry 3.4), `routes.spec.ts:75` `/club/ultras` 5.4, `scroll-arrows.spec.ts:255` FilterTabs held hover 4.6, `homepage.spec.ts:30` no console errors 4.4, `evenementen.spec.ts:80` ticket → detail 4.4, `section-nav.spec.ts:241` TeamSectionNav chip 3.4 (failed, retry 3.6), then 2.2 s and below. All three flakes in that run are `section-nav.spec.ts` (#3077).

### 4.3 Runtime locally

Against a `next start -p 3010` of the local build, `KCVV_API_URL` pointed at the staging Worker and `BASE_URL=http://localhost:3010`: **56 passed, 0 skipped, 0 flaky, 0 failed in 31 s** with 4 workers and `retries: 0`, at a 1-minute load average of 20. The server answered 2 s after start. Slowest tests (seconds): `homepage.spec.ts:103` hero hover at three widths 6.6, `scroll-arrows.spec.ts:255` FilterTabs held hover 4.5, `homepage.spec.ts:183` sponsors greyscale hover 4.4, `routes.spec.ts:105` `/spelers/[slug]` 4.0, `scroll-arrows.spec.ts:225` FilterTabs narrow phone 3.9, the four `article-detail.spec.ts:46` body-renderer cases 3.4–3.6, `section-nav.spec.ts:186` TeamSectionNav 3.1. Locally the section-nav tests that flake on CI ran once and passed.

Two things bit before that number existed, both worth a row in the flake ledger:

- `reuseExistingServer: true` plus a hard-coded `localhost:3000` means the suite **silently targets whatever is listening on port 3000**. On this machine that was a `next-server (v15.5.24)` from `~/Sites/KCVV/uitbetaling`, up for 45 minutes: 1 passed, 20 failed on `Failed to fetch sitemap.xml: 404`, 35 skipped, in 31 s, with `KCVV_API_URL` pointing at the staging Worker _or_ at nothing. The run looks like a data problem and is a port clash.
- `apps/web/.env.local` points `KCVV_API_URL` at `http://localhost:8787` (a local `wrangler dev`), so `next build` and `next start` fetch a BFF that is usually not running. With the BFF unreachable the data guards skip 35 of 56 tests.

### 4.4 Data guards

31 static `test.skip(condition, reason)` sites: `homepage.spec.ts` 7, `scroll-arrows.spec.ts` 6, `section-nav.spec.ts` 6, `routes.spec.ts` 5, `evenementen.spec.ts` 3, `wedstrijden.spec.ts` 3, `article-detail.spec.ts` 1. Reasons seen at runtime: "Fewer than 6 upcoming matches — no expand button", "No homepage hero article in this environment", "Sponsors section absent — staging seed gap", "no event-doc tickets in the feed", "no upcoming events on the dataset". Two fixed sleeps (`waitForTimeout`) and two explicit 5 s budgets (`scroll-arrows.spec.ts:120`, `section-nav.spec.ts:181` with `polling: 50`). No `fixme`, `only` or `slow`.

## 5. Lint, type-check, build

| Check                              | Local                                 | CI                                                           | Notes                                                                                                   |
| ---------------------------------- | ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `@kcvv/web` lint                   | 30 s                                  | 25 s median, 9 of 29 runs cached (< 10 s)                    |                                                                                                         |
| `@kcvv/web` type-check             | 4 s (tsgo)                            | 5 s median                                                   | first local run failed in 6 s — see [§9](#9-local-environment-findings)                                 |
| `@kcvv/web` build                  | 29 s (Turbopack) / 14 s rebuild       | 2 s median = remote-cache hit in 21 of 29; 59–61 s on a miss |                                                                                                         |
| `@kcvv/web` `check-all`            | ≈ 3.2 min (30 + 4 + 130 + 29)         | —                                                            | the AFK brief's gate; serial `npm run` chain                                                            |
| root `pnpm type-check`             | 2 s warm, 0 s Turbo-cached            | —                                                            | what pre-commit runs; all 7 workspaces via `turbo`                                                      |
| knip                               | —                                     | 3 s                                                          | `ci.yml` only                                                                                           |
| `@kcvv/api` lint                   | **broken** (stale `.bin/eslint` shim) | **never runs**                                               | not in `ci.yml`; lint-staged only runs prettier on `apps/api`; `apps/api` has no `eslint` devDependency |
| `@kcvv/api-contract` lint          | no script                             | no script                                                    |                                                                                                         |
| `@kcvv/sanity-schemas` lint / test | no scripts                            | no scripts                                                   | type-check only                                                                                         |
| `@kcvv/studio` typegen drift       | —                                     | 1 s median, 28 s max                                         | `Sanity types in sync` step                                                                             |
| `pnpm audit`                       | —                                     | 1 s                                                          | `continue-on-error: true`                                                                               |
| CodeQL                             | —                                     | 92 s median, 580 runs                                        | every PR push, drafts included; weekly schedule                                                         |

## 6. Escape hatches

| Hatch                                      | Where                              | Count / value                                                                                                                   |
| ------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Playwright `retries`                       | `test/e2e/playwright.config.ts`    | 1 on CI, 0 local; 9 of the last 12 green runs used it                                                                           |
| Playwright `test.skip` data guards         | 7 specs                            | 31 static; 0–1 fire on PRs, 4–5 on `main`, 35 with the BFF down                                                                 |
| Playwright fixed sleeps                    | `test/e2e`                         | 2 `waitForTimeout`                                                                                                              |
| Playwright raised budgets                  | `test/e2e`                         | 2 × 5 s; `webServer.timeout` 180 s                                                                                              |
| Playwright flaky reporting                 | `test/reporters/github-summary.ts` | reports, never fails; `failOnFlakyTests` unset                                                                                  |
| Vitest `it/describe.skip`                  | all workspaces                     | 0 static; 1 runtime self-skip (`test/vr/structural-assertions.test.ts`, on live-sitemap shape)                                  |
| Vitest `.only` / `.todo` / `fixme`         | all workspaces                     | 0                                                                                                                               |
| Vitest raised `waitFor` timeouts           | `SearchInterface.test.tsx`         | 4 (1 000–3 000 ms)                                                                                                              |
| Vitest `testTimeout` / `retry` config      | vitest configs                     | none set (defaults 5 s / 0)                                                                                                     |
| `eslint-disable` in test files             | 26 files                           | 38 lines, 34 of them `@typescript-eslint/*` next-line                                                                           |
| `no-restricted-syntax` in-body import rule | `apps/web/eslint.config.mjs:190`   | the #2378 rule, active                                                                                                          |
| VR `vr-skip` tag                           | 10 story files                     | 20 stories                                                                                                                      |
| VR `parameters.vr.disable`                 | 6 story files                      | 9 stories                                                                                                                       |
| VR untagged (never captured)               | 25 story files                     | see §3.1                                                                                                                        |
| VR soft waits                              | `.storybook/test-runner.ts`        | viewport 2 s, fonts 2 s, networkidle 3 s, images 1.5 s — all proceed on expiry                                                  |
| VR threshold                               | `.storybook/test-runner.ts`        | `failureThreshold: 0.0005` percent; `--testTimeout 120000`; navigation 90 s                                                     |
| `--passWithNoTests`                        | anywhere                           | 0                                                                                                                               |
| `continue-on-error: true`                  | `ci.yml`                           | 2 (`pnpm audit`, VR diff artifact download)                                                                                     |
| Manual workflow re-runs                    | GitHub                             | `ci.yml` 7, `e2e.yml` 8 in 30 days                                                                                              |
| Turbo `test` cache blind spot              | `turbo.json` `test.inputs`         | `src/**`, `tests/**`, `vitest.config.*` only — **`apps/web/test/**` is not hashed** (0 of 1 253 hashed inputs), nor `.husky/**` |
| `ALLOW_MAIN_COMMIT=1`                      | `.husky/branch-guard.sh`           | human escape hatch                                                                                                              |

The Turbo blind spot is the one with teeth: the four `test/hooks/*.test.ts` files, `test/scripts/vr-docker.test.ts`, `test/vr/structural-assertions.test.ts` and every fixture under `test/fixtures/` run under Vitest but do not participate in the cache key. A change to only those files, or to `.husky/*`, can restore a cached green `Run tests` on CI without running anything.

## 7. Where each check runs

| Surface                                | Trigger                                                                                                     | Runs                                                                                                                                                                                                                                                                        | Draft PRs                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Claude Code hooks (`.claude/hooks`)    | every Bash / Edit tool call                                                                                 | branch guard, main-edit warning — no tests                                                                                                                                                                                                                                  | —                                                               |
| `.husky/pre-commit`                    | `git commit`                                                                                                | branch guard → `lint-staged` (eslint+prettier on `apps/web` js/ts; prettier on `apps/web` json/md/yml and `apps/api`; nothing on `packages/*`) → root `turbo type-check` (7 workspaces)                                                                                     | —                                                               |
| `.husky/commit-msg`                    | `git commit`                                                                                                | commitlint                                                                                                                                                                                                                                                                  | —                                                               |
| `.husky/pre-merge-commit`              | `git merge`                                                                                                 | branch guard                                                                                                                                                                                                                                                                | —                                                               |
| `check-all` (`apps/web`)               | AFK brief, `/ralph`, SKILL.md step                                                                          | lint → type-check → vitest (no coverage) → `next build`                                                                                                                                                                                                                     | —                                                               |
| `check-all` (`packages/sanity-studio`) | manual                                                                                                      | type-check → lint → vitest                                                                                                                                                                                                                                                  | —                                                               |
| `scripts/wave-check.sh`                | `/ralph-afk` orchestrator                                                                                   | `git merge-tree` pairwise + rule-vs-code path heuristic — no tests                                                                                                                                                                                                          | —                                                               |
| `ci.yml` · Quality Checks + Build      | PR (non-draft) and `main` push; `**.md`, `docs/**` ignored                                                  | lint web → knip → type-check web → vitest web `--coverage` → type-check api → vitest api → vitest api-contract → lint+type-check studio & sanity-studio → vitest sanity-studio → build studio → typegen drift → audit → codecov → `next build` → Storybook build + artifact | skipped                                                         |
| `ci.yml` · VR — Detect visual changes  | every PR event, **drafts included**                                                                         | `dorny/paths-filter` on `apps/web/src`, `.storybook`, `public`, `package.json`, lockfile (12–15 s)                                                                                                                                                                          | runs — 359 such filter-only runs in 30 days                     |
| `ci.yml` · Visual Regression           | after quality-checks; `main` push always, PR only if the filter matched                                     | `vr:ci` in the `playwright:v1.60.0-noble` container                                                                                                                                                                                                                         | skipped                                                         |
| `ci.yml` · VR — Post diff comment      | VR failure on a same-repo PR                                                                                | pushes diff PNGs to `vr-diffs/pr-N`, sticky comment                                                                                                                                                                                                                         | —                                                               |
| `ci.yml` · Deploy API staging          | non-draft same-repo PR after quality-checks                                                                 | `wrangler deploy --env staging`                                                                                                                                                                                                                                             | skipped                                                         |
| `ci.yml` · Deploy API + Studio         | `main` push                                                                                                 | production Worker + Sanity Studio                                                                                                                                                                                                                                           | —                                                               |
| `e2e.yml`                              | PR (non-draft) and `main` push, on `apps/web/src`, `public`, `test/e2e`, `api-contract`, lockfile, `.nvmrc` | build api-contract → `next build` → Playwright (Preview env on PRs, Production on `main`)                                                                                                                                                                                   | skipped (272 in 30 days)                                        |
| `vr-baseline-update.yml`               | **every** issue/PR comment                                                                                  | job `if` matches `@kcvv-bot update-vr-baselines` from a maintainer; rebuilds Storybook, `vr:ci:update`, commits baselines                                                                                                                                                   | 756 triggers, 752 skipped, 2 ran                                |
| `vr-diff-cleanup.yml`                  | PR closed                                                                                                   | deletes `vr-diffs/pr-N`                                                                                                                                                                                                                                                     | runs                                                            |
| `main-red-alert.yml`                   | `ci.yml` / `e2e.yml` failure on `main`                                                                      | opens or comments the `main is red` issue                                                                                                                                                                                                                                   | — (7 fired)                                                     |
| `codeql.yml`                           | every PR push, weekly cron                                                                                  | CodeQL                                                                                                                                                                                                                                                                      | runs                                                            |
| Vercel                                 | every push (no `ignoreCommand`)                                                                             | `pnpm turbo build --filter=@kcvv/web` preview / production                                                                                                                                                                                                                  | builds; not measured (no Vercel API access from this inventory) |
| `/ralph-afk` brief                     | per wave agent, in its worktree                                                                             | `check-all`, scoped `vr:update:story` captures against the shared Docker daemon                                                                                                                                                                                             | —                                                               |

So "draft PRs skip all CI" is not quite true: the paths-filter job, CodeQL, Vercel builds and the baseline-bot trigger check all run on drafts.

## 8. Turbo cache

Remote cache is live: `TURBO_TEAM=sonicahs-projects` (repo variable) with `TURBO_TOKEN` as a secret. In the 40-run sample the `Build Next.js` step hit in 21 of 29 runs (2 s median, 59–61 s on a miss), `Lint` hit in 9, `Run tests` hit in 10 (< 10 s), `Type check` was 5 s median regardless (tsgo is that fast). Split by trigger: on PRs the build hit 15 of 17 times but tests only 3 and lint 2; on `main` pushes tests hit 7 of 12, lint 7 and build 6. That split is consistent with `e2e.yml` building the same package on the same commit in parallel (whichever finishes first seeds the cache for the other) and with a squash-merged `main` push carrying the PR's exact tree. Locally, `pnpm run type-check` at the root goes from 2 s to 0 s on the second run.

Task inputs: `build` hashes the four env vars it lists; `test` hashes `src/**`, `tests/**`, `vitest.config.*` (see §6 for what that misses); `lint` and `type-check` use Turbo defaults (whole package).

## 9. Local environment findings

Three things went wrong on the `main` checkout before a single suite number could be trusted. None of them exists in a fresh worktree, which is why wave agents do not report them and the owner's checkout does.

1. **Stale `.next/dev/types/validator.ts`** (written by an earlier `next dev`, referencing routes that no longer exist) made both `tsgo --noEmit` and `next build` fail in 6 s with `TS2307` on seven pages. `rm -rf apps/web/.next/dev` fixed it; `next build` regenerates `.next/types` but never touches `.next/dev`. `tsconfig.json` includes `.next/types/**/*.ts`, which is what pulls the dev copy in.
2. **Stale `apps/api/node_modules/.bin/eslint`** points at `node_modules/.pnpm/eslint@10.9.1/…`, which the store no longer has (it is `eslint@10.9.1_jiti@2.7.0` now). `pnpm install --frozen-lockfile` reports up-to-date in 7 s and leaves the shim broken, because `apps/api` does not declare `eslint` and only ever found it by hoisting.
3. **Port 3000 was owned by another project's dev server** (see §4.3). The E2E suite reused it without a warning.

Also observed: the 1-minute load average sat between 7.6 and 32 on 8 cores throughout; `pnpm install` in a fresh worktree took 18 s; the `.env.local` here points the web app at a local BFF that was not running.

## 10. CI cost

The repository is public, so GitHub-hosted standard runners are free: **the money cost is €0**. The cost is wall-clock and runner-minutes.

| 30-day totals (2026-08-23 → 09-22) | Runs |       Runner-minutes |
| ---------------------------------- | ---: | -------------------: |
| `ci.yml` full runs (≥ 60 s)        |  566 |                7 748 |
| `ci.yml` filter-only runs (< 60 s) |  359 |                  133 |
| `e2e.yml` (non-skipped)            |  521 |                1 564 |
| `codeql.yml`                       |  580 |                  904 |
| `vr-baseline-update.yml`           |    4 |                   44 |
| `vr-diff-cleanup.yml`              |  216 |                   28 |
| `main-red-alert.yml`               |    7 |                    1 |
| **Total**                          |      | **10 422** (≈ 174 h) |

Job-minutes track wall-minutes here (ratio 0.95–1.10 in the sample) because the only parallel job pair is the staging deploy beside VR. At the private-repo Linux rate of $0.008/min this would be ≈ $83/month; at the 2 000 free private minutes it would overrun by 5×.

Per run: a full `ci.yml` run is 14.9 job-minutes median on a PR and 15.9 on `main` (max 19.4). The critical path on a PR that touches visual paths is Quality Checks (401 s median) then VR (639 s) ≈ **17.3 min**; a PR that does not is ≈ 7 min; `e2e.yml` runs alongside at ≈ 3.2 min. Every push to `main` pays the full path again including VR (12 of 12 sampled pushes ran it).

Volume: 220 PRs opened, 213 merged, 212 `main` pushes in 30 days — ≈ 7 merged changes a day, each costing ≈ 20 job-minutes on the PR plus ≈ 19 on the resulting `main` push, or **≈ 39 runner-minutes and ≈ 35 min of serial CI wall time per merged change**. 84 `ci.yml` runs and 60 `e2e.yml` runs were cancelled by `concurrency` when a newer push superseded them.

## 11. Commands that produced the numbers

Counts and escape hatches (repo root, `main` at `2aac592a`):

```bash
# test files per workspace
for ws in apps/web apps/api packages/sanity-studio packages/api-contract packages/sanity-schemas; do
  git ls-files "$ws" | grep -E '\.test\.(ts|tsx)$' | grep -v '/test/e2e/' | wc -l; done
git ls-files apps/web | grep -E '/test/e2e/.*\.spec\.ts$' | wc -l          # 7
git ls-files apps/web | grep -E '\.stories\.tsx?$' | wc -l                  # 208
git ls-files apps/web | grep -E '\.stories\.tsx?$' | xargs grep -lE "['\"]vr['\"]" | wc -l   # 183
git ls-files apps/web/test/vr/__snapshots__ | grep -c '\.png$'              # 3044
git ls-files | grep -E '/test/e2e/.*\.spec\.ts$' | xargs grep -cE '\btest\.skip\b'          # 31 total
git ls-files | grep -E '\.(test|spec)\.(ts|tsx)$' | xargs grep -lE 'eslint-disable' | wc -l  # 26
git grep -n passWithNoTests -- . ':!pnpm-lock.yaml'                         # nothing
npx turbo run test --filter=@kcvv/web --dry-run=json \
  | jq '.tasks[] | select(.taskId=="@kcvv/web#test") | [.inputs|keys[]|select(startswith("test/"))] | length'   # 0
```

Local timings (each command alone, `PATH` prefixed with `~/.nvm/versions/node/v24.20.0/bin`, wall via `date +%s` before and after):

```bash
cd apps/web && pnpm run lint && pnpm run type-check && pnpm run build && pnpm run vr:build-storybook
cd apps/web && npx vitest run --reporter=default --reporter=json --outputFile=web-vitest.json
cd apps/web && npx vitest run --coverage
cd apps/api && npx vitest run --reporter=json --outputFile=api-vitest.json      # same for sanity-studio, api-contract
pnpm run type-check                                                              # root, what pre-commit runs
# E2E on a port nothing else owns
cd apps/web && KCVV_API_URL=https://kcvv-api-staging.kevin-van-ransbeeck.workers.dev npx next start -p 3010 &
cd apps/web && BASE_URL=http://localhost:3010 npx playwright test -c test/e2e/playwright.config.ts --reporter=list,json
# slowest files / tests from the JSON
jq -r '.testResults[] | "\(.endTime - .startTime)\t\(.name)"' web-vitest.json | sort -rn | head -20
jq -r '.testResults[] | .name as $f | .assertionResults[] | "\(.duration)\t\($f)\t\(.fullName)"' web-vitest.json | sort -rn | head -20
```

CI history and job timings:

```bash
R=repos/soniCaH/www.kcvvelewijt.be
gh api --paginate "$R/actions/workflows/ci.yml/runs?per_page=100&created=%3E%3D2026-08-23" \
  --jq '.workflow_runs[] | {id, event, conclusion, status, run_attempt, run_started_at, updated_at, head_branch}'
# duration = updated_at - run_started_at; median/p90 with jq over the JSONL; same for e2e.yml, codeql.yml, vr-*.yml
gh api "$R/actions/runs/<run-id>/jobs" --jq '.jobs[] | {name, started_at, completed_at, steps}'   # 40 latest green ci.yml runs
gh api "$R/actions/jobs/<job-id>/logs"      # latest green Quality Checks (vitest per-file ms), Visual Regression (Jest per-file s), E2E (per-test s)
gh variable list; gh variable list --env Preview; gh variable list --env Production
gh pr list --state merged --search 'merged:>=2026-08-23' --limit 500 --json number --jq length   # 213
```

Raw JSON, logs and the two Vitest result files are not committed; they lived in the session scratchpad and are reproducible with the commands above.
