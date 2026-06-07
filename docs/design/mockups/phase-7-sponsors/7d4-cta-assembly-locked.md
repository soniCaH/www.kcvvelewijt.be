# Phase 7 · /sponsors — Round 4 (IA: CTA + page spine) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7d4-cta-assembly-compare.html`
**Owner:** @climacon

## Decision

**CTA = C1 · Footer band.** A full-width **jersey-deep-dark** close band after the wall: the
gratitude turns into an invitation. Copy direction: heading **"Ook jouw zaak langs de lijn?"** +
sub-line + a `warm` paper-stamp **"Word sponsor +"** button. Mirrors the homepage
`<ClubshopBanner>` dark-band idiom for site consistency.

## Page spine — LOCKED (full IA)

```text
/sponsors
├─ Hero (split)
│   ├─ left:  kicker "Er is maar één plezante compagnie" + EditorialHeading
│   │         "Merci aan onze sponsors." + italic lead
│   └─ right: "In de kijker" marquee featured card (1 sponsor; highest-tier-then-name)
│             → collapses to full-width headline when 0 featured
├─ Hoofdsponsors (the ONLY tier label) — big taped tiles + italic name caption
├─ [unlabeled wall] sponsor + sympathisant merged — logo tiles, name = missing-logo fallback
└─ Footer band CTA (jersey-deep-dark) — "Ook jouw zaak langs de lijn?" + Word sponsor +
```

## Carry-forward into DETAIL rounds

1. **Featured "In de kijker" card chrome** (the deferred treatment from 7.d0): dark
   jersey-deep-dark card vs. light cream card; blurb length; link affordance.
2. **Tiles + wall:** border/shadow spec, canonical press-down hover, greyscale→colour spec,
   name-caption type, visible "Bezoek website ↗" affordance on clickable tiles.
3. **Empty states:** 0 sponsors total, 0 hoofdsponsors (wall only), 0 featured (hero collapse).
4. **Border/divider spec triples** `{weight, color-token, opacity}` for every rule + the
   footer-band edges (`feedback_border_spec_triple`).
5. **Type scale** derived from `<EditorialHeading>` + `<MonoLabel>` — map, don't re-drill.
