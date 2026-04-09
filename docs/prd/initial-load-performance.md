# PRD: Initial Load Performance

## 1. Problem Statement

A read-only audit of `apps/web/` (2026-04-09) surfaced five concrete issues that inflate initial page load and block first paint on production routes:

1. **~7 MB of uncompressed static photos** ship from `public/images/history/*` and `public/images/ultras/*` — `ultras-kampioen.jpeg` alone is 3.3 MB. These are editorial content hardcoded into the repo, with no WebP variants, no responsive sizing, and no CMS lifecycle. A single cold visit to `/club/geschiedenis` or the ultras page transfers 4–5 MB of images.
2. **Adobe Typekit loads render-blocking** via `<Script strategy="beforeInteractive">` in `app/layout.tsx:89-97`, with font stacks in `globals.css:134-137` that list Typekit fonts _before_ any real system-font fallback — producing FOIT on slow networks. A grep of the codebase confirms that **two of the four Typekit-loaded fonts are free, open-source fonts** (`montserrat`, `ibm-plex-mono`) that don't need to come from Typekit at all, plus an unused `acumin-pro` fallback in every title stack.
3. **`vanilla-cookieconsent` library CSS is in the critical path** — `globals.css:2` imports it at the top of the global stylesheet, putting 3–5 KB of modal styles on every page load, even though the banner only renders once per visitor.
4. **`EnhancedOrgChart` bypasses the lucide barrel** — `components/organigram/chart/EnhancedOrgChart.tsx:30-38` imports 7 icons directly from `"lucide-react"` instead of `@/lib/icons`, breaking the selective re-export pattern the rest of the codebase follows.
5. **`/hulp` blocks its shell on data** — the server component awaits `ResponsibilityRepository.findAll()` synchronously, with no Suspense boundary. Recent commits (d9c7fd21, d140bb21) introduced a shared skeleton factory for `/jeugd` and `/club`, but `/hulp` was refactored on a different branch (3e9bd388, b5faddf0) and didn't receive the same streaming treatment.

None of these block functionality — they are pure performance regressions slowly accreted over time. They are bundled into one PRD because they came from one audit and share a milestone, not because they depend on each other. Each phase is independently shippable.

## 2. Scope

**Touched:**

- `apps/web` — all five phases (layout, globals, components, routes, icons barrel, inline font stacks)
- `packages/sanity-schemas` — Phase 5 only (new `historyEra` document type, possibly `ultrasPhoto`)
- `apps/studio` + `apps/studio-staging` — Phase 5 only, via the shared schema package (auto-propagates)

**Explicitly out of scope:**

- `apps/api`, `packages/api-contract` — no BFF or contract changes
- Broader bundle analysis / code-splitting review — the audit surfaced only the issues above; no speculative "let's also…"
- Third-party script defer beyond Typekit (GTM is already `afterInteractive`, per audit)
- `sanitize-html` in `SanityArticleBody` — flagged by the audit but architectural, left alone
- `html-to-image` in `SharePage` — also flagged, but already dynamic per tests; not in this PRD
- Replacing Typekit entirely — only trimming the kit and deferring the load
- Any CLS / layout-shift work — separate concern tracked by `loading-skeleton-consistency.md`
- Performance budgets or CI Lighthouse gates — out of scope; could be a follow-up PRD

## 3. Tracer Bullet

**Phase 1 = `perf(ui,deps): dynamic-load vanilla-cookieconsent CSS inside banner`**. It's the smallest change that touches the global CSS entry point, proves the "move a critical-path import into a client component" pattern works under App Router, and exits the worktree loop fast — giving us a clean signal on the Ralph workflow for the rest of the phases.

Why not Phase 5 (Sanity migration) as tracer? Because it's the largest and the slowest to validate. The tracer's job is to warm up the workflow, not to prove the hardest pattern.

## 4. Phases

Phases are **ordered by ascending size/risk**. They have **no blockedBy relationships** between them — each can be picked up independently, and the order is a _recommendation_ not a dependency chain. Parallel work is fine.

### Phase 1: Cookie consent CSS off critical path — tracer bullet (#1264)

Move `@import "vanilla-cookieconsent/dist/cookieconsent.css"` out of `globals.css` and into the `CookieConsentBanner` client component. Keep the KCVV theme overrides (`:root { --cc-* }` block in `globals.css:469-534`) where they are so cascade order is preserved.

