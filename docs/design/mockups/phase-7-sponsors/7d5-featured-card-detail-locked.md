# Phase 7 · /sponsors — Round 5 (DETAIL: featured-card chrome) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7d5-featured-card-detail-compare.html`
**Owner:** @climacon

## Decision

**Featured card = F3 · light cream-soft body + jersey-deep "In de kijker" banner tab.**

- **Tab:** full-width header bar, `bg-jersey-deep` + `text-cream`, mono caps **"In de kijker"**,
  `border-bottom: 2px solid ink`. **Text-only — no ★/dingbat** (`feedback_no_decorative_nav_ornaments`).
- **Body:** `bg-cream-soft`, `border-2 border-ink`, `shadow-paper` offset. Contents: logo inset
  (cream box, `border-2 border-ink`) → italic-display name → blurb (`description`) → mono
  **"Bezoek website ↗"** link (`text-jersey-deep`) when `url` present.
- **Blurb:** `description`, clamped to ~3 lines; omitted entirely when absent (card shrinks).
- **Logo absent:** italic-display name fills the logo inset.

Keeps the page light/paper while the coloured tab unambiguously flags the marquee — without the
dark-card weight of F1 or the blends-with-hoofd risk of F2.
