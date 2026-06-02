# Phase 6.E · /evenementen — Round 1 (VOICE) — LOCKED

**Date:** 2026-06-02
**Mockup:** `6e1-list-voice-compare.html`

## Decision

**Voice = Direction C "Toegangsbewijs" (ticket stubs).**

The `/evenementen` list adopts a gig-poster **ticket-stub** register:

- Dark **jersey-deep** field (not cream) for the list surface — events read as a poster wall.
- Each event is a **ticket** with a perforated **tear-off date block** (dashed edge) + a body panel.
- Bold poster-weight **display headings**; `eventType` shown as a `MonoLabel` pill.

## Implied delta

- Requires building the **`<TicketStub>`** primitive (already flagged as missing in the
  Phase 6.E audit). The list ticket and the detail "Andere events" grid both consume it.

## Rejected (and why)

- **A · Prikbord** — too photo-dependent (most events have no cover) and too informal for the
  primary events index.
- **B · Programmablad** — clean and scannable, but too quiet/utilitarian for an events surface
  meant to generate turnout. (Worth borrowing its big-serif-date discipline into the stub.)
- **D · Uitgelicht + raster** — safest continuity choice, but least distinctive; the featured
  band is already used on the homepage, so reusing it here adds little.

## Carry-forward into IA round

- Borrow B's **big-serif date** treatment for the tear-off block.
- Open IA questions for Round 2: stub anatomy (fields carried), whether the date block color
  **encodes eventType**, and whether the list stub surfaces a **CTA** or defers to detail.
