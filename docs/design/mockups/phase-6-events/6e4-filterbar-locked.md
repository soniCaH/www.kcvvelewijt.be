# Phase 6.E · /evenementen — Round 4 (IA · filter bar) — LOCKED

**Date:** 2026-06-02
**Mockup:** `6e4-filterbar-compare.html`

## Decision — Variant B "Kleur-pills = legenda"

- The eventType **filter chips are colour-coded** to match the stub date-block colours, so the
  filter row **doubles as the legend** — there is **no separate legend row**.
  - Clubevent = `jersey-deep` · Supportersactiviteit = `warm` · Jeugdwerking = `jersey-bright` ·
    Andere = `ink`.
- **"Alles"** is the neutral default chip (cream), no filter applied.
- **Selected** chip = filled with its type colour; **unselected** = dimmed cream outline.
- Single-select in v1 (one type at a time or "Alles"). Multi-select can come later if needed.

### Accessibility note

The chip still carries its **text label** (e.g. "Clubevent"), so type is never conveyed by
colour alone (WCAG 1.4.1). The colour is reinforcement; the label is the truth.

## Carried-forward rules

- **Filter × month**: a month whose tickets are all filtered out **hides its header** (no empty
  month sections).
- This resolves the Round-2 open question: the legend is **not** a separate element — it lives in
  the filter chips.

## Remaining 6.E rounds

- **States**: empty list, filtered-to-zero, multi-day events, time-less events.
- **Detail page**: the new `<EventHero>` (hero + external-link CTA + "Zet in agenda" iCal +
  "Andere events" grid). Body Portable Text, RSVP, and sponsor footer are dropped per §6.7.
