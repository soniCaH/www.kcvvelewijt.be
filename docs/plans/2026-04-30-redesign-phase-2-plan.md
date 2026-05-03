# Redesign Phase 2 — Atom Rework + Phosphor Fill Implementation Plan

> **Status (closeout):** all sub-tasks landed; this doc records the actual sequence shipped, not a forward-looking plan. Authored retroactively to close umbrella issue [#1524](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1524) — the work itself was sequenced via per-atom sub-issues that each carried their own design checkpoint, PR description, and VR baseline justification.

**Source PRD:** `docs/prd/redesign-phase-2.md`
**Master design reference:** `docs/plans/2026-04-27-redesign-master-design.md`
**Phase predecessor:** [#1523](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1523) — Phase 1 (Tier B composition primitives), merged
**Phase successor:** [#1525](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1525) — Phase 3 (Tier C figures + EditorialHero variants)

---

## Why this plan is short

Unlike Phase 1 ([2026-04-29-redesign-phase-1-plan.md](2026-04-29-redesign-phase-1-plan.md), single-PR with ~30 sequenced tasks), Phase 2 was decomposed into **independent per-atom sub-issues** at the PRD level (§4 Phases). Each sub-issue carried its own implementation plan inside the issue body and its own PR — the work was naturally chunked, so a single 800-line orchestration plan would have duplicated the per-issue deliverables without adding signal.

This document therefore records:

1. **What landed** (sub-PR ledger)
2. **The sequencing rule that proved correct** (tracer bullet → Track A token swaps + Track B design checkpoints, fanned out in parallel)
3. **Cross-cutting decisions** that emerged during implementation and now belong in the codebase's permanent reference layer

For a forward-looking task list, see the per-sub-issue PR descriptions linked below.

---

## Sub-PR ledger

### Tracer bullet

| Sub-issue | Track | PR    | What shipped                                                                                                                                                                                        |
| --------- | ----- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1568     | 2.0   | #1579 | `pnpm vr:update:story` script, `--color-alert` / `--color-warning` retro tokens, `<Button variant="primary">` reskinned, `icons.redesign.ts` Phosphor wrapper, first per-story VR baseline captured |

### Track A — pure token swaps (no design checkpoint)

| Sub-issue | Track | PR    | What shipped                                                                                                                                                                                         |
| --------- | ----- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1574     | 2.A.1 | #1604 | `<EditorialLink>` primitive extracted from bespoke SectionHeader CTA; `<SectionHeader>` refactored to compose it                                                                                     |
| #1569     | 2.A.2 | (n/a) | Phosphor Fill icon migration shim completion — every Phase 2 atom now imports from `@/lib/icons.redesign` for `weight="fill"` defaults                                                               |
| #1570     | 2.A.3 | #1606 | `<Button>` rework completed (`primary` / `inverted` / `secondary` / `ghost`); `link` variant retired; `withArrow` renders `<span>→</span>`                                                           |
| #1571     | 2.A.4 | #1607 | Form atoms reskinned (`<Input>` / `<Select>` / `<Textarea>` / `<Label>`) per Direction C — paper-card emphasis; `<TextareaCounter>` extracted; `<AlertBadge variant="error">` consumed in helper-row |
| #1572     | 2.A.5 | #1598 | `<Alert>` reskin — two-form vocabulary: angled `<AlertBadge>` (Direction E) + ticket-stub `<Alert>` (Direction B); `info` variant dropped, `success` / `warning` / `error` only                      |
| #1573     | 2.A.6 | (n/a) | `<FilterTabs>` icon prop type swapped Lucide → Phosphor `Icon`                                                                                                                                       |

### Track B — design checkpoints

| Sub-issue | Track | PR    | What shipped                                                                                                           |
| --------- | ----- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| #1575     | 2.B.1 | #1588 | `<Spinner>` — design checkpoint (scarf barber-pole + compact three-dot pulse) + reskin                                 |
| #1576     | 2.B.2 | #1589 | `<BrandedTabs>` — paper-card body, ink-invert active, no tape, no rotation                                             |
| #1577     | 2.B.3 | (n/a) | `<FilterTabs>` — paper-chip body, ink-invert active, hairline pipe count                                               |
| #1578     | 2.B.4 | (n/a) | `<HorizontalSlider>` + `<ScrollHint>` arrows — single canonical 48 × 48 paper button, italic Freight Display `←` / `→` |

### Composition primitives (added late in Phase 2)

| Sub-issue | Track | PR    | What shipped                                                                                                                                                                                                                      |
| --------- | ----- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1591     | 2.C   | #1609 | `<ClippedCard>` (bordered archival paper card) + `<StampBadge>` (rotated paper-shadow label) — Tier B composition primitives that frame document/form surfaces; pair documented as `Features/Forms/RegistrationCardPattern` story |

(The full ledger is recorded against `gh issue list --search "phase 2"` at the time of this writing — every sub-issue is closed, every PR is merged.)

---

## Sequencing rule that proved correct

```text
2.0 (tracer bullet)  ─▶  proves vr:update:story + retro tokens + Button.primary + Phosphor wrapper
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                     ▼
   Track A (parallel)                    Track B (parallel)
   token-swap-only atoms                 atoms needing design checkpoints
   (Button, EditorialLink, form atoms,   (Spinner, BrandedTabs, FilterTabs,
    Alert, Phosphor migration)           HorizontalSlider/ScrollHint)
       │                                     │
       └──────────────────┬──────────────────┘
                          ▼
                  Composition primitives
                  (ClippedCard + StampBadge)
                  added once form atoms locked
```

**Why the split worked**

- **Track A** was unblocked the moment the tracer bullet landed — token swaps are mechanical and don't need design exploration. Sub-issues fanned out and merged in any order.
- **Track B** needed a `/design-an-interface` exploration round per atom before any code lands. Splitting them off the tracer bullet meant Track A wasn't blocked by Track B's design conversation; it also meant each Track-B atom got its own A/B compare.md in `docs/design/mockups/phase-2-track-b/`.
- **Composition primitives (#1591)** were deliberately deferred until the form atoms (#1571) locked, because the registration-card composition story in #1591 references the locked field atoms. Sequencing kept the Phase 2 atom-rework focused as a unit.

---

## Cross-cutting decisions that emerged

These are decisions discovered during Phase 2 implementation that now live in the codebase's permanent reference layer (PRD §6, master design decision log, or `apps/web/CLAUDE.md`). Listed here so the umbrella issue's reviewer can see them at a glance.

1. **`vr:update:story` per-atom workflow** — Phase 2 atom reskins update only the atom's own baselines surgically; consumer baselines are deferred via `parameters.vr.disable` until the consumer's own redesign phase. Documented in `apps/web/CLAUDE.md` → "Atom reskin PRs — surgical baselines, defer consumers via `vr.disable`". (PRD §6.8, §8.)
2. **`<FieldError>` superseded by `<AlertBadge variant="error">`** — the form-atoms compare.md sketched a `<FieldError>` primitive; the Phase 2.A.5 design checkpoint independently arrived at the same retro-pill-plus-italic-message vocabulary as `<AlertBadge variant="error">`. Form atoms (`<Input>` / `<Select>` / `<Textarea>`) consume `<AlertBadge>` directly — no separate `<FieldError>` extraction. (PRD §6.3, §6.4.A, §9.)
3. **Submit button on form composition** — `<Button variant="secondary">` (cream-soft body + ink border + ink paper shadow + press idiom), not `primary` (jersey body). Single green moment in a form is reserved for the `<StampBadge>` accent. (PRD §6.9.)
4. **`<ClippedCard>` vs. `<TapedCard>` mood split** — the two card primitives express different moods (archival document vs. casual loose paper) and must not be combined. Their prop surfaces are deliberately non-overlapping so the visual conflict is unrepresentable. Anti-pattern Storybook story documents the boundary. (PRD §6.9, master design §4.2.)
5. **Phosphor migration shim, not full Lucide retirement** — `src/lib/icons.ts` (Lucide) stays in place; only redesign-surface consumers swap to `src/lib/icons.redesign.ts` (Phosphor Fill). Legacy components keep Lucide until their own phase per dual-coexistence. (PRD §2 "Out of scope".)

---

## Acceptance criteria — final state

All ACs from #1524 are now met:

- [x] **PRD authored** — `docs/prd/redesign-phase-2.md`
- [x] **Plan authored** — this document
- [x] **Phosphor Fill installed and exported via a redesign-only shim** — the icon library is split per the dual-coexistence rule: `src/lib/icons.ts` keeps Lucide for legacy components, while `src/lib/icons.redesign.ts` exports Phosphor Fill (`weight="fill"`) wrappers for redesign-surface consumers. Redesign atoms import from `src/lib/icons.redesign.ts`; do not import Phosphor from `src/lib/icons.ts` (it does not re-export them). Done in #1568 / #1569.
- [x] **Lucide retired from redesign-surface consumers** — every Phase 2 atom imports from `icons.redesign.ts`. Legacy components keep Lucide.
- [x] **All affected atoms reskinned** — Button, Input, Select, Textarea, Label, Alert, Spinner, BrandedTabs, FilterTabs, HorizontalSlider, ScrollHint. Plus EditorialLink (new) and TextareaCounter (new) extracted along the way; ClippedCard + StampBadge (new) composition primitives added.
- [x] **VR baselines updated for affected stories** — every sub-PR's `## VR baselines` section enumerates the changed baselines with rationale per the §6.8 surgical-baseline workflow.
- [x] **`pnpm --filter @kcvv/web check-all` green** — verified at every sub-PR merge.

---

## What did NOT land in Phase 2

Per PRD §2 ("Explicitly OUT of scope"):

- Container-level paper aesthetic on modals / dropdowns / popovers / toasts — defers to Phases 6–8 per master design open question 7.
- Legacy component reskins (cards, tables, widgets outside the atom catalogue) — each gets reskinned in its own phase.
- New tokens beyond the alert/warning semantic family — no new spacing, motion, or typography tokens needed.
- API or data-layer changes — Phase 2 is purely presentational.

---

## Phase 3 hand-off

Phase 3 ([#1525](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1525)) inherits a fully reskinned atom catalogue and can compose Tier C figures + `<EditorialHero>` variants on top without further atom-level chrome work. The `<ClippedCard>` + `<StampBadge>` primitives shipped in #1591 mean the form-card vocabulary is also already in place — Phase 5 (article detail) and Phase 8 (forms / hulp / search / privacy) can compose on the existing primitives.
