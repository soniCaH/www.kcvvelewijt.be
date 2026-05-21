# 6.d3 · Hero NIEUW badge — LOCKED (dropped)

**Decision:** Drop the NIEUW badge entirely. Locked 2026-05-21 by owner
direction at drill open ("drop the NIEUW label please").

No round-1 mockup file generated — the drop-section decision was made before
mockups were drafted.

## What this locks

| Decision                                         | Locked value                                                                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NIEUW badge on hero                              | Removed entirely. Neither present nor fallback states show a NIEUW badge.                                                                                      |
| `<MonoLabel>NIEUW</MonoLabel>` in §5.3 hero spec | Marked for deletion in master plan + brief audit pass.                                                                                                         |
| `player.firstTeamSince: date` schema migration   | **Cancelled.** Its only consumer was the NIEUW trigger. No new fields added for this Phase 6.A — only `careerLog[]` remains from the 6.d0 lock's schema scope. |
| Trigger-threshold debate                         | Moot — no badge to trigger.                                                                                                                                    |

## Downstream consequences

- **6.d0 lock — schema scope reduced.** `data-reality-locked.md` listed
  `careerLog` + `firstTeamSince` as the two Sanity migrations. Now: only
  `careerLog`. Editorial workload estimate (~12h for 24 players) stands —
  it was always the career log, not the join-date field.
- **Page-component branch logic simpler.** `<PlayerHero>` no longer needs
  a "joined-recently" date comparison or a conditional badge render.
- **No editorial workflow** for tagging new signings on the website. New
  players become visible via Sanity sync alone, without a "show NIEUW
  for N days" rule that editors would have to remember to unset.
- **Hero composition** — the TapedFigure frame no longer accepts a corner
  badge overlay. The brief's "+ NIEUW corner" wording in §2 / §5.3 gets
  struck through in the doc-audit pass.
- **Honors `[[feedback_no_magazine_chrome]]`** — NIEUW reads as
  editorial-publication chrome (new article, new edition); dropping it
  aligns with the no-magazine-chrome stance.

## What this does NOT lock

- Whether the **TapedFigure tape strip** in the present state stays as-is
  — separate visual element, unaffected by this lock.
- The team-kicker / TicketStub composition above/below the figure ("A-PLOEG 26/27") — unchanged.
- Any future "new signings" surface elsewhere on the site (e.g. a
  homepage transfer module) — out of scope. The redesign already has
  `<EditorialHero variant="transfer">` for actual transfer announcements;
  that's the editorial home for "new signing" content, not a hero badge.

## Drill state after this lock

- 6.d0 — Data-reality reconciliation · LOCKED (Variant C upper-bound, `firstTeamSince` now dropped from schema scope)
- 6.d1 — Player-name typography · LOCKED (Variant C — first Black + last italic)
- 6.d2 — Hero photo fallback · LOCKED (Variant C — PlayerFigure illustration)
- 6.d2.a — Illustration refinement at hero scale · QUEUED (after 6.d4 / 6.d5)
- **6.d3 — Hero NIEUW badge · LOCKED (dropped entirely)**
- 6.d4 — StatsStrip numbers + label voice · NEXT
- 6.d5 — BioBlock PullQuote sourcing logic · pending
- 6.d6 — CareerLogTable anchor-row emphasis (brief Q2) · pending
- 6.d7 — RecentMatchesGrid card treatment · pending
- 6.d8 — QuotesBlock pairing + sourcing · pending
