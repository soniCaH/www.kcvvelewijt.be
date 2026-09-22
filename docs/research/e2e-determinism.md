# Which test layer, which tool, and how to make it deterministic — E2E for a Next.js ISR app reading a CMS and a BFF over the network

> Resolves [#3081](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3081), a `wayfinder:research`
> ticket on the [Test suite walk map (#3078)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078).
> **Nothing here is implemented and nothing here is decided.** No test, config or app file was
> changed. This is the evidence
> [#3087 — Grilling: E2E data, live production data or deterministic fixtures?](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3087)
> has to decide against.
>
> Repo facts measured 2026-09-22 against `main` at `ec15a8a8`; the commands are in
> [§13](#13-commands-that-produced-the-repo-numbers). Flake counts are quoted from the
> [flake ledger (#3080)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3080), not re-derived.
> Every external claim carries the primary source it came from.

## The question

As filed on #3081:

> What do current best practices say about making Playwright E2E deterministic for an app like this
> one — Next.js App Router with ISR, reading a CMS (Sanity) and a BFF (Cloudflare Worker) over the
> network?

**That question presupposes its own answer**, in two places: that a browser E2E layer is the right
shape, and that Playwright is the right tool for it. The brief was widened to test both before
answering the rest. So this document runs in that order — *which layer* (§2), *which tool* (§3),
*what a move would cost* (§4), and only then *how to make the chosen thing deterministic* (§5–§9).

Both presuppositions survive, and §2–§4 are the evidence for that rather than an assertion of it.

## The answer in four sentences

**The layer stays**: Next.js's own docs say async Server Components must be covered by E2E, 27 routes
here are exactly that, and at 56 tests the layer is already 0.3 % of this suite — the right size, with
the wrong assertions in it. **The tool stays**: Playwright is the only runner with a first-party
Next.js fixture for server-side fetches, its flake gating and sharding are free where Cypress charges
for them, it already drives this repo's 3 044 visual-regression baselines, and **no ledger row is
caused by a Playwright defect**. **The crux is real**: `page.route`, `routeFromHAR` and every
HAR-replay technique reach exactly none of this app's page data, because an ISR/RSC page fetches from
Node — what reaches it is configuration, in-process interception, or Next.js's own test proxy.
**But the payoff is smaller than #3087's framing implies**: the suite's worst flake is a hydration
race, not a data race, and no data strategy in this document fixes it.

## 1. What this app actually does — the constraint, measured

Before the options mean anything, the shape of the fetch has to be exact.

| Fact | Value | Measured by |
| --- | --- | --- |
| Next.js | 16.3.5 | `apps/web/package.json` |
| Playwright | 1.60.0, `chromium` only, `fullyParallel`, `workers: 2`, `retries: 1` on CI | `apps/web/test/e2e/playwright.config.ts` |
| Routes declaring `export const revalidate` | **27** | `grep -rn "export const revalidate" apps/web/src/app` |
| Routes declaring `force-dynamic` | **15** | `grep -rn "force-dynamic" apps/web/src/app` |
| Sanity client transport | `@sanity/client` 8.6.2 — its Node build calls `globalThis.fetch` (5 call sites), no `node:http` | `grep -o … dist/index.node.js` |
| Sanity read endpoint | `useCdn: true` → `apicdn.sanity.io`, `perspective: "published"` | `apps/web/src/lib/sanity/client.ts` |
| BFF transport | Effect `HttpApiClient` over `FetchHttpClient.layer` → `globalThis.fetch` | `apps/web/src/lib/effect/services/BffService.ts:84` |
| BFF address | `process.env.KCVV_API_URL` — **server-only**, read at runtime | `BffService.ts:84`, 4 route handlers under `app/api/` |
| Sanity address | `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` — **`NEXT_PUBLIC_`, so build-inlined** | `apps/web/src/lib/sanity/client.ts` |
| `instrumentation.ts` | **does not exist** | `find apps/web -name "instrumentation*"` |
| MSW | **not installed** anywhere in the workspace | `grep "\"msw\"" */*/package.json` |

Three consequences fall straight out of that table, and they set the whole option space.

### 1.1 Every upstream byte the page renders is fetched by Node, through one function

`@sanity/client`'s Node build and Effect's `FetchHttpClient` both route through `globalThis.fetch`.
There is no `node:http` path and no second transport. So **one** interception point inside the
`next start` process would cover 100 % of the server-side upstream traffic — and, equally, **zero**
of it is visible to Playwright, which only sees what the page requests.

### 1.2 The two upstreams are *not* symmetric, and this is the load-bearing asymmetry

`KCVV_API_URL` has no `NEXT_PUBLIC_` prefix, so it is an ordinary server-side runtime read: change it
and restart `next start`, and the BFF moves. `NEXT_PUBLIC_SANITY_DATASET` does have the prefix, and
the Next.js docs are explicit that the prefix means textual substitution at build time — *including
in server code*:

> "In order to make the value of an environment variable accessible in the browser, Next.js can
> 'inline' a value, at build time, into the js bundle that is delivered to the client, replacing all
> references to `process.env.[variable]` with a hard-coded value. … This will tell Next.js to replace
> all references to `process.env.NEXT_PUBLIC_ANALYTICS_ID` **in the Node.js environment** with the
> value from the environment in which you run `next build`"
>
> "**After being built, your app will no longer respond to changes to these environment variables.**
> … all `NEXT_PUBLIC_` variables will be frozen with the value evaluated at build time"
>
> — [Next.js, *How to use environment variables*](https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser)

**So: swapping the BFF is an env var. Swapping the Sanity dataset is a rebuild.** That is not a
blocker here — `e2e.yml` already runs `npx turbo build --filter=@kcvv/web` as its own step, with the
dataset passed in as a workflow variable — but it is the difference between a five-minute change and
a five-minute change *plus a cache-busting rebuild on every dataset change*. (The same doc names the
escape hatch, should a runtime swap ever be wanted: "dynamic lookups will *not* be inlined", e.g.
`process.env[varName]`.)

### 1.3 The suite does not have fixed subjects — it rediscovers them from live data every run

This is not in the ledger and it is the sharpest determinism problem in the suite.
`apps/web/test/e2e/helpers/fixtures.ts` discovers what to test by fetching the running site's
`/sitemap.xml` and taking `firstSlugUnder()` for each dynamic family:

```typescript
eventSlug: firstSlugUnder(entries, PATH_PREFIXES.event),
playerSlug: firstSlugUnder(entries, PATH_PREFIXES.player),
teamSlug: firstSlugUnder(entries, PATH_PREFIXES.team),
matchId: firstSlugUnder(entries, PATH_PREFIXES.match),
```

And `apps/web/src/app/sitemap.ts` orders those lists by content and by wall-clock:

```text
articles  *[… publishedAt <= now() …] | order(publishedAt desc)
events    *[… coalesce(dateEnd, dateStart) > $cutoff …] | order(dateStart asc)
          with cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
```

So `/nieuws/[slug]` tests **whatever article was published most recently**, and `/evenementen/[slug]`
tests **whichever event is next on the calendar**, with a 24-hour rolling cutoff. Two runs of the
same commit, an editor's publish apart, exercise different documents with different Portable Text,
different hero types and different image counts. Nothing in the repo pins them.

The same mechanism is what makes the **31 `test.skip` data guards** (ledger row 16 — `homepage` 7,
`section-nav` 6, `scroll-arrows` 6, `routes` 5, `evenementen` 3, `wedstrijden` 3, `article-detail` 1)
fire: a guard like `test.skip(!teamSlugWithNav, "no team in the sitemap renders TeamSectionNav
today (pre-season)")` is a *clock*-dependent skip, not a dataset-thinness one.

### 1.4 The dataset under test is rewritten nightly by a cron this repo owns

```toml
# apps/api/wrangler.toml
[triggers]
crons = [
  "0 2 * * *",  # 02:00 UTC — psd-sanity-sync (players, teams, matches)
  "30 2 * * *", # 02:30 UTC — sanity-index-sync (semantic search embeddings)
]
```

The E2E suite reads `production`, and `production` is mutated every night at 02:00 UTC by this
repo's own Worker. Players, teams and matches change under the tests with no commit in between.

## 2. Is a browser E2E layer the right shape here at all?

The brief that produced this document assumed Playwright. That assumption gets tested first, because
every technique in §5 onward is wasted effort if the layer should not exist.

**This question has already been researched in this repo, independently**, by
[#3085 — test layer balance](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3085)
(`docs/research/test-layer-balance.md`, branch `research/test-layer-balance`). That document is the
authority on the layer split and this one does not re-derive it. What follows is its verdict, the one
primary source that decides the *existence* question, and the repo measurement that says the layer is
already the right size.

### 2.1 The one citation that decides it: async Server Components cannot be unit-tested

Next.js states the limitation in **three** of its own testing guides and names the remedy each time:

> "Since `async` Server Components are new to the React ecosystem, some tools do not fully support
> them. In the meantime, we recommend using **End-to-End Testing** over **Unit Testing** for `async`
> components."
> — [Next.js, *Testing*](https://nextjs.org/docs/app/guides/testing)
>
> "Since `async` Server Components are new to the React ecosystem, Vitest currently does not support
> them. While you can still run **unit tests** for synchronous Server and Client Components, we
> recommend using **E2E tests** for `async` components."
> — [*Testing: Vitest*](https://nextjs.org/docs/app/guides/testing/vitest); the
> [Jest guide](https://nextjs.org/docs/app/guides/testing/jest) repeats it, and the
> [Cypress guide](https://nextjs.org/docs/app/guides/testing/cypress) adds "Cypress currently doesn't
> support Component Testing for `async` Server Components. We recommend using E2E testing."

That is dispositive for this app: 27 routes are async Server Components rendering ISR content, and
there is no lower layer that can prove a route renders, returns the right status, and hydrates.
**A browser layer is not optional here — Next.js's own docs route this work to it.**

Note the shape of the argument, because it bounds the layer: this is a per-*rendering-mode*
justification, not a per-page one. One E2E proving an ISR route renders real content after a
production build covers the mechanism for every route that uses it.

Next.js is equally specific about *how*, and the repo already complies: "We recommend running your
tests against your production code to more closely resemble how your application will behave" —
`next build` then `next start`
([*Testing: Playwright*](https://nextjs.org/docs/app/guides/testing/playwright)), which is exactly
what `playwright.config.ts`'s `webServer` block does. This also rules out `next dev` as a shortcut:
ISR does not happen in development.

### 2.2 Everything else says: keep the layer small

- **Google**: "As a good first guess, Google often suggests a **70/20/10 split**: 70 % unit tests,
  20 % integration tests, and 10 % end-to-end tests", and names the failure mode — "**Inverted
  pyramid/ice cream cone.** The team relies primarily on end-to-end tests"
  ([*Just Say No to More End-to-End Tests*](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)).
  The reason given is exactly this repo's problem: "No developer wants to spend hours debugging a
  test, only to find out it was a flaky test. Flaky tests reduce the developer's trust in the test,
  and as a result flaky tests are often ignored, **even when they find real product issues.**"
- **Spotify**: "end to end tests are flaky by nature. Write fewer of them. Instead of having 500 end
  to end tests for your organization, have **5**"
  ([Spotify Engineering](https://engineering.atspotify.com/2019/11/test-flakiness-methods-for-identifying-and-dealing-with-flaky-tests)).
- **Fowler/Vocke** give the selection rule: "Think about the high-value interactions users will have
  with your application… Maybe you'll find one or two more crucial user journeys… **Everything more
  than that will likely be more painful than helpful**"
  ([*The Practical Test Pyramid*](https://martinfowler.com/articles/practical-test-pyramid.html)).
- **Kent C. Dodds**: "Write tests. Not too many. Mostly integration", and in practice "I'll typically
  only have **one** e2e test"
  ([*Static vs Unit vs Integration vs E2E*](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests)).

**Flagged as unsourced, so nobody cites it later:** there is **no first-party Vercel or Next.js
statement on how much E2E a Next.js app should have — do not attribute a ratio to Vercel.** And no
credible at-scale source was found saying a content/CMS site needs fewer browser tests than a
complex-flow app; Fowler's user-journey rule gets you there generically without inventing one.

### 2.3 The layer is already correctly sized — measured

| Layer | Volume | CI wall |
| --- | --- | --- |
| Vitest (4 workspaces) | 460 files, **14 662 tests** | 238 s median (web, with coverage) |
| Storybook VR | 208 story files, **3 044 baselines** | 639 s job median |
| **Playwright E2E** | 7 specs, **56 tests** | **68 s suite** inside a 260 s job |

— [inventory #3079](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3079) §1, §4.2

The browser layer is **0.3 %** of this suite's checks, and its slowest step is `next build` (78 s),
not the tests (68 s). Seven specs against Spotify's "have 5" is not an ice-cream cone. **There is no
case here for shrinking the layer on cost grounds, and none for growing it.** The problem is *which*
assertions are in it, not how many.

### 2.4 What #3085 says should move down, and why it matters to this document

#3085's finding, independently corroborated by the measurements here: the two specs that flake —
`section-nav.spec.ts` and `scroll-arrows.spec.ts`, **998 of the suite's 1 621 spec lines** — are
*runtime-geometry* tests (scroll-spy `aria-current`, overflow arrows, sticky offsets) that sit at the
most expensive layer **and** need live content to produce overflow at all. Those invariants belong in
a real browser with a fixture that *guarantees* the overflow, i.e. Storybook `play`.

Two measurements make that cheaper than it sounds:

- **16 of 208 story files already define a `play` function** — the pattern is established here.
- **`@storybook/addon-vitest` 10.5.10 is installed and registered in `.storybook/main.ts`, but
  `apps/web/vitest.config.ts` defines no Storybook test project** — the Vitest-browser-mode path is
  paid for and inert. #3085 measured the same thing independently.

Storybook's own scope statement supports the move: a component test "Renders a component in the
browser for high fidelity, Simulates a user interacting with actual UI, like an end-to-end (E2E)
test, **Only tests a unit (e.g. a single component) of UI**"
([Storybook, *Testing*](https://storybook.js.org/docs/writing-tests)). *(Storybook does not state
anywhere that `play` cannot cover routing or ISR — that follows from "only tests a unit", and should
not be quoted as if it were a documented limitation.)*

**This is the convergence that matters: rows 1 and 4 — the flakes no data strategy fixes (§7) — are
exactly the tests #3085 says do not belong in this layer.** Two research tickets, approached from
opposite ends, land on the same two files.

### 2.5 The layer this stack is missing: production synthetics

One finding here is not about the E2E suite at all, and it is the sharpest argument in this section.

An ISR site's most probable real-world failure is **stale or missing content in production** — a
revalidation webhook that did not fire, a `revalidate` window that never elapsed because nothing
requested the route, a nightly sync that wrote bad data. A pre-merge E2E runs against a *freshly
built* server and is therefore **structurally blind to every one of those**. Google's SRE book names
the category: black-box monitoring is "Testing externally visible behavior as a user would see it"
and "is symptom-oriented and represents active — not predicted — problems: 'The system isn't working
correctly, right now.'"
([*Monitoring Distributed Systems*](https://sre.google/sre-book/monitoring-distributed-systems/)).
Datadog draws the same line for CI vs CD: run tests in CI "to block branches from being deployed",
and after deploy "to evaluate the state of your applications and services in production"
([*Synthetics CI/CD*](https://docs.datadoghq.com/synthetics/cicd_integrations/)). Checkly's whole
pitch is reusing one Playwright spec for both — "Create a single test and use it for both
pre-production validation and production monitoring"
([Checkly docs](https://www.checklyhq.com/docs/testing/)).

#3085 reaches the same conclusion from the other side: "Keep **one** live run: a scheduled job with
`BASE_URL=https://www.kcvvelewijt.be` that runs the same smoke, alerts, and gates nothing — that is
the 'production probe', and it is the only place live data belongs." This repo's
`playwright.config.ts` **already supports it**: `BASE_URL` bypasses the `webServer` block entirely.

That reframes the whole live-vs-fixtures question. The value the current suite gets from live data is
real — it is the only thing watching production — but it is being paid for in the **wrong place**, as
a pre-merge gate that blocks branches on somebody else's outage. Moving it to a scheduled probe keeps
the value and stops it gating.

## 3. If a browser layer is warranted, is Playwright the right one?

**Verdict: keep Playwright.** Not for inertia — on one decisive fact plus a free-versus-paid argument
that lands the same way.

### 3.1 The decisive fact: Next.js ships a Playwright-only server-fetch fixture

Next.js publishes a first-party test-mode proxy **and a Playwright fixture for it**. No other runner
on this list has a first-party equivalent. **Verified in this repo's own `node_modules`**, not just
on the registry:

```text
next@16.3.5/experimental/testmode/proxy.js
next@16.3.5/experimental/testmode/playwright.js
next@16.3.5/experimental/testmode/playwright/msw.js
dist/server/config-shared.d.ts:970   testProxy?: boolean;
  /** Enables `fetch` requests to be proxied to the experimental test proxy server */
```

The mechanism is worth understanding, because it is not what it sounds like
([source](https://github.com/vercel/next.js/blob/canary/packages/next/src/experimental/testmode/playwright/next-fixture.ts),
[README](https://github.com/vercel/next.js/blob/canary/packages/next/src/experimental/testmode/playwright/README.md),
[PR #52520](https://github.com/vercel/next.js/pull/52520), merged Aug 2023, still experimental):
Playwright does **not** intercept the Node fetch. The fixture uses `page.context().route('**')` to
stamp `Next-Test-Proxy-Port` and `Next-Test-Data` headers onto every browser request; the Next.js
server reads those headers and proxies *its own* server-side fetches back to a local proxy that the
Playwright worker runs. **The browser driver is the carrier and Next.js cooperates** — which is
exactly why it cannot be ported to another runner without Vercel writing that runner a fixture.

Documented caveat, verbatim: "`next.onFetch` only intercepts external `fetch` requests (for both
client and server). For example, if you `fetch` a relative URL (e.g. `/api/hello`) from the client
that's handled by a Next.js route handler … it won't be intercepted."

**Two things this document flags rather than asserts**, both of which matter before anyone plans on
it (see §11's falsifiers):

1. The README's example uses `webServer.command: npm run dev`. ISR only behaves correctly under
   `next build && next start`. **No primary source confirms testProxy works under `next start`.**
2. Because the test context rides on per-request headers, a route served **from the ISR cache does no
   server fetch at all**, so `onFetch` would never fire. That is inference from the fixture source,
   not a documented statement.

Adjacent and undocumented on nextjs.org, found in the same type definitions and worth a spike of its
own: `experimental.exposeTestingApiInProductionBuild` — "The testing API allows e2e tests to control
navigation timing, **enabling deterministic assertions on prefetched/cached UI before dynamic data
streams in.** WARNING: This flag is intended for profiling and testing purposes only." That is a
streaming-determinism lever aimed squarely at §8's problem, and it exists only in the shipped `.d.ts`.

### 3.2 The comparison, on the axes that matter here

| Axis | **Playwright** | Cypress | WebdriverIO | Puppeteer | Vitest browser mode |
| --- | --- | --- | --- | --- | --- |
| Reaches a server-side (RSC/ISR) fetch | **Not as a browser driver — but the only one with a first-party Next.js fixture** (§3.1) | No — "Cypress only intercepts requests made by your front-end application" ([docs](https://docs.cypress.io/api/commands/intercept)) | No — browser-only ([docs](https://webdriver.io/docs/mocksandspies/)) | No — page-level only ([docs](https://pptr.dev/guides/network-interception)) | No — not an E2E tool |
| Hydration-aware waiting | None (§8.1) | None; retry-ability has hard edges — "The `.then()` callback is **not** retried" ([docs](https://docs.cypress.io/app/core-concepts/retry-ability)) | None; manual `browser.waitUntil` | None | n/a |
| Retries + flake gating | **Free, built-in**: `--fail-on-flaky-tests`, `failOnFlakyTests` | Retries free; **flake insights are paid** — "available to organizations with a Team Cypress Cloud plan" ([docs](https://docs.cypress.io/cloud/features/flaky-test-management)) | Config retries; no first-party analytics | None | Vitest retries |
| Sharding / parallelism | **Free**: `--shard`, blob reports, `merge-reports` | **Cloud-bound**: "Running tests in parallel requires the `--record` flag be passed" ([docs](https://docs.cypress.io/cloud/features/smart-orchestration/parallelization)); free tier capped at 500 results/month ([pricing](https://www.cypress.io/pricing)) | `maxInstances` + grid | DIY | Vitest workers |
| Debug artifact | **Trace Viewer, free, offline** — "loads the trace entirely in your browser and does not transmit any data externally" ([docs](https://playwright.dev/docs/trace-viewer)) | Screenshots/video free; Test Replay is a Cloud feature (all plans, usage-capped, Chromium only) | Screenshots/logs | Manual | Vitest 4 added Playwright traces |
| Next.js first-party guidance | Dedicated App Router guide, updated 2026-08-25 | Guide exists but warns "Cypress currently doesn't support Component Testing for `async` Server Components"; component testing pins you to **webpack** while Next.js has moved to Turbopack | **No page in the Next.js docs at all** | n/a | Unit guide only |
| npm downloads, week of 2026-09-14 | `playwright` **69.7 M** + `@playwright/test` **44.8 M** | **4.7 M** | **1.9 M** | 8.3 M (a library, not a runner) | — |

Download figures from the npm registry API, pulled 2026-09-22.

**Vitest browser mode rules itself out in its own words**, despite being stable since v4 ("we are
removing the `experimental` tag from Browser Mode", [Vitest 4 blog](https://vitest.dev/blog/vitest-4)):
"The browser mode feature of Vitest does not completely replace standalone end-to-end test runners.
It is recommended that users augment their Vitest browser experience with a standalone browser-side
test runner like WebdriverIO, Cypress or Playwright"
([*Why browser mode*](https://vitest.dev/guide/browser/why.html)). It is a *component* layer — which
is precisely the layer §2.4 says this repo has already paid for and left inert. **Alongside
Playwright, not instead of it.**

### 3.3 The fair case against Playwright

Sourced from Playwright's own docs and Cypress's migration guide, deliberately not from vendor blogs:

- **It is not the browser the visitors use.** "Playwright doesn't work with the branded version of
  Safari since it relies on patches" — same for Firefox
  ([*Browsers*](https://playwright.dev/docs/browsers)). For a club site with heavy real-iOS-Safari
  traffic, patched WebKit is an approximation. *(Moot today: this suite runs `chromium` only.)*
- **CI weight.** Needs `playwright install --with-deps` or the official image, and "Caching browser
  binaries is not recommended, since the amount of time it takes to restore the cache is comparable
  to the time it takes to download the binaries" ([*CI*](https://playwright.dev/docs/ci)). This repo
  already pays this correctly via the pinned container.
- **No live time-travel in a headless CI run** — you debug from a trace afterwards. Cypress's Test
  Replay is arguably nicer here and is free on all Cloud tiers.
- **No hydration primitive** — but neither has any tool on the list (§8.2). This is not a
  differentiator; it is a property of the problem.

Cypress's own [Playwright-to-Cypress guide](https://docs.cypress.io/app/guides/migration/playwright-to-cypress)
is the fairest anti-Playwright case available, and it concedes Cypress has no built-in visual
diffing, no soft assertions, no `test.step()` equivalent, and cross-origin iframe limits.

**Migration maturity, stated honestly:** Playwright ships first-party migration guides from
Protractor, Puppeteer and Testing Library ([docs](https://playwright.dev/docs/protractor)). There is
**no first-party Cypress→Playwright guide**, and the community codemods are syntax-level and stale.
Migrating *away* from Playwright would be the least-supported direction available.

## 4. Migration cost, and what stability is worth

Stated before the verdict, so the verdict cannot quietly assume it.

### 4.1 What a move away from Playwright would actually cost

| | Measured |
| --- | --- |
| E2E source to port | **2 294 lines** — 7 specs (1 621), 3 helpers (438), config (57), reporter (178) |
| Tests to re-verify | 56 |
| Specs with non-trivial browser work | `scroll-arrows.spec.ts` (517 lines) and `section-nav.spec.ts` (481) — `scrollend` listeners, `IntersectionObserver` assertions, `requestAnimationFrame` probes, viewport switching. These are the hard 43 % |

That is a small suite by line count and a nasty one by content: the two large specs are precisely the
ones doing frame-accurate DOM work, and they are also the two that flake. Porting them would mean
re-deriving the scroll-settle logic in another tool's idioms **and** re-earning confidence in it — on
the two files with the least confidence today.

### 4.2 Playwright is load-bearing for a second layer, which no migration removes

`@storybook/test-runner` 0.24.4 declares `playwright: ^1.14.0` and `playwright-core` as
dependencies — it *is* a Playwright harness. It drives the visual-regression layer: **208 story
files, 183 VR-tagged, 3 044 baselines**
([inventory #3079](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3079) §1). And `e2e.yml` runs
in `mcr.microsoft.com/playwright:v1.60.0-noble`, pinned with a comment to match `@playwright/test`
1.60.0 and the local VR Docker image.

**So removing Playwright from the E2E layer does not remove Playwright from this repo.** It replaces
one browser engine with two, doubles the version surface that the e2e.yml comment already warns about
("drift between the version that runs the suite and the `@playwright/test` API can produce silent
skips or false-positive failures"), and leaves the 3 044-baseline layer exactly where it was. A
migration that adds a tool is not a simplification.

### 4.3 The flakes are ours, not the tool's

Every live E2E row in the ledger has a cause that names this app or this suite, not Playwright:

| Row | Cause | Whose |
| --- | --- | --- |
| 1, 4 | Assertion budget races hydration / `IntersectionObserver` / scroll settle | **Ours** — and §8.1 shows Playwright documents the problem and prescribes an app-side fix |
| 2, 3 | `force-dynamic` route with a 19-call fan-out against a live upstream | **Ours** |
| 12 | `next build` reads live Sanity | **Ours** |
| 16 | 31 data guards against a rolling dataset | **Ours** |
| 15 | A flaky test exits 0 | **Playwright's default** — and Playwright ships the fix (`failOnFlakyTests`, §9.1), unset here |

Row 15 is the only one where the tool's behaviour is implicated at all, and the tool already ships
the remedy. **No ledger row is caused by a Playwright defect.** Swapping tools would carry all of
rows 1–4, 12 and 16 across unchanged, plus the porting risk of §4.1.

Two further stability facts worth stating plainly. The suite is **cheap**: 68 s of Playwright inside
a 260 s job, against the VR layer's 639 s median — E2E is not a cost problem here. And it is
**green when the data is good**: the inventory measured *56 passed, 0 skipped, 0 flaky, 0 failed in
31 s* locally against the staging Worker with 4 workers and `retries: 0`. A tool that produces a
clean sweep under a load average of 20 is not the source of the instability.

## 5. The crux: what reaches a server-side fetch, and what does not

### 5.1 Playwright's mocking is scoped to the page — the API docs say so in their first sentence

Every routing API defines its own scope, and the scope is always a browser object:

> "Routing provides the capability to modify network requests that are made by **a page**."
> — [`page.route()`](https://playwright.dev/docs/api/class-page#page-route)
>
> "Routing provides the capability to modify network requests that are made by **any page in the
> browser context**."
> — [`browserContext.route()`](https://playwright.dev/docs/api/class-browsercontext#browser-context-route)
>
> "**Any requests that a page does**, including XHRs and fetch requests, can be tracked, modified and
> mocked."
> — [*Mock APIs*](https://playwright.dev/docs/mock)

`page.routeFromHAR` / `browserContext.routeFromHAR` hang off the same two objects and replay recorded
*browser* traffic. `routeWebSocket` likewise. The corroborating tell that this is a browser-layer
hook, not a network-layer one, is that an in-page Service Worker defeats it — "page.route() will not
intercept requests intercepted by Service Worker… disable Service Workers … by setting
`serviceWorkers` to `'block'`" ([same page](https://playwright.dev/docs/api/class-page#page-route)).
A Node-level interceptor would not care.

**No Playwright doc warns that these cannot reach a server process.** That silence is exactly how
teams get this wrong: nothing tells you that your SSR data is invisible to the API you just reached
for. For an app where 27 routes render their content on the server, `page.route('**/*.sanity.io/**')`
matches **zero** requests — the browser never asks Sanity, the Node process did, possibly at
`next build` time. What it does intercept here is the Typekit script, the analytics beacon and the
client-side semantic-search call. Not one byte of page content.

The same boundary applies to the proxy options: `proxy` lets you "configure **pages** to load over
the HTTP(S) proxy" ([*Network*](https://playwright.dev/docs/network#http-proxy)) — the launched
browser process, with no relationship to the Node process `webServer` spawned.

`APIRequestContext` is sometimes offered as the answer. It is not an interceptor — it "is used for
the Web API testing… to trigger API endpoints, configure micro-services, prepare environment"
([docs](https://playwright.dev/docs/api/class-apirequestcontext)). It *originates* requests. It is a
seeding and teardown tool, and this repo already uses it that way in `helpers/fixtures.ts`.

### 5.2 What does reach it

Four mechanisms, roughly in ascending order of cost:

1. **Point the server process somewhere else.** Pure configuration: `KCVV_API_URL` at runtime, the
   Sanity project/dataset at build time. No new dependency, no interception, nothing to keep in sync
   with an API shape. This is the only mechanism that needs no code at all.
   Playwright supplies these through `webServer.env` — "Environment variables for the command.
   Defaults to inheriting `process.env`" ([*Web server*](https://playwright.dev/docs/test-webserver)).
2. **Intercept `globalThis.fetch` inside the server process**, installed before any route renders.
   Next.js documents exactly one supported seam for this:

   > "The file exports a `register` function that is called **once** when a new Next.js server
   > instance is initiated, and **must complete before the server is ready to handle requests**.
   > `register` can be an async function."
   >
   > — [Next.js, *instrumentation.js*](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)
   > (stable since v15.0.0; `process.env.NEXT_RUNTIME` guards the Node vs Edge branch —
   > [*Instrumentation* guide](https://nextjs.org/docs/app/guides/instrumentation))

   This is where an MSW `setupServer` or an undici `MockAgent` goes, and it reaches both upstreams
   because both go through `globalThis.fetch` (§1.1). MSW is explicit about the layer:

   > "a function that configures the interception of requests **in a Node.js process**… it does not
   > establish any servers, operating entirely in the thread of your process"
   > — [MSW, *setupServer*](https://mswjs.io/docs/api/setup-server/)
   >
   > "when you initiate MSW server-side, you will be intercepting requests **your server makes**"
   > — [MSW maintainer, discussion #2137](https://github.com/mswjs/msw/discussions/2137)

   `FetchInterceptor` covers global `fetch` (undici-powered in Node) — see
   [mswjs/interceptors](https://github.com/mswjs/interceptors). The lower-level alternative with no
   new dependency is undici's own `MockAgent` + `setGlobalDispatcher`, plus `disableNetConnect()` to
   make any unmocked call throw ([undici *MockAgent* docs](https://github.com/nodejs/undici/blob/main/docs/docs/api/MockAgent.md));
   the caveat there is that it only covers the *global* dispatcher, so a client with its own `Pool`
   escapes it. That caveat does not bite this repo — §1.1 measured both clients on `globalThis.fetch`.

   **The hard part is cross-process control.** Playwright's test process is not the `next start`
   process, so per-test handler swapping needs MSW's `setupRemoteServer` — "an API that allows one
   process to modify the traffic of another process"
   ([PR #1617](https://github.com/mswjs/msw/pull/1617),
   [`remote.boundary()`](https://mswjs.io/docs/api/setup-server/boundary/)). The reference
   implementation for exactly this stack is the MSW author's
   [nextjs-rsc-testing](https://github.com/kettanaito/nextjs-rsc-testing), whose own README says it
   is **"a work-in-progress relying on beta features"** and "do not use it in production just yet."
   That is the honest maturity read on Option D as of today.
3. **Run the real upstream locally.** `wrangler dev` serves the BFF on `:8787` — already the
   documented local-dev value in `apps/web/.env.local.example` — running the production runtime via
   Miniflare/`workerd` ([Cloudflare, *Local development*](https://developers.cloudflare.com/workers/development-testing/)).
   Sanity has **no** local Content Lake; datasets are the documented isolation unit
   ([*Datasets*](https://www.sanity.io/docs/content-lake/datasets)), so the nearest equivalent is a
   *different dataset*, not a local server.

4. **Let Next.js proxy its own outbound fetches to the test process.** The first-party mechanism
   described in §3.1: `experimental.testProxy` plus `next/experimental/testmode/playwright`, with an
   MSW binding at `next/experimental/testmode/playwright/msw`. Unlike 1–3 this is *not* a general
   technique — it is a Next.js feature that happens to be wired to Playwright, and it is the only
   option in this document that Vercel itself maintains. Experimental, and with the two open
   questions in §3.1.

> **Node-level HTTP proxy, for completeness.** A fifth mechanism exists and is commonly
> mis-described. `HTTP_PROXY` alone does nothing: Node's env-proxy support is **opt-in** via
> `NODE_USE_ENV_PROXY=1`, and works "with `node:http` and `node:https` (v22.21.0 or v24.5.0+) methods
> as well as `fetch()` (v22.21.0 or v24.0.0+)"
> ([nodejs.org, *Enterprise network configuration*](https://nodejs.org/learn/http/enterprise-network-configuration)).
> Not recommended here — it is a blunter instrument than a base-URL swap for the same result.

### 5.3 The build is a third fetch site, and it is the one that takes `main` red

`e2e.yml` runs `next build` before the suite, with live Sanity credentials:

```yaml
- name: Build Next.js
  run: npx turbo build --filter=@kcvv/web
  env:
    KCVV_API_URL: ${{ vars.KCVV_API_URL }}
    NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ vars.NEXT_PUBLIC_SANITY_PROJECT_ID }}
    NEXT_PUBLIC_SANITY_DATASET: ${{ vars.NEXT_PUBLIC_SANITY_DATASET }}
    SANITY_API_READ_TOKEN: ${{ secrets.SANITY_API_READ_TOKEN }}
```

27 routes prerender by fetching Sanity at build time, and `apps/web/src/app/__tests__/isr-route-config.test.ts`
enforces that every dynamic segment declaring `revalidate` also declares `generateStaticParams` — so
the enumeration queries run too. Ledger row 12 (`fetch failed` / `HTTP 503`, three occurrences,
**two of the three `main is red` incidents ever filed**) lives here.

**A dataset swap does not fix row 12.** A frozen `e2e` dataset is still read over the network from
`apicdn.sanity.io`; a 503 there fails the build whichever dataset is named. Only mechanism 2 —
interception inside the process — takes the network out of the build. Whether `instrumentation.ts`'s
`register` runs during `next build`'s prerender workers, as opposed to only on `next start`, is
**not stated in the Next.js docs** and would have to be measured before anyone plans on it. Flagged,
not assumed.

## 6. The options, with the ISR/RSC constraint applied

| Option | Reaches the **server-side** fetch? | Reaches the **build-time** fetch? | Subjects become fixed? | Cost to run | Cost to maintain |
| --- | --- | --- | --- | --- | --- |
| **A. Live production data** (today) | n/a — it *is* the live fetch | n/a | **No** — §1.3 | Zero new. Pays full upstream latency per run | Zero, but the suite inherits every upstream incident and every nightly cron write |
| **B. Playwright `page.route` / `route.fulfill`** | **No** | No | No | Low | Fixtures drift against the API with nothing to catch it |
| **C. HAR record/replay (`routeFromHAR`)** | **No** | No | No | Low | Re-capture is explicitly named a non-fix by the map's Notes |
| **D. MSW / undici `MockAgent` in `instrumentation.ts`** | **Yes** — both upstreams are `globalThis.fetch` | **Unverified** (§5.3) | Yes | Medium: one new dep, one fixture corpus | High: fixtures must track the Sanity schema *and* the `@kcvv/api-contract` shape |
| **E. Stub BFF + frozen Sanity dataset** (config only) | **Yes** — by configuration, no interception | **No** (still a network read) | Yes | Low: env var + a dataset copy | Low–medium: the dataset needs a refresh cadence and an owner |
| **F. Point everything at the existing `staging` estate** | **Yes** | No | **No** — staging is editable | Near-zero: both already exist and respond | Near-zero, but buys no determinism |
| **H. `next/experimental/testmode` + its Playwright fixture** | **Yes** — first-party, browser-carried (§3.1) | No | Yes | Medium | Medium, but **experimental**, and unverified under `next start` / on an ISR cache hit |
| **G. Hybrid: E (default) + D only for the build** | Yes | Yes | Yes | Medium | Highest |

**B and C are struck through for this app.** Not because they are bad techniques — they are the right
techniques for a client-rendered app — but because this app renders its content on the server. They
would mock the Typekit script and the client-side semantic-search call, and leave every assertion in
`routes.spec.ts` reading live Sanity exactly as it does today. Any plan that reaches for them has
mis-scoped the problem.

**H is the one option that did not exist when this ticket was written**, and it is the only
*first-party* answer to the crux. It is also the least proven: experimental since 2023, with an
example that runs `next dev` (where ISR does not happen) and a mechanism that, by construction, has
nothing to intercept when a route is served from the ISR cache. It belongs in a spike, not in a plan
— §11 names it as a falsifier rather than a step.

### 6.1 Option F is already half-adopted — and that is itself the evidence

**Correction to a widely-repeated framing, including this map's own.** The suite does not run against
production. It runs against *whichever environment the ref selects*: per the
[inventory (#3079)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3079) §4.1, `e2e.yml` picks
the GitHub environment by ref — **PRs get `Preview`** (`KCVV_API_URL` = the staging Worker, dataset
`staging`), **pushes to `main` get `Production`**. So "E2E runs against live production" is true only
for `main` pushes.

That accident has produced a natural experiment, and it points the same way as everything else here:

| | PR runs (`staging`) | `main` pushes (`production`) |
| --- | --- | --- |
| Tests skipped by a data guard | **0–1** | **4–5** |

The dataset that nothing syncs nightly satisfies **more** of the 31 guards than the one that does.
The census below says why: staging carries more articles and more galleries than production.

The staging estate already exists and already works, measured today:

| | `production` | `staging` |
| --- | --- | --- |
| Published documents | 1 763 | **1 397** |
| `article` | 125 | **160** |
| `player` | 352 | 253 |
| `staffMember` | 153 | 210 |
| `team` | 27 | 23 |
| `event` | 84 | 85 |
| `photoGallery` | 2 | **4** |
| BFF health (`/matches/next`) | `200`, 0.59 s | `200`, 0.52 s |
| Sync cron | `0 2 * * *`, `30 2 * * *` | **`crons = []`** — none |

Two things jump out. First, **staging is not thin** — it carries more articles and more photo
galleries than production, which is the measured explanation for the 0–1 vs 4–5 skip gap above.
Second, `[env.staging.triggers] crons = []` means **nothing rewrites staging on a schedule**.

But "more stable" is not "deterministic": staging is a live editing target with a Studio pointed at
it (`apps/studio-staging/`), so any human change moves the tests' subjects. And the remaining gap is
the one that matters — `main` pushes, the runs whose redness pages somebody, are the ones still on
production. Extending `Preview`'s dataset to `main` is a **workflow-variable change**, and it is the
single cheapest item in this entire document.

### 6.2 Option E is the shortest thing that actually changes the determinism

`sanity dataset copy <source> <target>` is a first-class CLI command
([Sanity, *Datasets CLI command reference*](https://www.sanity.io/docs/cli-reference/cli-datasets)),
with `--skip-history` to make it fast. A one-off `sanity dataset copy staging e2e`, pointed at by
`NEXT_PUBLIC_SANITY_DATASET=e2e` in `e2e.yml`, gives the suite a dataset that **nothing writes to**:
no cron, no Studio, no editor. `firstSlugUnder` then returns the same article, the same team and the
same match on every run, and the 31 guards become a fixed, knowable set rather than a daily lottery.

The BFF half is even cheaper, because `KCVV_API_URL` is a runtime read: a `kcvv-api-e2e` Worker
environment against the same frozen dataset, or a recorded stub, is a one-variable change with no
rebuild.

What Option E does **not** buy: the event cutoff is `Date.now() - 24h`, so a frozen dataset still
ages out of its own event window unless the fixture events are far-future or the clock is pinned.
That is a real residual, and it is the kind of thing #3087 should decide explicitly rather than
discover in three months.

## 7. What each option does, and does not, fix for the measured flakes

Mapped against the ledger's live E2E and build rows. This is the section #3087 actually needs.

| Ledger row | What it is | Live/prod data (A) | Frozen dataset + stub BFF (E) | Node interception (D) |
| --- | --- | --- | --- | --- |
| **1 — `OrganigramSectionNav on /hulp`**, `aria-current` stays `null`; failed both tries 5× in 3 weeks; **6 of the 7 hidden retries** | Hydration + `IntersectionObserver` racing a 5 s assertion budget | — | **No effect** | **No effect** |
| **4 — `scroll-arrows.spec.ts:315`** | Measurement races layout | — | **No effect** | **No effect** |
| **2 — `/kalender` blows a 30 s `page.goto`** | `force-dynamic`, 19-call BFF fan-out, cold | — | **Fixes the cause**: a local/stub BFF answers in ~ms, so the fan-out stops being a 30 s risk | Same |
| **3 — `/wedstrijd/[matchId]`** | Same class | — | **Fixes** | Same |
| **16 — 31 `test.skip` data guards** | Thin/rolling data silently drops coverage | — | **Fixes, conditionally** — only if the fixture dataset is curated to satisfy every guard, and a guard that still fires is then a *red*, not a skip | Same |
| **§1.3 — subjects rediscovered from `/sitemap.xml`** (unfiled) | Test identity changes between runs | — | **Fixes** | Same |
| **12 — `next build` dies on a Sanity `fetch failed` / 503** (2 of 3 `main is red`) | Build-time live network | — | **No effect** — still a network read | **Fixes, if `register` runs in build workers — unverified (§5.3)** |
| **15 — a flaky test exits 0** | Reporting | — | — | — (see §9) |

**Read the first two rows again.** The worst test in the suite — the one responsible for 6 of the 12
sampled green runs hiding a retry, and for five hand-triggered workflow re-runs in three weeks — is
untouched by every data option on the table. Row 4 is the same. Together they are **the majority of
the measured noise**, and they are a hydration problem (§8), not a data problem.

Meanwhile the option that fixes the most *severe* failure — row 12, which takes `main` red outright —
is the expensive one (D), and its viability rests on a documented behaviour nobody has measured.

## 8. Waiting on hydration and client state, without sleeps or raised timeouts

This is the section that speaks to rows 1 and 4 — the ones no data option touches.

### 8.1 Playwright documents this exact failure, and it is not on the page you would look at

Auto-waiting runs a fixed set of actionability checks before each action
([*Auto-waiting*](https://playwright.dev/docs/actionability)): `click` waits for **visible, stable,
receives-events, enabled**; `hover` drops *enabled*; `fill` waits for **visible, enabled, editable**;
and `press` / `pressSequentially` / `focus` / `dispatchEvent` perform **no checks at all**. None of
those five checks is "the React handler is attached".

The gap is documented — on the *navigations* page, under a heading called **Hydration**:

> "As a very fast user, Playwright will start interacting with the page the moment it sees it. **And
> if the button on a page is enabled, but the listeners have not yet been added, Playwright will do
> its job, but the click won't have any effect.**"
>
> "**The right fix for this issue is to make sure that all the interactive controls are disabled
> until after the hydration, when the page is fully functional.**"
>
> "There is no way to tell that the page is `loaded`, it depends on the page, framework, etc."
>
> — [Playwright, *Navigations § Hydration*](https://playwright.dev/docs/navigations)

That is the whole official answer, and it is an **app-side** answer: make readiness observable in the
DOM, then assert on it. A feature request for a built-in "wait for event listeners to be attached"
([microsoft/playwright#2902](https://github.com/microsoft/playwright/issues/2902)) was closed without
shipping.

### 8.2 There is no hydration signal to wait for — confirmed on both sides

- **React exposes none.** [`hydrateRoot`](https://react.dev/reference/react-dom/client/hydrateRoot)
  documents `onRecoverableError` — a *failure* channel, useful as a test tripwire — and no completion
  event, attribute or promise. [Selective hydration](https://react.dev/reference/react/Suspense)
  means there is no single global "done" moment to expose.
- **Next.js exposes none.** Its own
  [Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright) does not mention
  hydration at all; its sample test clicks immediately after `goto`, i.e. the exact pattern above.
  The [streaming guide](https://nextjs.org/docs/app/guides/streaming) *describes* the
  `<template id="B:0">` fallback markers and the `<div hidden id="S:0">` swap, but as a debugging
  observation, not a stability contract — and says the swap happens "**without waiting for the page's
  JavaScript bundle to load or hydration to complete**". Content being visible proves nothing about
  interactivity. `next-route-announcer` is
  [documented as a screen-reader route announcer](https://nextjs.org/docs/architecture/accessibility),
  not a readiness signal; using it as one is folklore. So is `document.readyState`, which reaches
  `"complete"` at `load`, strictly before hydration.

### 8.3 What the docs *do* sanction

- **Web-first assertions**, which retry: `expect(locator).toBeVisible()`, `toBeEnabled()`,
  `toHaveAttribute()` — "It will re-fetch the element and check it over and over, until the condition
  is met or until the timeout is reached", default **5 s**
  ([*Assertions*](https://playwright.dev/docs/test-assertions)). For anything non-locator, `expect.poll`
  and `expect.toPass` (note: "by default `toPass` has timeout 0 and does not respect custom expect
  timeout").
- **`locator.waitForFunction()`** (v1.62) — "a generic way to wait for an element to reach a custom
  condition without asserting it. The locator is re-resolved on each retry"
  ([docs](https://playwright.dev/docs/api/class-locator#locator-wait-for-function)). The sanctioned
  form of what `waitForScrollSettled` in `section-nav.spec.ts` currently does by hand with
  `page.waitForFunction`.
- **What is explicitly rejected**: `page.waitForTimeout` — "**Discouraged:** Never wait for timeout in
  production. Tests that wait for time are inherently flaky"
  ([docs](https://playwright.dev/docs/api/class-page#page-wait-for-timeout)); and `networkidle` —
  "**DISCOURAGED** … Don't use this method for testing, rely on web assertions to assess readiness
  instead" ([docs](https://playwright.dev/docs/api/class-page#page-wait-for-load-state)).
  `page.waitForNavigation` is deprecated as "inherently racy".
- **Timeout defaults**, so nobody argues from memory
  ([*Timeouts*](https://playwright.dev/docs/test-timeouts)): test **30 s**, expect **5 s**, action
  none, navigation none, global none, `beforeAll`/`afterAll` **30 s**. On raising them the docs say
  only: "**If you happen to be in this section because your test are flaky, it is very likely that
  you should be looking for the solution elsewhere.**"

### 8.4 What this means for row 1

`section-nav.spec.ts › OrganigramSectionNav on /hulp` asserts `aria-current="location"` — an
attribute written by an `IntersectionObserver` that only exists after `OrganigramSectionNav`
hydrates. The assertion gets the default **5 s**. Nothing in the test or the app tells Playwright
when that observer started observing, so the test is racing an unbounded event with a fixed budget.
The ledger's measurement — failing at 7.5 s on unthrottled CI, on **both** tries — is what an
unbounded-vs-fixed race looks like.

Applying Playwright's own prescription literally: **make the readiness observable from the app side**
and gate on it. In this codebase that means the nav publishing a client-set marker once its observer
is live (the shape `#2993` already used for the cold-load sentinel, and the shape the "assert on a
client-only artifact" pattern takes everywhere), and the spec waiting on that marker before touching
`aria-current`. That is a cause fix: it removes the race rather than widening the window.

Two honest caveats. **First, nobody outside the Playwright docs endorses this in print** — there is
no Vercel, Shopify or Netflix engineering post on waiting for hydration in Playwright; every search
returns vendor content. The pattern follows from the Playwright hydration doc and nothing stronger.
**Second, a readiness marker is production code added for a test.** #3085's alternative — move the
geometry and scroll-spy assertions down to Storybook `play` functions, where the component mounts
without a network, a stream or a route — avoids that trade entirely and is probably the better lever
for rows 1 and 4. This research does not decide between them; it establishes that **raising the 5 s
budget is not on the list of things the docs endorse.**

## 9. Retry policy, flake reporting, quarantine, artifacts

### 9.1 What Playwright gives you natively

- **Retries.** `retries: N` (config), `--retries=N` (CLI), `test.describe.configure({ retries })` per
  group, `testProject.retries` per project, `testInfo.retry` at runtime. Playwright's definition of
  flaky: "**tests that failed on the first run, but passed when retried**"
  ([*Retries*](https://playwright.dev/docs/test-retries)).
- **A flaky test exits `0`.** The authoritative sentence is in the v1.45 release note: "**by default,
  the test runner exits with code `0` when all failed tests recovered upon a retry**"
  ([*Release notes*](https://playwright.dev/docs/release-notes)). The Reporter API confirms the
  mechanism — `TestCase.ok()` is "whether the test is considered running fine. Non-ok tests fail the
  test run with non-zero exit code", and a flaky test is `ok()`. There is also no `'flaky'` value in
  `FullResult.status` (`'passed' | 'failed' | 'timedout' | 'interrupted'`), which is precisely why the
  run reads as passed. **This is ledger row 15, exactly.**
- **The built-in cure for row 15**: `--fail-on-flaky-tests` — "Fail if any test is flagged as flaky"
  ([*CLI*](https://playwright.dev/docs/test-cli)) — added in v1.45, with the config equivalent
  `failOnFlakyTests: true` added in **v1.52**
  ([docs](https://playwright.dev/docs/api/class-testconfig#test-config-fail-on-flaky-tests)). This
  repo is on Playwright **1.60.0**, so both are available today.
- **Custom reporting**, if a hard fail is too blunt: `onTestEnd(test, result)` with `result.retry`
  (sequential attempt number, `0` = first run), and `testCase.outcome()` returning
  `"skipped" | "expected" | "unexpected" | "flaky"` — "Test that passes on a second retry is
  `'flaky'`" ([*Reporter API*](https://playwright.dev/docs/api/class-reporter),
  [`TestCase.outcome()`](https://playwright.dev/docs/api/class-testcase#test-case-outcome)). This is
  already what `apps/web/test/reporters/github-summary.ts` does — it reads `outcome()` and prints the
  tally. The reporter is correct; what is missing is only the decision to make the tally *gate*.
- **Artifacts.** Seven trace modes (`off`, `on`, `retain-on-failure`, `retain-on-first-failure`,
  `retain-on-failure-and-retries` (v1.59), `on-first-retry`, `on-all-retries`)
  ([*Trace modes*](https://playwright.dev/docs/test-use-options#trace-modes)). `'on'` is flagged
  "not recommended as it's performance heavy"
  ([*Trace viewer*](https://playwright.dev/docs/trace-viewer)). Traces can be opened **by remote URL**
  at [trace.playwright.dev](https://trace.playwright.dev), no download needed.
- **Sharding and blob reports.** `--shard=i/n`, `reporter: 'blob'` on CI, `npx playwright merge-reports`
  ([*Sharding*](https://playwright.dev/docs/test-sharding)). Blobs carry "all test attachments such as
  traces and screenshot diffs". `fullyParallel: true` gives test-level shard granularity.
- **Quarantine: Playwright has none.** A code search of `microsoft/playwright`'s `docs/src` for
  "quarantine" returns zero hits. The available primitives are a tag (`{ tag: '@flaky' }`) plus
  `--grep-invert`, or a separate project with its own `retries`
  ([*Annotations § Tag tests*](https://playwright.dev/docs/test-annotations#tag-tests),
  [*Projects*](https://playwright.dev/docs/test-projects)). Note what the annotations do:
  `test.fixme` does **not** run the test; `test.skip` does not run it; `test.slow` **triples the test
  timeout**; `test.fail` runs it and complains if it *passes*.

### 9.2 What this repo already has right, and what it does not

| | Current | Note |
| --- | --- | --- |
| `retries` | `1` on CI | Ledger row 15: load-bearing and invisible. Without it, 7 of the last 12 `main` runs go red |
| `trace` | `retain-on-failure` | **Already the better choice** for row 1, which fails on *both* tries — `on-first-retry` (the CI guide's default suggestion) would not capture attempt 1. Do not "fix" this backwards |
| `video` / `screenshot` | `retain-on-failure` / `only-on-failure` | Fine |
| Artifact retention | 14 days, `if: !cancelled()` | Matches Playwright's own sharded-example retention; the non-sharded CI example uses 30 |
| `workers` | `2` on CI | Playwright's CI guide says "**We recommend setting workers to `1` in CI environments to prioritize stability and reproducibility**" ([*CI*](https://playwright.dev/docs/ci)). Worth measuring against rows 1 and 4 before assuming it is free |
| `failOnFlakyTests` | **not set** | The one-line built-in that makes row 15 visible in the check, not just the summary |
| Quarantine | none | No tag, no separate project. Row 1 gates `main` today |

### 9.3 What teams at scale actually do — with numbers

Presented because the map's flake-policy ticket ([#3089](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3089))
will need a threshold, and a threshold should be anchored to something.

- **Google** — "a continual rate of about **1.5 %** of all test runs reporting a 'flaky' result";
  "almost **16 %** of our tests have some level of flakiness"; "about **84 %** of the transitions we
  observe from pass to fail involve a flaky test". Their quarantine tool "monitors the flakiness of
  tests and if the flakiness is too high, it automatically quarantines the test… removes the test from
  the critical path and files a bug", with the self-criticism that it "could easily mask a real race
  condition"
  ([Google Testing Blog, 2016](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)).
- **GitHub** — before: "**1 in 11 commits** had at least one red build caused by a flaky test, or
  about 9 percent"; after: "less than half a percent, or 1 in 200 commits — an **18x** improvement".
  For the worst offenders (the "top 0.4 percent") the system **auto-opens an issue assigned to the
  people who most recently modified the test**
  ([GitHub Engineering](https://github.blog/engineering/engineering-principles/reducing-flaky-builds-by-18x/)).
- **Shopify** — retries up to three times; Android pass rate 31 % → ~90 %, iOS 67 % → 97 %. On the
  green-check problem, verbatim: "**we detect all the tests that pass after a retry and notify the
  developers so the problem doesn't go unnoticed.** We think that a test that passes in a second
  attempt shouldn't be treated like a failure, but as a warning that something can be improved." And
  the caveat: retries "work but make CI slower and **can hide reliability issues**"
  ([Shopify Engineering](https://shopify.engineering/unreasonable-effectiveness-test-retries-android-monorepo-case-study)).
- **Dropbox (Athena)** — quarantined tests are "**temporarily ignored in our pre-submit tests but
  continue running post-submit and contributing to the overall build status**"
  ([Dropbox Tech](https://dropbox.tech/infrastructure/athena-our-automated-build-health-management-system)).
- **Uber (Testopedia)** — "if a test fails once in the last X window of runs, it is classified as
  unstable"; ~1 000 flaky tests out of 600 K; flaky tests run "in **non-blocking mode as FYI only**"
  unless marked critical; JIRA tickets auto-filed to owners
  ([Uber Engineering](https://www.uber.com/en-US/blog/flaky-tests-overhaul/)).
- **Spotify** — simply publishing a flakiness table "**reduced test flakiness at Spotify from 6 % to
  4 % in two months**", plus the E2E-specific advice "instead of having 500 end to end tests for your
  organization, have 5"
  ([Spotify Engineering](https://engineering.atspotify.com/2019/11/test-flakiness-methods-for-identifying-and-dealing-with-flaky-tests)).
- **Datadog**, as a worked state machine to copy rather than invent: Active → **Quarantined**
  ("keep the test running in the background, but failures don't affect CI status") → **Disabled**
  ("skip entirely") → **Fixed**, with automation on a 7-day failure-rate threshold and "**if a flaky
  test no longer flakes for 30 days, it is automatically moved to the Fixed state**"
  ([Datadog docs](https://docs.datadoghq.com/tests/flaky_management/)).

**Two things to carry into #3089.** First, **every one of these keeps the quarantined test running
somewhere** — Dropbox post-submit, Uber non-blocking, Datadog "in the background". None of them use
the equivalent of `test.fixme`. Second, **no team publishes a maximum quarantine duration.** Datadog's
30-day auto-Fixed is the only concrete window in print. A deadline in this repo's policy has to be
presented as *our* policy, not as cited practice.

Against those numbers, this suite's **58 %** of green runs hiding a retry, and row 1's ~50 %
first-attempt failure rate, are not in the same universe as Google's 1.5 %. The ledger's verdict —
"it is not 'a flake', it is a broken test" — is the one the industry numbers support.

## 10. What this means for #3087

[#3087](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3087) is framed as a binary — *live
production data or deterministic fixtures?* The measurement says the binary is the wrong shape, in
four ways.

0. **It is not a choice between live data and fixtures — it is a choice about *where the live run
   lives*.** The value of reading production is real: it is the only thing in this repo watching
   whether production actually serves content. But a pre-merge gate is the wrong place to collect
   that value, because it blocks branches on somebody else's outage (rows 12, 13) while being
   structurally blind to the failures an ISR site actually has — stale content, a revalidation
   webhook that never fired (§2.5). **Keep the live run; move it to a scheduled probe that alerts and
   gates nothing.** `playwright.config.ts` already supports this: `BASE_URL` bypasses `webServer`.
   That single move dissolves most of the apparent conflict in #3087's title.
1. **"Deterministic fixtures" as most people mean it is not available here.** HAR replay and
   `route.fulfill` — the two techniques the phrase usually denotes — do not reach a server-rendered
   page (§5.1). The real choice is between *live upstreams*, *pinned upstreams* and *intercepted
   upstreams*, and only the last two are on the table.
2. **The decision does not fix the suite's worst flake, and must not be sold as doing so.** Rows 1
   and 4 are hydration races. Whatever #3087 decides, #3077 still needs its own answer, and #3085's
   proposal to move geometry assertions down to Storybook `play` is a separate and probably better
   lever for them.
3. **There are two fetch sites, not one.** The runtime fetch (`next start`) and the build fetch
   (`next build`) have different answers: configuration fixes the first, only interception fixes the
   second. A decision that says "use fixtures" without saying *which fetch site* leaves `main`'s
   single largest red cause — row 12 — exactly where it is.
4. **The tool question is settled and #3087 does not need to re-open it.** §2–§4: the layer stays,
   Playwright stays, and the one first-party option that could change the data answer
   (`next/experimental/testmode`, Option H) is a spike, not a decision. #3087 can treat the runner as
   fixed.

### Questions #3087 has to answer, that this research cannot

- **Who owns the fixture dataset, and how often is it refreshed?** A frozen dataset is a second
  content surface. The declaration-time Writer Rule applies: if nothing refreshes it, say so
  deliberately rather than "for later".
- **What happens to a data guard that still fires against the fixture dataset?** If it stays a
  `test.skip`, Option E buys visibility and not coverage. Turning the 31 guards into hard failures is
  the actual win, and it is a separate decision with its own cost.
- **Is the suite's job to catch upstream breakage?** Today a Sanity outage fails E2E. That is either
  the feature (a real user-facing outage) or the bug (a test suite that cannot distinguish its own
  regression from someone else's incident). #3086 — *what does each test layer promise* — owns this,
  and #3087 cannot be decided without it.
- **Does `instrumentation.ts`'s `register` run in `next build`'s prerender workers?** Measurable in
  an afternoon; nothing should be planned on it until it is.
- **What pins the clock?** The event cutoff is `Date.now() - 24h` and the article order is
  `publishedAt desc`. A frozen dataset with no clock story ages out of its own fixtures.

## 11. Recommendation

**Step 0 — keep the layer and keep the tool.** Not a no-op: it is a finding, and it closes two
questions so nobody re-opens them. The layer stays because Next.js documents E2E as the *only*
coverage for async Server Components (§2.1) and because at 56 tests it is already the right size
(§2.3). The tool stays because Playwright is the only runner with a first-party Next.js server-fetch
fixture (§3.1), because its flake gating, sharding and trace viewer are free where Cypress's are
paid (§3.2), because it already drives the 3 044-baseline VR layer so a migration would *add* an
engine rather than replace one (§4.2), and because **no ledger row is caused by a Playwright defect**
(§4.3). The suite is also cheap (68 s) and clean when the data is good (56/56, 0 flaky, locally).

Two things follow from Step 0 that are not "keep everything": the geometry specs should move **down**
to Storybook `play` (§2.4, #3085's call — 998 of 1 621 spec lines, and the two files that flake), and
the live-data smoke should move **sideways** to a scheduled production probe (§2.5), which
`playwright.config.ts`'s `BASE_URL` escape hatch already supports.

**Then: take Option E, in two independent steps, and do not let it absorb the hydration work.**

**Step 1 — move the suite off `production` (cheap, reversible, this week).** Point the E2E build and
run at a frozen `e2e` dataset copied from `staging`, and at a BFF bound to the same dataset.
`KCVV_API_URL` is a runtime env var and `NEXT_PUBLIC_SANITY_DATASET` is a build-time one that
`e2e.yml` already passes — so this is a workflow-variable change plus one `sanity dataset copy`, with
no new dependency, no new code in the app, and no test file touched.

Why this rung and not a higher one: the app already reads both upstreams through configuration. MSW,
an interceptor, a fixture corpus and a shipped `instrumentation.ts` seam are all *more* machinery to
achieve what an env var and a dataset copy achieve for the runtime fetch. Reach for D only when
something needs the build fetch taken off the network — which is a real need (row 12), but a
different and later one.

**Step 2 — treat rows 1 and 4 as their own work, under #3077, and do not wait on step 1.** They are
the majority of the measured noise and step 1 does nothing for them. §8 is the material.

**What this explicitly does not do:** it does not fix `next build`'s live Sanity read (row 12), and
it does not make a green check honest about a retry (row 15). Those belong to #3086/#3089 and to a
later, evidence-led look at Option D.

### What would falsify this recommendation

Each of these is measurable, and any one of them should change the answer.

**On the tool and layer choice:**

- **`next/experimental/testmode` works under `next start`.** If a spike shows the first-party proxy
  functions against a production build — and still fires on an ISR route, which §3.1 argues it may
  not, since a cache hit performs no server fetch — then Option H becomes the maintained,
  Vercel-owned answer to the crux and outranks E for the runtime fetch. **This is the single highest-
  value spike in this document**, and it also settles the tool question permanently in Playwright's
  favour. Conversely, if it turns out to work only under `next dev`, §3.1's decisive fact weakens to
  "a promising experiment" and the tool case rests on §3.2 and §4 alone — which is still enough, but
  say so honestly.
- **The geometry specs cannot move to Storybook `play`.** §2.4 and #3085 both assume sticky-offset
  and scroll-spy behaviour is reproducible in a Storybook browser with a fixture. If it needs the
  real route's layout, scroll container or streaming, the specs stay in E2E and rows 1 and 4 need an
  in-suite fix instead.
- **Real-Safari coverage becomes a requirement.** Playwright ships patched WebKit, not branded Safari
  (§3.3). This suite runs `chromium` only today, so the point is moot — if that changes, a real-device
  cloud is a separate purchase, not a tool swap.

**On the data strategy:**

- **`instrumentation.ts`'s `register` runs during `next build`'s prerendering.** If it does, Option D
  fixes row 12 — the largest single cause of a red `main` — and the cost calculus flips toward
  interception. **Measure first.**
- **A frozen dataset cannot satisfy the 31 guards.** If curating an `e2e` dataset that renders a
  `TeamSectionNav`, a played match, a transfer article and a photo gallery turns out to be weeks of
  content work, Option E buys determinism and not coverage, and F (staging as-is) becomes the honest
  stopping point.
- **`/kalender` is still slow against a local BFF.** The whole case for E fixing rows 2 and 3 assumes
  the 19-call fan-out is dominated by upstream latency. If a stub BFF still blows 30 s, the cause is
  in the fan-out itself and belongs to the app, not the test data.
- **A pinned dataset hides a real regression that live data would have caught.** If, in the
  measurement window, live data catches a genuine upstream contract break that a frozen dataset would
  have missed, the suite's promise (#3086) is different from what this assumes.
- **Someone writes to the `e2e` dataset.** The moment it acquires a Studio, a cron or an editor, it
  is `staging` again and the determinism is gone.

## 12. Sources

Primary sources only; each is cited inline above at the claim it supports. Grouped here so the next
reader can re-check a claim without re-reading the document.

**Next.js** — [Testing index](https://nextjs.org/docs/app/guides/testing) ·
[Vitest](https://nextjs.org/docs/app/guides/testing/vitest) ·
[Jest](https://nextjs.org/docs/app/guides/testing/jest) ·
[Playwright](https://nextjs.org/docs/app/guides/testing/playwright) ·
[Cypress](https://nextjs.org/docs/app/guides/testing/cypress) ·
[Environment variables](https://nextjs.org/docs/app/guides/environment-variables) ·
[instrumentation.js](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation) ·
[Instrumentation guide](https://nextjs.org/docs/app/guides/instrumentation) ·
[fetch](https://nextjs.org/docs/app/api-reference/functions/fetch) ·
[ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration) ·
[generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) ·
[Route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) ·
[Streaming](https://nextjs.org/docs/app/guides/streaming) ·
[Accessibility](https://nextjs.org/docs/architecture/accessibility) ·
[testmode Playwright README](https://github.com/vercel/next.js/blob/canary/packages/next/src/experimental/testmode/playwright/README.md) ·
[PR #52520](https://github.com/vercel/next.js/pull/52520)

**Playwright** — [Auto-waiting](https://playwright.dev/docs/actionability) ·
[Navigations § Hydration](https://playwright.dev/docs/navigations) ·
[Assertions](https://playwright.dev/docs/test-assertions) ·
[Timeouts](https://playwright.dev/docs/test-timeouts) ·
[Mock APIs](https://playwright.dev/docs/mock) · [Network](https://playwright.dev/docs/network) ·
[page.route](https://playwright.dev/docs/api/class-page#page-route) ·
[browserContext.route](https://playwright.dev/docs/api/class-browsercontext#browser-context-route) ·
[APIRequestContext](https://playwright.dev/docs/api/class-apirequestcontext) ·
[Web server](https://playwright.dev/docs/test-webserver) ·
[Retries](https://playwright.dev/docs/test-retries) · [CLI](https://playwright.dev/docs/test-cli) ·
[TestConfig.failOnFlakyTests](https://playwright.dev/docs/api/class-testconfig#test-config-fail-on-flaky-tests) ·
[Reporter API](https://playwright.dev/docs/api/class-reporter) ·
[TestCase.outcome](https://playwright.dev/docs/api/class-testcase#test-case-outcome) ·
[Trace viewer](https://playwright.dev/docs/trace-viewer) ·
[Trace modes](https://playwright.dev/docs/test-use-options#trace-modes) ·
[Sharding](https://playwright.dev/docs/test-sharding) ·
[Annotations](https://playwright.dev/docs/test-annotations) ·
[Projects](https://playwright.dev/docs/test-projects) · [CI](https://playwright.dev/docs/ci) ·
[Browsers](https://playwright.dev/docs/browsers) ·
[Best practices](https://playwright.dev/docs/best-practices) ·
[Release notes](https://playwright.dev/docs/release-notes)

**React** — [hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot) ·
[Suspense](https://react.dev/reference/react/Suspense)

**Interception** — [MSW setupServer](https://mswjs.io/docs/api/setup-server/) ·
[MSW Node integration](https://mswjs.io/docs/integrations/node) ·
[mswjs/interceptors](https://github.com/mswjs/interceptors) ·
[setupRemoteServer PR](https://github.com/mswjs/msw/pull/1617) ·
[remote.boundary](https://mswjs.io/docs/api/setup-server/boundary/) ·
[nextjs-rsc-testing reference impl](https://github.com/kettanaito/nextjs-rsc-testing) ·
[undici MockAgent](https://github.com/nodejs/undici/blob/main/docs/docs/api/MockAgent.md) ·
[Node env proxy](https://nodejs.org/learn/http/enterprise-network-configuration)

**Sanity** — [Datasets CLI](https://www.sanity.io/docs/cli-reference/cli-datasets) ·
[Datasets](https://www.sanity.io/docs/content-lake/datasets) ·
[API CDN](https://www.sanity.io/docs/content-lake/api-cdn) ·
[Perspectives](https://www.sanity.io/docs/content-lake/perspectives)

**Cloudflare** — [Local development](https://developers.cloudflare.com/workers/development-testing/) ·
[wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/)

**Other tools** — [Vitest browser mode](https://vitest.dev/guide/browser/) ·
[Why browser mode](https://vitest.dev/guide/browser/why.html) ·
[Vitest 4 release](https://vitest.dev/blog/vitest-4) ·
[Storybook testing](https://storybook.js.org/docs/writing-tests) ·
[Storybook interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing) ·
[Cypress intercept](https://docs.cypress.io/api/commands/intercept) ·
[Cypress parallelisation](https://docs.cypress.io/cloud/features/smart-orchestration/parallelization) ·
[Cypress flaky-test management](https://docs.cypress.io/cloud/features/flaky-test-management) ·
[Cypress trade-offs](https://docs.cypress.io/app/references/trade-offs) ·
[WebdriverIO mocks](https://webdriver.io/docs/mocksandspies/) ·
[Puppeteer interception](https://pptr.dev/guides/network-interception) ·
[Pact](https://docs.pact.io/) ·
[Pact: not functional tests](https://docs.pact.io/consumer/contract_tests_not_functional_tests)

**Practice at scale** —
[Google: Just Say No to More E2E Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html) ·
[Google: Flaky Tests at Google](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html) ·
[Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) ·
[Fowler/Vocke: Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) ·
[Kent C. Dodds: Static vs Unit vs Integration vs E2E](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests) ·
[Spotify: Test Flakiness](https://engineering.atspotify.com/2019/11/test-flakiness-methods-for-identifying-and-dealing-with-flaky-tests) ·
[GitHub: Reducing flaky builds by 18x](https://github.blog/engineering/engineering-principles/reducing-flaky-builds-by-18x/) ·
[Shopify: test retries](https://shopify.engineering/unreasonable-effectiveness-test-retries-android-monorepo-case-study) ·
[Dropbox: Athena](https://dropbox.tech/infrastructure/athena-our-automated-build-health-management-system) ·
[Uber: flaky tests overhaul](https://www.uber.com/en-US/blog/flaky-tests-overhaul/) ·
[Datadog: Flaky Test Management](https://docs.datadoghq.com/tests/flaky_management/) ·
[Datadog: Synthetics CI/CD](https://docs.datadoghq.com/synthetics/cicd_integrations/) ·
[Checkly: testing](https://www.checklyhq.com/docs/testing/)

### Claims deliberately NOT made, because they could not be sourced

Recorded so a later reader does not re-introduce them:

- **No first-party Vercel or Next.js statement exists on how much E2E a Next.js app should have.**
  Do not attribute a ratio to Vercel.
- **No credible at-scale source says a content/CMS site needs fewer browser tests** than a
  complex-flow app. Fowler's user-journey rule gets there generically; the sources that claim it
  directly are SEO content farms.
- **Storybook does not state that `play` functions cannot cover routing or ISR.** That follows from
  "only tests a unit… of UI", and must not be quoted as a documented limitation.
- **Vitest browser mode is not documented as able to render App Router server components.** The async
  RSC caveat is framework-level, not jsdom-level, so a real browser does not fix it.
- **The Playwright docs never say that raising a timeout hides a bug.** They say you are probably
  looking in the wrong place. The stronger claim needs an outside source.
- **No first-party engineering blog documents the "Playwright quarantine project" recipe.** The
  quarantine evidence in §9.3 is language-agnostic and comes from Dropbox, Uber, Datadog and Google.
- **No team publishes a maximum quarantine duration.** Datadog's 30-day auto-Fixed is the only
  concrete window in print; a deadline here would be *our* policy, not cited practice.
- **`next/experimental/testmode` is unverified under `next start` and on an ISR cache hit** (§3.1).

## 13. Commands that produced the repo numbers

```bash
# Route cache configuration
grep -rn "export const revalidate" apps/web/src/app | wc -l   # 27
grep -rn "force-dynamic" apps/web/src/app | wc -l             # 15

# Transport: both upstreams go through globalThis.fetch
grep -o "globalThis\.fetch\|node:http" \
  node_modules/.pnpm/@sanity+client@8.6.2*/node_modules/@sanity/client/dist/index.node.js \
  | sort | uniq -c                                            # 5 globalThis.fetch, 0 node:http

# Seams that do not exist yet
find apps/web -maxdepth 3 -name "instrumentation*" -not -path "*/node_modules/*"
grep -rn "\"msw\"" apps/*/package.json packages/*/package.json package.json

# Data guards, per spec file
for f in apps/web/test/e2e/*.spec.ts; do
  printf "%-28s %s\n" "$(basename "$f")" "$(grep -c 'test.skip(' "$f")"
done                                                          # 31 total

# Dataset census (public CDN endpoint, read-only, no token)
curl -s "https://vhb33jaz.apicdn.sanity.io/v2024-01-01/data/query/production?query=\
*%5B%21%28_id%20in%20path%28%22drafts.%2A%2A%22%29%29%5D%7B_type%7D"
# …and the same with /staging

# BFF health
curl -s -o /dev/null -w "http=%{http_code} ttfb=%{time_starttransfer}s\n" \
  https://kcvv-api.kevin-van-ransbeeck.workers.dev/matches/next
curl -s -o /dev/null -w "http=%{http_code} ttfb=%{time_starttransfer}s\n" \
  https://kcvv-api-staging.kevin-van-ransbeeck.workers.dev/matches/next
```
