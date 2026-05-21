# 6.d1 · Player-name typography — LOCKED

**Decision:** Variant **C — First Black + last italic**, locked 2026-05-21.

Reference: `6d1-name-typography/round-1-name-typography-comparisons.html`
Variant C. Companion: `6d1-name-typography/compare.md`.

## What this locks

| Decision               | Locked value                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Hero name treatment    | First name in upright Black display + last name in italic display Regular                    |
| Rhythm                 | Given name dominates ("Maxim" reads first); family name reads as a flourish                  |
| Voice register         | Friendly / mate-on-first-name-basis — fits club site over magazine                           |
| Block / line behaviour | First name on line 1, last name on line 2 (CSS `display: block`); period suffix on last name |
| Underline              | Existing `<EditorialHeading>` dashed underline rule preserved                                |

## Downstream consequences (must be addressed in PRD writing)

**Net-new vocabulary introduced:** an **upright Black display weight**.
Every editorial heading in the redesign through Phase 5 has been italic;
this is the first non-italic display usage in the system. Implications:

1. **Audit the existing display-font load** — confirm Freight Display Pro
   ships an upright Black weight in the licensed font subset (apps/web
   `globals.css` `@font-face` rules). If only italic variants are
   currently bundled, the font subset needs a re-cut.
2. **Audit `<EditorialHeading>` API** — decide whether to ship a
   `nameWeight="inverse"` prop, OR override at consumer level with two
   `<span>` children using explicit weight classes. Brief Q1 framed both
   as live options; PRD picks during component design.
3. **Audit cascade into `<PlayerCard>` and `<EditorialHero variant="transfer">`** —
   per `6d1-name-typography/compare.md` "Use sites consuming this
   vocabulary" section. Squad grids and transfer hero use the same name
   composition; the upright-Black rhythm must work or fall back to
   uniform italic at smaller scales.
4. **Long-surname stress check** — Variant C survived the Van den Broeck
   / Vanderstraeten test in mockup. Storybook stories at build time must
   cover the 14-char surname case explicitly.

## What this does NOT lock

- Whether `<EditorialHeading>` grows a `nameWeight` prop OR consumers
  hardcode the rhythm — deferred to component-design PRD writing.
- The hero figure treatment (photo / polaroid / fallback) — next drill (6.d2).
- The `NIEUW` badge trigger and placement — drilled at 6.d3.
- Scale at smaller breakpoints — mockup is illustrative at 260px; final
  values dialled in Storybook against real breakpoints.

## Drill state after this lock

- 6.d0 — Data-reality reconciliation · LOCKED (Variant C upper-bound)
- **6.d1 — Player-name typography · LOCKED (Variant C — first Black + last italic)**
- 6.d2 — Hero photo fallback treatment (when `player.psdImage` is missing) · NEXT
- 6.d3 — Hero NIEUW badge trigger + placement · pending
- 6.d4 — StatsStrip numbers + label voice · pending
- 6.d5 — BioBlock PullQuote sourcing logic · pending
- 6.d6 — CareerLogTable anchor-row emphasis (brief Q2) · pending
- 6.d7 — RecentMatchesGrid card treatment · pending
- 6.d8 — QuotesBlock pairing + sourcing · pending
