# 6.C.d2 · TeamHero — LOCKED

**Decision:** Category-forward identity, left-words / right-taped-polaroid.
Locked 2026-05-28 (`6cd2-teamhero/round-1` identity → `round-2` assembled).

## Composition

- Two-column: **left words / right artefact**; stacks on mobile (artefact moves
  **above** the headline per master-plan §5.4).
- **Kicker** (MonoLabel, ink-muted): `KCVV Elewijt` (youth: `KCVV Elewijt · Jeugd`).
- **Headline** (`<EditorialHeading>`, display-big black ~60px): the **category**
  — `A-ploeg.` / `B-ploeg.` / `U13.` — with a jersey-deep italic period. The
  category is the page's distinguishing identity (every team is KCVV Elewijt).
- **Meta row** (MonoLabel pills): **division + season only.**
  - **Coach dropped** — `staff[]` is unbounded and the only head-coach signal is
    PSD `functionTitle` (`T1`/`Hoofdtrainer`, free-text, often null), so no
    reliable single value for the hero. Coaches surface in the **Staff section**
    with their function titles.
  - Pills auto-hide when absent. Youth (no PSD division) shows the youth band
    (`Bovenbouw`/`Middenbouw`/`Onderbouw`) + season.
- **Tagline** (`team.tagline`): italic display **lead** under the meta;
  auto-hides when empty.

## Artefact (right column)

- Taped **squad polaroid**: `border-2 ink` + `shadow-paper-md`, slight rotation
  (~-1.5°), warm `<TapeStrip>` at top. Photo gets the **newsprint treatment**
  (grayscale + grain) consistent with the player photo system (R9).
- **Season ticket-stub** below: dashed-border (`border-2 border-dashed`), cream,
  slight rotation (~+0.5°), `MonoLabel "Seizoen"` + `25/26` in display-big.
- **No-`teamImage` fallback:** the canonical **`<JerseyShirt>`** illustration
  (jersey-deep underprint + ink stripes) fills the same polaroid frame.

## Cross-age

Youth: category headline swaps (`U13.`), division/coach/standings absent →
meta degrades to youth band + season; photo or JerseyShirt fallback as available.

## NOT locked here

StandingsTable, SquadGrid/PlayerCard, Staff cards, listing `/ploegen`. Exact
polaroid rotation degrees + stub copy are implementation-tunable.

## Cross-references

- `detail-ia-locked.md` (6.C.d1), `data-reality-locked.md` (6.C.d0).
- Artifacts: `6cd2-teamhero/round-1-teamhero-comparisons.html`,
  `round-2-teamhero-states.html`.
- Inherits `<JerseyShirt>` ([[project_jersey_illustration_vocabulary]]),
  player photo system R9.
