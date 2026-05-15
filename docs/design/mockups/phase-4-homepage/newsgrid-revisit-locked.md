# Phase 4.5 · NewsGrid geometry — Locked (R2)

**Locked 2026-05-14. Implemented #1751 (2026-05-15).**
**Supersedes:** `newsgrid-locked.md` (Phase 4 Round 5b · 1+4 asymmetric).
**Source compare page:** `round-r2-newsgrid-revisit-comparisons.html`.
**Owner:** @climacon.

## Implementation notes (#1751)

- §"Background cycle" (lines 69–85) is superseded by R3.B's `BG_BY_TYPE`
  lookup (`card-semantics-locked.md`). The slot-deterministic
  cream/jersey-deep/cream-soft/ink table is historical; production
  background derivation reads `article.articleType`.
- `SLOT_ROTATIONS` extends to six entries `[a, b, c, d, a, b]` so the
  bottom row doesn't all share `a`.
- Mobile / tablet decision: stayed at three columns above 640px;
  collapse to one column below. Per the lock's §"Mobile responsive"
  out-of-round note, no intermediate 2-col tablet variant ships.
- `articleType` is forwarded through `HomepageArticle` so the page
  doesn't need to re-import the GROQ result type to render the grid.

## Decision

**R2.B · 3×2 equal-sized cards.** Six chronological news cards in a
3-column × 2-row grid. All cards same size, no internal lead/supporting
hierarchy. Variety lives in the cards themselves (background cycle, tape
colours, rotation), not in the layout.

## Rationale

The Phase 4 Round 5b 1+4 asymmetric layout pre-dates the Uitgelicht row.
With R1.6 locked, Uitgelicht is now the prominent featured 3-up surface
above the news grid. The news grid no longer needs internal hierarchy to
feel important — Uitgelicht owns the "featured" role. Keeping a lead
card on the news grid would echo the same "lead + supporting" pattern
twice on the same page (Uitgelicht above + NewsGrid below), which reads
as visual stutter.

R2.B trades the editorial lead-card emphasis for chronological clarity:
six equal cards in publication order, with the visitor's eye moving
left-to-right, top-to-bottom through them. The prominence gradient is
hero → Uitgelicht 3-up grand → NewsGrid 3×2 small.

## Composition

```text
[Section header]
  Laatste nieuws.                       (italic-serif H2, period in jersey-deep)
  Alle berichten →                      (right-side link, mono-uppercase, jersey-deep)

[3×2 grid · grid-template-columns: repeat(3, 1fr) · gap-16]
  ┌──────┐  ┌──────┐  ┌──────┐
  │  1   │  │  2   │  │  3   │   row 1: positions 5..7 of
  └──────┘  └──────┘  └──────┘    ARTICLES_QUERY
  ┌──────┐  ┌──────┐  ┌──────┐
  │  4   │  │  5   │  │  6   │   row 2: positions 8..10
  └──────┘  └──────┘  └──────┘
```

## Per-card spec

> **Superseded by R10 flush-edge lock.** The card primitives and
> internal anatomy below (notably `<TapedFigure>` and nested padding)
> are amended by `card-structure-locked.md`. Implementers should follow
> `card-structure-locked.md` as the authoritative card-anatomy spec;
> only the grid geometry (3×2, positions 5..10) in this file remains
> normative.

The card primitive is unchanged from Phase 4 Round 5b — same
`<NewsCard>` consumer with the news-grid sizing. Only the grid
geometry changes.

- **Outer:** `<TapedCard padding="md" shadow="md">` with optional tape
  strip. Background cycles per slot for paper-stamp variety.
- **Cover:** `<TapedFigure aspect="landscape-16-9">`.
- **Label:** `<MonoLabel>` with `${variant} · ${date}`.
- **Heading:** `<EditorialHeading level={3} size="display-sm">` (~18px).
  Smaller than Uitgelicht's `display-md` (~22px) — the prominence delta.
- **Dek:** omitted in news grid (kept in Uitgelicht). Cards stay compact.
- **Read-more:** `Lees verder →` mono-uppercase, jersey-deep.
- **Padding:** `padding="md"` (vs Uitgelicht `padding="lg"`).

## Background cycle

Slot-deterministic background cycle for paper-stamp variety, matching
the current Phase 4 Round 5b pattern:

| Slot | Background    |
| ---- | ------------- |
| 1    | `cream`       |
| 2    | `jersey-deep` |
| 3    | `cream-soft`  |
| 4    | `ink`         |
| 5    | `cream`       |
| 6    | `cream-soft`  |