### Phase 2: EnhancedOrgChart lucide barrel consistency (#1265)

Add `ZoomIn`, `ZoomOut`, `Maximize2`, `Minimize2`, `Expand`, `Minimize`, `Download` to `apps/web/src/lib/icons.ts`. Replace the direct `"lucide-react"` import in `EnhancedOrgChart.tsx` with `@/lib/icons`. Update `src/stories/foundation/SpacingAndIcons.mdx` per the mandatory Storybook rule in `apps/web/CLAUDE.md`.

### Phase 3: Self-host free fonts via `next/font`, defer Typekit (#1266)

Load `montserrat` and `ibm-plex-mono` via `next/font/google` (self-hosted, preloaded, no external round-trip). Wire their CSS variables into the `@theme` block in `globals.css`. Switch the Typekit `<Script>` from `beforeInteractive` to `afterInteractive`. Drop `acumin-pro` from every font stack (CSS `@theme` + inline `style={{ fontFamily }}` usages across ContactCard, TeamCard, PlayerProfile, ResponsibilityFinder, organigram/NodeRenderer, and all share templates). Put real system-font fallbacks first in the remaining Typekit stacks (`quasimoda` + `stenciletta`). Update `apps/web/src/stories/foundation/Typography.mdx` to reflect the new token sources.

**Manual out-of-band step (document in PR):** trim the Adobe Fonts kit to only serve `quasimoda` + `stenciletta`, and to only the weights the codebase actually uses (to be determined during /spec by grepping the page for `font-normal|font-medium|font-bold` usage around those font families).

### Phase 4: Stream `/hulp` via Suspense (#1267)

Wrap the responsibility-dependent section of `/hulp/page.tsx` in `<Suspense>` with a skeleton fallback that matches the shared section factory pattern from `/jeugd` and `/club`. Verify the existing `loading.tsx` is still appropriate or deprecate it in favor of streaming. Confirm `/jeugd` and `/club` are in fact using Suspense (not just route-level `loading.tsx`) — if not, extend scope via a separate issue.

### Phase 5: Migrate history + ultras photos to Sanity DAM (#1268)

Add a `historyEra` document type to `packages/sanity-schemas/src/` (single schema covering both history and ultras photos unless /spec discovery says otherwise). Populate it via Sanity Studio (staging → production, per `feedback_sanity_migrations.md`). Add a `HistoryRepository` in `apps/web/src/lib/repositories/` that GROQs the documents and returns view models. Refactor `/club/geschiedenis` and the ultras page to consume the repository, render with `next/image` + `@sanity/image-url` (WebP + auto format + responsive `sizes`). Delete `apps/web/public/images/history/` and `apps/web/public/images/ultras/`.

## 5. Acceptance Criteria per Phase

### Phase 1 — Cookie consent CSS

- [ ] `@import "vanilla-cookieconsent/dist/cookieconsent.css"` removed from `apps/web/src/app/globals.css`
- [ ] Library CSS imported from inside `CookieConsentBanner` (or its init path)
- [ ] KCVV `--cc-*` theme overrides still apply to the rendered modal (manual check: open banner on a fresh session, visuals unchanged)
- [ ] Cookie banner renders identically on first visit
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — Icons barrel

- [ ] 7 icons (`ZoomIn`, `ZoomOut`, `Maximize2`, `Minimize2`, `Expand`, `Minimize`, `Download`) exported from `apps/web/src/lib/icons.ts`
- [ ] `EnhancedOrgChart.tsx` imports only from `@/lib/icons`
- [ ] `src/stories/foundation/SpacingAndIcons.mdx` icon grid updated to include the 7 new icons
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3 — Fonts

- [ ] `next/font/google` imports for Montserrat and IBM Plex Mono in `app/layout.tsx`, with only the weights actually used
- [ ] Font CSS variables wired into `globals.css` `@theme` (replacing raw name in `--font-family-body` / `--font-family-mono`)
- [ ] Typekit `<Script>` moved from `beforeInteractive` to `afterInteractive`
- [ ] `acumin-pro` removed from all font stacks — including every inline `style={{ fontFamily }}` grep hit (share templates, ContactCard, TeamCard, PlayerProfile, ResponsibilityFinder, organigram/NodeRenderer)
- [ ] System font fallbacks (`-apple-system, system-ui, …`) lead the remaining `quasimoda` and `stenciletta` stacks
- [ ] `Typography.mdx` updated to reflect the new token sources
- [ ] PR body documents the manual "trim the Adobe Fonts kit" step so the human performs it before merge
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4 — Suspense on `/hulp`

