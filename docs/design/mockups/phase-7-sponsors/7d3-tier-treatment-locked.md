# Phase 7 · /sponsors — Round 3 (IA: tier treatment) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7d3-tier-treatment-compare.html` (+ label refinement)
**Owner:** @climacon

## Decision

**Label only the top tier. One celebrated group + one gracious wall.**

The page body has exactly **two visual classes**, not three:

1. **Hoofdsponsors** — the only labeled group. A `MonoLabel` header **"Hoofdsponsors"** over
   **large taped tiles** (≈3-col `<TapedCardGrid>`), each tile = logo (or italic-name fallback)
   **+ italic-display name caption**. Slight rotation per the taped-card pool.

2. **Everyone else** — `sponsor` + `sympathisant` **merged into one unlabeled dense logo wall**
   below, **no header**. Tiles = logo only (name shown **only** as the missing-logo fallback).
   Ordered `sponsor` before `sympathisant`, then `name` `localeCompare("nl")`, so larger
   contributors lead — but **no size step and no label** distinguishes the two.

Rationale (owner): headering a group **"Sympathisanten"** publicly brands the club's smallest
supporters as the bottom rung. Dropping that header (and the `sponsor` one) removes the
"degrading" rank callout while still celebrating the hoofdsponsors who fund the most.

## Accepted consequence

- **The `sponsor` vs `sympathisant` schema distinction is no longer visually expressed** on
  `/sponsors` (both live in the merged wall). This is intentional. The tier field still drives
  **ordering** (sponsors first) and the **homepage** `<SponsorsBlock>` (which shows hoofd+sponsor
  only) is unaffected. If a visible second-tier step is ever wanted back, re-introduce a subtle
  cell-size difference inside the wall — noted, not built.

## Tile field anatomy (resolved here)

- **Hoofd tile:** logo (or italic-name fallback) + italic-display name caption. Clickable when
  `url` present (visible link affordance = detail round).
- **Wall tile:** logo only; italic-name fallback when no logo; clickable when `url` present.
- **No blurb anywhere in the tiers** (carried from 7.d2 — `description` is featured-only).

## Carry-forward

- **CTA placement** ("Word sponsor +") — last open IA micro-question → next round, shown in a
  full-page assembly.
- Then DETAIL rounds: hero type scale, featured-card chrome, tile borders/shadows/hover, the
  visible "Bezoek website" affordance, empty states (0 sponsors / 0 hoofd / 0 featured).
