# Phase 4.5 · Horizontal stripe accent — Locked (R7)

**Locked 2026-05-14.**
**Source demo page:** `round-r7-stripe-accent-demo.html` (selective-application demo).
**Owner:** @climacon.

## Decision

**Drop the horizontal-stripe meta-panel accent entirely.** Brief §6's
proposal does not ship in Phase 4.5.

## Rationale

After producing a side-by-side demo in real grid context (3×2 grid
with the accent applied to 2 of 6 cards vs no accent), the
differentiation read as too subtle to justify the schema or tagging
work required to trigger it. Cards with the stripe registered as
"slightly more paper texture" rather than as a different category —
which is a weaker semantic signal than R3.B's per-articleType
background (`transfer` → jersey-deep tile) already provides.

The semantic load on the news-card meta panel is sufficient without
the stripe accent.

## What this means for the brief

Brief §6 specifies:

> Horizontal stripe pattern — used as a meta-panel accent on specific
> news cards (jeugd-milestone, column subcategories).
>
> - Subtle repeating horizontal dark stripes
> - Applied to the card's meta panel below the photo, not the whole
>   card background

R7 declines this. No news card on the homepage renders the stripe
accent.

## What's NOT happening as a consequence

- **No schema migration** for a `subcategory` enum on the article
  schema. The Sanity migrations required for Phase 4.5 remain at zero
  (consistent with `ia-locked.md`'s original commitment).
- **No GROQ projection** for subcategory tags. ARTICLES_QUERY
  extensions for hero variant + Uitgelicht slot still apply (per
  hero-locked.md / uitgelicht-locked.md), but no subcategory work
  added.
- **No editor workflow change.** Editors don't need to tag
  jeugd-milestone or column articles for the homepage to render them
  differently.
- **No new card variant.** `<NewsCard>` ships without a `stripeAccent`
  prop or equivalent.

## What still carries the semantic signal

R3.B (per-articleType card backgrounds) provides the only
content-driven visual differentiation on the news grid:

| articleType                            | Background                 |
| -------------------------------------- | -------------------------- |
| `transfer`                             | `jersey-deep` (cream text) |
| `interview` / `announcement` / `event` | `cream` (ink text)         |

This is the only semantic signal on news cards. Visual variety within
the cream-toned majority comes from cover images, tape rotation/colour,
and headline emphasis — not from background or meta-panel decoration.

## Future revisitation

If, after R3.B ships, the all-cream majority of cards starts to feel
visually flat in production (calm-period mode), the stripe accent
could be reconsidered as a less aggressive alternative to a schema
change. A simpler trigger to revisit: apply the stripe to ALL
announcement-type cards universally (no schema, no tagging — just an
articleType-driven conditional like R3.B). Today: parked.

## Audit cross-reference

This closes audit item §B2 ("Horizontal-stripe meta-panel accent
depends on a field that may not exist"). The field doesn't exist;
the accent doesn't ship.
