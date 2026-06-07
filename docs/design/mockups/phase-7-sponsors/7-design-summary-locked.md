# Phase 7 · /sponsors — DESIGN SUMMARY (LOCKED)

**Date:** 2026-06-07
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master)
**Supersedes (on landing):** `docs/prd/sponsors-redesign.md`
**Drill record:** `7d0`…`7d5` lock docs + `*-compare.html` in this folder (authoritative for design).

The `/sponsors` redesign in the retro-terrace-fanzine system. Register: **grateful, warm,
gracious** — never a sales funnel. Every choice maps to an approved primitive.

---

## 1. Final page spine

```text
/sponsors  (cream paper field, newsprint grain)
├─ <SponsorHero>  (split)
│   ├─ left:  MonoLabel kicker "ER IS MAAR ÉÉN PLEZANTE COMPAGNIE"
│   │         + EditorialHeading "Merci aan onze sponsors." (italic display, jersey-deep period)
│   │         + italic-display lead
│   └─ right: <FeaturedSponsorCard> — ONE marquee, "In de kijker" jersey tab
│             → when 0 featured: left column goes full-width, no card
├─ <StripedSeam>  (colorPair ink-cream, height md)
├─ Hoofdsponsors  (the ONLY tier label — MonoLabel kicker + paper-edge rule)
│   └─ <TapedCardGrid cols=3>  large taped tiles: logo + italic name caption
├─ [unlabeled wall]  sponsor + sympathisant merged, NO header
│   └─ dense grid (reuse homepage SponsorTile): logo only, name = missing-logo fallback
└─ <StripedSeam> → <SponsorCtaBand>  (jersey-deep-dark footer band)
        "Ook jouw zaak langs de lijn?" + sub-line + warm "Word sponsor +" paper-stamp
```

## 2. Locked decisions (index)

| Round | Lock                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.d0  | Data reality: 3 Dutch tiers, logo/tier optional, `description` featured-only, hero is a sibling (NOT EditorialHero generic), spotlight kept |
| 7.d1  | Voice = A·Merci (grateful) + D's prominent featured card                                                                                    |
| 7.d2  | Featured = single marquee in hero; pick = highest-tier-then-name; collapse on 0                                                             |
| 7.d3  | Tier treatment = label only "Hoofdsponsors"; sponsor+sympathisant merge into one unlabeled wall                                             |
| 7.d4  | CTA = jersey-deep-dark footer band; full page spine                                                                                         |
| 7.d5  | Featured chrome = light body + jersey "In de kijker" tab (no dingbat)                                                                       |

## 3. Derived detail specs (mapped to primitives — NOT re-drilled)

- **Type scale:** headline via `<EditorialHeading>` (italic-display, period-terminated). Kickers
  via `<MonoLabel>` (mono caps, 0.18em tracking). Lead = `font-display` italic. Name captions =
  `font-display` italic. Wall/caption micro-text = mono.
- **Hover (canonical press-down, `feedback_canonical_press_down_hover`):** every clickable tile +
  the CTA button + the featured-card link: `hover:shadow-none hover:translate-x-1
hover:translate-y-1 transition-all duration-300`.
- **Greyscale→colour (master-plan decision 16, as in `<SponsorsBlock>`):** `grayscale
group-hover:grayscale-0 group-focus-visible:grayscale-0 transition-all duration-300
motion-reduce:transition-none` on every logo `<Image>`.
- **Border / divider triples** `{weight, color-token, opacity}`:
  - Hoofd tile frame: `2px · --color-ink · 1` + `--shadow-paper` offset.
  - Wall tile frame: `1.5px · --color-ink · 1` (no shadow — flatter, denser).
  - Featured card frame: `2px · --color-ink · 1`; tab bottom: `2px · --color-ink · 1`.
  - Tier-kicker rule: `2px · --color-paper-edge · 1`.
  - Footer band top+bottom: `2px · --color-ink · 1`.
  - Section seams: `<StripedSeam colorPair="ink-cream" height="md">`.
- **Focus ring:** `focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-jersey-deep` (as in `<SponsorsBlock>`).
- **Contrast:** small text on jersey-deep / jersey-deep-dark uses `text-white` (cream is <AA there
  — Phase 6.C rule). The "In de kijker" tab + footer band copy follow this.

## 4. Empty states

- **0 sponsors total:** hero headline-only (no marquee) → reskinned `<SponsorEmptyState>` →
  footer band. No empty grids/labels.
- **0 hoofdsponsors:** drop the "Hoofdsponsors" label + taped grid; render only the wall.
- **0 in wall (only hoofd):** drop the wall; hoofd grid + footer band.
- **0 featured:** hero left column full-width (locked 7.d2).

## 5. Build deltas (PRD seed)

**Components — new (all under `apps/web/src/components/sponsors/`):**

- `<SponsorHero>` — sibling hero (kicker + EditorialHeading + lead + optional `<FeaturedSponsorCard>`).
- `<FeaturedSponsorCard>` — F3 tab+body marquee card.
- `<SponsorCtaBand>` — jersey-deep-dark footer band (or fold into a reskinned `<SponsorCallToAction>`).

**Components — reskin / reuse:**

- `<SponsorsPage>` — rebuilt composition; drop `SectionStack` + `diagonal` + `getSponsorsSections`
  - dark `kcvv-black` header (legacy tokens). Use `<StripedSeam>`.
- Hoofd grid → `<TapedCardGrid>` of a tile (logo + italic name).
- Wall → reuse/extract the homepage `<SponsorsBlock>`'s `SponsorTile` (already redesign-ready) as a
  shared `<SponsorTile>` so /sponsors + homepage share one tile.
- `formatSponsorAlt` — reuse for alt text.

**Components — retire (legacy, no redesign consumer after this):**

- `<SponsorsSpotlight>` (carousel, `kcvv-green-dark`), `<SponsorGrid>`, `<SponsorCard>`,
  `<SponsorLogo>` (size/showNames API) — verify consumers, then delete with stories/tests.
- `getSponsorsSections` + its `SectionStack`/`diagonal` usage.

**Data / repository:** `SPONSORS_QUERY` already projects `id, name, url, type, tier, featured,
description, logoUrl` — sufficient. Consider a larger `logoUrl` (`w=600`) for the marquee + hoofd
tiles (currently `w=400`). The legacy hidden `type` fallback bucketing may be dropped (untiered →
sympathisant/wall).

**Analytics (required — `feedback_analytics_prd_requirement`):** events `sponsor_view`
(page view), `sponsor_click` (tile → params: tier, hashed id), `sponsor_featured_click`,
`sponsor_cta_click`. **Add `sponsor_` to the live GTM Custom-Event trigger regex** (manual step,
call out in PR). No PII — hash any internal id.

**SEO:** keep breadcrumb JSON-LD; metadata exists. Optional `ItemList` JSON-LD of sponsors.

**Testing:** component stories + `vr` tag + baselines for `<SponsorHero>`,
`<FeaturedSponsorCard>`, `<SponsorTile>`, `<SponsorCtaBand>`, tier grid (state coverage:
featured/no-featured, hoofd-empty, wall-empty, all-empty). Pages/\* story (not vr) + e2e smoke
already covers `/sponsors`.

## 6. Open for PRD time (not design)

- Exact footer-band copy + sub-line wording.
- Whether `<SponsorCtaBand>` is a new component or a reskinned `<SponsorCallToAction>`.
- `logoUrl` width bump decision.
