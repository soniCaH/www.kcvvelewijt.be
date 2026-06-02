# Phase 6.E · /evenementen — Round 3 (IA · list layout) — LOCKED

**Date:** 2026-06-02
**Mockup:** `6e3-list-layout-compare.html`

## Decision — Variant D "Eén kolom, per maand"

- **Single column** of full-width ticket stubs (same as the mobile layout — one responsive rule).
- **Grouped by month**: each month is introduced by a header = month name (display serif) +
  a **`StripedSeam`** rule. Tickets sit chronologically within each month.
- List is **upcoming-only**, chronological.

### Why

Most agenda-like "what's on next" reading; clearest chronology; combines single-column
readability with light temporal structure. Beat B/C (2-col) on clarity and A (flat) on
wayfinding.

## Open refinements (later rounds / details)

- **Filter × month interaction**: when a type filter empties a month, hide that month's header
  (don't render an empty section). — covered in the filter round.
- **Month header seam**: exact `StripedSeam` height + colour order to confirm in details.
- **Year boundary**: show the year on the month header only when the list spans into the next
  calendar year (e.g. "Januari 2027").
- **Few-events case**: with only 1–2 upcoming events the month headers are sparse but still read
  as an agenda — accepted.
