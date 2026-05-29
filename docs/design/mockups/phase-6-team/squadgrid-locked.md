# 6.C.d4 · SquadGrid / PlayerCard — LOCKED

**Decision:** Position-grouped grid; PlayerCard = photo polaroid with a
jersey-deep **number disc overlaid top-left** + name + position. Locked
2026-05-28 (`6cd4-squadgrid/round-1-playercard.html`, treatment A).

- **Grouping:** by position — Doelmannen / Verdedigers / Middenvelders /
  Aanvallers (mono group headers + hairline rule). Derived from
  `player.position` (editorial) || `positionPsd`.
- **PlayerCard:** `<TapedCard>`-framed; `<PlayerFigure>` photo (3:4, newsprint
  treatment) with the **number disc** (jersey-deep, cream numeral, ink border)
  top-left; below: name (first semibold + last italic, the 6.A rhythm) + position
  (MonoLabel/mono). Press-down hover; whole card links to `/spelers/[slug]`.
- **No-`psdImage` fallback:** `<PlayerFigure>` canonical illustration in the same
  frame (inherits [[project_playerfigure_illustration_canonical]]).
- **Cross-age / minors:** reuses `<PlayerFigure>`'s locked minor treatment
  ([[project_player_profile_all_ages]]) — no extra work here.
- **Follow-ups (implementation):** keeper is already conveyed by the Doelmannen
  group + "Keeper" position; captain glyph is match-level (not squad) — omit;
  responsive grid `auto-fill minmax(~140px)`.

## Cross-references

- Inherits `<PlayerFigure>` (locked photo + illustration states).
- Artifact: `6cd4-squadgrid/round-1-playercard.html`.
