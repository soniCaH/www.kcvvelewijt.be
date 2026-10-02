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
  **Amended 2026-10-02 (numbers only, see Amendment below).**

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
  (index cycle; now the five-step slight-tier cycle, see Amendment), warm tape strip on top, hover → rotate to 0 + slight lift.
- **4:3** photo, `--filter-photo-newsprint` (no greyscale).
- **Age code only** (display-big), centred caption. No team name.
- Fallback (photo-less teams): same polaroid, drawn age monogram (display-big, jersey-deep) on
  `cream-deep` instead of a photo.
- Ships in `<YouthDirectory>` → both `/jeugd` and `/ploegen`; re-baselines `/ploegen` + youth VR.

## Amendment (2026-10-02) — numbers only, per [#3302](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3302)

The intent above holds: a subtle tilt that reads as character, not noise. Only the numbers move,
because the card now takes its lean from the site's one tilt scale instead of a local pool.
Decision: _a card's lean follows its slot; its tape angle follows the card_ (#3302, built in #3329,
adopted here in #3330).

- **Lean:** was `[-1.1°, +0.7°, -0.5°]` (index `% 3`). Now the **slight tier**, `--rotate-lean-a..d`
  (`-1°`, `-0.5°`, `+0.5°`, `+1°`), cycled by index in a **five-step**, sign-alternating order
  `a, c, b, d, b`. Five, because the grid runs 2, 3 or 4 columns and a cycle that divides the column
  count would stack one lean down a whole column. The new maximum is 1°, against 1.1° before.
- **Tape:** was fixed at `c` for every card. Now **identity-derived**, seeded by the team's display
  name (the key `<TeamHero>` seeds from, so a team wears one tape on `/jeugd`, `/ploegen` and its
  own page). The angle comes from the **bigger tier**, `--rotate-tape-a..f` (`-6°` .. `+6°`).
- Unchanged: the warm tape colour, the 4:3 newsprint frame, the age-code caption. The tape's side
  (left/right) now follows the same five-step slot instead of `index % 2`.
