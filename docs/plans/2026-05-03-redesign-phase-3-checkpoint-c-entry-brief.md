# Phase 3 — Checkpoint C entry brief

> Continuing the KCVV Phase 3 redesign. Checkpoints A + B are locked. Pick up Checkpoint C from a clean session using these files as the entry brief.

## Read these as the entry brief

- `docs/plans/2026-05-03-redesign-phase-3-design.md` — overall design doc; §9 has the up-to-date status table.
- `docs/design/mockups/phase-3-c-header-and-matchstrip/compare.md` — initial 3-option mockups already produced for Checkpoint C (header + MatchStrip).
- `docs/design/mockups/phase-3-c-header-and-matchstrip/option-{a,b,c}-*.html` — the three direction options to compare and drill from.
- `docs/design/mockups/phase-3-b-editorial-hero/announcement-locked.md` (or any of the four locked specs from B) — example of the lock-spec structure to mirror.
- Memory `feedback_editorial_hero_drill_pattern` — the iterative comparison-then-lock workflow that worked for B.
- Memory `feedback_editorial_hero_scope` — discipline for keeping scope tight (audit against schemas + real call-sites before designing).

## What's locked already (don't reopen unless owner explicitly asks)

- **EditorialHero shell direction:** Asymmetric Broadsheet (60/40 grid + ink rule). Same shell will be referenced by header sticky math.
- **Cover image policy:** 16:9 single-source, required on every article (Ask 8). Doesn't directly affect header but affects MatchStrip's stacking interaction with the article hero below.
- **Five blocking schema migrations** for 3.B.2 enumerated in `fields.md` — none affect Checkpoint C directly.

## Drill Checkpoint C the same way as B

1. Pick a direction first (probably the locked direction A from the original 3-option compare, but verify by skimming the option HTMLs). Don't drill all 3 — pick one as the basis.
2. Run the per-piece comparison-then-lock pass on each open question:
   - **SiteHeader · scroll behaviour** — sticky always vs sticky-on-scroll-up vs static (then sticky after scroll past hero)?
   - **SiteHeader · search affordance** — icon only vs inline input vs sheet-on-tap?
   - **SiteHeader · "WORD LID" CTA** — visible at all viewports vs collapsed into a hamburger on mobile?
   - **SiteHeader · mobile nav** — hamburger drawer style?
   - **MatchStrip · 4-state matrix** — confirm states render coherently: hidden (no upcoming match) / upcoming / live / concluded with result. Owner has already noted state-matrix is satisfied by existing mockups; verify don't redesign.
   - **MatchStrip · stack with hero** — does it sit between SiteHeader and EditorialHero on detail pages? On homepage? Confirm placement.
3. After each owner pick, collapse the question to a "LOCKED" summary in the comparison file. Build subsequent comparisons with previous locks baked in.
4. After all questions answered, write `option-a-header-detail.html` + `option-a-matchstrip-detail.html` (canonical mockups) + `header-locked.md` + `matchstrip-locked.md` (lock specs).

## Use the same screenshot rig

The capture script lives at `docs/design/mockups/phase-3-b-editorial-hero/screenshots/_capture-revised.mjs`. Wire `header` and `matchstrip` into the variant table, with `compare` and `detail` placements. Document-coords clipping pattern (already in the script) handles tall comparison pages.

## Don't forget

- **Reuse mandate** still applies (memory `feedback_editorial_hero_reuse_mandate`): audit `apps/web/src/components/design-system/` before building new sub-components.
- **Press-down hover** is canonical for any interactive paper-stamped element (memory `feedback_canonical_press_down_hover`).
- **Field availability gate** (memory `feedback_design_data_audit`): every UI element traces to a real Sanity field or explicit static template constant. No fabricated data.
- **Reading-time util** exists at `apps/web/src/lib/utils/reading-time.ts` — already wired.

## What's after Checkpoint C

- **Checkpoint D — SiteFooter** (start fresh per memory `project_phase_3_footer_divergence`; do NOT refine the retro-terrace-fanzine screenshot)
- Homepage placement extension on EditorialHero (Task #14)
- Update phase-3 design doc with C+D closure
- Write `docs/prd/redesign-phase-3.md`
- Write `docs/plans/2026-05-03-redesign-phase-3-plan.md`
- 11 GitHub sub-issues with `addBlockedBy` relations
