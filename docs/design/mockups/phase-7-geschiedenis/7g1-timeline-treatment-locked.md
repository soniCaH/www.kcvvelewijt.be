# Phase 7 · /club/geschiedenis — Round 1 (TIMELINE TREATMENT) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7g1-timeline-treatment-compare.html` (panel T1)
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master)

## Decision

**T1 · Alternating + fanzine seam.** Keep the recognisable two-sided timeline, reskinned to the
retro-terrace-fanzine vocabulary.

## Final spine

```text
/club/geschiedenis  (cream paper)
├─ Heritage hero (sibling) — kicker "De club · sinds 1909" + EditorialHeading
│                            "Meer dan een eeuw." (jersey-deep period) + italic lead
├─ <StripedSeam>
└─ Alternating timeline:
     · vertical dashed-ink centre line (2px ink, ~0.5 opacity) — replaces the kcvv-green-bright line
     · per-era node marker: jersey-deep dot, border-2 ink — replaces the green dot
     · cards either side = <TapedCard> (cream-soft, border-2 ink, paper shadow) — replaces white/green-border
     · date/era label = <MonoLabel> warm chip (era names + years both render as chips)
     · full-width historical photos = <TapedFigure> (newsprint filter, italic caption) — replaces <TimelineImage>
     · mobile: collapses to a single column (as today) — keep
```

## Derived details (NOT re-drilled — from locked primitives)

- Hero = sibling editorial composition (no `EditorialHero`, no `InteriorPageHero`).
- Date chip = `<MonoLabel>` warm/ink; era-names and years both supported (data is mixed labels).
- Photos = `<TapedFigure>` newsprint + italic caption (the championship-team archive shots).
- Centre line + dots are decorative (`aria-hidden`); the cards carry the semantic order.
- Border triples: line `2px · ink · 0.5`; card `2px · ink · 1` + paper shadow; marker `2px · ink · 1`.

## Build deltas (PRD seed)

- **Reskin `<HistoryContent>`** (`apps/web/src/app/(main)/club/geschiedenis/`):
  `TimelineCard → <TapedCard>`, `TimelineImage → <TapedFigure>`, centre line → dashed-ink rule,
  dots → ink/jersey markers, date → `<MonoLabel>`. **Content stays hardcoded** (no CMS).
- New heritage **sibling hero**; drop `<InteriorPageHero>` + `<SectionStack>` + `<SectionCta>` +
  `kcvv-green-bright`/`kcvv-black` tokens; use `<StripedSeam>`.
- **No data / schema / BFF change.** Analytics: `geschiedenis_view` page view (add `geschiedenis_`
  to GTM regex — or fold under a `club_` prefix if preferred). Keep breadcrumb JSON-LD.
- Stories (`vr`) for the new hero + a representative `TimelineItem` (left/right) + a `TimelineImage`.
  Page-level e2e smoke already covers the route.

## Open for PRD time

- Hero headline final: "Meer dan een eeuw." vs "Onze geschiedenis." vs "Sinds 1909."
- Whether to keep a closing CTA (e.g. → /club or /ploegen) or end on the timeline.
- Analytics prefix: dedicated `geschiedenis_` vs a shared `club_`.
