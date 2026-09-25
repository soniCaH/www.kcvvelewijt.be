# apps/web — Next.js App

This is the KCVV Elewijt club website. See root `.claude/CLAUDE.md` for monorepo-wide rules.

## Implemented Routes

`/`, `/nieuws`, `/nieuws/[slug]`, `/spelers/[slug]`, `/ploegen`, `/ploegen/[slug]`, `/jeugd`, `/kalender`, `/wedstrijd/[matchId]`, `/events`, `/events/[slug]`, `/sponsors`, `/club/geschiedenis`, `/hulp`, `/zoeken`, `/privacy`

`/nieuws/[slug]` shipped its Phase 5 redesign (Phase 5: article detail) — see `docs/prd/redesign-phase-5-article-detail.md`.

### Feature → route map

Audit/spec generators sometimes flag features as "missing" because no top-level URL matches the obvious name. Cross-check this map before opening an issue:

| Feature                                 | Where it lives                             | Component                                             |
| --------------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| League table / standings / `klassement` | `/ploegen/[slug]` (team detail page)       | `src/components/team/TeamStandings/TeamStandings.tsx` |
| Match-day league table snapshot         | `/wedstrijd/[matchId]` (match detail page) | `src/components/team/TeamStandings/TeamStandings.tsx` |
| Per-team match list                     | `/ploegen/[slug]`                          | `src/components/team/TeamMatches/`                    |
| Club-wide calendar                      | `/kalender`                                | `src/app/(main)/kalender/`                            |

## Design System & Storybook (MANDATORY)

### When to update UI stories

