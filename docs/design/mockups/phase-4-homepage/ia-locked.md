# Phase 4 · Homepage IA — Locked

**Locked 2026-05-07 across rounds 1, 1b, 2, 3, 4, 4b.**

## Composition

```text
[Phase 3 chrome — locked]
  <MatchStrip>          peek of next match
  <SiteHeader>          sticky retro chrome + drawer

[Phase 4 — hero region]
  <EditorialHero placement="homepage" /> (D.1)
                        carousel · 3 articles · auto-rotate every 5s
                        strip-below thumbnails (active outlined jersey-yellow,
                        inactives 60% opacity, click jumps the carousel)
  <FeaturedEventBand>   (E.2 — new component this phase, see featuredeventband-locked.md)
                        jersey-deep band; image left (TapedFigure with WARM tape) + text right
                        sits between hero and NewsGrid; drop-if-empty

[Phase 4 — body]
  <BannerSlot a>        drop-if-empty
  <NewsGrid>            6 article cards · NO event slot
  <UpcomingMatches>  tabs: schedule | standings
  <BannerSlot b>        drop-if-empty
  <YouthBlock>          full-bleed jersey-deep interlude
  <WebshopBanner>       single-CTA banner pointing to external supplier (renamed from
                        <WebshopStrip>; ink palette to avoid green-on-green with YouthBlock —
                        see webshopbanner-locked.md)
  <BannerSlot c>        drop-if-empty
  <SponsorsBlock>       newspaper grid · main + second tier only
                        greyscale by default · colour on hover

[Phase 3 chrome — locked]
  <SiteFooter>          H3 wordmark replaces retired <PosterWordmark>
```

## Source-of-truth per surface

| Surface | Source | Field | Fallback |
| --- | --- | --- | --- |
| EditorialHero carousel | Sanity `article` | `featured: boolean` (already in schema) | If < 3 flagged: fill remaining slots with most-recent published |
| FeaturedEventBand | Sanity `event` | `featuredOnHome: boolean` (already in schema) | None — drop the band if no flagged event with `dateStart >= now()` |
| bannerSlotA / B / C | Sanity `homePage` | `bannerSlotA / B / C: ref → banner` | None — drop the band if ref empty |
| NewsGrid | Sanity `article` | `ARTICLES_QUERY[3..9]` (skip the 3 hero articles) | Drop the section if 0 |
| UpcomingMatches | BFF | `getNextMatches()` (existing) — all KCVV teams, chronological | Return null if 0 upcoming. Standings dropped from homepage scope; live on `/ranking` only. See `upcoming-matches-locked.md` |
| YouthBlock | Hardcoded | n/a | n/a |
| WebshopBanner | Hardcoded copy + external link | n/a | n/a |
| SponsorsBlock | Sanity `sponsor[]` | `tier in ["hoofdsponsor", "sponsor"]` only on homepage | Drop if 0 sponsors |

## Round-by-round lock log

- **Round 1 — Hero shape:** Variant **D · Carousel reskinned**. Auto-rotate preserved on the retro fanzine palette.
- **Round 1b — Carousel thumbnails:** Variant **D.1 · Strip below**. All 3 thumbs in a horizontal row below the active hero; active outlined jersey-yellow, inactives 60% opacity.
- **Round 2 — Hero source:** Variant **S.2 · `article.featured` boolean**. Field already exists. Query change only: `order(featured desc, publishedAt desc)`. Most-recent fallback if fewer than 3 are flagged.
- **Round 3 — Featured event placement:** Variant **E.2 · Standalone band between hero and NewsGrid**. New `<FeaturedEventBand>` component, jersey-deep palette, drop-if-empty.
- **Round 4 — Body spine:** Variant **A · NewsGrid → Schedule → Youth → Webshop → Sponsors**. Sponsors stays the commercial close.
- **Round 4b — Banner slots:** Variant **BS.1 · Keep all 3 slots**. Positions: bannerSlotA between event and grid, bannerSlotB between schedule and youth, bannerSlotC between webshop and sponsors. All drop-if-empty.

## Schema cost rolling total

| Change | Type | Phase |
| --- | --- | --- |
| `article.featured` query usage in homepage hero | Query change only | Phase 4 |
| `event.featuredOnHome` query usage on homepage | Query change only | Phase 4 |
| `<FeaturedEventBand>` React component | New component | Phase 4 |
| `<BannerSlot>` retains existing 3 refs on `homePage` | No change | Phase 4 |
| **Sanity migrations required** | **0** | — |

## Open questions deferred to per-section rounds

- **NewsGrid card composition** — 4 aspect-ratio variants (16:9 / square / 3:4 / text-only), tape rotation rules per card position, kicker / byline / articleType MonoLabel placement. Round 5 (NewsGrid + NewsCard).
- **ScheduleStandingsBlock layout** — tabs vs split, schedule depth (next 3? next 5? grouped by week?), standings shape (group only or full table), KCVV row highlight (psd_club_id 1235), empty-state. Round 6.
- **SponsorsBlock tier rendering** — main (`hoofdsponsor`) vs second (`sponsor`) layout density per tier; missing-logo fallback (italic Freight Display name treatment). Round 7.
- **YouthBlock copy + composition** — JerseyShirt placement, headline treatment, stat ("220+ spelers · 16 ploegen" — verify still accurate), CTA copy, divisions mention. Round 8.
- **WebshopBanner** — composition (single-CTA banner pointer to external supplier per Round 9b lock; ink palette per F.1 to avoid YouthBlock adjacency). Round 9.
- **Cream / ink / jersey rhythm token map** — locks after all section internals. Round 10.
- **Mobile compression rules** — single-column rules at <640px. Implementation-time, not design-time.

## Reuse mandate

Per `feedback_reuse_approved_primitives` and `feedback_editorial_hero_reuse_mandate`: every new
sub-component built for Phase 4 must compose with the existing retro-fanzine vocabulary
(`<TapedCard>`, `<TapeStrip>`, `<TicketStub>`, `<MonoLabel>`, `<EditorialHeading>`,
`<EditorialKicker>`, `<EditorialLead>`, `<EditorialByline>`, `<HighlighterStroke>`,
`<TapedFigure>`). The `<FeaturedEventBand>` introduced this phase will compose
TapedFigure (cover) + MonoLabel (kicker) + EditorialHeading + a press-down CTA — no new primitive.

The carousel motion logic (D.1) is the only "use client" component introduced in Phase 4.
