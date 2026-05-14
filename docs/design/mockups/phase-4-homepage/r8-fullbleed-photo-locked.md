# Phase 4.5 · R8 Full-bleed editorial photo moment — Locked (DROPPED)

**Locked 2026-05-14.**
**Source comparison page:** `round-r8-fullbleed-vs-hero-comparison.html`.
**Owner:** @climacon.

## Decision

**Drop R8 entirely. No new full-bleed photo section on the homepage.**

## Rationale

The owner's directive 3 asked for "at least one full-bleed photo moment
to the homepage" placed between Laatste nieuws and Het rooster. After
comparing the hero (taped polaroid · framed lead-story) to the proposed
full-bleed band (naked photo · editorial pause), the owner identified
that `<FeaturedEventBand>` (locked in Phase 4 Round 3 ·
`featuredeventband-locked.md`) already serves the same editorial-moment
role between Uitgelicht and NewsGrid.

`<FeaturedEventBand>`:

- Renders as a jersey-deep band (full editorial-photo register).
- Carries a `TapedFigure` image on the left + text on the right.
- Drop-if-empty when no featured event exists.
- Positioned BEFORE NewsGrid (between Uitgelicht and BannerSlot A in
  the locked R4.B spine).

It is the editorial breather the directive was asking for, just
sourced from `event.featuredOnHome` rather than from a separate
photo-moment schema.

## Implications

- **No new component.** `<FullBleedPhotoBand>` (or any variant of it)
  is not built.
- **No spine reordering beyond R4.B.** The locked spine stays.
- **No data-source decision needed.** Conflict 3 in the audit becomes
  moot.
- **No schema migration.** `homePage.editorialPhoto` is NOT added.
- **No dependency on #1470.** matchPreview/matchRecap can ship on
  their own schedule without blocking Phase 4.5.

## When this might come back

If the editorial team ever wants an "always-on" cinematic photo
moment regardless of whether an event is featured this week, R8 could
be revisited. Today: not needed — `FeaturedEventBand` covers the
role when it's relevant, and when no event is featured the homepage
runs cream-only between Uitgelicht and NewsGrid (also fine).

## Audit cross-reference

This closes the conflict 3 question from the photo-treatment directive
audit (R8 hover demo plus the R8 vs hero comparison page).