- **New design system component** (`src/components/design-system/<Name>/`) → create `<Name>.stories.tsx` alongside with title `UI/<Name>`, add `tags: ["autodocs"]`, write a Playground + all variant stories. Also add to barrel `src/components/design-system/index.ts`.
- **New icon** added to `src/lib/icons.redesign.ts` (Phosphor Fill wrappers — the single icon source; Lucide was retired in #2154) → add a `fillWrapper` export there AND a `vi.mock` factory entry + import + wrappers-array row in `icons.redesign.test.tsx` (skipping the test sync makes `fillWrapper(undefined)` throw at module load → the whole file fails with 0 tests), and add it to the `Foundation/Spacing & Icons` icon grid in `src/stories/foundation/SpacingAndIcons.mdx`.
- **Existing component changed** (new variant, new prop) → update the corresponding story and test files.

### When to update Foundation MDX

- **New color token** in `src/app/globals.css` `@theme {}` → add a swatch to `src/stories/foundation/Colors.mdx`.
- **New font/type token** → add to `src/stories/foundation/Typography.mdx`.
- **New spacing / breakpoint / shadow token** → add to `src/stories/foundation/SpacingAndIcons.mdx`.

### Story authoring rules

- **Handlers:** use `fn()` from `storybook/test` in `meta.args`, never `argTypes: { prop: { action: "..." } }`.
- **Story type:** `StoryObj<typeof meta>`, not `StoryObj<typeof ComponentName>`.
- **No non-null assertions** on fixture lookups — use `?? fallback` so the story never crashes at import time.
- **Non-serialisable props** (e.g. `Set<string>`): define a `StoryArgs` type override with a serialisable equivalent and convert in a named render helper. No `as unknown as` casts in `args`.

### Storybook navigation structure (MANDATORY)

Use these top-level groups — enforced by `storySort` in `.storybook/preview.ts`:

| Group         | What goes here                                                                                                                                                                                       | title prefix         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `Foundation/` | Design tokens only — Colors, Typography, Spacing, Icons (MDX docs, no component stories)                                                                                                             | `Foundation/`        |
| `UI/`         | Pure design system primitives with zero domain knowledge — could ship as a standalone package                                                                                                        | `UI/`                |
| `Features/`   | Domain components that require KCVV data types (Articles, Calendar, Club, Contact, Editorial, Events, Forms, Home, Hulp, Jeugd, Matches, Organigram, Players, Search, Share, Sponsors, Staff, Teams) | `Features/<Domain>/` |
| `Layout/`     | Page infrastructure — PageHeader, PageFooter                                                                                                                                                         | `Layout/`            |
| `Pages/`      | Full-page compositions                                                                                                                                                                               | `Pages/`             |

**Rule:** If a new component knows about `MatchResult`, `Player`, `Sponsor`, or any other KCVV domain type → it goes in `Features/<Domain>/`. If it's a generic primitive → `UI/`. Never nest domain components directly at the top level.

### MDX table gotcha

MDX 2 (Storybook 10) does **not** parse GFM pipe-table syntax (`| col |`) without `remark-gfm`. Always use native HTML `<table>` elements in `.mdx` files.

### Phase history

What each redesign phase added, renamed, or retired (Phase 0 → 6.C) lives in `docs/agents/phase-history.md`. Read it only when tracing _why_ a primitive looks the way it does, or when a review comment cites a phase number or a retired component. For what a component does **today**, read its source and its story — those can't go stale.

## Design Conventions

Two references, different jobs — read the one that answers your question:

| Source                             | Owns                                                                                                                                                                                                        | Read it when                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `apps/web/DESIGN.md`               | The **rules**: why corners are sharp, which of the four greens carries meaning, why shadows never blur, one emphasis per heading, the three container widths. A set of named rules plus a Do's/Don'ts list. | Designing or reviewing anything new. Start here — the rules are not derivable from the token values. |
| Storybook (`Foundation/*`, `UI/*`) | The **values and components**: every live token, every primitive's variant API, rendered states.                                                                                                            | You need an exact value, or the current shape of a component.                                        |
| `apps/web/PRODUCT.md`              | Durable product truth: audiences, success criteria, constraints, and the hard list of what this site does **not** do (no tickets, shop, streaming, live scores, accounts, newsletter).                      | Scoping a feature, or tempted to add a surface the product doesn't have.                             |

Storybook stays authoritative for **values** — do not hardcode a colour, spacing, radius or type value that isn't defined there. DESIGN.md is authoritative for **intent**; where a token could be used two ways, its rule decides. `.impeccable/design.json` is the machine-readable sidecar for DESIGN.md — regenerate both together via `/impeccable document`, never by hand.

### Page layout — `<PageContainer>` and the three body widths

Every page wraps its content in `<PageContainer>` (`@/components/design-system`). It is the single centered body container — `mx-auto w-full px-4 md:px-8` + a role-based max-width. Pick the width by the page's role; do **not** hand-roll `mx-auto max-w-… px-…` containers:

| `width`     | Max-width                  | Use for                                                    |
| ----------- | -------------------------- | ---------------------------------------------------------- |
| `"index"`   | 1280 (`--container-index`) | Card-grid index / listing / landing pages (incl. homepage) |
| _(default)_ | 1040 (`--container-wide`)  | Detail / single-subject pages                              |
| `"prose"`   | 680 (`--container-prose`)  | Long-form reading, forms, legal                            |

- Vertical rhythm (`py-*`, `scroll-mt-*`, …) goes on the consuming section via `className`; pass `as="section"` for sections and `id="…"` for in-page nav anchors. Heroes/bespoke grid layouts that can't wrap cleanly may apply the same width **loosely** (`max-w-[var(--container-wide)]` / `max-w-[var(--container-index)]`) — but only one of the three values.
- **A content container may use no other width.** Three exemptions, which are NOT content containers: (1) **chrome** — `<SiteHeader>`/`<SiteFooter>` use `max-w-[1440px]` (global nav/footer span wider than content; the only width above 1280, chrome-only); (2) **element-sizing** — a photo, illustration, reading-measure/quote/divider width, or scaled diagram (e.g. the organigram tree) keeps its own `max-w-[…]`; (3) **full-bleed** — `<StripedSeam>`, hero band backgrounds, `<CtaBand>`, coloured section bands span the viewport and are never wrapped.
- All three are named custom tokens: `--container-prose` (680), `--container-wide` (1040), `--container-index` (1280). The legacy `--max-width-inner*`/`--container-page`/`--container-default`/`--max-width-outer` tokens were all removed in #2155.

### Design system locations

| Concern           | Path                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| Component source  | `src/components/design-system/<Name>/`                                        |
| Component stories | `src/components/design-system/<Name>/<Name>.stories.tsx` (title: `UI/<Name>`) |
| Component tests   | `src/components/design-system/<Name>/<Name>.test.tsx`                         |
| Barrel export     | `src/components/design-system/index.ts`                                       |
| Icons             | `src/lib/icons.redesign.ts` (Phosphor Fill — `"use client"`)                  |
| Foundation docs   | `src/stories/foundation/`                                                     |
| Design tokens     | `src/app/globals.css` (`@theme {}`)                                           |

## The Writer Rule — rendering absence

This is the **render-time** half of the Writer Rule; the **declaration-time** half (does a field have a real writer at all) lives in root `.claude/CLAUDE.md` → **A `readOnly` Field Needs a Named Writer**. Once a slot's field has cleared that bar and genuinely can be written, but hasn't been yet, render its absence honestly rather than papering over it:

> **Keep a slot whose datum has a writer who simply has not written yet — auto-hide it or show an explicit empty state. Never fill a rendered page slot from a visibly adjacent neighbour's value, and never default it to a generic literal.**

- **Never synthesise a rendered slot from a visibly adjacent neighbour.** A slot that falls back to an adjacent field's value on the _same rendered view_ (e.g. a tagline falling back to the division already shown in a pill two lines up) duplicates content and makes the page look broken, not merely incomplete.
- **This does not reach metadata, OG cards, or JSON-LD.** Those aren't a second on-page rendering of a fact next to its source — they're a different surface (a search snippet, a share preview) that has no pill of its own to duplicate, so composing a fallback chain there is fine. #2630 established this for the team page (`generateMetadata` composes `tagline ?? divisionFull ?? division` even though the on-page hero never falls back); #2567 follows the same carve-out for the player page's metadata description and OG card, which additionally share one resolver (`PlayerVM.metaLabel`) so the two surfaces in a single share preview never disagree.
- **Never default to a generic literal** (e.g. a position defaulting to `"Speler"`). An authored value and an unfilled one become indistinguishable, so nobody — content owner or code — can tell how far a content pass has actually got. Render the absence; let the consumer (a squad grouping, a card label) degrade gracefully around it. A last-resort fallback that adds genuinely new information (e.g. the player metadata description falling all the way to `"<name> bij KCVV Elewijt"`, which states the club affiliation the bare `title` doesn't) is not this failure mode — repeating the exact same string the title already carries would be.

Established in #2535/#2567 against three fields across two heroes: `team.season` on `TeamHero` — deleted outright, no writer; `team.tagline` on `TeamHero` — kept, was duplicating `division` (fixed in #2630, which landed before this rule was written down); `player.position` on `PlayerHero` — kept, was defaulting to `"Speler"` (fixed in #2567, which added this rule). See `docs/ubiquitous-language.md` → **Season** and **Position** for the concrete before/after.

## Effect & Server Component Patterns

- **A Sanity read carries a typed `SanityReadError` (#2864); `runPromise` refuses anything else.** `fetchGroq` (`lib/sanity/fetch-groq.ts`) no longer ends in `Effect.orDie` — its error channel is `SanityReadError` — and `runPromise` (`lib/effect/runtime.ts`) is narrowed to `E = never`, so an unresolved Sanity read fails `type-check`, not just at runtime. Resolve it at the call site: a **section** read (the page still works without it) goes through `degradeSection` (`lib/effect/degrade.ts`); a **subject** read (the thing the page is about) gets an explicit `.pipe(Effect.orDie)` with a one-line comment saying why the failure takes the page with it. At build, `runPromise` turns a **transient** `SanityReadError` defect (transport, 5xx, 429 — `SanityReadError.transient`) into Next's on-demand bailout (`connection()`), so a failed subject read leaves that one page out; an invalid GROQ query still fails the build instead of killing the build (#3135) — a `try/catch` around such a read must therefore `unstable_rethrow` first, never test for a `NEXT_` digest (`DYNAMIC_SERVER_USAGE` has none). Never silence a surfaced read with a cast, `!`, or a blanket `orDie` added only to clear the build — that reproduces the exact bug class #2864 exists to catch at compile time.
- **Never wrap `runPromise` in try/catch in Server Components** for the read itself — an in-effect guard (`degradeSection`, or the subject's own `Effect.orDie`) is what Effect errors must bubble through. Two permitted exceptions: converting `HttpNotFound` to `notFound()` via `Effect.catchTag("HttpNotFound", () => Effect.sync(() => notFound()))`, and covering an `AppLayer` construction failure (e.g. a missing `KCVV_API_URL`) — that failure happens while `ManagedRuntime` builds the layer that provides an effect's context, which sits _outside_ any catch written inside the effect, so no in-effect guard can see it. A `degradeSection`-wrapped section read that must survive a broken layer (`app/layout.tsx`'s nav teams) still needs an outer `try { … } catch { fallback }` for exactly this — verified empirically: with `KCVV_API_URL` unset, dropping the `try/catch` around one of these 500s the whole route instead of rendering with the section's own degraded fallback.
- **Match the catch to the failure you actually need to survive.** Default to `Effect.catchTag("HttpNotFound")`: when fetching multiple items in `Effect.all`, only 404s should be silently treated as "failed", and `Effect.catchAll` would mask real upstream errors (503s, network failures) as empty results. But an **ISR page** (`export const revalidate = …`, no `force-dynamic`) is prerendered at build, where the BFF is often unreachable — that failure is a transport error (`HttpClientError.RequestError`), _not_ `HttpNotFound`, so `catchTag` alone lets it bubble and **fails the build**. Those pages legitimately need a broad `Effect.catchAll(() => Effect.succeed([]))` per fetch: degrade to empty, log via `tapError`, let ISR self-heal on the next revalidation (or use `force-dynamic`, as `/kalender` does, to skip prerender entirely). Whichever you pick, document the reason inline so reviewers don't re-flag it.
- **Never put a web-side data cache in front of a BFF read.** `BffService` calls the client directly and must stay that way (#2389). The BFF owns freshness (#2326) plus rate limiting and single-flight (#2328), so an `unstable_cache` wrapper adds no protection — and it freezes: stale-while-revalidate schedules its refresh on the serving instance, which a dynamic route tears down when the response is sent, so under this site's one-visitor-at-a-time traffic the refresh never lands. That shipped a 10 h-stale scoreline on `/wedstrijd/<id>`. Route-level ISR (`export const revalidate`) is fine — Vercel drives those regenerations platform-side. The one remaining exception is `src/app/api/calendar.ics/route.ts`; don't copy it.
- **A dynamic segment with `revalidate` needs `generateStaticParams` too.** Without it, `[param]` routes are server-rendered per request (`ƒ` in `next build`) and `revalidate` is inert config no request can honour (#2391). Export `generateStaticParams` returning `[]` — always exactly `[]`, never an enumeration (#3135: an enumerated slug's page render reads live Sanity at build, and one 503 there killed the build; `isr-route-config.test.ts` enforces it). It enumerates nothing at build time (no Sanity/PSD/BFF fetches, so the rate-limit rule is unaffected) but flips the segment to SSG + `dynamicParams`: unknown params render once on demand, then CDN-served on the declared interval. Converse: a segment dynamic for a structural reason (awaiting `searchParams`, as `/nieuws` does) must **not** export `revalidate` at all.
- **The BFF owns all aggregated and derived values.** Summaries (W/D/L, goalsFor/Against), enriched flags (`is_home`), and labels (`kcvv_team_label`) are computed by the BFF. Never re-derive them in a Server Component — the preconditions (enrichment ordering, status guards) are already enforced by the BFF and cannot be replicated safely on the page.
- **Sort before you pick.** Any derivation of "most recent" or "best" record must reference the sorted array. Place all sort operations before any logic that depends on ordering.
- **Test fixtures for "use newest record" must have distinguishable field values.** If a test validates that the most-recent match is used, the older fixture record must have a detectably different value (e.g. different name or logo) — identical values make sort-order bugs invisible.
- **Discriminated union branching must be exhaustive.** In IIFE, `switch`, or if-chain handling of a discriminated union (`subject.kind`, `articleType`, etc.), check each known case explicitly and return `undefined` / throw / `assertNever` on the implicit branch — never let the last case be the implicit fallthrough. Future union members (e.g. a new `kind: "team"`) will silently be mis-handled because the types won't catch additive changes to the union.
- **The adapter decides `kind` once; a renderer reads the discriminant and never re-derives it.** A match-domain view-model's `kind` (`"match"`/`"reservation"`/`"reduced"`) is computed exactly once, at the `Match`/`MatchDetail` → view-model boundary (`transformMatchToSchedule`, `transformMatchToCalendar`, `mapMatchToUpcomingMatch`, `matchDetailToHeroRow` — see `matchRowKind()` in `lib/utils/match-display.ts`). A renderer downstream narrows on `match.kind`; it must never re-run `isReducedMatchRow`-style logic against raw fields to reach the same answer a second time (#2802). Two independent derivations of the same fact drift silently, exactly like the paired-flags rule above — the fix here is narrower still: there is supposed to be only one call site per union, not two kept in sync.
- **Derive paired flags from the same source expression.** `hasX` + `xKind`, `enabled` + `mode`, etc. must flow from the same computed value: `const x = computeX(); const hasX = !!x; const xKind = x?.kind;` — not two independent `??` chains read from different places. Two sources drift silently while passing type checks, then lie to downstream consumers (analytics, JSON-LD, logs). Seen in #1333: `hasSubject` read from `about`, `subjectKind` read from raw `article.subject?.kind`.
- **Before adding a page-level runtime guard, trace the repository GROQ filter.** A page component gating on `article.publishedAt && …` is dead code if the repository's `findBySlug` already has `publishedAt <= now()` in its GROQ. Duplicate guards mislead reviewers into flagging legitimate emission paths and hide the real filter if it ever changes. Read the repo method first; gate only at the layer that owns the concern.

## Analytics Checklist for New Features

Every new user-facing feature or page **must** include an analytics section. Before closing any issue that adds interactive UI, verify:

- [ ] **Events defined**: new user interactions have named events in the PRD event taxonomy
- [ ] **`trackEvent` calls added**: all interactive components call `trackEvent` with the correct parameters
- [ ] **GTM updated** — add any new event-name prefix to `<repo-root>/scripts/analytics-taxonomy.mjs` (`prefixes`), then run `node scripts/sync-gtm.mjs` (`--dump` / `--dry-run` to preview) to sync the trigger RegEx + DLVs + GA4 Event-tag rows to the live container. That creates an unpublished version — **events do not fire to GA4 until it is published.** Never hand-edit the live trigger, and never create a second one: `buildTriggerRegex()` in the taxonomy is the single source of truth, so read the current prefix list there rather than from any doc. Per-prefix history and outstanding wiring: `docs/agents/phase-history.md`.
- [ ] **GA4 custom dimensions registered**: any new event parameters registered in GA4 → Admin → Data display → Custom definitions (run `node scripts/create-ga4-dimensions.mjs` or add manually)
- [ ] **GA4 explorations updated**: existing explorations updated, or new exploration created, if the feature introduces a new funnel or metric worth tracking
- [ ] **No PII**: no email addresses, phone numbers, names, or raw internal IDs in event parameters (hash internal IDs via `hashMemberId`)

When writing a PRD for a new feature, always include an **Analytics** section with:

- Event taxonomy table (event name, trigger, parameters)
- Which existing GA4 explorations need updating
- Whether new custom dimensions are needed, and which GTM DLVs and GA4 Event tag parameter mappings are required for any new event parameters

## SEO & Structured Data Checklist

When adding or updating a page route, verify:

- [ ] **Metadata**: `generateMetadata` exports title, description, and Open Graph fields appropriate for the page
- [ ] **Canonical URL**: page has a canonical URL (handled by `metadataBase` for most routes)
- [ ] **JSON-LD**: if the page represents a distinct Schema.org entity (article, event, person, organization, etc.), add or update a `<JsonLd>` block with the appropriate `schema-dts` type via a builder in `src/lib/seo/jsonld.ts`
- [ ] **Validate**: test new/changed JSON-LD output with [Google Rich Results Test](https://search.google.com/test/rich-results) or [Schema.org Validator](https://validator.schema.org/)

Structured data builders live in `src/lib/seo/jsonld.ts` and use `schema-dts` types for compile-time Schema.org validation. The generic `<JsonLd>` component (`src/components/seo/JsonLd.tsx`) renders any `WithContext<T>` to a `<script type="application/ld+json">` tag.

## Analytics & Instrumentation

- **Analytics belong in `useEffect`, never inside async fetch functions.** Async functions cannot see derived state (e.g. `filteredResults`) and are not re-triggered by client-side state changes. Use a `useEffect` with all terminal state variables in deps: `[data, isLoading, error, ...]`.
- **`error` is required in analytics effect deps and guard.** Without it, `trackNoResults` fires after failed fetches when `isLoading` becomes `false` and results are empty. Guard: `if (isLoading || error) return;`.
- **`AbortController`: abort on all exit paths.** Any early return in an async function that owns an `AbortController` must call `.abort()` and null the ref before returning — not just the happy path.
- **Analytics data source must match what the UI renders.** If the UI applies client-side filters, analytics must use the post-filter list, not the raw API response.
- **Privacy: classify each field before remediating.** User-generated input (e.g. query text) → sanitize/truncate via `sanitizeQuery`. Public editorial content (e.g. result titles) → keep as-is. Never remove non-user-authored fields.
- **Internal IDs in analytics events must be hashed.** Sanity document IDs and other internal identifiers sent to analytics are pseudonymous PII — hash them (e.g. djb2 via `hashMemberId`) before sending. Never forward raw internal IDs to `trackEvent`.
- **Dedup guard is required on any multi-side-effect handler.** Any event handler that calls `setState`, `localStorage`, navigation, or `trackEvent` must open with an early-return guard for the no-op case (`if (newValue === currentValue) return`) before any side effect fires. Reselecting the same tab/view must never emit duplicate analytics events.
- **Audit sibling analytics hooks before writing a new one.** Before creating a new `use*Analytics.ts` hook, read every existing hook in `src/hooks/` to extract data-transformation constraints (sanitization, hashing, field shape) — not just event-name inspiration. The peer hook is the reference implementation for what privacy constraints apply.
- **Grep before implementing any utility function.** Before writing a sanitization, hashing, or formatting helper, grep `src/lib/` for the function name. If it already exists, import it. Shared analytics utilities live in `src/lib/analytics/`.
- **A click-delegation wrapper is page/container-scoped by default — reach for a document-wide global listener only when the marker is a _class of primitive_ that can appear on any page AND its `data-*` payload is fully self-describing** (no page-level context needed, e.g. `<EmptyState reason="filtered">`'s `data-empty-state-undo-source`/`-facet`, read by `<EmptyStateUndoTracker>` mounted once in `app/layout.tsx`). If the event needs page-level context captured at mount (e.g. `error_view` needs `code`/`path`, which only the hosting route/error boundary knows), it stays a page-scoped wrapper like `<ErrorAnalytics>` — the repo's nine other `useDelegatedClick` consumers are all this shape. A global listener is a new pattern per instance, not a default: don't reach for it a second time without a comparable justification.
- **Analytics test assertions must encode the privacy policy, not the wire format.** Write `expect(...).toHaveBeenCalledWith("event", { member_id: hashMemberId(id), query_text: sanitizeQuery(q) })` — not the raw input values. A test that passes against a privacy-violating implementation is not a privacy test.
- **Bug fix commits need a regression test.** If a fix adds a guard condition, add a test case that exercises the unguarded path.

## Layered testing model

Four independent test layers, each owning a specific concern. Don't blur them — each layer's value comes from the bounded thing it asserts about.

| Layer                                   | Tool                                                                                                                                          | What it catches                                                                                                                                     | Lives at                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Unit / component logic                  | Vitest, `vitest.config.ts` (`pnpm test`)                                                                                                      | Component behaviour, hooks, utility correctness                                                                                                     | `**/*.test.tsx`, `**/*.test.ts`                                                     |
| **Storybook `play` (runtime geometry)** | **Vitest, `vitest.storybook.config.ts` — `@storybook/addon-vitest` (`pnpm test:storybook`, a separate command, not folded into `pnpm test`)** | **Overflow arrows, sticky offsets, scroll-spy — real-browser geometry against a fixture that guarantees the condition, never live content (#3146)** | **`apps/web/src/**/*.stories.tsx`'s `play` exports**                                |
| Component visual regression             | Storybook + `@storybook/test-runner` (`pnpm vr:update:story`)                                                                                 | Pixel-level regressions on `UI/*`, `Features/*`, `Layout/*` stories                                                                                 | `apps/web/src/**/*.stories.tsx` + baselines under `apps/web/test/vr/__snapshots__/` |
| **Page-level functional smoke**         | **Playwright e2e (`pnpm test:e2e`)**                                                                                                          | **Page renders 200/404, `<h1>` + nav + footer present, no broken images, no `console.error`**                                                       | **`apps/web/test/e2e/`**                                                            |

`Pages/*` Storybook stories exist as design references but are **not** VR-tested — page composition correctness is the e2e suite's job. See `docs/prd/page-level-testing-rework.md` for the rationale.

`@storybook/addon-a11y` (registered in `.storybook/main.ts`) **does run** — inside the visual-regression job, on every `vr`-tagged story (not every story; `Pages/*`, per the line above, carries no `vr` tag and is never visited). **Storybook VR owns accessibility** (decided 2026-09-25); it does not gate yet — see root `.claude/CLAUDE.md`'s workspace table (`apps/web` row, accessibility note) for the measured violation count and gating status. That note is authoritative; this line does not repeat its numbers.

### Storybook `play` is a separate layer from visual regression — don't confuse the two runners

Two entirely different tools execute a story's `play` function, and they answer different questions:

- **`@storybook/addon-vitest`** (`apps/web/vitest.storybook.config.ts`, `pnpm test:storybook`) mounts **every** story in a real browser (Playwright/Chromium) and runs its `play` — 208 story files, ~1 100+ tests, not just the ~20 that define one (measured #3083 correction: wiring the addon smoke-tests every story). This is the layer geometry assertions belong in (#3146, spec §0.2/§4.13): `overflow arrows, sticky offsets, scroll-spy` against a fixture that **guarantees** the condition (many chips, a wide track, a pinned hash) rather than against whatever a live team/route happens to render that day.
- **`test-storybook`** (`pnpm vr:*`) captures **pixels** against a built `storybook-static`, and only visits stories that opted in via the `vr` tag (`--includeTags vr --excludeTags vr-skip` — see "Opt-in via the `vr` tag" in `docs/agents/testing-ops.md`). It also runs `play`, since mounting a story always does — which is exactly why a **new** geometry `play` story must stay untagged for `vr` (or explicitly carry `tags: ["!vr"]` if its file's `meta` already opts in), never mutate visible state a baseline hasn't captured, and never call `vr:*` scripts to "check" it.

A story's `play` never runs against live data in either layer — the E2E layer owns nothing geometric at all (§0.2: "Geometry, ever" is a Playwright **must-not**).

**A separate config file, deliberately never folded into `pnpm test` (measured 2026-09-25).** `apps/web/vitest.storybook.config.ts` is its own standalone Vitest config, run only via `pnpm test:storybook` — never as a second entry in `vitest.config.ts`'s own project list, and never invoked in the same `vitest` CLI run as the `unit` suite. Tried first, and both reproduced the same class of breakage: `process.env.NODE_ENV` flips from Vitest's default `"test"` to `"development"` for the whole Node process the moment `storybookTest()` resolves `.storybook/main.ts` → `@storybook/nextjs-vite`'s own Next-config loading — `process.env` is shared by every project in one Vitest invocation, and Next's `next/image` loader only skips its `remotePatterns` hostname validation under `NODE_ENV === "test"`, so 12 **unrelated** unit-test files broke (`Invalid src prop … hostname "cdn.sanity.io" is not configured`). Patching that one leak (an explicit `test.env` override) surfaced a second, harder one: Vite's own SSR resolve `conditions` also leaked across projects, breaking 5 more files importing `next/dist/server/og/image-response.js` (`Cannot find module 'react-server-dom-webpack/static'`). A genuinely separate config file + CLI invocation sidesteps the whole class — CI runs it as its own step in `Quality Checks + Build`, after "Run tests", not through `turbo` (no upstream package build dependency to cache against, same as `test:e2e`).

**Known gotchas, measured 2026-09-25 while wiring the addon:**

- `@storybook/nextjs-vite` aliases bare `react`/`react-dom` to Next's own vendored, single-file copies (`next/dist/compiled/react`) for build-parity; Vite forwards that into esbuild's dependency-optimizer as a package-prefix alias, and esbuild auto-expands any UNLISTED subpath against it. `import "react/compiler-runtime"` (present in `@portabletext/react`'s dist under React 19, compiler on or off) breaks this way — the plugin already special-cases `jsx-runtime`/`jsx-dev-runtime` for the identical reason; `vitest.storybook.config.ts` adds one more explicit `resolve.alias` entry rather than patching the plugin.
- A real anchor click (`userEvent.click`/`.click()` on an `<a href="#id">`) inside this addon's iframe reproducibly crashes the Vitest Browser Mode RPC channel ("Browser connection was closed"). Set `window.location.hash` directly instead — same `hashchange` dispatch, no native navigation.
- `vitest/browser`'s `page.viewport(w, h)` (dynamically imported **inside** `play`, never as a top-level import — see the next point) is how a geometry fixture forces a specific viewport; reset it in a `finally` block, since Vitest Browser Mode reuses one tab across a file's tests.
- A **top-level** `import { page } from "vitest/browser"` throws outside Vitest Browser Mode. A story file whose `meta` carries the `vr` tag also loads under `test-storybook`/`storybook dev`, neither of which is Browser Mode — import it dynamically inside the specific `play` that needs it.
- Three story files (`JeugdLanding.loading.stories.tsx`, `TeamsLanding.loading.stories.tsx`, `NewsListingClient.stories.tsx`) fail to even **import** under this project — `ReferenceError: __dirname is not defined`, thrown while loading `next/server`'s `userAgent()` transitively via `src/lib/effect/runtime.ts` (each imports a route's `loading.tsx`, which imports data constants from its sibling `page.tsx`). None carries the `vr` tag, so the VR layer never exercised this path either. Excluded via `vitest.storybook.config.ts`'s own `test.exclude` (a story-level `!test` tag cannot fix an import-time crash) — a pre-existing coupling this wiring surfaced, out of scope for #3146.

### Import the module under test at module scope

**Never `await import()` a page, layout, or route module inside an `it()` body** — Vitest charges dynamic imports against `testTimeout`, while top-level imports are paid during the untimed collect phase. A page graph takes ~3 s to resolve, so an in-body import fails deterministically under CI contention (#2362). The same goes for any module the code under test dynamically imports. Hoist it below the `vi.mock` calls (Vitest hoists those above all module-level code). Prefer a static `import`; use `await import()` only when a mock factory closes over a `const` in the file, which a static import would hoist above → TDZ (see `(main)/ploegen/(index)/page.test.tsx`).

### Drive the viewport with `setViewport`, never `innerWidth =`

**A test never writes `window.innerWidth` or `innerHeight`** — not by assignment, not by `Object.defineProperty`. Vitest's DOM shim keeps the value in its own map: it reads back, but happy-dom never sees it, so `matchMedia` and `resize` stay on the old viewport. Use `window.happyDOM.setViewport({ width, height })`. A lint rule enforces this (#3142). A `matchMedia` `change` on the first narrow of an already-matching query still needs a stub — that one is a happy-dom bug (flake ledger, class L).

### A test may not use more than half its own timeout

**The budget: a test body spends at most half its own timeout** — 2 500 ms under Vitest's default 5 000 ms, or half of a timeout the test sets itself (`pre-commit.test.ts` passes `60_000` because it spawns real ESLint). It holds in every Vitest workspace; the root `.claude/CLAUDE.md` states it for the others and points here. A test over budget is one slow runner from red, so fix the cause: assert once over collected violations instead of once per loop iteration (`player-figure-variant.test.ts`, #3128), and put a debounce or delay on fake timers (`vi.useFakeTimers()` + `userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync })`, as `SearchInterface.test.tsx` does) instead of a real-clock `waitFor`. **Never raise the timeout to make room.** Under fake timers, Testing Library's `waitFor` steps the clock only if it sees a `jest` global, so stub one: `vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime })`.

**No lint rule enforces this, on purpose.** The expensive shape (assertions inside a loop) is visible in the source, but its cost comes from the iteration count, which no selector can see: 9 of the 10 files with `expect()` inside a loop iterate a handful of fixtures and cost nothing (#3126 D5).

**Check it on demand from CI logs, never with a new run.** Vitest already prints every test over 300 ms, with its duration, in each CI log. Every Vitest suite runs in the `Quality Checks + Build` job, so this reads only that job's log (update the name if the job is renamed — a stale name prints nothing) and lists every test at or over 2 500 ms in the last 30 `ci.yml` runs, slowest first:

```bash
gh run list --workflow ci.yml -L 30 --json databaseId --jq '.[].databaseId' |
  while read -r id; do gh run view "$id" --json jobs --jq '.jobs[] | select(.name == "Quality Checks + Build" and .conclusion != "skipped") | .databaseId'; done |
  while read -r job; do gh run view --job "$job" --log 2>/dev/null; done |
  perl -ne 's/\e\[[0-9;]*m//g; $f = $1 if / (\S+\.test\.\w+) \(\d+ tests?/; print "$2\t$f > $1\n" if / {5,}\S+ (.+?) +(\d+)ms$/ && $2 >= 2500' |
  sort -rn | awk -F'\t' '!seen[$2]++'
```

A hit is a breach only if it is over half **its own** timeout. **A breach opens an issue; it never turns a check red** — a slow runner is not a regression. The last census is recorded in the flake ledger, class M.

### Running the suites

`docs/agents/testing-ops.md` is the operational manual for the bottom two layers — how to run and scope a VR capture, the Docker memory floor, the `vr` / `vr-skip` / `vr.disable` tag contracts, the decision tree on a failing VR job, baseline-update flow, e2e local workflow, and CI path triggers. **Read it before running or debugging either suite**; don't reconstruct the commands from memory.

Rules worth knowing before you get there, because getting them wrong costs a CI round:

- **VR baselines ship in the same PR as the code**, captured locally via Docker. Never open the PR first and capture after, and never reach for `@kcvv-bot update-vr-baselines` for a baseline your own change caused — that bot is for drift you cannot reproduce locally.
- **Every capture goes through a wrapper script** — `pnpm --filter @kcvv/web run vr:update:story -- <story-id-prefix>`, or `vr:update:single` below the 8 GB Docker floor. `apps/web/scripts/vr-docker.mjs` refuses anything unscoped (`vr:check` always, the update modes without a story-id pattern), and `VR_FULL_RUN=1` is the only override. A full run is ~40 min on CI's native amd64 and ~2.5 h locally under the emulated pin. Reaching the runner directly captures on arm64 and will not match CI. See "The unscoped guard" in `docs/agents/testing-ops.md` (#2380, #3140).
- **On an unpinned VR container, do not treat a local VR failure as a regression** without first checking the story against CI's render — arm64 on Apple Silicon drifts on display-serif stories. With the `platform: linux/amd64` pin (the committed default) a local failure is real. See "The amd64 pin — scoped runs only" in `docs/agents/testing-ops.md` (#2370).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
