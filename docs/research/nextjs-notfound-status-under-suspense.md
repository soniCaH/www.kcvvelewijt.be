# `notFound()` returns 200 under `loading.tsx` — what the primary sources say

Research for [#2968](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2968). Written 2026-09-15 against
Next.js **16.3.5** (`apps/web/package.json`), React **19.3.0**, Turbopack, `cacheComponents` **not** enabled.

Sources are official Next.js docs (the pages self-report `version: 16.3.5`), the `vercel/next.js` source on
`canary`, the `vercel/next.js` issue and discussion tracker, and react.dev. No blog posts, no Stack Overflow.

**Filed under `docs/research/`** because that is the established convention here — the folder already holds the
repo's research corpus with [`README.md`](./README.md) as its front door. There is no `docs/adr/` in this repo
(CLAUDE.md references one, but it does not exist on disk), so an ADR was not an option.

---

## Answer

**Yes, with caveats — the proposed fix is not just sound, it is the pattern the Next.js docs themselves print,
verbatim, as the way to get a real 404.** The
[streaming guide's "When does streaming start?"](https://nextjs.org/docs/app/guides/streaming#when-does-streaming-start)
section shows exactly our shape — `await` a fast existence check at the top of the page, `notFound()`, then an
explicit `<Suspense>` around the slow sub-tree — with the inline comment `// Real 404, before any Suspense
boundary`, and it rests on two documented invariants (React's shell is everything outside a `<Suspense>`
boundary, and the body only starts streaming when a fallback renders), not on an implementation detail. The
caveats are real and this repo trips two of them: **five of the affected routes have a second `loading.tsx` in
an ancestor segment**, so deleting the segment-local one leaves them inside a boundary and still at 200, and the
whole approach is voided if `cacheComponents` is ever turned on.

---

## 1. Is this documented, intended behaviour or a bug?

**Documented and intended.** It is stated in three separate places in the current docs, and confirmed by the
Next.js lead in the tracker.

### 1.1 What the docs say

The [Streaming guide](https://nextjs.org/docs/app/guides/streaming) carries a section literally titled
**"The HTTP contract"**:

> Once streaming begins, the HTTP response headers (including the status code) have already been sent to the
> client. **You cannot change the status code or headers after streaming starts.** Everything in this section
> flows from this fundamental constraint.

and, under [Status codes](https://nextjs.org/docs/app/guides/streaming#status-codes):

> When a `<Suspense>` fallback renders or a component suspends, the server must commit to `200 OK` in order to
> start sending the HTML stream. If a [`notFound()`](https://nextjs.org/docs/app/api-reference/functions/not-found)
> fires mid-stream, Next.js cannot go back and change the status to 404. Instead, it injects
> `<meta name="robots" content="noindex">` into the streamed HTML so that search engines don't index the page.

The [`loading.js` reference](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes)
repeats it and names the soft-404 consequence explicitly:

> Some crawlers may label these responses as "soft 404s". In the streaming case, this does not lead to
> indexation because the page is explicitly marked `noindex` in the HTML.
>
> If you need a 404 status, for compliance or analytics, ensure the resource exists before the response body is
> streamed, so that the server can set the HTTP status code.

and in its collapsed *"When is the response body streamed?"* note:

> The response body starts streaming when a Suspense fallback renders (for example, a `loading.tsx`) or when a
> Server Component suspends under a `Suspense` boundary. Place `notFound()` before those boundaries and before
> any `await` that may suspend.
>
> To start streaming, the response headers must be set. This is why it is not possible to change the status code
> after streaming started.

The [`notFound()` API reference](https://nextjs.org/docs/app/api-reference/functions/not-found) has a worked
example headed *"Calling `notFound()` after streaming has started"* that ends:

> The trade-off is the HTTP status code. Because the check runs inside the `<Suspense>` boundary, the response
> has already begun streaming as a `200`, and the status can't change once streaming has started. The `noindex`
> tag keeps a soft 404 out of search results.

The same paragraph appears verbatim in the
[`forbidden()` reference](https://nextjs.org/docs/app/api-reference/functions/forbidden) — so `forbidden()` and
`unauthorized()` inherit the identical constraint, not a different one.

The critical structural fact, from the
[`loading.js` reference](https://nextjs.org/docs/app/api-reference/file-conventions/loading#instant-loading-states):

> In the [component hierarchy], `loading.js` wraps `not-found.js`, `page.js`, and nested `layout.js` files in a
> `<Suspense>` boundary. It does **not** wrap the `layout.js`, `template.js`, or `error.js` in the same segment.

### 1.2 The upstream record

Every issue filed against this symptom has been closed. None was closed as *fixed*.

| Issue / discussion | Filed against | State | Outcome |
| --- | --- | --- | --- |
| [#45801](https://github.com/vercel/next.js/issues/45801) *notFound returns a 200 when loading.tsx is used* | 13.1 | closed `NOT_PLANNED`, locked | Closed by maintainer **ztanner** as expected behaviour |
| [#53225](https://github.com/vercel/next.js/discussions/53225) *Support custom HTTP Status Code for Server Components* | — | **open**, answered | Answered by **timneutkens**: cannot work |
| [#59521](https://github.com/vercel/next.js/issues/59521) *Suspense/loading.tsx in root layout breaks 404, redirects* | 13.5 | closed 2026-09-01 | Closed "as expected behavior" |
| [#62228](https://github.com/vercel/next.js/issues/62228) *404 page isn't server rendered when using notFound()* | 14.1 | **OPEN / REOPENED**, 36 comments | Adjacent (SSR of the 404 body), still open |
| [#70447](https://github.com/vercel/next.js/issues/70447) *notFound() with top-level `<Suspense>` gives 200* | 14.x | closed same day | Answered by a contributor, not core |
| [#76474](https://github.com/vercel/next.js/issues/76474) / [discussion #76501](https://github.com/vercel/next.js/discussions/76501) | 15.x | closed | Vercel member **samcx**: "this does not lead to incorrect indexing" |
| [#93008](https://github.com/vercel/next.js/issues/93008) | 16.2.3 | closed 15s by bot, locked | Auto-closed `invalid link` |
| [#93239](https://github.com/vercel/next.js/issues/93239) | **16.3.0-canary.2** | closed 13s by bot | Auto-closed `invalid link` |
| [#98518](https://github.com/vercel/next.js/issues/98518) *notFound() returns 200 when cacheComponents is enabled* | **16.3.4** | closed 16s by bot | Auto-closed `invalid link` |

**The maintainer statements, in order of authority:**

**timneutkens** (Next.js lead), the marked answer on
[discussion #53225](https://github.com/vercel/next.js/discussions/53225#discussioncomment-6562537):

> This proposal can't work because of limitations with streaming, specifically you can't set the status code
> after the headers have been sent and the stream has started. […] TLDR: because of streaming rendering and the
> preinitialization (preamble part of the request) in React you can't modify the status / headers, that's also
> why you can't set cookies / set headers during server components rendering.

**ztanner**, closing [#45801](https://github.com/vercel/next.js/issues/45801#issuecomment-2104816811) on
2024-05-10:

> Hi - this behavior is expected and documented […] When a response is streamed, a 200 status code is sent
> immediately. Once the `notFound()` part is streamed in, it's not possible to change the status code. However,
> Next.js will insert a `<meta name="robots" content="noindex" />` tag, signaling to crawlers that the not found
> page should not be indexed.

**marcoshernanz**, closing [#59521](https://github.com/vercel/next.js/issues/59521) on 2026-09-01 — the most
recent statement, two weeks old at time of writing:

> A root `Suspense` or `loading.tsx` boundary starts streaming, which commits the HTTP headers. A later
> `notFound()` or `redirect()` therefore cannot change the response status. […] **A real 404, 307, or 308
> requires the check or redirect to happen before streaming starts.** Closing as expected behavior.

**leerob**, on [#53225](https://github.com/vercel/next.js/discussions/53225), confirming the docs were amended
rather than the behaviour fixed:

> This has been updated in the documentation to: Next.js will return a 200 HTTP status code for streamed
> responses, and 404 for non-streamed responses.

> **Read the closures carefully.** Three of the nine rows above were closed within ~15 seconds by
> `github-actions` for a missing reproduction link — not by a human, and not on the merits. `#93239` in
> particular **did** supply a public repro
> ([`holdenjrussell/next-93008-repro`](https://github.com/holdenjrussell/next-93008-repro), which is public and
> exists — verified), and the bot closed it anyway. "CLOSED COMPLETED" on those rows means nothing. They are
> useful as evidence that the symptom is still live on 16.3.x, not as a verdict.

---

## 2. The mechanism — why an early flush commits the status

Three layers, each verifiable.

### 2.1 HTTP: the status line comes first

A streamed response uses
[chunked transfer encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Transfer-Encoding).
[RFC 9112 §2.1](https://www.rfc-editor.org/rfc/rfc9112#section-2.1) fixes the wire order: a response is a
status-line, then header fields, then the body. Once the first body octet is on the socket the status line is
already gone. There is no retraction mechanism in HTTP/1.1.

### 2.2 React: the shell is the only place a status can still be set

From [`renderToReadableStream`](https://react.dev/reference/react-dom/server/renderToReadableStream), the shell
is *"the part of your app outside of any `<Suspense>` boundaries"*. The returned promise resolves when that
shell is done and rejects if it errors:

> If the shell errors, your `catch` block will run which lets you set the error status code. Otherwise, you know
> that the app may recover on the client, so you can send 'OK'.

And the decisive sentence for anything thrown *below* a boundary:

> If a component outside the shell (i.e. inside a `<Suspense>` boundary) throws an error, React will not stop
> rendering. This means that the `onError` callback will fire, but your code will continue running without
> getting into the `catch` block. This is because React will try to recover from that error on the client.

React states the constraint flatly: **"Once you start streaming, you can no longer set the response status
code."**

### 2.3 Next.js: `notFound()` is a thrown error, and the status is set in a `catch` around shell-ready

`notFound()` does not set a status. It throws a tagged error. From
[`packages/next/src/client/components/http-access-fallback/http-access-fallback.ts`](https://github.com/vercel/next.js/blob/canary/packages/next/src/client/components/http-access-fallback/http-access-fallback.ts):

```ts
export const HTTPAccessErrorStatus = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  UNAUTHORIZED: 401,
}

export const HTTP_ERROR_FALLBACK_ERROR_CODE = 'NEXT_HTTP_ERROR_FALLBACK'
```

The status is read back off that error's `digest` and assigned inside a `catch` in
[`packages/next/src/server/app-render/app-render.tsx`](https://github.com/vercel/next.js/blob/canary/packages/next/src/server/app-render/app-render.tsx)
(canary, fetched 2026-09-15 — around line 4382; `notFound()`, `forbidden()` and `unauthorized()` all land here):

```ts
} catch (err) {
  // ...
  if (isHTTPAccessFallbackError(err)) {
    res.statusCode = getAccessFallbackHTTPStatus(err)
    metadata.statusCode = res.statusCode
    errorType = getAccessFallbackErrorTypeByStatus(res.statusCode)
  } else if (isRedirectError(err)) {
    // ...
  } else if (!shouldBailoutToCSR) {
    res.statusCode = 500
    metadata.statusCode = res.statusCode
  }
```

The `try` that this `catch` guards wraps an `await` on the Fizz render:

```ts
const { stream: htmlStream, allReady } = await workUnitAsyncStorage.run(
  requestStore,
  renderToWebFizzStream,
  appElement,
  fizzOptions
)
```

And `renderToWebFizzStream`, in
[`packages/next/src/server/app-render/stream-ops.web.ts`](https://github.com/vercel/next.js/blob/canary/packages/next/src/server/app-render/stream-ops.web.ts),
is a thin wrapper over React's shell-ready promise:

```ts
export async function renderToWebFizzStream(
  element: React.ReactElement,
  streamOptions: any,
  _options?: { waitForAllReady?: boolean }
): Promise<FizzStreamResult> {
  const stream = await renderToInitialFizzStream({
    ReactDOMServer: { renderToReadableStream },
    element,
    streamOptions,
  })
  return { stream, allReady: stream.allReady, abort: undefined }
}
```

That closes the loop:

- `notFound()` thrown **in the shell** → `renderToReadableStream`'s promise rejects → the `await` throws → the
  `catch` runs → `res.statusCode = 404` is set **before any byte is written**. Real 404.
- `notFound()` thrown **under a `<Suspense>`** → React recovers per its own documented contract, the promise
  resolves normally with a 200 shell, the `catch` **never runs**, and the 404 arrives only as streamed-in
  `not-found` HTML plus a `noindex` meta tag. Soft 404.

A `loading.tsx` is precisely the thing that moves `page.tsx` out of the shell. That is the whole bug, and the
11-for-11 correlation in #2968 is the expected result, not a coincidence.

> **Corollary worth keeping:** the same `catch` is what sets `res.statusCode = 500`. A route that streams first
> cannot return a real 500 either. Our error boundaries under `loading.tsx` are also answering 200.

---

## 3. The sanctioned ways to get a true 404

| Option | What it does | What it costs | Documented, or implementation detail? |
| --- | --- | --- | --- |
| **`notFound()` before any boundary / any suspending `await`** | Throws in the shell, so the `catch` sets 404 before the first byte | You must have a *cheap* existence check; everything above it blocks TTFB | **Documented, and the stated recommendation** — [streaming guide](https://nextjs.org/docs/app/guides/streaming#when-does-streaming-start), [`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes) |
| **Explicit `<Suspense>` inside the page, below the check** | Keeps the skeleton for the slow sub-tree while the check stays in the shell | Skeleton no longer covers the whole page; no route-level prefetched fallback | **Documented** — the exact code sample in [streaming guide](https://nextjs.org/docs/app/guides/streaming#when-does-streaming-start) |
| **`not-found.tsx`** | Supplies the *UI* only. Sets no status | Nothing | Documented — [`not-found.js`](https://nextjs.org/docs/app/api-reference/file-conventions/not-found). **Does not fix status.** #2968 attempt 1 correctly measured this |
| **`dynamicParams = false` + `generateStaticParams`** | Unknown params 404 at the routing layer, before render | Anything published between deploys 404s. Fatal for `/nieuws/[slug]`. **Removed entirely under `cacheComponents`** | Documented — [`dynamicParams`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/dynamicParams): *"`false`: Dynamic route segments not included in `generateStaticParams` will return a 404"* |
| **`proxy.ts`** (Next 16's rename of `middleware.ts`) | Existence check at the edge; `return new Response(null, { status: 404 })` or rewrite to a 404 route | Needs a slug set reachable at the edge; a second data round-trip; Vercel invocations | **Documented, and the recommendation under Cache Components** — [`loading.js#status-codes`](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes), [`proxy` → Producing a response](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#producing-a-response) |
| **`next.config.js` `redirects()`** | Runs before the render, so a real 3xx | Only for known static paths | Documented — the streaming guide's *"Good to know"* names both `proxy` and `redirects` as "run before the page renders, so HTTP status codes are still available" |
| **Route Handler + `notFound()`** | In a `route.ts`, `notFound()` "serves a `404` to the caller" | Not a page | Documented — [`notFound()` → Serving a 404 from a Route Handler](https://nextjs.org/docs/app/api-reference/functions/not-found) |
| **`unstable_rethrow`** | Stops a `try/catch` from swallowing the `NEXT_HTTP_ERROR_FALLBACK` sentinel | API is marked unstable and *"not recommended for production"* | Documented — [`unstable_rethrow`](https://nextjs.org/docs/app/api-reference/functions/unstable_rethrow). **Fixes swallowed interrupts, not streamed status** |
| **`forbidden()` / `unauthorized()`** | 403 / 401 via the identical `HTTPAccessErrorStatus` path | Needs `experimental.authInterrupts`; experimental | Documented — [`forbidden`](https://nextjs.org/docs/app/api-reference/functions/forbidden) (v15.1.0). **Same streaming constraint, word for word** |
| **`export const dynamic = 'force-dynamic'`** | Nothing, for this | — | Reported ineffective in [#93239](https://github.com/vercel/next.js/issues/93239); matches the mechanism (it does not remove the boundary). Also a build error under `cacheComponents` |
| **`export const instant = false`** | Navigation *validation* only | — | Documented — [`instant`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant). It is about surfacing blocking navigations, **not** about blocking the shell. Explains why it failed in [#98518](https://github.com/vercel/next.js/issues/98518) |

**The documented recommendation is the first two rows together.** Everything else is either a different problem
or a fallback for when the check cannot be made cheap enough to sit in the shell.

Note for #2968's own options table: **"Middleware" should read `proxy.ts`.** The `middleware` file convention is
deprecated as of v16.0.0 and renamed; there is a codemod
(`npx @next/codemod@canary middleware-to-proxy .`). Vercel's own framing in that doc is *"we recommend users
avoid relying on Middleware unless no other options exist"*
([Migration to Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#migration-to-proxy)).

---

## 4. Does our proposed fix hold?

**The pattern: yes.** It is not an inference — it is printed in the docs. From
[Streaming → When does streaming start?](https://nextjs.org/docs/app/guides/streaming#when-does-streaming-start),
quoted in full because it *is* the proposal:

```tsx
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const exists = await checkSlugExists(slug) // Fast existence check
  if (!exists) notFound() // Real 404, before any Suspense boundary

  return (
    <Suspense fallback={<p>Loading post...</p>}>
      <PostContent slug={slug} />
    </Suspense>
  )
}
```

### Is there a guarantee, or could it regress?

It is as close to a guarantee as this surface offers, and it rests on **documented** invariants rather than
observed behaviour:

1. React defines the shell as *"the part of your app outside of any `<Suspense>` boundaries"*
   ([react.dev](https://react.dev/reference/react-dom/server/renderToReadableStream)). The page function body is
   outside the `<Suspense>` it returns, so it is shell.
2. Next states the body *"starts streaming when a Suspense fallback renders […] or when a Server Component
   suspends under a `Suspense` boundary"*
   ([`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes)). An
   `await` in the page body with no boundary above it is neither, so nothing flushes.
3. React resolves `renderToReadableStream`'s promise only once the shell is complete, and Next sets the status
   in the `catch` around that `await` (§2.3). The page body must therefore run to completion first.

So the status can still be set. This is documented behaviour, not an accident of the current code path — and it
is the **same** behaviour our three control routes (`/player`, `/players`, `/staff`, all with no `loading.tsx`
anywhere in their ancestry) already demonstrate at 404.

### The caveats — two of which this repo trips

**(a) Ancestor `loading.tsx`. This is the one that will bite.** A `loading.js` wraps *"the `page.js` file and
any children below"* ([`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading#instant-loading-states)) —
so a `loading.tsx` two segments up still puts the page under a boundary. Mapping the actual tree in
`apps/web/src/app`:

| Route | `loading.tsx` above it (nearest first) | Enough to delete the segment-local one? |
| --- | --- | --- |
| `(main)/nieuws/[slug]` | `nieuws/[slug]/loading.tsx` | yes |
| `(main)/spelers/[slug]` | `spelers/[slug]/loading.tsx` | yes |
| `(main)/staf/[slug]` | `staf/[slug]/loading.tsx` | yes |
| `(main)/wedstrijd/[matchId]` | `wedstrijd/[matchId]/loading.tsx` | yes |
| `(main)/evenementen/[slug]` | `evenementen/[slug]/loading.tsx`, **`evenementen/loading.tsx`** | **no — 2 boundaries** |
| `(main)/galerij/[slug]` | `galerij/[slug]/loading.tsx`, **`galerij/loading.tsx`** | **no — 2 boundaries** |
| `(main)/ploegen/[slug]` | `ploegen/[slug]/loading.tsx`, **`ploegen/loading.tsx`** | **no — 2 boundaries** |
| `(main)/ploegen/[slug]/wedstrijden` | `wedstrijden/loading.tsx`, **`ploegen/[slug]/loading.tsx`**, **`ploegen/loading.tsx`** | **no — 3 boundaries** |
| `(landing)/jeugd/[slug]` | **`jeugd/loading.tsx`**, **`(landing)/loading.tsx`** — no segment-local one at all | **no — 2 boundaries, neither local** |
| `(main)/club/[slug]` † | `club/[slug]/loading.tsx`, **`club/loading.tsx`** | **no — 2 boundaries** |
| `(main)/tegenstander/[clubId]` † | `tegenstander/[clubId]/loading.tsx` | yes |
| `player/[slug]`, `players/[slug]`, `staff/[slug]` | none | already 404 (the controls) |

† **Two routes #2968's table does not list.** `(main)/club/[slug]` calls `notFound()` (page.tsx:82) and
`(main)/tegenstander/[clubId]` calls it twice (page.tsx:310, 313); both sit under a `loading.tsx`. If the
11-for-11 rule holds, both are soft 404s too. They should be measured and added to the issue's scope.

Deleting the segment-local `loading.tsx` on a route that has an ancestor one will change nothing visible in the
status and will look like the fix failing. It has not failed; the route is still inside a boundary.

**(b) The root layout must not suspend above the page.** `apps/web/src/app/layout.tsx` is an `async` Root
Layout that does `await runPromise(...)` at line 76. An `await` is fine — it *blocks* the shell, it does not
create a boundary. What would break the fix is a `<Suspense>` in the root or group layout. There is none today
(the only `<Suspense>` uses in `src/app` are inside `evenementen/page.tsx`, `hulp/page.tsx`,
`ploegen/[slug]/page.tsx`, `zoeken/page.tsx` and `evenementen/loading.tsx`). This is exactly the failure mode
several reporters hit in [discussion #61486](https://github.com/vercel/next.js/discussions/61486) ("remove
global Suspense") — worth an ESLint or test guard so nobody reintroduces one.

**(c) The check must be genuinely cheap, and it is now on the critical path.** Everything before the
`<Suspense>` blocks TTFB. The docs' own advice elsewhere in the same guide pulls the other way — *"Push dynamic
access down"*, *"if there's a Suspense boundary, React might use it"* — so this is a deliberate,
documented-as-a-trade-off inversion, not a free win.

**(d) Verify across the ISR cache, not just the first render.** Nine of the affected routes export `revalidate`
(`nieuws` 900, `wedstrijd` 300, `galerij` 86400, …). Getting the status to survive the ISR cache required a
dedicated upstream fix once already —
[PR #55542 *"Fix notFound status code with ISR in app"*](https://github.com/vercel/next.js/pull/55542), merged
2023-09-18. Measure a cold `MISS` **and** a warm `HIT` **and** a `STALE` before calling it done.

**(e) The skeleton is not a free port.** `loading.tsx` fallbacks are *prefetched* on client navigation; an
in-page `<Suspense>` fallback is *"Not prefetched by default"*
([`loading.js` vs `<Suspense>` table](https://nextjs.org/docs/app/guides/streaming#when-to-use-loadingjs-vs-suspense)).
Client-side navigation into these routes will feel different even with a pixel-identical skeleton. The existing
`loading.test.tsx` / skeleton stories are testing a component whose mount point moves.

---

## 5. PPR / `cacheComponents`

**If `cacheComponents` is enabled, every option above except `proxy` stops working.** We do not have it enabled
(no `cacheComponents` key in `apps/web/next.config.ts`), so this is a constraint on the future, not on now.

Next.js docs, [`notFound()`](https://nextjs.org/docs/app/api-reference/functions/not-found) — this is the
primary source, stated as a fact about the product:

> To return a real `404` status, the resource has to be checked before the response streams. **With
> [Cache Components](https://nextjs.org/docs/app/getting-started/caching), every dynamic route streams a static
> shell first, so run that check in [`proxy`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
> instead.**

So: **yes, a prerendered shell forces a 200.** `cacheComponents`
[*"implements Partial Prerendering (PPR) as the default behavior in the App Router"*](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
and *"Next.js prerenders a static HTML shell that is served immediately while dynamic content streams in"* — the
shell is committed before the page's data access runs, by design. There is no in-render escape.

Two further doors close with it:

- `dynamic`, `dynamicParams`, `revalidate` and `fetchCache` are **removed** when Cache Components is enabled
  ([route-segment-config version history, v16.0.0](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#version-history);
  [`dynamicParams`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/dynamicParams):
  *"`dynamicParams` is not available when Cache Components is enabled"*). So the
  `dynamicParams = false` route disappears too.
- `export const instant = false` is **not** an escape hatch here. Per the
  [`instant` reference](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant),
  it *"controls how Next.js validates whether a navigation into this segment would produce an instant UI"* —
  a dev-time validation lever, nothing to do with flushing. [#98518](https://github.com/vercel/next.js/issues/98518)
  (filed 2026-09-10 against 16.3.4) reports trying `instant = false` on the page, `instant = false` on the root
  layout, `await connection()`, and an empty `<Suspense fallback={null}>` above `<body>`, and getting 200 from
  all four.

**Practical consequence for us:** the fix in §4 is correct for today's config, and it is also the thing that
makes a future `cacheComponents` migration *more* expensive, because at that point the check has to move to
`proxy.ts` anyway. If a Cache Components migration is on the roadmap, building the `proxy.ts` slug check now
would be the option that survives both.

---

## 6. Anything newer

**No.** No API, RFC, flag, or in-flight PR was found that lets a streamed render set a status code.

- Searching `vercel/next.js` PRs for status-code work on this path returns one result,
  [PR #55542](https://github.com/vercel/next.js/pull/55542) (2023), which is about ISR persistence of an
  *already-set* 404 — not about setting one mid-stream.
- The one standing feature request,
  [discussion #53225 *"Support custom HTTP Status Code for Server Components"*](https://github.com/vercel/next.js/discussions/53225),
  is **still open after three years** with the lead's "can't work" as its marked answer. Requests in that thread
  for `410 Gone` and `400` are unanswered.
- The most recent maintainer touch on the topic is
  [#59521 closed 2026-09-01](https://github.com/vercel/next.js/issues/59521) — *"Closing as expected
  behavior."* Two weeks old. The direction is being reaffirmed, not revisited.
- The docs moved the other way: the current `notFound()`, `forbidden()`, `loading.js` and Streaming pages were
  all rewritten in 2026 (`lastUpdated` 2026-07-24, 2026-07-24, 2026-06-08, 2026-08-25) to **explain** the
  constraint and hand you the "check before the boundary" pattern. Documenting it harder is the fix Vercel
  shipped.
- Vercel's stated position on the SEO harm, from member **samcx** on
  [#76501](https://github.com/vercel/next.js/discussions/76501): *"this does not lead to incorrect indexing"* —
  because of the injected `noindex`. The `loading.js` docs cite
  [Google's robots meta tag guidance](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
  for this. That is the same mitigation already shipped in the #2963 PR.

---

## 7. The separate `/wedstrijd/<unknown>` → 500

Different bug, same family. Mechanism, from
`apps/web/src/app/(main)/wedstrijd/[matchId]/page.tsx`: `fetchMatchOrNotFound` maps only the BFF's tagged
`HttpNotFound` to `notFound()` (line 203), deliberately narrow per #2782 — a `ParseError` or
`HttpApiDecodeError` is left to reject, which hits the `else if (!shouldBailoutToCSR) { res.statusCode = 500 }`
branch in `app-render.tsx` (§2.3).

So a 500 means the BFF read is **not** producing `HttpNotFound` for that id — it is failing some other way. That
is an `apps/api` question, not a Next.js one, and the fix does not belong in this document. Two things this
research does settle about it:

- It is **not** the streaming bug. 500 proves the shell error path *ran* — i.e. the status **was** settable and
  Next set it to 500. `/wedstrijd/[matchId]` has a `loading.tsx`, so this is a surprise worth chasing on its own:
  under the §2.3 mechanism a route under a boundary should have answered 200. Either the throw is escaping
  before the boundary is established, or `generateMetadata` is rejecting first. **Measure where the throw
  originates before assuming.**
- Whatever produces it, once the §4 fix lands on this route the check moves into the shell and the *status* will
  be settable — but it will be settable to whatever the error classifies as. A 404 still requires the BFF to
  return `HttpNotFound`.

---

## 8. Unknown / could not verify from a primary source

These are open. Do not let a plausible-sounding answer stand in for one.

1. **Why #2968's fix attempt 3 (an existence-checking `layout.tsx`) failed.** The docs are explicit that
   `loading.js` *"does not wrap the `layout.js` […] in the same segment"*, which predicts a **same-segment**
   layout would throw in the shell and set the 404. The issue records the attempt as failing but not *where the
   layout was placed*. If it was placed in a segment that has an ancestor `loading.tsx` (see §4a), the failure is
   fully explained and the doc is not contradicted. **Unverified either way — the placement is not recorded, and
   I did not re-run it.**
2. **Whether streaming metadata opens a boundary of its own.** Next streams `generateMetadata` for DOM-capable
   user agents ([streaming guide → Bots and crawlers](https://nextjs.org/docs/app/guides/streaming#bots-and-crawlers)).
   I could not find a primary source stating whether that mechanism introduces a Suspense boundary above the page
   tree. The 11-for-11 correlation argues it does not — the three control routes use `generateMetadata` and still
   return 404 — but that is our own inference from our own measurement, **not a cited fact**.
3. **Whether the fix survives Turbopack specifically.** Every source above is runtime/renderer-level and
   bundler-agnostic, and nothing in the tracker ties this symptom to Turbopack. I found **no** primary source
   confirming or denying a Turbopack-specific difference. #2968 reproduced with Turbopack; the controls also ran
   under Turbopack and returned 404, which is the only evidence we have.
4. **Whether `proxy.ts` on Vercel can return a 404 status without a rewrite round-trip cheaply enough** for our
   slug volume. The API supports `return Response.json(..., { status })`
   ([Producing a response](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#producing-a-response)),
   but I have no primary source on invocation cost or on a documented pattern for holding ~400 Sanity/PSD slugs
   at the edge. **Not researched.**
5. **The exact `app-render.tsx` line numbers** cited in §2.3 are from `canary` fetched 2026-09-15, not from the
   16.3.5 release tag. The *code* is what matters and the surrounding logic is stable across the 16.3.x issues
   cited, but the line numbers will drift. Re-grep for `isHTTPAccessFallbackError` rather than trusting them.
6. **Whether `(main)/club/[slug]` and `(main)/tegenstander/[clubId]` actually return 200.** Inferred from the
   11-for-11 rule plus a `loading.tsx` plus a `notFound()` call — **not measured**. Run the `curl` check from
   #2968 against both before adding them to the issue.

---

## Sources

Next.js documentation (all self-reporting `version: 16.3.5`):

- [Streaming — The HTTP contract](https://nextjs.org/docs/app/guides/streaming#the-http-contract) *(lastUpdated 2026-08-25)*
- [`loading.js` — Status Codes](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes) *(2026-06-08)*
- [`notFound()`](https://nextjs.org/docs/app/api-reference/functions/not-found) *(2026-07-24)*
- [`forbidden()`](https://nextjs.org/docs/app/api-reference/functions/forbidden) *(2026-07-24)*
- [`unstable_rethrow`](https://nextjs.org/docs/app/api-reference/functions/unstable_rethrow) *(2026-03-03)*
- [`dynamicParams`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/dynamicParams) *(2026-03-13)*
- [`instant`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant) *(2026-08-03)*
- [`proxy.js`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) *(2026-09-07)*
- [`cacheComponents`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) *(2026-06-22)*
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) *(2026-04-30)*

React:

- [`renderToReadableStream`](https://react.dev/reference/react-dom/server/renderToReadableStream)
- [`<Suspense>` — what activates a Suspense boundary](https://react.dev/reference/react/Suspense#what-activates-a-suspense-boundary)

Next.js source (`canary`, fetched 2026-09-15):

- [`http-access-fallback.ts`](https://github.com/vercel/next.js/blob/canary/packages/next/src/client/components/http-access-fallback/http-access-fallback.ts)
- [`app-render.tsx`](https://github.com/vercel/next.js/blob/canary/packages/next/src/server/app-render/app-render.tsx)
- [`stream-ops.web.ts`](https://github.com/vercel/next.js/blob/canary/packages/next/src/server/app-render/stream-ops.web.ts)

Tracker:

- [#45801](https://github.com/vercel/next.js/issues/45801) ·
  [#53225](https://github.com/vercel/next.js/discussions/53225) ·
  [#59521](https://github.com/vercel/next.js/issues/59521) ·
  [#61486](https://github.com/vercel/next.js/discussions/61486) ·
  [#62228](https://github.com/vercel/next.js/issues/62228) ·
  [#70447](https://github.com/vercel/next.js/issues/70447) ·
  [#76474](https://github.com/vercel/next.js/issues/76474) ·
  [#76501](https://github.com/vercel/next.js/discussions/76501) ·
  [#93008](https://github.com/vercel/next.js/issues/93008) ·
  [#93239](https://github.com/vercel/next.js/issues/93239) ·
  [#98518](https://github.com/vercel/next.js/issues/98518) ·
  [PR #55542](https://github.com/vercel/next.js/pull/55542)

Specs:

- [RFC 9112 §2.1 — HTTP/1.1 Message Format](https://www.rfc-editor.org/rfc/rfc9112#section-2.1)
- [MDN — Transfer-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Transfer-Encoding)
- [Google Search Central — robots meta tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
