# CI for a Turborepo monorepo — shape, affected-only, caching, sharding, gating, flake handling, cost

Research for [#3084](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3084), the last research child of map [#3078](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078).
Measured 2026-09-22 against `main` at `ec15a8a8`. Every repo claim below carries a file:line, a run link, or the command that produced it.

Binding inputs: [#3086](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086) (layer contract), [#3082](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3082) (keep the VR tool), [#3083](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3083) (keep Vitest), [#3081](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3081) (keep Playwright, frozen dataset), [#3080](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3080) (flake ledger), [#3079](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3079) (inventory).

---

## 0. The outward question first

The map's standing rule is that no research ticket may presuppose the installed tool. For CI the outward question is **not** "which provider" — it is **what shape should this pipeline have for a one-maintainer public repo where up to four agent PRs land in a wave?**

GitHub Actions is nonetheless judged on merit here, and it wins on a fact that turns out to decide several later sections:

> "Use of the standard GitHub-hosted runners is free and unlimited on public repositories."
> — [docs.github.com/en/actions/reference/runners/github-hosted-runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners#standard-github-hosted-runners-for-public-repositories)

**This repository is public.** Measured:

```bash
gh api repos/soniCaH/www.kcvvelewijt.be -q '{private, visibility, owner: .owner.type}'
# {"private": false, "visibility": "public", "owner": "User"}
```

Two consequences run through everything below:

1. **Runner minutes are genuinely €0, not "€0 until a quota runs out."** The free-minutes quota table applies to private repositories only. There is no budget to blow. Cost arguments in this document are therefore about _wall-clock_, _attention_ and _trust_, not money — with one real exception (§8).
2. **Public repos get bigger runners**: `ubuntu-latest` is 4 CPU / 16 GB on a public repo versus 2 CPU / 8 GB on a private one ([same page](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)). The measured timings below are on the 4-core machine.

A second merit check — Turborepo's own CI guidance — also matters, because it argues _against_ the direction most "optimise your monorepo CI" advice pushes:

> "Turborepo's caching abilities allow you to create fast CI pipelines with **minimal complexity**. […] As your codebase scales, you may find more specific opportunities to optimize your CI — but relying on caching is a great place to start."
> — [Constructing CI § Rely on caching](https://turborepo.dev/docs/crafting-your-repository/constructing-ci)

Turborepo ships exactly **one** job in every tab of its official GitHub Actions recipe ([guides/ci-vendors/github-actions](https://turborepo.dev/docs/guides/ci-vendors/github-actions)), and a code search across `vercel/turborepo` for `strategy matrix` and `sharding` returns **zero** hits. The per-package matrix fan-out is a community pattern with no first-party endorsement. That is a confirmed negative, not a gap.

**So the burden of proof is on fanning out, not on staying.** The rest of this document tries to meet that burden with numbers, and mostly fails to — which is the finding.

---

## 1. Shape — is one serial job right?

### 1.1 The 25 minutes is a timeout, not a duration

The brief for this ticket described `quality-checks` as "one serial 25-minute job". **25 is `timeout-minutes` (`ci.yml:45`), not the runtime.** Measured over the 100 most recent completed `ci.yml` runs (window 2026-09-20T19:14 → 2026-09-22T11:34, 40.3 h):

| Job                          | n   | min   | p50                  | p90   | max             |
| ---------------------------- | --- | ----- | -------------------- | ----- | --------------- |
| `Quality Checks + Build`     | 67  | 86 s  | **397 s (6.6 min)**  | 439 s | 482 s (8.0 min) |
| `Visual Regression`          | 61  | 450 s | **635 s (10.6 min)** | 659 s | 721 s           |
| `VR — Detect visual changes` | 70  | 10 s  | 13 s                 | 16 s  | 60 s            |
| `Deploy API staging`         | 43  | 41 s  | 47 s                 | 55 s  | 73 s            |
| `Deploy API + Studio`        | 23  | 71 s  | 76 s                 | 88 s  | 101 s           |
| `E2E` (separate workflow)    | 66  | —     | **196 s (3.3 min)**  | 224 s | 271 s           |

```bash
gh api "repos/soniCaH/www.kcvvelewijt.be/actions/workflows/ci.yml/runs?per_page=100&status=completed" \
  -q '.workflow_runs[] | [.id,.event,.conclusion,.head_branch,.run_started_at,.updated_at] | @tsv'
# then, per run id:
gh api "repos/soniCaH/www.kcvvelewijt.be/actions/runs/<id>/jobs?per_page=50"
```

`quality-checks` has never come within 3× of its timeout in 100 runs. **The job is not slow; it is just long relative to what it needs to be.**

### 1.2 Where the 397 seconds actually go

Step-level p50 across the 67 successful `quality-checks` runs:

| #     | Step                                                  | p50       | p90   |
| ----- | ----------------------------------------------------- | --------- | ----- |
| 1–5   | Set up job + checkout + pnpm + node + install         | **35 s**  | 49 s  |
| 6     | Lint (`turbo lint --filter=@kcvv/web`)                | 25 s      | 27 s  |
| 7     | knip                                                  | 3 s       | 4 s   |
| 8     | Type check (web)                                      | 5 s       | 6 s   |
| 9     | **Run tests (web, `--coverage`)**                     | **255 s** | 298 s |
| 10–12 | api type-check, api tests, api-contract tests         | 3 s       | 16 s  |
| 13–15 | Studio lint+type-check, Studio UI tests, Build Studio | 3 s       | 7 s   |
| 16    | Sanity types in sync                                  | 1 s       | 2 s   |
| 17    | `pnpm audit`                                          | 1 s       | 1 s   |
| 18    | Upload coverage                                       | 2 s       | 3 s   |
| 19    | Build Next.js                                         | **2 s**   | 54 s  |
| 20    | Build Storybook                                       | **34 s**  | 36 s  |
| 21    | Upload Storybook static                               | 3 s       | 3 s   |

**One step is 64 % of the job.** `Run tests` at 255 s dwarfs everything else; the entire rest of the cross-workspace matrix — api, api-contract, both studios, sanity-schemas — costs **6 seconds combined at p50**. Any fan-out that splits "web" from "the other five workspaces" is splitting 255 s from 6 s.

Note also step 9's cost is mostly _coverage_: [#3083](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3083) measured the same suite locally at 98.6 s without `--coverage`. CI pays ~2.5× for a coverage report that is uploaded to Codecov and gates nothing.

### 1.3 The real critical path, and the one split that moves it

Today's dependency graph (`ci.yml:198–214`): `quality-checks` → `visual-regression`. VR needs `quality-checks` for exactly one artifact — the Storybook static built in steps 20–21.

```text
today:   [-------- quality-checks 397s --------][------ VR 635s ------]  = 1032s = 17.2 min
```

That matches [#3079](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3079)'s "~17 min critical path per visual PR" independently.

**VR waits 397 seconds for a 37-second artifact.** Splitting the Storybook build into its own job:

```text
split:   [ storybook 77s ][------ VR 635s ------]                        = 712s = 11.9 min
         [-------- quality-checks 360s --------]
```

- New job cost: 35 s setup + ~5 s `turbo typegen` (VR needs `sanity.types.ts`) + 34 s build + 3 s upload = **77 s**.
- `quality-checks` sheds 37 s.
- **Critical path 17.2 → 11.9 min (−31 %) for +40 s of runner time (+4 %).**

That is the single best lever in the pipeline, and it is one job. Splitting the _test_ step out as well:

```text
both:    [ storybook 77s ][------ VR 635s ------]                        = 712s
         [ web tests 290s ]
         [ everything else 117s ]
```

The test split buys nothing extra while VR is the long pole — it only helps the ~30 % of PRs that skip VR, taking those from 6.6 min to 4.8 min. **Marginal.**

### 1.4 What the split costs that is not runner-minutes

Each extra job re-pays 35 s of setup, and — this is the part that is easy to miss — **it also loses cache locality within the run.** Measured in run [35531636464](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/35531636464): `@kcvv/sanity-schemas#build` was a `cache miss, executing` during step 9 and then a `cache hit, replaying logs` in steps 13, 15 and 19. One job executes a shared dependency once; four jobs execute it four times (or four times fetch it from the remote cache).

There is also a _trust_ cost the numbers do not show: 14 steps in one job produce one ordered, greppable log. Four jobs produce four, and a human debugging a wave at 23:00 has to find which one.

**Verdict on shape: do the Storybook split. Do not do the rest.** It is one job, it is the only change that moves the critical path by more than two minutes, and it does not multiply the log surface. The general fan-out fails its burden of proof: 6 seconds of cross-workspace work is not worth five jobs.

One caveat that must ship with the split: VR would no longer wait for lint/type-check/test to pass, so a PR with a lint error would still pay for a 10-minute VR run. Measured cost of that insurance today: **`quality-checks` failed 0 times in 100 runs.** Across the 300 most recent `ci.yml` runs the whole workflow concluded `failure` 8 times (3.0 %), and all 5 failures inside the sampled window were the `visual-regression` job, not `quality-checks`. The insurance is worth roughly nothing.

---

## 2. Affected-only execution

### 2.1 What `--affected` actually promises

> "Filter to only packages that are affected by changes on the current branch. […] By default, the flag is equivalent to `--filter=...[main...HEAD]`."
> "**By default, `--affected` operates at the package level**: if any file in a package changed, all of its tasks are selected. Enable `futureFlags.affectedUsingTaskInputs` to filter at the task level using each task's `inputs` globs instead."
> — [turborepo.dev/docs/reference/run#--affected](https://turborepo.dev/docs/reference/run#--affected)

The maintainer's statement of the design limit is blunter:

> "`--affected` is just a filter flag under the hood … Note that this is a set of **packages**, so we cannot take into account `inputs` at all, since those are defined at the task level."
> — NicholasLYang, [vercel/turborepo#9329](https://github.com/vercel/turborepo/issues/9329)

`--affected` requires Turborepo ≥ 2.1 ([blog/turbo-2-1-0](https://turborepo.dev/blog/turbo-2-1-0)); this repo is on `2.10.12` (`package.json:25`), so it is available.

### 2.2 The prize, measured

The question is not "would `--affected` work" but "what would it skip". Measured across the **120 most recently merged PRs** (2026-09-09 → 2026-09-22):

```bash
gh pr list --state merged --limit 120 --json number,mergedAt,files \
  -q '.[] | [(.number|tostring), .mergedAt, ([.files[].path] | join(","))] | @tsv'
```

| Class                                                               | PRs    | Share |
| ------------------------------------------------------------------- | ------ | ----- |
| `apps/web` only                                                     | **84** | 70 %  |
| touches root / lockfile / `turbo.json` → everything affected anyway | 13     | 11 %  |
| `apps/api` only                                                     | **10** | 8 %   |
| multi-workspace (2–4 workspaces)                                    | 10     | 8 %   |
| `packages/sanity-studio` only                                       | 1      | <1 %  |
| `packages/sanity-schemas` only                                      | 1      | <1 %  |
| docs-only (workflow never triggers)                                 | 1      | <1 %  |

**70 % of PRs touch `apps/web`, which is the package that owns 255 of the job's 397 seconds.** For those, `--affected` selects `@kcvv/web` and changes nothing at all.

For the 8 % that touch only `apps/api`, `--affected` would skip web lint + web test + web build + Storybook. But **the cache already skips them** — `@kcvv/web`'s inputs did not change, so `turbo test --filter=@kcvv/web` is a replay, not a run. That is precisely Turborepo's "rely on caching" position, and it is why the docs recommend caching before filtering.

The residual prize over a correct cache is the _container setup_ — the 35 s install that runs before Turbo can tell you it had nothing to do. Turborepo documents a tool for exactly that, and it is not `--affected`:

> "Using `turbo query affected`, you can skip lengthy container preparation steps like dependency installation that will end up resulting in a cache hit, anyway."
> `--exit-code`: "It exits with code `1` when results are found, `0` when nothing is affected, or `2` on errors."
> — [Constructing CI](https://turborepo.dev/docs/crafting-your-repository/constructing-ci)

`turbo query affected` is also the documented replacement for the deprecated `turbo-ignore`, and unlike `--affected` it _does_ respect task `inputs` (`turbo query affected --tasks test --packages docs`).

**Prize: ~10 of 120 PRs × ~35 s = ~6 minutes per month.** Against a ~20 000 min/month pipeline. This is noise.

### 2.3 When affected-only is unsafe here — three concrete traps

**Trap 1 — the checkout is shallow, so `--affected` would silently be a no-op today.**

`ci.yml:51` and `e2e.yml:78` call `actions/checkout@v7.0.1` with **no `fetch-depth`**, which defaults to 1. Only `vr-diff-comment` (`ci.yml:307`) sets `fetch-depth: 0`. Turborepo's own warning:

> "The comparison requires everything between base and head to exist in the checkout. **If the checkout is too shallow, then all packages will be considered changed.** For example, setting up Git to check out with `--filter=blob:none --depth=0` will ensure `--affected` has the right history to work correctly."
> — [reference/run#--affected](https://turborepo.dev/docs/reference/run#--affected)

This fails _safe_ (everything runs) but it means adding `--affected` today would change nothing while looking like it did. Note the trap in Turborepo's own docs: the [GitHub Actions recipe](https://turborepo.dev/docs/guides/ci-vendors/github-actions) uses `fetch-depth: 2` in every tab — enough for `[HEAD^1]`, **not** enough for `main...HEAD` — and that page never mentions `--affected`.

**Trap 2 — the lockfile, which is the one the repo has already been burned by.**

[#2761](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2761) is the precedent, and it is why the VR path filter carries `pnpm-lock.yaml` (`ci.yml:194–196`): a lockfile-only PR bumped `jest-runtime` to 30.5.1 and killed all 206 VR suites, and because the PR touched no source file, VR skipped and the break landed on `main` unseen.

The primary sources **contradict each other** on what Turborepo does here, and the contradiction matters:

- The `turbo query affected` reason table is package-scoped: `LockfileChanged` = "The lockfile comparison found added or removed external dependencies **for this package**", with all-packages selection only on the failure modes `LockfileChangeDetectionFailed`, `LockfileChangedWithoutDetails`, `GitRefNotFound`, `ScmError`. ([reference/query](https://turborepo.dev/docs/reference/query#understanding-affected-package-reasons))
- The configuration page's future-flag callout says the opposite: "Changes to root configuration files (`package.json`, `turbo.json`, `turbo.jsonc`), **the package manager lockfile**, or `globalDependencies` will always cause all tasks to be selected, regardless of individual task `inputs`." ([reference/configuration](https://turborepo.dev/docs/reference/configuration))

Unresolved from docs alone. The settling command, which nobody has run:

```bash
turbo query affected --packages --base main --head HEAD | jq '.data.affectedPackages'
```

Either way, **`--affected` cannot protect the VR runner**, because the VR runner is not a Turbo task — `vr:ci` is a package script (`apps/web/package.json`) driven by `test-storybook`, and the thing `jest-runtime` broke was the runner itself. The `paths-filter` entry for `pnpm-lock.yaml` remains load-bearing and is not replaceable by Turbo's change detection.

**Trap 3 — `turbo.json` and root-config edits select everything.** `DefaultGlobalFileChanged` = "`turbo.json` or `turbo.jsonc` changed. **All packages are selected.**" Two open/closed upstream issues show this firing more widely than expected: [#10869](https://github.com/vercel/turborepo/issues/10869) (a whitespace edit to root `package.json` made `ls --affected` report all packages while `--dry=json` correctly reported `cache: HIT`) and [#11144](https://github.com/vercel/turborepo/issues/11144) (Renovate bumping one dep in one package selected all 11 packages). For a repo where Renovate opens a meaningful share of PRs, this is the common case, not the edge case.

And [#14149](https://github.com/vercel/turborepo/issues/14149), opened 2026-09-21 and still open, reports `--affected` ignoring negated `globalDependencies` globs so excluded files still select every task.

### 2.4 Verdict on affected-only

**Do not adopt `--affected`.** It would skip ~6 minutes per month of work the cache already skips, it is a no-op until the checkout is deepened, its behaviour on the repo's one historical lockfile disaster is undocumented and contradictory between two first-party pages, and the task-level variant (`futureFlags.affectedUsingTaskInputs`) would inherit the broken `test.inputs` whitelist tracked as [#3096](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3096) — pointing task-level change detection at a whitelist that is already known to miss 10 of 370 test files makes a correctness bug worse, not better.

The 14 hardcoded `--filter` flags in `ci.yml` are not elegant, but they are **explicit, auditable and cheap**, and they have one property `--affected` does not: a human can read `ci.yml` and know exactly what runs. Keep them. Revisit only if a seventh workspace makes the list unmanageable.

---

## 3. Caching — the section with the real finding

### 3.1 The remote cache is wired, and it is hitting — unevenly

`TURBO_TOKEN` (secret) + `TURBO_TEAM` (repo variable `sonicahs-projects`) are set as workflow-level `env` in both `ci.yml:32–34` and `e2e.yml`. Logs confirm `• Remote caching enabled` on every Turbo invocation.

Measured hit rates, by classifying each step's duration (a Turbo replay is <10 s; a real run is >150 s) across the 67 successful `quality-checks` runs:

| Step                  | PR runs: hit            | PR: miss | push runs: hit | push: miss |
| --------------------- | ----------------------- | -------- | -------------- | ---------- |
| `Run tests` (web)     | 7 (16 %)                | 37       | 14 (61 %)      | 9          |
| `Build Next.js` (web) | **41 (93 %)**           | 3        | 12 (52 %)      | 11         |
| `Lint` (web)          | 18 of 67 overall (27 %) | 45       | —              | —          |

This is inverted from intuition, and the inversion is real. Confirmed on a single commit, run [35531636464](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/35531636464) (`feat/issue-2585`), by slicing the raw log against each step's `started_at`/`completed_at`:

```text
[9]  Run tests      @kcvv/web#test   -> cache miss, executing a291a8068987cbf3   4m45.992s
[19] Build Next.js  @kcvv/web#build  -> cache hit,  replaying logs  (4 cached, 4 total)  2.423s  >>> FULL TURBO
```

**Same tree, same job, same run: the web build is a remote cache hit and the web test is a miss.**

### 3.2 Why — and it is not a Turbo bug

The most likely mechanism, and it is worth stating because it changes how the remote cache should be read:

**Vercel builds every PR and writes `@kcvv/web#build` to the same team cache; nothing writes `@kcvv/web#test`.**

Evidence:

- `vercel.json` sets `{"framework": "nextjs"}`; the GitHub deployments API shows a `Preview` deployment by `vercel[bot]` per PR head SHA and a `Production` deployment per `main` push.
- `TURBO_TEAM` is `sonicahs-projects`, a Vercel team slug, and Vercel Remote Caching is team-scoped: "artifacts can be downloaded during the build by any team members" ([vercel.com/docs/monorepos/remote-caching](https://vercel.com/docs/monorepos/remote-caching)).
- The asymmetry falls exactly along the line "does Vercel also run this task": `build` hits 93 % on PRs; `lint`, `type-check` and `test` — which Vercel never runs — miss.

The 61 % hit rate for `test` on **push** events has a separate and more interesting cause: a squash-merge onto an unmoved `main` reproduces the PR branch's exact tree, so the `main` CI run replays the PR run's results. That is legitimate caching — and it is also the mechanism [#3096](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3096) flags as dangerous, because `test.inputs` is a hand-maintained whitelist:

```json
"test": {
  "dependsOn": ["^build"],
  "outputs": ["coverage/**"],
  "inputs": ["src/**", "tests/**", "vitest.config.*"]
}
```

`turbo.json`'s own docs are explicit that this is a replacement, not a filter:

> "Using the `inputs` key opts you out of `turbo`'s default behavior of considering `.gitignore`. You must reconstruct the globs from `.gitignore` as desired or **use `$TURBO_DEFAULT$` to build off of the default behavior**."
> — [reference/configuration#inputs](https://turborepo.dev/docs/reference/configuration#inputs)

`apps/web` keeps 9 test files under `test/` (singular) plus `next.config.test.ts` at the package root. None are hashed. #3096 already carries the fix (`$TURBO_DEFAULT$` + `$TURBO_ROOT$/…` entries) and the owner has chosen that shape. **Nothing in this document should land before it**, because a 61 %-hit `main` run replaying a green that never executed is the worst possible interaction with §5's gating question.

### 3.3 Nobody has ever verified the cache

There is no CI step that asserts a cache hit, and no run summary has been diffed. Turborepo documents exactly one mechanism for "why did these two runs hash differently":

> "`--summarize` generates a JSON file in `.turbo/runs` […] Comparing two summaries will show why two task's hashes are different."
> — [reference/run#--summarize](https://turborepo.dev/docs/reference/run#--summarize)

`--dry=json`'s `.tasks[].cache.status` field (`HIT`/`MISS`) works and is used in maintainer-acknowledged issue [#10869](https://github.com/vercel/turborepo/issues/10869), but it is **not** in the documented field table — treat it as working-but-undocumented.

Two configured-but-unexamined hazards worth one command each:

- **`envMode` defaults to `strict`** ([reference/configuration#envmode](https://turborepo.dev/docs/reference/configuration#envmode)). The `build` task declares `env: [KCVV_API_URL, NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_READ_TOKEN]`; `test`, `lint` and `type-check` declare none. Turborepo's warning: "If you haven't defined the `env` or `globalEnv` keys for your task, Turborepo will not be able to use them when creating hashes. This means your task can **hit cache despite being in a different environment**." That is a wrong-hit hazard, not a missed-hit one.
- **No `TURBO_REMOTE_CACHE_SIGNATURE_KEY`** is set. Artifact signing is opt-in (`remoteCache.signature: true`); without it, cache integrity rests entirely on token secrecy. For a public repo whose cache is shared with Vercel production builds, that is worth one deliberate decision rather than a default.

### 3.4 The GitHub Actions cache is a different thing, and it does not work for waves

`actions/setup-node@v7` with `cache: "pnpm"` uses `actions/cache` under the hood, which has a scoping rule the Turbo remote cache does not:

> "**Workflow runs cannot restore caches created for child branches or sibling branches.** […] a cache created for the `feature-a` branch with the base `main` would not be accessible to its sibling `feature-c` branch with the base `main`."
> "When a cache is created by a workflow run triggered on a pull request, the cache is created for the merge ref (`refs/pull/.../merge`). Because of this, the cache will have a limited scope and can only be restored by re-runs of the pull request."
> — [dependency-caching](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)

**In a four-PR wave, each agent's pnpm-store cache is invisible to the other three.** All four read `main`'s cache and all four write caches nobody else will use. This is not fixable by configuration; only a `push`-triggered run on `main` can warm the shared scope. The measured `Install dependencies` step is 10 s at p50, so the impact is small — but it is the reason the _Turbo_ remote cache (team-scoped, no branch isolation) is the one that actually serves a wave, and it should not be traded away for an `actions/cache` scheme.

Repo cache limits, for reference: 10 GB per repository, LRU eviction by last access, entries untouched for 7 days removed.

---

## 4. Sharding

### 4.1 E2E — no

Measured E2E step p50 over 12 successful runs:

| Step                                                           | p50      |
| -------------------------------------------------------------- | -------- |
| Set up job + init container + checkout + pnpm + node + install | 64 s     |
| Build api-contract + Build Next.js                             | 59 s     |
| **Run Playwright e2e suite**                                   | **63 s** |
| Uploads                                                        | 2 s      |

**The suite itself is 63 seconds of a 196-second job.** Fixed cost is 123 s. Sharding 2× gives `123 + 32 = 155 s` wall (−41 s) for `2 × 155 = 310 s` runner (+114 s). Sharding buys 41 seconds and costs a second job's worth of complexity and a `merge-reports` job on top.

The config is already doing the right thing without shards — `fullyParallel: true`, `workers: process.env.CI ? 2 : undefined` (`apps/web/test/e2e/playwright.config.ts`) — and Playwright only shards at test granularity _because_ `fullyParallel` is on:

> "With `fullyParallel: true`: Tests are split at the individual test level […] Without `fullyParallel`: Tests are split at the file level."
> — [playwright.dev/docs/test-sharding](https://playwright.dev/docs/test-sharding)

**Verdict: do not shard E2E.** 56 tests in 63 seconds is not a sharding problem. If E2E wall time ever matters, the lever is the 59 s `Build Next.js` step, not the test run.

### 4.2 VR — yes, and it is the one place sharding pays

Measured `Visual Regression` step p50 over 56 successful runs:

| Step                                                                               | p50       |
| ---------------------------------------------------------------------------------- | --------- |
| Set up job + init container + checkout + pnpm + node + install + download artifact | **65 s**  |
| **Run visual regression suite**                                                    | **565 s** |

**89 % of the job is the suite.** That is the opposite profile from E2E, and it is exactly the shape sharding is for. `--shard` is a first-class `test-storybook` option and the Storybook repo ships an official GitHub Actions matrix example for it:

> `--shard [shardIndex/shardCount]` — "Splits your test suite across different machines to run in CI. `test-storybook --shard=1/3`"
> — [storybookjs/test-runner README](https://github.com/storybookjs/test-runner)

Shard arithmetic on the measured 65 s fixed / 565 s variable:

| Shards    | Wall per shard | Critical path | Runner-min per VR run | Δ wall       | Δ runner |
| --------- | -------------- | ------------- | --------------------- | ------------ | -------- |
| 1 (today) | 630 s          | 630 s         | 10.5                  | —            | —        |
| 2         | 348 s          | 348 s         | 11.6                  | **−4.7 min** | +1.1 min |
| 3         | 253 s          | 253 s         | 12.7                  | **−6.3 min** | +2.2 min |
| 4         | 206 s          | 206 s         | 13.7                  | **−7.1 min** | +3.2 min |

Combined with §1.3's Storybook-build split, a visual PR's critical path goes `17.2 min → 77 s + 206 s = 4.7 min`, at which point `quality-checks` (6.6 min) becomes the long pole again and 4 shards are over-provisioned. **3 shards is the knee**: critical path `77 + 253 = 5.5 min`, still under `quality-checks`, for +2.2 runner-min.

Two caveats, both real:

- `test-storybook --shard` delegates to Jest's `--shard`, which is **file-level**. With 208 story files the balance should be acceptable, but it is not test-level like Playwright's.
- The baseline-diff artifact flow (`vr-diff-comment`, `ci.yml:275–390`) downloads diff PNGs from one job. With shards it must gather from N, and the sticky-comment builder has to merge N sets. That is real work, and it is why this is a recommendation with a cost, not a free win.

**Verdict: shard VR 3×, but only as part of the same change as the Storybook split — and only after §5 decides whether VR gates anything, because sharding a check nobody waits on is optimising the wrong number.**

---

## 5. Gating — branch protection, merge queue, and the red-main alert

This section was re-opened by the owner, whose position is: _"This was never decided by me… But branch protection here wouldn't have helped? PRs always need to be green before merging, it was main itself that broke?"_

The intuition is largely right, and splitting "branch protection" into three distinct mechanisms shows exactly where.

### 5.1 The measured incident record

| Incident                                                           | Date       | What it was                                                                                             |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| [#2874](https://github.com/soniCaH/www.kcvvelewijt.be/pull/2874)   | 2026-09-08 | **Merge race.** #2761 + #2754 individually green; the combination broke the lockfile and the VR runner. |
| [#2883](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2883) | 2026-09-09 | Flake                                                                                                   |
| [#3017](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3017) | 2026-09-18 | Flake                                                                                                   |
| [#3094](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3094) | 2026-09-21 | Flake                                                                                                   |

**Score: 1 merge race, 3 flakes.** That ratio decides this section.

### 5.2 Mechanism 1 — require status checks to pass (loose)

Would have caught **none of the four**. Every PR was already green; the merge race was green-plus-green, and the three flakes were `main`'s own CI going red _after_ the merge.

`main` has no protection at all today:

```bash
gh api repos/soniCaH/www.kcvvelewijt.be/branches/main/protection
# 404 Branch not protected
gh api repos/soniCaH/www.kcvvelewijt.be/rulesets
# []
```

So "PRs must be green before merging" is **a human habit, not an enforced rule**. Nothing mechanically stops a red merge, including by a wave agent with repo write access.

Does that matter at four concurrent agent PRs? **Moderately, and not in the way it looks.** The measured `quality-checks` failure rate is ~0–3 %, and the repo's merge settings already remove the sloppiest paths: `allow_merge_commit: false`, `allow_auto_merge: false`, `delete_branch_on_merge: true`, squash-only. The residual risk is a single careless "Squash and merge" on a red PR — cheap to protect against and cheap to live with.

Availability is not a blocker: protected branches and rulesets are both available on a public repo on Free ([about-protected-branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [about-rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)).

**But there is a trap that makes this non-trivial here.** `ci.yml:7–20` uses _workflow-level_ `paths-ignore: ["**.md", "docs/**"]`. GitHub's own troubleshooting page:

> | "A workflow is skipped by path filtering, branch filtering, or a commit message" | "Associated checks stay in a **'Pending'** state and block merging" | **"Avoid requiring workflows that can be skipped."** |
> — [troubleshooting-required-status-checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks#handling-skipped-but-required-checks)

And the guidance is explicit: "You should not use path or branch filtering to skip workflow runs if the workflow is required to pass before merging."

Making `quality-checks` required would make **every docs-only PR unmergeable forever**. (Correction to this ticket's brief while we are here: a docs-only PR does not "run the entire suite" — it runs _nothing_, because the filter is at workflow level. 1 of the last 120 merged PRs was in that class.) The documented fix is to move the filter from `on:` to a job-level `if:`, because "A job that is skipped will report its status as 'Success'. It will not prevent a pull request from merging, even if it is a required check." ([control-jobs-with-conditions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-jobs-with-conditions)).

### 5.3 Mechanism 2 — require branches to be up to date (strict) — ruled out

This is the one that would have caught #2874, because it forces the combination to be tested before it lands. It is also **ruled out by the owner**, on cost:

> _"I don't like the idea that afk'ing a batch of issues that required them all to go through CI, rebase, CI again, etc… this takes ages + a lot of github action budget."_

The numbers support the instinct. GitHub's own table calls out the cost — "More builds may be required, as you'll need to bring the head branch up to date after other collaborators update the target branch." In a 4-PR wave, each merge invalidates the other three, so serialising four PRs costs **1 + 2 + 3 + 4 = 10 full pipeline runs** instead of 4. At the measured 17.2 min critical path and ~18 runner-min per run, that is ~172 min of wall-clock serialisation and ~180 runner-min, to prevent one incident in two weeks. Recorded here only as the rejected baseline the alternatives are costed against.

### 5.4 Mechanism 3 — merge queue — **not available on this repository**

The owner asked for this to be evaluated on merit rather than hand-waved. The evaluation terminates early, on a fact confirmed independently by two separate primary-source passes:

> "Pull request merge queues are available **in any public repository owned by an organization**, or in private repositories owned by organizations using GitHub Enterprise Cloud."
> — [managing-a-merge-queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) (source reusable `data/reusables/gated-features/merge-queue.md`)

Corroborated by the GA changelog: "Merge queue is available on private and public repos on the GitHub Enterprise Cloud plan and **all public repos owned by organizations**." ([github.blog, 2023-07-12](https://github.blog/changelog/2023-07-12-pull-request-merge-queue-is-now-generally-available/))

**The gate is organization ownership, not visibility.** `gh api repos/soniCaH/www.kcvvelewijt.be -q .owner.type` returns `User`. The ruleset route is closed for the same reason: the `merge_queue` ruleset rule's feature flag is `ghec: '*'` / `ghes: '>=3.15'` with no `fpt` entry, so it does not appear in the Free/Pro/Team version of [available-rules-for-rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) at all.

So the real question is not "is a merge queue worth its runner-minutes" but **"is a merge queue worth transferring the repository to a GitHub organization?"** — a one-way-ish door affecting URLs, tokens, the `KCVV_APP_CLIENT_ID` GitHub App installation, Vercel's git integration, and every deploy secret.

Costed anyway, because the owner asked and because "when we start building" may change the answer:

| Flow for a 4-PR wave                                                            | Pipeline runs      | Wall-clock to land all 4              | Notes                                   |
| ------------------------------------------------------------------------------- | ------------------ | ------------------------------------- | --------------------------------------- |
| **Today** (no protection)                                                       | 4                  | ~17 min (parallel)                    | 1 merge race in 2 weeks                 |
| **Strict up-to-date**                                                           | 10                 | ~172 min (serial)                     | rejected by the owner                   |
| **Merge queue, no batching** (`min_entries_to_merge: 1`)                        | 4 PR + 4 queue = 8 | ~17 min + 4 × ~17 min serial ≈ 85 min | catches merge races                     |
| **Merge queue, batched** (`min_entries_to_merge: 4`, `max_entries_to_build: 1`) | 4 PR + 1 queue = 5 | ~17 min + ~17 min ≈ 34 min            | catches merge races; a red group ejects |

The batched row is the only one that is genuinely attractive: **one extra pipeline run per wave** buys the property #2874 lacked. The real configuration surface is `min_entries_to_merge` / `max_entries_to_merge` / `max_entries_to_build` (0–100 each), `min_entries_to_merge_wait_minutes`, `check_response_timeout_minutes`, and `grouping_strategy` — `ALLGREEN` (every PR's merge commit must pass) or `HEADGREEN` (only the head commit of the group must pass). Source: the `repository-rule-merge-queue` schema in [github/rest-api-description](https://github.com/github/rest-api-description). (The brief's `checks_grouping` does not exist under that name.)

**The footgun, if this is ever adopted:**

```bash
grep -rn "merge_group" .github/workflows/
# (no output)
```

**No workflow listens for `merge_group`.** GitHub's warning is unambiguous:

> "You **must** use the `merge_group` event to trigger your GitHub Actions workflow when a pull request is added to a merge queue. […] Otherwise, status checks will not be triggered when you add a pull request to a merge queue. **The merge will fail as the required status check will not be reported.**"
> — [events-that-trigger-workflows#merge_group](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#merge_group)

Enabling a queue without first adding `merge_group:` to `ci.yml` (and to `e2e.yml`, if E2E ever becomes required) stalls the queue indefinitely on the first PR. Also note `concurrency.cancel-in-progress` is currently `github.ref != 'refs/heads/main'`, which would evaluate **true** for a `gh-readonly-queue/…` ref — a cancelled `merge_group` check never reports, the status-check timeout fires, and the PR is ejected. GitHub does not document this interaction (searched; the only documented cancel-in-progress warning is for ruleset-required workflows), so treat it as an inferred mechanism rather than a cited one — but the inference is sound and the fix is one line.

### 5.5 Which checks could become required — reconciled with #3086

#3086's rule: _a check that cannot promise "red = a real regression" does not gate._ Applied to the measured numbers:

| Check                                                                                                                                | Flake rate                                                                   | May gate?                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quality-checks`                                                                                                                     | 0 failures in 100 runs; ~3 % workflow-level failure over 300 runs, mostly VR | **Yes — it already does.**                                                                                                                               |
| `E2E`                                                                                                                                | **48 % of runs hide ≥1 flaky test** (§6)                                     | **No.** Making it required would eject good PRs.                                                                                                         |
| `Visual Regression`                                                                                                                  | 5 failures in 61 runs, all genuine baseline diffs on redesign branches       | **Not yet.** #3082 keeps the tool; #3088 must land first. Its failure mode is "the PR is incomplete", which is a review signal, not a regression signal. |
| `E2E` after [#3087](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3087) (frozen dataset) + deletion of the two geometry specs | projected ~0 %                                                               | Re-measure then.                                                                                                                                         |

So the honest answer to "which checks become required" is: **exactly the one that already gates.** Requiring `quality-checks` adds enforcement of a habit, not coverage.

### 5.6 The red-main alert — what is actually wrong with it

The workflow's header comment argues its own case. Two of its claims need correcting, and one holds.

**Holds:** "Detection was never the gap — notification was." True. `main`'s push CI does catch these; nobody was told.

**Correction 1 — the brief's and the ledger's "auto-closed on the next green" is wrong. There is no auto-close.** `main-red-alert.yml` only ever creates or comments; the issue body carries a _human_ instruction ("Close this issue once main is green again"). Verified:

```bash
gh api repos/soniCaH/www.kcvvelewijt.be/issues/2883/timeline -q '.[] | select(.event=="closed") | [.actor.login, .created_at] | @tsv'
```

| Issue | Opened           | Closed           | Closed by | Open for     |
| ----- | ---------------- | ---------------- | --------- | ------------ |
| #2883 | 2026-09-09T06:33 | 2026-09-15T03:33 | `soniCaH` | **5 d 21 h** |
| #3017 | 2026-09-18T07:22 | 2026-09-20T18:55 | `soniCaH` | **2 d 12 h** |
| #3094 | 2026-09-21T23:28 | 2026-09-22T06:23 | `soniCaH` | **7 h**      |

The alert reaches a human. It then sits for days, and **no root-cause ticket came out of any of the three.** That is the actual defect, and it is a design defect, not an operational one: the issue has one field — "a workflow went red" — and one exit — a human closing it. It cannot distinguish a flake from a regression, it does not name the failing test, and closing it is indistinguishable from fixing it.

**Correction 2 — the comment's stated reason for rejecting branch protection conflates mechanisms 1 and 2.** It rejects "requiring every PR to be up to date" (mechanism 2) and concludes against branch protection in general. Mechanism 1 (loose required checks) costs nothing extra per merge and was never separately considered. The owner's instinct that it "wouldn't have helped" is correct on the evidence — but for a different reason than the comment gives.

**What closes the gap:** the alert should carry the flake/regression classification it currently lacks. The machinery for that already exists in this repo — `apps/web/test/reporters/github-summary.ts` already classifies every E2E test as passed / failed / flaky / skipped using `TestCase.outcome()` and writes it to the job summary. The alert's issue body has no reason to be a bare "`CI/CD Pipeline` finished with **failure**"; it can name the tests. See §6.3.

### 5.7 Verdict on gating

**Recommended: loose required status checks on `quality-checks` only, via a repository ruleset — and only after `paths-ignore` moves to a job-level `if:`.** It costs zero extra runner-minutes per merge, it makes the owner's existing habit mechanical, and it is the only mechanism whose cost is near zero.

**Not recommended: strict up-to-date** (ruled out by the owner; the numbers agree — 10 runs instead of 4 per wave).

**Not available: merge queue.** It aims at the right failure (n=1 in two weeks) with the right mechanism, but it requires transferring the repository to an organization. **At 1 merge race per two weeks, that door is not worth opening for this reason alone.** If the repo moves to an org for other reasons, revisit immediately — a batched queue costs one extra pipeline run per wave and is the correct tool. Note the prerequisite either way: `merge_group:` triggers, and a concurrency group that does not cancel queue refs.

**Residual risk of the status quo, stated plainly:** `main` is unprotected while up to four agents merge into it; the only thing preventing a red merge is the owner noticing. Measured cost of that exposure so far: three flake alarms that cost days of open-issue noise, and one merge race that required a fix PR. The loose-required-checks recommendation closes the first half of that; nothing short of a queue closes the second.

---

## 6. Flake detection and quarantine

### 6.1 The number #3086 asks for — flake rate per layer

#3086 clause 4 makes flake rate per layer the contract's own metric. Measured independently for this document, over the 60 most recent completed `E2E` runs:

```bash
gh run view <id> --log   # x60, then parse Playwright's own summary lines
```

| Metric                           | Value                                                  |
| -------------------------------- | ------------------------------------------------------ |
| Runs with ≥1 flaky test          | **29 of 60 (48 %)**                                    |
| …on `main` specifically          | **12 of 19 (63 %)**                                    |
| Test instances executed          | 3 242 (3 209 passed, 32 flaky, 1 failed) + 118 skipped |
| **Flake rate per test instance** | **32 / 3 242 = 0.99 %**                                |

`retries: 1` is set only on CI (`apps/web/test/e2e/playwright.config.ts`). Vitest declares **no** `retry` at all (`apps/web/vitest.config.ts` has no retry key), so the Vitest layer's flake rate is definitionally 0 % _observed_ — any flake there is simply red. VR has no retry mechanism either; its 5 failures in 61 runs were all genuine baseline diffs on redesign branches, not flakes.

So the per-layer table the contract wants:

| Layer                        | Retries | Observed flake rate                | Source of the number                         |
| ---------------------------- | ------- | ---------------------------------- | -------------------------------------------- |
| Static (lint, tsgo, typegen) | none    | 0 % (0 failures / 100 runs)        | job conclusions                              |
| Vitest                       | none    | 0 % observed                       | no retry configured, so a flake is a failure |
| Build (`next build`)         | none    | 0 % in window                      | job conclusions                              |
| Storybook VR                 | none    | 0 % (5/61 failures all real)       | job conclusions + branch inspection          |
| **Playwright E2E**           | **1**   | **0.99 % per test / 48 % per run** | Playwright summary lines, 60 runs            |

### 6.2 The finding that makes the quarantine question moot

**All 64 flaky occurrences across 60 runs come from 4 test locations in 2 files:**

| Location                                                                                       | Occurrences |
| ---------------------------------------------------------------------------------------------- | ----------- |
| `test/e2e/section-nav.spec.ts:217:7` — _scroll-spy fills the chip that is actually being read_ | 52          |
| `test/e2e/section-nav.spec.ts:313:7` — _an anchor jump lands below the bar_                    | 6           |
| `test/e2e/section-nav.spec.ts:241:7` — _an anchor jump lands below the bar_                    | 4           |
| `test/e2e/scroll-arrows.spec.ts:315:7` — _scroll arrow mounts only on real overflow_           | 2           |

`section-nav.spec.ts` alone is **62 of 64 (97 %)**.

**Both files are already scheduled for deletion.** #3086 clause 1 ("push it down, then delete the copy"): _"once `play` covers them, `scroll-arrows.spec.ts` (19 geometry assertions) and `section-nav.spec.ts` (7) are deleted, not thinned."_ And #3086's Q2 ruling puts geometry outside Playwright's remit entirely — _"Geometry, ever"_ is listed under what E2E must **not** own.

So: **100 % of this repo's measured E2E flake lives in code that a decision already made has scheduled for removal.** Buying a quarantine service to manage it would be paying a subscription to administer a problem that `git rm` closes. This is the same conclusion #3086 clause 2 reaches from the other direction — _a flake class closes with a rule or not at all_ — and here the rule is already written.

### 6.3 What produces the number going forward

Given §6.2, the recommendation is deliberately small.

**Already built, keep it.** `apps/web/test/reporters/github-summary.ts` is a Playwright reporter that uses `TestCase.outcome()` — which is where `flaky` actually lives:

> `TestCase.outcome()`: `"skipped" | "expected" | "unexpected" | "flaky"`. "Test that passes on a second retry is `'flaky'`."
> — [playwright.dev/docs/api/class-testcase](https://playwright.dev/docs/api/class-testcase)

(Note `flaky` is **not** a `TestResult.status` value — that enum is `passed | failed | timedOut | skipped | interrupted`. Anything reading `TestResult.status` will never see a flake. The existing reporter gets this right.)

**Two small additions, in order of value:**

1. **Make the red-main alert name the tests.** The alert currently reports "`<workflow>` finished with **failure**". Playwright already writes `flaky`/`skipped` tallies to the job summary; the `json` reporter exposes `stats: { expected, unexpected, flaky, skipped }` and per-test `status: 'skipped' | 'expected' | 'unexpected' | 'flaky'` ([testReporter.d.ts](https://github.com/microsoft/playwright/blob/main/packages/playwright/types/testReporter.d.ts)). An alert that says _which_ test and _whether it was flaky_ is the difference between an issue that gets closed and an issue that produces a root-cause ticket. This is the direct fix for "three alarms, zero root-cause tickets".

2. **Consider `failOnFlakyTests` once the two geometry specs are gone.** Playwright ships a first-party flag for exactly the "a retry turns a failure into silence" complaint:

   > `--fail-on-flaky-tests` — "Fail if any test is flagged as flaky (default: false)." (CLI, since v1.45; config key `failOnFlakyTests` since v1.52)
   > — [playwright.dev/docs/test-cli](https://playwright.dev/docs/test-cli)

   Turning it on **today** would make E2E red on 48 % of runs. Turning it on **after** the deletions is how the E2E layer earns its gate under #3086's "report-only is a waiting room, not a destination". That sequencing is the whole recommendation: delete, re-measure, then flip the flag, then require the check.

**Quarantine tooling — not recommended.** Playwright has no first-party quarantine (`grep -i quarantin` across its docs returns zero); the DIY pattern is a `@flaky` tag plus `--grep-invert @flaky`, which is just `test.skip` with extra steps and the same forgetting problem. The hosted options were priced:

| Service                                                                             | Quarantine                      | Playwright / Vitest            | Price                                     |
| ----------------------------------------------------------------------------------- | ------------------------------- | ------------------------------ | ----------------------------------------- |
| [Trunk.io Flaky Tests](https://trunk.io/flaky-tests)                                | yes, no code changes            | Playwright named; Vitest not   | **public repos free** to 5M test spans/mo |
| [Currents.dev](https://currents.dev/pricing)                                        | yes (status → `skipped`)        | Playwright                     | from $49/mo, no free plan                 |
| [Datadog Flaky Test Management](https://docs.datadoghq.com/tests/flaky_management/) | yes (+ disable, attempt-to-fix) | both supported                 | Datadog SKU, price not published          |
| [BuildPulse](https://buildpulse.io/pricing)                                         | yes                             | neither on the quarantine list | from $99/mo                               |

Trunk is free for public repos and would work. **It is still the wrong purchase**, because a 0.99 % flake rate concentrated in two doomed files is not a flake-management problem; it is a delete-two-files problem. Revisit only if the post-deletion flake rate is non-zero and diffuse.

**GitHub offers nothing here.** A code search across `github/docs` `content/**` for "flaky" returns one hit (a Copilot tutorial) and "test analytics" returns zero. What exists is [Actions performance metrics](https://docs.github.com/en/actions/concepts/metrics) — average run times, queue times, failure rates, at _workflow and job_ level. It never parses test results. There is no first-party flaky-test feature to wait for.

---

## 7. Cost control

### 7.1 The bill is zero, and that is the whole point

Public repository, standard runners: free and unlimited. The only chargeable things nearby are **larger runners** — "Larger runners are always charged for, even when used by public repositories" ([billing/concepts/product-billing/github-actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions)) — and they are org/Team-only anyway, so they are not reachable from here.

The real budget is the **concurrency limit**: 20 total concurrent jobs on Free, per account across all repositories ([actions/reference/limits](https://docs.github.com/en/actions/reference/limits#job-concurrency-limits-for-github-hosted-runners)). That is the constraint a four-agent wave can actually hit, and it is the one to spend against — not euros.

### 7.2 Measured spend, and where it goes

Over the 40.3-hour sample window:

| Job                          | Runs | p50   | Runner-min in window |
| ---------------------------- | ---- | ----- | -------------------- |
| `Visual Regression`          | 61   | 630 s | **640.5**            |
| `Quality Checks + Build`     | 67   | 397 s | 443.3                |
| `Deploy API staging`         | 43   | 49 s  | 35.1                 |
| `Deploy API + Studio`        | 23   | 78 s  | 29.9                 |
| `VR — Detect visual changes` | 70   | 14 s  | 16.3                 |
| `VR — Post diff comment`     | 3    | 31 s  | 1.6                  |
| **`ci.yml` total**           |      |       | **1 166.7 min**      |
| `E2E` (separate workflow)    | 66   | 200 s | 220                  |

Extrapolated: **~20 800 `ci.yml` runner-min/month + ~3 900 E2E min/month.** That is roughly double #3079's 10 422 min/month, because this window sits inside an active redesign wave. Take **10 000–21 000 min/month** as the honest range; the _proportions_ are what matter and they are stable.

**Visual Regression is 55 % of all CI runner time.** Nothing else is close.

### 7.3 What is worth cutting

**Worth cutting — the unconditional push-to-`main` VR arm.** `ci.yml:208` justifies it:

> "unconditional on push to main so merge-race regressions are caught on the merge commit even if the merging PR didn't itself touch visual paths"

Measured over the window: **23 of 23 push-to-`main` VR runs passed. Zero catches.** All 5 VR failures in the window were on PRs (`feat/issue-2586` ×3, `feat/issue-2824`, `feat/issue-2571`) and all were genuine baseline diffs on redesign branches.

Cost of the arm: 23 × 630 s = **242 min in 40 hours ≈ 4 300 min/month ≈ 21 % of the entire `ci.yml` spend**, for a check that gates nothing (`deploy` needs `quality-checks` only, `ci.yml:441`) and has caught nothing in 23 consecutive runs.

The honest caveat: 23 runs is a small sample against a hazard whose whole premise is that it is rare, and the one historical merge race (#2874) _did_ break the VR runner. But #2874 was a **lockfile** break, and the VR path filter already includes `pnpm-lock.yaml` — so a PR-side VR run would have caught it if the PR had run VR. The unconditional arm is not what protects against #2874; the path filter is.

**Recommendation: replace the unconditional arm with a path-filtered one on `main` pushes** (same filter the PR arm uses). That keeps the lockfile protection, keeps merge-commit coverage for visual changes, and drops the ~60 % of `main` pushes that touch nothing visual. Estimated saving: **~2 500 min/month, ~12 % of total**, with no loss of any coverage that has ever fired.

**Worth cutting — coverage on every run.** `Run tests` costs 255 s with `--coverage` versus a measured 98.6 s without (#3083). The delta is ~156 s × ~67 runs per 40 h ≈ **175 min in-window ≈ 3 100 min/month**, for a Codecov upload that gates nothing. Running coverage only on `main` pushes would keep the trend line and drop the per-PR cost.

### 7.4 What is a false economy

- **Draft-PR skipping** (`ci.yml:46`) already works and costs nothing. 26 of 100 runs were skipped this way. Keep.
- **Cutting E2E** (~3 900 min/month, gates nothing) would be the obvious target — and it is wrong. E2E is the only layer that exercises the real app end to end, and #3086 has it earning a gate once #3087 lands. Cutting a layer that is two tickets from being a gate to save minutes that cost €0 is the definition of a false economy.
- **Sharding to save money.** Sharding _costs_ runner-minutes (§4.2: +2.2 min per VR run for 3 shards). It buys wall-clock. Never justify it on cost.
- **Reducing `retries: 1`.** The ledger found that without it, 7 of the last 12 `main` E2E runs go red. Removing retries before deleting the two geometry specs would trade ~0 minutes for a red `main` most days.

---

## 8. Migration cost — what each recommendation actually costs

| Change                                                    | Effort                                                         | Runner-min           | Wall-clock                   | Risk                                                         |
| --------------------------------------------------------- | -------------------------------------------------------------- | -------------------- | ---------------------------- | ------------------------------------------------------------ |
| **Land #3096 first** (`$TURBO_DEFAULT$` in `test.inputs`) | already specced                                                | +some misses         | neutral                      | none — it is a correctness fix; everything below assumes it  |
| Split Storybook build into its own job                    | ~1 h, one job + artifact wiring                                | +40 s/run (+4 %)     | **−5.3 min critical path**   | VR runs even when lint fails (measured cost: ~0)             |
| Shard VR 3×                                               | ~3 h — the `vr-diff-comment` gather must merge N artifact sets | +2.2 min/run         | **−6.3 min**                 | diff-comment flow is the fiddly part                         |
| Path-filter the `main` VR arm                             | ~15 min, copy the PR filter                                    | **−2 500 min/month** | none                         | loses merge-commit VR on non-visual pushes (0 catches in 23) |
| Coverage only on `main`                                   | ~15 min                                                        | **−3 100 min/month** | −2.6 min on PR critical path | Codecov PR annotations disappear                             |
| Loose required check on `quality-checks`                  | ~1 h — **must** move `paths-ignore` to a job-level `if:` first | 0                    | 0                            | get the order wrong and docs PRs block forever               |
| Red-main alert names the failing tests                    | ~2 h                                                           | 0                    | 0                            | none                                                         |
| `--affected`                                              | ~2 h + deepen checkout                                         | ~−6 min/month        | ~0                           | undocumented lockfile behaviour; **not recommended**         |
| Merge queue                                               | repo transfer to an org                                        | +1 run/wave          | +17 min/wave                 | **not available without the transfer**                       |
| Quarantine service                                        | ~4 h + vendor onboarding                                       | 0                    | 0                            | **not recommended** — solves a problem `git rm` solves       |

---

## 9. Verdict

**Keep GitHub Actions, keep the one-job shape, and keep the hardcoded `--filter` list. Make exactly four changes, in this order: land #3096; split the Storybook build into its own job and shard VR 3×; path-filter the `main` VR arm and move coverage to `main`-only; then make `quality-checks` a loose required check after moving `paths-ignore` to a job-level `if:`.**

The evidence:

- **The pipeline is not slow and not expensive.** `quality-checks` p50 is 6.6 min against a 25-min timeout; the repo is public so runner minutes are free and unlimited. The thing worth optimising is the 17.2-min critical path, and **one** job split fixes 31 % of it because VR waits 397 seconds for a 37-second artifact.
- **Affected-only execution is a solution to a problem this repo does not have.** 70 % of PRs touch `apps/web`, which owns 64 % of the job; the 8 % that touch only `apps/api` are already handled by the cache. Turborepo's own docs recommend caching over filtering, ship one job in their official recipe, and document zero sharding guidance. `--affected` would also be a silent no-op today because the checkout is shallow.
- **The flake problem is already solved on paper.** 100 % of measured E2E flake (64 occurrences, 60 runs) lives in `section-nav.spec.ts` and `scroll-arrows.spec.ts`, both already scheduled for deletion by #3086 clause 1. No tool purchase survives that fact.
- **Gating cannot be fixed by the mechanism the incidents point at.** Merge queue is the right tool for the one merge race — and it is unavailable, because it requires an organization-owned repository. At n=1 in two weeks, that is not worth a repo transfer.
- **The biggest single line item is a check that has caught nothing.** VR is 55 % of CI runner time; its unconditional `main` arm is 21 % of the total and went 23-for-23 green.

**The honest cost:** these changes trade **+2.6 runner-min per visual PR** for **−11.5 min of critical path**, and give back **~5 600 runner-min/month** from the two cuts. The Storybook split means VR runs even when lint is broken. Sharding VR means the diff-comment job has to gather from three artifact sets, which is the only genuinely fiddly piece of work here. The required check means one careless `paths-ignore` ordering mistake blocks every docs PR — and that is a real trap, documented by GitHub itself, that this repo is currently one setting away from.

**What stays exactly as it is, deliberately:** GitHub Actions, one `quality-checks` job, 14 hardcoded `--filter` flags, `retries: 1`, Turbo remote caching, draft-PR skipping, and no branch protection beyond a single loose required check. Stability has real value, and every one of those has a measured number behind it now rather than a habit.

---

## 10. Questions sharp enough to become tickets

1. **Why does `@kcvv/web#build` hit the remote cache 93 % of the time on PRs while `@kcvv/web#test` hits 16 %?** The Vercel-writes-the-build-entry explanation fits every measurement but has not been proven. One `turbo run test --filter=@kcvv/web --summarize` diff between two runs settles it. If it is Vercel, the remote cache is doing far less for CI than the config implies, and that changes how §3 should be read.
2. **Should the E2E suite run on `main` pushes at all?** It gates nothing, costs ~3 900 min/month, and 63 % of its `main` runs hide a flake. Deferred here because #3087 changes the premise.
3. **Artifact signing for the remote cache.** No `TURBO_REMOTE_CACHE_SIGNATURE_KEY` is set on a public repo whose cache is shared with Vercel production builds. Worth one deliberate decision.
4. **`apps/api` carries the same `inputs` trap one folder away.** `apps/api/turbo.json` narrows `test.inputs` to `["src/**", "vitest.config.*"]` — safe today only because every api test happens to live under `src/`. #3096 already covers it; flagged here because §3's cache reasoning applies to both packages, not just `apps/web`.

## 11. Still fog

- **Whether a plain lockfile change selects all packages or only the affected ones.** Two first-party Turborepo pages say opposite things (§2.3). Only matters if `--affected` is ever adopted, which this document recommends against.
- **Whether `main`'s VR arm has _ever_ caught something a PR run did not.** 23-for-23 in this window, but the window is 40 hours. The full-history answer is derivable from run logs and was not computed.
- **The true monthly runner-minute figure.** The 40-hour window gives ~20 800 min/month; #3079's longer window gives 10 422. Both are defensible; the proportions agree.
- **Whether `merge_group` runs would actually be cancelled by the current concurrency group.** The mechanism is sound but GitHub documents nothing about merge queues and `cancel-in-progress`. Moot unless the repo moves to an organization.
