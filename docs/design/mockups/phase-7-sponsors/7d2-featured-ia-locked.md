# Phase 7 · /sponsors — Round 2 (IA: featured placement) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7d2-featured-ia-compare.html`
**Owner:** @climacon

## Decision

**Featured = V1 · single marquee card in the hero (split layout).**

The hero is a two-column split: **headline + lead on the left, one "In de kijker" featured
partner card on the right.**

## Data rules (required because `featured` can match 0 / 1 / many)

- **Pick exactly ONE** featured sponsor for the marquee. Deterministic selection:
  **highest tier first** (`hoofdsponsor` → `sponsor` → `sympathisant`, untiered last), then
  **`name` `localeCompare("nl")`**. Mirrors the existing `<SponsorsBlock>` sort.
- **0 featured →** hero collapses to **headline-only, full width** (no empty card, no orphan
  "In de kijker" label).
- The marquee sponsor **still appears in its tier grid below** — deliberate double-emphasis,
  not a bug. No dedup.
- A featured sponsor **without** a `logo` → marquee shows the italic-display name fallback in
  the logo slot. **Without** a `description` → blurb line is omitted (card shrinks); the card
  still renders on logo + name + link.

## Accepted trade-off

- Extra `featured=true` flags beyond the first are **not surfaced** in the marquee. Accepted:
  the owner wants one bold hero highlight, not a row. If the club routinely flags many, revisit
  toward V2 (band) — noted, not built.

## Carry-forward into the next IA round (7.d3 — tier treatment)

- **Master-plan/data conflict to honour:** §6.8 says main-tier tiles carry a "short blurb."
  **There is no field for this** — `description` is featured-only (surfaced in the marquee).
  Tier tiles may show **logo (or name fallback) + name caption + outbound link only.** No blurb.
- Open: tier hierarchy treatment (size-graded grids vs. hoofd-as-feature-rows vs. flat wall) +
  tile name-caption rule (always vs. only-on-missing-logo) + CTA placement.
