# 6.C.d1 · Team-detail IA + matches agenda row — LOCKED

**Decision:** Single-scroll + sticky section-nav; matches = month-grouped card
agenda (teaser on the team page → full-season agenda on its own route);
responsive scoreboard row (A desktop / B mobile); outcome as a flat underline on
the score. Locked 2026-05-28 across 16 drill rounds
(`6cd1-detail-ia/round-1` → `round-16`).

---

## 1. Page IA (team detail)

- **Single-scroll** stack with `<StripedSeam>` section breaks + per-section
  auto-hide — consistent with 6.A (player) / 6.B (match). Tabs **rejected**.
- A thin **sticky section-nav** under the hero jumps to: Klassement ·
  Wedstrijden · Spelers · Staf · Info. Nav lists only sections that exist
  (cross-age / data-thin youth teams degrade cleanly).
- Section order (from `data-reality-locked.md`): TeamHero → StandingsTable →
  **Wedstrijden** → SquadGrid → Staff → editorial (body / training / contact
  when present) → global SponsorsBlock.

## 2. Wedstrijden (matches) section

- **On the team page:** a *teaser* — the featured next match + a few recent
  results, same row vocabulary as the full page, then **"Volledige kalender →"**.
- **Full schedule = its own route** (`/ploegen/[slug]/wedstrijden`), rendered as
  the **§6.6 newspaper agenda**: big month headings (`Mei '26.`, display-big,
  jersey-deep italic year, **no rule beneath**) → card rows.
- The full-schedule page **auto-scrolls to the featured next match on load**
  (`scrollIntoView`, `block:center`, reduced-motion safe) so the visitor lands
  on "now" — recent results above, upcoming below. Season order ascending.
- Handles a realistic **40–50-fixture** A-team season (league + beker + oefen).

## 3. The agenda row (the heavily-drilled bit)

**Card chrome:** `border-2 border-ink` + `shadow-paper-sm` + cream bg +
canonical press-down hover. Left **date stub** (cream-soft, `border-r-2 border-dashed`):
day in `font-display-big` (≈18px), month in mono (≈8px). Date + month must share
one colour (on the jersey-deep featured card both are cream — earlier bug fixed).

**Responsive — one component, one breakpoint (~640px):**

- **A · desktop = symmetric scoreboard:** `[stub] [home crest+name] [score/time]
  [away name+crest]`. Home cluster hugs left, away hugs right, score/time centred.
  KCVV bold wherever it plays. **No venue indicator** (the order conveys home/away).
- **B · mobile = KCVV-centric column:** `[stub] [opponent crest+name+comp]
  [home/away icon] [score/time]`. KCVV is **not** repeated (you're on its page);
  **our score first**. Home/away shown as a **Lucide `house` / `bus`** icon.

**Crests:** real PSD club logos (`home_team.logo` / `away_team.logo`). One
**neutral** placeholder for all clubs (no KCVV-green — it read as a colour
legend). Desktop shows both (home-left / away-right); mobile shows the opponent's
only.

**Score / time (centred headline, display font):** played → score
(`font-display-big`); upcoming → **kickoff time** in `font-display` italic
(no "vs", no mono — mono clashed). Always centred in the score slot.

**Competition caption:** sits **inside the centre column, under the score**, so
the team names centre against the score+caption block reliably (stress-tested:
`KSV Schoonbeek-Beverst A` + `Beker van België` on one row). One treatment for
**all** competitions — mono, ink, same weight, **no tag, no bullet**. The name
itself ("Beker van België" vs "3e Provinciale A") distinguishes the type.

**Outcome indicator — flat underline on the score (NOT a column):**
- A **flat colour underline** (`box-shadow: inset 0 -9px 0 <tint>`), padded
  **wider than the score** (`padding: 0 8px`), climbing **up toward the "–"**.
- **Win** = jersey-deep tint `color-mix(jersey-deep 34%, cream)`.
- **Draw** = **no underline**.
- **Loss** = **brick** `color-mix(--color-alert 38%, cream)` (`#b84a3a`, muted
  terracotta).
- `<HighlighterStroke>` was evaluated (owner asked to reuse it) but its textured
  slab reads as noise at score-size — **reserve HighlighterStroke for large
  headline text only**; the score outcome uses this flat underline.
- **No separate W/G/V result column** on desktop *or* mobile — putting the
  outcome on the score removed the empty-cell / misalignment problems for good.

**Featured "Eerstvolgende":** the next match renders as a **jersey-deep filled
card** with a warm "Eerstvolgende" / "Seizoensopener" label above it.

**Long team names:** **ellipsis + `title="<full name>"`** (constant row height) —
wrapping to 2 lines was rejected (uneven rhythm).

## 4. Palette / vocabulary deltas (must be addressed in the PRD)

- **Deliberate exception to the "no outcome colours / no loss-red" lock:** the
  matches/standings outcome language is **win = jersey-deep · draw = none · loss
  = `--color-alert` (#b84a3a) brick** (an existing token; not bright red). This
  is the single semantic-outcome-colour pair in the redesign — justify it in the
  PRD and apply the SAME language to the `<StandingsTable>` form indicator for
  consistency. (Supersedes the blanket "no semantic outcome colours" note in the
  earlier palette lock for this specific case.)
- New route: **`/ploegen/[slug]/wedstrijden`** (full-season agenda).
- No new design-system colour token (reuses jersey-deep + alert).

## 5. NOT locked here (later 6.C drills)

- `<TeamHero>` artefact (taped team photo / jersey-illustration fallback, season
  ticket-stub, MonoLabelRow).
- `<StandingsTable>` layout (uses the §3 outcome language; KCVV row highlighted;
  no green/yellow/red badges from the legacy table).
- `<SquadGrid>` + `<PlayerCard>` (position grouping; reuses `<PlayerFigure>`).
- Staff cards; editorial section; **listing `/ploegen`** layout (hierarchy
  locked in the decision record; visual pass if needed).
- Exact sticky-nav styling; exact breakpoint px; per-row crest sizing.

## Cross-references

- `data-reality-locked.md` (6.C.d0).
- Round artifacts: `6cd1-detail-ia/round-1…round-16-final-assembled.html`.
- Decision record: `project_phase_6cde_remainder_decisions` memory + #1528.
