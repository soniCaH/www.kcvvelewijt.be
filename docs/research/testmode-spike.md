# Spike: does `next/experimental/testmode` work for this app?

Resolves [#3098](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3098). Blocks [#3087](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3087) (E2E data) and ledger row 12.

Measured 2026-09-22. Three facts, measured — not reasoned from the docs.

## Verdict, up front

| # | Question | Answer |
| - | -------- | ------ |
| 1 | Does `testmode` work under `next start`? | **Yes.** Not dev-only. |
| 2 | Does it fire on an ISR cache hit? | **Yes — because under `testmode` there are no cache hits.** `experimental.testProxy: true` disables Next's incremental cache outright. |
| 3 | Does `instrumentation.ts`'s `register` run in `next build`'s prerender workers? | **No.** It does not run in `next build` at all. |

**For Option E in [#3081](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3081):** the runtime half is viable — one in-process seam covers 100 % of page data on every route kind. The build half is **not** solved by `instrumentation.ts`; it is solved by `NODE_OPTIONS=--require`, measured working in §4. The cost of the runtime half is that **the E2E run no longer exercises the production cache path** (§2.3) — that is a contract decision for #3087, not a blocker.

## Method

A throwaway Next app pinned to the repo's exact versions: `next@16.3.5`, `react@19.3.0`, `react-dom@19.3.0`, `@playwright/test@1.60.0`, Node v24.20.0. All three questions are framework behaviour, so a minimal app is the right instrument and it isolates the answer from this repo's config.

Five route kinds, each fetching a local fake upstream on `127.0.0.1:4599` that logs every hit:

| Route | Declaration |
| ----- | ----------- |
| `/dyn` | `export const dynamic = 'force-dynamic'`, `fetch(..., { cache: 'no-store' })` |
| `/static` | `export const dynamic = 'force-static'`, `fetch(..., { cache: 'force-cache' })` |
| `/blog/[slug]` | `generateStaticParams` → `alpha`, `beta`; `force-static` |
| `/blog/gamma` | same route, slug **not** prerendered — an on-demand render |
| `/isr` | `export const revalidate = 2`, `fetch(..., { next: { revalidate: 2 } })` |

Plus `instrumentation.js` and each page appending `process.pid` to a log, so "did this code run, and in which process" is observed, not assumed.

## 1. `next start` — yes

`next/experimental/testmode` is **not** dev-only. The docs example uses `next dev`; the implementation does not care.

```bash
node node_modules/next/dist/bin/next build
node node_modules/@playwright/test/cli.js test --config playwright.config.ts --project=chromium
```

Each test registers one handler and loads the route twice:

```ts
next.onFetch((req) => {
  if (req.url.includes('/data')) return new Response('STUBBED')
  return 'continue'
})
```

Observed:

```text
[RESULT] Q1  force-dynamic /dyn         first="STUBBED"       second="STUBBED"       upstreamHits=0
[RESULT] Q2a force-static  /static      first="STUBBED"       second="STUBBED"       upstreamHits=0
[RESULT] Q2b SSG prerender /blog/alpha  first="alpha:STUBBED" second="alpha:STUBBED" upstreamHits=0
[RESULT] Q2c ISR revalidate /isr        first="STUBBED"       second="STUBBED"       upstreamHits=0
[RESULT] Q2d on-demand slug /blog/gamma first="gamma:STUBBED" second="gamma:STUBBED" upstreamHits=0
  5 passed (17.8s)
```

`upstreamHits=0` on every route: the fake upstream was never contacted during any test. Server-side `fetch` is intercepted under `next start`, on every route kind.

Corroborating the behaviour in source — the branch that installs the interception is in the router server and is **not** gated on `dev`:

```js
// next/dist/server/lib/router-server.js:588
if (config.experimental.testProxy) {
  const { wrapRequestHandlerWorker, interceptTestApis } = require('next/dist/experimental/testmode/server')
  requestHandler = wrapRequestHandlerWorker(requestHandler)
  interceptTestApis()
}
```

## 2. ISR cache hit — yes, and here is the catch

### 2.1 The naive reading is wrong

The premise in #3098 was: *an ISR page served from cache performs no server fetch, so there is nothing to intercept.* Sound in general — but it does not apply, because **turning the test proxy on turns the cache off**.

### 2.2 The control that proves it

Same build, same routes, same `curl`. Only `experimental.testProxy` differs.

`testProxy: true`:

```text
pass1 /static        cache=MISS     body=UPSTREAM-REAL-21
pass1 /blog/alpha    cache=MISS     body=UPSTREAM-REAL-23
pass1 /isr           cache=MISS     body=UPSTREAM-REAL-25
pass2 /static        cache=MISS     body=UPSTREAM-REAL-29
pass2 /blog/alpha    cache=MISS     body=UPSTREAM-REAL-31
pass2 /isr           cache=MISS     body=UPSTREAM-REAL-33
```

Every request a `MISS`, every request re-rendered (a fresh `render` line in the pid log), every request a new upstream hit — even `force-static` with `cache: 'force-cache'`.

`testProxy: false`, nothing else changed:

```text
pass1 /static        cache=HIT      body=UPSTREAM-REAL-37
pass1 /blog/alpha    cache=HIT      body=UPSTREAM-REAL-37
pass1 /isr           cache=STALE    body=UPSTREAM-REAL-38
pass2 /static        cache=HIT      body=UPSTREAM-REAL-37
pass2 /blog/alpha    cache=HIT      body=UPSTREAM-REAL-37
pass2 /isr           cache=HIT      body=UPSTREAM-REAL-39
```

`HIT`, the build-time body (`-37`) served unchanged, and exactly **one** render line across all six requests — the `/isr` background regeneration. That is the real cache working.

The mechanism, by name in the source:

```js
// next/dist/server/next-server.js:487
process.env.NEXT_PRIVATE_TEST_PROXY = 'true'

// next/dist/server/lib/incremental-cache/index.js
122:  this.disableForTestmode = process.env.NEXT_PRIVATE_TEST_PROXY === 'true'
355:  if (this.disableForTestmode || …) // get() → always a miss
515:  if (this.disableForTestmode || …) return // set() → never writes
```

Both reads and writes are disabled, for the fetch cache **and** the full-route cache.

### 2.3 What this means for #3087

Good news and a cost, and #3087 should take both:

- **Good:** there is no "cold path only" caveat. Every request re-renders, so every server fetch is interceptable, always. Determinism does not depend on cache state.
- **Cost:** an E2E run under `testProxy` **does not exercise ISR at all**. Anything the suite is meant to catch in the caching layer — a stale page, a bad `revalidate`, a route that silently went dynamic — is invisible to a testmode run. Today's suite does not test that, so nothing regresses; it is a ceiling to state in the contract, not a defect.
- A second cost: every page render is a cold render, so E2E wall-clock under testmode is the uncached number.

## 3. `instrumentation.ts` in build workers — no

`register()` does not run during `next build`. Not in the driver, not in the prerender workers.

Measured over three clean builds (`rm -rf .next` each time). `logs/instrumentation.log` was **absent** every time, while the same file in the same app logged immediately on `next start`:

```text
=== instrumentation after BUILD ===
(ABSENT)
=== instrumentation after START ===
register pid=85663 ppid=85659 phase=unset runtime=nodejs
```

The `next start` line is the control: it proves the file is wired up correctly and discovered by Next, so the build result is a true negative rather than a broken probe.

Two false leads ruled out along the way:

1. The first attempt used `new URL('./logs/x.log', import.meta.url)`, which webpack tried to resolve as a module and failed the build. Fixed with an absolute path string.
2. The second attempt imported `node:fs` at module top level, which errored in the **edge** instrumentation bundle. Fixed by guarding on `process.env.NEXT_RUNTIME === 'nodejs'` and importing dynamically. Only after both fixes — a clean, error-free build — is "absent" meaningful.

Prerendering really does happen in separate processes — `generateStaticParams` and the page renders landed in two different pids (§4 measures the driver/worker parentage directly):

```text
gsp    pid=84575 phase=phase-production-build
render pid=84579 route=/blog/alpha phase=phase-production-build
render pid=84579 route=/blog/beta  phase=phase-production-build
render pid=84579 route=/isr        phase=phase-production-build
render pid=84579 route=/static     phase=phase-production-build
```

`.next/server/instrumentation.js` **is** emitted by the build, and `loadInstrumentationModule()` exists only in `next-server.js`. The build compiles the file for the server to load later; the build never calls it.

Also note: `testProxy` does nothing during `next build`. `NEXT_PRIVATE_TEST_PROXY` is set in `next-server.js`, which the build does not run — so build-time fetches stay live even with `testProxy: true`. Confirmed: the build contacted the fake upstream 3 times on every run.

## 4. The seam that does work in the build

Since `register` is unavailable, the obvious alternative was measured rather than assumed: a plain Node `--require` preload that patches `globalThis.fetch`.

```bash
NODE_OPTIONS="--require $PWD/seam.cjs" node node_modules/next/dist/bin/next build
```

```js
// seam.cjs
const real = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input && input.url) || String(input)
  if (url.includes('/data')) return new Response('SEAM-STUB')
  return real(input, init)   // everything else passes through
}
```

Observed — the preload loads in the driver **and** in all seven prerender workers, and it catches both the `generateStaticParams` fetch and the page fetches:

```text
seam loaded pid=90296 ppid=90280      <- build driver
seam loaded pid=90657 ppid=90296      <- prerender workers
seam loaded pid=90658 ppid=90296
seam loaded pid=90659 ppid=90296
seam loaded pid=90660 ppid=90296
seam loaded pid=90662 ppid=90296
seam loaded pid=90663 ppid=90296
seam loaded pid=90664 ppid=90296
intercepted pid=90660 url=http://127.0.0.1:4599/slugs     <- generateStaticParams
intercepted pid=90664 url=http://127.0.0.1:4599/data      <- page render
intercepted pid=90664 url=http://127.0.0.1:4599/data
```

```text
--- upstream hits during seam build ---
(NONE — upstream never contacted)
--- what got prerendered ---
SEAM-STUB
```

The upstream log is empty and the prerendered HTML contains the stub. **Ledger row 12 (`next build` reading live Sanity, the cause of `main is red` #2883 and #3017) has a working mechanism** — it just is not `instrumentation.ts`.

Two caveats for whoever implements it:

- Next's own telemetry `fetch` passes through the same seam. A seam must forward anything it does not target (`return real(input, init)`), as above.
- `NODE_OPTIONS` reaches the workers because they are forked and inherit the environment. That is the whole reason it works where `instrumentation.ts` does not, and it is worth an assertion in whatever ships, so a future Next release changing worker spawning fails loudly.

## 5. Two incidental findings, both costing an hour here

Both concern `defineConfig` from `next/experimental/testmode/playwright` and will bite whoever wires this up.

1. **It is not ESM-importable from a `.mjs` config.** `import … from 'next/experimental/testmode/playwright'` under strict ESM throws `ERR_UNSUPPORTED_DIR_IMPORT`. A `.ts` config (what this repo already uses at `apps/web/test/e2e/playwright.config.ts`) works, because Playwright's loader resolves it with CJS semantics.
2. **It silently overrides `testMatch` and `projects`.** It merges `defaultPlaywrightConfig` over the caller's object: `testMatch: '{app,pages}/**/*.spec.{t,j}s'` (so a normal `testDir: './tests'` yields `Error: No tests found`) and a three-browser `projects` array (so firefox and webkit run whether asked for or not). Both must be restated explicitly after the call.

## Reproducing

The spike app is throwaway and is not committed. It is ~120 lines: a `next.config.mjs` with `experimental.testProxy`, five page files, an `instrumentation.js`, a `seam.cjs`, a fake upstream HTTP server, and one Playwright spec. Rebuilding it from this document takes about twenty minutes; the numbers above are what matter.

No test, config or app code in this repo was changed.
