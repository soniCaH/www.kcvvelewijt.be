# PRD — Page-Level Testing Rework: Storybook VR → Playwright E2E

> **Status:** proposed.
> **Date:** 2026-04-28
> **Tracking issue:** [#1522](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1522)
> **Implementation PR (PRD + vr-skip):** [#1520](https://github.com/soniCaH/www.kcvvelewijt.be/pull/1520)
> **Implementation PR (Playwright suite):** _pending — opens after PR #1520 merges_
> **Milestone:** `redesign-retro-terrace-fanzine`
> **Owner:** @soniCaH
> **Estimate:** 1–2 weeks (sits between redesign Phase 0 and Phase 1 — call it Phase 0.5)
> **Blocks:** none directly, but unblocks Phase 1 by removing the Pages/* VR flake
> **Supersedes:** GitHub issues [#1375](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1375) (close on merge), [#1376](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1376) (rescope to component-only on merge)

---

## Context

The redesign is using Storybook + `@storybook/test-runner` for visual regression coverage. Phases 1–3 of the VR rollout (commits `feat(ui): vr phase 1..3`, merged April 2026) shipped the infrastructure (Phase 1 tracer-bullet — pinned Docker image, jest-image-snapshot wiring, baseline conventions; Phase 2 — design-system / Foundation / Layout coverage; Phase 3 — `Features/*` curation as a *staged-adoption contract*). Phase 1's actual tagging covered the tracer set; Phase 2's tagging covered foundation/UI/layout stories; Phase 3 set up the rule that `Features/*` redesign PRs must adopt the `vr` tag and capture baselines as each component gets redesigned, but the bulk of `Features/*` stories are not yet tagged. As of this PRD, ~37 stories carry `tags: ["vr"]` and the committed baseline tree has ~978 PNGs across viewports. The Phase 4 issue (#1375 — "real-page composition coverage") was scoped to extend that coverage to full `Pages/*` compositions; Phase 5 (#1376 — "full Storybook coverage via fixture pinning") was scoped to fixture-pin everything that wasn't yet stable.

Practical experience during the redesign Phase 0 work surfaced two structural problems with this direction:

1. **Memory exhaustion in Docker.** Five `Pages/*` stories (`Pages/Article/Interview`, `Pages/Article/Event`, `Pages/ContactPage`, `Pages/NewsListing`, `Pages/BestuurPage`) crash Chromium's `page.goto` during the test-runner's `setupPage` hook. The `vr:check` run hangs at ~5.9 GB / 7.65 GB memory cap with effectively zero CPU progress. The committed baselines that were captured cleanly are valid; the re-validation is what flakes. The pattern is: full-page compositions that load heavy editorial fixtures, run sequentially through the test-runner's full discovery scan, exhaust the browser process before the include/exclude tag filter ever applies.
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
5. **CI integration:** Playwright runs in a separate GitHub Actions job from the existing `visual-regression` job. Job name: `e2e`. Failure blocks merge. The e2e job's path-based trigger is **related to but distinct from VR's** — it must include the e2e suite's own files so PRs that only touch test code or the workflow definition still run the job, and it must drop Storybook-specific paths that don't affect a Playwright-against-Next.js run. Concretely, trigger the `e2e` workflow on changes under:

   - `apps/web/src/**` (production code the e2e tests verify)
   - `apps/web/public/**` (static assets that affect rendering)
   - `apps/web/package.json` (dependency changes)
   - `apps/web/test/e2e/**` (the e2e suite itself, including `playwright.config.ts` and route smoke tests)
   - `.github/workflows/e2e.yml` (workflow self-changes)

   Notably **excluded** from the e2e trigger (because they're Storybook-only and don't affect this suite): `apps/web/.storybook/**`, the `apps/web/test/vr/**` baseline tree.
6. **Existing GitHub issues — disposition:**
   - **#1375 "VR Phase 4 — real-page composition coverage"**: close with a comment pointing at this PRD as the supersession path. Page-level visual coverage moves to Playwright; the goal of #1375 is achieved via this rework, not via more Storybook stories.
   - **#1376 "VR Phase 5 — full Storybook coverage via fixture pinning"**: scope-narrow to component-level only. The phrase "full Storybook coverage" originally meant including pages; rewrite the issue body so it covers only `UI/*`, `Features/*`, `Layout/*` fixture pinning and explicitly excludes `Pages/*`. Or close and replace with a tighter follow-up.
   - **#1488 "VR baseline-update bot setup"**: keep open, still relevant — baseline-update flow remains useful for component-level VR.

## Acceptance criteria

- [ ] `apps/web/test/e2e/` directory exists with a **dedicated** Playwright config at `apps/web/test/e2e/playwright.config.ts` (separate from any root or VR config) — defaults `baseURL` to `http://localhost:3000` for local runs and accepts a `BASE_URL` env var for CI. All test-suite invocations (local and CI) pass `-c apps/web/test/e2e/playwright.config.ts` so the e2e suite never reuses the existing VR / Storybook test-runner config.
- [ ] 18 route smoke tests (17 routes + 404) as enumerated in §Decisions item 3, each asserting the per-route checks in §Decisions item 4.
- [ ] CI workflow `.github/workflows/e2e.yml` runs the suite against `next start` on a Linux runner. Job name `e2e`. **Required for merge on any PR that touches an e2e-relevant path** as enumerated in §Decisions item 5: `apps/web/src/**`, `apps/web/public/**`, `apps/web/package.json`, `apps/web/test/e2e/**`, or `.github/workflows/e2e.yml`. Storybook-only paths (`apps/web/.storybook/**`, `apps/web/test/vr/**`) are explicitly **excluded** so changes that don't affect a Playwright-against-`next start` run don't trigger a noisy e2e job.
- [ ] All five `vr-skip`-tagged page stories remain skipped by `vr:check`; no test-runner crashes locally or in CI.
- [ ] `docs/prd/visual-regression-testing.md` updated: §12 Phase 3 Include list narrows to `UI/*`, `Features/*`, `Layout/*` only; Phase 4 (real-page composition) and Phase 5 (full Storybook coverage including pages) sections marked SUPERSEDED with link to this PRD.
- [ ] `apps/web/CLAUDE.md` updated with the new layered model: Storybook for components, Playwright for pages.
- [ ] GitHub issues #1375 and #1376 closed or rescoped per §6.
- [ ] No spec / test files generated for the five `vr-skip`-tagged `Pages/*` stories during VR runs. The `--excludeTags vr-skip` flag (already present in `vr:check`) excludes them at **discovery** time, before `setupPage` runs, which is what prevents the page-crash flake. Verify per the snippet below.

### How to verify

After running `pnpm vr:check` from the repo root:

```bash
# 1. The pnpm pipeline must exit 0 (no test failures, no setup crashes).
pnpm --filter @kcvv/web run vr:check

# 2. No spec files generated for the 5 vr-skip-tagged Pages stories.
#    Greps the test-runner's per-story FAIL/PASS lines; expected output: empty.
pnpm --filter @kcvv/web run vr:check 2>&1 | \
  grep -E "pages-bestuurpage|pages-contactpage|pages-newslisting|pages-article-interview|pages-article-event"

# 3. Snapshot tally is fully passing.
pnpm --filter @kcvv/web run vr:check 2>&1 | grep -E "^\[1\] Snapshots:"
# Expected substring (counts vary as the redesign progresses):
#   "Snapshots:   978 passed, 978 total"

# 4. Test-suite tally shows fewer ran than discovered (because vr-skip + non-vr stories are filtered out).
pnpm --filter @kcvv/web run vr:check 2>&1 | grep -E "^\[1\] Test Suites:"
# Expected pattern:
#   "Test Suites:   <skipped> skipped, <passed> passed, <total> total"
# with no "failed" segment.
```

If grep #2 returns any line containing one of the five `pages-*` story IDs, the `vr-skip` exclusion is not landing — investigate the story's `tags` array and the `--excludeTags vr-skip` flag in `apps/web/package.json`'s `vr:run` script before merging.

The same verification approach is referenced (and slightly expanded for the layered model) in `docs/prd/visual-regression-testing.md` after PR 2 lands its updates.

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

This PRD will be delivered across two PRs (Phase 0.5 in the redesign series):

**PR 1 — this PR (#1520):** lands the PRD itself and the immediate-value piece.

1. Commit this PRD at `docs/prd/page-level-testing-rework.md`.
2. Tag the 5 known-flaky `Pages/*` stories with `vr-skip` (companion commit) so `vr:check` stops generating crashing test files locally and in CI.
3. Cross-link the PRD ↔ tracking issue (#1522) ↔ legacy VR issues (#1375, #1376) for review-time visibility.

**PR 2 — Playwright suite implementation (follow-up):** opens after PR 1 merges and the PRD direction is locked in.

1. Set up `apps/web/test/e2e/` with the dedicated Playwright config at `apps/web/test/e2e/playwright.config.ts` (separate from any root config) plus 1 route smoke test as a tracer-bullet.
2. Add the remaining 15 route smoke tests enumerated in §Decisions item 3.
3. Add the CI workflow at `.github/workflows/e2e.yml` invoking `playwright test -c apps/web/test/e2e/playwright.config.ts` against `next start` on a Linux runner.
4. Update `docs/prd/visual-regression-testing.md` (§12 Phase 3 Include list narrowed; Phase 4 + Phase 5 sections marked SUPERSEDED with link back to this PRD) and `apps/web/CLAUDE.md` (layered testing model documented).
5. Close / rescope GitHub issues #1375 and #1376 per §Decisions item 6.

Tracking issue #1522 closes only when **both** PRs merge.

---

## References

- `docs/prd/visual-regression-testing.md` — existing VR contract, sections 11-12 (phases) get superseded.
- `apps/web/CLAUDE.md` — Visual Regression Testing section gets revised.
- `docs/plans/2026-04-27-redesign-master-design.md` — master redesign doc; Phase 0.5 fits between Phase 0 and Phase 1.
- GitHub issue #1375 (VR Phase 4 — real-page composition coverage) — superseded by this PRD.
- GitHub issue #1376 (VR Phase 5 — full Storybook coverage via fixture pinning) — narrowed by this PRD.

---

_End of Phase 0.5 PRD._
