# PRD: Loading Skeleton Consistency

## 1. Problem Statement

Every route in `apps/web/src/app/(main)/` has a `loading.tsx` skeleton that re-implements its page envelope (hero, background, container, padding, transitions) by hand. When a page's structure changes — adding a `SectionStack` section, swapping a `PageHero` size, retuning vertical padding — the skeleton silently desyncs and the user sees a visible layout shift on hydration. This already bit us in #1238 (`/hulp` after the #1237 redesign): the loading skeleton kept the old `py-12` envelope while the real page had moved to `SectionStack` defaults (`pt-20 pb-20`) plus diagonal `SectionTransition` SVGs, producing a multi-pixel jump on every cold visit.

A site-wide audit shows 11 of 21 `loading.tsx` files currently mismatch their pages: 4 are HIGH severity (real page uses `SectionStack`, skeleton uses a plain `<div>` — missing both default padding and the diagonal transitions), 7 are MEDIUM (wrong `py-*`, wrong hero size, wrong background gradient). The root cause is structural: skeleton and page hold two independent copies of the envelope, with no mechanism to keep them in sync. Patching the 11 instances without addressing the duplication just resets the clock until the next redesign.

## 2. Scope

**Touched:** `apps/web` only (`src/app/(main)/**/loading.tsx`, `src/app/(main)/**/page.tsx` for the `SectionStack` cases, `src/components/**` for any extracted helpers, Storybook stories for new primitives)

**Out of scope:**

- `apps/api`, `packages/api-contract`, `apps/studio` — no changes
- Skeleton _content_ (shimmer placeholder shapes, card counts) — only the **outer envelope** must match the real page. Inner shimmer details remain page-specific.
- Routes outside `(main)` — admin/studio routes don't have user-facing loading states.
- Removing `loading.tsx` entirely as a strategy — UX-regressing; rejected.
- Suspense boundary refactors — out of scope; we keep the current `loading.tsx` convention.

## 3. Tracer Bullet

Refactor `/hulp` (the route that triggered this PRD) to the canonical pattern: extract a `getHulpSections({ content })` factory from `HulpPage.tsx`, have both `page.tsx` and `loading.tsx` call it, and verify on a cold reload that there is **zero** layout shift on hydration. This proves the "shared section factory" pattern works for one `SectionStack` page before rolling it out to `/club`, `/jeugd`, `/ploegen`, `/sponsors`.

Why `/hulp` first: it's the smallest `SectionStack` page in the audit (2 sections), it's where the bug originated, and #1238 already touches its loading file — minimal new surface area for the tracer.

## 4. Phases

### Phase 1: `/hulp` shared section factory — tracer bullet (#1238)

Extract `getHulpSections({ content }: { content: ReactNode }): SectionConfig[]` from `HulpPage.tsx`. `HulpPage.tsx` calls it with the live `renderContent()` output; `loading.tsx` calls it with a `<HulpLoadingContent />` skeleton body. Both render `<SectionStack sections={...} />`. Delete the hand-rolled `<div className="bg-gray-100">` envelope from `loading.tsx`.

### Phase 2: HIGH-severity SectionStack pages (#1240, #1241, #1242, #1243)

Apply the same factory pattern to `/club` (#1240), `/jeugd` (#1241), `/ploegen` (#1242), `/sponsors` (#1243). One issue per route. Each issue:

1. Extract `getXxxSections({ ... })` factory from the page's main component.
2. Update `page.tsx` to call the factory.
3. Rewrite `loading.tsx` to call the factory with skeleton bodies.
4. Verify zero layout shift on cold reload.

### Phase 3: MEDIUM-severity surgical patches (#1244)

Patch the 7 MEDIUM mismatches in place (no factory extraction — these don't use `SectionStack` and the envelopes are simple enough that surgical fixes are cheaper than abstractions):

- `/club/[slug]` — container `max-w-3xl` → `max-w-inner-lg`
- `/club/bestuur`, `/club/angels`, `/club/jeugdbestuur` — outer `py-8` → `py-12`, add `space-y-12`
- `/club/organigram` — add tab-bar skeleton placeholder
- `/spelers/[slug]` — match real hero padding (`py-8 lg:py-12`) and gradient
- `/staf/[slug]` — light gradient bg, `py-8` → `py-12`, match flex structure

One issue covering all 7 (they're all <10-line edits).

### Phase 4: Drift guard (#1245)

Add a lightweight Vitest test (`src/app/(main)/__tests__/loading-envelope.test.tsx`) that imports each `loading.tsx` and its `page.tsx`, renders both, and asserts the outer wrapper className strings match (or, for `SectionStack` pages, that both call the same factory). The test fails the moment a future change desyncs the two. Single test file, parametrized over the route list.

## 5. Acceptance Criteria per Phase

### Phase 1 (`/hulp` tracer)

- [ ] `apps/web/src/components/hulp/HulpPage/getHulpSections.ts` exports a factory consumed by both `HulpPage.tsx` and `app/(main)/hulp/loading.tsx`
- [ ] `loading.tsx` no longer hand-rolls a `bg-gray-100` div — it renders `<SectionStack sections={getHulpSections({ content: <skeleton/> })} />`
- [ ] Cold reload of `/hulp` shows no visible vertical layout shift (manual check via Chrome DevTools "Performance Insights" → Layout Shifts panel — CLS contribution from the hero/content boundary < 0.01)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 (HIGH SectionStack pages)

- [ ] One issue per route: `/club`, `/jeugd`, `/ploegen`, `/sponsors`
- [ ] Each route has a `getXxxSections` factory consumed by both files
- [ ] Each route's loading skeleton renders via `SectionStack` (verifiable: skeleton DOM contains at least one `<SectionTransition>` SVG)
- [ ] No layout shift on cold reload (manual CLS check per route)
- [ ] `pnpm --filter @kcvv/web check-all` passes after each issue

### Phase 3 (MEDIUM patches)

- [ ] Each of the 7 listed `loading.tsx` files updated per the spec above
- [ ] Per-route manual reload check confirms shift is gone or visually negligible
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4 (drift guard)

- [ ] Vitest suite covers all `(main)` routes that have a `loading.tsx`
- [ ] Test fails when a `loading.tsx` envelope drifts from its `page.tsx` (verified by introducing a deliberate drift, watching the test fail, then reverting)
- [ ] Test runs in <2s (it's a pure render comparison, no async)
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. This is a pure `apps/web` UI refactor — no BFF, no schemas, no contracts.

## 7. Open Questions

- [ ] Should the `getXxxSections` factories live colocated with the page component (e.g. `components/hulp/HulpPage/getHulpSections.ts`) or under a `src/lib/page-sections/` directory? — will be answered by the Phase 1 tracer; whichever location feels natural for `/hulp` becomes the convention.
- [ ] For Phase 4's drift guard, is comparing rendered DOM the right granularity, or should we compare the `SectionConfig[]` arrays directly (cheaper, but only works for `SectionStack` pages)? — will be decided after Phase 1 lands; tracer will reveal what's actually testable without false positives.
- [ ] Do we want this on `feat/issue-1238` (current branch) or a fresh branch? `/hulp` Phase 1 belongs in #1238 since it's directly tied; Phases 2–4 should be a separate branch under a new umbrella issue. — needs your decision.
- [ ] The audit was sub-agent-generated. Phases 2 and 3 should each open with a 5-minute spot-verification of the listed mismatches before touching code (the `/hulp` finding the agent reported was correct but the _fix value_ was wrong — same risk applies elsewhere). Treat this as a per-issue checklist item, not a separate phase.

## 8. Discovered Unknowns

(Filled during implementation.)
