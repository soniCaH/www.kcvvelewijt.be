# Phase 4.5 · Section spine ordering — Locked (R4)

**Locked 2026-05-14.**
**Supersedes:** `ia-locked.md` Round 4 (Variant A · "Sponsors stays the commercial close").
**Source compare page:** `round-r4-spine-revisit-comparisons.html`.
**Owner:** @climacon.

## Decision

**R4.B · Clubshop moves AFTER Sponsors.** The Brandsfit clubshop is
demoted from "middle of the bottom half" (current Phase 4 lock) to
"final full-bleed band before the footer." Sponsors becomes the
editorial close on cream; the clubshop becomes the last commercial
moment.

## Locked section sequence

```text
[Phase 3 chrome]
   MatchStrip
   SiteHeader

[Phase 4.5 hero region]
1. EditorialHero            cream            (R1 / R1.5)
2. FeaturedUitgelichtRow    cream            (R1.6)

[Phase 4.5 body]
3. FeaturedEventBand        jersey-deep      drop-if-empty (Phase 4)
4. BannerSlot a             cream-soft       drop-if-empty
5. NewsGrid 3×2             cream            (R2 / R3)
6. UpcomingMatches          cream-soft       (Phase 4)
7. BannerSlot b             cream-soft       drop-if-empty
8. YouthBlock               jersey-deep      full-bleed (Phase 4)
9. BannerSlot c             cream-soft       drop-if-empty · moved up
10. SponsorsBlock           cream            editorial close (Phase 4)
11. WebshopBanner           jersey-deep-dark final dark band (moved down)

[Phase 3 chrome]
   SiteFooter
```

## Rationale

The owner accepted the brief §10 demotion explicitly, including the
tonal-rhythm trade-off:

- **Old rhythm:** `cream → DARK (event?) → cream → cream-soft → cream →
DARK Youth → DARK Webshop → cream Sponsors → footer`. Two dark
  bands cluster (Youth + Webshop back-to-back).
- **New rhythm:** `cream → DARK (event?) → cream → cream-soft → cream →
DARK Youth → cream Sponsors → DARK Clubshop → footer`. Bouncier
  cadence (dark / light / dark) but the clubshop reads visibly less
  important — sponsors is the editorial close, the clubshop is the
  commercial postscript.

The competing R4.C (drop the clubshop section entirely) was rejected
because Brandsfit is a real club partner with a CTA slot; removing the
section would over-demote a paid partnership relationship. Demotion via
positioning (R4.B) hits the intent without burning the partnership.

## Implementation impact

### `apps/web/src/app/(landing)/page.tsx:285-313`

The current sections array (lines 285-313) ships in the Phase 4 lock
order. The new spine reshuffles to:

```typescript
sections={[
  heroSection,
  featuredUitgelichtSection,   // NEW · R1.6
  featuredEventSection,
  bannerSlotASection,
  latestNewsSection,           // 3×2 geometry per R2
  upcomingMatchesSection,
  bannerSlotBSection,
  youthSection,
  bannerSlotCSection,          // moved UP (was after webshop)
  sponsorsSection,             // moved UP (now penultimate)
  webshopSection,              // moved DOWN (final commercial band)
]}
```

Implementation note: set `SectionStack` `reserveFooterSafeArea={true}`.
After R4.B `<WebshopBanner>` is the last section before the footer and
paints a jersey-deep-dark background to the section edge, so the
safe-area padding is needed to prevent the footer's cream tone from
butting directly against the webshop's dark band.

### Tone-rhythm risk register (accepted)

| Concern                                                                                                                            | Owner stance                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Dark-light-dark bounce in the lower third (Youth → Sponsors → Clubshop)                                                            | Accepted as the cost of clubshop demotion                             |
| Last band before footer is full-bleed dark — feels heavier than a cream close                                                      | Accepted; footer's cream tone reasserts immediately                   |
| If `FeaturedEventBand` renders (~50% of the time), the page now has 3 jersey-deep moments (event, Youth, Clubshop) vs 2 previously | Accepted; intermittent event band keeps overall tonal weight in check |

### Brandsfit partnership note

Owner reads the clubshop demotion as their editorial call; Brandsfit was
not explicitly consulted on this change. If the partnership agreement
specified a prominence tier (e.g. "above the fold" / "mid-page"), revisit
this lock before shipping. **Open follow-up — owner to confirm.**

## Banner slot positions (post-R4.B)

| Banner        | Position                               | Status      |
| ------------- | -------------------------------------- | ----------- |
| `bannerSlotA` | Between FeaturedEventBand and NewsGrid | unchanged   |
| `bannerSlotB` | Between UpcomingMatches and Youth      | unchanged   |
| `bannerSlotC` | Between Youth and Sponsors (moved up)  | **changed** |

If a future banner slot D is needed (between Sponsors and Clubshop, or
between Clubshop and Footer), the schema gains a 4th `bannerSlotD: ref → banner`
field on the `homePage` document — schema migration, R7-style. Not in
Phase 4.5 scope.

## Implementation issue spinout

R4.B implementation rolls into the same PR as the broader homepage
restructure (hero swap, NewsGrid geometry, Uitgelicht row addition). It's
a small change in `apps/web/src/app/(landing)/page.tsx` — about a dozen
lines reshuffled.

## Post-implementation amendments

- **Implemented in #1754 (Phase 4.5.C.1).** `apps/web/src/app/(landing)/page.tsx` now lists sections in the R4.B order: hero → Uitgelicht → FeaturedEventBand → BannerSlot a → NewsGrid → UpcomingMatches → BannerSlot b → Youth → BannerSlot c → Sponsors → Clubshop. `SectionStack reserveFooterSafeArea={false}` retained so the jersey-deep-dark `<ClubshopBanner>` meets the cream footer top directly.
- **Brandsfit partnership prominence tier (open follow-up).** Owner accepted the R4.B demotion as their editorial call; partnership terms were not re-litigated with Brandsfit. **Status: still open** — flag for revisit if Brandsfit raises it.
- **Youth `paddingTop: "pt-0"` override.** The youth `SectionConfig` sets `paddingTop: "pt-0"` so the R5.B `<StripedSeam>` lands flush at the section boundary (default `pt-20` painted 80px of jersey-deep above the seam and the band read as "sandwiched"). Mirrored in the `Pages/Homepage` Storybook composition.
