# apps/web — Next.js App

This is the KCVV Elewijt club website. See root `.claude/CLAUDE.md` for monorepo-wide rules.

## Implemented Routes

`/`, `/nieuws`, `/nieuws/[slug]`, `/spelers/[slug]`, `/ploegen`, `/ploegen/[slug]`, `/jeugd`, `/kalender`, `/wedstrijd/[matchId]`, `/events`, `/events/[slug]`, `/sponsors`, `/club/organigram`, `/club/geschiedenis`, `/hulp`, `/zoeken`, `/privacy`

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
| `Layout/`     | Page infrastructure — PageHeader, PageFooter                                                                                                     | `Layout/`            |
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

## Effect & Server Component Patterns

- **Never wrap `runPromise` in try/catch in Server Components.** Effect errors must bubble to the Next.js error boundary. The only permitted exception is converting `HttpNotFound` to `notFound()` via `Effect.catchTag("HttpNotFound", () => Effect.sync(() => notFound()))`.
- **Use `Effect.catchTag("HttpNotFound")`, not `Effect.catchAll`.** When fetching multiple items in `Effect.all`, only 404s should be silently treated as "failed". `Effect.catchAll` masks real upstream errors (503s, network failures) as empty results — document the reason if a broader catch is ever necessary.
- **The BFF owns all aggregated and derived values.** Summaries (W/D/L, goalsFor/Against), enriched flags (`is_home`), and labels (`kcvv_team_label`) are computed by the BFF. Never re-derive them in a Server Component — the preconditions (enrichment ordering, status guards) are already enforced by the BFF and cannot be replicated safely on the page.
- **Sort before you pick.** Any derivation of "most recent" or "best" record must reference the sorted array. Place all sort operations before any logic that depends on ordering.
- **Test fixtures for "use newest record" must have distinguishable field values.** If a test validates that the most-recent match is used, the older fixture record must have a detectably different value (e.g. different name or logo) — identical values make sort-order bugs invisible.
- **Discriminated union branching must be exhaustive.** In IIFE, `switch`, or if-chain handling of a discriminated union (`subject.kind`, `articleType`, etc.), check each known case explicitly and return `undefined` / throw / `assertNever` on the implicit branch — never let the last case be the implicit fallthrough. Future union members (e.g. a new `kind: "team"`) will silently be mis-handled because the types won't catch additive changes to the union.
- **Derive paired flags from the same source expression.** `hasX` + `xKind`, `enabled` + `mode`, etc. must flow from the same computed value: `const x = computeX(); const hasX = !!x; const xKind = x?.kind;` — not two independent `??` chains read from different places. Two sources drift silently while passing type checks, then lie to downstream consumers (analytics, JSON-LD, logs). Seen in #1333: `hasSubject` read from `about`, `subjectKind` read from raw `article.subject?.kind`.
- **Before adding a page-level runtime guard, trace the repository GROQ filter.** A page component gating on `article.publishedAt && …` is dead code if the repository's `findBySlug` already has `publishedAt <= now()` in its GROQ. Duplicate guards mislead reviewers into flagging legitimate emission paths and hide the real filter if it ever changes. Read the repo method first; gate only at the layer that owns the concern.

## Analytics Checklist for New Features

Every new user-facing feature or page **must** include an analytics section. Before closing any issue that adds interactive UI, verify:

- [ ] **Events defined**: new user interactions have named events in the PRD event taxonomy
- [ ] **`trackEvent` calls added**: all interactive components call `trackEvent` with the correct parameters
- [ ] **GTM updated**: new event names not already matched by the `responsibility_|search_|organigram_|related_content_|homepage_` regex need a new trigger/tag in GTM; new event parameters need a Data Layer Variable (DLV) created in GTM and mapped into the GA4 Event tag's parameter fields
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
- **Analytics test assertions must encode the privacy policy, not the wire format.** Write `expect(...).toHaveBeenCalledWith("event", { member_id: hashMemberId(id), query_text: sanitizeQuery(q) })` — not the raw input values. A test that passes against a privacy-violating implementation is not a privacy test.
- **Bug fix commits need a regression test.** If a fix adds a guard condition, add a test case that exercises the unguarded path.

## Visual Regression Testing

Self-hosted Playwright + `@storybook/test-runner`. Baselines live under
`apps/web/test/vr/__snapshots__/` as `<story-id>--<viewport>.png` and are
committed to the repo. Background and rationale: `docs/prd/visual-regression-testing.md`.

### Local workflow (Docker required)

Prerequisite: Docker Desktop running. Local runs use the pinned
`mcr.microsoft.com/playwright:v1.59.1-noble` image so font rendering matches CI
exactly.

```bash
# Compare against committed baselines.
pnpm --filter @kcvv/web run vr:check

# Accept the current rendering as the new baseline (commit the resulting PNGs).
pnpm --filter @kcvv/web run vr:update

# Print the diff PNG path(s) for a failed story so the Read tool can inspect them.
pnpm --filter @kcvv/web run vr:diff layout-pagefooter--standalone
```

`vr:check` and `vr:update` rebuild Storybook first, then run the test-runner
inside Docker. First run pulls the Playwright image (~1.3 GB). Steady-state run
time on a warm cache is ~30 s for the Phase 1 tracer-bullet set.

### Path-based triggering

VR runs in CI only when a PR touches one of these globs (path-based, not
label-based — see PRD §4):

