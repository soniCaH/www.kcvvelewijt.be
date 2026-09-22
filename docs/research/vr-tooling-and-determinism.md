# Visual-regression tooling and determinism — what the primary sources say, applied to 3 044 baselines

Research for [#3082](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3082), part of the test-suite walk map
[#3078](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078). Feeds the decision ticket
[#3088](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3088). Written 2026-09-22 in the `research/vr-tooling`
worktree at `4a60adc8`.

Versions from `apps/web/package.json` _(measured)_: `storybook` 10.5.10, `@storybook/nextjs-vite` 10.5.10,
`@storybook/test-runner` 0.24.4, `jest-image-snapshot` 6.5.2, `@storybook/addon-vitest` 10.5.10, `vitest` 4.1.11,
`@playwright/test` 1.60.0.

Every repo claim below is a `file:line`, a `git`/`gh` measurement, or a CI run link. Every external claim is an
official doc, a repo file, a release, or a published pricing page — read today.

The map's standing rule applies: **this ticket may not presuppose the installed tool.** So the order is
layer → tool → determinism → parity → cost, and "keep what we have" is allowed to win.

---

## Answer

**Keep the layer. Keep the tool. Cut the trigger. Spend the migration budget on five in-place tunes.**

Pixel diffing earns its place — 8 of 11 public design systems surveyed run it _(§1)_ — but almost nobody runs it
the way this repo does: **1 of those 8 commits PNG baselines to git**, and most run it advisory rather than
blocking. The committed 176 MB is the outlier, not the pixel diffing.

Every alternative is worse _for this repo_, and three of them are worse than the research map assumed:

- **`@storybook/test-runner` is not dying.** 0.24.5 shipped 2026-09-02; Storybook 10 + Jest 30 support was _added_
  in Oct 2025. Storybook steers Vite users elsewhere, but the page is retitled "Test runner (Webpack)", not
  deprecated _(§2.1)_.
- **[#3085](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3085)'s "VR to Vitest browser mode" does not
  survive contact with the docs.** The Storybook Vitest addon has **no visual-testing feature at all** — Storybook's
  official answer for visual testing is Chromatic. Vitest's own `toMatchScreenshot` is marked **Experimental**, its
  `--update` has no `changed`-only mode (so it is _worse_ than today on the repo's live stale-baseline defect), and
  the `storybookTest`-generated tests are **opaque** — there is no documented seam to add a screenshot assertion to
  them _(§2.2, §2.3)_. Contradicted, with sources.
- **Hosted services are priced out by trigger volume, not by baseline count.** The repo captures **3 044 screenshots
  per run** and ran VR ~180×/week _(measured)_ → **~2.3 M screenshots/month**. Argos Pro's overage alone would be
  ~€3 600/month; even a disciplined 30-builds/month floor exceeds Chromatic Pro's 85 000 tier _(§2.5)_.
- **Lost Pixel is archived** — read-only since 2026-04-22, last release 2024-11-14, team joined Figma _(§2.6)_.

The 589-line `test-runner.ts` is genuinely good at the two flake classes it closed (fonts, images) — better than any
vendor's published advice. It has exactly **one structural gap**: it takes _one_ screenshot where Playwright's
`toHaveScreenshot` "took a bunch of screenshots until two consecutive screenshots matched". Most of those 589 lines
are a hand-rolled substitute for that single built-in _(§3.1)_.

Five tunes, all inside the installed tool, all one-to-forty lines _(§3, §5.1)_:

| #      | Tune                                                               | Closes / buys                                                                                   | Size              |
| ------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------- |
| **T1** | `updatePassedSnapshot: true`                                       | Flake ledger row 20 — root-caused below to one line of `jest-image-snapshot`                    | **1 line**        |
| **T2** | `page.clock.setFixedTime()` for the frozen clock                   | Deletes ~40 hand-rolled lines, and freezes `requestAnimationFrame` / `performance` / timers too | **−40 lines**     |
| **T3** | Two-shot stability loop before `toMatchImageSnapshot`              | The one lever the runner lacks; the residual sub-pixel noise class                              | **~15 lines**     |
| **T4** | `--shard=N/M` in the CI job                                        | ~10.4 min → ~4 min; the ~17 min critical path roughly halves                                    | **workflow only** |
| **T5** | `screenshot({ style, scale: "css" })`, drop the `caret-color` rule | Pierces shadow DOM + inner frames; makes baselines DSF-independent; deletes a redundant rule    | **net −5 lines**  |

Honest cost of keeping: roughly **one day**, no recurring bill, no baseline churn. Honest cost of the cheapest
move (Argos): ~1 week of work, the 589 lines all stay (Argos ingests _your_ images), and **€800–3 600/month**
at the measured trigger rate. Chromatic deletes the most code and the most weight but costs Enterprise money at
this volume and re-shoots all 3 044 on any token change.

The one thing worth changing that is _not_ a tune: **VR runs unconditionally on every push to `main`** — about 217
of the ~770 monthly runs — and [#3086](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086) measured that it
**gates nothing**. That is ~2 250 runner-minutes/month buying a signal nothing consumes. Decision, not research —
handed to #3088.

---

## 0. The measured baseline

All measured in the worktree today unless a link says otherwise.

| Fact                                                      | Value                                                                                               | How                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Baseline PNGs                                             | **3 044** — 1 027 mobile, 1 009 tablet, 1 008 desktop                                               | `ls apps/web/test/vr/__snapshots__`                                    |
| Live weight                                               | **176 MB**                                                                                          | `du -sh`                                                               |
| Weight in git history                                     | **808 MB on disk, 955 MB raw, 13 555 unique PNG blobs**                                             | `git rev-list --objects --all -- <path> \| git cat-file --batch-check` |
| Whole pack                                                | **1.04 GiB**                                                                                        | `git count-objects -vH`                                                |
| **VR PNGs as a share of the pack**                        | **≈ 76 %**                                                                                          | 808 MB / 1.04 GiB                                                      |
| Commits touching baselines                                | 222 ever, **66 in the last 30 days**                                                                | `git rev-list --count`                                                 |
| Story files                                               | 208 `.stories.tsx`; **183 tagged `vr`**, 10 with `vr-skip`, 6 with `vr.disable`, **11 with `play`** | `grep -rl`                                                             |
| Runner                                                    | `apps/web/.storybook/test-runner.ts`, **589 lines**                                                 | `wc -l`                                                                |
| VR job wall-clock                                         | **median 10 min 29 s** (9 consecutive runs, 2026-09-21/22; range 9:01–11:04)                        | `gh api .../jobs`                                                      |
| PR critical path (`quality-checks` → `visual-regression`) | **14 min 51 s – 17 min 25 s**                                                                       | same                                                                   |
| `ci.yml` runs, 7 days to 2026-09-22                       | **295**                                                                                             | `gh api .../workflows/ci.yml/runs`                                     |
| Of the 100 most recent, VR actually executed              | **61**                                                                                              | per-run `/jobs` sweep                                                  |
| → projected VR runs                                       | **≈ 180/week ≈ 770/month**                                                                          | 295 × 0.61                                                             |
| → **screenshots captured/month**                          | **≈ 2.3 million**                                                                                   | 770 × 3 044                                                            |
| → runner minutes on VR/month                              | **≈ 8 000**                                                                                         | 770 × 10.4 min                                                         |
| Merged PRs, 30 days                                       | **215**                                                                                             | `gh pr list`                                                           |
| Commits on `main`, 30 days                                | 217 (**168** touch the VR path filter)                                                              | `git rev-list --count`                                                 |

Two corrections to the ticket's own framing, both measured:

- **"184 stories × 3 viewports" is 183 story _files_, not story exports.** 3 044 ÷ 3 ≈ 1 014 story _exports_ carry
  baselines. Every per-screenshot price below must use **3 044**, not 552.
- **"~30 visual PRs/month" is off by an order of magnitude.** 215 PRs merged in 30 days; 168 of 217 `main` commits
  hit the VR path filter. The real trigger rate is **~180 VR runs/week**.

---

## 1. The layer — does a pixel diff belong here at all?

### 1.1 What 11 public design systems actually run

Read from each repo's own `.github/workflows/*.yml`, `package.json`, `.gitignore` and testing docs.

| Repo                                                                                                                    | Pixel VR?                                                                    | Tool                                               | Capture runs                                                                                   | Baselines live          | Blocks merge?                                                                          |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| [primer/react](https://github.com/primer/react/blob/HEAD/.github/workflows/vrt.yml)                                     | Yes                                                                          | Playwright `toHaveScreenshot`                      | **Self-hosted**, GH Actions, sharded 4–8×, inside `mcr.microsoft.com/playwright:v1.60.0-jammy` | **In git — Linux only** | Likely required (`status-checks.yml` has a manual override path)                       |
| [mui/material-ui](https://github.com/mui/material-ui/blob/HEAD/.circleci/config.yml)                                    | Yes                                                                          | Argos                                              | CircleCI                                                                                       | Service                 | Advisory — CONTRIBUTING: "This doesn't necessarily mean that your PR will be rejected" |
| [shopify/polaris](https://github.com/Shopify/polaris/blob/HEAD/.github/workflows/ci-a11y-vrt.yml)                       | Yes                                                                          | Chromatic                                          | Chromatic cloud                                                                                | Service                 | Advisory (`exitZeroOnChanges: true`)                                                   |
| [carbon-design-system/carbon](https://github.com/carbon-design-system/carbon/blob/HEAD/.github/workflows/ci.yml)        | Yes                                                                          | Chromatic + **TurboSnap** (`onlyChanged: true`)    | Chromatic cloud                                                                                | Service                 | No `exitZeroOnChanges` → default blocking                                              |
| [storybookjs/storybook](https://github.com/storybookjs/storybook/blob/HEAD/code/chromatic.config.json)                  | Yes                                                                          | Chromatic                                          | Chromatic cloud                                                                                | Service                 | Advisory (`--exit-zero-on-changes`)                                                    |
| [radix-ui/primitives](https://github.com/radix-ui/primitives/blob/HEAD/.github/workflows/chromatic.yml)                 | Yes                                                                          | Chromatic                                          | Chromatic cloud                                                                                | Service                 | Advisory (`exitZeroOnChanges: true`)                                                   |
| [adobe/react-spectrum](https://github.com/adobe/react-spectrum/blob/HEAD/.github/workflows/weekly-chromatic.yml)        | **Weekly cron only**                                                         | Chromatic                                          | Chromatic cloud                                                                                | Service                 | **No — not a PR gate at all**                                                          |
| [microsoft/fluentui](https://github.com/microsoft/fluentui/blob/HEAD/.github/workflows/pr-vrt.yml)                      | Yes                                                                          | Home-grown Playwright + internal `vr-approval-cli` | **Self-hosted on `macos-14-xlarge`**                                                           | **Azure Blob Storage**  | Unverified (threshold-based, PR comments)                                              |
| [chakra-ui/chakra-ui](https://github.com/chakra-ui/chakra-ui/blob/HEAD/.github/workflows/quality.yml)                   | **No**                                                                       | —                                                  | —                                                                                              | —                       | —                                                                                      |
| [vercel/next.js](https://github.com/vercel/next.js)                                                                     | **No** (0 hits for `toHaveScreenshot`)                                       | —                                                  | —                                                                                              | —                       | —                                                                                      |
| [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss/blob/HEAD/packages/tailwindcss/tests/ui.spec.ts) | **No** — Playwright used for `getPropertyValue` computed-CSS assertions only | —                                                  | —                                                                                              | —                       | —                                                                                      |

**The counts that matter:**

- **8 of 11 run pixel VR.** The layer is normal. It earns its place.
- **Of those 8, exactly 1 commits PNG baselines to git** — primer/react. 6 are on Chromatic/Argos, 1 on Azure Blob.
- **Of the 8, at least 5 are explicitly advisory** and 1 (react-spectrum) is a weekly cron that posts to Slack.
- **3 of 11 run no pixel VR at all** and are perfectly serious projects.

### 1.2 The closest analogue, and the two things it does differently

primer/react is a near-exact structural twin of this repo: Playwright screenshots, self-hosted in GitHub Actions,
inside the **same Playwright image family at the same version** (`v1.60.0-jammy` vs this repo's `v1.60.0-noble`),
with committed PNG baselines. Two differences, both directly relevant:

1. **It shards.** `vrt.yml` splits the run 4–8 ways. This repo runs one 10.4-minute job. See T4.
2. **It commits one platform's baselines, deliberately.** `.playwright/.gitignore` is `*.png` then `!*-linux.png`,
   commented "Only include snapshots from Linux as these are used in CI."

That second one is the same conclusion `docs/agents/testing-ops.md` reached via #2370 ("never remove the pin",
"arm64-rendered baselines must never be committed") — reached independently, by a team an order of magnitude
larger. **The amd64 pin is not this repo's idiosyncrasy; it is the industry-standard answer, written down in
someone else's `.gitignore`.**

### 1.3 The one that took pixels off the gate

adobe/react-spectrum is the only surveyed repo with an on-the-record redefinition. Its `CONTRIBUTING.md` defines
"visual tests" as **story coverage** — "A Storybook story should be written for each visual state" — and moves
actual pixel diffing to `weekly-chromatic.yml` (`cron: 0 17 * * 1`) reporting to Slack.

This is worth naming against [#3086](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086)'s one rule ("a red
check means a real regression; a check that cannot promise that does not gate"). Adobe's answer to the same
tension is not "make it deterministic enough to gate" — it is "take it off the gate and keep it as a weekly
monitor". #3086 already ruled that report-only is a waiting room, not a destination, and that **VR red = the PR is
incomplete**. That ruling stands; this is recorded as the road not taken, with the name of the team that took it.

### 1.4 What they run _alongside_ the pixels

The survey answers the "instead or alongside" half of the question concretely:

- **a11y as a separate, non-pixel gate.** Polaris runs an `accessibility_test` job (Storybook test-runner) in the
  _same workflow_ as its Chromatic job — the file is literally named "Accessibility and Visual Regression Tests".
  Carbon runs a distinct Playwright `@avt` suite using IBM's `accessibility-checker`
  (`toHaveNoACViolations`, `IBM_Accessibility` ruleset), sharded, in its own job.
- **Computed-CSS assertions instead of pixels.** Tailwind's `ui.spec.ts` asserts `getPropertyValue` — the token
  test, without a screenshot.
- **Story coverage as the convention** (react-spectrum, above).

This repo already has the a11y half installed and dark — `@storybook/addon-a11y` is registered in
`.storybook/main.ts:20` but nothing runs it in CI _(measured — no a11y step in any workflow)_. And it already
invented the third: `apps/web/test/vr/structural-assertions.ts` is a tag-scoped `scrollWidth > clientWidth` check
riding inside `postVisit` (#2861), with `structural-assertions.test.ts` statically guarding that the tag is still
referenced. That is a DOM assertion at the Storybook layer, discovered locally, matching what Carbon and Tailwind
do. It is the right instinct and it should grow, not be replaced by more pixels.

### 1.5 Verdict on the layer

**Pixel diffing at the Storybook layer stays.** It is what 8 of 11 peers run, it is the only layer that can see
what it sees, and #3086 already assigned it "pixel truth at 3 viewports".

Two riders from the survey:

- **Committed baselines are the outlier, not the pixels.** 1 of 8. Everything painful about this setup —
  176 MB live, 808 MB of history, a bot workflow to re-commit PNGs, `git checkout -- "<prefix>--"*` as a documented
  procedure — comes from _storage_, not from _diffing_. That is where a tool change would actually pay.
- **The non-pixel companions are cheaper and this repo is under-invested in them.** `addon-a11y` is installed and
  never runs; `STRUCTURAL_ASSERTIONS` has a registry and a static guard and only a handful of entries. Both are
  worth more per line than the 3 044th baseline.

---

## 2. The tool

### 2.1 `@storybook/test-runner` — the actual status, from primary sources

The map's working assumption (via #3085) was "the runner Storybook itself now calls superseded". That is true but
it is not the whole sentence, and the rest of the sentence changes the decision.

**Superseded, for Vite projects, in the docs:**

> "The test runner has been superseded by the Vitest addon, which offers the same functionality, powered by the
> faster and more modern Vitest browser mode."
> — [`docs/writing-tests/integrations/test-runner.mdx`](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/integrations/test-runner.mdx),
> whose frontmatter is `title: Test runner` with `sidebar: { order: 2, title: Test runner (Webpack) }`

> "If you're using Storybook in a Vite-based project, you might want to use Storybook's Vitest integration instead."
> — [`storybookjs/test-runner` README](https://github.com/storybookjs/test-runner/blob/next/README.md)

**But not deprecated, not archived, and actively released:**

- `@storybook/test-runner@0.24.5` published **2026-09-02** (npm registry) — 20 days ago. This repo pins **0.24.4**,
  published 2026-05-14.
- GitHub API on `storybookjs/test-runner`: `archived: false`, `pushed_at: 2026-09-02`, 126 open issues.
- CHANGELOG `v0.24.0` (2025-10-28): "BREAKING: ESM only, **Support for Storybook 10** and Jest 30" — Storybook 10
  support was _added_, not abandoned.
- Storybook 10's `MIGRATION.md` "From version 9.x to 10.0.0" contains **no** test-runner deprecation notice at all.
- The vitest-addon migration guide keeps it as the _recommended_ path for a class of users: "If you are using a
  different renderer (such as Angular) or the Webpack builder, you should continue to use the test runner."

**And — the asymmetry that decides this section — the runner is the one with a documented VR recipe.** The
test-runner README's "Image snapshot" recipe is `page.screenshot()` + `toMatchImageSnapshot` from
`jest-image-snapshot`. That is exactly what `.storybook/test-runner.ts` implements. It is non-experimental,
documented, and in this repo it has been green for months.

### 2.2 The Storybook Vitest addon does not do screenshots

This is the load-bearing correction to #3085. Three primary sources, all read directly:

1. **Storybook's visual-testing page names one tool, and it is not the Vitest addon.**

   > "Storybook supports cross-browser visual testing natively using Chromatic, a cloud service made by the
   > Storybook team." … "Add visual tests to your project by installing `@chromatic-com/storybook`, the official
   > addon by Storybook maintainers"
   > — [`docs/writing-tests/visual-testing.mdx`](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/visual-testing.mdx)

2. **The Vitest addon's own page treats visual tests as a _different, complementary_ addon:**

   > "If your project is using other testing addons, such as the Visual tests addon or the Accessibility addon, you
   > can run those tests alongside your component tests."
   > — [`docs/writing-tests/integrations/vitest-addon/index.mdx`](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/integrations/vitest-addon/index.mdx)

   What the addon _does_ do: "transforms your stories into component tests, which test the rendering and behavior
   of your components in a real browser environment. It can also calculate project coverage provided by your
   stories." No screenshots.

3. **Grepping the addon docs for "viewport" and "screenshot" returns nothing substantive** — confirmed against the
   raw `.mdx` of both `vitest-addon/index.mdx` and `migration-guide.mdx`. A documented absence, not an inference.

**The generated tests are opaque.** To put a screenshot assertion on every story you would need a seam inside the
`storybookTest`-generated test. There isn't a documented one. `.storybook/vitest.setup.ts` gets `beforeAll`
(`setProjectAnnotations(...).beforeAll`), which runs once per file/worker — not per rendered story. The documented
path for a custom per-story assertion is **portable stories** (`composeStory` / `composeStories`), i.e.
hand-writing a test file per story or group — "a `composeStories` utility that helps convert stories from a test
file into renderable elements that can be reused in your Node tests"
([`stories-in-unit-tests.mdx`](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/integrations/stories-in-unit-tests.mdx)).
That is a materially bigger rewrite than swapping an assertion library.

There is a _plausible_ third path — Storybook 10 stabilised the story/project-level `afterEach` hook (`MIGRATION.md`:
"The `experimental_afterEach` hook has been promoted to a stable API and renamed to `afterEach`"), which receives
`{ canvasElement }`, and Vitest browser mode exposes `page.elementLocator(element: Element): Locator` to wrap it.
The two compose type-wise. **No official source publishes that combination as a supported pattern** — it is a
spike, not a citation, and it should be labelled as one in any plan that proposes it.

**Verified local fact — the addon is installed and dark.** `.storybook/main.ts:18` registers
`"@storybook/addon-vitest"`. `apps/web/vitest.config.ts` is a **single `happy-dom` project**: no `projects` array,
no `storybookTest` plugin, no `browser:` block, and there is no `vitest.workspace.*` anywhere in the repo
_(measured)_. Nothing runs stories under Vitest.

**What wiring it would actually take** (Storybook's own Vitest-4 snippet, verbatim, from
[`docs/_snippets/vitest-plugin-vitest-config.md`](https://github.com/storybookjs/storybook/blob/next/docs/_snippets/vitest-plugin-vitest-config.md)):

```typescript
import { defineConfig, mergeConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, ".storybook"),
              storybookScript: "yarn storybook --no-open",
            }),
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              provider: playwright({}),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
            setupFiles: ["./.storybook/vitest.setup.ts"],
          },
        },
      ],
    },
  }),
);
```

Concretely, for this repo: turn `vitest.config.ts` into a `projects` array (the existing happy-dom config becomes
one project), add `@vitest/browser` and `@vitest/browser-playwright@^4` (the addon's npm `peerDependencies` require
`@vitest/browser-playwright: "^4.0.0"` specifically on Vitest 4), create `.storybook/vitest.setup.ts`, and change
`test-storybook` to `vitest --project=storybook`. That is a real but bounded change — and it buys **interaction and
a11y tests in the browser, not VR.**

That is the honest read: **wiring the Vitest addon is worth doing for `play` functions, and is orthogonal to VR.**
#3086 makes Storybook `play` load-bearing (it deletes `scroll-arrows.spec.ts` and `section-nav.spec.ts` and re-homes
26 geometry assertions there). Only 11 of 208 story files have a `play` today _(measured)_. That migration is the
addon's real use case — and it does not require touching a single baseline.

### 2.3 Vitest's own `toMatchScreenshot` — Experimental, and worse on the exact defect this repo has

Vitest 4 browser mode does ship native VR, separately from Storybook. Heading, verbatim from
[`docs/api/browser/assertions.md`](https://github.com/vitest-dev/vitest/blob/main/docs/api/browser/assertions.md):

> `## toMatchScreenshot <Experimental /> {#tomatchscreenshot}`

What it gives you:

- Retry-until-stable, like Playwright: "The assertion automatically retries taking screenshots until two
  consecutive captures yield the same result."
- `pixelmatch` as the default comparator, with `allowedMismatchedPixelRatio` / `allowedMismatchedPixels`.
- A full config block, `test.browser.expect.toMatchScreenshot`, with `comparatorName`, `comparatorOptions`,
  `screenshotDirectory` (default `'__screenshots__'`), `resolveScreenshotPath`, `resolveDiffPath`, and `comparators`
  ([`docs/config/browser/expect.md`](https://github.com/vitest-dev/vitest/blob/main/docs/config/browser/expect.md)).
- `page.viewport(width, height): Promise<void>` to resize mid-test, and multiple named `toMatchScreenshot('mobile')`
  calls per test — so the three-viewport pattern **is** expressible, documented, in one test
  ([`context.md`](https://github.com/vitest-dev/vitest/blob/main/docs/api/browser/context.md),
  [`visual-regression-testing.md`](https://github.com/vitest-dev/vitest/blob/main/docs/guide/browser/visual-regression-testing.md)).

What makes it the wrong bet here:

- **It is Experimental.** #3086's contract is that a layer earns the gate by being able to promise "red = real
  regression". Moving 3 044 baselines onto an API carrying the docs' own `<Experimental />` badge moves in the
  opposite direction.
- **Its update model is strictly worse on this repo's live defect.** `--update` accepts `new | all | none`
  ([`docs/config/update.md`](https://github.com/vitest-dev/vitest/blob/main/docs/config/update.md)). `'all'`
  "updates all changed snapshots **and deletes obsolete ones**". There is no `changed`-only mode and no
  threshold-aware or confirm-per-image mode. The repo's live problem is `-u` over-accepting; Vitest's `-u` accepts
  _and_ deletes. (Playwright, by contrast, does have `all | changed | missing | none` — §2.4.)
- **The default path template bakes in the platform**:
  `${arg}-${browserName}-${platform}${ext}` under `__screenshots__/<test file>/`. Migrating means renaming all
  3 044 files or overriding `resolveScreenshotPath`.
- **Per-viewport `browser.instances[]` multiplies the whole project.** Instances become "separate test projects
  sharing a single Vite server" — every test in that project runs once per instance. Confining a 3× viewport
  multiplication to VR requires splitting projects by an `include` glob. Doable, but it is config the repo does not
  have today.

Vitest's own guide agrees with the constraint this repo already lives under, for what it is worth:

> "visual regression tests are most reliable when run in a standardized and tightly controlled environment. This is
> also why Docker containers, CI-only visual testing workflows, or cloud services are strongly recommended."

**No option removes the Docker requirement. Every primary source says the same thing.**

### 2.4 Playwright `toHaveScreenshot` — strong, but the entry point moved in 1.62

The assertion itself is the best-documented VR primitive available
([test-snapshots](https://playwright.dev/docs/test-snapshots),
[`pageAssertions`](https://playwright.dev/docs/api/class-pageassertions)):

- **Retry until stable:** "This method took a bunch of screenshots until two consecutive screenshots matched, and
  saved the last screenshot to file system."
- `animations: "disabled"` — "finite animations are fast-forwarded to completion… infinite animations are canceled
  to initial state, and then played over after the screenshot."
- `caret` — "Defaults to `\"hide\"`." `mask` / `maskColor`, `style` / `stylePath`, `scale`, `clip`, `fullPage`,
  `maxDiffPixels`, `maxDiffPixelRatio`, `threshold` ("Defaults to `0.2`").
- **Per-platform naming is first-class:** `snapshotPathTemplate` with a `{platform}` token
  (`process.platform`); the default filename anatomy is `example-test-1-chromium-darwin.png` — "the browser name
  and the platform".
- **`--update-snapshots` has four modes:** "Possible values are \"all\", \"changed\", \"missing\", and \"none\".
  Running tests without the flag defaults to \"missing\"; running tests with the flag but without a value defaults
  to \"changed\"." ([test-cli](https://playwright.dev/docs/test-cli))
- On environment: "Browser rendering can vary based on the host OS, version, settings, hardware, power source
  (battery vs. power adapter), headless mode, and other factors. For consistent screenshots, run tests in the same
  environment where the baseline screenshots were generated."

**But the component-testing entry point changed under this repo's feet.** Playwright's current
[component-testing page](https://playwright.dev/docs/test-components) says:

> "A component test is a regular Playwright end-to-end test that runs against a small **story gallery** page served
> by your own dev server." … "There is no dedicated component-testing runtime, no bundler integration and no extra
> npm packages"

and:

> "The experimental `@playwright/experimental-ct-react`, `-ct-react17` and `-ct-vue` packages have been removed and
> are no longer published. If you are still on them, stay on Playwright 1.62 until you have followed the migration
> guide below."

Current stable is **1.63.0** (2026-09-04, GitHub releases); the stories-gallery model landed in **1.62**. This repo
is on **1.60.0**, pinned in three places (`apps/web/package.json`, `Dockerfile.vr:10`, `ci.yml:225`).

So "Playwright component screenshots" as a target means: bump three pinned versions past a model change, then
build a story-gallery page. Note that **Storybook already is that gallery** — which is precisely why
`@storybook/test-runner` exists and why it depends on `playwright` already. Moving to Playwright's own runner
without leaving Storybook would mean re-implementing story discovery, tag filtering (`--includeTags vr`,
`--excludeTags vr-skip`), and `getStoryContext` for `parameters.vr.*`. That is the 589 lines _plus_ the parts the
test-runner currently gives away free.

The same one-browser-toolchain argument #3081 made for keeping Playwright at the E2E layer applies here **in
reverse**: `@storybook/test-runner` already drives Playwright's Chromium in the same pinned image as `e2e.yml`.
There is already one browser toolchain. Changing runners does not consolidate anything; it splits story discovery
away from Storybook.

### 2.5 Hosted services, priced at this repo's measured volume

All prices read from the vendors' own pricing pages, 2026-09-22. All counts use **3 044 screenshots per run**
_(measured)_ — every vendor multiplies by viewport.

| Vendor                   | Snapshot definition (their words)                                                                                                                                                                                                                                                   | Free                                   | Paid tiers                                                                         | Capture runs                                                                                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chromatic**            | "visual snapshots = Tests x Builds x Browsers x **Modes**" ([billing](https://www.chromatic.com/docs/billing)) — modes are viewport/theme variants                                                                                                                                  | $0 / **5 000**/mo                      | Starter **$179**/mo → 35 000; Pro **$399**/mo → 85 000; Enterprise custom          | **Their cloud.** "Chromatic's Capture Cloud leverages a fleet of standardized browsers and mobile emulators to load all of your tests… in parallel" ([snapshots](https://www.chromatic.com/docs/snapshots)) |
| **Argos**                | "every capture, image or not, counts as one screenshot" ([pricing](https://argos-ci.com/pricing))                                                                                                                                                                                   | Hobby **5 000**/mo, 30-day retention   | Pro **$100**/mo → 35 000, then **$0.004 each ($0.0015 for Storybook screenshots)** | **Your CI.** "Your tests capture screenshots in CI. Your CI uploads the screenshots to Argos."                                                                                                              |
| **Percy** (BrowserStack) | "A screenshot is a rendering of a page or component in an individual browser and responsive width combination… two pages rendered across two browsers and three widths, result in twelve screenshots" ([plans](https://www.browserstack.com/docs/percy/overview/plans-and-billing)) | **5 000**/mo, unlimited users/projects | **Not verifiable** — no standalone Percy pricing table was reachable today         | Not verified                                                                                                                                                                                                |
| **Lost Pixel**           | —                                                                                                                                                                                                                                                                                   | 7 000/mo                               | $100 / $250 / $670                                                                 | **Moot — see §2.6**                                                                                                                                                                                         |

**The arithmetic, at three trigger policies:**

| Builds/month                               | Screenshots/month | Chromatic                         | Argos Pro                                    |
| ------------------------------------------ | ----------------- | --------------------------------- | -------------------------------------------- |
| 30 (the ticket's guess)                    | **91 320**        | past Pro's 85 000 → **> $399**/mo | $100 + 56 320 × $0.0015 = **$184**/mo        |
| ~165 (one per visual PR, no `main` pushes) | **502 260**       | far past Pro → Enterprise         | $100 + 467 260 × $0.0015 = **$801**/mo       |
| **~770 (measured)**                        | **≈ 2 343 000**   | Enterprise                        | $100 + 2 308 000 × $0.0015 = **≈ $3 562**/mo |

**Read that carefully: even the ticket's own optimistic guess already exceeds Chromatic's second-highest tier.**
Hosted VR is priced out of this repo by the _trigger rate_, not the baseline count. The one documented mitigation is
Chromatic's TurboSnap (`onlyChanged: true`, which Carbon's `ci.yml` uses) — it skips unchanged stories, so a typical
PR costs far less than 3 044. But a design-token or global-CSS change re-shoots everything, and the redesign this
repo is mid-way through is exactly the change shape that defeats it.

Two further facts worth recording:

- **Chromatic's OSS plan probably does not apply.** [chromatic.com/docs/open-source](https://www.chromatic.com/docs/open-source)
  offers "35k snapshots per month, Chrome only", gated on thresholds like "Over 100 contributors" / "Over 40k weekly
  npm DLs" / "Over 10k GitHub stars". A public club website meets none.
- **Argos's OSS sponsorship is discretionary**, not a tier: "Argos sponsors selected open-source projects with free
  usage. Sponsorships are evaluated case by case", requires a README banner and dofollow link, and the page itself
  says "Check that you actually need sponsorship — the Hobby plan is often sufficient for smaller projects"
  ([open-source](https://argos-ci.com/docs/learn/billing-and-subscription/open-source.md)).

**And the one hosted claim in this repo's PRD needs retiring.** `docs/prd/visual-regression-testing.md:36`:

> "Chosen over Chromatic/Percy because Claude can read diff PNGs directly via the vision-enabled `Read` tool and run
> the `pnpm vr:update` command in-session. This file-based property is the critical enabler for Claude integration —
> SaaS tools hide diffs behind web UIs and require API indirection."

That was true when written and is now half-obsolete: the repo has since built `vr-diff-comment` (`ci.yml:275`),
which pushes an orphan branch and posts baseline/actual/diff **inline in the PR** — i.e. it re-implemented in-house
the exact review surface a hosted service sells. The remaining half of the claim still stands (in-session `vr:update`
against local files), and it is a real advantage. But the cost argument above is what decides this, not the
file-access argument.

### 2.6 Lost Pixel is archived

Listed in the ticket as a candidate. It is dead:

- `gh api repos/lost-pixel/lost-pixel` → `"archived": true`. Banner: "This repository was archived by the owner on
  **Apr 22, 2026**. It is now read-only."
- Last release **v3.22.0, 2024-11-14** — ~17 months before archival.
- Official sunset: "Lost Pixel is joining Figma. We are sunsetting the product and building what's next."
  ([blog](https://www.lost-pixel.com/blog/lost-pixel-team-is-joining-figma))
- MIT-licensed, so the OSS runner still _executes_ — frozen at v3.22.0, with no future Playwright/Storybook/Node
  compatibility fixes. **Not adoptable.**

---

## 3. Determinism levers — what the 589 lines do, miss, and duplicate

`apps/web/.storybook/test-runner.ts`, read in full. Line numbers are that file unless noted.

| Lever                      | Primary source                                                                                                                                                                                                                                                                   | What the runner does today                                                                                                                                                            | Verdict                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Retry until stable**     | PW: "took a bunch of screenshots until two consecutive screenshots matched"; Vitest: same                                                                                                                                                                                        | **Absent.** One `page.screenshot()` at :569                                                                                                                                           | **The gap. See §3.1**                                                                                        |
| Animations / transitions   | PW `animations:"disabled"` fast-forwards finite, cancels infinite                                                                                                                                                                                                                | **Both**: `screenshot({ animations: "disabled" })` :570 **and** an injected stylesheet :110–122                                                                                       | Overlapping. The stylesheet uniquely adds `scroll-behavior: auto` — keep that, the rest is duplicate         |
| Caret                      | PW `caret` "Defaults to `\"hide\"`" on `page.screenshot`                                                                                                                                                                                                                         | `caret-color: transparent !important` :120                                                                                                                                            | **Redundant with the default.** Delete                                                                       |
| Fonts                      | Chromatic: browsers "render HTML in multiple passes when custom fonts are used"; Vitest lists font pipelines as a variance source                                                                                                                                                | `waitForFontsSettled` :145–209 — targeted `fonts.load(font, text)` per _computed_ face including `::first-letter`, then a capped `fonts.ready` backstop; **re-run per viewport** :431 | **Better than any vendor's published advice.** Closed #2834 and #3030. Change nothing                        |
| Images                     | —                                                                                                                                                                                                                                                                                | force `loading="eager"`, scroll-to-bottom-and-back to fire IntersectionObserver, capped `networkidle`, per-image `load`, then `img.decode()` :462–508                                 | Closed #1731 and #1704. Change nothing                                                                       |
| Time                       | PW `page.clock` overrides "`Date`, `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, `requestAnimationFrame`, `cancelAnimationFrame`, `requestIdleCallback`, `cancelIdleCallback`, `performance` and `Event.timeStamp`" ([clock](https://playwright.dev/docs/clock)) | Hand-rolled `StubDate` via `addInitScript` :68–105 — **`Date` only**                                                                                                                  | **T2.** The installed tool has this built in and unused                                                      |
| PRNG                       | No tool offers this                                                                                                                                                                                                                                                              | mulberry32 + `__VR_RESET_PRNG__` re-seed per story :93–105, :306                                                                                                                      | Ours. Nothing makes it redundant. Keep                                                                       |
| Hover state                | —                                                                                                                                                                                                                                                                                | `page.mouse.move(-1, -1)` :399                                                                                                                                                        | Correct and non-obvious. Keep                                                                                |
| Focus ring                 | —                                                                                                                                                                                                                                                                                | Not in the runner — #3033 was fixed in the component via a data attribute                                                                                                             | Right level. Keep                                                                                            |
| Scrollbars                 | —                                                                                                                                                                                                                                                                                | Not handled                                                                                                                                                                           | Unmeasured gap; headless Chromium in the PW image is unlikely to paint one. Low priority                     |
| Device scale factor        | PW `scale` defaults to `"device"` for `page.screenshot` (but `"css"` for `toHaveScreenshot`)                                                                                                                                                                                     | Not set → `"device"`                                                                                                                                                                  | **T5.** Latent: baselines are DSF-dependent. One word                                                        |
| Screenshot-time stylesheet | PW `style` "pierces the Shadow DOM and applies to the inner frames"                                                                                                                                                                                                              | `page.addStyleTag` :392 — does **neither**                                                                                                                                            | **T5.** Strict upgrade, same size                                                                            |
| Masking volatile regions   | PW `mask` + `maskColor`                                                                                                                                                                                                                                                          | Unused; 6 stories use `vr.disable` instead                                                                                                                                            | Available, unused. A masked region beats a disabled story                                                    |
| Per-viewport threshold     | jest-image-snapshot takes per-call options                                                                                                                                                                                                                                       | One `failureThreshold: 0.0005` percent for all three :582–583                                                                                                                         | Mobile is ⅓ desktop's pixel count, so the same _ratio_ is ~3× stricter in absolute pixels at mobile. Untuned |
| Per-pixel colour tolerance | PW `threshold` "Defaults to `0.2`"                                                                                                                                                                                                                                               | Not set → jest-image-snapshot's `defaultPixelmatchDiffConfig = { threshold: 0.01 }`                                                                                                   | **20× stricter than Playwright's default**, in the dimension anti-aliasing noise actually lives. See §3.3    |
| Cross-platform baselines   | PW `{platform}` token; Vitest bakes `-${platform}` into the default path                                                                                                                                                                                                         | Single set, `<story-id>--<viewport>.png`                                                                                                                                              | Deliberate (#2370). See §4                                                                                   |

### 3.1 The one lever the runner does not have

Playwright's `toHaveScreenshot` is an _assertion in `@playwright/test`_, not a method on `page`. Under Jest —
which is what `@storybook/test-runner` runs — it is unavailable. So the runner calls `page.screenshot()` once and
hands the buffer to `jest-image-snapshot`.

**Everything before that call is a hand-rolled substitute for the retry loop Playwright gives away.** The two-stage
font wait, the `clientWidth` poll after `setViewportSize`, the scroll-to-fire-IO dance, the capped `networkidle`,
the per-image `load` + `decode`, and the double-`requestAnimationFrame` are all answers to "is the page done yet?"
— a question `toHaveScreenshot` answers empirically instead of by enumeration.

That is not an argument to switch runners. It is an argument to **implement the loop**, which is ~15 lines:

```typescript
// T3 sketch — capture until two consecutive buffers are byte-identical.
let previous: Buffer | undefined;
let image: Buffer | undefined;
for (let attempt = 0; attempt < 3; attempt++) {
  image = await page.screenshot({ animations: "disabled", clip });
  if (previous && previous.equals(image)) break;
  previous = image;
}
```

Byte-equality is stricter than Playwright's own comparison (it re-compares with `threshold`), but for a page that
has genuinely settled it is the common case, and the loop caps out either way. It subsumes the residual noise the
enumerated waits miss — and it is the only lever that addresses **flake ledger class G** (a story that never
settles) by bounding rather than hanging, since each attempt is a fresh capture under Jest's own timeout.

### 3.2 The stale-baseline defect, root-caused to one line

Flake ledger row 20 — "`vr -u` accepts sub-threshold diffs and leaves stale baselines" — is live and unfiled. It
root-causes to one line of the installed library.

From `jest-image-snapshot@6.5.2`, [`src/diff-snapshot.js`](https://github.com/americanexpress/jest-image-snapshot/blob/v6.5.2/src/diff-snapshot.js):

```javascript
const shouldUpdate = ({ pass, updateSnapshot, updatePassedSnapshot }) =>
  updateSnapshot && (!pass || (pass && updatePassedSnapshot));
```

and, for `failureThresholdType: "percent"`:

```javascript
pass = diffRatio <= failureThreshold;
```

`updatePassedSnapshot` defaults to `false`
([`src/index.js:159`](https://github.com/americanexpress/jest-image-snapshot/blob/v6.5.2/src/index.js), and again at
`diff-snapshot.js:246`). `.storybook/test-runner.ts:573–584` does not set it.

**So:** a capture that drifts by ≤ 0.05 % sets `pass = true`, which makes `shouldUpdate` **false**, so `-u` leaves
the old PNG on disk. The drift is real but invisible, and it accumulates from a frozen reference point until one
change tips the _cumulative_ delta past 0.05 % — at which point the diff a human reviews contains months of
unrelated drift alongside the actual change.

**The fix is one option: `updatePassedSnapshot: true`.** It makes `-u` mean "this run's output is now the truth",
which is what everyone already assumes it means. It satisfies #3086's clause 2 — the class closes with a rule, not
a raised timeout — and it is the cheapest finding in this document.

Worth noting against §2.3: **Vitest's `--update` cannot express this distinction at all.** Its `'all'` mode updates
changed snapshots _and deletes obsolete ones_ in the same pass, with no confirm-per-image and no threshold
awareness. Migrating to Vitest would make this defect harder to reason about, not easier.

### 3.3 The threshold is 20× stricter than Playwright's default, in the wrong dimension

Two thresholds stack, and the repo only tunes one:

1. **Per-pixel** — pixelmatch's `threshold`, "An acceptable perceived color difference in the YIQ color space
   between the same pixel in compared images". Playwright defaults it to **0.2**. jest-image-snapshot defaults it
   to **0.01** (`defaultPixelmatchDiffConfig`). The repo sets no `customDiffConfig`, so it runs at **0.01**.
2. **Whole-image** — the repo's `failureThreshold: 0.0005` (0.05 % of pixels).

Anti-aliasing noise is a _small colour delta on many pixels_. At `threshold: 0.01` almost every AA-shifted pixel
counts as different, so the 0.05 % ratio gate is doing all the absorbing — which is why the tolerance had to be set
so tight to stay useful, and why sub-threshold drift is invisible rather than merely small.

Raising the per-pixel threshold toward Playwright's 0.2 and _lowering_ the ratio gate would absorb AA noise where it
actually lives and make the ratio gate mean "pixels genuinely changed colour". **This is a measurement, not a
recommendation** — the right numbers need a calibration run against the existing 3 044 baselines, which is the kind
of experiment #3088 should commission rather than a change this research should prescribe.

### 3.4 Which levers a different tool makes redundant

Deleted code is the real win, so: what actually goes away?

| Move to                           | Levers made redundant                                                                                                                                                                                                                                   | Levers you still own                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Playwright `toHaveScreenshot`** | Retry-until-stable, animations, caret, mask, scale, `stylePath`, per-platform naming, `--update-snapshots changed\|missing\|all\|none`, the frozen clock (via `page.clock`)                                                                             | Fonts, images, PRNG, hover parking, viewport loop, story discovery, tag filtering, `parameters.vr.*` — **and you re-implement everything `@storybook/test-runner` gave free**         |
| **Vitest `toMatchScreenshot`**    | Retry-until-stable, per-platform naming, comparator config, diff-path config                                                                                                                                                                            | Fonts, images, clock, PRNG, hover, **and the per-story seam does not exist** (§2.2)                                                                                                   |
| **Argos**                         | Baseline storage, review UI, the `vr-baseline-update.yml` bot, the 176 MB + 808 MB                                                                                                                                                                      | **All 589 lines.** Argos ingests images _your_ CI produced                                                                                                                            |
| **Chromatic**                     | Baseline storage, review UI, the bot, the 176 MB + 808 MB, the amd64 pin, `Dockerfile.vr`, `docker-compose.vr.yml`, `scripts/vr-docker.mjs`, the animation stylesheet (Chromatic pauses CSS animations at a frame), the whole viewport loop (→ "modes") | Fonts (Chromatic's own [font-loading](https://www.chromatic.com/docs/font-loading/) docs tell you to wait on `document.fonts.ready` in a loader and self-host), JS animations, images |
| **Keep + T1–T5**                  | Nothing removed by a vendor; **~45 lines deleted by hand** (T2 −40, T5 net −5), ~15 added (T3)                                                                                                                                                          | Everything, which is the point: it is all already written and green                                                                                                                   |

Chromatic deletes by far the most code. It is also the only one that would cost Enterprise money at this volume.

---

## 4. Apple Silicon vs CI parity

**No option makes an arm64 Mac render like an amd64 Linux CI runner.** Every primary source says the same thing —
Playwright ("Browser rendering can vary based on the host OS, version, settings, hardware…"), Vitest ("rendering is
not perfectly deterministic across environments… Docker containers, CI-only visual testing workflows, or cloud
services are strongly recommended"), and this repo's own #2370 measurement (arm64: 52 of 57 baselines drift; pinned
amd64: **0 of 57**, byte-identical to CI).

There are only four shapes of answer, and the repo is using the second:

1. **Native arm64 baselines** — fast locally, wrong in CI. Ruled out by #2370's 52/57.
2. **Emulate amd64 locally (today).** Byte-identical, ~3.6× slower, full local run ~2.5 h, so
   `scripts/vr-docker.mjs` refuses unscoped runs (#2380).
3. **Two baseline sets.** Playwright supports this first-class: `snapshotPathTemplate` with `{platform}`, defaulting
   to names like `example-test-1-chromium-darwin.png`; Vitest bakes `-${platform}` into its default path. Cost here:
   **6 088 files and ~352 MB committed**, two sets to keep in sync, and two chances to update the wrong one.
   Available under a runner change, not under `jest-image-snapshot` without hand-rolling
   `customSnapshotIdentifier`.
4. **Never capture locally.** Capture only in CI (Argos, Chromatic, or just this repo's existing
   `@kcvv-bot update-vr-baselines` workflow). The emulation penalty stops existing because the emulation stops.

**primer/react chose (4), and wrote it into a `.gitignore`:** `*.png` then `!*-linux.png`, "Only include snapshots
from Linux as these are used in CI." A team with far more contributors decided that per-platform baselines were not
worth the sync cost, and that developers simply do not capture locally.

This repo is **most of the way to (4) already** and does not seem to have noticed: `vr-baseline-update.yml` mints a
GitHub App token, re-runs the suite with `-u` in the pinned CI container, commits the PNGs to the PR branch, and
pushes with an App token specifically so that the push re-triggers `visual-regression` and verifies the new
baselines. That is a complete CI-capture-and-accept loop — the same thing a hosted service's "Accept changes"
button does. `docs/agents/testing-ops.md` currently reserves it for "drift you cannot reproduce locally" and
prescribes scoped local `vr:update:story` as the normal path.

**Inverting that default is free and removes the emulation penalty from the daily loop entirely** — no tool change,
no new dependency, no baseline churn. The cost is a round-trip through CI (~10 min, or ~4 min after T4) instead of
a scoped ~3-minute local run, and losing the ability to iterate on a diff offline. That trade is a decision for
#3088, but it is the single highest-leverage answer to "Apple Silicon vs CI parity", and it needs no migration.

---

## 5. Migration cost, stated honestly

### 5.1 Option A — Keep and tune (first-class option, with its own cost)

**What changes:** five tunes in `.storybook/test-runner.ts` and `ci.yml`. **Net ~−30 lines of runner code.**

| Tune | Change                                                                                                                  | Risk                                                                                                                                                                                                          | Effort                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| T1   | `updatePassedSnapshot: true` in the `toMatchImageSnapshot` options                                                      | **Low but not zero** — the next `-u` run rewrites every baseline whose capture differs at all, so the first run after this lands will produce a large, noisy diff. Land it alone, on its own PR, with the bot | 1 line + one CI run                 |
| T2   | Replace `determinismInitScript`'s `StubDate` with `page.clock.setFixedTime(FIXED_NOW_MS)` in `prepare`                  | Medium — `clock.install()` also stubs `requestAnimationFrame`, which the runner _awaits_ in three places; `setFixedTime` alone does not install fake timers, so use it, not `install`                         | ~40 lines deleted, one careful read |
| T3   | Two-shot stability loop around `page.screenshot`                                                                        | Low                                                                                                                                                                                                           | ~15 lines                           |
| T4   | `--shard=${{ matrix.shard }}/${{ strategy.job-total }}` in `visual-regression`, 4-way matrix                            | Low — officially documented with a GitHub Actions example in the test-runner README                                                                                                                           | Workflow only                       |
| T5   | `screenshot({ style: DETERMINISM_STYLESHEET, scale: "css", ... })`; delete `addStyleTag`, delete the `caret-color` rule | Low                                                                                                                                                                                                           | net −5 lines                        |

**Costs of keeping, stated plainly and not minimised:**

- The 176 MB stays in the working tree and the **808 MB stays in history forever** — 76 % of a 1.04 GiB pack. Every
  clone pays it. `git clone --filter=blob:none` mitigates for humans; CI checkouts still pay.
- Jest stays in the dependency graph. The maintenance tax is real and measured: jest-runtime 30.5.1 killed all 206
  suites via a lockfile-only PR (#2761), which is why `pnpm-lock.yaml` is in the VR path filter (`ci.yml:196`).
- `@storybook/test-runner` is not the path Storybook recommends for Vite projects. It is maintained today; that is a
  bet on the next 12–24 months, and it should be re-read at each Storybook major. The tripwire for one such
  breakage already exists (`test-runner.ts:222–232`, the `module.register()` check) — that is the right pattern and
  there should be more of it.
- ~8 000 runner-minutes/month keeps being spent. T4 raises that (4 shards × ~4 min ≈ 16 min vs 10.4) while cutting
  wall-clock. Free on this repo's plan; not free forever.

### 5.2 The other four options, costed

|                                       | What happens to 3 044 baselines                                                                                                                                                                          | What happens to 808 MB of history                                                             | What happens to 589 lines                                                                                                                                                                                        | Effort                                  | Recurring                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------- |
| **B — Storybook Vitest addon**        | **No path.** The generated tests are opaque; the seam is either an unverified `afterEach` + `elementLocator` spike or a hand-written portable-stories file per story                                     | Unchanged                                                                                     | Unchanged, plus new Vitest project config                                                                                                                                                                        | Unknown — **the spike must come first** | €0                                      |
| **C — Vitest `toMatchScreenshot`**    | All 3 044 renamed (default path bakes in `-${browserName}-${platform}`) or `resolveScreenshotPath` overridden. Recaptured either way — a different comparator (`@blazediff/core`) means different pixels | Unchanged; **+176 MB** if names change, since git sees renames of binary blobs as new blobs   | ~200 lines delete (retry, naming, comparator config); fonts/images/clock/PRNG stay. New: project split so viewport instances don't 3× the unit suite                                                             | 2–3 weeks                               | €0, on an **Experimental** API          |
| **D — Playwright `toHaveScreenshot`** | All 3 044 renamed to Playwright's template and recaptured                                                                                                                                                | Same as C                                                                                     | ~200 lines delete; **but** story discovery, tag filtering and `getStoryContext` must be rebuilt outside Storybook. Plus bump 1.60 → 1.63 across three pinned files, past the 1.62 component-testing model change | 3–4 weeks                               | €0                                      |
| **E — Argos**                         | Deleted from git; uploaded per run                                                                                                                                                                       | **Still 808 MB** unless history is rewritten (a force-push of every branch and every open PR) | **All 589 stay** — Argos ingests images your CI produced                                                                                                                                                         | ~1 week                                 | **$184–3 562/mo** (§2.5)                |
| **F — Chromatic**                     | Deleted from git; Chromatic holds them (≥ 12 months retention on all plans)                                                                                                                              | Same as E                                                                                     | **Most delete** — the whole Docker/amd64/viewport-loop/animation apparatus goes; fonts and images stay                                                                                                           | 1–2 weeks                               | **> $399/mo**, realistically Enterprise |

**On history rewriting:** E and F only recover the 808 MB with a `filter-repo` pass and a coordinated force-push of
every ref. On a repo with a wave of parallel agent worktrees and open PRs, that is its own project with its own
failure modes. Honest accounting says the 808 MB is **sunk** under every option; only the _growth_ stops (66
baseline-touching commits in the last 30 days).

### 5.3 Why "keep" wins, in one paragraph

B is blocked on an unverified spike and gives no VR even if it works. C bets 3 044 baselines and the repo's only
pixel gate on an API whose docs say "Experimental" and whose update model is worse than today's on the exact defect
that is live. D pays three weeks to rebuild story discovery that Storybook already does, in exchange for built-ins
that T3 and T5 approximate for ~15 lines. E keeps all 589 lines _and_ adds a bill. F is the genuinely attractive
one — it deletes the most and it would end the amd64 conversation permanently — and it costs Enterprise money at
2.3 M screenshots/month while being defeated by exactly the token-wide changes this redesign keeps making. Against
all of that, A is one day, deletes ~30 net lines, closes a live flake class with a one-line rule, roughly halves the
PR critical path, and changes no baselines.

---

## 6. Doc drift found on the way

Small deliverable findings, each a `file:line`.

1. **`.github/workflows/ci.yml:147,168,203` — the `REDESIGN-DISABLED` comments are stale.** They describe the VR
   chain as "paused during the redesign". `gh api repos/soniCaH/www.kcvvelewijt.be/actions/variables` returns
   `RUN_VISUAL_REGRESSION=true`, and 61 of the 100 most recent `ci.yml` runs executed the VR job. **VR is running.**
   Three comments to correct or delete.
2. **`docs/prd/visual-regression-testing.md:100` is falsified by #2370.** It says "Docker running Playwright's
   official multi-arch image (**Apple Silicon native**) eliminates this category of flakiness". The measured
   opposite is true — arm64 drifted 52/57 baselines, and `docker-compose.vr.yml:22` now pins `linux/amd64`
   precisely to stop being Apple-Silicon-native.
3. **`docs/prd/visual-regression-testing.md:113` ("Gates merge to `main` the same way the other quality-checks jobs
   do") is false.** #3086 measured `deploy` waiting on `quality-checks` only (`ci.yml:441`) and no branch protection
   on `main`. VR gates nothing.
4. **`docs/prd/visual-regression-testing.md:36`'s tooling rationale is half-obsolete** — see §2.5. The "SaaS tools
   hide diffs behind web UIs" half was answered in-house by `vr-diff-comment`.
5. **`@storybook/addon-a11y` is registered (`.storybook/main.ts:17`) and never runs in CI** _(measured — no a11y
   step in any workflow)_. Polaris and Carbon both run a11y as a separate non-pixel gate. Cheap coverage, sitting
   idle.
6. **`@storybook/test-runner` is pinned at 0.24.4 (2026-05-14); 0.24.5 shipped 2026-09-02.** Under this repo's
   Renovate setup that should have surfaced; worth a look at why it did not.

---

## 7. Open questions

Sharp enough to become tickets on #3078:

- **Q1 — Should VR stop running unconditionally on every push to `main`?** ~217 of ~770 monthly runs, ~2 250
  runner-minutes, feeding a check `deploy` does not wait on. The `ci.yml:208` comment says it exists to catch
  merge-race regressions on the merge commit. That is a real reason; it is also the only reason, and it is
  unmeasured — **has a push-to-`main` VR run ever caught a regression a PR run did not?** Answerable from run
  history.
- **Q2 — Calibrate the two thresholds.** Run the existing 3 044 baselines at `customDiffConfig.threshold` ∈
  {0.01, 0.05, 0.1, 0.2} × `failureThreshold` ∈ {0.0001, 0.0005, 0.001} and pick the pair that separates real
  regressions from AA noise, per viewport. §3.3 says this needs an experiment, not an opinion.
- **Q3 — Should baseline capture move to CI-only by default?** §4. No tool change, removes the emulation penalty
  from the daily loop, inverts one paragraph of `docs/agents/testing-ops.md`. It is a workflow decision with real
  ergonomic cost.
- **Q4 — Wire the Vitest addon for `play`, independent of VR.** #3086 makes `play` load-bearing (26 geometry
  assertions re-homed, two E2E specs deleted) and only 11 of 208 story files have one. §2.2 has the exact config.
  This is the addon's real use case and it touches no baseline.

Still fog:

- **Does the `afterEach` + `page.elementLocator` + `toMatchScreenshot` combination actually work?** Both primitives
  are documented; the combination is published nowhere. A half-day spike would turn option B from "no path" into a
  costed option — or kill it for good. Worth doing _before_ anyone plans a Vitest VR migration, not during.
- **What does a TurboSnap-style "only changed stories" filter cost to build in-house?** Chromatic's `onlyChanged`
  is the only thing that makes hosted pricing survivable, and the idea — diff the build, shoot only affected
  stories — is not vendor magic. Whether it is tractable against a Vite/Storybook dependency graph is unknown.
- **Percy's actual paid pricing.** No standalone pricing table was reachable today; only third-party estimates
  exist, which this document excludes on principle. Recorded as unverified, not as absent.

---

## Sources

**Storybook** — [Test runner (Webpack)](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/integrations/test-runner.mdx),
[Vitest addon](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/integrations/vitest-addon/index.mdx),
[Vitest addon migration guide](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/integrations/vitest-addon/migration-guide.mdx),
[Visual tests](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/visual-testing.mdx),
[Interaction tests](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/interaction-testing.mdx),
[Stories in unit tests](https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/integrations/stories-in-unit-tests.mdx),
[MIGRATION.md](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md),
[test-runner README](https://github.com/storybookjs/test-runner/blob/next/README.md),
[test-runner CHANGELOG](https://github.com/storybookjs/test-runner/blob/next/CHANGELOG.md)

**Vitest** — [Visual regression testing](https://github.com/vitest-dev/vitest/blob/main/docs/guide/browser/visual-regression-testing.md),
[Browser assertions](https://github.com/vitest-dev/vitest/blob/main/docs/api/browser/assertions.md),
[Browser context](https://github.com/vitest-dev/vitest/blob/main/docs/api/browser/context.md),
[`browser.expect`](https://github.com/vitest-dev/vitest/blob/main/docs/config/browser/expect.md),
[`browser.instances`](https://github.com/vitest-dev/vitest/blob/main/docs/config/browser/instances.md),
[`update`](https://github.com/vitest-dev/vitest/blob/main/docs/config/update.md)

**Playwright** — [Screenshots / test-snapshots](https://playwright.dev/docs/test-snapshots),
[`toHaveScreenshot`](https://playwright.dev/docs/api/class-pageassertions),
[`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot) and
[`params.md`](https://github.com/microsoft/playwright/blob/v1.60.0/docs/src/api/params.md),
[Clock](https://playwright.dev/docs/clock), [Test CLI](https://playwright.dev/docs/test-cli),
[Components](https://playwright.dev/docs/test-components), [CI](https://playwright.dev/docs/ci),
[`snapshotPathTemplate`](https://playwright.dev/docs/api/class-testconfig#test-config-snapshot-path-template)

**jest-image-snapshot v6.5.2** — [`src/index.js`](https://github.com/americanexpress/jest-image-snapshot/blob/v6.5.2/src/index.js),
[`src/diff-snapshot.js`](https://github.com/americanexpress/jest-image-snapshot/blob/v6.5.2/src/diff-snapshot.js)

**Vendors** — [Chromatic pricing](https://www.chromatic.com/pricing), [billing](https://www.chromatic.com/docs/billing),
[snapshots](https://www.chromatic.com/docs/snapshots), [open source](https://www.chromatic.com/docs/open-source),
[monorepos](https://www.chromatic.com/docs/monorepos), [font loading](https://www.chromatic.com/docs/font-loading/),
[animations](https://www.chromatic.com/docs/animations/) · [Argos pricing](https://argos-ci.com/pricing),
[docs](https://argos-ci.com/docs), [open source](https://argos-ci.com/docs/learn/billing-and-subscription/open-source.md) ·
[Percy plans and billing](https://www.browserstack.com/docs/percy/overview/plans-and-billing) ·
[Lost Pixel repo (archived)](https://github.com/lost-pixel/lost-pixel),
[sunset announcement](https://www.lost-pixel.com/blog/lost-pixel-team-is-joining-figma)

**Design-system repos surveyed** — linked inline in §1.1

**This repo** — `apps/web/.storybook/test-runner.ts`, `apps/web/.storybook/main.ts`, `apps/web/vitest.config.ts`,
`apps/web/package.json`, `apps/web/Dockerfile.vr`, `apps/web/docker-compose.vr.yml`,
`apps/web/test/vr/structural-assertions.ts`, `.github/workflows/ci.yml`, `.github/workflows/vr-baseline-update.yml`,
`docs/agents/testing-ops.md`, `docs/prd/visual-regression-testing.md`, `apps/web/CLAUDE.md` ·
[#3086 layer contract](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086),
[#3085 layer balance](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3085),
[flake ledger](https://github.com/soniCaH/www.kcvvelewijt.be/blob/research/flake-ledger/docs/research/test-suite-flake-ledger.md),
[#2370](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2370),
[#2380](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2380),
[#2761](https://github.com/soniCaH/www.kcvvelewijt.be/pull/2761)
