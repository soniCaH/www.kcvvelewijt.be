# 6.d4 · StatsStrip — LOCKED (dropped, with parked aesthetic)

**Decision:** Variant **D — drop the StatsStrip entirely**, locked 2026-05-21.

**Owner side-note at lock time:** _"D, but I do like the dark visual break in
the page, maybe for something else."_ The ink/cream/jersey-deep dark-band
register stays in the kit and gets repurposed once the natural surface for it
reveals itself during downstream drills (6.d6 CareerLog, 6.d7
RecentMatches, 6.d8 QuotesBlock).

References:

- `6d4-statsstrip/round-1-statsstrip-comparisons.html` Variant D
- `6d4-statsstrip/compare.md`

## What this locks

| Decision                             | Locked value                                                                                                                                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| StatsStrip on player profile         | Removed entirely. No 5-number scoreboard band between Hero and BioBlock.                                                                                                                                        |
| Stats data flow on `/spelers/[slug]` | `getPlayerStats` BFF call may stay or be removed; the page no longer consumes the result. Decision deferred to implementation PRD — if no other section uses it (likely), the fetch is removed for performance. |
| Bordering layout                     | Hero → StripedSeam → BioBlock (skipping the second seam too, since there's no longer a section between them)                                                                                                    |
| Cross-age symmetry                   | Strongest improvement of any 6.dN lock so far — A-team and U6 profiles render identical section shapes.                                                                                                         |
| Dark-band aesthetic                  | **Parked as open repurpose.** The ink/cream/jersey-deep band visual is not retired — it's available as a register for any surviving section that wants it. Decision deferred to per-section drills.             |

## The parked dark band — open candidates

As later drills lock, watch for natural homes:

1. **CareerLog header on ink** (6.d6) — the section heading + kicker sit on a
   short dark band; rows on cream below. "Het logboek." reads as
   "official record".
2. **CareerLog full background on ink** (6.d6) — entire table sits on ink;
   inverts the page rhythm.
3. **BioBlock PullQuote as full-bleed dark band** (6.d5) — the inline
   jersey-deep PullQuote in the current mockup is pulled out to a
   full-width ink band between paragraphs.
4. **RecentMatchesGrid** (6.d7) — canonical mockup already has these on
   ink; if this section survives, the dark register lives there
   automatically.
5. **QuotesBlock — one ink + one cream** (6.d8) — §5.3 already specifies
   this; that's a built-in dark presence even without repurpose.
6. **Interlude / narrative beat** — a thin dark band between sections
   carrying a single MonoLabel teaser ("_ HET LOGBOEK", "_ IN ZIJN EIGEN
   WOORDEN"). Net-new pattern; net-new vocabulary.

If, by the end of 6.d8, none of the surviving sections want the dark band
intrinsically, the "narrative beat" pattern (#6) becomes a candidate for
its own drill — but only then, not speculatively now.

## Downstream consequences

- **Master design plan §5.3 trim** — items 4, 5 (second StripedSeam +
  StatsStrip) struck through in the doc-audit pass.
- **Phase 6 brief §2 "Stats strip styled as scoreboard"** — entire
  sub-section becomes historical; mark as scope-rejected.
- **`<StatsStrip>` component** — keep alive in the design system for
  potential reuse elsewhere (team detail page season totals, match
  detail per-half stats). No retirement.
- **Cross-age win** — `[[project_player_profile_all_ages]]` ergonomics
  improve materially. The U6 profile is no longer "the A-team profile
  with a hidden strip" but "the same shape as A-team".
- **Mockup fidelity vs retro-terrace-fanzine** — ~50%. Lowest of any
  Phase 6.A lock. Worth the trade for cross-age symmetry.

## What this does NOT lock

- Which surviving section receives the dark-band register (see candidates above)
- Whether `getPlayerStats` is removed from the page fetch path
  (implementation PRD decision)
- `<StatsStrip>` component fate site-wide — only its consumption by
  `/spelers/[slug]` is dropped
- Keeper stats — moot for this page

## Drill state after this lock

- 6.d0 — Data-reality reconciliation · LOCKED (Variant C upper-bound)
- 6.d1 — Player-name typography · LOCKED (first Black + last italic)
- 6.d2 — Hero photo fallback · LOCKED (PlayerFigure illustration)
- 6.d2.a — Illustration refinement at hero scale · QUEUED (after 6.d6 / 6.d8)
- 6.d3 — Hero NIEUW badge · LOCKED (dropped)
- **6.d4 — StatsStrip · LOCKED (dropped; dark-band aesthetic parked)**
- 6.d5 — BioBlock PullQuote sourcing logic · NEXT — watch for dark-band candidacy
- 6.d6 — CareerLogTable anchor-row emphasis · pending — watch for dark-band candidacy
- 6.d7 — RecentMatchesGrid card treatment · pending — natural dark-band home if survives
- 6.d8 — QuotesBlock pairing + sourcing · pending — built-in dark presence (ink PullQuote)
- 6.d9 — Cross-age section availability matrix · QUEUED (after per-element rounds complete)
