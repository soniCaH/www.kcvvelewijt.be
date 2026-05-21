# 6.d8 · QuotesBlock — LOCKED

**Decision:** Variant **C — Single full-width ink quote**, locked 2026-05-21.

QuotesBlock renders as a single full-width `<PullQuote tone="ink">` card.
Source: the second `pullquote`-marked span in `player.bio` (extends the
6.d5 decorator pattern). The §5.3 "ink + cream pair" composition is
**rejected** in favor of a single ink card.

References:

- `6d8-quotesblock/round-1-quotesblock-comparisons.html` Variant C
- `6d8-quotesblock/compare.md`
- 6.d5 lock — `pullquote` PT decorator (Variant B; A "impossible")
- 6.d4 lock — dark-band aesthetic parked for repurpose

## What this locks

| Decision                         | Locked value                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| QuotesBlock shape                | Single full-width `<PullQuote tone="ink">` card. NO pair. NO cream card.                         |
| Source                           | Second `pullquote`-marked span in `player.bio` (first span goes to BioBlock per 6.d5)            |
| Section heading                  | `In zijn eigen woorden.` with highlight marker on "woorden" (canonical)                          |
| Schema delta                     | None — reuses 6.d5 decorator                                                                     |
| Editorial workload               | Marginal — editor marks 2 spans in bio instead of 1 when authoring                               |
| Dark-band home                   | **DEFINED.** The parked 6.d4 dark-band aesthetic lives here as the page's strongest punctuation. |
| Fallback when only 1 span marked | BioBlock renders span; QuotesBlock auto-hides                                                    |
| Fallback when no spans / no bio  | Both BioBlock and QuotesBlock auto-hide                                                          |

## Knock-on resolutions

**6.d5.a (PullQuote presentation) — RESOLVED without a separate drill.**
The dark band now has its home (QuotesBlock as a full-width ink card).
The BioBlock's pullquote stays as a right-column jersey-deep PullQuote
per §5.3 / 6.d5 mockups — NOT promoted to a dark interlude band. Two
PullQuote surfaces with distinct tones: jersey-deep (bio inline + side
card) and ink (QuotesBlock). No drill needed.

Mark 6.d5.a as resolved-by-cascade in the task list.

## Phase 6.A final page composition

```text
SiteHeader
MatchStrip (chrome — top)
PlayerHero
   ├── #N (NumberDisplay, jersey-deep)
   ├── name (first Black + last italic, per 6.d1)
   ├── meta row (position · birthDate; age-graded per 6.d9 — height / weight / nationality removed from schema)
   ├── photo column: TapedFigure
   │     ├── present: psdImage with newsprint filter + paper grain
   │     └── fallback: <PlayerFigure> illustration (per 6.d2)
   └── team / season ticket-stub
StripedSeam
BioBlock
   ├── kicker (MonoLabel)
   ├── editorial heading
   ├── paragraph (player.bio)
   └── inline pullquote (bio decorator span #1 →
         right-column jersey-deep PullQuote card)
QuotesBlock
   └── full-width ink PullQuote card
         (bio decorator span #2)
MatchStrip (chrome — bottom)
SiteFooter
```

## Phase 6.A scope summary (after all locks)

**Schema migrations:** ZERO new top-level fields. One additive: `pullquote`
PT decorator on `player.bio` block marks (6.d5 lock).

**BFF endpoints:** ZERO new. `getPlayerStats` call removed from the page
(StatsStrip dropped at 6.d4).

**Editorial backlog:** ZERO net-new tasks. Editor marks 1-2 pullquote
spans while authoring bios.

**New components (apps/web design system):**

- `<PlayerHero>` (new composition for `/spelers/[slug]`)

**Reworked components:**

- `<BioBlock>` — adds inline pullquote rendering via new decorator
- `<QuotesBlock>` — simplified to single ink card

**Sections dropped from canonical §5.3:**

1. Hero NIEUW badge (6.d3)
2. StatsStrip (6.d4) — `<StatsStrip>` component stays in design system, not consumed by this page
3. CareerLogTable (6.d6) — primitive never built
4. RecentMatchesGrid (6.d7) — primitive never built; multi-team blocker
5. QuotesBlock cream half (6.d8) — only ink card survives

**Mockup fidelity vs `docs/design/mockups/retro-terrace-fanzine/player-profile-desktop.png`:** ~55%.
The retro-terrace-fanzine mockup remains a visual reference for the
_surviving_ sections (hero composition, bio pairing, ink quote tone),
not a complete spec.

## Drill state — ALL PER-ELEMENT DRILLS COMPLETE

- 6.d0 — Data-reality reconciliation · LOCKED (C upper-bound; schema empty)
- 6.d1 — Player-name typography · LOCKED (first Black + last italic)
- 6.d2 — Hero photo fallback · LOCKED (PlayerFigure illustration)
- 6.d2.a — Illustration refinement at hero scale · QUEUED (after Storybook render at hero scale)
- 6.d3 — NIEUW badge · LOCKED (dropped)
- 6.d4 — StatsStrip · LOCKED (dropped)
- 6.d5 — BioBlock PullQuote sourcing · LOCKED (bio PT decorator)
- 6.d5.a — PullQuote presentation · RESOLVED-BY-CASCADE (no drill needed)
- 6.d6 — CareerLog · LOCKED (dropped)
- 6.d7 — RecentMatchesGrid · LOCKED (dropped)
- **6.d8 — QuotesBlock · LOCKED (single ink card; dark-band home)**
- 6.d9 — Cross-age section availability matrix · QUEUED

## Remaining work (after this lock)

1. **6.d9** — Cross-age section availability matrix (privacy treatment
   for minors, division-aware section visibility)
2. **6.d2.a** — PlayerFigure illustration refinement at hero scale
   (only after Storybook can render the canonical figure at production scale)
3. **Q6** — Seed matrix for staging verification (per
   `[[feedback_variant_coverage_matrix_in_seeds]]`)
4. **Q7** — Master design doc audit (§5.3 + §5.4 + §6 cascading updates
   from all 6.dN locks)
5. **Q8** — Build slice shape for 6.A (single PR / vertical slices / etc.)
6. **PRD writing** — Phase 6.A PRD using locked design decisions as input