```text
apps/web/src/**
apps/web/.storybook/**
apps/web/public/**
apps/web/package.json
```

PRs that change only `apps/api/**`, `packages/**`, or infrastructure don't run
VR. There is no `visual` label and none should be introduced.

### Decision tree on a failing VR job

When `pnpm vr:check` (or the CI `visual-regression` job) reports a diff:

1. **Read each diff PNG** via the `Read` tool (vision-enabled — Claude sees the
   actual visual difference). For CI, download the `vr-diff-output` artifact.
2. **Cross-reference with the issue's acceptance criteria.**
3. **If the diff aligns with the issue's stated goal** (e.g. the issue says
   "redesign card shadow" and the diff shows a changed shadow):
   - Run `pnpm --filter @kcvv/web run vr:update` locally (or post the PR
     comment `@kcvv-bot update-vr-baselines`).
   - Commit with message `chore(vr): update baselines — issue #<N>` plus a
     one-line rationale per changed baseline (`- <story-id>: shadow adjusted
per AC#3`).
   - Continue.
4. **If the diff is unexpected or outside the issue's scope** (e.g. the issue
   says "fix footer safe area" but the diff shows a changed button colour on an
   unrelated story):
   - **Halt.**
   - Report the unexpected regression to the user as a blocker, including the
     diff PNG path.
   - Do **not** auto-update baselines to paper over the regression.
5. **PR body** must include a `## VR baselines` section enumerating changed
   baselines and their justifications, so the reviewer sees the intentional
   visual scope at a glance.

This loop is canonical for any Claude session — Ralph, `/spec`, ad-hoc — not
Ralph-specific.

### Opt-in via the `vr` tag

The VR suite runs `test-storybook --includeTags vr`, so only story files tagged
with `vr` in their meta participate. Add the tag at the meta level:

```typescript
const meta = {
  title: "UI/SomeComponent",
  component: SomeComponent,
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SomeComponent>;
```

Phase 1 tags only `Layout/PageFooter`, `UI/SectionTransition`, and
`UI/SectionStack`. Phase 2+ broadens this as additional design system / layout
files come online. Within a tagged file, the `PHASE1_STORIES` allowlist in
`.storybook/test-runner.ts` selects which exports get baselined — Phase 2
removes that allowlist.

### Per-story escape hatch

A story can opt out of VR via its meta:

```typescript
export default {
  title: "UI/SomeComponent",
  component: SomeComponent,
  parameters: {
    vr: { disable: true },
  },
};
```

Reserved for dev-debug stories only, never for routine opt-out. If a non-debug
story tempts you to disable VR, that's a signal the story's fixture
determinism needs fixing instead. A custom viewport set is also supported —
`parameters.vr.viewports = ["desktop"]` — for stories that only render
meaningfully at one breakpoint.

### `vr-skip` — discovery-time skip for crashing stories

`parameters.vr.disable = true` only suppresses **screenshot capture** in
`postVisit`; the test-runner still visits the story and runs its `play`
function. For stories that crash during render or `play` (a missing fixture,
an inherently broken edge case), tag the story with `vr-skip` so the runner
excludes it at discovery — before the page is evaluated:

```typescript
export const FlatHierarchy: Story = {
  tags: ["vr-skip"],
  render: () => /* ... */,
};
```

The `vr:run` / `vr:run:update` scripts in `apps/web/package.json` (and the
matching `Dockerfile.vr` ENTRYPOINT) pass `--excludeTags vr-skip` to the
test-runner so tagged stories never load. Reserve `vr-skip` for stories whose
crash mode cannot be addressed by adjusting fixtures alone — e.g. an edge-case
story that intentionally exercises an unsupported path of the underlying
component or library. Document the reason inline (one comment line).

### Inspecting diffs

Failed CI runs upload `vr-diff-output` artifacts containing the diff PNG and
the captured "actual" PNG. Both are vision-readable by Claude's `Read` tool —
just point it at the file path. Locally, `pnpm --filter @kcvv/web run vr:diff
<story-id>` prints the on-disk path(s) under
`apps/web/test/vr/__diff_output__/`.

### Baseline-update bot flow

A maintainer can comment `@kcvv-bot update-vr-baselines` on a PR. The
`vr-baseline-update.yml` workflow re-runs the suite with `-u`, commits the
regenerated PNGs to the PR branch as `kcvv-vr-bot`, and pushes. The push
re-triggers `visual-regression` to verify the new baselines pass. CodeRabbit
ignores PNG-only commits and the bot identity (see `.coderabbit.yaml` and PRD §9).

**Bot setup (one-time):** see the header comment in
`.github/workflows/vr-baseline-update.yml` — requires a GitHub user
`kcvv-vr-bot` with a PAT scoped for `contents: write` on this repo, stored as
the `KCVV_VR_BOT_TOKEN` secret. Same-repo PRs only; fork PRs are rejected
explicitly. A GitHub App is the cleaner long-term replacement.

### Anti-patterns

- **No `[skip ci]`** in baseline-update commits. CodeRabbit quota is handled
  separately; GitHub CI must run to verify the new baselines.
- **No native Playwright** outside Docker on macOS. Local font rendering
  diverges from Linux CI and produces false-positive diffs. Always use
  `vr:check` / `vr:update`.
- **No baselines committed from macOS or Windows hosts.** Only Docker-local
  (Linux-matched) or the CI bot.
- **No `visual` label.** Triggering is path-based; never introduce a label gate.
