# Can a diff→stories VR map be built that never under-shoots?

> Research for [#3110](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3110), a child of the test-suite walk map [#3078](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078). Measured 2026-09-23 against `main` at `4aedfc48`.

## Verdict

**Yes — with one caveat that carries the entire safety property, and my recommendation is still to keep the full run.**

A map built from Storybook's real `preview-stats.json` module graph **never under-shot across 63 real merged PRs** — but only because an explicit, hand-maintained escape-hatch path list caught the two PRs where the graph's own answer was wrong. On one of those the graph selected **0 of 700** affected stories.

The decisive fact is that **the graph cannot identify its own blind spots.** On this exact stack, `apps/web/src/app/globals.css` — the single highest-blast-radius file in the repo, holding every design token and every Tailwind layer — reaches **zero stories** through the emitted graph, because `.storybook/preview.ts` is a disconnected vertex (measured below, §1.3; matches Storybook PR [#36345](https://github.com/storybookjs/storybook/pull/36345), still open).

So "never under-shoots" is not a property the map has. It is a property a _list_ has, a list nothing verifies, which fails **silently** when it drifts. That satisfies #3088's bar today and offers no mechanism that keeps it satisfied tomorrow.

Against that: the prize is ~5 minutes on a job whose minutes cost **$0.00 net** ([#3091](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3091)), on a critical path that [#3084](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3084)'s sharding plan already brings under the 10-minute ceiling without any correctness argument at all. **Keep what we have.**

---

## 1. Does Storybook or Vite expose a usable module graph?

### 1.1 Versions in this repo

| Package                  | Version | Source                      |
| ------------------------ | ------- | --------------------------- |
| `storybook`              | 10.5.10 | `apps/web/package.json:102` |
| `@storybook/nextjs-vite` | 10.5.10 | `apps/web/package.json:74`  |
| `@storybook/test-runner` | 0.24.4  | `apps/web/package.json:75`  |
| `vite`                   | 8.2.2   | `apps/web/package.json:106` |

### 1.2 `--stats-json` exists on Storybook 10 and builder-vite honours it

The CLI option is declared for both `dev` and `build` in [`code/core/src/bin/core.ts` @ v10.5.10](https://raw.githubusercontent.com/storybookjs/storybook/v10.5.10/code/core/src/bin/core.ts):

```typescript
.option(
  '--webpack-stats-json [directory]',
  'Write Webpack stats JSON to disk (synonym for `--stats-json`)'
)
.option('--stats-json [directory]', 'Write stats JSON to disk')
```

`--webpack-stats-json` is a live synonym on v10, not a removal. The rename landed in 8.0; [`MIGRATION.md` @ v10.5.10, lines 2239–2247](https://raw.githubusercontent.com/storybookjs/storybook/v10.5.10/MIGRATION.md) says under _"TurboSnap Vite plugin is no longer needed"_: _"At least in build mode, `builder-vite` now supports the `--webpack-stats-json` flag and will output `preview-stats.json`."_

The graph itself is produced by [`code/builders/builder-vite/src/plugins/webpack-stats-plugin.ts` @ v10.5.10](https://raw.githubusercontent.com/storybookjs/storybook/v10.5.10/code/builders/builder-vite/src/plugins/webpack-stats-plugin.ts) in the Rollup `moduleParsed` hook, recording `mod.importedIds.concat(mod.dynamicallyImportedIds)`. It is registered **unconditionally** on every Vite build ([`vite-config.ts` @ v10.5.10, line 96](https://raw.githubusercontent.com/storybookjs/storybook/v10.5.10/code/builders/builder-vite/src/vite-config.ts)); `--stats-json` only controls serialisation. The emitted shape is a **reverse** graph: each node is the imported module, `reasons[].moduleName` are its importers.

> **Doc bug worth knowing.** [`docs/api/cli-options.mdx` @ v10.5.10, lines 59 and 97](https://raw.githubusercontent.com/storybookjs/storybook/v10.5.10/docs/api/cli-options.mdx), rendered at <https://storybook.js.org/docs/api/cli-options>, still says `--stats-json` _"Requires Webpack"_. That is stale; the source above and the measurement below both contradict it.

Rollup/Rolldown primitives confirm the edge set: `ModuleInfo.importedIds` / `dynamicallyImportedIds` are documented as complete _"in the `moduleParsed` hook"_ (<https://rollupjs.org/plugin-development/>). Vite's `ModuleGraph` is **dev-server only** — it is documented solely as a property of `ViteDevServer` (<https://vite.dev/guide/api-javascript>) and is not populated by `vite build`. `build.manifest` is the wrong granularity: its keys are entries, dynamic entries, emitted chunks and assets (<https://vite.dev/guide/backend-integration>), so two source modules inside one chunk produce no edge between them.

`storybook-static/index.json` carries **no** dependency data beyond `importPath` — confirmed in [`code/core/src/types/modules/indexer.ts` @ v10.5.10](https://raw.githubusercontent.com/storybookjs/storybook/v10.5.10/code/core/src/types/modules/indexer.ts). `componentPath` is one edge (story → `meta.component`) and is not transitive.

### 1.3 Measured on this repo — and this is where it breaks

Ran, in this worktree, `pnpm exec storybook build --stats-json` inside `apps/web`:

```text
storybook-static/index.json           517 133 bytes
storybook-static/preview-stats.json 6 162 964 bytes  — 6 603 modules, 6 610 vertices
```

So the artifact exists on Storybook 10.5.10 + `@storybook/nextjs-vite` + Vite 8.2.2 / Rolldown. That much works. Then, walking the reverse graph upward from the repo's one CSS file:

```text
./src/app/globals.css   reasons -> {'./.storybook/preview.ts'}
./.storybook/preview.ts reasons -> NONE (disconnected vertex)
stories reachable from globals.css: 0    (vertices visited: 2)
```

`apps/web/.storybook/preview.ts:3` is `import "../src/app/globals.css";`. Every story in the suite renders under that stylesheet. **The graph says zero.**

This is not a quirk of my traversal — it is the defect Storybook PR [#36345](https://github.com/storybookjs/storybook/pull/36345) (_"Builder-Vite: Write the full bundler graph to preview-stats.json"_, **open**, base `next`, unmerged as of 2026-09-23) describes: since Storybook 10.3 the stats plugin keeps only the three `SB_VIRTUAL_FILES` virtual modules, so preview annotations have no edge to the entry point. Chromatic's own TurboSnap v2 source names the same window (`node-src/lib/turbosnap/v2/statsGraph.ts`): _"Storybook 10.3.0 up to the release that includes storybookjs/storybook#36345 omits `project-annotations.js` and its edges from the stats … the graph contains no evidence that the file is global."_

Two further holes measured in the same artifact:

- **`public/` and `preview-head.html` have zero vertices.** `apps/web/.storybook/main.ts:25` declares `staticDirs: ["../public", { from: "../test/fixtures/images", … }]`. Static dirs are copied, never bundled, so no module-graph map can ever see them.
- Only 5 `.css` vertices exist, 4 of them inside `node_modules`. The repo has exactly one authored stylesheet (`find apps/web/src -name '*.css'` → `apps/web/src/app/globals.css`).

### 1.4 How a selection would actually be expressed

`@storybook/test-runner` 0.24.4 has **no** story-id or test-path filter. `--help` lists only `--includeTags`, `--excludeTags`, `--skipTags` and `--shard`. In `--index-json` mode — which `vr:run` uses (`apps/web/package.json:31`) — the runner fetches the index over HTTP and generates tests from it:

```text
node_modules/@storybook/test-runner/dist/test-storybook.js:18950
  const indexJsonUrl = new URL("index.json", url).toString();
```

So the selection mechanism is to **rewrite `storybook-static/index.json` before `http-server` serves it**. Feasible, roughly 20 lines. Implementation is not the hard part; it never was.

---

## 2. Prior art: Chromatic TurboSnap

TurboSnap is the reference implementation and consumes exactly the artifact above — `preview-stats.json`, produced by `--stats-json` (<https://www.chromatic.com/docs/turbosnap/dependency-tracing/>). Its algorithm (`node-src/lib/turbosnap/v1/getDependentStoryFiles.ts` in [`chromaui/chromatic-cli`](https://github.com/chromaui/chromatic-cli)) is the same upward BFS through `reasons` to the CSF glob entry.

**Vite is supported from Storybook 8 with no extra config** — _"Vite support for TurboSnap is available out of the box, starting with Storybook 8.0 and later"_ (<https://www.chromatic.com/docs/turbosnap/dependency-tracing/>). `@storybook/nextjs-vite` is named nowhere in the docs or the CLI's builder map (`node-src/lib/builders.ts`); it is a Vite builder underneath, so it presumably works, but nothing documents it.

### 2.1 What it abandons the diff for

> "Certain code changes have the potential to impact all stories. To avoid false positives, we re-capture everything in the following situations:
>
> - Changes to dependency versions in `package.json`, if no valid lockfile is available
> - Changes to your Storybook's configuration
> - Changes in files that are imported by your `preview.js` (as this could affect any story)
> - Changes in your static folder (if specified using `--static-dir` / `-s`)
> - Changes to files specified by the `--externals` option […]"
>   — <https://www.chromatic.com/docs/turbosnap/>

Note item three: _files imported by `preview.js`_. That is precisely the edge this repo needs and precisely the edge Storybook 10.3–10.5 does not emit (§1.3). TurboSnap on this exact Storybook version would be trusting a bail condition the graph cannot supply.

The machine-readable bail reasons — `changedExternalFiles`, `changedPackageFiles`, `changedStaticFiles`, `changedStorybookFiles`, `invalidChangedFiles`, `missingStatsFile`, `noAncestorBuild`, `rebuild`, `unavailable` — are enumerated at <https://www.chromatic.com/docs/turbosnap/troubleshooting/>.

### 2.2 What it publicly admits it cannot see

The sharpest admission, on unbundled assets:

> "TurboSnap relies on Webpack's dependency graph. That means if you're using files processed externally to Webpack […] **This includes static assets like fonts, images, and CSS files, as well as files that compile to static assets such as Sass**, so long as they are not processed through a Webpack loader. […] a change to a `.sass` file will not match any dependencies, **preventing stories from being captured** (i.e., snapshotted)."
> — <https://www.chromatic.com/docs/turbosnap/setup/>

On dynamic imports:

> "**Dynamic imports, such as `import()` or `require()` with variables or conditions, within your stories, decorators, preview files, or any files they import, can disrupt the chain TurboSnap uses to identify affected stories. This can lead to missed visual changes** […]"
> — <https://www.chromatic.com/docs/turbosnap/best-practices/>

On transitive dependencies, an FAQ heading reading _"Why transitive dependencies are not tracked?"_, and on circular dependencies: _"Tree-shaking may not work as intended when circular dependencies exist"_ (<https://www.chromatic.com/docs/turbosnap/dependency-tracing/>).

On the escape hatches themselves — the failure mode that matters most here, because it is silent:

> "`untraced` and `externals` patterns are relative to your repository root, while `storybookConfigDir` and `storybookBuildDir` are relative to your working directory, so **a pattern with the wrong prefix silently matches nothing**."
> — <https://www.chromatic.com/docs/turbosnap/troubleshooting/>

> "**Ensure the files are tracked in version control. If the file is ignored by `.gitignore`, it won't trigger a rebuild even if it's listed in `externals`.**"
> — <https://www.chromatic.com/docs/turbosnap/best-practices/>

And on `--untraced`: _"your tests will be **less reliable** when using `--untraced` because it may skip stories that actually did have meaningful changes."_

Nothing in the docs, and nothing in the CLI source, considers API responses, CMS content or runtime feature flags. Every trigger is a file-in-the-repo trigger. That silence is itself a finding.

### 2.3 Chromatic does not present TurboSnap as safe by default

It is opt-in (`onlyChanged` defaults to `false`, <https://www.chromatic.com/docs/configure/>) and hard-locked for ten CI builds, for a stated reason:

> "**we don't allow using TurboSnap immediately when starting out with Chromatic since the configuration is more complicated and can lead to difficult-to-debug scenarios or UI changes being missed.**"
> — <https://www.chromatic.com/docs/turbosnap/setup/>

Its recommended configuration is to **switch it off on the integration branch**: `chromatic --only-changed "!(main)"`, because _"you can at least catch such changes"_ (same page). Chromatic's own TurboSnap v2 source uses the phrase **"silently under-capture"** for what it is guarding against (`node-src/lib/turbosnap/v2/storybookVersion.ts`).

Their published expectation table (<https://www.chromatic.com/docs/turbosnap/best-practices/>) puts a default install at **60–100 % full rebuilds**; the headline 80–90 % skip rate is what you get after restructuring the repo (split packages, a minimal preview file, hand-audited `externals` globs).

### 2.4 Comparable prior art outside Chromatic

There is no equivalent first-party feature. Storybook ships no "affected stories" command; `storybook index` produces the index without a bundler and therefore with zero dependency data. `@storybook/addon-vitest` does have real dependency tracking, but through `project.vite.moduleGraph` — a **live dev server** (`code/addons/vitest/src/node/vitest-manager.ts` @ v10.5.10), unreachable from `storybook build`. Chromatic's Vitest integration (<https://www.chromatic.com/docs/vitest/turbosnap>) takes the same dev-server route and ships the same `externals` escape hatch.

---

## 3. Measured miss rate against this repo's real history

### 3.1 Method

- **Sample.** All 66 commits on `main` since 2026-08-25 that touched `apps/web/test/vr/__snapshots__/`; 63 usable after dropping commits whose only baseline changes were deletions of stories that no longer exist (a deleted story cannot be shot, so its deleted baselines are not a miss).
- **Truth.** For each commit, the set of story IDs whose baseline `.png` was **Added or Modified** (`git show --name-status`), restricted to the 1 037 `vr`-tagged, non-`vr-skip` stories in the built `index.json`. `RUN_VISUAL_REGRESSION` is `true` (`gh variable list`) and VR runs unconditionally on push to `main` (`.github/workflows/ci.yml:263`), so the merged baseline set is the full, honest truth for each change.
- **Map.** Changed paths → `./`-relative stats IDs → BFS upward through `reasons` in the **real** `preview-stats.json` built above → story files → their `vr` story IDs. Computed from the diff only; nothing is rendered, per [#2370](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2370).
- **Escape hatch.** Reported separately: `apps/web/src/app/globals.css`, `apps/web/.storybook/`, `pnpm-lock.yaml`, `apps/web/package.json` → shoot everything.

### 3.2 Results

| Candidate map                                                        | PRs under-shot (of 63–64) |
| -------------------------------------------------------------------- | ------------------------- |
| M1 — story file or sibling directory (the ~30-line `index.json` map) | **17**                    |
| M2 — M1 plus story files that _directly_ import a changed module     | **14**                    |
| M3 — full transitive graph from the real `preview-stats.json`        | **2**                     |
| M3 **+ escape hatch**                                                | **0**                     |

> M1/M2 were measured over 64 PRs with a static import graph; M3 over 63 with the real artifact. The gap between them is far larger than the sample difference.

The two M3 under-shoots:

| Commit     | Change                                                                     | Stories affected | Map selected | Missed |
| ---------- | -------------------------------------------------------------------------- | ---------------- | ------------ | ------ |
| `d0384798` | `apps/web/.storybook/preview-head.html` — added the IBM Plex Mono `<link>` | 700              | **0**        | 700    |
| `d4afe3c5` | `apps/web/src/app/globals.css` — two display-type ramp steps               | 130              | 446          | 27     |

Both are the §1.3 blind spots, exactly: an HTML file that is never a module, and a stylesheet whose only importer is the disconnected `preview.ts`. Both are caught by the escape-hatch path list — the escape hatch fired on **11 of 63** PRs (17 %).

**So: the module graph, alone, under-shoots on 3.2 % of this repo's real PRs, and on one of them it shot nothing at all. With the hand-maintained escape hatch in front of it, 0 of 63.**

### 3.3 What the map would cost in shots

Share of the 1 037 `vr` stories selected, per PR:

```text
min 0%   p25 1%   median 32%   p75 35%   p90 39%   max 89%
buckets: <5% on 22 PRs   5-25% on 7   25-50% on 33   >50% on 1
effective mean (escape-hatch PRs counted as 100%): 35.7% of a full run
```

The distribution is bimodal, not "a handful would do": 22 PRs are near-free, but 33 PRs still shoot a quarter to a half of the suite, because most changes land on a shared `ui/` primitive.

### 3.4 Why this repo is an unusually favourable case

`grep` across `apps/web/src`: **no** `next/dynamic`, **no** `styled-components` or `@emotion`, **no** template-literal `import()`, and exactly **one** authored `.css` file. The five dynamic imports that exist are static-specifier `await import("@/…")` calls in `apps/web/src/app/sitemap.ts` — resolvable, and not on any story path. Every blind spot TurboSnap documents as its main risk (§2.2) is nearly absent here. A 0/63 result on this codebase would not transfer to one with runtime theming or externally compiled CSS.

Inventory of changed `apps/web/` files across the sample that have **no vertex** in the graph at all: 209 unit test files, 111 other unreachable `.ts/.tsx`, 66 App Router pages, 19 markdown files — all harmless — plus **5 `public/` static assets** and **2 `.storybook/` files**, which are not.

---

## 4. Cost, honestly, against keeping the full run

### 4.1 What the full run costs today

Measured on CI run [35825898187](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/35825898187) (`main`, 2026-09-23), via the jobs API:

| Phase                                                                     | Wall clock    |
| ------------------------------------------------------------------------- | ------------- |
| Quality Checks + Build (upstream, includes the Storybook build)           | 2 m 13 s      |
| Visual Regression job — fixed setup (container, checkout, pnpm, artifact) | 1 m 16 s      |
| Visual Regression job — `vr:ci` capture                                   | **7 m 50 s**  |
| Chain total                                                               | **11 m 25 s** |

Only the 7 m 50 s is variable. At the measured effective mean of 35.7 %, the capture becomes ≈ 2 m 48 s and the chain ≈ 6 m 17 s — a saving of about **5 minutes**, on minutes #3091 verified cost **$0.00 net**.

### 4.2 What it costs to build and keep

| Item                                                             | Cost                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--stats-json` on the build                                      | 1 line. The stats plugin already runs on every build (`vite-config.ts:96`); the flag only serialises 6.2 MB.                                                                                                                                     |
| Selector script: parse stats + `git diff` → rewrite `index.json` | ~60–80 lines, one file.                                                                                                                                                                                                                          |
| The escape-hatch path list                                       | The safety-critical artifact, and it is hand-maintained.                                                                                                                                                                                         |
| **Permanent maintenance**                                        | Every new surface outside the bundle must be added to that list by hand, and **nothing fails loudly when it is not**: a new `staticDirs` entry, a new font, a second stylesheet, a `Dockerfile.vr` or Playwright bump, a new `.storybook/` file. |
| Pin to a Storybook defect                                        | The whole design depends on knowing the graph omits `preview.ts` edges. When [#36345](https://github.com/storybookjs/storybook/pull/36345) merges, the graph changes shape and the list must be re-derived — a Renovate bump would do it.        |

### 4.3 What #3088 loses

Today "VR green" means all 3 044 baselines match. Under a map it means "the selected subset matches". #3088 ruled _VR red = the PR is incomplete_; a map converts a class of red into silence. The repo already has the backstop Chromatic recommends — VR runs unconditionally on push to `main` (`.github/workflows/ci.yml:263`) — so a miss surfaces on the merge commit rather than in the PR. That is a real net, and it is strictly later and louder-in-the-wrong-place than the PR gate it replaces.

### 4.4 The cost of staying

Zero build cost, zero maintenance, zero new silent-failure mode. The chain is 11 m 25 s against #3091's 10-minute ceiling — over it, but [#3084](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3084)'s sharding plan reaches ~5.7 min by splitting the same 7 m 50 s across machines, and sharding needs **no correctness argument at all**: every story is still shot. The two do not stack usefully either — both shrink the same variable phase, and past ~4 shards the 1 m 16 s fixed floor dominates.

**Recommendation: keep the full run.** Ship #3084's sharding, which buys the same wall clock with none of the risk. If the map is ever revisited, the two preconditions are (a) Storybook [#36345](https://github.com/storybookjs/storybook/pull/36345) merged and the `preview.ts` edges present, and (b) a test that _fails_ when the escape-hatch list drifts out of sync with `staticDirs` and the `.storybook/` tree — because without that, the list is the only thing standing between the map and a silent miss, and nothing watches it.

---

## 5. What I could not determine

- **Whether 0/63 generalises.** A measured zero is evidence, not a proof of "never". The sample is a four-week redesign window, heavily UI-refactor-shaped; it contains no data-layer or dependency-driven visual change, and the codebase happens to lack every construct TurboSnap names as its main risk (§3.4).
- **The build-time cost of `--stats-json`.** I did not A/B the Storybook build with and without the flag. The plugin runs unconditionally per `vite-config.ts:96`, so the marginal cost should be serialising 6.2 MB, but that is inference from source, not a measurement.
- **Whether TurboSnap itself would work here.** `@storybook/nextjs-vite` appears in no Chromatic doc and in no file of `chromaui/chromatic-cli`. It is a Vite builder underneath, so it presumably emits a compatible stats file — presumably is the operative word, and Chromatic has published nothing either way. The question is academic unless the repo adopts Chromatic, which it has not.
- **Rolldown-specific graph fidelity.** Vite 8 replaces Rollup with Rolldown. The 6 603-module graph looks right and the `.stories.tsx` vertices all resolve, but I did not verify edge-for-edge that Rolldown's `moduleParsed` reports the same set Rollup would. No Storybook test or doc covers this combination.
- **Whether the graph is complete for `.mdx` docs pages.** `apps/web/.storybook/main.ts:11` globs `../src/**/*.mdx` as stories. Those are not `vr`-tagged, so they fell outside the measurement, and I did not check whether their edges land in the stats file.
