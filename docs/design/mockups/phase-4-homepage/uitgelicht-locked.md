# Phase 4.5 · Uitgelicht row — Locked (R1.6)

**Locked 2026-05-13.**
**Source compare page:** `round-r1-6-uitgelicht-sizing-comparisons.html`.
**Companion:** `hero-locked.md` (R1) introduces the Uitgelicht section.
**Owner:** @climacon.

## Decision

**R1.6.A · Equal 3-up grand.** Three same-size featured cards in a single
row on cream paper. Prominence over the news grid below is achieved via
SIZE + emphasis, not via tone (rejected: R1.6.C dark band) or hierarchy
(rejected: R1.6.B asymmetric 1+2 — would mirror the news grid's 1+4 shape).

## Composition

```text
[Section header]
  Uitgelicht.                          (italic-serif H2, period in jersey-deep)
  Drie picks van de redactie           (right-side mono-uppercase meta)

[3-up row · 1fr 1fr 1fr · gap-24]
  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │ <TapedFig> │  │ <TapedFig> │  │ <TapedFig> │  16:9 landscape
  │            │  │            │  │            │
  └────────────┘  └────────────┘  └────────────┘
  MonoLabel (kicker · date)
  EditorialHeading display-md (~22px italic serif, optional accent)
  EditorialLead 1-line dek (line-clamp-1)
  Lees verder →
```

## Per-card specs

- **Outer:** `<TapedCard padding="lg" shadow="md">` with optional warm or
  jersey tape strip. Background: paper-stamp variety per slot (cycle:
  `cream` / `cream-soft` / `cream`, OR all `cream` — implementation
  detail).
- **Cover:** `<TapedFigure aspect="landscape-16-9">` with `article.coverImage`.
- **Label:** `<MonoLabel>` with `${variant} · ${date}` (e.g. `Interview · Do 14 mei`).
- **Heading:** `<EditorialHeading level={3} size="display-md">` —
  approximately 22px italic serif with optional jersey-deep `accent`
  decorator. Larger than news-card's `display-sm` (~18px) — this is the
  prominence delta.
- **Dek:** 1-line `<EditorialLead>` or compact paragraph, `line-clamp-1`,
  opacity 0.85. Optional — graceful omit when `article.lead` is empty.
- **Read-more:** `Lees verder →` mono-uppercase, jersey-deep, bold,
  `margin-top: auto` so it pins to the bottom of the card.
- **Padding:** `padding="lg"` (vs news card `padding="md"`).

## Data source

Per `hero-locked.md`:

- ARTICLES_QUERY: `order(featured desc, publishedAt desc)`
- Position 1 → `<EditorialHero placement="homepage" />`
- **Positions 2..4 → `<FeaturedUitgelichtRow>`** (this round)
- Positions 5..10 → `<NewsGrid>` (3×2 geometry — see
  `newsgrid-revisit-locked.md`, which supersedes this section's
  position range)

## Empty / partial states

| Featured count (`featured: true`) | Hero                          | Uitgelicht              | News grid                           |
| --------------------------------- | ----------------------------- | ----------------------- | ----------------------------------- |
| 0                                 | Most-recent published article | Hidden                  | Most-recent N                       |
| 1                                 | Sole featured article         | Hidden                  | Next 6 most-recent                  |
| 2                                 | Position 1 (featured)         | 1 card (position 2)     | Next 6 most-recent                  |
| 3                                 | Position 1 (featured)         | 2 cards (positions 2–3) | Next 6 most-recent                  |
| 4+                                | Position 1 (featured)         | 3 cards (positions 2–4) | Next 6 most-recent (positions 5–10) |

Implementation: `<FeaturedUitgelichtRow articles={featured.slice(1, 4)} />`.
Drop section header + section entirely when array is empty. Render fewer
cards rather than padding from non-featured pool — the row is the
editorial "featured" surface, not a recent-articles fallback.

## Visual prominence delta vs news grid

Audited against current `<NewsGrid>` card spec (cream paper, `padding="md"`,
`display-sm` heading ~18px, `landscape-16-9` cover, slot-cycle backgrounds):

| Property       | News card               | Uitgelicht card    | Delta                  |
| -------------- | ----------------------- | ------------------ | ---------------------- |
| H heading size | display-sm (~18px)      | display-md (~22px) | +22%                   |
| Padding        | md (~14px)              | lg (~22px)         | +57%                   |
| Photo aspect   | 16:9 landscape          | 16:9 landscape     | parity                 |
| Background     | cycles cream/jersey/ink | cream (consistent) | calmer, not flatter    |
| Optional dek   | no                      | yes (1-line)       | extra editorial signal |
| Read-more      | yes                     | yes                | parity                 |

Combined, the Uitgelicht card reads ~25–30% larger and quieter (cream-
only) than a typical news card. The visitor's eye lands on the
Uitgelicht row first, descends to the more-varied news grid below for
"latest" content.

## Section header

- Heading: `<EditorialHeading level={2} size="display-md">` rendering
  "Uit*gelicht*." with the italic-emphasis decorator on "gelicht" (or on
  the whole word) plus a period.
- Right-side meta: `<MonoLabel>` rendering "Drie picks van de redactie"
  in mono-uppercase. Optional — could be dropped if it reads as filler.
  **Owner confirmation needed before implementation** — copy proposal,
  not locked here.
- No `Alle berichten →` link on Uitgelicht (that link lives on the news
  grid below, not on the featured row).

## Responsive behaviour (out of round scope · implementation-time)

Mobile (<640px): cards stack vertically in a single column. Same card
composition, full-width.

Tablet (640–1024px): two columns, third card wraps below. OR keep three
columns at narrower widths if the H2 still reads. Owner to pick at
implementation time; not a design-round concern.

## Implementation notes for the spinout issue

- Component name: `<FeaturedUitgelichtRow>` (singular) — not a generic grid.
- Lives in `apps/web/src/components/home/FeaturedUitgelichtRow/`.
- Storybook: `Features/Home/FeaturedUitgelichtRow` with stories for
  N=0, N=1, N=2, N=3+ counts.
- VR tag: `vr` on the meta — this is a Phase 3 Include-list-eligible
  component when implementation lands.
- Test coverage:
  - Unit: graceful-omit for 0..3 featured count.
  - VR: each visible count state with a baseline.
- Consumes the same ARTICLES_QUERY extension scoped in `hero-locked.md`
  (no separate query).
