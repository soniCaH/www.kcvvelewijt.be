# Phase 7 · /club/ultras — Round 2 (HERO PHOTO) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7u2-hero-image-compare.html` (panel V2)
**Owner:** @climacon

## Decision

**V2 · Full-bleed photo under a jersey-deep duotone wash + diagonal stripes.**

The new crowd-at-the-fence shot anchors the terrace-poster hero, unified with the system colours so
text contrast is guaranteed on any photo.

## Hero spec

- **Image:** `apps/web/public/images/ultras.jpg` — full-bleed `<Image fill>` `object-cover`,
  `object-position: center 35%` (keeps the "ULTRA'S 55" backs + crowd framed). Alt:
  "KCVV Ultras aan de omheining". **Local public asset** (the existing `ULTRAS_*` constants are
  Sanity-hosted; this one is a static file — committed with this work).
- **Overlay:** jersey-deep wash `linear-gradient(0deg, rgba(19,61,40,.82), rgba(19,61,40,.55))`
  - the `--pattern-jersey-stripes` diagonal stripes (subtle). Guarantees `text-white`/cream contrast.
- **Content (centred):** mono kicker `SUPPORTERS · KCVV ULTRA'S 55` (warm) → **heavy-sans uppercase
  poster headline** (cream + one **warm** accent word) → warm paper-stamp **"Word lid via Facebook ↗"**
  → `facebook.com/KCVV.ULTRAS.55` (hardened `rel`).
- Heavy-sans headline = the **scoped exception** locked in 7u1 (NOT a system pattern).

## Body (unchanged from 7u1)

Cream editorial: Wie zijn we / Wat doen we / Lid worden — `<EditorialHeading>` + `<MonoLabel>`,
prose, `<TapedFigure>` (ULTRAS_KAMPIOEN / ULTRAS_SJR), `<PullQuote>` for the blockquote, a callout
for "ALLE 500 lotjes / €750", Facebook CTA.

## Open for PRD time

- Headline wording: "De luidste hoek." vs "Altijd luider." vs "KCVV Ultra's".
- Sanity-host the hero image vs keep the local public asset (kept local for now).
