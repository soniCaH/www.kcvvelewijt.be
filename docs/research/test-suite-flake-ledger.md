# Test-suite flake ledger

> Resolves [#3080](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3080), a ticket on the
> [Test suite walk map (#3078)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078).
> Measured 2026-09-22 against `main` at `ec15a8a8`. Nothing here is decided — this is the evidence
> the tool and policy decisions stand on.

## Method

Three sources, in this order:

1. **GitHub Actions history.** Every run of `ci.yml`, `e2e.yml`, `vr-baseline-update.yml` and
   `main-red-alert.yml` since 2026-06-01, filtered two ways: runs with `run_attempt > 1` (a human
   pressed re-run, so attempt 1 failed), and commits carrying both a failed and a successful run.
   For each hit, attempt 1's failed job, failed step and log were read.
2. **Green runs.** Playwright reports a test that fails then passes as `flaky` and still exits 0, so
   the twelve most recent **successful** `e2e.yml` runs on `main` were downloaded in full and grepped
   for `retry #1` / `flaky`.
3. **Issues.** Every issue matching `flake`, `flaky`, `non-deterministic`, `timeout`, `re-run`,
   `intermittent`, plus the Evidence list in the map's Notes. Each fix claim was checked against the
   file it claims to have changed.

**A caution this method earned.** A visual-regression failure on a feature branch is usually a *real*
diff, not a flake. Three recent VR reds were opened and read — `CalendarWidget › Route Skeleton` at
27.1 %, `EditorialHero › Announcement No Category` at 9.6 %, the `SearchForm` set at 0.61 % — and all
three were the intended change on that PR. Only a failure that **clears on a re-run of the same
commit** counts as a flake below.

## Headline numbers

| Measure | Value |
| --- | --- |
| Green `e2e.yml` runs on `main` that hid a retry | **7 of 12** (58 %) |
| Of those, `OrganigramSectionNav on /hulp` | **6 of 7** |
| `e2e.yml` runs re-run by hand since 2026-06-01 | 8 (7 went green on attempt 2) |
| `ci.yml` runs re-run by hand since 2026-06-01 | 8 (5 went green on attempt 2) |
| Distinct flake classes ever seen | **12** (A–L below) |
| Classes with at least one live member | **8** (B, C, G, H, I, J, K, L) |
| Classes fully closed by a named fix | 3 (D, E, F); A is mitigated only |

Two of the live classes have never been filed as an issue: the `next build` prerender fetch, and the
Cloudflare deploy step. Both turn `ci.yml` red on `main`.

## The ledger

Status values: **live** = still fires, no fix landed. **mitigated** = the fix landed, the cause still
exists but is bounded. **fixed** = the cause is gone.

| # | Flake | Layer | First seen | Root-cause class | Status | Proof |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `section-nav.spec.ts › OrganigramSectionNav on /hulp` — `aria-current` stays `null` for the whole 5 s budget | E2E | 2026-09-04 ([run 33868361845](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/33868361845)) | B — hydration vs assertion budget | **live** ([#3077](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3077)) | Retried in 6 of the 12 sampled green runs; failed on both tries and needed a workflow re-run on 2026-09-04, 09-15, 09-18 and twice on 09-21 ([35645439530](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/35645439530), [35597937790](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/35597937790)) |
| 2 | `routes.spec.ts › static routes › /kalender` — `page.goto` exceeds the 30 s test timeout | E2E | 2026-09-14 ([run 34815386797](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/34815386797)) | A — live data, cold render | **mitigated** ([#2977](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2977), [#2985](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2985)) | Three re-runs in 36 h (09-14 ×2, 09-15); `gotoBounded` now bounds the `load` wait. No recurrence in the sampled window |
| 3 | `routes.spec.ts › dynamic routes › /wedstrijd/[matchId]` | E2E | 2026-09-14 | A — live data, cold render | **mitigated** ([#2977](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2977)) | Logged in #2977's evidence table; same fix as row 2 |
| 4 | `scroll-arrows.spec.ts:315 › HorizontalSlider (RelatedRow) on /nieuws/[slug]` | E2E | 2026-09-21 ([run 35657013551](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/35657013551)) | B — measurement races layout | **live**, unfiled | Retried once in the sampled green runs; passed on retry, so it never showed in the checks list |
| 5 | `EditorialHero › Transfer Extension › smoke-test` — jest's 120 s per-test cap blown in the VR runner | VR | 2026-09-21 ([run 35666231670](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/35666231670)) | G — VR runner stall | **live**, unfiled | Turned `main` red and auto-filed [#3094](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3094); attempt 2 on the same commit passed 3041/3042 snapshots |
| 6 | Six unrelated baselines drift 0.17–0.84 % (`EditorialHubCard` ×5, `OpponentSummaryCard`) | VR | 2026-09-04 ([run 33850598103](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/33850598103)) | D — font swap races the capture | **fixed** ([#2834](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2834), closed 2026-09-17) | Same commit, attempt 2 green, and no baseline-update run touched the branch in between. `test-runner.ts` now runs `waitForFontsSettled` (a capped `fonts.load` pass, then `fonts.ready` as a backstop). No sub-1 % drift seen after 09-17 |
| 7 | Every mono element screenshotted in a substitute face | VR | before 2026-09-20 | D — font never loaded in Storybook | **fixed** ([#3030](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3030), closed 2026-09-20) | Storybook loaded Typekit only; IBM Plex Mono comes from `next/font` in a layout Storybook never renders |
| 8 | `SearchForm` stories screenshot with or without the `autoFocus` ring | VR | 2026-09-20 | E — focus state is an environment property | **fixed** ([#3033](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3033), closed 2026-09-21) | The ring depended on whether the headless page held focus, and on landing mid-`transition-shadow` |
| 9 | `NewsGrid --tablet` baselines diff ~1.6 % on PRs that do not touch NewsGrid | VR | 2026-04 | F — image load/decode races the shot | **fixed** ([#1731](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1731), closed 2026-05-12) | Baseline re-capture reported `1527/1527 pass, 0 updated`. Fix: blur-up placeholder off in Storybook + `await img.decode()` per image |
| 10 | A remote placeholder image 503s during capture and a broken baseline is committed as truth | VR | 2026-04 | F — third-party image host | **fixed** ([#1704](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1704)) | Remote `placehold.co`/Picsum URLs replaced by a Sanity-sourced local fixture pool |
| 11 | `sitemap.test.ts`, `canonical-urls.test.ts`, `metadata.test.ts` blow a 5 s budget on module import and live network I/O | Vitest | 2026-08 | C — work outside the test body, charged to the timeout | **fixed** ([#2362](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2362) → [#2367](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2367) → [#2378](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2378)) | #2362's natural experiment: same module, top-level import 21 ms vs in-body import most of 5 000 ms. Closed by hoisting the last 6 sites and an eslint rule that forbids the pattern |
| 12 | `next build` fails prerendering `/nieuws/[slug]` — `Sanity fetch failed: TypeError: fetch failed` | CI build | 2026-09-08 ([run 34212702776](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/34212702776)) | H — build-time live network | **live**, unfiled | Attempt 2 on the same commit built clean |
| 13 | `Deploy to Cloudflare Workers (staging)` — Cloudflare API returns an error | CI deploy | 2026-09-05 ([run 33966123182](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/33966123182)) | I — third-party API transient | **live**, unfiled | Attempt 2 deployed clean |
| 14 | `packages/sanity-studio` had a test red on `main` since 2026-07-02 with CI fully green | CI coverage | 2026-07-02 | J — the green light does not cover the code | **fixed** ([#2735](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2735), closed 2026-08-27) | `ci.yml` ran lint, type-check and build for the Studio, but no tests |
| 15 | A `flaky` E2E test exits the job 0 and nothing says so | CI reporting | 2026-09-15 | J — the green light hides its own condition | **mitigated** ([#2971](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2971)) | `retries: 1` is still set (`playwright.config.ts:17`); a `github-summary.ts` reporter now prints the condition, but the check itself is still green |
| 16 | 31 `test.skip` data guards silently drop E2E coverage when the dataset is thin | E2E coverage | 2026-09-15 | J — the green light covers less than it claims | **live** | Counted today: `homepage` 7, `section-nav` 6, `scroll-arrows` 6, `routes` 5, `evenementen` 3, `wedstrijden` 3, `article-detail` 1 |
| 17 | Turbo's `test` task does not hash `apps/web/test/**` | CI caching | 2026-09-22 | J — a cached green can be stale | **live**, unfiled | `turbo.json` line 21: `"inputs": ["src/**", "tests/**", "vitest.config.*"]` — the E2E and reporter sources live in `test/`, singular |
| 18 | Five parallel `docker compose run --build` calls on a stale VR image froze ~16 min at 0 % CPU | Local wave | 2026-09-21 | K — shared Docker lane, no gate | **live**, unfiled | One serial build afterwards finished in ~8 min (wave evidence, map Notes) |
| 19 | `SearchInterface.test.tsx` (StrictMode timing) fails under sibling agents' `check-all`, passes alone | Local wave | 2026-09-21 | C — CPU contention against a `waitFor` budget | **live**, unfiled, not yet reproduced under a controlled contention test | Reported independently by two wave agents. The file does use `StrictMode` + four `waitFor` blocks, which is the shape #2362 described |
| 20 | `vr -u` accepts sub-threshold diffs and leaves stale baselines; parallel captures add sub-pixel noise to unrelated baselines | Local wave / VR | 2026-09-21 | K — shared CPU during capture | **live**, unfiled | Wave evidence, map Notes |
| 21 | happy-dom gaps met in one day: `matchMedia` ignores width, `hashchange` never fires, `background-color: color-mix()` is dropped | Vitest | 2026-09-21 | L — test environment is not the browser | **live**, unfiled | Wave evidence, map Notes. Each one forces a test to be written around the environment instead of the behaviour |

## The classes

A class with one live member is still a class.

### A — Live data, cold render (E2E)

The E2E suite runs `next start` against **live** Sanity and the **deployed** BFF. A cold, uncached,
fan-out route can exceed a 30 s test timeout for reasons that have nothing to do with the commit.
`/kalender` is `force-dynamic` with a 19-call fan-out, so even Playwright's retry hits it cold.

- Members: rows 2, 3. **Live risk remains** — the fix bounded the *wait*, not the *data*.
- Feeds: [Grilling: E2E data — live production data or deterministic fixtures?](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3087)

### B — Hydration and layout race the assertion budget (E2E)

The test asserts on state that only exists after React hydrates and the browser settles scroll. The
assertion has a fixed 5 s budget; hydration does not. `#3002` fixed a real ordering bug in
`useSectionNav` and added `scrollIntoViewAndSettle`; `#3003` then measured that what is left is the
test's own budget, and closed on the reasoning that CI never throttles. **CI does not need to
throttle** — row 1 has since failed on unthrottled CI at 7.5 s, twice in one evening, on both tries.

- Members: rows 1 (worst offender in the whole suite), 4.
- This is the single biggest source of noise: 6 of 7 hidden retries.

### C — Work outside the test body, charged to the timeout (Vitest)

Module graphs and network I/O evaluated inside a timed test body. Passes on an idle machine with
~1.6× headroom, fails whenever anything competes for CPU — which, in a 4-agent wave, is always.

- Members: rows 11 (fixed, and closed by a lint rule — the model for how a class should end), 19 (live).

### D — Fonts race the screenshot (VR)

Two separate causes, both closed: `fonts.ready` resolving before Typekit's Freight is even pending,
and IBM Plex Mono never loading in Storybook at all.

- Members: rows 6, 7. Both **fixed**, no recurrence measured since 2026-09-20.

### E — Focus is an environment property (VR)

`autoFocus` paints a ring only if the headless page happens to hold focus at mount, and the ring
fades in over a transition. Same story, same code, two legitimate screenshots.

- Member: row 8. **Fixed.**

### F — Images race the screenshot (VR)

Lazy loading, blur-up placeholders, and third-party image hosts all put a network event between the
story mounting and the shot.

- Members: rows 9, 10. Both **fixed**; the runner now forces `loading="eager"`, waits for the
  network to settle, then awaits `load` + `decode` per image under a cap.

### G — The VR runner stalls on one story (VR)

A story that never settles burns jest's 120 s per-test cap and takes `main` red with it. Distinct
from D/E/F: there is no pixel diff at all, the capture never happens.

- Member: row 5. **Live and unfiled** — it fired 2026-09-21 and auto-opened `main is red` (#3094).

### H — The build reaches the live network (CI)

`next build` prerenders `/nieuws/[slug]` by fetching Sanity. One transient `fetch failed` fails the
build. `check-all` includes `next build`, so this is a test-suite problem, not only a deploy one.

- Member: row 12. **Live and unfiled.**

### I — Third-party API transient (CI)

The Cloudflare deploy step is inside `ci.yml`, so a Cloudflare API hiccup shows up as a red CI check
on work that has nothing to do with the Worker.

- Member: row 13. **Live and unfiled.**

### J — The green light does not mean what it says (CI)

Four independent ways for a green check to cover less than it claims: a workspace whose tests never
run, a retry that turns a failure into silence, a thin dataset that skips the test, and a cache key
that misses the directory the tests live in.

- Members: rows 14 (fixed), 15 (mitigated), 16 (live), 17 (live).
- Feeds: [Grilling: the flake policy](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3089) and
  [Grilling: what does each test layer promise, and what must a red check mean?](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086)

### K — The local wave shares CPU and one Docker lane, ungated (local)

Four agents, one Docker daemon, one emulated `linux/amd64` image, and screenshot capture that is
sensitive to CPU. Nothing sequences them.

- Members: rows 18, 20. Both **live and unfiled**.
- Feeds: [Grilling: the local wave environment](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3090)

### L — The test environment is not a browser (Vitest)

happy-dom gaps that force tests to be written around the environment rather than the behaviour.

- Member: row 21. **Live and unfiled.**
- Feeds: [Research: fast, isolated Vitest in a Turborepo monorepo](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3083)

## What this ledger changes

1. **Row 1 is not "a flake", it is a broken test.** It failed on both tries five times in three
   weeks and is retried in half of all green runs. Any flake policy that starts by quarantining
   the noisiest test starts here.
2. **`retries: 1` is load-bearing and invisible.** Without it, 7 of the last 12 `main` E2E runs go
   red. That is the honest number for the current suite.
3. **Three live classes have no issue at all** (G, H, I), plus rows 4, 17, 19, 20 and 21. The flake
   history undercounts itself, because a flake that clears on re-run leaves no artifact behind
   unless someone reads the log.
4. **The classes that ended, ended with a rule, not a retry** — #2378's eslint rule (C), #1704's
   local fixture pool (F), #2735's missing CI step (J). None of them ended with a raised timeout.
