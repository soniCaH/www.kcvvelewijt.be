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
- `<EditorialHero>` — single component, scoped to **article-type** variants only.
  - **In Phase 3 (today's articleTypes):** `interview | announcement | transfer | event` (4 variants matching `packages/sanity-schemas/src/article.ts` enum).
  - **Deferred to #1470:** `matchPreview | matchRecap` — articleType doesn't exist yet; design coordinates with #1470 implementation.
  - **Out of Phase 3:** ~~`player`~~ (Phase 6 — own `<PlayerHero>` + supporting blocks per master design line 539; see scope correction 2026-05-05). ~~`generic`~~ (redundant — every article has a typed articleType; no call-site).
- `<PageHero>` retired; **non-article page heroes are out of Phase 3 scope** (no EditorialHero `generic` variant). Page-document hero treatment is a separate phase.
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
**Surfaces:** `<EditorialHero>` with article-type variants — `interview | announcement | transfer | event` (4 today). `matchPreview | matchRecap` defer to #1470.
**Options:** 3 directions originally produced (Asymmetric Broadsheet · Stacked Poster · Cover Frame). **Direction locked 2026-05-05:** Option A — Asymmetric Broadsheet. Options B and C are historical record only.
**Scope correction 2026-05-05:** dropped `player` variant (Phase 6, separate `<PlayerHero>`) and `generic` variant (redundant — every article has an articleType).
**Gap fix — per-variant artefact composition pass:** the locked Option A shell is drilled per variant. Each variant gets a focused revised mockup + screenshot, then a `<variant>-locked.md` once approved. Final `compose.md` consolidates the four locked variants for 3.B.2 implementation.

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

| Sub-issue                    | Gap                                                                   | Fix                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 3.A.1 PlayerFigure           | photo+illustration mechanics under-specified inside 4-figure bundle   | dedicated mechanics sheet per option in checkpoint A (photo-present/missing/cropped-tight)           |
| 3.B.2 EditorialHero variants | per-variant artefact column under-specified by single-canvas overview | follow-up `compose.md` pass on chosen option, per-variant artefact pinned down before implementation |
| 3.C.2 MatchStrip             | state matrix missing                                                  | every checkpoint C option renders all 4 data states                                                  |

3.B.3 (PageHero retirement) and 3.B.1 (EditorialHero shell) intentionally need no design — migration / structural-types only.

## 6. Checkpoint A — locked

Checkpoint A drilled down piece by piece (2026-05-04). Each figure has a dedicated locked spec next to its mockups in `docs/design/mockups/phase-3-a-tier-c-figures/`:

| Sub-issue | Figure               | Locked spec                  | Direction                                                                                                                                                                                                                                |
| --------- | -------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.A.1     | `<PlayerFigure>`     | `playerfigure-locked.md`     | Option A polaroid for photo state; canonical option-b block-print torso (no face-circle) for illustration state. Side meta column rendered identically in both states.                                                                   |
| 3.A.2     | `<JerseyShirt>`      | `jerseyshirt-locked.md`      | Single decorative tile for YouthBlock only. Same SVG paths as the PlayerFigure illustration; **palette inverted** (ink underprint + jersey-deep overprint). No webshop variants ship.                                                    |
| 3.A.3     | `<EndMark>`          | `endmark-locked.md`          | Option C — `[1px ink rule] ★ EINDE GESPREK ★ [1px ink rule]`. Glyphs are flex children, not pseudo-elements. Three-centerline alignment contract.                                                                                        |
| 3.A.4     | `<QASectionDivider>` | `qasectiondivider-locked.md` | Option C with `✦` (different glyph than EndMark's `★`). Sanity schema is constrained Portable Text with an "Accent" decorator — editors apply emphasis by selecting + clicking, not typing substrings. Optional kicker beneath the rule. |

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
5. **§5.3 player profile.** `<PlayerFigure>` no longer contains `<TicketStub>` internally. The hero composition can place `<TicketStub>` as a _sibling_ next to `<PlayerFigure>` if the page wants it.

These deltas are descriptive, not destructive — the master design stays as the historical record of phase-0 thinking; the phase 3 PRD overrides the relevant sections.

## 8. Sanity schema deltas

Phase 3 needs one new portable-text block schema (Checkpoint A only):

- `packages/sanity-schemas/src/blocks/qaSectionDivider.ts` — single-block Portable Text `title` (Accent decorator only), optional `kicker` string. Added to article `body` field's `block.of[]`.

No other schema changes from Checkpoint A. Checkpoints B / C / D will surface additional schema work as they're drilled down.

## 9. Remaining work

| Phase                                            | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkpoint A — Tier C figures                    | ✅ locked (2026-05-04) — see four `*-locked.md` in `docs/design/mockups/phase-3-a-tier-c-figures/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Checkpoint B — EditorialHero                     | ✅ **locked (2026-05-05)** — Option A shell + 4 article-type variants drilled per-piece. Four `*-locked.md` files in `docs/design/mockups/phase-3-b-editorial-hero/`: `announcement-locked.md` · `transfer-locked.md` · `event-locked.md` · `interview-locked.md`. Variant scope correction (no player, no generic) captured. matchPreview/matchRecap deferred to #1470 (commented on the issue 2026-05-05). Schema migrations enumerated in `fields.md`.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Checkpoint C — SiteHeader + MatchStrip           | ✅ **locked (2026-05-05)** — Direction A (Classic Newsstand) shell + 6 questions drilled. Two `*-locked.md` in `docs/design/mockups/phase-3-c-header-and-matchstrip/`: `header-locked.md` · `matchstrip-locked.md`. **Picks:** Q1=B1 (header sticky · strip flows) · Q2=C1 (icon-only search) · Q3=D3 (WORD LID hidden on mobile) · Q4=E2 refined (full-screen takeover, ▾ only on submenu items, Word lid hero) · Q5=G3 (strip on landing surfaces only) · Q6 verified (2 states: hidden / upcoming, no live, no concluded, no ticketing). Owner-direction scope corrections: no live data feed (matchstrip is forward-looking only), no ticketing CTA. New shared sub-components introduced: `<IconButton>`, `<NavTakeover>`, `<NavTakeover.Item>`, `<ShieldFigure>` — Storybook coverage required per reuse mandate. **No schema migrations required for Checkpoint C.** |
| Checkpoint D — SiteFooter                        | mockups produced; **not yet drilled down**. Owner-flagged divergent territory — pick fresh, do not refine the retro-terrace-fanzine screenshot footer (see memory `project_phase_3_footer_divergence`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Homepage placement layer on EditorialHero        | pending — adds `placement="homepage"` extension to the locked detail-page variants (CTA row + adjusted byline). Can land alongside or before Phase 4 homepage rebuild.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `docs/prd/redesign-phase-3.md`                   | pending — write after C / D drill-downs land.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `docs/plans/2026-05-03-redesign-phase-3-plan.md` | pending — `superpowers:writing-plans` after PRD.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| GitHub sub-issues × 11                           | pending — `addBlockedBy` 3.B.2 → {3.A.1, 3.A.2, 3.B.1}; 3.B.3 → {3.B.2}.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### Schema migrations BLOCKING 3.B.2 (EditorialHero variants) implementation

Captured in `docs/design/mockups/phase-3-b-editorial-hero/fields.md`:

1. `article.lead` field added (Ask 1).
2. `articleType=event` body validator: ≥1 `eventFact` required (Ask 6).
3. `articleType=transfer` body validator: ≥1 `transferFact` required (Ask 6).
4. `article.coverImage` becomes required — `r.required()` on `article` schema. **Pre-deploy dataset audit + backfill needed** (Ask 8).
5. `article.title` → constrained Portable Text + `accent` decorator (single block, no other marks/styles). One-shot data migration string→PT for every article. Every consumer (cards, hero, OG meta, JSON-LD, sitemap, search, RSS) updates to PT-aware rendering or `serializeTitle()` helper (Ask 9).

Plus non-blocking follow-up: optional `article.author` field (Ask 2) — default rendered byline stays `"Door redactie"` until that field ships.

### Drill pattern (locked workflow)

The Checkpoint B drill-down established a workflow that worked well — captured in memory `feedback_editorial_hero_drill_pattern`. Use the same pattern for C and D:

1. Open variant- or surface-comparison file (`option-a-<surface>-comparisons.html`).
2. Drill **one question at a time** with visual side-by-side options (2–4 sub-options per question).
3. After each owner pick: lock the answer in-file (collapse the comparison to a "LOCKED" summary), then layer the next question's comparison **on top of all previous locks** so subsequent renderings show the cumulative state.
4. After all questions answered: write the canonical `option-a-<surface>-detail.html` mockup + a `<surface>-locked.md` capturing composition, field-source map, schema dependencies, and reuse mandate.
5. Capture screenshots per section using the playwright script at `screenshots/_capture-revised.mjs` (already wired for `compare` and `detail` placements).

When picking up next session: open `docs/plans/2026-05-03-redesign-phase-3-design.md` first, then this §9 table to see what's left, then the entry brief for the specific checkpoint you're picking up.