Slot 4's `ink` background is the heaviest visual beat; placing it in
the bottom-left of the 3×2 grid balances the row 1 jersey-deep accent
(slot 2 top-middle). Rotation pool (`a`/`b`/`c`/`d`) cycles by slot index.

## Data source

Per `hero-locked.md` and `uitgelicht-locked.md`:

- ARTICLES_QUERY: `order(featured desc, publishedAt desc)`
- Position 1 → `<EditorialHero>`
- Positions 2..4 → `<FeaturedUitgelichtRow>`
- **Positions 5..10 → `<NewsGrid>`** (this round — 6 cards, was 5)

Card count increase: 5 → 6 (Phase 4 Round 5b's 1+4 produced 5 cards;
3×2 produces 6). Slice change: `articles.slice(4, 10)` instead of
`articles.slice(3, 8)`.

## Partial states

| Total published articles after hero + Uitgelicht | NewsGrid behaviour                                          |
| ------------------------------------------------ | ----------------------------------------------------------- |
| 0                                                | Hide entire NewsGrid section (with `Alle berichten →` link) |
| 1–5                                              | Render N cards in a 3-col grid, last row may be partial     |
| 6                                                | Full 3×2                                                    |
| 7+                                               | First 6 only — rest accessible via `Alle berichten →`       |

Implementation: `<NewsGrid articles={all.slice(4, 10)} />`. Drop the
section entirely when array is empty.

## Visual prominence gradient (full homepage hero region)

| Surface             | H size                 | Photo aspect             | Padding | Surface            |
| ------------------- | ---------------------- | ------------------------ | ------- | ------------------ |
| Hero (R1.B)         | display-xl (~52px)     | 16:9 / 3:2 (per variant) | n/a     | cream              |
| Uitgelicht (R1.6.A) | display-md (~22px)     | 16:9                     | lg      | cream              |
| **NewsGrid (R2.B)** | **display-sm (~18px)** | **16:9**                 | **md**  | **cycle (varied)** |

Each row down the page the type shrinks by ~30–55%, padding tightens,
and background variety increases. The visitor experiences a clear
prominence drop from hero → featured → chronological — exactly the
brief's "uitgelicht must read as more prominent than the chronological
grid below" requirement.

## Card variant treatment (defers to R3)

Brief §6 calls for per-articleType card backgrounds (green = transfer,
cream = interview/announcement/event). The current implementation uses
slot-deterministic backgrounds (cream/jersey/cream-soft/ink cycle).
R3 resolves this tension — slot-rhythm vs articleType-semantics. R2 only
locks the geometry; R3 locks the per-card semantic treatment.

## Mobile responsive (out of round scope · implementation-time)

Mobile (<640px): single column, 6 cards stacked. Same card composition.
Tablet (640–1024px): 2 columns × 3 rows (i.e. R2.C's geometry as a
fallback). Implementation-time decision, not a design-round concern.

## Retirement plan for the locked 1+4 NewsGrid

`apps/web/src/components/home/NewsGrid/NewsGrid.tsx:95-107` ships the
1+4 geometry today. When R2.B implementation lands:

1. The grid markup changes from
   `grid-cols-1 md:grid-cols-2` + `md:row-span-2` lead → flat
   `grid-cols-1 md:grid-cols-3` with 6 cards.
2. `leadSpansTwoRows`, `variant="featured"`/`"standard"` distinction
   on the lead vs supporting cards goes away — every card uses
   `variant="standard"`.
3. `SLOT_ROTATIONS` and `SLOT_BGS` arrays extend from 5 entries to 6
   (add slot 5: `cream` rotation `a` if missing).
4. Storybook stories add a 6-card baseline; the existing 1+4-cluster
   stories retire to `_legacy/` or are renamed.
5. VR baselines regenerate (4-viewport set per the standard contract).

Implementation deferred to a dedicated issue after the R1.B / R1.5 / R1.6
implementations land — the news grid rework can run in parallel since
it only consumes its own slice of ARTICLES_QUERY.

## Open follow-ups

- **R3 — per-card semantic treatment.** Locks whether news card
  backgrounds cycle by slot (current rhythm pattern) or vary by
  articleType (brief proposal). Affects `SLOT_BGS` constant in
  `NewsGrid.tsx:33-40` and `bg` prop on `<NewsCard>`.
- **`<NewsCard>` `dek` prop usage.** R2.B omits dek on news cards
  (kept on Uitgelicht). Confirm at implementation time whether the
  prop stays or gets dropped from the NewsGrid call site.
