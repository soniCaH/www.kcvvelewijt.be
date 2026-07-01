# KCVV Elewijt — building with this design system

This is the **KCVV Elewijt** football-club design system: a _retro-terrace fanzine_
look — cream paper, ink-black outlines, jersey-green accents, washi-tape corners,
Freight serif display type, and IBM Plex Mono labels. Compose screens from **these
components**; reach for raw Tailwind only for layout glue.

## Setup — no provider needed

There is **no theme/context provider**. The design system's stylesheet defines every
token and utility class globally, so any component renders correctly on its own —
just place it. (Load order only matters in that the stylesheet must be present, which
the runtime already ensures.)

- **Page width** is set with `<PageContainer>` (not raw `max-w-*`): `width="index"`
  (1280, card grids/landing), default (1040, detail pages), or `width="prose"` (680,
  reading/forms). Vertical rhythm goes on the consuming section via `className`.
- **Full-bleed** elements (`<CtaBand>`, `<StripedSeam>`, coloured section bands) span
  the viewport and are never wrapped in a width container.

## Styling idiom — Tailwind v4 with the KCVV token palette

Style your own layout glue with these **real utility families** (all defined in the
bound stylesheet). Do **not** invent hex values — use the tokens:

| Concern          | Utilities (prefix `bg-` / `text-` / `border-`)                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Brand green      | `jersey`, `jersey-deep`, `jersey-deep-dark`, `jersey-bright`                                        |
| Paper / surfaces | `cream`, `cream-deep`, `cream-soft`, `gray-100`, `tape-cream`                                       |
| Ink / text       | `ink`, `ink-soft`, `ink-muted`                                                                      |
| Accents / status | `warm` (gold), `alert` (brick), `warning`, `card-red`, `success-soft`                               |
| Fonts            | `font-display-big` (Freight serif display), `font-body` (Freight Sans), `font-mono` (IBM Plex Mono) |
| Paper shadows    | `shadow-paper-sm`, `shadow-paper-md`, `shadow-paper-lift`                                           |
| Patterns (bg)    | `--pattern-jersey-stripes`, `--pattern-seam`, `--pattern-paper-grain`                               |

Idioms that make output on-brand: **ink outlines + offset paper shadow** (`border-2
border-ink shadow-paper-md`), **mono uppercase micro-labels** (`font-mono uppercase
tracking-widest`), **italic Freight emphasis** in jersey-deep, and a slight tape/rotation
tilt on cards. Small text on `jersey-deep` uses `text-white` (cream fails AA there).

## Build with these components, not raw markup

- **Type & editorial**: `EditorialHeading` (period-terminated headline with italic
  accent or highlighter emphasis), `EditorialLead`, `EditorialKicker`, `SectionHeader`,
  `SectionKicker`, `MonoLabel` / `MonoLabelRow` (mono pills/labels), `NumberDisplay`,
  `PullQuote`, `BodyQuote`, `DropCapParagraph`, `HighlighterStroke`, `QuoteMark`.
- **Paper cards & media**: `TapedCard`, `TapedCardGrid`, `TapedFigure` (photo + caption),
  `ClippedCard`, `StampBadge`, `Crest`, `JerseyShirt` / `JerseyIllustration`.
- **Actions & forms**: `Button`, `LinkButton`, `DownloadButton`, `Input`, `Textarea`,
  `TextareaCounter`, `Label`, `Select`, `FilterTabs`, `RemovableChip`, `Alert`,
  `AlertBadge`, `Spinner`, `ErrorState`.
- **Sections & chrome**: `PageContainer`, `SectionStack`, `SectionTransition`,
  `CtaBand`, `StripedSeam`, dividers (`DashedDivider`, `DottedDivider`, `Divider`),
  `SiteHeader`, `SiteFooter`, `NavDropdown`, `NavTakeover`.

Read each component's `.prompt.md` for its props + examples and its `.d.ts` for the
exact API. The stylesheet (`styles.css` and the `_ds_bundle.css` it imports) is the
source of truth for every token above.

## Idiomatic snippet

```tsx
<PageContainer width="wide" as="section" className="py-16">
  <SectionHeader
    kicker="CLUBNIEUWS"
    emphasis={{ text: "nieuws", highlight: true }}
  >
    Het laatste nieuws.
  </SectionHeader>

  <TapedCardGrid className="mt-8">
    <TapedCard bg="cream" padding="md">
      <MonoLabel variant="pill-jersey">WEDSTRIJD</MonoLabel>
      <EditorialHeading className="mt-3">
        KCVV pakt de drie punten.
      </EditorialHeading>
    </TapedCard>
  </TapedCardGrid>
</PageContainer>
```
