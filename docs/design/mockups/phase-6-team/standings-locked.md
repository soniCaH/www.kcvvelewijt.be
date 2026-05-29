# 6.C.d3 · StandingsTable — LOCKED

**Decision:** Classic retro table, full division inline, KCVV highlighted, **no
Vorm column.** Locked 2026-05-28 (`6cd3-standings/round-2-no-form.html`).

- **Source:** BFF `RankingEntry`. Columns: `# · Ploeg · M · W · G · V · +/- · Ptn`.
- **Treatment:** mono uppercase headers; `border-b-2 ink` header rule; hairline
  (`border-b 1px paper-edge`) row rules; team name display italic; points
  display-big black; small neutral crest before each team name (real PSD logo).
- **KCVV row highlight:** `color-mix(jersey-deep 12%, cream)` tint band +
  `inset 3px 0 jersey-deep` left accent + team name non-italic bold. (This is a
  "this team" highlight — distinct from the matches win/loss colour language.)
- **Vorm DROPPED:** `RankingEntry.form` is optional and not reliably populated
  for the other teams in the division — a half-empty column reads worse than
  none. **Consequence:** the win/draw/loss colour language (jersey-deep / brick)
  applies to the **matches agenda only** — there is no standings form indicator.
  (Supersedes the "also drives the standings form" note in `detail-ia-locked.md`.)
- **Scope:** full division shown inline on the team page (compact enough).
- **Mobile:** drop `W · G · V` → `# · Ploeg · M · +/- · Ptn`.
- Auto-hides entirely for teams with no PSD ranking (most youth).

## Cross-references

- `detail-ia-locked.md` (6.C.d1) — outcome colour language (matches only).
- Artifacts: `6cd3-standings/round-1-standings.html` (form options, rejected),
  `round-2-no-form.html` (locked).
