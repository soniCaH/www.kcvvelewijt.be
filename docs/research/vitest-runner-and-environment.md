# Which runner, which environment, and how to survive four agents on one machine — Vitest for a Turborepo monorepo

> Resolves [#3083](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3083), a `wayfinder:research`
> ticket on the [Test suite walk map (#3078)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078).
> **Nothing here is implemented and nothing here is decided.** No test, config, `turbo.json` or app
> file was changed. This is evidence for the grilling tickets below it.
>
> Repo facts measured 2026-09-22 against `main` at `ec15a8a8` (worktree `research/vitest-runner`,
> branched from `4a60adc8`). Every number has its command in [§11](#11-commands-that-produced-the-numbers).
> Counts quoted from the [inventory (#3079)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3079)
> and the [flake ledger (#3080)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3080) are
> labelled as quotes; everything else was measured here. External claims carry a primary source.
>
> Vitest facts are pinned to the **installed** version, `4.1.11`. `vitest.dev` now serves Vitest 5
> docs, so doc links use the `v4.1.11` git tag, and the load-bearing defaults were additionally read
> out of `node_modules`.

## The question

As filed on #3083:

> What is the best-practice Vitest setup for ~13 600 web tests plus the other workspaces — fast, and
> immune to CPU contention from parallel runs on one machine?

The owner's addendum of 2026-09-22 rejects that framing, and names this ticket's own title as the
anti-pattern:

> **No research ticket may presuppose the installed tool.** … Every research ticket answers the
> outward question first — _is this the right layer, and the right tool, for this kind of project?_
> … **"Keep what we have, here is the evidence" is a perfectly good verdict**: stability has real
> value, and a flake that is ours rather than the tool's must be named as ours.

So this document runs **runner → environment → isolation/pools → Turbo → migration cost**, and tunes
nothing until the thing being tuned has been justified.

## The answer in five sentences

**Keep Vitest, keep happy-dom, and stop blaming either of them.** Vitest is the only live runner that
does all four things this repo needs at once — ESM/TS with no transform config, a DOM environment, a
`projects` model that matches a pnpm monorepo, and per-file isolation — and the two alternatives that
could replace it (`node:test`, Bun) fail on the DOM requirement or on the second-runtime cost, while
Jest's ESM support is still, in its own words, experimental. **Two of the four "happy-dom gaps" do not
reproduce**: `matchMedia` _does_ evaluate width (the suite drives it with a bare `window.innerWidth =`
assignment, which Vitest's own environment shim swallows before happy-dom ever sees it), and
`hashchange` _does_ fire (one macrotask later, which a synchronous assertion misses) — the two that do
reproduce, `color-mix()` and layout, are not fixed by jsdom, which is strictly worse here because it
does not implement `matchMedia` **at all**. Only **2 of 370** web test files need real layout, and
[#3086](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086) already re-homes both to Storybook
`play`, so after that the browser-mode case for component tests is **zero files** and should be
declined. **Every performance knob in every workspace is at its default, and benchmarking says leave
almost all of them there** — `--no-isolate` is 4.6× faster and fails 178 tests, `--pool=threads` is
inside the run-to-run noise, and the one knob worth setting is `--maxWorkers=2` for wave agents,
because four uncapped agents ask for 28 worker processes on 8 cores. The named contention flake is
ours but **did not reproduce**: `SearchInterface.test.tsx` survived nine runs at 3.5–4× CPU
starvation, so the fix is still the rule (fake timers + `userEvent`'s `advanceTimers`, then _delete_
the four raised `waitFor` budgets) while the reproduction to attempt is four concurrent `check-all`
runs — `next build`'s memory, not CPU; the cheapest real wins are unrelated to any tool choice: an
`engines` field (the Node-20 `globSync` defect, five files) and `$TURBO_DEFAULT$` on `test.inputs`
(ten unhashed files, #3096).

## 0. The baseline: every knob is at its default

This is the ground every recommendation below stands on, so it is stated first and exactly.

`apps/web/vitest.config.ts` (56 lines) sets `environment`, `environmentOptions`, `setupFiles`,
`exclude`, `coverage`, `globals: true` and `resolve.alias`. It sets **no** `pool`, **no** `isolate`,
**no** `fileParallelism`, **no** `maxWorkers`, **no** `maxConcurrency`, **no** `testTimeout`, **no**
`sequence`, **no** `retry`. Same for `apps/api/vitest.config.ts` (8 lines),
`packages/sanity-studio/vitest.config.ts` (11 lines) and `packages/api-contract/vitest.config.ts`
(13 lines). There is **no** `vitest.workspace.*` and **no** `test.projects` anywhere in the repo.

So: what _are_ the defaults in 4.1.11? Read from the installed package, not from the website.

| Option                                    | Default in 4.1.11                                                        | Read from                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `pool`                                    | `"forks"`                                                                | `vitest/dist/chunks/coverage.DM_a_rWm.js:180` — `resolved.pool ??= "forks";`                                                      |
| `isolate`                                 | `true`                                                                   | `vitest/dist/chunks/defaults.9aQKnqFk.js` — `configDefaults.isolate`                                                              |
| `environment`                             | `"node"`                                                                 | same file — `configDefaults.environment`                                                                                          |
| `maxWorkers`                              | `max(availableParallelism − 1, 1)` in run mode; `max(⌊n/2⌋, 1)` in watch | `cli-api.CnMVyzaz.js` — `resolveMaxWorkers()` / `getDefaultThreadsCount()`                                                        |
| `minWorkers`                              | **removed in 4.0**                                                       | [migration guide](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/migration.md) — "Only `maxWorkers` has any effect" |
| `maxConcurrency`                          | `5`                                                                      | `defaults.9aQKnqFk.js` — `configDefaults.maxConcurrency`                                                                          |
| `testTimeout`                             | `5_000` (node) / `15_000` (browser)                                      | `coverage.DM_a_rWm.js:538`                                                                                                        |
| `hookTimeout`                             | `10_000` (node) / `30_000` (browser)                                     | `coverage.DM_a_rWm.js:539`                                                                                                        |
| `teardownTimeout`                         | `10_000`                                                                 | `defaults.9aQKnqFk.js`                                                                                                            |
| `fileParallelism`                         | `true`                                                                   | [`docs/config/fileparallelism.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/fileparallelism.md)              |
| `sequence.concurrent`                     | `false`                                                                  | [`docs/config/sequence.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/sequence.md)                            |
| `poolOptions.*.singleThread`/`singleFork` | **removed in 4.0**                                                       | migration guide — "now `maxWorkers: 1, isolate: false`"                                                                           |

Three of these matter more than the rest:

1. **This machine has 8 cores, so a default web run takes 7 worker processes.** Four wave agents
   therefore ask for 28 workers on 8 cores. Nothing in the repo caps that.
2. **`testTimeout` is 5 s** and `hookTimeout` 10 s, unraised anywhere — which is why the in-body
   import class (#2362 → #2378) was a real failure mode and why the fix had to be a lint rule.
3. **The repo's own stated reason for happy-dom is factually wrong.** [#2168](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2168)
   dropped jsdom on the grounds that "happy-dom is the vitest default". It is not — Vitest's default
   environment is `node`. The environment was never actually chosen on evidence; it was inherited.
   That is a reason to check it (§2), not a reason to change it.

## 1. Runner — is Vitest right for this repo?

### 1.1 What the runner actually has to do here

| Constraint                    | Measured                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Test files / tests            | 460 files, 14 662 tests across 4 workspaces (#3079); `apps/web` alone 370 / 13 608                              |
| Languages                     | TypeScript throughout, `"type": "module"` in 3 of 4 tested workspaces, ESM-only deps (Effect, `@sanity/client`) |
| Environments needed           | a DOM for 2 workspaces (`apps/web`, `packages/sanity-studio`), node for 2 (`apps/api`, `packages/api-contract`) |
| Build tooling already present | Vite — via `@vitejs/plugin-react` in web and sanity-studio, and `@storybook/nextjs-vite` for Storybook          |
| Where the time goes           | import **60 %**, environment 17 %, setup 11 %, assertions **9 %** (measured §3.2)                               |
| Monorepo driver               | Turborepo 2.10.12, pnpm 10.34.5 workspaces                                                                      |

The last two rows decide most of this section. **Assertions are 9 % of the CPU.** A runner swap that
made assertion execution twice as fast would buy ~4 % of wall time. The cost is module resolution and
transform, which is a _bundler_ problem, not a _runner_ problem — and the repo already runs Vite for
two other reasons.

### 1.2 The four live alternatives, on merit

|                               | Vitest 4.1.11 (installed)                                             | Jest 30                                                                                                                                                                                                                          | `node:test` (Node 24)                                                                                                                           | Bun test                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESM/TS                        | native via Vite; no transform config in this repo                     | **"experimental support for ECMAScript Modules… may have bugs and lack features"**, still needs `node --experimental-vm-modules` ([ECMAScriptModules.md](https://github.com/jestjs/jest/blob/v30.5.2/docs/ECMAScriptModules.md)) | native ESM; type-stripping default since 22.18/23.6, stable 24.12 ([typescript.html](https://nodejs.org/docs/latest-v24.x/api/typescript.html)) | native                                                                                                                                                            |
| DOM environment               | `environment: 'happy-dom' \| 'jsdom'`, or real browser via `projects` | `jest-environment-jsdom`                                                                                                                                                                                                         | **none** ([test.html](https://nodejs.org/docs/latest-v24.x/api/test.html) documents no DOM)                                                     | happy-dom via `--preload` only                                                                                                                                    |
| Isolation default             | per file, `isolate: true`                                             | per file (child processes; `--workerThreads` is `:::caution experimental`)                                                                                                                                                       | per file (`isolation: 'process'`)                                                                                                               | **all files share one global and one module registry** unless `--isolate`/`--parallel` ([bun docs](https://github.com/oven-sh/bun/blob/main/docs/test/index.mdx)) |
| Pools                         | `forks` / `threads` / `vmThreads` / `vmForks`                         | child process, or experimental worker threads                                                                                                                                                                                    | child processes, `--test-concurrency`                                                                                                           | single process, or `--parallel`                                                                                                                                   |
| Sharding                      | `--shard i/n` + `--reporter=blob --merge-reports`                     | `--shard i/n` (needs a sequencer with `shard`)                                                                                                                                                                                   | not documented                                                                                                                                  | not documented                                                                                                                                                    |
| Coverage                      | v8 (installed) or istanbul                                            | v8/babel                                                                                                                                                                                                                         | **Stability 1 – Experimental**                                                                                                                  | built-in; threshold check silently skipped without the `text` reporter                                                                                            |
| Monorepo model                | `test.projects`, `--project` with globs and negation                  | `projects`                                                                                                                                                                                                                       | none                                                                                                                                            | none                                                                                                                                                              |
| Mocking                       | `vi.mock` hoisted, `vi.stubGlobal`, `vi.useFakeTimers`                | `jest.mock`                                                                                                                                                                                                                      | `mock.method`, `mock.timers`                                                                                                                    | jest-compatible, **no `__mocks__`, no auto-mocking**                                                                                                              |
| Reuses the repo's Vite config | yes                                                                   | no                                                                                                                                                                                                                               | no                                                                                                                                              | no                                                                                                                                                                |

### 1.3 The three facts that decide it

**1 — `node:test` cannot render a React component.** Its documentation describes no DOM, and there is
no environment hook to add one. 254 of 370 `apps/web` test files touch `@testing-library/react`,
`document.`, `window.` or `screen.`, and 237 call `render(`. That is not a tuning gap; it is a wall.
Ruled out for `apps/web` and `packages/sanity-studio`. It would serve `apps/api` and
`packages/api-contract` — at the price of running two runners in one repo for 44 of 460 files.

**2 — Jest's ESM support is still experimental, in Jest's own words, and this repo is ESM-first.**
Three of the four tested workspaces declare `"type": "module"`, and the dependency graph (Effect 3.22,
`@effect/platform`, `@sanity/client` 8) is ESM. Jest 30 improved the situation — `import.meta`, native
`.mts`/`.cts`, and skipping its own transformer when Node strips types — but the `:::caution` at the
top of `ECMAScriptModules.md` has not moved. Adopting it would mean either `--experimental-vm-modules`
across six workspaces or reintroducing a CJS transform pipeline that Vite currently makes unnecessary.
Jest is also the runner under `@storybook/test-runner`, so the repo already has it — and that is an
argument for _not_ making it the unit runner too: the VR layer's 120 s story-stall (#3094) is a Jest
timeout, and keeping the two layers on different runners keeps that blast radius small.

**3 — Bun would add a second runtime to buy back a fraction of 9 %.** Bun's own docs state the
default is _no_ isolation ("all files share one global and one module registry… Isolating every file
is how Jest and Vitest behave by default"), which is the opposite of what a contention-flaky suite
wants. DOM support is a `--preload` of the same happy-dom this repo already runs, so it changes
nothing about §2. Turborepo's Bun support arrived as package-manager support in beta
([vercel/turborepo#4762](https://github.com/vercel/turborepo/issues/4762)); there is no first-party
statement that `bun test` is a first-class Turbo task. And the repo already pins Node three ways
(`.nvmrc` 24.20.0, wrangler needing ≥ 22, Vercel's build image).

**Vitest browser mode is not a runner alternative** — it is the same runner with a different
environment, so it belongs in §2.

### 1.4 What the fair case against Vitest actually is

Three things, none of them decisive here:

- **Version churn.** `vitest.dev` already serves 5.0.1; 4.0 removed `minWorkers`, `poolOptions`,
  `singleThread`/`singleFork`, `environmentMatchGlobs`, `poolMatchGlobs` and `workspace`, and reworked
  browser providers into separate packages. The repo is on 4.1.11 and uses **none** of the removed
  options, so it is already clean for the 4→5 hop — a fact worth banking rather than discovering later.
- **Its browser mode is young.** `docs/guide/browser/why.md` still carries "Early Development … it is
  recommended that users augment their Vitest browser experience with a standalone browser-side test
  runner". §2.7 takes that seriously.
- **Jest is the larger ecosystem.** True, and irrelevant: the repo consumes no Jest-only plugin in the
  unit layer, and the one place it does use Jest (`jest-image-snapshot` under `@storybook/test-runner`)
  is staying put per [#3082](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3082).

### 1.5 Verdict on the runner

**Keep Vitest.** It is the only live option that satisfies DOM + ESM/TS + monorepo projects + per-file
isolation without adding a runtime or a transform pipeline, and the cost centre it is blamed for
(import, 57 %) is a module-graph cost that every alternative also pays. Migration cost of moving 460
files is priced in [§8](#8-migration-cost-honestly); it is four to eight weeks of work to buy a
single-digit percentage of a number that is not the bottleneck.

## 2. Environment — happy-dom vs jsdom vs a real browser

### 2.1 The four measured gaps, re-measured

The map records four happy-dom gaps met during the 2026-09-21 wave. All four were re-run here against
the installed `happy-dom@20.11.12` under the installed `vitest@4.1.11`, in a throwaway project outside
the repo (command in §11). **Two do not reproduce as described.**

| Wave's claim                          | Re-measured                                                                                                                                                               | Verdict                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `matchMedia` ignores width            | `happyDOM.setViewport({width: 500})` flips `matchMedia("(min-width: 501px)").matches` to `false`, and fires a window `resize`. A bare `window.innerWidth = 500` does not. | **Ours** (§2.2) — plus one real upstream bug |
| `hashchange` never fires              | Fires — on the next macrotask. `location.hash = "#x"` then a synchronous assert sees 0 listeners called; after `await new Promise(r => setTimeout(r, 0))`, 1.             | **Ours** (§2.3)                              |
| `color-mix()` backgrounds are dropped | `el.style.backgroundColor = "color-mix(in srgb, red 50%, blue)"` → `""`; the `rgb()` control round-trips.                                                                 | **Real** (§2.4)                              |
| no layout / `getBoundingClientRect`   | Returns all zeros for a 300px-wide appended element.                                                                                                                      | **Real** (§2.4)                              |

### 2.2 `matchMedia`: the suite drives it through a shim that eats the write

`NavTakeover.test.tsx:133-137` records the wave's finding in the repo itself:

> happy-dom's real `MediaQueryList`, under vitest's environment, does not track `window.innerWidth`
> mutations — verified empirically while building this test: `window.matchMedia("(min-width: 501px)").matches`
> stayed `true` after setting `window.innerWidth = 500`, and firing a `resize` event changed nothing.

That observation is **correct**, and its conclusion is **wrong**. The cause is not happy-dom. It is
Vitest's `populateGlobal`, which installs every window key on `globalThis` as an accessor pair
(`vitest/dist/chunks/index.DC7d2Pf8.js:253-272`):

```javascript
Object.defineProperty(global, key, {
  get() {
    if (overrideObject.has(key)) return overrideObject.get(key);
    if (boundFunction) return boundFunction;
    return win[key];
  },
  set(v) {
    overrideObject.set(key, v); // <- never reaches happy-dom's BrowserWindow
  },
  configurable: true,
});
```

and, four lines later, `global.window = global`. So in a Vitest DOM test `window.innerWidth = 500`
writes into Vitest's `overrideObject` map. `window.innerWidth` then _reads back_ 500 — which is why
the observation looked like a happy-dom failure — while happy-dom's `BrowserWindow` still holds 1024,
and `MediaQueryList.matches`, which evaluates live against that window, never moves. **This is
environment-agnostic: the same shim would swallow the same assignment under jsdom.**

Measured, under real Vitest (§11, `env.test.ts` / `env2.test.ts`):

| Action                                        | `window.innerWidth` | `matchMedia("(min-width: 501px)").matches` | `resize` fired |
| --------------------------------------------- | ------------------- | ------------------------------------------ | -------------- |
| start                                         | 1024                | `true`                                     | —              |
| `window.innerWidth = 500`                     | 500                 | `true` ❌                                  | no             |
| … + `dispatchEvent(new Event("resize"))`      | 500                 | `true` ❌                                  | (manual)       |
| `window.happyDOM.setViewport({ width: 500 })` | 500                 | **`false`** ✅                             | **yes**        |

**And there is one real upstream bug underneath it.** `MediaQueryList.addEventListener` seeds its
comparison state to a literal instead of the current value
(`happy-dom/lib/match-media/MediaQueryList.js:87-100`):

```javascript
addEventListener(type, listener) {
    super.addEventListener(type, listener);
    if (type === 'change') {
        let matchesState = false;              // <- not seeded from `this.matches`
        const resizeListener = () => {
            const matches = this.matches;
            if (matches !== matchesState) {
                matchesState = matches;
                this.dispatchEvent(new MediaQueryListEvent('change', { matches, media: this.media }));
            }
        };
        ...
```

So for a query that is **already matching** when the listener is attached, the first transition _away_
from matching produces `matches === false === matchesState` and is suppressed. Measured, all three
assertions passing (§11, `env3.test.ts`):

- query starts `false` → widen → `change` fires once. ✅
- query starts `true` → narrow → `matches` flips to `false`, `change` fires **zero** times. ❌
- narrow then widen again → one `change`. (It self-corrects from the second transition on.)

That is worth an upstream issue; it is six lines to reproduce. It is also exactly the shape
`NavTakeover.tsx:144` and `CalendarWidget.tsx:111` rely on (`mq.addEventListener("change", …)`), which
is why three test files ended up hand-rolling a `mockMatchMedia`.

**The rule this class closes with** (per #3086 clause 2 — a class closes with a rule or not at all):
_never assign to `window.innerWidth`/`innerHeight` in a test; drive the viewport with
`window.happyDOM.setViewport({ width })`, and drive an MQL `change` transition explicitly._ The first
half is enforceable with the `no-restricted-syntax` machinery already at
`apps/web/eslint.config.mjs:33` — an `AssignmentExpression[left.property.name=/^inner(Width|Height)$/]`
selector, the same shape as `IN_BODY_ROUTE_IMPORT`. The second half stays a stub until happy-dom seeds
`matchesState`.

### 2.3 `hashchange`: it fires, one macrotask later

happy-dom queues hash-change events and flushes them from a `setTimeout`
(`happy-dom/lib/location/Location.js`), so `location.hash = "#x"` followed by a synchronous assertion
sees nothing, and the same assertion after one macrotask sees the event. The repo already knows this
in one place — `HubSearch.test.tsx:378-379` says "happy-dom does not fire `hashchange` synchronously
on a hash write" — and the wave's summary flattened it to "never fires". All five test files that
touch `hashchange` work around it by dispatching the event by hand, which is a legitimate unit-level
choice. **Cost of the real behaviour: one `await`. Nothing to fix; one line to correct in the ledger.**

### 2.4 `color-mix()` and layout are real — and jsdom fixes neither

Both reproduce. `color-mix()` is not a regression, it is absent: a GitHub code search over
`capricorn86/happy-dom` returns **zero** occurrences of the string anywhere in the repository,
including tests, so the CSS value parser has no code path for it and an unrecognised value is
discarded. Layout has never existed — the source tree has no layout module, and three open issues
report the symptom ([#1416](https://github.com/capricorn86/happy-dom/issues/1416) "getBoundingClientRect
always returns 0", [#2222](https://github.com/capricorn86/happy-dom/issues/2222),
[#2145](https://github.com/capricorn86/happy-dom/issues/2145)).

jsdom is explicit that it is the same:

> **Layout**: the ability to calculate where elements will be visually laid out as a result of CSS,
> which impacts methods like `getBoundingClientRects()`
> — [jsdom README, "Unimplemented parts of the web platform"](https://github.com/jsdom/jsdom)

### 2.5 What the 370 files actually assert

|                                                               |                  Files |
| ------------------------------------------------------------- | ---------------------: |
| Total `apps/web` test files (excluding `test/e2e`)            |                    370 |
| Touch `@testing-library`, `document.`, `window.` or `screen.` |                    254 |
| Pure — no DOM reference at all                                |                **116** |
| Call `render(`                                                | 237 (2 836 call sites) |
| Reference `getBoundingClientRect`                             |                  **2** |
| Reference `color-mix`                                         |                  **1** |
| Reference `getComputedStyle`                                  |                  **1** |
| Reference `matchMedia`                                        |                      6 |
| Reference `hashchange`                                        |                      5 |

The three "environment" rows do not mean what they look like:

- The **2** `getBoundingClientRect` files (`src/hooks/useSectionNav.test.ts`,
  `src/app/(main)/ploegen/[slug]/(detail)/TeamSectionNav.test.tsx`) both stub it with
  `Object.defineProperty`. These are the scroll-spy geometry tests — the exact behaviour #3086 sends
  to Storybook `play` against a fixture.
- The **1** `color-mix` file asserts a _class name_, not a computed style:
  `expect(cell.className).toContain("bg-[color-mix")` (`StandingsTable.test.tsx:299`). A real browser
  would not make this test better; it would make it a VR baseline, which already exists.
- The **1** `getComputedStyle` file spies on the _call count_ to prove a hot path does not read layout
  (`useScrollHint.test.ts:913`). It needs a spy, not a layout engine.

**So: after #3086 re-homes the two geometry files, the number of `apps/web` test files that need a
real browser is zero.**

### 2.6 jsdom would be a regression

Not a preference — a measured one. jsdom's own Web-Platform-Test status file records:

```yaml
"Window method: matchMedia": [fail, Not implemented]
```

— [`test/web-platform-tests/to-run.yaml`](https://github.com/jsdom/jsdom/blob/main/test/web-platform-tests/to-run.yaml),
alongside `'!(nested-media-queries.html)': [fail-slow, Media query evaluation and matchMedia not implemented]`.
The string `matchMedia` appears nowhere in jsdom's `lib/`. happy-dom has implemented `matchMedia` since
[v2.32.0](https://github.com/capricorn86/happy-dom/releases/tag/v2.32.0) and width/height range
matching since [v7.0.0](https://github.com/capricorn86/happy-dom/releases/tag/v7.0.0). Moving to jsdom
would turn §2.2's fixable class into an unfixable one.

jsdom is better in exactly one of the four: it fires `hashchange` through a real spec task queue
(`lib/jsdom/living/window/SessionHistory.js`) rather than a debounced `setTimeout`. That buys one
`await`.

Both are actively maintained — jsdom 30.1.1 shipped 2026-09-22, happy-dom 20.14.5 on 2026-09-12 — so
neither is a maintenance-risk argument. Note also that the widely repeated "happy-dom is N× faster
than jsdom" numbers have **no primary source**: happy-dom's README makes no performance claim, and the
only first-party statement is Vitest's, which is qualitative — "considered to be faster than jsdom, but
lacks some API" ([guide/environment](https://vitest.dev/guide/environment)). Do not put a multiplier
in the spec.

### 2.7 Browser mode for component tests — the honest case

[#3085](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3085) recommended moving VR to Vitest
browser mode; [#3082](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3082) refuted that for VR
specifically, with sources. Whether browser mode is right for _component_ tests is this ticket's to
answer, and the answer is **no, and not yet**:

- **There is no test to move.** §2.5: zero files need a real browser once the two geometry files are
  re-homed.
- **Vitest still tells you to hedge.** "Early Development… It is recommended that users augment their
  Vitest browser experience with a standalone browser-side test runner like WebdriverIO, Cypress or
  Playwright" — [`docs/guide/browser/why.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/browser/why.md).
  (The _feature_ lost its experimental tag in 4.0; that page's Drawbacks section did not.)
- **Its isolation is coarser than what happy-dom gives today**: "Vitest opens a _single_ page to run
  all tests that are defined in the same file… isolation is restricted to a single test file, not to
  every individual test" ([`config/browser/playwright.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/browser/playwright.md)).
  That is the same grain as today, but with a browser context instead of a fork — strictly more
  expensive per file, across 370 files.
- **It would fight the wave, not help it.** 370 Chromium contexts on a machine already running four
  agents is the contention problem of §3, amplified.

**Where browser mode _is_ the right answer is the seam #3086 already chose: Storybook `play`.**
`@storybook/addon-vitest` is installed and registered at `apps/web/.storybook/main.ts:18` and is
**dark** — no `storybookTest` plugin, no `projects`, no `browser:` block anywhere in the repo. Two
facts sharpen its cost, both first-party:

1. **It effectively requires browser mode**, despite the docs' softer "we recommend": since Storybook
   9 the plugin unconditionally imports `@vitest/browser/context`, which throws outside browser mode
   ([storybookjs/storybook#32444](https://github.com/storybookjs/storybook/issues/32444)).
2. **Every story becomes a test, not just the 11 with a `play`.** "Stories are tested in two ways: a
   smoke test to ensure it renders and, if a play function is defined, that function is run"
   ([vitest-addon docs](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)). So
   wiring it adds **208 browser smoke tests**, not 11 — that is the real bill for #3086's geometry
   move, and it is not in anyone's estimate yet. It is also 208 free render checks, so it may well be
   worth it; it just has to be said out loud.

And it still has no visual-regression feature, confirming #3082: Storybook's `visual-testing` page
names only Chromatic, and a user asking for `toMatchScreenshot` support in addon-vitest got
`Invalid Chai property: toMatchScreenshot`
([storybookjs/storybook#32930](https://github.com/storybookjs/storybook/discussions/32930)).

### 2.8 Verdict on the environment

**Keep happy-dom, everywhere it is today, and close the `matchMedia` class with a lint rule rather
than a stub.** The split rule, stated so it is a rule and not a vibe:

> A test runs in happy-dom unless it asserts on **geometry produced by a layout engine** — a real
> `getBoundingClientRect`, an overflow, a sticky offset, a scroll position, or a computed colour. Those
> do not move to a different Vitest environment; they leave Vitest for a Storybook `play` against a
> fixture that guarantees the condition. There is no third environment.

That is the same line #3086 drew, now with the file count behind it: **2 of 370**, going to 0.

## 3. Isolation, pools and CPU contention

### 3.1 What was measured, and on what

Apple M1 Pro, 8 cores, 32 GB, macOS 25.6.0, Node 24.20.0, `vitest@4.1.11`, `apps/web` only, no
coverage, Docker not running, desktop idle apart from the editor (1-min load average 3.1 before the
first run). Each row is one full `vitest run` of all 370 files; the command is in §11. Every run was
370/370 files and 13 608/13 608 tests green unless the table says otherwise.

| #   | Flags                                 |        Wall | Result                                       |
| --- | ------------------------------------- | ----------: | -------------------------------------------- |
| 1   | _(none — the repo's actual config)_   |  **98.6 s** | 370 / 370 files, 13 608 / 13 608 tests green |
| 2   | `--pool=threads`                      |  **92.4 s** | green                                        |
| 3   | `--pool=threads --no-isolate`         |  **14.3 s** | **38 files failed, 267 tests failed**        |
| 4   | `--no-isolate` _(forks)_              |  **21.6 s** | **27 files failed, 178 tests failed**        |
| 5   | `--maxWorkers=2`                      | **208.1 s** | green                                        |
| 6   | _(none — repeat of #1, for variance)_ | **106.3 s** | green                                        |

Three things this says:

**`--no-isolate` is by far the biggest knob, and it breaks the suite.** 98.6 s → 21.6 s on forks
(4.6×) and → 14.3 s on threads (6.9×) — and 178 and 267 tests respectively stop passing. The failures
are not random: they cluster in files that own module-level state. `src/lib/server/match-data.test.ts`
(11 of 18), `src/app/(landing)/(home)/page.test.tsx` (7 of 8, including two that blow the 5 s
`testTimeout` at 4 038 ms and 5 004 ms), `src/hooks/filterParam.test.ts` and
`useRouterFilterParam.test.ts` (which read and write the live `window.location.search`),
`canonical-urls.test.ts`, `ScrollToTop.test.tsx`. That is `vi.mock` registries and `window.location`
leaking across file boundaries — precisely what `isolate: true` buys. **This is the evidence for
keeping the default**, and it is the one number anybody tempted by the 7× should be shown.

**`--pool=threads` is ~6 % faster, which is inside the noise.** Run-to-run variance on the unchanged
default was 98.6 s → 106.3 s (7.8 %). Threads' 92.4 s is not distinguishable from that at n = 1, and
it is not the shipped default. Not worth a config line on this evidence; worth re-measuring at n = 5
if anyone wants it.

**`--maxWorkers=2` costs 2.1× wall time for one agent.** That is the honest price of §3.3's
recommendation — and it is a price paid _per agent_ to stop four agents from asking for 28 workers on
8 cores. Note its phase totals are much lower than the default's (import 215 s of CPU against 382 s),
which is the contention showing up as wasted CPU rather than as wall time.

### 3.2 Where the time actually goes

Vitest's own phase accounting, run #1 (CPU-seconds summed across workers, so they exceed wall time):

| Phase                                    |    CPU-s |    Share |
| ---------------------------------------- | -------: | -------: |
| import                                   |    382.4 | **60 %** |
| environment (happy-dom boot × 370 files) |    105.7 |     17 % |
| setup (`tests/setup.ts` × 370)           |     69.8 |     11 % |
| **tests (the assertions themselves)**    | **59.9** |  **9 %** |
| transform                                |     16.0 |      3 % |

This is the number that disqualifies most of §1. **Nine per cent of the CPU is the thing a runner
actually runs.** Sixty per cent is resolving and evaluating a module graph, which Jest, Bun and
`node:test` all pay too — and the 17 % environment line is 370 happy-dom boots, which a real browser
would make larger, not smaller.

### 3.3 Surviving four sibling agents on one machine

The measurement that matters is not "which pool is fastest alone" but "what does a wave cost". With
`maxWorkers` unset, **each** agent's `apps/web` run spawns `availableParallelism() − 1` = **7** worker
processes. Four agents running `check-all` therefore ask for **28 worker processes on 8 cores**, and
`check-all` is a plain shell chain, so each agent also runs `next build` and `eslint .` in the same
window.

Three levers, in order of how much they buy:

1. **Cap the workers, not the pool.** `--maxWorkers=2` per agent turns 28 requested workers into 8,
   which is the core count. Measured cost per agent in §3.1; the wave-level number is what matters and
   it is a division, not a multiplication. **The repo already accepts this trade one layer up** — the
   VR scripts pass `--maxWorkers=1` to `test-storybook` to serialise story capture
   (`docs/agents/testing-ops.md:289`). The Vitest layer simply never got the same treatment, and the
   AFK brief hands every agent an uncapped `pnpm --filter @kcvv/web check-all`
   (`.claude/skills/ralph-afk/AFK-BRIEF.md:87`).
2. **Do not reach for `--no-isolate`.** It is the single biggest speed knob (measured §3.1), and it is
   the wrong one for this suite: `tests/setup.ts` mutates `process.env` at module scope and mocks
   `next/font/google` globally, 4 test files call `vi.setSystemTime`, and `test/hooks/*` spawn real
   processes and write temp dirs. Sharing a module registry across 370 files in that shape trades a
   contention flake for an ordering flake, which is worse — an ordering flake does not reproduce alone
   _or_ under load.
3. **`--shard` is for CI, not for the wave.** It splits _files_ across machines and cannot be combined
   with watch; with `--reporter=blob --merge-reports` it is the right answer for the CI job in #3091,
   and it does nothing for four processes on one box.

`--changed` and `vitest related --run` are the wave-local speed levers that actually apply: both are
already wired as `test:changed` and `test:related` in `apps/web/package.json` and are used nowhere.
Note the documented trap: `forceRerunTriggers` defaults to `["**/package.json/**", "**/{vitest,vite}.config.*/**"]`,
so a Renovate bump correctly reruns everything, and `related` "works with static imports… but not the
dynamic ones" — which, after #2378 banned in-body route imports, is now almost exactly true of this
suite.

Turborepo's own lever is `--concurrency` (default **10**, accepts `1` or a percentage like `50%`);
there is no per-task "do not run concurrently with siblings" flag — `persistent` and `with` are about
task lifecycle, not CPU ([turborepo.dev/docs/reference/run](https://turborepo.dev/docs/reference/run)).

### 3.4 Timing assertions that do not depend on CPU speed

The ledger's row 19 — `SearchInterface.test.tsx` fails under sibling agents, passes alone — is marked
"**not yet reproduced under a controlled contention test**". §3.5 ran one, and it still did not
reproduce. That does not make the file sound; here is why it is structurally fragile, which is visible
without running anything:

|                                                      |                                                                Count |
| ---------------------------------------------------- | -------------------------------------------------------------------: |
| `waitFor(` call sites in the whole `apps/web` suite  |                                                  107, in **6** files |
| … of those, in `SearchInterface.test.tsx` alone      |                                                               **80** |
| Files using `vi.useFakeTimers()`                     |                                                         **9** of 370 |
| Files using `advanceTimersByTime`                    |                                                                    5 |
| `waitFor` timeouts raised above the 1 000 ms default | 4, all in `SearchInterface.test.tsx` (1 000, 1 000, 2 000, 3 000 ms) |

`SearchInterface.test.tsx` is 1 924 lines, uses **real timers**, drives `userEvent.type()` character by
character, and waits on `SearchForm`'s real **350 ms** debounce (`:1452`, `:799`) inside `waitFor`
budgets of 1 000 ms. That is a wall-clock margin of ~650 ms on an 8-core box that a wave asks to run 28
workers on. It is not a flake in the sense of randomness; it is a stopwatch race that the machine wins
or loses.

**The rule.** `@testing-library/user-event@14.6.6` — the version installed
(`apps/web/package.json:79`) — exposes exactly the seam this needs. From its own type declarations
(`dist/types/options.d.ts:109-114`):

```typescript
/**
 * A function to be called internally to advance your fake timers (if applicable)
 *
 * @example jest.advanceTimersByTime
 */
advanceTimers?: ((delay: number) => Promise<void>) | ((delay: number) => void);
```

So the rewrite is:

```typescript
vi.useFakeTimers();
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
// …type…
await act(async () => {
  await vi.advanceTimersByTimeAsync(350);
}); // the debounce, deterministically
expect(fetchMock).toHaveBeenCalledTimes(1);
```

Written that way the 350 ms is _simulated_, so the assertion no longer has a wall-clock budget at all
and `{ timeout: 1000 }` can be deleted rather than raised — which is what #3086 clause 2 and the
ledger's "every class that ended, ended with a rule" both require. Second half of the rule: prefer
`findBy*` (which retries until the element exists) over `waitFor` wrapping a `getBy*` — the suite
already uses `findBy*` in 11 files / 92 sites, so this is a convention to state, not to invent.

A third, cheaper rule covers the other named contention flakes:
`player-figure-variant.test.ts` holds one 1 405 ms property-style test (#3079's slowest-test table) —
a CPU-bound loop, not a timer (fixed by #3128) — and the external-embed page tests race real `fetch`. The first wants a
bounded iteration count, the second wants `vi.stubGlobal("fetch", …)`; neither wants a timeout.

### 3.5 Trying to reproduce row 19 — and failing

The ledger asks for a controlled contention test. Here it is, and **it did not reproduce**. That is
worth more than a confirmation would have been, so it is recorded in full.

`SearchInterface.test.tsx` was run alone, three times idle and three times against 28 spinning shell
loops — 28 because that is exactly what a four-agent wave asks of these 8 cores (4 × `maxWorkers` 7).
An intermediate run at 8 loops is included.

| Condition             | 1-min load |                        Wall | Result                    |
| --------------------- | ---------: | --------------------------: | ------------------------- |
| idle × 3              |       3–14 |        4.76 / 4.74 / 5.04 s | 62 / 62 green, 3 of 3     |
| 8 busy loops × 3      |        ~17 |        7.60 / 7.49 / 7.85 s | 62 / 62 green, 3 of 3     |
| **28 busy loops × 3** |    **~57** | **16.52 / 17.25 / 19.19 s** | **62 / 62 green, 3 of 3** |

A **3.5–4× wall-clock slowdown did not break a single assertion**, in nine runs. So the honest reading of row 19 is:

- **The file is structurally fragile** — real timers, a real 350 ms debounce, `userEvent.type()`
  keystroke by keystroke, and 80 `waitFor` sites of which four have hand-raised budgets. That much is
  not in dispute and is visible without running anything.
- **But pure CPU starvation is not sufficient to trip it**, at least not at 3.5×. Something else in
  the wave is doing the work. The most likely candidate, and the one this experiment deliberately did
  not reproduce, is that `check-all` ends in `next build` — a _memory_-hungry step, not a CPU-hungry
  one — and four concurrent Next builds on a 32 GB machine push the box into swap, where a 350 ms
  debounce and a 1 000 ms budget are no longer separated by 650 ms of anything.
- **So row 19 stays open, and its brief should change.** The reproduction to attempt is four
  concurrent `check-all` runs, not four CPU loads; and the fix is still the §3.4 rule, because a test
  that cannot be starved is better than a test that has merely not been starved hard enough yet.

One thing the experiment does settle: **`--maxWorkers` is not the lever for this file.** Running it
alone at 3.5× load is green, so the failure the wave saw is not "too many Vitest workers" — it is the
whole `check-all` chain, which §4.2 is about.

## 4. Turborepo integration

### 4.1 The `test` cache hole — the exact ten files

`turbo.json` declares:

```json
"test": {
  "dependsOn": ["^build"],
  "outputs": ["coverage/**"],
  "inputs": ["src/**", "tests/**", "vitest.config.*"]
}
```

`apps/web` keeps its setup at `tests/setup.ts` (plural — **covered**) and everything else at `test/`
(singular — **not covered**). Measured here, first-hand, against the installed Turbo 2.10.12:

```text
resolved inputs spec: ["src/**","tests/**","vitest.config.*"]
total hashed inputs : 1253
  under src/        : 1246
  under tests/      : 5
  under test/       : 0
  next.config.test.ts present: false
  other             : package.json, vitest.config.ts
```

The ten files Vitest runs that Turbo does not hash:

| #   | File                                                                    |
| --- | ----------------------------------------------------------------------- |
| 1   | `apps/web/test/hooks/check-branch.test.ts`                              |
| 2   | `apps/web/test/hooks/pre-commit.test.ts`                                |
| 3   | `apps/web/test/hooks/trigger-psd-sync.test.ts`                          |
| 4   | `apps/web/test/hooks/wave-check.test.ts`                                |
| 5   | `apps/web/test/reporters/github-summary.test.ts`                        |
| 6   | `apps/web/test/scripts/analytics-taxonomy.test.ts`                      |
| 7   | `apps/web/test/scripts/vr-docker.test.ts`                               |
| 8   | `apps/web/test/vr/structural-assertions.test.ts`                        |
| 9   | `apps/web/test/vr/viewport-scoping.test.ts`                             |
| 10  | `apps/web/next.config.test.ts` (package root; imports `next.config.ts`) |

Plus every fixture under `test/fixtures/`, and — because four of these spawn the real scripts — the
repo-root files they execute, which are outside the package and unhashable by any `src/`-relative glob.

**Is the fix an `inputs` change, a directory move, or both?** An `inputs` change, and not the obvious
one. The decisive doc fact is that `inputs` is not additive:

> "This feature opts out of all of Turborepo's default `inputs` behavior, including following along
> with changes tracked by source control."
> — [configuring-tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks)
>
> "Using the `inputs` key opts you out of `turbo`'s default behavior of considering `.gitignore`. You
> must reconstruct the globs from `.gitignore` as desired or use `$TURBO_DEFAULT$`"
> — [reference/configuration#inputs](https://turborepo.dev/docs/reference/configuration#inputs)

So the present list did not _narrow_ the default, it **replaced** it — which is why
`next.config.test.ts` at the package root is missing too, and why adding `"test/**"` would fix nine
files and leave the tenth and every future one. `$TURBO_DEFAULT$` restores the whole-package default
and then `$TURBO_ROOT$/…` entries reach the out-of-package files; that is the shape #3096's brief
already settled with the owner, and this document confirms it rather than re-deciding it. A directory
move (`test/` → `tests/`) would fix the nine but not `next.config.test.ts`, and would churn 9 files'
worth of imports to buy a narrower fix. **Not both — `inputs` only.**

Worth recording, because it is not in the Turborepo docs: the "missing input → silent stale hit"
failure mode is an _accepted_ limitation, not a bug being fixed —
[vercel/turborepo#14059](https://github.com/vercel/turborepo/issues/14059) reports a silent cache hit
from an undeclared input and was **closed as "not planned"**. There is no warning to wait for.

### 4.2 Should `check-all` become a Turbo task?

`apps/web/package.json:check-all` is `npm run lint && npm run type-check && npm run test && npm run build`,
and `packages/sanity-studio` has its own three-step version. `turbo.json` defines only `build`, `dev`,
`lint`, `test`, `type-check` and package-scoped overrides. So `check-all` today is: four serial npm
invocations, four Node startups, **zero** Turbo orchestration, and zero caching of the chain — while
each individual step, run through Turbo, _would_ be cached.

**Yes, and the reason is not caching — it is that `&&` forces an order the dependency graph does not
require.** `lint`, `type-check` and `test` are independent of each other; only `build` has a real
ordering relationship. Turborepo's own framing of exactly this comparison is that a shell chain leaves
"much less empty space where scripts are not being ran" on the table versus one `turbo run lint build test`
([running-tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)), and its general
rule is "if you want to ensure that one task blocks the execution of another, express that relationship
in your task configurations" — i.e. `dependsOn`, not `&&`.

Two honest caveats, both of which the grilling ticket should weigh:

- **There is no official "ci"/"check" composite-task example** in the Turborepo docs. The closest
  first-party pattern is the _transit node_ in the repo's own agent-skills reference
  ([`skills/turborepo/references/configuration/tasks.md`](https://github.com/vercel/turborepo/blob/main/skills/turborepo/references/configuration/tasks.md)):
  a scriptless `transit` task that others `dependsOn`, so tasks stay parallel with correct caching.
  The plainer option is to stop defining `check-all` as a script at all and let the caller run
  `turbo run lint type-check test build --filter=@kcvv/web`.
- **In a wave it must come with `--concurrency`.** Making `check-all` a Turbo task without capping
  concurrency makes §3.3 worse, not better: Turbo would happily start `lint`, `type-check` and `test`
  at once, each with its own worker pool.

### 4.3 CI already has the same shape, serially

`ci.yml` runs **nine separate `npx turbo …` invocations** in one job (lines 75, 81, 84, 87, 90, 93, 96,
99, 102), fail-fast, one after another. Each is individually cached, and none can overlap with another
— `turbo lint type-check test --filter=@kcvv/web --filter=@kcvv/api …` in one invocation would let
Turbo schedule the graph. That is a speed finding for #3091, not a correctness one, and it is the same
`&&`-versus-graph point as §4.2 wearing a YAML hat.

## 5. The new contract layer at the BFF seam — is it sound, and what does it cost?

#3086 decided a new layer: `api-contract` round-trips on both sides, plus the Worker's KV/TTL/
single-flight semantics in **real workerd** via `@cloudflare/vitest-pool-workers`, with pure logic
staying in node. Assessed:

**It is sound, and the repo has the measurement to prove the gap.** `apps/api` fakes KV with a
`Map`-backed double whose `put` signature is `(key, value, _options?: { expirationTtl?: number })` —
the TTL argument is **discarded** (`apps/api/src/cache/kv-cache.test.ts:28-38`). Every TTL assertion in
that file therefore checks that the right number was _passed_, never that anything expires. And
`apps/api/src/psd/gate-do.ts` — the `PsdGate` Durable Object that implements single-flight, 59 lines,
bound in `wrangler.toml:52-54` and again for staging at `:99-101` — has **no test file at all**. Two
more bindings (`AI`, `SEARCH_INDEX`/Vectorize) are in the same position. So the layer is not
speculative; it is aimed at three untested runtime primitives.

**What it costs, with the version facts checked:**

- `@cloudflare/vitest-pool-workers` is **not installed** (no `@cloudflare` in `node_modules`). The
  version that supports Vitest 4 is **0.13.0**, peer `vitest@^4.1.0`
  ([migrate-from-vitest-3-to-vitest-4](https://developers.cloudflare.com/workers/testing/vitest-integration/migration-guides/migrate-from-vitest-3-to-vitest-4/)).
  The repo's 4.1.11 qualifies — #3086's claim holds.
- **Two documented costs #3086 does not mention.** First, **no V8 coverage**: "Native code coverage via
  V8 is not supported. You must use instrumented code coverage via Istanbul instead"
  ([known-issues](https://developers.cloudflare.com/workers/testing/vitest-integration/known-issues/)).
  `apps/api` depends on `@vitest/coverage-v8@4.1.11` and has a `test:coverage` script with no explicit
  provider, so it resolves to v8 — a workerd project therefore means either two coverage providers in
  one repo or `@vitest/coverage-istanbul` for that project. (CI does not currently pass `--coverage`
  to `apps/api`, so this is a latent cost, not an immediate one.) Second, **fake timers do not reach
  the simulators**: "Vitest's fake timers do not apply to KV, R2 and cache simulators" — so a
  TTL-expiry test cannot fast-forward a clock, which is the obvious way one would want to write it.
- **Isolation got coarser in exactly the version this repo would adopt.** 0.13.0 removed
  `isolatedStorage`/`singleWorker`: "Storage isolation is now per test file instead of per test". That
  is contentious enough to have its own open issue
  ([workers-sdk#12889](https://github.com/cloudflare/workers-sdk/issues/12889)). For a cache layer,
  per-_test_ storage isolation is precisely what you want, and it is no longer on offer.

**Assessment:** adopt it, scoped hard. The split rule #3086 wrote ("a path that touches KV, TTL or
single-flight runs in workerd; pure logic stays in node") is right, and the file counts say it is
small: of 39 `apps/api` test files, **17** so much as mention KV, a TTL or single-flight — and of
those, **1** is the KV cache itself, **1** would be a new `gate-do` test, and the other 15 are pure
logic that should stay in node under #3086's own split rule. Budget it as a second
Vitest project in `apps/api` covering **2–4 files**, with Istanbul coverage for that project only, and
write the TTL tests against real short TTLs rather than a clock.

## 6. The Node-version defect — real, cheap, unfiled

`fs.globSync` was added in **Node v22.0.0** and marked stable in v24.0.0 / v22.17.0
([nodejs/node `doc/api/fs.md`](https://github.com/nodejs/node/blob/main/doc/api/fs.md), history block;
[v22.0.0 release notes](https://nodejs.org/en/blog/release/v22.0.0), PR
[#51912](https://github.com/nodejs/node/pull/51912)). It does not exist on Node 20. Confirmed on this
machine:

```text
v20.20.0   globSync: undefined | glob: undefined
v22.16.0   globSync: function  | glob: function
v24.20.0   globSync: function  | glob: function
```

**Five** `apps/web` test files import `globSync` from `node:fs` — `src/app/__tests__/loading-envelope.test.tsx`,
`cross-page-consistency.test.ts`, `detail-tokens-consistency.test.ts`, `isr-route-config.test.ts`, and
`test/vr/structural-assertions.test.ts`. (The wave reported three; the count today is five, four of
which call it at module scope.)

`.nvmrc` says `24.20.0`. **No workspace declares an `engines` field** — `grep '"engines"'` across the
root and all six workspace `package.json` files returns nothing. That is the whole defect: the version
is documented in a file only `nvm` reads, and nothing fails fast when it is ignored.

The fix is one key, and pnpm enforces it for the project itself regardless of `engine-strict`:

> "Regardless of this configuration, installation will always fail if a project (not a dependency)
> specifies an incompatible version in its `engines` field."
> — [pnpm settings#engineStrict](https://pnpm.io/settings#enginestrict)

So `"engines": { "node": ">=22" }` in the root `package.json` turns a confusing five-file test failure
into a one-line install error. `>=22` rather than `>=24` is the honest bound: that is what the code
actually requires, and `wrangler` already needs ≥ 22 too. **Recommend filing this; it is not in the
ledger and it is a ten-minute change.**

## 7. Every workspace states which layers apply (#3086 clause 3)

Clause 3 says all six workspaces answer, and "none, and why" is valid while silence is not. Three are
currently silent. Proposed answers, for the spec to adopt or reject:

| Workspace                             | Test files | Config                           | Which layers apply                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------- | ---------: | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`                            |        370 | `vitest.config.ts`, happy-dom    | Static, Build, Vitest/happy-dom, Storybook (VR + `play`), E2E                                                                                                                                                                                                                                                                                                                                        |
| `apps/api`                            |         39 | `vitest.config.ts`, node         | Static, Vitest/node, **Contract (workerd)** for the KV/TTL/single-flight paths (§5)                                                                                                                                                                                                                                                                                                                  |
| `packages/api-contract`               |          5 | `vitest.config.ts`, node default | Static, Vitest/node, **Contract** — it is the schema both sides round-trip                                                                                                                                                                                                                                                                                                                           |
| `packages/sanity-studio`              |         46 | `vitest.config.ts`, happy-dom    | Static, Vitest/happy-dom. **No VR, no E2E** — it renders inside Sanity's shell, which this repo does not own                                                                                                                                                                                                                                                                                         |
| `packages/sanity-schemas`             |      **0** | **none**                         | **Static only, and that is a decision, not an omission.** Schema _shape_ is checked by `tsgo` and by Sanity TypeGen, whose output (`apps/web/src/lib/sanity/sanity.types.ts`) is consumed by 370 typed tests one workspace over. A schema definition with no behaviour has nothing a unit test would add. Revisit the day a schema grows a `validation` rule or a custom input — those are behaviour |
| `apps/studio` / `apps/studio-staging` |      **0** | **none**                         | **Mostly "none", with one hole — see below**                                                                                                                                                                                                                                                                                                                                                         |

**`apps/studio` does not get a clean "none", and the reason is worth the paragraph.** Its
`sanity.config.ts` is 38 lines (staging's is 42) and is a genuine configuration shell, so the
parity claim between the two studios is a _structural_ one that belongs in a static check rather than
a Vitest suite. But the workspace also carries executable code that mutates production Sanity:

- **`apps/studio/migrations/` — 26 migrations, 722 lines.** **15 of 26** are the pattern working
  exactly as #3086 clause 1 wants: a four-line wrapper re-exporting a migration whose logic and test
  live one layer down in `packages/sanity-studio/src/migrations/<name>.{ts,test.ts}`. The remaining
  **11 hold their logic in place and are tested nowhere.**
- **`apps/studio/scripts/` — 3 files, 649 lines** (`migrate-drupal-node.ts` 291,
  `seed-interview-qa-pairs.ts` 205, `remap-qa-respondent-keys.ts` 153). **Zero** import the shared
  package, and none is tested. This is the same shape as
  [#3056](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3056) (nothing lints, type-checks or
  tests the repo-root `scripts/`), one directory over and not covered by it.

So the honest answer for `apps/studio` is: **Static for the shell; Vitest for the 11 migrations and
3 scripts that are not yet pushed down — and the cheapest route to that is to push them down rather
than to add a `vitest.config.ts` here**, because the 15 that already moved are tested for free.
`apps/studio-staging` (20 migration files, same wrapper shape) then inherits the answer.

Two of the three zero-test workspaces are cheap clause-3 debt — `sanity-schemas` answers "static
only", `studio-staging` answers "none" — and neither needs a `vitest.config.ts`. `apps/studio` is the
one that turns out to hide real untested code.

## 8. Migration cost, honestly

"Keep" is an option with a cost, so it is priced alongside the others.

| Option                                           | What moves                                                                                                                                                               | Cost                                                                                                                                                                                                | Buys                                                                                                                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keep Vitest + happy-dom** (recommended)        | nothing moves; 3 rules + 3 config lines                                                                                                                                  | **~2 days**: one lint rule (`innerWidth` assignment), one fake-timer rewrite of `SearchInterface.test.tsx` (1 924 lines, 80 `waitFor` sites), `engines`, `test.inputs`, `--maxWorkers` for the wave | closes the `matchMedia` class with a rule; makes ledger row 19 unrepeatable _by construction_ rather than by evidence (§3.5 could not starve it); closes the Node-20 defect; closes the #3096 cache hole |
| Vitest → Jest 30                                 | 460 files; every `vi.*` → `jest.*`; `vitest.config.ts` ×4 → `jest.config` ×4; ESM via `--experimental-vm-modules`; a transform pipeline Vite currently makes unnecessary | **6–10 weeks**, and a permanent second config surface                                                                                                                                               | nothing this repo lacks                                                                                                                                                                                  |
| Vitest → `node:test`                             | impossible for 416 of 460 files (no DOM); would split the repo across two runners for the 44 node-only files                                                             | —                                                                                                                                                                                                   | —                                                                                                                                                                                                        |
| Vitest → Bun test                                | 460 files + a second runtime pinned in CI, Vercel and every agent worktree; default no-isolation is the wrong direction for a contention-flaky suite                     | **4–8 weeks** + ongoing runtime drift                                                                                                                                                               | a fraction of the 9 % that is assertions                                                                                                                                                                 |
| happy-dom → jsdom                                | `environment` string ×2 + re-fixing everything `matchMedia`-shaped                                                                                                       | ~1 week                                                                                                                                                                                             | **a regression** — jsdom does not implement `matchMedia` (§2.6)                                                                                                                                          |
| happy-dom → browser mode (component tests)       | 237 `render(`-calling files into Chromium contexts; `@vitest/browser-playwright`; a Playwright browser per agent worktree                                                | **4–6 weeks** + a large per-file runtime increase under a 4-agent wave                                                                                                                              | 0 files that need it after #3086 (§2.5)                                                                                                                                                                  |
| Wire `@storybook/addon-vitest` (for `play` only) | `storybookTest` plugin + a `projects` entry + `browser:` block; **208** stories become browser tests, not 11                                                             | **~1 week**, and a new CI job's worth of runtime                                                                                                                                                    | the seam #3086's geometry move needs — this is the one migration worth buying, and it is #3082's/#3086's call, not this ticket's                                                                         |

**The cost of staying** is not zero and should be stated: happy-dom's `MediaQueryList` seed bug stays
until upstream fixes it, so `matchMedia` transitions keep being hand-stubbed in three files; there is
no layout in the unit layer, so geometry must live somewhere else forever; and every new environment
gap will be met one at a time by whoever hits it. Against six-plus weeks for any alternative that
fixes none of those, that is a good trade.

## 9. Verdict

**Keep Vitest 4.1.11 and keep happy-dom. Then change exactly three settings, close one flake class
with a lint rule, and rewrite one test file.**

1. **Runner: Vitest.** It is the only live runner that gives DOM + ESM/TS + monorepo `projects` +
   per-file isolation without adding a runtime or a transform pipeline. Its blamed cost — 60 % of CPU
   in module import — is a module-graph cost every alternative also pays. (§1)
2. **Environment: happy-dom, everywhere it is today.** Two of the four "gaps" are ours, not the tool's:
   the suite writes `window.innerWidth`, which Vitest's own global shim swallows, and it asserts
   `hashchange` synchronously when happy-dom queues it. jsdom is a regression; browser mode has zero
   files to run. (§2)
3. **The split rule:** geometry leaves Vitest for Storybook `play`. It does not move to another Vitest
   environment. 2 files of 370, both already scheduled by #3086. (§2.8)
4. **Contention: cap workers, do not disable isolation.** `--maxWorkers=2` for wave agents; leave
   `isolate: true` and `pool: forks`. `--no-isolate` is 4.6× faster and fails 178 tests; `threads` is
   inside the noise. (§3.1, §3.3)
5. **Timing: a rule, not a timeout.** `vi.useFakeTimers()` + `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`
   in `SearchInterface.test.tsx`, then **delete** the four raised `waitFor` timeouts rather than raise
   them. `findBy*` over `waitFor(getBy*)` as a stated convention. (§3.4)
6. **Turbo: `$TURBO_DEFAULT$` on `test.inputs`** (#3096 already has the right shape), and turn
   `check-all` into a Turbo invocation **with `--concurrency`** — the gain is graph parallelism, not
   caching. (§4)
7. **File the `engines` field.** Five test files need Node ≥ 22; nothing enforces it; pnpm enforces a
   project's own `engines` unconditionally. (§6)
8. **The BFF workerd layer is sound** — the KV double discards `expirationTtl` and the `PsdGate`
   Durable Object has no test at all — but budget it at 2–4 files, and know that it costs v8 coverage
   and cannot use fake timers. (§5)
9. **`apps/studio` is not a "none" workspace.** 11 of its 26 migrations and all 3 of its scripts
   (649 lines that write to production Sanity) are untested, while the other 15 migrations are
   already correctly pushed down into `@kcvv/sanity-studio` and tested there. Push the rest down
   rather than adding a fifth `vitest.config.ts`. (§7)

## 10. What this does not settle

- **The happy-dom `MediaQueryList` seed bug has no upstream issue yet.** Six lines reproduce it (§11).
  Someone should file it; until then the three hand-rolled `mockMatchMedia` helpers stay.
- **Whether `--maxWorkers=2` is the right number** rather than 3 or a percentage. §3.1 measures one
  agent; nobody has measured four agents at once, and that is the number that matters.
- **What actually breaks `SearchInterface.test.tsx` in a wave.** §3.5 could not starve it with CPU
  alone at 3.5–4×, over nine runs. The untested hypothesis is memory pressure from four concurrent
  `next build` steps, not CPU. Row 19's brief should ask for four real `check-all` runs.
- **The 208 browser smoke tests** that wiring `@storybook/addon-vitest` adds. That bill belongs to
  #3086's geometry move and is not in its estimate.
- **`#3086` says 6 test files render async RSC pages. It is 10 today** —
  `(landing)/(home)`, `(landing)/jeugd/(index)`, `(landing)/nieuws`, `(main)/club/[slug]`,
  `(main)/evenementen/(index)`, `(main)/inhoud`, `(main)/ploegen/(index)`,
  `(main)/ploegen/[slug]/(detail)`, `(main)/tegenstander/[clubId]`, and
  `src/app/__tests__/failed-read-boundaries.test.ts`. The contract's cost estimate for that clause is
  67 % low. Not re-decided here; flagged.
- **Whether `test/hooks/*` belong in the unit runner at all.** They are the four slowest files (27 s of
  78 s locally, #3079) and they spawn real shells. That is a layer question, not a runner question.

## 11. Commands that produced the numbers

```bash
# --- config baseline -------------------------------------------------------
cat apps/web/vitest.config.ts apps/api/vitest.config.ts \
    packages/sanity-studio/vitest.config.ts packages/api-contract/vitest.config.ts
find . -name 'vitest.workspace.*' -not -path '*/node_modules/*'       # -> none
grep -rn '"engines"' package.json apps/*/package.json packages/*/package.json  # -> none

# --- Vitest 4.1.11 defaults, read from the installed package ---------------
D=$(ls -d node_modules/.pnpm/vitest@4.1.11*/node_modules/vitest/dist | head -1)
sed -n '1,80p' "$D/chunks/defaults.9aQKnqFk.js"          # isolate, maxConcurrency, teardownTimeout
grep -n 'resolved.pool ??=' "$D/chunks/coverage.DM_a_rWm.js"
grep -n 'resolved.testTimeout ??=\|resolved.hookTimeout ??=' "$D/chunks/coverage.DM_a_rWm.js"
grep -n -A8 'function resolveMaxWorkers' "$D/chunks/cli-api.CnMVyzaz.js"
sed -n '236,300p' "$D/chunks/index.DC7d2Pf8.js"          # populateGlobal (§2.2)

# --- file counts -----------------------------------------------------------
cd apps/web
find src test next.config.test.ts -name '*.test.ts*' | grep -v e2e | sort -u | wc -l   # 370
rg -l -e '@testing-library' -e 'document\.' -e 'window\.' -e 'screen\.' \
   -g '*.test.ts' -g '*.test.tsx' src test next.config.test.ts | grep -vc e2e          # 254
rg -c 'waitFor\(' -g '*.test.ts*' src test | grep -v e2e                               # 107 in 6 files
rg -l 'getBoundingClientRect' -g '*.test.ts*' src test                                 # 2
rg -ln 'await [A-Za-z]*Page\(' -g '*.test.ts*' src                                     # 10

# --- Node / globSync -------------------------------------------------------
for v in v20.20.0 v22.16.0 v24.20.0; do
  ~/.nvm/versions/node/$v/bin/node \
    -e "const fs=require('node:fs');console.log(process.version,typeof fs.globSync)"
done
rg -n 'globSync' -g '*.test.ts*' apps/web/src apps/web/test                            # 5 files

# --- happy-dom probes (throwaway project OUTSIDE the repo, node_modules symlinked) --
#   env.test.ts   A/B: bare `window.innerWidth = 500` leaves matchMedia at `true`
#                 C:   happyDOM.setViewport({width:500}) flips it to `false`
#                 D:   hashchange fires on the next macrotask, not synchronously
#                 E:   color-mix() -> "", rgb() control round-trips
#                 F:   getBoundingClientRect().width === 0 for a 300px element
#   env2.test.ts  setViewport({width}) moves a live MQL's `matches`, and dispatches `resize`
#   env3.test.ts  the seed bug, isolated (each case resets the viewport first, because `isolate`
#                 is per FILE — tests in one file share the window, which confounded env.test.ts's
#                 C case and env2's third case until the reset was added):
#                   false->true  fires `change` once
#                   true ->false fires `change` ZERO times      <- the bug
#                   ->true again fires once (self-corrects from the second transition on)
PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH" \
  node node_modules/.pnpm/vitest@4.1.11*/node_modules/vitest/vitest.mjs run --reporter=verbose

# --- pool / isolation benchmark (apps/web, no coverage, Docker down) -------
V=$(ls -d node_modules/.pnpm/vitest@4.1.11*/node_modules/vitest/vitest.mjs | head -1)
/usr/bin/time -p node "$V" run                          # default: forks, isolate, maxWorkers=7
/usr/bin/time -p node "$V" run --pool=threads
/usr/bin/time -p node "$V" run --pool=threads --no-isolate
/usr/bin/time -p node "$V" run --no-isolate
/usr/bin/time -p node "$V" run --maxWorkers=2

# --- contention experiment (§3.5) ------------------------------------------
F=src/components/search/SearchInterface.test.tsx
for i in 1 2 3; do node "$V" run $F; done                       # idle
for i in $(seq 1 28); do ( while :; do :; done ) & done         # 28 busy loops
for i in 1 2 3; do node "$V" run $F; done                       # under load
kill $(jobs -p)

# --- Turbo inputs ----------------------------------------------------------
./node_modules/.bin/turbo run test --filter=@kcvv/web --dry-run=json \
  | jq '.tasks[] | select(.taskId=="@kcvv/web#test")
        | {spec: .resolvedTaskDefinition.inputs,
           total: (.inputs|length),
           under_test: [.inputs|keys[]|select(startswith("test/"))]|length}'
grep -n 'npx turbo' .github/workflows/ci.yml            # 9 separate invocations

# --- apps/api contract-layer evidence --------------------------------------
sed -n '25,40p' apps/api/src/cache/kv-cache.test.ts     # the KV double discards expirationTtl
ls apps/api/src/psd/gate-do.test.ts                     # -> no such file
grep -n 'durable_objects\|kv_namespaces' -A3 apps/api/wrangler.toml
```

## 12. Primary sources

**Vitest** (pinned to the installed `v4.1.11` tag, because `vitest.dev` now serves 5.x)

- [`docs/config/pool.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/pool.md) · [`isolate.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/isolate.md) · [`fileparallelism.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/fileparallelism.md) · [`maxworkers.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/maxworkers.md)
- [`docs/guide/migration.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/migration.md) — removals in 4.0 (`minWorkers`, `poolOptions`, `singleThread`/`singleFork`, `environmentMatchGlobs`, `poolMatchGlobs`, `workspace`)
- [`docs/guide/cli.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/cli.md) — `--shard`, `--changed`, `related`, `--project`
- [`docs/guide/projects.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/projects.md) · [`docs/guide/browser/why.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/browser/why.md) · [`docs/config/browser/playwright.md`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/browser/playwright.md)
- [guide/environment](https://vitest.dev/guide/environment) — "happy-dom … is considered to be faster than jsdom, but lacks some API"; browser mode is not an `environment`
- [Vitest 4 blog](https://vitest.dev/blog/vitest-4) — "we are removing the `experimental` tag from Browser Mode"

**DOM environments**

- [jsdom README](https://github.com/jsdom/jsdom) — "Unimplemented parts of the web platform": Layout, Navigation
- [jsdom `test/web-platform-tests/to-run.yaml`](https://github.com/jsdom/jsdom/blob/main/test/web-platform-tests/to-run.yaml) — `"Window method: matchMedia": [fail, Not implemented]`
- [jsdom `SessionHistory.js`](https://github.com/jsdom/jsdom/blob/main/lib/jsdom/living/window/SessionHistory.js) — spec-queued `hashchange`
- happy-dom releases [v2.32.0](https://github.com/capricorn86/happy-dom/releases/tag/v2.32.0) (matchMedia) · [v7.0.0](https://github.com/capricorn86/happy-dom/releases/tag/v7.0.0) (min/max-width matching, `setInnerWidth`) · [v9.19.0](https://github.com/capricorn86/happy-dom/releases/tag/v9.19.0)
- happy-dom open layout issues [#1416](https://github.com/capricorn86/happy-dom/issues/1416) · [#2222](https://github.com/capricorn86/happy-dom/issues/2222) · [#2145](https://github.com/capricorn86/happy-dom/issues/2145)

**Other runners**

- [Jest `ECMAScriptModules.md` @ v30.5.2](https://github.com/jestjs/jest/blob/v30.5.2/docs/ECMAScriptModules.md) — "experimental support for ECMAScript Modules"
- [Jest 30 announcement](https://github.com/jestjs/jest/blob/v30.5.2/website/blog/2025-06-04-jest-30.md) · [Jest CLI docs](https://github.com/jestjs/jest/blob/v30.5.2/docs/CLI.md) — "Child processes are used by default"
- [`node:test`](https://nodejs.org/docs/latest-v24.x/api/test.html) — Stability 2, `isolation: 'process'`, coverage Stability 1, no DOM
- [Node TypeScript support](https://nodejs.org/docs/latest-v24.x/api/typescript.html)
- [Bun test](https://github.com/oven-sh/bun/blob/main/docs/test/index.mdx) — "Isolating every file is how Jest and Vitest behave by default"; [Jest-compat tracking issue](https://github.com/oven-sh/bun/issues/1825)

**Turborepo**

- [reference/configuration#inputs](https://turborepo.dev/docs/reference/configuration#inputs) · [configuring-tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) · [running-tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks) · [reference/run](https://turborepo.dev/docs/reference/run)
- [vercel/turborepo#14059](https://github.com/vercel/turborepo/issues/14059) — silent stale hit from an undeclared input, closed "not planned"
- [`skills/turborepo/references/configuration/tasks.md`](https://github.com/vercel/turborepo/blob/main/skills/turborepo/references/configuration/tasks.md) — the transit-node pattern

**Cloudflare / Storybook / Node / pnpm**

- [vitest-pool-workers: migrate to Vitest 4](https://developers.cloudflare.com/workers/testing/vitest-integration/migration-guides/migrate-from-vitest-3-to-vitest-4/) — 0.13.0, `vitest@^4.1.0`, per-file storage isolation
- [vitest-pool-workers known issues](https://developers.cloudflare.com/workers/testing/vitest-integration/known-issues/) — no V8 coverage; fake timers do not reach KV/R2/cache
- [workers-sdk#12889](https://github.com/cloudflare/workers-sdk/issues/12889) — "Reintroduce isolated storage"
- [Storybook Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) — smoke test for every story; [storybookjs/storybook#32444](https://github.com/storybookjs/storybook/issues/32444) — browser mode effectively required; [#32930](https://github.com/storybookjs/storybook/discussions/32930) — no `toMatchScreenshot`
- [Node `doc/api/fs.md`](https://github.com/nodejs/node/blob/main/doc/api/fs.md) + [v22.0.0 release](https://nodejs.org/en/blog/release/v22.0.0) + [PR #51912](https://github.com/nodejs/node/pull/51912) — `fs.globSync` added v22.0.0
- [pnpm `engineStrict`](https://pnpm.io/settings#enginestrict) — a project's own `engines` is always enforced
