# Phase 7 · /jeugd — Round 4 (YOUTH CARD: photo treatment) — LOCKED

**Date:** 2026-06-09
**Mockup:** `7j4-youth-card-compare.html` (variant **C**)
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master) · Issue #2038 (scope note: team photos back in scope)

## Decision

**C · Taped polaroid + age stub.** The photo-bearing youth card is a tilted, taped scrapbook
**polaroid**: a newsprint squad photo in a paper frame, with the age code + team name as the
caption. Strongest fanzine read of the four; chosen over the editorial photo-top card (A), the
washed background tile (B), and the minimal age-chip+strip hybrid (D).

## Context

#2070 backfilled real `team.teamImage` squad photos onto 11 teams (9 youth + A/B). The 6.C
`<YouthDirectory>` age-chip card predates them and renders the age code only. This drill **reopens
the 6.C age-chip lock** to render the photo on the youth card across **both** `/jeugd` and
`/ploegen` (one shared component) → **re-baselines `/ploegen` VR**.

## Constants (locked across the variants)

- Newsprint tint (`--filter-photo-newsprint`) + greyscale → colour on hover.
- **Graceful fallback** for the ~8 photo-less teams (U5, U8, U16, U19, Reserven, Weitse Gans, U7,
  U9): a paper polaroid with a drawn age monogram instead of a photo.
- One `<YouthDirectory>` drives `/jeugd` + `/ploegen`.

## Open for Round 5 (detail drill — `7j5`)

Drilled at realistic grid scale (a full division of real photos), not re-litigating the shape:

1. **Team name** — show (normalised from the messy CMS strings: "KCVVE U13" → "U13") vs age code
   only.
2. **Rotation** — subtle alternating tilt (±1°) vs none, judged across a full 5–9-card division
   (rotation noise was the flagged risk for C).
3. Photo aspect (4:3 vs 3:2), tape colour/placement, fallback monogram treatment, division-header
   rhythm.
