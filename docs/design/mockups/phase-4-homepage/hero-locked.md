# Phase 4.5 · Hero Placement — Locked (R1)

**Locked 2026-05-13.**
**Supersedes:** `ia-locked.md` Round 1 (variant D · carousel reskinned) +
Round 1b (variant D.1 · strip-below thumbnails).
**Source compare page:** `round-r1-hero-revisit-comparisons.html`.
**Owner:** @climacon.

## Decision

**R1.B · Single static hero + Uitgelicht 3-card row.** The auto-rotating
carousel locked in Phase 4 Round 1/1b is **retired**.

## Rationale

Owner's rejection of the carousel cited three concrete failures of the
shipped implementation:

1. **Takes up way too much space** — the carousel shell + thumb strip +
   pause/progress chrome was vertically tall, even when the active slide
   itself had a small footprint.
2. **Jumps in height** between slides — articles with different lead
   lengths and / or different cover-image aspect ratios make the carousel
   container reflow as it auto-advances, creating a visible "twitch" that
   reads as broken.
3. **UX is not good at all** — auto-rotation forces motion the visitor
   didn't ask for; manual navigation requires a second visual hop to the
   thumb strip below.

R1.B trades the carousel's "one-marquee-slot" punch for four featured
slots visible simultaneously (1 hero + 3 Uitgelicht cards). Total
vertical footprint is **larger** than the rejected carousel, but owner
explicitly confirmed they prefer the bigger static footprint to the
carousel's height-jump + tall chrome.

## Composition

```text
[Phase 3 chrome — locked]
  <MatchStrip>
  <SiteHeader>

[Phase 4.5 hero region — NEW lock]
  <EditorialHero placement="homepage" />     single, static, no rotation
                        (most-recent featured article = top of
                        `order(featured desc, publishedAt desc)`)

  <FeaturedUitgelichtRow />                  NEW component
                        3 prominently-sized featured cards
                        positions 2..4 of `order(featured desc,
                        publishedAt desc)` query
                        drop-if-empty per-card
                        section header: "Uitgelicht."

[Phase 4.5 body]
  <FeaturedEventBand>   (unchanged from Phase 4 lock)
  <BannerSlot a>        (unchanged)
  <NewsGrid>            (geometry pending R2 decision — see plan §A2)
  <UpcomingMatches>     (unchanged)
  …
```

## Source-of-truth

| Surface                | Source           | Field                                                                | Fallback                                                                           |
| ---------------------- | ---------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| EditorialHero (static) | Sanity `article` | `featured: boolean`. Top of `order(featured desc, publishedAt desc)` | If 0 featured articles: render the most-recent published article anyway            |
| FeaturedUitgelichtRow  | Sanity `article` | positions 2..4 of same ordered query                                 | Drop missing slots (render fewer cards rather than padding from non-featured pool) |

Schema-cost: **0 migrations**. Uses existing `featured: boolean`.

## NewsGrid impact

NewsGrid `start` offset shifts from `[3..8]` (3 hero slots) to `[4..9]`
(1 hero + 3 Uitgelicht = 4 featured slots above). NewsGrid will exclude
the article(s) already shown in the hero + Uitgelicht row.

Pending R2 decision on NewsGrid geometry (3×2 vs locked 1+4) may alter
the slice count further — re-confirm after R2 locks.

## Open follow-ups

### R1.5 — Per-articleType hero flourishes

Brief §3 specifies per-articleType artefacts on the static hero that are
**not yet implemented** despite #1638 being closed
(`EditorialHero.tsx:8` still reads: "Today every variant renders the
same shell content"). Each variant needs a visual round:

- **Interview** — interviewee name chip(s) under the headline; portrait
  thumbnail next to the headline if the referenced Person has a portrait.
- **Announcement** — optional date-stamp overlay on the photo.
- **Event** — day-number block overlay lower-left of the photo
  (e.g. `ZA 27/4`); venue strip below the headline.
- **Transfer** — directional chip `IN ↓` / `OUT ↑` / `VERLENGING ↻`;
  jersey-number badge overlaid on photo bottom-left if the Person has a
  number; player portrait thumbnail next to the headline if available.

Constraint: per `feedback_subject_photo_fallback`, ~90% of players only
have rectangular `psdImage` (no cutouts). Per `feedback_playerfigure_no_hybrid`,
no photo + drawing hybrid. The visual treatment for the "portrait
thumbnail next to the headline" needs to be decided in R1.5 — likely a
small `<TapedFigure aspect="square">` or `<TapedFigure aspect="3-4">`.

### R1.6 — Uitgelicht row card sizing

Brief §5 says featured cards MUST read as **more prominent** than the
news grid below. R1.B's preview shows 3-up cards of similar visual
weight to the news grid. Sizing/density variants (large 3-up vs 2+1
asymmetric vs full-width-with-sidebar) need a dedicated visual round
before implementation.

## Implementation prerequisites

Before implementing R1.B in code:

1. R1.5 (per-articleType flourishes) — locks the hero's per-variant
   artefacts.
2. R1.6 (Uitgelicht card sizing) — locks `<FeaturedUitgelichtRow>` card
   density.
3. R2 (NewsGrid geometry) — locks downstream NewsGrid slice count.

Estimated implementation issues (after locks complete): 3–5 issues
within the Phase 4.5 series.

## Retirement plan for `<HomepageHeroCarousel>`

Once R1.B implementation lands:

1. `apps/web/src/app/(landing)/page.tsx` swaps `<HomepageHeroCarousel>`
   for `<EditorialHero placement="homepage" />` + new
   `<FeaturedUitgelichtRow>`.
2. `apps/web/src/components/home/HomepageHeroCarousel/` moves to
   `apps/web/src/components/home/_legacy/` (mirroring the Phase 4
   `_legacy/` pattern for `FeaturedArticles` / `MatchWidget` /
   `MatchesSliderSection`).
3. Visual regression baselines for retired carousel stories
   transition to `parameters.vr.disable: true` with reason "retired
   in Phase 4.5 R1 — see hero-locked.md" per the dual-coexistence
   convention.
4. Deletion happens in Phase 9 cleanup, not in R1.B's implementation PR.
