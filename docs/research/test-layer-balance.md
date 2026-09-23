# Test layer balance and coverage strategy — what the primary sources say, applied to this stack

Research for [#3085](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3085), part of the test-suite walk map
[#3078](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078). Written 2026-09-22 against the suite as it is on
`main` at `ec15a8a8`: Next.js **16.3.5** / React **19.3.0**, Vitest **4.1.11** in **happy-dom 20.11.12**, Storybook
**10.5.10** with `@storybook/test-runner` **0.24.4** in an amd64 Docker image, Playwright **1.60.0**, Effect
**3.22.2**, Wrangler **4.127.0** (all from the workspace `package.json` files).

Sources are the owning documentation or the original engineering write-up in every case: Google's Testing Blog and
the _Software Engineering at Google_ book, Kent C. Dodds' Testing Trophy essays, Martin Fowler's Practical Test
Pyramid, Spotify's honeycomb post, GitHub's flaky-build post, and the Next.js, Vitest, Playwright, Storybook,
Cloudflare, Effect, MSW, Pact, Sanity, Chromatic and Stryker docs. Two academic papers are cited by their own text
(one read from the author's PDF). Repo facts were measured with `grep`/`find` on the worktree and are marked
_(measured)_.

**Filed under `docs/research/`** — the established convention (see
[`nextjs-notfound-status-under-suspense.md`](./nextjs-notfound-status-under-suspense.md)).

---

## Answer

**The sources converge on one shape and this suite has it upside down in two places.** Google runs ~80 % small
(single-process, no network) tests, ~15 % medium, ~5 % large, and measured that
[large tests flake 28× more often than small ones](#15-flakiness-scales-with-test-size--the-numbers). Kent C. Dodds'
Testing Trophy says the same thing from the front-end side: most weight on tests that render real components with
only the **network** mocked, few end-to-end. Fowler adds the rule that decides duplicates: push every assertion as far
_down_ as it can go, and delete the higher copy once the lower one covers all its conditions.

Applied here:

| Layer                                                                     | Owns (only this layer can see it)                                                                                                                                                                                                                | Must not own                                                                                                                                                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Static** — `tsgo`, ESLint, Sanity TypeGen, `@kcvv/api-contract` schemas | Shape of every wire and query result; conventions enforceable by lint (#2378 model)                                                                                                                                                              | Behaviour                                                                                                                                                                                 |
| **Vitest in happy-dom** (Google "small")                                  | Pure logic, transforms, view-model adapters, `generateMetadata`/canonical URLs, Effect services via `Layer.succeed`/`Layer.mock`, sync orchestration, GROQ queries via `groq-js` against fixtures, component _behaviour_ with the network mocked | Layout, breakpoints, geometry, `matchMedia`, `hashchange`, `color-mix()` (happy-dom simulates, and this repo has measured where it lies); async Server Component pages (Next.js says E2E) |
| **Storybook in a real browser** (Google "medium")                         | Pixel truth of `UI/*`, `Features/*`, `Layout/*` at three viewports; **runtime geometry against a fixture** (overflow, sticky offsets, scroll-spy) via `play`; responsive `srcset`/`matchMedia` behaviour                                         | Real-data composition; anything a fixture can't pin                                                                                                                                       |
| **Contract at the BFF boundary**                                          | `encode → JSON → decode` round-trips of every `api-contract` schema on both sides; the Worker's own runtime semantics (KV, `waitUntil`, single-flight) in workerd                                                                                | Consumer-driven Pact — both sides are one repo with one consumer; the shared schema _is_ the contract                                                                                     |
| **Playwright E2E** (Google "large")                                       | Route smoke against `next start` (status, `<h1>`, chrome, no broken images, no `console.error`), ISR/404 status, hydration, cross-route navigation — **against a deterministic BFF**                                                             | Component geometry, third-party liveness (live Sanity/PSD), anything a fixture-fed Storybook story can assert                                                                             |

The two inversions: (1) runtime-geometry specs (`section-nav.spec.ts`, `scroll-arrows.spec.ts`) sit at the most
expensive, flakiest layer and depend on **live content** to produce overflow at all — that is what the 31
`test.skip` data guards and the "flakes 1 in 6" history are; the same invariants belong in Storybook `play` functions
in a real browser with a fixture that _guarantees_ the overflow. (2) The VR layer runs on a runner Storybook itself
now calls superseded, while the replacement (`@storybook/addon-vitest` + Vitest browser mode, with a native
`toMatchScreenshot`) is already installed but inert _(measured)_.

For coverage: Google's own guidance and the largest empirical study agree that a line-coverage percentage is not a
quality target — it locates untested code and nothing more. The metrics that matter are **coverage of changed
lines shown in review**, **mutation score** on pure domains, and **flake rate per layer** (Google's threshold: near
1 % the tests lose their value).

---

## 1. What the sources say about layer balance

### 1.1 The pyramid, as Google states it

The 2015 Testing Blog post is the source of the 70/20/10 split and the reason for it:

> "Think of E2E tests as your worst case. If you have a small number E2E tests, the overall runtime of all your tests
> will still be quite reasonable. However, if you mostly use E2E tests, then your test runtime (and the number of test
> flakes) will inflate significantly."
> — [Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)

The _SWE at Google_ book (2020) refines the ratio to roughly **80 % narrow unit / 15 % integration / 5 % end-to-end**
and defines the sizes by resource use, not by what they test: small tests "must run in a single process" and "aren't
allowed to sleep, perform I/O operations, or make any other blocking calls"; medium tests may use threads and
`localhost`; large tests may span machines. Small tests "are almost always faster and more deterministic than tests
that involve more infrastructure". The same chapter warns that "as you approach 1 % flakiness, the tests begin to lose
value" (Google sits around 0.15 %).
— [SWE at Google, ch. 11 "Testing Overview"](https://abseil.io/resources/swe-book/html/ch11.html)

The original 2010 size table (network: no / localhost / yes; sleep: no / yes / yes; time limit 60 s / 300 s / 900 s+)
is in [Test Sizes](https://testing.googleblog.com/2010/12/test-sizes.html). By that table, **this repo's Vitest
suite is "small", Storybook is "medium" (a browser on localhost), and Playwright against live Sanity + the deployed
BFF is "large"** — it uses external systems.

Chapter 14 is the case _for_ large tests, and it is a short list: **fidelity** ("the property by which a test is
reflective of the real behavior of the system under test"), **unfaithful doubles** ("the engineer usually did _not_
write the thing being mocked and can be misinformed about its actual behavior"), **configuration** ("configuration
changes are the number one reason for our major outages"), load, and **unanticipated/emergent behaviour**. Anything
not on that list is not a reason for an E2E test.
— [SWE at Google, ch. 14 "Larger Testing"](https://abseil.io/resources/swe-book/html/ch14.html)

### 1.2 The trophy, as Kent C. Dodds states it

The trophy puts the bulk on **integration**: rendering real components together with only the network mocked, via
MSW, not modules. The quotable rules:

- "The more your tests resemble the way your software is used, the more confidence they can give you."
- "When you mock something you're removing all confidence in the integration between what you're testing and what's
  being mocked."
- "Integration tests strike a great balance on the trade-offs between confidence and speed/expense."
- Implementation-detail tests "can break when you refactor application code" (false negatives) and "may not fail when
  you break application code" (false positives).

Sources: [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications),
[Static vs Unit vs Integration vs E2E](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests),
[Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests),
[Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details).

The pyramid and the trophy disagree only on vocabulary. Kent's "integration" (real components, network mocked, one
process) is Google's "small" test with real dependencies — which Google _also_ prefers: "prefer realism over
isolation", "overuse of stubbing can result in major losses in productivity", and "interaction testing should be
avoided when possible: it leads to tests that are brittle because it exposes implementation details".
— [SWE at Google, ch. 13 "Test Doubles"](https://abseil.io/resources/swe-book/html/ch13.html)

### 1.3 The honeycomb, for a service like the BFF

Spotify's post is the primary source for how to test a service whose complexity is at its edges: "The biggest
complexity in a Microservice is not within the service itself, but in how it interacts with others." They define
**integrated** tests — "A test that will pass or fail based on the correctness of another system" — as the thing to
have zero of, and put most weight on **integration** tests that run the real service code against in-memory or
faked external dependencies with realistic fixtures.
— [Testing of Microservices](https://engineering.atspotify.com/2018/01/testing-of-microservices/)

The E2E job today is an integrated test by this definition: it passes or fails on the state of Sanity content and
the PSD upstream.

### 1.4 The rule that decides duplicates

Fowler's Practical Test Pyramid gives the two rules for "some behaviour is tested twice":

> "If a higher-level test spots an error and there's no lower-level test failing, you need to write a lower-level
> test." … "Push your tests as far down the test pyramid as you can." … "If you have tested all conditions confidently
> on a lower-level test, there's no need to keep a higher-level test in your test suite."
> — [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

### 1.5 Flakiness scales with test size — the numbers

Google's measurements, from the posts themselves:

- "Almost 16 % of our tests have some level of flakiness"; "about 84 % of the transitions we observe from pass to fail
  involve a flaky test"; re-running a test marked flaky until it fails 3× in a row "encourages developers to ignore
  flakiness in their own tests … which is hardly a perfect solution".
  — [Flaky Tests at Google and How We Mitigate Them](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)
- "Over the course of a week, **0.5 % of our small tests were flaky, 1.6 % of our medium tests were flaky, and 14 %
  of our large tests were flaky**"; "Objectively measured test binary size and RAM have strong correlations with
  whether a test is flaky"; "tools have some impact, but RAM use accounts for larger deviations in flakiness".
  — [Where do our flaky tests come from?](https://testing.googleblog.com/2017/04/where-do-our-flaky-tests-come-from.html)
- The four sources of flakiness: the test itself, the test-running framework, the system under test and its
  dependencies, and the OS/hardware; "Hermetic environments, in general, are less likely to be flaky."
  — [Test Flakiness – One of the main challenges of automated testing](https://testing.googleblog.com/2020/12/test-flakiness-one-of-main-challenges.html)

GitHub's own numbers: "1 in 11 commits had at least one red build" from flakes, cut to "1 in 200" by detecting
flakes with three retry _classes_ (same process, time-shifted, separate host), then assigning each flake to an owner
via blame — and "0.4 percent of flaky tests failed 100 times or more", so fix by impact.
— [Reducing flaky builds by 18x](https://github.blog/engineering/reducing-flaky-builds-by-18x/)

The map's own evidence matches the RAM correlation exactly: the VR runner OOMs at ~80 stories without a 4 GB heap,
`Pages/*` stories crashed Chromium under the 8 GB cap, and five parallel Docker builds froze at 0 % CPU.

---

## 2. Layer by layer, for this stack

### 2.1 Static — cheaper than any test, and this stack has three of them

- `tsgo` type-check runs in pre-commit already.
- **Sanity TypeGen** types every `defineQuery` result by "overlaying the schema types over the GROQ query"; unsupported
  expressions come back as `unknown`, which is a compile-time signal that a query needs a runtime test. The script
  exists (`apps/studio` `typegen`), its output is checked in (`apps/web/src/lib/sanity/sanity.types.ts`) and
  `defineQuery` is used in the web repositories _(measured)_.
  — [Sanity TypeGen](https://www.sanity.io/docs/apis-and-sdks/sanity-typegen)
- **`@kcvv/api-contract`** Effect Schemas are the BFF↔web contract; `HttpApiClient` decodes every response at runtime
  on the web side (PRD `contract-boundary-tests.md`).
- Conventions belong in ESLint, not in review: #2378 closed the in-body-import flake class with a rule. Google's
  unit-testing chapter is the argument for lint-enforced test hygiene: tests should be "trivially correct upon
  inspection", DAMP over DRY, "test behaviors, not methods".
  — [SWE at Google, ch. 12 "Unit Testing"](https://abseil.io/resources/swe-book/html/ch12.html)

### 2.2 Vitest in happy-dom — the "small" layer

**What it should own.** Everything that is a function of its inputs: transforms and view-model adapters
(`matchRowKind`, `transformMatchToSchedule` …), `generateMetadata` and canonical URLs, Effect services with their
dependencies swapped by layer, the sync orchestration (`runSync` per PRD #849), repository GROQ queries, and
component _behaviour_ (what happens when the user clicks/types) with only the network mocked.

**What it cannot own — by design of the environment.** Vitest documents `happy-dom` as a package that "emulates
browser environment by providing Browser API … but lacks some API", and motivates Browser Mode with: "these tools
only simulate a browser environment and not an actual browser, which may result in some discrepancies between the
simulated environment and the real environment", leading to "false positives or negatives".
— [Vitest: Test Environment](https://vitest.dev/guide/environment),
[Vitest: Why Browser Mode](https://vitest.dev/guide/browser/why)

The map measured three of those discrepancies in one day: `matchMedia` ignores width, `hashchange` never fires,
`background-color: color-mix()` is dropped. Six test files stub `matchMedia` _(measured)_ — every one of them is
asserting a breakpoint contract the environment cannot honour. **Layout, breakpoints, geometry and CSS-function
rendering are not this layer's to assert**; a happy-dom test that passes on those is Kent's false positive.

**Async Server Components.** Next.js is unambiguous, on both the overview and the Vitest guide:

> "Since `async` Server Components are new to the React ecosystem, Vitest currently does not support them. While you
> can still run unit tests for synchronous Server and Client Components, we recommend using E2E tests for `async`
> components."
> — [Next.js: Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest);
> same statement at [Next.js: Testing](https://nextjs.org/docs/app/guides/testing)

The upstream RTL issue for async RSC support is still open and unresolved
([testing-library/react-testing-library#1209](https://github.com/testing-library/react-testing-library/issues/1209)).
This repo has 13 `page.test.tsx` files under `src/app` _(measured)_ — those tests must be limited to the
synchronous, pure exports of a page module (`generateMetadata`, `generateStaticParams`, `revalidate`, the
data→props adapter) and must not assert on a rendered async page tree. Page _composition_ is the E2E smoke's job,
as `apps/web/CLAUDE.md` already says.

**Effect services.** Effect's own layer docs describe the mechanism: layers are "constructors for creating
services", so a test provides `DatabaseTest` instead of `DatabaseLive` "without changing the Database service
interface itself" — `Layer.succeed` for a static value.
— [Effect: Managing Layers](https://effect.website/docs/requirements-management/layers/)

Two things the BFF tests do not use yet:

- `Layer.mock` (since Effect 3.17, repo on 3.22.2): "You can provide a partial implementation of the service, and
  any methods not provided will throw an `UnimplementedError` defect when called." That turns an accidental call
  into a failure instead of a silent `undefined` — the exact seam the memory note _agent-tests-that-cannot-fail_
  warns about. (Read from the installed `effect/dist/dts/Layer.d.ts`, `@since 3.17.0`, `@category Testing`.)
- `@effect/vitest`'s `it.effect` "runs a scoped test with test services such as `TestClock` and `TestConsole`";
  `it.live` uses the real clock; `it.layer` shares a layer across tests. TestClock exists so that code involving
  time can be tested "without having to wait for the actual time to pass" — relevant to KV TTLs, the rate limiter
  and single-flight (#2326/#2328), which are otherwise tested with real timers.
  — [`@effect/vitest` README](https://github.com/Effect-TS/effect/blob/main/packages/vitest/README.md),
  [Effect: TestClock](https://effect.website/docs/testing/testclock/)

**Sanity queries.** `groq-js` "is a JavaScript implementation of GROQ which follows the official specification"; it
parses a query and evaluates it against an in-memory `dataset` array. That makes a repository's GROQ testable as a
small test — fixture documents in, decoded result out — without the Content Lake.
— [sanity-io/groq-js](https://github.com/sanity-io/groq-js)

```typescript
import { evaluate, parse } from "groq-js";

const tree = parse(TEAM_BY_SLUG_QUERY);
const value = await evaluate(tree, {
  dataset: fixtureDocuments,
  params: { slug: "u15" },
});
const result = await value.get();
```

Combined with TypeGen (static shape) this closes the "testing Sanity queries" bullet without a live dataset.

### 2.3 Storybook in a real browser — the "medium" layer

**What it should own.** The pixel truth of `UI/*`, `Features/*`, `Layout/*` (184 `vr` stories, 3 047 baselines
today) — and, newly, **runtime geometry against a fixture**: overflow arrows, sticky-bar offsets, scroll-spy,
`srcset` selection at a viewport. Storybook's interaction tests exist for exactly this — "simulate user behavior
like clicks, typing, and submitting a form and then assert on the end result" in a real browser, reusing one story
for "documentation, visual testing, and interaction testing".
— [Storybook: Interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing)

Only 16 of 208 stories have a `play` function _(measured)_. The two behavioural E2E specs each state in their own
header comment that they exist because "only a real browser can confirm" the geometry — true, but Storybook _is_ a
real browser, and a fixture can guarantee the overflow that live content only sometimes provides (the
`scroll-arrows.spec.ts` comment itself records that "several of these rows render zero items today").

**The runner.** Storybook's docs now say of the tool this repo runs:

> "The test runner has been superseded by the Vitest addon, which offers the same functionality, powered by the
> faster and more modern Vitest browser mode." … "If you are using a Vite-powered Storybook framework, we recommend
> using the Vitest addon instead of the test runner."
> — [Storybook: Test runner](https://storybook.js.org/docs/writing-tests/integrations/test-runner)

The addon "works by using a Vitest plugin to transform your stories into Vitest tests using portable stories", runs
in "Playwright's Chromium browser through Vitest's browser mode", and "is supported in Next.js ≥ 14.1 projects, but
you must be using the `@storybook/nextjs-vite` framework". Both `@storybook/addon-vitest` and
`@storybook/nextjs-vite` are installed and the addon is registered in `.storybook/main.ts`, but no Vitest project
uses its plugin _(measured)_ — the suite is one config switch away from running stories as Vitest tests.
— [Storybook: Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)

Vitest 4's browser mode ships visual regression natively: `toMatchScreenshot` "captures screenshots of your UI
components and pages, then compares them against reference images"; references live in `__screenshots__` next to
the test and are committed; `pixelmatch` is the default comparator with `threshold`, `allowedMismatchedPixelRatio`
and `allowedMismatchedPixels`; and — the same warning every VR tool gives — "Docker containers, CI-only visual
testing workflows, or cloud services are strongly recommended" because rendering varies by GPU, OS, font pipeline
and browser version.
— [Vitest: Visual Regression Testing](https://vitest.dev/guide/browser/visual-regression-testing)

That would replace `@storybook/test-runner` + Jest + `jest-image-snapshot` + the custom `test-runner.ts` with one
runner shared by unit, component, interaction and VR tests. The Docker/amd64 constraint does not go away — it is
inherent to pixel comparison — but the runner, the heap tuning and the tag-filter surprises (#1522's `vr-skip`
discovery bug) do.

**Determinism rules are the same everywhere.** Playwright: "Browser rendering can vary based on the host OS,
version, settings, hardware, power source (battery vs. power adapter), headless mode, and other factors"; `toHaveScreenshot`
"will wait until two consecutive page screenshots yield the same result", with `animations: "disabled"` and
`caret: "hide"` as defaults and `threshold` 0.2. Chromatic: "Browsers can decide to render HTML in multiple passes
when custom fonts are used", so wait on `document.fonts.ready` in a loader and preload or self-host fonts; CSS
animations are paused at a frame, JS animations must be disabled by the app. #2834 (Typekit swap races every
`--mobile` capture) and #3033 (autofocus ring) are both instances the vendors document.
— [Playwright: Screenshots](https://playwright.dev/docs/test-snapshots),
[Playwright: `toHaveScreenshot`](https://playwright.dev/docs/api/class-pageassertions),
[Chromatic: Font loading](https://www.chromatic.com/docs/font-loading/),
[Chromatic: Animations](https://www.chromatic.com/docs/animations/)

### 2.4 Contract tests at the BFF boundary

**Consumer-driven contracts (Pact) are the wrong tool here, by Pact's own criteria.** Pact is for when "you (or your
team/organisation/partner organisation) control the development of both the consumer and the provider" _and_ the
provider has several consumers to manage relationships with; it does not test "the side effects of a request being
executed on a provider" and is not for functional testing — "that is what the provider's own tests should do".
Fowler: CDC lets a consuming team "publish the tests for the providing team" — a cross-team mechanism.
— [Pact: What is Pact good for?](https://docs.pact.io/getting_started/what_is_pact_good_for),
[Practical Test Pyramid — Contract Tests](https://martinfowler.com/articles/practical-test-pyramid.html)

Here there is one consumer, one provider, one repo, one type-checked schema package. **The contract is
`@kcvv/api-contract`, and the contract test is "does each side round-trip every schema"** — which PRD #847 already
specifies on the provider side (`S.decodeUnknownSync(Match)(transformOutput)`). The one gap the PRD names in its own
open questions is the wire form: `Date` objects are valid in memory but arrive as strings, so the assertion must be
`encode → JSON.stringify → JSON.parse → decode`, not `decode(inMemoryObject)`. Google's rule for fakes applies to
the fixture BFF proposed in §2.5: "a fake must have its own tests to ensure that it conforms to the API of its
corresponding real implementation" — the api-contract schemas are that test.

**The Worker runtime itself.** The BFF's Vitest runs in `environment: "node"` with KV faked by a `Map` and
`fetch` injected _(measured)_ — a Google "small" test, correctly. What it cannot see is workerd: `waitUntil`
semantics, KV `list`/TTL behaviour, the `cloudflare:workers` globals. Cloudflare's current guidance: "For most
projects, use the Workers Vitest integration for unit tests and the `createTestHarness()` API for integration
tests." The integration ("Tests run inside the Workers runtime, so your test code can access bindings and runtime
APIs directly") is now `@cloudflare/vitest-plugin` — "requires Vitest 4.1 or later" (repo: 4.1.11), config
`plugins: [cloudflareTest({ wrangler: { configPath } })]`, `compatibility_date` ≥ 2022-10-31 — with "isolated
per-test-file storage" for KV/D1/R2/DO, and `@msw/cloudflare` for outbound requests (the PSD and Footbalisto
upstreams). `createTestHarness()` runs the built Worker and exposes `server.fetch()` to any Node test runner.
— [Cloudflare: Testing Workers](https://developers.cloudflare.com/workers/testing/),
[Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/),
[Write your first test](https://developers.cloudflare.com/workers/testing/vitest-integration/get-started/write-your-first-test/),
[Isolation and concurrency](https://developers.cloudflare.com/workers/testing/vitest-integration/isolation-and-concurrency/),
[Migrate to the Vitest plugin](https://developers.cloudflare.com/workers/testing/vitest-integration/migration-guides/migrate-to-vitest-plugin/),
[Test harness](https://developers.cloudflare.com/workers/testing/test-harness/get-started/),
[mswjs/cloudflare](https://github.com/mswjs/cloudflare)

Recommendation: keep the pure BFF tests where they are; add a **second, small Vitest project** under the Cloudflare
plugin for the handful of paths whose correctness depends on runtime semantics (KV cache read/write/TTL,
single-flight, the cron entry). Not the whole suite — the plugin boots workerd, which is Google's "medium" cost.
(Local wrinkle from memory: Wrangler needs Node 22 here; the plugin's Node floor was not verified in this pass.)

**The sync pipeline** (PRD #849) is correctly a layer-mock test: `Layer.succeed` fakes for `SanityWriteClient`,
`FootbalistoClient`, `KvCacheService`. The one Google caveat: the `Map` fake of KV is owned here and must keep
"fidelity to the API contracts of the real implementation" — a reason to run the cache module once under the real
runtime (above) rather than trust the fake forever.

### 2.5 Playwright E2E — the "large" layer

**What it should own.** Fidelity, in Google's sense: the production build actually serves each route (status code —
including the streaming-vs-404 contract researched in #2968 — `<h1>`, nav, footer, no broken images, no
`console.error`), hydration happens, cross-route navigation works, ISR routes prerender. Next.js: "We recommend
running your tests against your production code to more closely resemble how your application will behave" —
`next build` + `next start`, which the `webServer` block already does.
— [Next.js: Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright),
[Playwright: Web server](https://playwright.dev/docs/test-webserver)

**What it must stop depending on.** Playwright's best-practices page:

> "Don't try to test links to external sites or third party servers that you do not control. … Instead, use the
> Playwright Network API and guarantee the response needed."
> — [Playwright: Best Practices](https://playwright.dev/docs/best-practices)

Live Sanity content and the deployed BFF (which itself fans out to PSD) are third-party state from the suite's point
of view. The 31 `test.skip` data guards, the sitemap-driven slug discovery and #2977's cold-retry flake are all
consequences of that dependency — and Google's "integrated test" and "unfaithful double" warnings cut both ways:
the fix is a **deterministic BFF the suite controls**, not a mock of the browser's requests, because the requests
that matter here are made **server-side by the RSC tree** and `page.route` never sees them (Playwright's mocking
API tracks "any requests that a page does"; the Next server is not the page).
— [Playwright: Mock APIs](https://playwright.dev/docs/mock)

Two hermetic options, both needing a spike (a decision for the map's grilling tickets, not this ticket):

1. **A fixture BFF** — a tiny server implementing the `api-contract` routes from committed JSON fixtures, started by
   Playwright's `webServer` (it accepts an array) with `KCVV_API_URL` pointed at it. Its own test is
   `S.decodeUnknownSync(schema)(fixture)` for every fixture, so it cannot drift from the contract. The BFF is
   not the only upstream: the web app reads Sanity directly through `@sanity/client`
   _(measured: `apps/web/src/lib/sanity/fetch-groq.ts`, `client.ts`)_, so Sanity needs the same treatment — a
   dataset frozen for tests, or the MSW route below.
2. **MSW inside the Next server** — `instrumentation.ts`'s `register()` "will be called once when a new Next.js
   server instance is initiated", guarded by `process.env.NEXT_RUNTIME === 'nodejs'`; MSW's `setupServer` works
   "by patching native request-issuing modules, like `http` and `https`" for "the current process", so one handler
   set could stub both the BFF and Sanity's CDN. Unverified: interaction with Next's own `fetch` patching and with
   `next build`-time prerendering — that is the spike.
   — [Next.js: Instrumentation](https://nextjs.org/docs/app/guides/instrumentation),
   [MSW: Node.js integration](https://mswjs.io/docs/integrations/node),
   [MSW: Introduction](https://mswjs.io/docs/)

Keep **one** live run: a scheduled job with `BASE_URL=https://www.kcvvelewijt.be` that runs the same smoke, alerts,
and gates nothing — that is the "production probe", and it is the only place live data belongs.

**Policy settings the docs make available.** `retries` "By default failing tests are not retried"; a test that
"failed on the first run, but passed when retried" is reported as flaky and — since `failOnFlakyTests` exists
("Whether to exit with an error if any tests are marked as flaky. Useful on CI.") — does **not** fail the run by
default. #2971 built a reporter to surface exactly that; the config flag is the primary fix. With a deterministic
backend, `retries: 0` + `failOnFlakyTests: true` makes "red means regression" literal.
— [Playwright: Retries](https://playwright.dev/docs/test-retries),
[Playwright: TestConfig](https://playwright.dev/docs/api/class-testconfig)

---

## 3. What should move between layers

| Today                                                                                                       | Where it lives             | Should live                                                                                                                | Why (source)                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Section-nav scroll-spy + anchor offset (`section-nav.spec.ts`, 7 tests, 6 skip guards; #2988, #3003, #3077) | Playwright vs live content | Storybook `play` on `OrganigramSectionNav` / `TeamSectionNav` with a fixture tall enough to scroll, in Vitest browser mode | Fowler "push down"; Google large-test flake rate; Storybook interaction tests run in a real browser          |
| Scroll-arrow mount/unmount vs `scrollWidth` (`scroll-arrows.spec.ts`, 8 tests, 6 skip guards)               | Playwright vs live content | Storybook `play` with a fixture that overflows, and one that does not                                                      | Same; the spec's own comment says live rows "render zero items today"                                        |
| Breakpoint / `matchMedia` assertions (6 test files stub `matchMedia`)                                       | happy-dom                  | Storybook story per viewport (VR already captures 3 viewports)                                                             | Vitest: happy-dom "lacks some API"; map measured `matchMedia` ignores width                                  |
| `hashchange`, `color-mix()` rendering                                                                       | happy-dom (cannot)         | Storybook / browser mode                                                                                                   | Map measured both                                                                                            |
| Rendered-tree assertions in 13 `page.test.tsx` for async pages                                              | happy-dom                  | E2E smoke (composition) + Vitest on pure exports (`generateMetadata`, canonical, adapters)                                 | Next.js: "we recommend using E2E tests for `async` components"                                               |
| `SearchInterface` StrictMode timing (`waitFor`-heavy, fails under sibling load)                             | happy-dom, real timers     | `TestClock`/fake timers for the debounce logic; the StrictMode double-mount invariant in browser mode                      | Google: small tests must not sleep; Effect TestClock                                                         |
| VR baselines via `@storybook/test-runner` + `jest-image-snapshot`                                           | Jest in Docker             | Vitest browser mode `toMatchScreenshot` via the installed addon, same Docker image                                         | Storybook: test-runner "superseded"                                                                          |
| BFF KV cache / single-flight semantics                                                                      | Node with a `Map` fake     | One extra Vitest project under `@cloudflare/vitest-plugin` (workerd, isolated KV)                                          | Google ch. 13 fakes must be verified against the real thing; Cloudflare recommends the plugin for unit tests |
| Wire-format contract (`Date` as string)                                                                     | In-memory decode only      | `encode → JSON → decode` round-trip on both packages                                                                       | PRD #847 open question 3                                                                                     |
| Live Sanity/PSD in the merge gate                                                                           | `e2e.yml` on every PR      | Scheduled non-gating production probe                                                                                      | Playwright: don't test third parties you don't control; Spotify: zero integrated tests                       |
| `packages/sanity-schemas` (0 tests)                                                                         | —                          | Vitest: schema `validation` rules as pure functions; `groq-js` query tests in `apps/web` repositories                      | groq-js follows the spec; TypeGen covers shape statically                                                    |

Nothing moves _up_. Every item above is a case of a behaviour sitting one layer higher (or in an environment one
notch less faithful) than the cheapest layer that can actually see it.

---

## 4. Coverage that matters

**Line coverage is a map of gaps, not a score.** Google's stated position:

> "Code coverage does not guarantee that the covered lines or branches have been tested correctly, it just guarantees
> that they have been executed by a test." … "In fact a lot of the value of code coverage data is to highlight not
> what's covered, but what's not covered." … "A better technique to assess whether you're adequately exercising the
> lines your tests cover, and adequately asserting on failures, is mutation testing." … "While project wide goals
> above 90 % are most likely not worth it, per-commit coverage goals of 99 % are reasonable, and 90 % is a good lower
> threshold." … "some of the coverage from integration tests and end-to-end tests is incidental and not deliberate."
> — [Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html)

Their guideline numbers, for reference only: 60 % "acceptable", 75 % "commendable", 90 % "exemplary" — with "the
gains of increasing code coverage beyond a certain point are logarithmic". Google's own five-year study of coverage
in code review concludes that "a key aspect of making coverage information actionable is to apply it at the level of
changesets and code review".
— [Code Coverage at Google (ESEC/FSE 2019)](https://research.google/pubs/code-coverage-at-google/)

The largest empirical study says the same from outside: 31 000 generated suites over five Java systems up to 724 kLOC,
effectiveness measured by mutation testing — "there is a low to moderate correlation between coverage and
effectiveness when the number of test cases in the suite is controlled for … coverage, while useful for identifying
under-tested parts of a program, should not be used as a quality target because it is not a good indicator of test
suite effectiveness."
— Inozemtseva & Holmes, [Coverage Is Not Strongly Correlated with Test Suite Effectiveness](https://www.cs.ubc.ca/~rtholmes/papers/icse_2014_inozemtseva.pdf), ICSE 2014

**What to measure instead, and what Vitest gives you.**

1. **Make the gap map honest first.** Vitest's v8 provider reports, by default, only "files covered by tests" — a file
   nothing imports is invisible, so the number is inflated by construction. `coverage.include` must list the source
   globs. The v8 provider since 3.2 uses "AST based coverage remapping" and produces "identical coverage reports to
   Istanbul", so no provider switch is needed.
   — [Vitest: Coverage](https://vitest.dev/guide/coverage), [Vitest: `coverage.thresholds`](https://vitest.dev/config/coverage)
2. **Gate on changed code, not the total.** `vitest --changed [ref]` runs "tests that are affected by the changed
   files"; `vitest related` runs "only tests that cover a list of source files" (static imports only). Turning that
   into a changed-lines coverage number in review needs a diff-coverage step in CI; that tooling choice is a spec
   decision, not a research one. No repo-wide `%` threshold — Google's "checkbox" warning applies.
   — [Vitest: CLI](https://vitest.dev/guide/cli)
3. **Mutation score on the pure domains.** Stryker's definition: "Mutation testing introduces changes to your code,
   then runs your unit tests against the changed code" — a surviving mutant is a test that asserts nothing.
   `@stryker-mutator/vitest-runner` exists, always uses per-test coverage analysis, and "does not support Vitest's
   browser mode" — so it applies exactly to the small layer: transforms, `match-display`, sync decision functions,
   `api-contract` schemas. Run it on a schedule or on-demand, not per PR.
   — [Stryker: Introduction](https://stryker-mutator.io/docs/), [Stryker: Vitest runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/)
4. **Flake rate per layer as a first-class metric.** Google's 1 % threshold; the #2971 reporter already counts
   flaky/skipped on E2E — extend the same count to VR (sub-threshold diffs passed by `vr -u`) and to Vitest
   (`SearchInterface` under sibling load), and track by layer, because the layers have different budgets.
5. **Per-change coverage in review** is the one coverage metric both Google sources single out as behaviour-changing;
   the absolute number is a dashboard, not a gate.

---

## 5. What this leaves for the map

- **Decision:** deterministic backend for E2E — fixture BFF vs MSW-in-`instrumentation.ts` (needs a spike; §2.5).
- **Decision:** migrate VR from `@storybook/test-runner` to the installed Vitest addon + browser-mode
  `toMatchScreenshot` (3 047 baselines to re-capture in the same amd64 image; §2.3).
- **Decision:** which BFF paths earn a workerd-backed Vitest project (§2.4).
- **Decision:** the diff-coverage tool and whether mutation testing runs on a schedule (§4).
- **Not decided here:** speed and cost budgets per layer — those need the measurements the map's other tickets own.

---

## Sources

Primary, in order of load-bearing weight for the conclusion:

1. Google Testing Blog — [Where do our flaky tests come from?](https://testing.googleblog.com/2017/04/where-do-our-flaky-tests-come-from.html) (0.5 % / 1.6 % / 14 % by size)
2. _Software Engineering at Google_ — [ch. 11 Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html), [ch. 13 Test Doubles](https://abseil.io/resources/swe-book/html/ch13.html), [ch. 14 Larger Testing](https://abseil.io/resources/swe-book/html/ch14.html), [ch. 12 Unit Testing](https://abseil.io/resources/swe-book/html/ch12.html)
3. Kent C. Dodds — [The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications), [Static vs Unit vs Integration vs E2E](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests), [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests), [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
4. Martin Fowler — [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
5. Next.js — [Testing](https://nextjs.org/docs/app/guides/testing), [Vitest](https://nextjs.org/docs/app/guides/testing/vitest), [Playwright](https://nextjs.org/docs/app/guides/testing/playwright), [Instrumentation](https://nextjs.org/docs/app/guides/instrumentation)
6. Storybook — [Test runner](https://storybook.js.org/docs/writing-tests/integrations/test-runner), [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon), [Interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing), [Portable stories](https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest)
7. Vitest — [Why Browser Mode](https://vitest.dev/guide/browser/why), [Visual Regression Testing](https://vitest.dev/guide/browser/visual-regression-testing), [Environment](https://vitest.dev/guide/environment), [Coverage](https://vitest.dev/guide/coverage), [`coverage.thresholds`](https://vitest.dev/config/coverage), [CLI](https://vitest.dev/guide/cli)
8. Playwright — [Best Practices](https://playwright.dev/docs/best-practices), [Retries](https://playwright.dev/docs/test-retries), [TestConfig](https://playwright.dev/docs/api/class-testconfig), [Mock APIs](https://playwright.dev/docs/mock), [Screenshots](https://playwright.dev/docs/test-snapshots), [`toHaveScreenshot`](https://playwright.dev/docs/api/class-pageassertions), [Web server](https://playwright.dev/docs/test-webserver), [Parallelism](https://playwright.dev/docs/test-parallel)
9. Cloudflare — [Testing Workers](https://developers.cloudflare.com/workers/testing/), [Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/), [Write your first test](https://developers.cloudflare.com/workers/testing/vitest-integration/get-started/write-your-first-test/), [Isolation](https://developers.cloudflare.com/workers/testing/vitest-integration/isolation-and-concurrency/), [Migration](https://developers.cloudflare.com/workers/testing/vitest-integration/migration-guides/migrate-to-vitest-plugin/), [Test harness](https://developers.cloudflare.com/workers/testing/test-harness/get-started/); [mswjs/cloudflare](https://github.com/mswjs/cloudflare)
10. Effect — [Managing Layers](https://effect.website/docs/requirements-management/layers/), [TestClock](https://effect.website/docs/testing/testclock/), [`@effect/vitest`](https://github.com/Effect-TS/effect/blob/main/packages/vitest/README.md), `Layer.mock` jsdoc in `effect@3.22.2`
11. Google Testing Blog — [Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html), [Flaky Tests at Google](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html), [Test Flakiness](https://testing.googleblog.com/2020/12/test-flakiness-one-of-main-challenges.html), [Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html), [Test Sizes](https://testing.googleblog.com/2010/12/test-sizes.html); [Code Coverage at Google](https://research.google/pubs/code-coverage-at-google/)
12. Inozemtseva & Holmes — [Coverage Is Not Strongly Correlated with Test Suite Effectiveness](https://www.cs.ubc.ca/~rtholmes/papers/icse_2014_inozemtseva.pdf) (ICSE 2014)
13. Spotify Engineering — [Testing of Microservices](https://engineering.atspotify.com/2018/01/testing-of-microservices/)
14. GitHub Engineering — [Reducing flaky builds by 18x](https://github.blog/engineering/reducing-flaky-builds-by-18x/)
15. MSW — [Introduction](https://mswjs.io/docs/), [Node.js integration](https://mswjs.io/docs/integrations/node)
16. Pact — [What is Pact good for?](https://docs.pact.io/getting_started/what_is_pact_good_for)
17. Sanity — [TypeGen](https://www.sanity.io/docs/apis-and-sdks/sanity-typegen), [groq-js](https://github.com/sanity-io/groq-js)
18. Chromatic — [Font loading](https://www.chromatic.com/docs/font-loading/), [Animations](https://www.chromatic.com/docs/animations/)
19. Stryker — [Introduction](https://stryker-mutator.io/docs/), [Vitest runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/)
20. testing-library — [react-testing-library#1209](https://github.com/testing-library/react-testing-library/issues/1209) (async RSC, open)

Not consulted: blog aggregators, Stack Overflow, or any secondary summary of the above.
