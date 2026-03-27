# apps/web — Next.js App

This is the KCVV Elewijt club website. See root `.claude/CLAUDE.md` for monorepo-wide rules.

## Implemented Routes

`/`, `/nieuws`, `/nieuws/[slug]`, `/spelers/[slug]`, `/ploegen`, `/ploegen/[slug]`, `/jeugd`, `/kalender`, `/wedstrijd/[matchId]`, `/sponsors`, `/club/organigram`, `/club/geschiedenis`, `/hulp`, `/zoeken`, `/privacy`

## Design System & Storybook (MANDATORY)

### When to update UI stories

- **New design system component** (`src/components/design-system/<Name>/`) → create `<Name>.stories.tsx` alongside with title `UI/<Name>`, add `tags: ["autodocs"]`, write a Playground + all variant stories. Also add to barrel `src/components/design-system/index.ts`.
- **New icon** added to `src/lib/icons.ts` → add to the `Foundation/Spacing & Icons` icon grid in `src/stories/foundation/SpacingAndIcons.mdx`.
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

| Group         | What goes here                                                                                                                                   | title prefix         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| `Foundation/` | Design tokens only — Colors, Typography, Spacing, Icons (MDX docs, no component stories)                                                         | `Foundation/`        |
| `UI/`         | Pure design system primitives with zero domain knowledge — could ship as a standalone package                                                    | `UI/`                |
| `Features/`   | Domain components that require KCVV data types (Articles, Calendar, Home, Matches, Organigram, Players, Responsibility, Search, Sponsors, Teams) | `Features/<Domain>/` |
| `Layout/`     | Page infrastructure — PageHeader, PageFooter, PageTitle                                                                                          | `Layout/`            |
| `Pages/`      | Full-page compositions                                                                                                                           | `Pages/`             |

**Rule:** If a new component knows about `MatchResult`, `Player`, `Sponsor`, or any other KCVV domain type → it goes in `Features/<Domain>/`. If it's a generic primitive → `UI/`. Never nest domain components directly at the top level.

### MDX table gotcha

MDX 2 (Storybook 10) does **not** parse GFM pipe-table syntax (`| col |`) without `remark-gfm`. Always use native HTML `<table>` elements in `.mdx` files.

## Design Conventions

**Storybook is the authoritative design system reference.** Check `Foundation/Colors`, `Foundation/Typography`, and `Foundation/Spacing & Icons` stories for all design tokens (colors, spacing, border-radius, typography). Do not hardcode values not defined there.

### Design system locations

| Concern           | Path                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| Component source  | `src/components/design-system/<Name>/`                                        |
| Component stories | `src/components/design-system/<Name>/<Name>.stories.tsx` (title: `UI/<Name>`) |
| Component tests   | `src/components/design-system/<Name>/<Name>.test.tsx`                         |
| Barrel export     | `src/components/design-system/index.ts`                                       |
| Icons             | `src/lib/icons.ts`                                                            |
| Foundation docs   | `src/stories/foundation/`                                                     |
| Design tokens     | `src/app/globals.css` (`@theme {}`)                                           |

## Analytics Checklist for New Features

Every new user-facing feature or page **must** include an analytics section. Before closing any issue that adds interactive UI, verify:

- [ ] **Events defined**: new user interactions have named events in the PRD event taxonomy
- [ ] **`trackEvent` calls added**: all interactive components call `trackEvent` with the correct parameters
- [ ] **GTM updated**: new event names not already matched by the `responsibility_|search_|organigram_|related_content_` regex need a new trigger/tag in GTM
- [ ] **GA4 custom dimensions registered**: any new event parameters registered in GA4 → Admin → Data display → Custom definitions
- [ ] **GA4 explorations updated**: existing explorations updated, or new exploration created, if the feature introduces a new funnel or metric worth tracking
- [ ] **No PII**: no email addresses, phone numbers, names, or raw internal IDs in event parameters (hash internal IDs via `hashMemberId`)

When writing a PRD for a new feature, always include an **Analytics** section with:
- Event taxonomy table (event name, trigger, parameters)
- Which existing GA4 explorations need updating
- Whether new custom dimensions are needed

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
- **Analytics test assertions must encode the privacy policy, not the wire format.** Write `expect(...).toHaveBeenCalledWith("event", { member_id: hashMemberId(id), query_text: sanitizeQuery(q) })` — not the raw input values. A test that passes against a privacy-violating implementation is not a privacy test.
- **Bug fix commits need a regression test.** If a fix adds a guard condition, add a test case that exercises the unguarded path.