- [ ] `/hulp` top-level shell (header, hero, background) renders before `ResponsibilityRepository.findAll()` resolves
- [ ] Responsibility list wrapped in `<Suspense>` with a skeleton fallback matching the shared factory pattern
- [ ] Existing client-side hulp search still works end-to-end
- [ ] Pre-existing `/hulp` analytics events still fire (per `feedback_analytics_instrumentation.md`)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 5 — Sanity DAM migration

- [ ] `historyEra` (and any extra) document type(s) in `packages/sanity-schemas/src/` + exported from the barrel
- [ ] Schema renders correctly in both `apps/studio` and `apps/studio-staging` (auto via shared package)
- [ ] Content migrated into staging, then production (per `feedback_sanity_migrations.md`)
- [ ] `HistoryRepository` in `apps/web/src/lib/repositories/` with unit test coverage consistent with sibling repositories
- [ ] `/club/geschiedenis` and ultras page render images via `next/image` + `@sanity/image-url`, with `sizes`, `fm=webp`, `auto=format`
- [ ] `apps/web/public/images/history/` and `apps/web/public/images/ultras/` deleted
- [ ] Cold-load transfer size for `/club/geschiedenis` measurably lower than current baseline (Chrome DevTools Network panel, 4G throttle; baseline captured in the issue before edits begin)
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] CLAUDE.md updated if new canonical repository/schema paths need documenting (per root CLAUDE.md "CLAUDE.md Is a Required Deliverable" rule)

## 6. Effect Schema / api-contract Changes

None directly in `packages/api-contract`. Phase 5 adds a new Sanity schema in `packages/sanity-schemas/src/` and a new Sanity-backed repository in `apps/web/src/lib/repositories/` — this is Sanity/GROQ territory, not Effect HTTP API / BFF territory, so no contract changes.

## 7. Open Questions

- [ ] **Phase 3 — Montserrat weights.** Which Montserrat weights does the codebase actually use? Grep `font-normal|font-medium|font-bold` in contexts using `--font-family-body` during /spec. Fewer weights = smaller `next/font` payload. Will be resolved in /spec before the issue is marked `ready`.
- [ ] **Phase 3 — IBM Plex Mono weights.** Same question. Grep the `font-mono` usage sites (MatchHeader, MatchEvents, FilterTabs, KeyboardShortcuts, ContactCard, organigram/NodeRenderer) for the paired weight class. Will be resolved in /spec.
- [ ] **Phase 3 — `display: 'swap'` vs `'optional'`.** `swap` risks a flash of fallback; `optional` can skip the custom font entirely on slow connections. Decision deferred to /spec — depends on whether we want perfect brand consistency or the best LCP numbers.
- [ ] **Phase 1 — hoisted CSS.** Does moving `@import` into a `"use client"` component actually defer it, or does Next.js App Router / the CSS module system hoist it back into the global stylesheet anyway? Will be resolved by the tracer itself — if hoisting defeats the goal, fall back to the `<link rel="stylesheet" media="print" onLoad="this.media='all'">` pattern inside the banner component.
- [ ] **Phase 4 — is the `/hulp` bottleneck real?** `ResponsibilityRepository.findAll()` queries Sanity; if it's already fast (<50 ms warm), streaming won't measurably help and the phase can be downgraded to "nice to have" or closed. Will be decided in /spec by measuring the real BFF latency for that query.
- [ ] **Phase 5 — schema split.** Single `historyEra` covering both history and ultras photos, or two types? Answered in /spec by modelling a few real editor use-cases (how would an editor add a 2024 championship photo to the ultras page vs the history page).
- [ ] **Phase 5 — hotspot art direction.** Do the history photos need hotspot + responsive crop, or is centered crop fine? Editorial decision — resolve with the user in /spec.
- [ ] **Phase 5 — migration approach.** Manual upload via Studio for ~20 photos, or scripted via `@sanity/client`? Depends on whether we also want to delete the raw files from git history (`git rm` only frees the working tree, not history). Resolve in /spec.
- [ ] **Phase 5 — milestone naming decision is mine**, but is "Initial Load Performance" the right name, or should I align with an existing milestone convention? Will check existing milestones in /prd-to-issues.

## 8. Discovered Unknowns

(Filled during implementation.)
