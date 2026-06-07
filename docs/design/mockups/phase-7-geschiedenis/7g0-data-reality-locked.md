# Phase 7 · /club/geschiedenis — Round 0 (DATA REALITY) — LOCKED

**Date:** 2026-06-07
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master)

## What the page is

A long-form **club chronicle** (`<HistoryContent>`), **entirely hardcoded** — no CMS, no
repository. Pure visual reskin; zero data complexity.

- **Structure:** `<TimelineSection>` (vertical centre line) → alternating `<TimelineItem side="left|right">`
  cards + interspersed full-width `<TimelineImage>` historical photos. Hero = `<InteriorPageHero>`
  ("Van 1909 tot vandaag — meer dan een eeuw voetbalpassie"). Today: white cards, green left-border,
  `kcvv-green-bright` centre line + dots — legacy tokens.
- **"Dates" are mixed labels, not a year axis:** years ("1909-1935", "1935", "1941") AND
  era/chapter names ("Eerste wereldoorlog", 'De "Leopold"', "Onenigheid", "Sportkring Elewijt",
  "FC Elewijt", "Eerste fusiegeruchten", "Rivaliteit", "Tweede wereldoorlog"). So it reads as a
  **narrative with chapter labels**, not a strict chronological timeline.
- **Historical photos** (championship teams 52-53 / 58-59 / 63-64, fusie VV Elewijt, …) at native
  ratios — the recognizable archive asset.
- Founding year **1909** is correct here (no fix needed).

## Reuse map (all existing primitives)

| Element                                | Reskin to                                                     |
| -------------------------------------- | ------------------------------------------------------------- |
| Hero `<InteriorPageHero>` (dark)       | sibling editorial hero (kicker + `<EditorialHeading>` + lead) |
| `<TimelineCard>` (white, green border) | `<TapedCard>` (cream, ink border, paper shadow)               |
| date label                             | `<MonoLabel>` / `<TicketStub>`                                |
| centre line + dots                     | `<StripedSeam>` / dashed-ink rule + ink/jersey marker         |
| `<TimelineImage>`                      | `<TapedFigure>` (newsprint, caption)                          |
| `<SectionCta>`                         | `<CtaBand>` (if a CTA is kept)                                |

## Voice (carry into 7g1)

Heritage / proud register: "meer dan een eeuw", 1909→nu. Headline candidates: "Onze geschiedenis." /
"Meer dan een eeuw." / "Sinds 1909." Voice folds into the timeline-treatment round.

## The one consequential drill (7g1)

**Timeline treatment** — how the alternating chronicle + photos render in the fanzine vocabulary:
keep alternating either side of a seam, a single-column scrapbook, or era-chaptered. Hero shown per
variant. Per-card details (ticket-stub date, photo caption) derive afterward.
