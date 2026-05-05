# Redesign Phase 3 — Design Brief

**Issue:** #1525
**Master design:** `docs/plans/2026-04-27-redesign-master-design.md` (§4 catalogue, §5 templates, §8 workflow)
**Status:** brainstorm output — feeds the four `/design-an-interface` runs and the phase 3 PRD.

## 1. Scope recap

Tier C figures + composition + layout chrome rework. Per master design §4.4 / §5:

- `<PlayerFigure>` — illustrated jersey + arms with photo-fillable circular face (photo-first).
- `<JerseyShirt>` — stylised jersey thumbnail.
- `<EndMark>` — closing flourish.
- `<QASectionDivider>` — interview act-divider.
- `<EditorialHero>` — single component, 6+ variants (`transfer | match-preview | interview | event | announcement | generic | player`); discriminated union artefact prop.
- `<PageHero>` retired; call-sites migrated to `<EditorialHero>`.
- `<SiteHeader>`, `<MatchStrip>`, `<SiteFooter>` reworked.

**Footer divergence flag (owner, 2026-04-29):** the footer mockups must be fresh, not refinements of the retro-terrace-fanzine screenshot.

## 2. Design checkpoints (four)

Each checkpoint produces standalone HTML option files + a `compare.md` in `docs/design/mockups/phase-3-<slug>/`, mirroring phase 2's structure.

### A — Tier C figures bundle

**Slug:** `phase-3-a-tier-c-figures`
**Surfaces:** `PlayerFigure`, `JerseyShirt`, `EndMark`, `QASectionDivider`.
**Options:** 3.
**Gap fix — PlayerFigure depth pass:** every option must include a dedicated PlayerFigure mechanics sheet showing photo-present, photo-missing (illustration fallback), and photo-cropped-tight states. Photo-first is the default per master design §5.3.
**Reuse contract:** all figures compose into existing primitives (`TapedCard`, `TicketStub`, `MonoLabel`, `EditorialHeading`, `ClippedCard`, `StampBadge`); each option's `compare.md` row maps every visual choice back to a source primitive.

### B — EditorialHero

**Slug:** `phase-3-b-editorial-hero`
**Surfaces:** `<EditorialHero>` with all 6+ variants (`transfer | match-preview | interview | event | announcement | generic | player`).
**Options:** 3, each rendering the full variant set on one canvas to judge cohesion.
**Gap fix — per-variant artefact composition pass:** before 3.B.2 implementation begins, the chosen option is expanded into a per-variant composition sheet pinning down each artefact column (which `TapedCard` rotation, which slots, photo treatment, kicker labels). This pass produces a follow-up artefact in the same checkpoint dir (`compose.md`) — no second `/design-an-interface` run required.

### C — SiteHeader + MatchStrip

**Slug:** `phase-3-c-header-and-matchstrip`
**Surfaces:** stacked pair (header + sub-header band).
**Options:** 3.
**Gap fix — MatchStrip state matrix:** every option must render the four data states (no upcoming match → strip hidden; upcoming; live/in-progress; concluded with result). State matrix lives inline in each option HTML; `compare.md` calls out which state each option handles best.

### D — SiteFooter

**Slug:** `phase-3-d-footer`
**Surfaces:** `<SiteFooter>` only (divergent territory per owner flag).
**Options:** 4.
**Brief instruction:** explicitly do **not** refine the retro-terrace-fanzine screenshot footer. Treat the footer as fresh ground; explore wordmark scale, dark-vs-paper background, column count, sponsor strip integration vs separation.

## 3. PRD outline (`docs/prd/redesign-phase-3.md`)

Mirrors phase 2 PRD's 567-line structure, scaled up:

1. Context & goals — link to master design §4/§5 and chosen mockups in all four `phase-3-*` dirs.
2. Scope (in / out).
3. Tier C figures — one §3.x per primitive (`PlayerFigure`, `JerseyShirt`, `EndMark`, `QASectionDivider`): props (TS), composition rules, variants, tokens, a11y, Storybook stories, VR coverage.
4. EditorialHero — discriminated union prop shape (full TS), variant-by-variant artefact column spec, shared headline/intro/CTA structure, mobile collapse rules, Storybook coverage (one story per variant + combined autodocs page), VR strategy.
5. Layout chrome — one §5.x per surface (`SiteHeader`, `MatchStrip`, `SiteFooter`): structure, breakpoints, sticky behaviour, data dependencies, retirement of legacy `<PageHeader>`/`<PageFooter>` paths.
6. Mockup references — pointers to the four `compare.md` files and chosen options (and the EditorialHero `compose.md`).
7. Implementation order & dependency graph — mirrors §4 below.
8. VR baseline plan — which stories get baselines, which carry `vr.disable`.
9. Exit criteria — every primitive shipped with story, no `<PageHero>` callers remain, layout chrome swapped site-wide, check-all green.
10. Out of scope — homepage rebuild (phase 4), article detail (phase 5), animation primitives, illustration character variants.

## 4. Sub-issue split (11 children of #1525)

**3.0 — Tracer bullet** (optional first issue): smallest end-to-end slice — `EndMark` shipped + Storybook story + VR baseline — to validate the workflow before fanning out.

**3.A — Tier C figures track** (parallel-safe):

- 3.A.1 `PlayerFigure`
- 3.A.2 `JerseyShirt`
- 3.A.3 `EndMark`
- 3.A.4 `QASectionDivider`

**3.B — Composition track** (serial):

- 3.B.1 `EditorialHero` shell + discriminated union types (no variants).
- 3.B.2 `EditorialHero` variants — depends on 3.A.1 + 3.A.2 + 3.B.1.
- 3.B.3 `<PageHero>` retirement + call-site migration — depends on 3.B.2.

**3.C — Layout track** (parallel after checkpoint C / D):

- 3.C.1 `SiteHeader` rework
- 3.C.2 `MatchStrip` rework
- 3.C.3 `SiteFooter` rework

## 5. Gap audit (recap)

Three gaps in the original 4-checkpoint scoping, all closed with checkpoint-internal expansions (option **a**):

| Sub-issue | Gap | Fix |
|---|---|---|
| 3.A.1 PlayerFigure | photo+illustration mechanics under-specified inside 4-figure bundle | dedicated mechanics sheet per option in checkpoint A (photo-present/missing/cropped-tight) |
| 3.B.2 EditorialHero variants | per-variant artefact column under-specified by single-canvas overview | follow-up `compose.md` pass on chosen option, per-variant artefact pinned down before implementation |
| 3.C.2 MatchStrip | state matrix missing | every checkpoint C option renders all 4 data states |

3.B.3 (PageHero retirement) and 3.B.1 (EditorialHero shell) intentionally need no design — migration / structural-types only.

## 6. Checkpoint A — locked

Checkpoint A drilled down piece by piece (2026-05-04). Each figure has a dedicated locked spec next to its mockups in `docs/design/mockups/phase-3-a-tier-c-figures/`:

| Sub-issue | Figure | Locked spec | Direction |
|---|---|---|---|
| 3.A.1 | `<PlayerFigure>` | `playerfigure-locked.md` | Option A polaroid for photo state; canonical option-b block-print torso (no face-circle) for illustration state. Side meta column rendered identically in both states. |
| 3.A.2 | `<JerseyShirt>` | `jerseyshirt-locked.md` | Single decorative tile for YouthBlock only. Same SVG paths as the PlayerFigure illustration; **palette inverted** (ink underprint + jersey-deep overprint). No webshop variants ship. |
| 3.A.3 | `<EndMark>` | `endmark-locked.md` | Option C — `[1px ink rule] ★ EINDE GESPREK ★ [1px ink rule]`. Glyphs are flex children, not pseudo-elements. Three-centerline alignment contract. |
| 3.A.4 | `<QASectionDivider>` | `qasectiondivider-locked.md` | Option C with `✦` (different glyph than EndMark's `★`). Sanity schema is constrained Portable Text with an "Accent" decorator — editors apply emphasis by selecting + clicking, not typing substrings. Optional kicker beneath the rule. |

Memory notes captured (`~/.claude-personal/projects/.../memory/`):
- `feedback_playerfigure_no_hybrid.md` — never combine photo face + drawn body.
- `project_playerfigure_illustration_canonical.md` — single canonical illustration, ellipse head only, no face-circle.
- `project_playerfigure_photo_state.md` — Option A polaroid; no TicketStub inside PlayerFigure.
- `project_jersey_illustration_vocabulary.md` — shared two-pass print vocabulary; PlayerFigure home palette, JerseyShirt inverted dark/retro palette.
- `feedback_design_data_audit.md` — verify field availability against `packages/sanity-schemas/src/` before locking; never fabricate data.
- `feedback_inline_emphasis_via_portable_text.md` — Portable Text decorator for inline emphasis, never substring-matching.

## 7. Master design deltas (consolidated for phase 3 PRD)

The Checkpoint A sign-offs revise four sections of `docs/plans/2026-04-27-redesign-master-design.md`. Fold these into the PRD in §3 (Tier C figures) and §6 (mockup references):

1. **§4.4 catalogue — `<PlayerFigure>` spec.** Replace "illustrated jersey + arms with photo-fillable circular face" with: "two mutually-exclusive states picked at runtime by `psdImage` availability — **Photo**: rectangular `psdImage` in a polaroid TapedCard frame, no surrounding illustration. **Illustration**: canonical block-print figure (jersey-deep underprint + ink overprint, ellipse head, V-collar, 4 vertical stripes), shared across all options."
2. **§4.4 catalogue — `<JerseyShirt>` spec.** Replace "stylised jersey thumbnail" with: "single decorative jersey illustration sharing PlayerFigure's two-pass vocabulary (palette inverted — ink underprint + jersey-deep overprint). YouthBlock only."
3. **§5.1 step 9 (WebshopStrip).** Drop `<JerseyShirt>` as the primitive. Webshop conversion needs real product photography — `<JerseyShirt>` no longer renders there. Use `<TapedCard>` + `<img>` + price + CTA composition instead.
4. **§5.2 interview template.** Drop `flourish: "em-dash" | "star"` from `<EndMark>` and `<QASectionDivider>` props. Each component has a single fixed glyph: `★` for EndMark, `✦` for QASectionDivider.
5. **§5.3 player profile.** `<PlayerFigure>` no longer contains `<TicketStub>` internally. The hero composition can place `<TicketStub>` as a *sibling* next to `<PlayerFigure>` if the page wants it.

These deltas are descriptive, not destructive — the master design stays as the historical record of phase-0 thinking; the phase 3 PRD overrides the relevant sections.

## 8. Sanity schema deltas

Phase 3 needs one new portable-text block schema (Checkpoint A only):

- `packages/sanity-schemas/src/blocks/qaSectionDivider.ts` — single-block Portable Text `title` (Accent decorator only), optional `kicker` string. Added to article `body` field's `block.of[]`.

No other schema changes from Checkpoint A. Checkpoints B / C / D will surface additional schema work as they're drilled down.

## 9. Remaining work

| Phase | Status |
|---|---|
| Checkpoint A — Tier C figures | ✅ locked (2026-05-04) |
| Checkpoint B — EditorialHero | mockups produced; **not yet drilled down**. Once direction picked, runs the `compose.md` per-variant pass before implementation (see §5 gap audit). |
| Checkpoint C — SiteHeader + MatchStrip | mockups produced; **not yet drilled down**. State-matrix gap is satisfied by the existing mockups; no extra design pass required. |
| Checkpoint D — SiteFooter | mockups produced; **not yet drilled down**. Owner-flagged divergent territory — pick fresh, do not refine the screenshot. |
| `docs/prd/redesign-phase-3.md` | pending — write after B / C / D drill-downs land. |
| `docs/plans/2026-05-03-redesign-phase-3-plan.md` | pending — `superpowers:writing-plans` after PRD. |
| GitHub sub-issues × 11 | pending — `addBlockedBy` 3.B.2 → {3.A.1, 3.A.2, 3.B.1}; 3.B.3 → {3.B.2}. |

When picking up next session: open this file first, then the four `*-locked.md` specs in `docs/design/mockups/phase-3-a-tier-c-figures/`, then the existing `compare.md` for Checkpoints B / C / D in their respective mockup dirs.
