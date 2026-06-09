# Phase 7 · /jeugd — Round 5 (YOUTH CARD DETAIL) — LOCKED

**Date:** 2026-06-09
**Mockup:** `7j5-youth-card-detail-compare.html` (Block 2)
**Owner:** @climacon
**Builds on:** `7j4-youth-card-locked.md` (variant C · taped polaroid)

## Decisions (this round)

- **Team name: NOT shown.** Age code only. The CMS team names ("KCVVE U13", "KCVVE U6 Groen &
  Wit") are noisy and add little next to the large display age code — drop them from the card. The
  age code is the card's identity; the full name lives on the team detail page.
- **Rotation: subtle alternating tilt** (±1° scrapbook, `nth-child` cycle). Judged across a full
  Onderbouw + Middenbouw division and reads as character, not noise.

## Carried from 7j4

- Taped polaroid card · 4:3 newsprint photo in a paper frame · taped top corner.
- Graceful fallback for photo-less teams: paper polaroid with a drawn age monogram.
- One `<YouthDirectory>` → `/jeugd` + `/ploegen` (re-baselines /ploegen VR).

## Photo finish (Round 5b) — LOCKED

**① Newsprint colour, always.** `--filter-photo-newsprint` (warm paper tint, in colour) — **no
greyscale, no hover colour-swap.** Consistent with every other photo on the redesigned site
(articles, team heroes, sponsors). The greyscale → hover treatment carried over from the nav-hub
news cards / sponsor logos was rejected for squad photos ("black & white looks like funeral cards").
Full-vivid colour (②) was also rejected to keep the paper-toned consistency.

Mockup: `7j5b-photo-finish-compare.html` (option ①).

## Final card spec (build-ready)

- Taped polaroid: cream paper, `paper-edge` border, paper shadow, **subtle ±1° alternating rotation**
  (index `% 3` cycle), warm tape strip on top, hover → rotate to 0 + slight lift.
- **4:3** photo, `--filter-photo-newsprint` (no greyscale).
- **Age code only** (display-big), centred caption. No team name.
- Fallback (photo-less teams): same polaroid, drawn age monogram (display-big, jersey-deep) on
  `cream-deep` instead of a photo.
- Ships in `<YouthDirectory>` → both `/jeugd` and `/ploegen`; re-baselines `/ploegen` + youth VR.
