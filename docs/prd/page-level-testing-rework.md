# PRD — Page-Level Testing Rework: Storybook VR → Playwright E2E

> **Status:** proposed.
> **Date:** 2026-04-28
> **Tracking issue:** [#1522](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1522)
> **Implementation PR (PRD + vr-skip):** [#1520](https://github.com/soniCaH/www.kcvvelewijt.be/pull/1520)
> **Implementation PR (Playwright suite):** _pending — opens after PR #1520 merges_
> **Milestone:** `redesign-retro-terrace-fanzine`
> **Owner:** _you_
> **Estimate:** 1–2 weeks (sits between redesign Phase 0 and Phase 1 — call it Phase 0.5)
> **Blocks:** none directly, but unblocks Phase 1 by removing the Pages/* VR flake
> **Supersedes:** GitHub issues [#1375](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1375) (close on merge), [#1376](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1376) (rescope to component-only on merge)

---

## Context

The redesign is using Storybook + `@storybook/test-runner` for visual regression coverage. Phases 1–3 of the VR rollout (commits `feat(ui): vr phase 1..3`, merged April 2026) shipped the infrastructure (Phase 1 tracer-bullet — pinned Docker image, jest-image-snapshot wiring, baseline conventions; Phase 2 — design-system / Foundation / Layout coverage; Phase 3 — `Features/*` curation as a *staged-adoption contract*). Phase 1's actual tagging covered the tracer set; Phase 2's tagging covered foundation/UI/layout stories; Phase 3 set up the rule that `Features/*` redesign PRs must adopt the `vr` tag and capture baselines as each component gets redesigned, but the bulk of `Features/*` stories are not yet tagged. As of this PRD, ~37 stories carry `tags: ["vr"]` and the committed baseline tree has ~978 PNGs across viewports. The Phase 4 issue (#1375 — "real-page composition coverage") was scoped to extend that coverage to full `Pages/*` compositions; Phase 5 (#1376 — "full Storybook coverage via fixture pinning") was scoped to fixture-pin everything that wasn't yet stable.

Practical experience during the redesign Phase 0 work surfaced two structural problems with this direction:

1. **Memory exhaustion in Docker.** Five `Pages/*` stories (`Pages/Article/Interview`, `Pages/Article/Event`, `Pages/ContactPage`, `Pages/NewsListing`, `Pages/BestuurPage`) crash Chromium's `page.goto` during the test-runner's `setupPage` hook. The `vr:check` run hangs at ~5.9 GB / 7.65 GB memory cap with effectively zero CPU progress. The 978 baselines that were captured cleanly are valid; the re-validation is what flakes. The pattern is: full-page compositions that load heavy editorial fixtures, multiplied across 167 stories sequentially, exhaust the browser process.
2. **Storybook page stories test fictional renderings.** The data fixtures hand-mocked into a `Pages/*` story drift from production behaviour fast. The story renders an idealized version of the page; what users actually see depends on real Sanity content, real BFF responses, real responsive image loading, real client-side hydration. Visual regressions caught at this layer are mostly false positives (fixture drift) or duplicates of regressions already caught at component level.

The page-level coverage these stories were supposed to provide — composition correctness, layout integrity at full-page scale, cross-component visual interactions — is better delivered by a **Playwright end-to-end suite** that runs against the actual Next.js application (`next start` or a Vercel preview).

## Goal

Move page-level testing off Storybook + test-runner and onto Playwright running against the real Next.js app. Keep Storybook + VR for component-level coverage where it shines.

## Layered testing model after this rework

| Layer | Tool | What it catches | Where it lives |
| --- | --- | --- | --- |
| Atoms / molecules / features | Storybook + `@storybook/test-runner` (existing VR) | Visual regressions on individual `UI/*`, `Features/*`, `Layout/*` stories | `apps/web/src/**/*.stories.tsx`, baselines at `apps/web/test/vr/__snapshots__/` |
| Page composition | **Playwright e2e against `next start`** (new) | Page renders HTTP 200, critical elements present, no console errors, no broken images, layout integrity at viewport | `apps/web/test/e2e/` (new directory) |
| Functional flows | Playwright integration (existing or new) | User journeys (search → result → click → page) | same `apps/web/test/e2e/` |

## Non-goals

- Replacing the existing component-level VR. Storybook remains the source of truth for atom and component visual contracts.
- Replacing unit tests. Vitest stays as the per-component unit test layer.
- Adding visual diff to Playwright. Playwright supports screenshot diffing, but for page-level we want functional assertions, not pixel diffs (which suffer the same data-drift problem). We can revisit pixel-diff at the page level later if a real need surfaces.

## Decisions

1. **Drop `Pages/*` from Storybook VR coverage.** No `Pages/*` story has the `vr` tag and no `Pages/*` baselines exist in `apps/web/test/vr/__snapshots__/`, so dropping coverage is mostly a no-op at the data layer. The wrinkle is at the discovery layer: empirical evidence shows that `--includeTags vr` does **not** fully exclude untagged stories from test-file generation in this codebase — five `Pages/*` stories (`Pages/NewsListing`, `Pages/Article/Interview`, `Pages/Article/Event`, `Pages/BestuurPage`, `Pages/ContactPage`) generate test files and crash Chromium's `page.goto` during the test-runner's `setupPage` hook under Docker's 8GB memory cap, despite never having had `vr` themselves. Documented behaviour says these crashes shouldn't happen; observed behaviour says they do. Because of this, those five stories carry an explicit `vr-skip` tag (added in this PR) so the `--excludeTags vr-skip` filter excludes them at discovery and prevents the crash. Other `Pages/*` stories don't appear to trigger the same flake in our runs, so they don't carry `vr-skip` — but new `Pages/*` stories that exhibit the same crash pattern should add `vr-skip` defensively. New `Pages/*` stories added during the redesign continue to skip VR baselines unless they explicitly opt in by adding `vr` to their meta — and the recommendation in this PRD is that they do not, deferring page-level coverage to the new Playwright suite.
2. **Keep `Layout/*` in Storybook VR.** Site header, site footer, match strip — these are real chrome primitives where Storybook fixtures are accurate to production behaviour.
3. **Add Playwright e2e suite** at `apps/web/test/e2e/` running against `next start` (local) or a Vercel preview URL (CI). Initial route coverage:
   - `/` (homepage)
   - `/nieuws` (news listing)
   - `/nieuws/[slug]` (article detail — at least one of each `articleType`)
   - `/spelers/[slug]` (player profile)
   - `/ploegen` and `/ploegen/[slug]` (teams landing + detail)
   - `/jeugd` (youth landing)
   - `/kalender` (club calendar)
   - `/wedstrijd/[matchId]` (match detail)
   - `/events` and `/events/[slug]`
   - `/sponsors`
   - `/club/organigram`, `/club/geschiedenis`
   - `/hulp`
   - `/zoeken`
   - `/privacy`
   - 404 (request a known-bad slug)
4. **Per-route assertions** (not per-route screenshot diffs): HTTP 200 (or 404 where expected), `<h1>` present, primary nav rendered, `<footer>` rendered, no `console.error`, no broken `<img>` (`naturalWidth > 0` for all visible images).
5. **CI integration:** Playwright runs in a separate GitHub Actions job from the existing `visual-regression` job. Same path-based trigger as VR (`apps/web/src/**`, `apps/web/.storybook/**`, `apps/web/public/**`, `apps/web/package.json`). Job name: `e2e`. Failure blocks merge.
6. **Existing GitHub issues — disposition:**
   - **#1375 "VR Phase 4 — real-page composition coverage"**: close with a comment pointing at this PRD as the supersession path. Page-level visual coverage moves to Playwright; the goal of #1375 is achieved via this rework, not via more Storybook stories.
   - **#1376 "VR Phase 5 — full Storybook coverage via fixture pinning"**: scope-narrow to component-level only. The phrase "full Storybook coverage" originally meant including pages; rewrite the issue body so it covers only `UI/*`, `Features/*`, `Layout/*` fixture pinning and explicitly excludes `Pages/*`. Or close and replace with a tighter follow-up.
   - **#1488 "VR baseline-update bot setup"**: keep open, still relevant — baseline-update flow remains useful for component-level VR.

## Acceptance criteria

- [ ] `apps/web/test/e2e/` directory exists with a Playwright config (`playwright.config.ts`) targeting `localhost:3000` for local runs and a `BASE_URL` env var for CI.
- [ ] At least 16 route smoke tests as enumerated in §3, each asserting the per-route checks in §4.
- [ ] CI workflow `.github/workflows/e2e.yml` runs the suite against `next start` on a Linux runner. Path-trigger matches existing VR pattern. Job name `e2e`. Required for merge on PRs that touch `apps/web/src/**`.
- [ ] All five `vr-skip`-tagged page stories remain skipped by `vr:check`; no test-runner crashes locally or in CI.
- [ ] `docs/prd/visual-regression-testing.md` updated: §12 Phase 3 Include list narrows to `UI/*`, `Features/*`, `Layout/*` only; Phase 4 (real-page composition) and Phase 5 (full Storybook coverage including pages) sections marked SUPERSEDED with link to this PRD.
- [ ] `apps/web/CLAUDE.md` updated with the new layered model: Storybook for components, Playwright for pages.
- [ ] GitHub issues #1375 and #1376 closed or rescoped per §6.
- [ ] No test files generated for `Pages/*` stories during VR runs (verified by `pnpm vr:check` log output showing only UI/Features/Layout stories ran).

## Out of scope

- Migrating `Pages/*` Storybook stories to a different home. Keep them where they are (under `Pages/<Name>` story title) — they're still useful as design references during component implementation. They simply stop being VR-tested.
- Adding visual diff at the Playwright layer. Functional assertions only for now; revisit if needed.
- Bumping Docker memory caps. With `Pages/*` excluded, memory pressure should be a non-issue for the remaining set.
- Migrating individual `UI/*` or `Features/*` VR baselines. They stay as-is.

## Risks and mitigations

- **Risk:** Composition bugs that escape both component-level VR and Playwright functional assertions.  
  **Mitigation:** Playwright's per-route screenshot capture is opt-in (Playwright's `toHaveScreenshot()`). If a specific route exhibits repeated regression patterns that functional assertions don't catch, add a screenshot diff for that route. Don't add screenshot diff broadly up front — revisit on real evidence.
- **Risk:** Playwright e2e against real Sanity data is fragile when content changes.  
  **Mitigation:** Tests assert on structural elements (`<h1>` exists, nav has 7 links) rather than specific text content. CMS content changes don't break tests.
- **Risk:** Playwright requires the BFF (Cloudflare Worker) to be reachable from CI.  
  **Mitigation:** Use the staging BFF URL in CI (already deployed). Local runs use whatever the developer's `.env.local` points to.
- **Risk:** Effort estimate balloons past 1-2 weeks.  
  **Mitigation:** Keep route coverage minimal (16 routes, basic smoke checks) for the first ship. Expand if owner asks.

## Implementation phases

This PRD lands as a single PR (Phase 0.5 in the redesign series), broken into:

1. Tag the 5 known-flaky stories `vr-skip` (in the same PR as this PRD — already done in the companion commit).
2. Set up `apps/web/test/e2e/` with Playwright config + 1 route smoke test as a tracer-bullet.
3. Add the remaining 15 route smoke tests.
4. Add CI workflow.
5. Update `docs/prd/visual-regression-testing.md` and `apps/web/CLAUDE.md`.
6. Close / rescope GitHub issues #1375 and #1376.

---

## References

- `docs/prd/visual-regression-testing.md` — existing VR contract, sections 11-12 (phases) get superseded.
- `apps/web/CLAUDE.md` — Visual Regression Testing section gets revised.
- `docs/plans/2026-04-27-redesign-master-design.md` — master redesign doc; Phase 0.5 fits between Phase 0 and Phase 1.
- GitHub issue #1375 (VR Phase 4 — real-page composition coverage) — superseded by this PRD.
- GitHub issue #1376 (VR Phase 5 — full Storybook coverage via fixture pinning) — narrowed by this PRD.

---

_End of Phase 0.5 PRD._
