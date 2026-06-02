# Phase 6.E · /evenementen/[slug] — Round 5 (EventHero detail) — LOCKED

**Date:** 2026-06-02
**Mockup:** `6e5-eventhero-compare.html`

## Decision — Variant D "Editoriaal"

The detail page is intentionally **calm and light**, contrasting the dark, energetic ticket-wall
list (dark index → cream detail).

### `<EventHero>` composition (cream page, centred)

1. `eventType` **pill** (jersey-deep), top.
2. **Date/location kicker** — mono, full date: `ZATERDAG 14 SEPTEMBER · 18:00`.
3. **Title** — big display serif with italic emphasis on the accent word (jersey-deep).
4. **Location line** — mono, under the title.
5. **CTAs** (centred):
   - **Reserveer ↗** — warm filled; renders **only when `externalLink` is set** (label =
     `externalLink.label`, fallback "Reserveer").
   - **＋ Zet in agenda** — outline; **always present** (iCal download).
6. **Cover** — `TapedFigure` (tilted + taped) below the CTAs, **only when `coverImage` exists**.
   No-cover events are just the centred text block + CTAs (graceful, the common case).

### Below the hero

- **"Andere events"** section — `StripedSeam` heading + the locked list **ticket** component
  (type-coloured stubs) in a grid. No body Portable Text, no RSVP, no sponsor footer (per §6.7).

## ⚠️ Data caveat for the PRD (audit)

- The root **`event`** schema has **`location`** (new delta) but **no `address`** field. The
  mockup's "DRIESSTRAAT 14, ELEWIJT" line is **address**, which only exists on the **`eventFact`**
  block (articleType:event articles). So:
  - For **`event` docs**: show **`location`** only.
  - For **`articleType:event`** entries: `location` (+ `address` if we choose to surface it).
  - Do **not** invent an address for root events. (Confirm in PRD whether to add `address` to the
    `event` delta or accept location-only.)

## Rejected

- **A · Grote ticket** — most coherent with the list, but the owner chose the editorial contrast.
- **B · Poster** — too cover-dependent (most events have none).
- **C · Split** — fine, but the editorial centred treatment won on calm/restraint.

## Remaining 6.E details (PRD or quick round)

- **States**: empty list · filtered-to-zero · multi-day date range on stub + hero · time-less
  events (no time component) · no-cover fallbacks.
- Stub colour-contrast tuning on the dark field (from Round 2).
