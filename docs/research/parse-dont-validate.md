# Parse, don't validate: where untrusted input enters this codebase, and how it is decoded

> Triggered by [#3861](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3861) and
> [#3863](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3863): `apps/web/src/app/api/revalidate/route.ts`
> cast a signed Sanity webhook body `as WebhookBody` and trusted each field's type. That route is
> being reworked to an Effect Schema in its own branch, so this document only names it.
> Written 2026-11-25. **Nothing in the code was changed and no issue was filed.**
>
> Repo facts are read from `origin/main` at `5f386e4a4`, with `git show` and `git grep`. Every count
> below comes with the command that produced it, so it can be re-run. Versions are the **installed**
> ones: `effect` **3.22.5**, `@effect/platform` **0.97.2**. API claims are checked against their
> `.d.ts` in `node_modules/.pnpm/effect@3.22.5/node_modules/effect/dist/dts/` (below: `effect/dts/`)
> and `node_modules/.pnpm/@effect+platform@0.97.2_effect@3.22.5/node_modules/@effect/platform/dist/dts/`
> (below: `platform/dts/`). The snippets in §4 that touch `parseJson`, brands and `Schema.Config` were
> run once against the installed `effect` in the session scratchpad.

## The question

How well does the codebase follow Alexis King's
["Parse, don't validate"](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
(2019)? Where does untrusted or unknown input enter? Is each input decoded once, at the edge, into a
typed value with Effect Schema? And which Effect Schema APIs close each gap?

## Answer

**The trust boundaries mostly parse already.** Every BFF endpoint decodes its request through
`HttpApi` (`packages/api-contract/src/api/`). Both BFF webhooks verify the signature, then decode
the body with `S.decodeUnknown(WebhookPayload)`. Every PSD response is decoded with a schema. The web
server reads the BFF only through `HttpApiClient.make(PsdApi)`, so every BFF response is decoded
against the same contract the worker serves. **The gaps sit one layer in.** These reads keep a
compile-time type but have no runtime check: KV cache reads cast with `as` (the repo's own rule
forbids this), Sanity reads typed with a generic (`client.fetch<T>`), browser reads of BFF responses
cast with `as` (the contract schemas for them already exist), two public server actions, and env vars.
**No lint rule enforces any of it.** The one written rule, in `docs/agents/code-patterns.md:13`, is
broken at four sites.

## 1. The principle

The essay's own words, by section:

- _The power of parsing_: "Really, a parser is just a function that consumes less-structured input
  and produces more-structured output." And: "the difference between validation and parsing lies
  almost entirely in how information is preserved". A validator returns `()`; a parser returns the
  refined type, so the check cannot be forgotten.
- _The danger of validation_: it quotes the LangSec definition of **shotgun parsing**: "parsing and
  input-validating code is mixed with and spread across processing code—throwing a cloud of checks
  at the input, and hoping, without any systematic justification, that one or another would catch
  all the “bad” cases."
- _Parsing, not validating, in practice_: "Use a data structure that makes illegal states
  unrepresentable." And: "Get your data into the most precise representation you need as quickly as
  you can. Ideally, this should happen at the boundary of your system, before any of the data is
  acted upon."
- Same section: "Don’t be afraid to parse data in multiple passes." And: "Use abstract datatypes to
  make validators “look like” parsers" (a smart constructor; in Effect, a brand).

In TypeScript, `x as T` and `fetch<T>()` are the purest form of the anti-pattern. They check nothing
and still hand the caller a `T`.

## 2. Today's state

"At the edge" means: decoded by a schema, or by a hand-written function that returns the typed
value (a parser in the essay's sense), before any other code reads a field.

| Input class                                        |    Sites | Parsed at the edge | Of those, by Effect Schema |
| -------------------------------------------------- | -------: | -----------------: | -------------------------: |
| 1. Web route handlers, server actions, URL         |       13 |                  8 |                          0 |
| 2. Webhooks (signed body, read-back)               |        5 |                  3 |                          2 |
| 3a. `JSON.parse` in `apps/*/src`, `packages/*/src` |       18 |                 12 |                          4 |
| 3b. `.json()` on a response or request             |       13 |                  6 |                          2 |
| 3c. Storage, `postMessage`, cookies                |        2 |                  2 |                          0 |
| 4. Upstream responses (PSD, Sanity, BFF, AI)       | 9 groups |           2 groups |                   2 groups |
| 5. Env and config                                  |   2 apps |                  0 |                          0 |
| 6. Forms                                           |        3 |                  1 |                          1 |
| 7. Scripts                                         |        4 |                  1 |                          0 |

Rows overlap where a site is both a `JSON.parse` and a webhook (it is counted in both). Pass-through
proxies count as parsed: a proxy that forwards bytes it never reads is correct, because the BFF
decodes them.

## 3. The full inventory

Legend for **today**: **Schema** (Effect Schema decode), **cast** (`as T` or a typed annotation on
`any`), **generic** (`fetch<T>`: a cast in disguise), **hand** (`typeof` checks that return the
typed value), **pass** (forwarded unread), **none**.

### 3.1 Next.js route handlers, server actions and URL input (`apps/web`)

Searches:

```bash
git ls-tree -r --name-only origin/main apps/web/src/app | grep -E '/route\.(ts|tsx)$'        # 9 route files
git grep -l -E "^['\"]use server['\"]" origin/main -- 'apps/web/src/*'                       # 2 action files
git grep -n -E 'request\.(json|formData|text)\(\)' origin/main -- 'apps/web/src/*' ':!*.test.*'  # 3
git grep -n -E 'searchParams' origin/main -- 'apps/web/src/app/*page.tsx' ':!*.test.*'        # 3 pages read it
```

| Site                                                    | Input                                                | Today                                                                                          | Risk                                                                                          | Fix                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/api/revalidate/route.ts:149-160`      | Signed Sanity webhook body                           | hand object check, then `as WebhookBody`                                                       | The trigger. Being fixed in #3863; out of scope here.                                         | (in progress)                                                                                                                 |
| `apps/web/src/lib/server/form-proxy.ts:61`              | Body of `POST /api/membership`, `/api/darts`         | pass (`unknown`, JSON-checked only); the BFF decodes `MembershipRequest`, `DartsSignupRequest` | None. Parsing here would duplicate the BFF.                                                   | Keep.                                                                                                                         |
| `apps/web/src/lib/server/bff-proxy.ts:29`               | Body of `POST /api/search`, `/api/search/team-guess` | pass; the BFF decodes `SearchRequest`, `TeamGuessRequest`                                      | None.                                                                                         | Keep.                                                                                                                         |
| `apps/web/src/lib/server/bff-proxy.ts:33-34`            | `x-vercel-forwarded-for`, `x-real-ip`                | hand (split, trim)                                                                             | Low. Vercel overwrites the header; the BFF only uses it as a rate-limit key.                  | Keep.                                                                                                                         |
| `apps/web/src/app/api/search/route.ts:249-271`          | `?q=`, `?type=`                                      | hand: trim, length, allowlist, but `type` stays a `string`                                     | Low. Validate-then-discard: later code re-compares strings.                                   | `S.decodeUnknownEither(S.Struct({ q: S.Trim.pipe(S.minLength(2)), type: S.optional(S.Literal(...)) }))`                       |
| `apps/web/src/app/api/calendar.ics/route.ts:181-193`    | `?teamIds=`, `?side=`, events flag                   | hand parsers: `parsePsdId`, `parseSide` return typed values                                    | None. A parser by hand.                                                                       | Optional: brand the id (§4.5).                                                                                                |
| `apps/web/src/app/api/preview/enable/route.ts:31`       | Redirect path, preview secret                        | hand parser `toSameOriginUrl` (URL or null) + `validatePreviewUrl`                             | None.                                                                                         | Keep.                                                                                                                         |
| `apps/web/src/app/api/preview/disable/route.ts:13`      | Redirect path                                        | hand parser `toSameOriginUrl`                                                                  | None.                                                                                         | Keep.                                                                                                                         |
| `apps/web/src/app/(landing)/nieuws/actions.ts:15`       | Server action args (a public POST endpoint)          | TS type only; `clampListingWindow` coerces the numbers, `category` is unchecked                | Medium. A caller can send any JSON value as `category`; it goes to GROQ as a bound parameter. | Decode the args first: `S.decodeUnknownSync(S.Struct({ offset: S.Finite, limit: S.Finite, category: S.optional(S.String) }))` |
| `apps/web/src/app/(main)/galerij/(index)/actions.ts:26` | Server action args                                   | TS type only; numbers clamped                                                                  | Low. `clampListingWindow` turns a non-number into the fallback.                               | Same struct, without `category`.                                                                                              |
| `apps/web/src/app/(landing)/nieuws/page.tsx:31,47`      | `?categorie=`                                        | cast: typed `categorie?: string`, but `?categorie=a&categorie=b` gives `string[]`              | Low-medium. An array reaches the GROQ read and `initialCategory`, a prop typed `string`.      | Type it honestly and narrow, as `share/page.tsx` does (`firstParam`), or `S.decodeUnknownOption(S.String)`.                   |
| `apps/web/src/app/(main)/kalender/page.tsx:171-185`     | `?type=`, `?view=`, subscribe flag                   | honest type (`string` or `string[]`), narrowed by the widget                                   | None.                                                                                         | Keep.                                                                                                                         |
| `apps/web/src/app/(main)/share/page.tsx:224-233`        | `?article=`, `?event=`                               | honest type, `firstParam`                                                                      | None.                                                                                         | Keep.                                                                                                                         |

Dynamic segments: 14 (`[slug]`, `[clubId]`, `[matchId]`, `[shortLink]`). Next hands each one over as
a `string`. PSD ids go through `parsePsdId` (`apps/web/src/lib/utils/psd-id.ts`, used in 7 non-test
files under `apps/web/src/app`); slugs go to GROQ as bound parameters. No gap.

### 3.2 Webhooks

Searches: `git ls-tree --name-only origin/main apps/api/src/webhooks/` (2 handlers) plus the web
revalidate route.

| Site                                                                     | Input                                            | Today                                                                                            | Risk                                                                                                                                                                             | Fix                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `apps/api/src/webhooks/index-handler.ts:250-258`                         | Signed Sanity webhook body                       | **Schema**: signature on the raw text, then `JSON.parse`, then `S.decodeUnknown(WebhookPayload)` | None. The model to copy.                                                                                                                                                         | Optional: one step with `S.parseJson(WebhookPayload)`.                                            |
| `apps/api/src/webhooks/darts-paid-handler.ts:72-81`                      | Signed Sanity webhook body                       | **Schema**, same shape                                                                           | None.                                                                                                                                                                            | Same.                                                                                             |
| `apps/api/src/webhooks/darts-paid-handler.ts:94`                         | The `dartsSignup` document read back from Sanity | generic: `client.fetch<DartsSignupDoc \| null>`                                                  | Medium. This read decides whether a mail goes out and to whom (`captainEmail`). A document written past Studio validation (an API write, an old draft) reaches Resend unchecked. | `S.decodeUnknown(S.NullOr(DartsSignupDoc))`, with `captainEmail: EmailAddress` from the contract. |
| `apps/api/src/webhooks/index-handler.ts:265`, `darts-paid-handler.ts:87` | `sanity-operation` header (not signed)           | hand: `isAllowedOp`, string compare                                                              | None. Each handler re-reads the document, so the header only picks a path.                                                                                                       | Keep.                                                                                             |
| `apps/web/src/app/api/revalidate/route.ts:171-185`                       | Signed body (see 3.1)                            | cast                                                                                             | The trigger.                                                                                                                                                                     | (in progress)                                                                                     |

### 3.3 `JSON.parse`, `.json()`, storage, `postMessage`, cookies

```bash
git grep -n 'JSON\.parse' origin/main -- 'apps/*/src/*' 'packages/*/src/*' \
  ':!*.test.*' ':!*.spec.*' ':!*.stories.*' ':!*/__tests__/*' ':!*/test/*' ':!*/tests/*' ':!*/__fixtures__/*' | wc -l
# 21 lines = 18 calls + 3 comments (psd-sanity-sync.ts:480, 850, 852)
```

| Site                                                                 | Input                       | Today                                                                            | Risk                                                                                                                                                                 | Fix                                                                                       |
| -------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `apps/api/src/cache/kv-cache.ts:335`                                 | KV entry (`TypedKvCache`)   | **Schema**: `JSON.parse`, then `S.decodeUnknown(WrapperSchema)`, legacy fallback | None.                                                                                                                                                                | Optional: `S.parseJson`.                                                                  |
| `apps/api/src/email/resend.ts:32`                                    | Resend error body           | cast `as { name?: unknown }`, then `typeof`                                      | Low. Fails soft to `undefined`.                                                                                                                                      | `S.decodeUnknownOption(S.parseJson(S.Struct({ name: S.String })))`                        |
| `apps/api/src/handlers/forms.ts:37`                                  | KV: form routing config     | cast `as FormRoutingConfig`                                                      | Medium. Breaks `docs/agents/code-patterns.md:13`. A non-string role value makes `.trim()` at line 58 throw, so the submission dies instead of falling back to info@. | `S.decodeUnknownOption(S.parseJson(FormRoutingConfigSchema))`                             |
| `apps/api/src/psd/job-alert.ts:81`                                   | KV: job alert state         | hand: `typeof`, `Number.isFinite`, fallback `HEALTHY`                            | None. A parser by hand.                                                                                                                                              | Optional: `S.decodeUnknownOption(S.parseJson(...))`, `Option.getOrElse`.                  |
| `apps/api/src/psd/service.ts:201`                                    | PSD body text               | **Schema**: `JSON.parse`, then `decodeAgainstSchema`                             | None.                                                                                                                                                                | Keep.                                                                                     |
| `apps/api/src/psd/service.ts:343`                                    | KV: competition labels      | cast `as CompetitionLabelMap` + "is an object"                                   | Medium. Breaks the KV rule. Values are never checked, and they render as labels.                                                                                     | `S.parseJson(S.Record({ key: S.String, value: S.String }))`                               |
| `apps/api/src/psd/service.ts:398`                                    | KV: teams by id             | cast `as TeamsById` + "is an object"                                             | Medium. Breaks the KV rule. An entry without `age` flows into the team transforms.                                                                                   | `S.parseJson(S.Record({ key: S.String, value: S.Struct({ name: S.String, age: ... }) }))` |
| `apps/api/src/psd/service.ts:429`                                    | KV: visible team ids        | hand: `Array.isArray`, every item a non-blank string                             | None.                                                                                                                                                                | Optional: `S.parseJson(S.Array(...))`.                                                    |
| `apps/api/src/psd/service.ts:625`                                    | KV: match team index        | cast `as MatchTeamIndex` + "is an object"                                        | Medium. Breaks the KV rule.                                                                                                                                          | `S.decodeUnknownOption(S.parseJson(MatchTeamIndexSchema))`                                |
| `apps/api/src/search/index-manifest.ts:110`                          | Durable KV: search manifest | hand: array check, non-strings dropped                                           | None.                                                                                                                                                                | Optional: `S.parseJson(S.Array(S.String))`; it would reject where today it filters.       |
| `apps/api/src/sync/psd-sanity-sync.ts:505`                           | Durable KV: sync checkpoint | hand type guard `isTeamCheckpoint`                                               | None.                                                                                                                                                                | Optional: `S.Struct` + `S.decodeUnknownOption`.                                           |
| `apps/api/src/sync/psd-sanity-sync.ts:860`                           | Durable KV: accumulated ids | hand: array check, non-strings dropped                                           | None.                                                                                                                                                                | Optional, as above.                                                                       |
| `apps/api/src/webhooks/darts-paid-handler.ts:73`                     | Webhook body                | **Schema** (3.2)                                                                 | None.                                                                                                                                                                | —                                                                                         |
| `apps/api/src/webhooks/index-handler.ts:250`                         | Webhook body                | **Schema** (3.2)                                                                 | None.                                                                                                                                                                | —                                                                                         |
| `apps/web/src/app/api/revalidate/route.ts:151`                       | Webhook body                | cast (3.1)                                                                       | The trigger.                                                                                                                                                         | (in progress)                                                                             |
| `apps/web/src/components/club/MembershipForm/membership-draft.ts:88` | `sessionStorage` draft      | hand type guard `isDraft`; role checked against `MembershipRole.literals`        | None.                                                                                                                                                                | Optional: `S.Struct` over the draft; `MembershipRole` is already a schema.                |
| `apps/web/src/components/share/SharePage/story-session.ts:173`       | `localStorage` session      | hand: field by field, with fallbacks                                             | None. A parser by hand.                                                                                                                                              | Optional: `S.optionalWith(..., { default })`.                                             |
| `apps/web/src/lib/server/bff-proxy.ts:7`                             | BFF response text           | pass (`as unknown`), forwarded to the browser                                    | None here; the browser read is the gap (below).                                                                                                                      | Keep.                                                                                     |

`.json()` reads:

```bash
git grep -n -E '\.json\(\)' origin/main -- 'apps/*/src/*' 'packages/*/src/*' ':!*.test.*' ':!*.spec.*' \
  ':!*.stories.*' ':!*/__tests__/*' ':!*/test/*' ':!*/tests/*' ':!*/e2e/*' | wc -l
# 16 lines = 13 calls + 3 comments (psd/service.ts:180, wedstrijd/[matchId]/page.tsx:161, bff-proxy.ts:46)
```

| Site                                                                 | Input                                | Today                                                           | Risk                                                                                               | Fix                                                                                         |
| -------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/api/src/psd/service.ts:210`                                    | PSD response                         | **Schema** (`decodeAgainstSchema`)                              | None.                                                                                              | —                                                                                           |
| `apps/api/src/sync/psd-team-client.ts:83`                            | PSD response (sync)                  | **Schema** (`S.decodeUnknown(schema)`)                          | None.                                                                                              | —                                                                                           |
| `apps/api/src/forms/turnstile.ts:50`                                 | Cloudflare siteverify response       | cast `as { success?: boolean }`, then `=== true`                | Low. Fails closed.                                                                                 | `S.decodeUnknownOption(S.Struct({ success: S.Boolean }))`                                   |
| `apps/api/src/sanity/mutation.ts:522`                                | Sanity asset upload response         | cast `as { document: { _id: string } }`                         | Low-medium. A changed response shape writes an image reference with `_ref: undefined`.             | `S.decodeUnknown(S.Struct({ document: S.Struct({ _id: S.NonEmptyString }) }))`              |
| `apps/web/src/components/club/MembershipForm/MembershipForm.tsx:372` | BFF response, through the Next proxy | cast `as { ok?, fields?, error? }`                              | Low-medium. Drift between the contract's `MembershipResponse` and this cast is invisible to `tsc`. | `S.decodeUnknownOption(MembershipResponse)`; the file already imports `@kcvv/api-contract`. |
| `apps/web/src/components/darts/DartsSignup/DartsSignup.tsx:117`      | BFF spots response                   | hand: `typeof data?.spotsLeft === "number"`                     | None.                                                                                              | Optional: `DartsSpotsResponse`.                                                             |
| `apps/web/src/components/darts/DartsSignup/DartsSignup.tsx:241`      | BFF signup response                  | cast                                                            | Low-medium, as for the membership form.                                                            | `S.decodeUnknownOption(DartsSignupResponse)`                                                |
| `apps/web/src/hooks/useSemanticSearch.ts:103`                        | BFF `/search` response               | cast `as { results; answer? }`                                  | Low-medium. A 200 with a different shape sets `results` to `undefined`.                            | `S.decodeUnknown(SearchResponse)` from the contract.                                        |
| `apps/web/src/hooks/useTeamGuess.ts:33`                              | BFF team-guess response              | annotation on `any`, then a truthy check                        | Low.                                                                                               | `TeamGuessResponse`.                                                                        |
| `apps/web/src/components/search/SearchInterface.tsx:180`             | Web's own `GET /api/search`          | annotation `const data: SearchResponse = await response.json()` | Low. A shape change between deploys crashes the results list.                                      | A schema for the route's response, shared by route and caller.                              |
| `apps/web/src/lib/server/form-proxy.ts:38`                           | BFF response                         | pass                                                            | None.                                                                                              | Keep.                                                                                       |
| `apps/web/src/lib/server/form-proxy.ts:61`, `bff-proxy.ts:29`        | Visitor request body                 | pass (3.1)                                                      | None.                                                                                              | Keep.                                                                                       |

Storage, `postMessage` and cookies:

```bash
git grep -n -E 'localStorage' origin/main -- 'apps/*/src/*' 'packages/*/src/*' ':!*.test.*' ':!*.stories.*'      # 2 (1 read, 1 write)
git grep -n -E 'sessionStorage' origin/main -- 'apps/*/src/*' 'packages/*/src/*' ':!*.test.*' ':!*.stories.*'    # 1
git grep -n -E 'postMessage|addEventListener\("message"' origin/main -- 'apps/*/src/*' 'packages/*/src/*' ':!*.test.*'  # 1, a comment
git grep -n -E 'cookies\(\)|document\.cookie|\.cookies\.get' origin/main -- 'apps/*/src/*' 'packages/*/src/*' ':!*.test.*'  # 0
```

- Storage: the two reads are the `membership-draft.ts:88` and `story-session.ts:173` rows above. Both
  parse by hand.
- `postMessage`: **none found**. The only hit is a comment in `apps/web/src/hooks/useVideoAnalytics.ts:27`.
- Cookies: **none found** in source. The draft-mode cookie is read by Next's own `draftMode()`.
- Client-side URL reads (`window.location.search`, `.hash`, `useSearchParams`: 34 lines) go through
  `narrowParam` (`apps/web/src/hooks/filterParam.ts`), which returns the narrowed literal or a
  fallback. That is a parser by hand. They were not read one by one.

### 3.4 Upstream responses

| Upstream                                | Sites                                                                                                                                                                             | Today                                                                                                                                       | Risk                                                                                                                                                                              | Fix                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| PSD API (BFF)                           | `apps/api/src/psd/service.ts` (`decodeAgainstSchema`), `apps/api/src/sync/psd-team-client.ts:88`                                                                                  | **Schema**. Lists decode per item from `S.Array(S.Unknown)` (allowed by `apps/api/CLAUDE.md:253`).                                          | None.                                                                                                                                                                             | —                                                                                         |
| BFF, read by the web server             | `apps/web/src/lib/effect/services/BffService.ts:101`                                                                                                                              | **Schema**: `HttpApiClient.make(PsdApi)` decodes every response against the contract; `guard-declared-error-body.ts:86` uses `S.parseJson`. | None.                                                                                                                                                                             | —                                                                                         |
| BFF, read by the browser                | 5 rows in 3.3 (`MembershipForm`, `DartsSignup` x2, `useSemanticSearch`, `useTeamGuess`)                                                                                           | cast or hand                                                                                                                                | Low-medium. The contract schemas exist and are not used.                                                                                                                          | `S.decodeUnknown*` with the contract's response classes.                                  |
| Sanity GROQ in the BFF                  | 24 `client.fetch<T>` calls: `sanity/projection.ts` 14, `search/sanity-index-sync.ts` 6, `webhooks/index-handler.ts` 2, `sanity/mutation.ts` 1, `webhooks/darts-paid-handler.ts` 1 | generic. `index-handler.ts:319` asks for `Record<string, unknown>`, an honest type.                                                         | Medium for reads that drive a side effect: the darts-paid mail (3.2) and the form routing config (`projection.ts:438`, which decides the admin mail recipient). Low for the rest. | `S.decodeUnknown(schema)` on the reads that drive mail or writes, first.                  |
| Sanity GROQ in web                      | 39 `fetchGroq<T>` calls (34 typed with a typegen `*_QUERY_RESULT`, 5 hand types), `apps/web/src/app/sitemap.ts:119`                                                               | generic. Typegen (`apps/web/src/lib/sanity/sanity.types.ts`) ties `T` to the Studio schema and the query, at compile time only.             | Low-medium. A document that predates a schema change, or was written past Studio validation, reads as its typegen type.                                                           | Open question (§7): decoding every GROQ read at runtime is a large change.                |
| Workers AI                              | `apps/api/src/search/ai-answer.ts:112-120`, `apps/api/src/search/embedding.ts:36-50`                                                                                              | `env.AI as unknown as`, then cast; the embedding is shape-checked by hand afterwards                                                        | Low. Both sit in an `Effect.try` that degrades.                                                                                                                                   | `S.decodeUnknown(S.Struct({ response: S.optional(S.String) }))`, and the same for `data`. |
| Vectorize                               | `apps/api/src/search/vectorize.ts:140`                                                                                                                                            | cast `metadata as Record<string, string>`; `search-handler.ts:70` narrows `type` only                                                       | Low. A bad `slug` or `title` fails the `SearchResponse` encode on the way out, so the result is a 500, not a leak.                                                                | Decode metadata at `vectorize.ts` with an `S.Struct` of the indexed fields.               |
| Resend, Slack, Turnstile                | `resend.ts:32`, `slack-alert.ts:218` (status only), `turnstile.ts:50`                                                                                                             | cast or status only                                                                                                                         | Low.                                                                                                                                                                              | See 3.3.                                                                                  |
| KV (own data, written by older deploys) | 10 KV reads in 3.3                                                                                                                                                                | 1 Schema, 4 casts, 5 hand                                                                                                                   | Medium for the 4 casts (3.3).                                                                                                                                                     | `S.parseJson(schema)` + `S.decodeUnknownOption`.                                          |

### 3.5 Env vars and config

```bash
git grep -n 'process\.env\.' origin/main -- 'apps/web/src/*' ':!*.test.*' ':!*.stories.*' | wc -l   # 25 lines, 16 distinct vars
git grep -n -E 'Config\.(string|number|boolean|redacted|schema|integer|literal)|ConfigProvider' origin/main \
  -- 'apps/*/src/*' 'packages/*/src/*' ':!*.test.*'                                                  # 0
```

- **Web:** no env module and no schema. Each read checks in its own way. `KCVV_API_URL` is read three
  times: `BffService.ts:90` trims and throws, while `bff-proxy.ts:19` and `form-proxy.ts:14` only test
  for truthiness and answer 503. `apps/web/src/lib/sanity/client.ts:4` asserts
  `NEXT_PUBLIC_SANITY_PROJECT_ID` with `!`. Optional vars (`GA4_*`, `DEBUG_SEARCH`) are compared or
  tested where they are used.
- **Worker:** `WorkerEnv` (`apps/api/src/env.ts:3`) is a hand-written interface. It promises that
  `PSD_API_KEY`, `SANITY_WEBHOOK_SECRET` and the other required secrets are strings, and nothing
  checks that at startup. Optional values are parsed by hand where they are used, and they fail safe:
  `parseCeiling` (`apps/api/src/cache/daily-ceiling.ts:14`), `ALLOW_MISSING_FORM_SECRETS === "true"`
  (`resend.ts:74`), `SEARCH_INDEX_PRUNE_DRY_RUN` (anything but `"false"` is a dry run).
- **Effect `Config`:** not used anywhere (0 hits).

Risk: medium-low. A missing required var shows up at the first request that needs it, not at
startup, and each site words the failure differently.

### 3.6 Forms

| Site                                                  | Input                         | Today                                                                                                                       | Risk                                                                                                                                        | Fix                                                |
| ----------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `apps/api/src/handlers/forms.ts:175` (`FormsApiLive`) | Membership and darts payloads | **Schema**: `HttpApi` `setPayload(MembershipRequest)`, `setPayload(DartsSignupRequest)`; `privacyAccepted: S.Literal(true)` | None.                                                                                                                                       | —                                                  |
| `apps/api/src/forms/membership-rules.ts:18`           | `birthDate` and the date now  | a second pass: `isPlausibleBirthDate`, `isMinorOn`                                                                          | Low. The essay allows "multiple passes", but `birthDate` stays a `string`, and `handlers/forms.ts:116` works out `isMinorOn` again from it. | A `BirthDate` brand made by the rules pass (§4.5). |
| `apps/api/src/forms/turnstile.ts:50`                  | Turnstile token verdict       | cast, fails closed (3.3)                                                                                                    | Low.                                                                                                                                        | See 3.3.                                           |

Client-side form checks (before submit) were not read line by line. The BFF decode is the authority.

### 3.7 Scripts (run by hand)

`git grep -n 'JSON\.parse' origin/main -- 'scripts/*' ':!*.test.*'` gives 4; Schema decodes in
`scripts/`: 0.

- `scripts/sanity-ops/src/shared/sanity-client.ts:13`: the Sanity CLI config file. Untyped.
- `scripts/sanity-ops/src/sponsor-season-report-3653/run.ts:70`: gcloud ADC file, destructured. Untyped.
- `scripts/sanity-ops/src/sponsor-season-report-3653/validate-input.ts:33`: hand parser with clear
  errors. A parser by hand.
- `scripts/sync-gtm.mjs:177`: GTM API response. Plain JS.

## 4. The Effect Schema toolkit for this repo

Every API here is in the installed version. Lines are in `effect/dts/Schema.d.ts` unless marked.

| API                                                                      | Where                                                                                  | Use                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `Schema.decodeUnknown`                                                   | `Schema.d.ts:337`                                                                      | Returns `Effect<A, ParseError, R>`. Inside an Effect program.           |
| `Schema.decodeUnknownEither`                                             | `Schema.d.ts:342`                                                                      | Returns `Either<A, ParseError>`. Plain code; no throw.                  |
| `Schema.decodeUnknownOption`                                             | `ParseResult.d.ts:380`, re-exported at `Schema.d.ts:256`                               | Returns `Option<A>`. When a bad value just means "none" (cache reads).  |
| `Schema.decodeUnknownSync`                                               | `ParseResult.d.ts:375`, re-exported at `Schema.d.ts:262`                               | Throws `ParseError`. Module load, scripts.                              |
| `Schema.decodeUnknownPromise`                                            | `Schema.d.ts:347`                                                                      | Returns `Promise<A>`.                                                   |
| `Schema.parseJson`                                                       | `Schema.d.ts:2570`                                                                     | JSON text to `A` in one schema; bad JSON is one more decode failure.    |
| `Schema.Class`, `TaggedClass`, `TaggedError`                             | `Schema.d.ts:4385`, `:4406`, `:4439`                                                   | Named, decodable types; `WebhookPayload` is an `S.Class`.               |
| `Schema.brand`                                                           | `Schema.d.ts:1594`                                                                     | The essay's smart constructor: a refined type only a decode can make.   |
| `Schema.Config`                                                          | `Schema.d.ts:4734`                                                                     | `(name, schema) => Config<A>`; the schema's encoded side is a `string`. |
| `ConfigProvider.fromJson`, `fromEnv`                                     | `effect/dts/ConfigProvider.d.ts:167`, `:152`                                           | Feed `Config` from a plain object (the Worker `env`) or `process.env`.  |
| `Effect.withConfigProvider`                                              | `effect/dts/Effect.d.ts:13521`                                                         | Run one program with that provider.                                     |
| `HttpServerRequest.schemaBodyJson`                                       | `platform/dts/HttpServerRequest.d.ts:122`                                              | Decode a request body inside an `@effect/platform` handler.             |
| `HttpServerRequest.schemaSearchParams`, `schemaHeaders`, `schemaCookies` | `platform/dts/HttpServerRequest.d.ts:117`, `:112`, `:107`                              | The same for the URL, headers and cookies.                              |
| `HttpClientResponse.schemaBodyJson`                                      | `platform/dts/HttpClientResponse.d.ts:19` (re-export of `HttpIncomingMessage.d.ts:43`) | Decode an outbound call's response body.                                |
| `HttpApiEndpoint` `setPayload`, `setPath`, `setUrlParams`, `setHeaders`  | `platform/dts/HttpApiEndpoint.d.ts:91-100`                                             | What the BFF already does; the client and server share it.              |
| `HttpApiClient.make`                                                     | `platform/dts/HttpApiClient.d.ts:57`                                                   | What web's `BffService` already does.                                   |

Docs: the decoding functions are listed in
[Schema → Getting Started](https://effect.website/docs/v3/schema/getting-started/) ("Decodes a value
and returns an Effect", "returns an Either type", "returns an Option type", and `decodeUnknownSync`
"throws an error if parsing fails"). `parseJson` is in
[Transformations → parseJson](https://effect.website/docs/v3/schema/transformations/#parsejson).
`Schema.Config` is under
["Using Config with Schema"](https://effect.website/docs/v3/configuration/) ("You can define and
decode configuration values using a schema."). Classes are in
[Schema → Classes](https://effect.website/docs/v3/schema/classes/).

### 4.1 A route handler that is not an Effect program

A Next route handler returns a `Response`. Use the `Either` form and branch once.

```typescript
import { Either, Schema as S } from "effect";

const Body = S.parseJson(
  S.Struct({ _type: S.NonEmptyString, slug: S.optional(S.String) }),
);
const decodeBody = S.decodeUnknownEither(Body);

export async function POST(request: Request) {
  const raw = await request.text();
  // ...verify the signature on `raw` first...
  const body = decodeBody(raw);
  if (Either.isLeft(body)) {
    return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  const { _type, slug } = body.right; // typed from here on, never checked again
  // ...
}
```

For a server action, decode the arguments on the first line. Its TypeScript signature is not checked
at runtime:

```typescript
const Args = S.Struct({
  offset: S.Finite,
  limit: S.Finite,
  category: S.optional(S.String),
});

export async function fetchArticlesAction(input: unknown) {
  const { offset, limit, category } = S.decodeUnknownSync(Args)(input); // throws on junk
  // ...
}
```

### 4.2 An Effect handler

Inside `Effect.gen`, use `decodeUnknown` and map the `ParseError` to the handler's own error, as
`darts-paid-handler.ts:76-81` does. With `@effect/platform`, the request helpers do the read and the
decode in one step:

```typescript
import { HttpServerRequest } from "@effect/platform";
import { Effect, Schema as S } from "effect";

const handler = Effect.gen(function* () {
  const payload = yield* HttpServerRequest.schemaBodyJson(WebhookPayload);
  const query = yield* HttpServerRequest.schemaSearchParams(
    S.Struct({ dryRun: S.optional(S.Literal("true", "false")) }),
  );
  // ...
});
```

The two Sanity webhooks cannot use `schemaBodyJson` as it stands: the signature is computed over the
raw text, so they read `text()` first. For them, `S.parseJson(WebhookPayload)` on that text replaces
the separate `JSON.parse` step. For outbound calls, `HttpClientResponse.schemaBodyJson(schema)` is the
mirror image.

### 4.3 JSON text to a type in one step (`parseJson`)

This covers every KV read in §3.3. A bad value becomes `None`, so the cache falls through to a
refetch:

```typescript
import { Option, Schema as S } from "effect";

const TeamsById = S.Record({
  key: S.String,
  value: S.Struct({ name: S.String, age: S.String }),
});
const readTeamsById = S.decodeUnknownOption(S.parseJson(TeamsById));

const cached = yield * cache.get(TEAMS_BY_ID_CACHE_KEY);
const hit = cached ? readTeamsById(cached) : Option.none();
if (Option.isSome(hit)) return hit.value;
```

`apps/web/src/lib/effect/guard-declared-error-body.ts:86` already uses this pattern
(`S.decodeUnknownEither(S.parseJson(schema))(text)`), and its comment says why: "malformed JSON is
just another decode failure that schema reports, not a separate step this function has to
`try`/`catch` around."

### 4.4 Env

**Worker.** Decode `env` once at the entry, with a `Config` per value:

```typescript
import { ConfigProvider, Effect, Schema as S } from "effect";

const AiAnswerDailyCap = S.Config(
  "AI_ANSWER_DAILY_CAP",
  S.NumberFromString.pipe(S.int(), S.nonNegative()),
);

const program = Effect.gen(function* () {
  const cap = yield* AiAnswerDailyCap; // a number, or a ConfigError naming the var
  // ...
}).pipe(Effect.withConfigProvider(ConfigProvider.fromJson(env)));
```

Bindings (`KVNamespace`, `Ai`, `VectorizeIndex`) are objects, not strings, so they stay on the
`WorkerEnv` interface. Only the string vars move to `Config`.

**Web.** One server-only module that decodes once, at load:

```typescript
const ServerEnv = S.Struct({
  KCVV_API_URL: S.Trim.pipe(S.nonEmptyString()),
  BFF_SHARED_SECRET: S.Trim.pipe(S.nonEmptyString()),
  SANITY_API_READ_TOKEN: S.optional(S.String),
});
export const serverEnv = S.decodeUnknownSync(ServerEnv)(process.env);
```

Next.js limit: `NEXT_PUBLIC_*` values are inlined only when written out literally.
[Next.js docs](https://nextjs.org/docs/app/guides/environment-variables), _Bundling Environment
Variables for the Browser_: "Note that dynamic lookups will _not_ be inlined", and the example given is
`const env = process.env`. So a client-side schema must be fed
`{ NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, ... }`, never
`process.env` itself.

### 4.5 Brands: the essay's "abstract datatypes"

`parsePsdId` (`apps/web/src/lib/utils/psd-id.ts`) is already a parser, but it returns a plain `number`,
so nothing tells a parsed id from any other number. A brand makes the check part of the type:

```typescript
const PsdId = S.NumberFromString.pipe(S.int(), S.positive(), S.brand("PsdId"));
type PsdId = typeof PsdId.Type; // number & Brand<"PsdId">: only a decode can make one
```

The same goes for a `BirthDate` made by the membership rules pass (§3.6).

## 5. Gaps, ranked by risk

Trust boundaries first, then upstream responses, then env.

**External input, unsigned or signed**

1. **Public server actions trust their TypeScript signature.**
   `apps/web/src/app/(landing)/nieuws/actions.ts:15` and `(main)/galerij/(index)/actions.ts:26`.
   `"use server"` makes each one a POST endpoint that takes any JSON. The numbers are clamped by hand;
   `category` is not checked. Fix: §4.1, `S.decodeUnknownSync(Args)` on the first line.
2. **`/nieuws` types `?categorie=` as `string`.** `nieuws/page.tsx:31`. A repeated parameter is a
   `string[]` at runtime and reaches the GROQ read and a client prop. Fix: type it honestly and narrow
   it, as `share/page.tsx` does.
3. **The signed revalidate webhook in web** (the trigger). In progress in #3863; not repeated here.

**Upstream responses**

4. **The darts-paid read-back drives a mail with no decode.** `darts-paid-handler.ts:94`,
   `client.fetch<DartsSignupDoc | null>`. The body of the webhook is parsed; the document the mail is
   built from is not. Fix: `S.decodeUnknown(S.NullOr(DartsSignupDoc))` with `EmailAddress`.
5. **Four KV reads are cast, against the repo's own rule.** `handlers/forms.ts:37`,
   `psd/service.ts:343`, `:398`, `:625`. `docs/agents/code-patterns.md:13`: "Decode a KV cache read
   with a schema (`S.decodeUnknown`), never `JSON.parse(...) as T`." Fix: §4.3. The forms one matters
   most: a bad value throws on `.trim()` and fails a membership submission.
6. **The form routing config read is generic.** `sanity/projection.ts:438`. It picks the admin mail
   recipient. A regex check runs later, but a non-string value throws before it. Fix: decode at the
   read, then the KV copy (gap 5) can reuse the same schema.
7. **Browser reads of BFF responses cast, though the contract has the schemas.** `MembershipForm.tsx:372`,
   `DartsSignup.tsx:241`, `useSemanticSearch.ts:103`, `useTeamGuess.ts:33`. Two of these files already
   import `@kcvv/api-contract`. Fix: `S.decodeUnknownOption(MembershipResponse)` and so on.
8. **The other BFF Sanity reads are generic** (21 more `client.fetch<T>`), and so are the Sanity asset
   upload response (`mutation.ts:522`), Vectorize metadata (`vectorize.ts:140`) and Workers AI
   (`ai-answer.ts:118`). Each either degrades or fails an encode, so the blast radius is small.
9. **Web GROQ reads are typed by typegen only** (39 `fetchGroq<T>`). Compile-time safety against the
   schema and the query; no runtime check against old or hand-written documents. See §7.

**Env**

10. **No env is decoded.** Web: 16 vars, each checked its own way, one `!`. Worker: `WorkerEnv`
    promises required secrets nothing checks. Fix: §4.4.

## 6. Candidate follow-up issues

None of these is filed.

- **Decode every KV read in the BFF with `S.parseJson(schema)`.** Scope: the 4 casts in gap 5 first,
  then the 6 hand parsers in §3.3 if the diff stays small. Lint: **yes**.
  `no-restricted-syntax` on `TSAsExpression > CallExpression[callee.object.name='JSON'][callee.property.name='parse']`
  bans `JSON.parse(...) as T` (selector not tested).
- **Decode Sanity reads that drive mail or writes.** Scope: `darts-paid-handler.ts:94`,
  `projection.ts:438`, `mutation.ts:522`. Lint: **partly**. A `no-restricted-syntax` on a type
  argument to `.fetch` (`CallExpression[callee.property.name='fetch'][typeArguments]`) would flag all
  24 BFF reads, so it needs an allowlist or a wrapper such as `fetchDecoded(schema, query)` (untested).
- **Decode browser reads of BFF responses with the contract's response classes.** Scope: the 5 sites
  in §3.4, plus a shared schema for web's own `GET /api/search`. Lint: **yes**. Ban `as` on
  `await x.json()` (`TSAsExpression > AwaitExpression > CallExpression[callee.property.name='json']`),
  and a type annotation on the same expression. typescript-eslint's type-aware
  `no-unsafe-assignment` would also catch the annotation form, since `.json()` returns `any`
  (untested here).
- **Decode server action arguments on the first line.** Scope: the 2 actions in gap 1. Lint: **no**;
  it needs judgment about which export is an action. Write it as a rule in `apps/web/CLAUDE.md`.
- **Type page `searchParams` honestly.** Scope: `/nieuws`. Lint: **no** (Next's prop type is
  declared by hand). A grep in review, or one shared `PageSearchParams` type.
- **Decode env once, per app.** Scope: a server-only env module in `apps/web` that keeps
  `NEXT_PUBLIC_*` reads literal (§4.4); `Schema.Config` for the Worker's string vars. Lint: **yes**.
  Ban `process.env` outside the env module (`no-restricted-syntax` on
  `MemberExpression[object.name='process'][property.name='env']`, with a file override).
- **Fold `JSON.parse` + `decodeUnknown` into `S.parseJson`.** Scope: `kv-cache.ts:335`, both BFF
  webhooks, `psd/service.ts:201`. Lint: **no**; it is cosmetic, and these sites are already correct.
- **Brand ids and dates that are parsed once.** Scope: `PsdId` from `parsePsdId` and the contract's
  `S.NumberFromString.pipe(S.int())`, `BirthDate` in the membership rules. Lint: **no**.

## 7. Open questions, and what was not verified

- **Should GROQ results be decoded at runtime?** Web has 39 typed reads and the BFF 24. Typegen already
  ties the type to the schema. A runtime decode would catch old or hand-written documents, but it adds
  one schema per query that must track the projection. Not measured: how many live documents fail
  their typegen type today.
- **Does a repeated `?categorie=` change the GROQ result?** The query at
  `apps/web/src/lib/repositories/article.repository.ts:83` filters with `$category in tags`. With an
  array for `$category`, that most likely matches nothing, so the page would show an empty list. This
  is read from the query; it was not run.
- **The lint selectors in §6 were not run.** They are written from the ESTree and typescript-eslint
  node names. Check each against `apps/web/test/lint/eslint-rule-harness.ts` before adopting it.
- **Bundle cost of Schema in client components** was not measured. Four `'use client'` files already
  import `effect` or `@kcvv/api-contract`, so the cost may already be paid.
- **Client-side form checks** in `MembershipForm` and `DartsSignup` before submit, and the 34
  client-side URL reads, were not read one by one.
- **`ConfigProvider.fromJson(env)` on a real Worker** was run only against a plain object in Node, not
  in `workerd`.
- The essay was read from its HTML on 2026-11-25. The Effect docs pages were read on the same day,
  under the `/docs/v3/` paths they now redirect to.
