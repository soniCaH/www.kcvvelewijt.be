---
name: Direction 1 — Editorial Magazine
description: Article detail redesign exploration — calm, print-sensibility direction with narrow measure, heavy typography, surgical green
status: draft — brainstorming exploration, not the final design
---

# Direction 1 — Editorial Magazine

One of three parallel explorations for the KCVV Elewijt article-detail page redesign. See also `02-stadium-graphic.md` and `03-broadcast-dramatic.md`. None of these is the final spec; the approved design will be merged from the winning direction + borrowable elements.

---

## 1. The direction in 3 bullets

**Mantra:** _"The photography does the drama. The typography does the talking. Green is a signature, not a stadium light."_

Three rules that keep it coherent:

1. **Narrow measure, generous margins.** Body copy never exceeds 65ch. Hero columns breathe. A reader should feel the article is the only thing on the page.
2. **Weight and scale carry hierarchy; color only punctuates.** Quasimoda 700 at display sizes against Quasimoda 400 at reading sizes does the heavy lifting. `kcvv-green-bright` appears only at accent bars, numerals, pull-quote rules, and the drop-cap — never as a fill behind text.
3. **Structure is visible.** Numbered Q&A, thin rules between sections, small-caps kickers, drop-caps. The editor doesn't hand-format rhythm — the template prints it.

---

## 2. Hero treatment per type

Universal hero frame: white page (`--color-kcvv-white`), no diagonal cuts, no overlays, no gradient tints. Image sits as a calm rectangle; headline lives below it on white. Content column `max-w-[60rem]` centered, outer padding 2.5rem desktop / 0.75rem mobile.

### `announcement` hero (the baseline)

```text
Desktop (>= 960px)                                    Mobile
+----------------------------------------------+      +---------------------+
|   < Terug naar nieuws                        |      | < Terug             |
|                                              |      |                     |
|   ---- NIEUWS   |   19 APRIL 2026            |      | NIEUWS | 19 APR '26 |
|                                              |      |                     |
|   Een nieuw hoofdstuk                        |      | Een nieuw           |
|   voor het eerste elftal.                    |      | hoofdstuk voor      |
|                                              |      | het eerste elftal.  |
|   By Redactie KCVV  ·  4 min lezen           |      |                     |
|                                              |      | Redactie KCVV       |
|   +--------------------------------------+   |      | 4 min lezen         |
|   |                                      |   |      +---------------------+
|   |            HERO IMAGE                |   |      |                     |
|   |         (16:9, no overlay)           |   |      |    HERO IMAGE       |
|   |                                      |   |      |      (4:3)          |
|   +--------------------------------------+   |      |                     |
|   caption in small caps, kcvv-gray            |      +---------------------+
+----------------------------------------------+
```

Specs:

- Back link: `text-sm font-[var(--font-family-body)] text-[var(--color-kcvv-gray)] hover:text-[var(--color-kcvv-green-dark)]`, Lucide ChevronLeft at 14px preceding.
- Kicker row: `.featured-border::before` 4rem×2px `kcvv-green-bright` bar, then category label `text-xs uppercase tracking-[var(--letter-spacing-label)] font-[var(--font-family-body)] font-500 text-[var(--color-kcvv-gray-blue)]`, vertical divider `|` in `kcvv-gray-light`, date in same small-caps style.
- Headline: `font-[var(--font-family-title)] font-700 text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.95] tracking-[-0.01em] text-[var(--color-kcvv-gray-blue)]`. No ALL CAPS — sentence case.
- Byline row: `text-sm text-[var(--color-kcvv-gray-dark)]`, author name in `font-500`, dot separator, read time in `font-[var(--font-family-mono)] text-xs`.
- Image: plain `rounded-[4px]` rectangle, no shadow, no overlay. Caption below: `text-xs uppercase tracking-[var(--letter-spacing-caps)] text-[var(--color-kcvv-gray)]`.

### `interview` hero variant

Same frame, but kicker reads `INTERVIEW | #9 · AANVALLER` (position + jersey number pulled from `subject.kind='player'`). Headline drops to `text-[clamp(2rem,4.5vw,3.5rem)]` to make room for a **subtitle line** in `font-[var(--font-family-title)] font-400` (Quasimoda 400 at `text-2xl` — no italic, weight contrast does the work) reading the subject's full name. Hero image replaced by a 4:5 portrait crop — taller, more formal. Transparent cutout is **not** used in the hero (saved for the spread).

### `transfer` hero variant

No image hero at all. Kicker `TRANSFER | INCOMING` (or OUTGOING / EXTENSION). Headline renders a programmatic from→to composition at display size:

```text
   ---- TRANSFER | INCOMING

   Naam Speler
   ------------------------------
   from    STANDARD LUIK
   to      KCVV ELEWIJT
```

The feature `transferFact` card then sits _directly below_ this headline block as the first body element (see §6). The "hero" is typographic; the player cutout arrives in the card.

### `event` hero variant

Kicker `EVENT | JEUGD`. Under the headline, the date renders as a **serif-style date block** before the image:

```text
   ---- EVENT | JEUGD

   Lentetornooi U13 — zaterdag in Elewijt.

   27        APRIL
   ----      2026
   zaterdag · 10u00 · Sportpark Elewijt
```

Specs for the date block: day numeral `font-[var(--font-family-title)] font-700 text-[5rem] leading-[0.9] text-[var(--color-kcvv-gray-blue)]`, month `text-xl uppercase tracking-[var(--letter-spacing-label)] font-500`, thin 1px rule in `kcvv-gray-light` beneath, metadata line in small caps `text-xs tracking-[var(--letter-spacing-caps)] text-[var(--color-kcvv-gray)]`.

---

## 3. Metadata bar + related slider framing

Metadata bar lives **below** the hero image (announcement/interview/event) or below the hero typographic block (transfer), spanning the 60rem column. Single row, thin 1px rule above and below in `kcvv-gray-light`:

```text
+------------------------------------------------------------------+
|  19.04.2026   ·   Redactie KCVV   ·   4 min lezen   [share] [.] |
+------------------------------------------------------------------+
```

- Left cluster: `font-[var(--font-family-mono)] text-xs uppercase tracking-[var(--letter-spacing-caps)] text-[var(--color-kcvv-gray)]`.
- Share icons on the right: Lucide Share2, Facebook, X (twitter-x from set) at 16px, `kcvv-gray-blue`, hover `kcvv-green-dark`. No filled buttons.
- Breadcrumb is the back-link above the kicker; we don't repeat it here.

### RelatedContentSlider framing

Full-width section below article body on `--color-foundation-gray-light` (#edeff4) cream surface — the _only_ tonal shift in the whole page. Section opens with a `.featured-border::before` bar, then `MEER UIT HET ARCHIEF` in `text-xs uppercase tracking-[var(--letter-spacing-label)] font-500 text-[var(--color-kcvv-gray-blue)]`. Section heading below it: `font-[var(--font-family-title)] font-700 text-4xl text-[var(--color-kcvv-gray-blue)]`.

Cards: white surface on cream, `rounded-[4px]`, no shadow at rest, `--shadow-card-hover` on hover. Card internals — 16:10 image top (no overlay), kicker row, `text-lg font-700` title in `kcvv-gray-blue`, date in mono small-caps. Cards are separated by generous gap (2rem) and a 1px vertical rule between them — not card borders. Nav arrows are Lucide ChevronLeft/ChevronRight 20px in `kcvv-gray-blue`, no circle, no fill. Green touches only: the 4rem kicker bar, and a 2px `kcvv-green-bright` underline that animates in under the card title on hover.

---

## 4. Baseline body typography (`announcement`)

Column: `max-w-[65ch]` centered in the 60rem hero column. Prose base `text-lg` (1.125rem), `leading-[1.6]`, `font-[var(--font-family-body)] font-400 text-[var(--color-kcvv-gray-dark)]`. Paragraphs separated by `1.25em` vertical space — no indent.

### Drop-cap (first paragraph only, announcement + transfer body prose)

`::first-letter` styling: `font-[var(--font-family-title)] font-700 text-[5.5rem] leading-[0.85] float-left pr-3 pt-2 text-[var(--color-kcvv-green-bright)]`. Four lines tall. This is the single green-as-main-element moment in the article.

### Headings inside body

- `h2`: `font-[var(--font-family-title)] font-700 text-3xl leading-[1.2] text-[var(--color-kcvv-gray-blue)]`, preceded by a `.featured-border::before` 4rem×2px green bar as a margin-top ornament, `mt-16 mb-4`.
- `h3`: `font-[var(--font-family-title)] font-500 text-xl leading-[1.25] text-[var(--color-kcvv-gray-blue)]`, `mt-10 mb-2`. No accent bar.
- Numbered section headings are rendered via an extra `.prose-numbered` utility that prefixes a mono numeral `01.` in `text-sm font-[var(--font-family-mono)] text-[var(--color-kcvv-green-bright)]` above the h2. Used at the writer's discretion.

### Blockquote — reworked from the existing 15rem `"` motif

The existing oversized green `"` reads as a web mannerism. In Editorial Magazine direction, blockquotes become a **rule-framed pull-quote**:

```text
   ----------------------------------
   Wat telt, is de volgende match.
   En daarna de match daarna.
   ----------------------------------
                     — Coach De Ridder
```

Specs: centered, `max-w-[50ch]` (narrower than body), thin 1px rules top and bottom in `kcvv-gray-light` extending the full prose width, quote text `font-[var(--font-family-title)] font-400 text-2xl leading-[1.4] text-[var(--color-kcvv-gray-blue)] text-center my-3`, attribution beneath in `text-sm font-500 uppercase tracking-[var(--letter-spacing-caps)] text-[var(--color-kcvv-gray)]`. No leading glyph. Argument: the green `"` is loud in a direction built on restraint; thin rules are quieter, more magazine, and let the quote's _content_ be the accent.

### Lists

`ul` bullets are 2px × 2px `kcvv-green-bright` squares (not circles), sitting on the baseline, `pl-6`. `ol` uses mono numerals `font-[var(--font-family-mono)] text-sm text-[var(--color-kcvv-green-dark)]` followed by period. Spacing `0.5em` between items, `leading-[1.6]`.

### Inline

Links are `text-[var(--color-kcvv-gray-blue)] underline decoration-[var(--color-kcvv-green-bright)] decoration-2 underline-offset-4 hover:text-[var(--color-kcvv-green-dark)]`. Bold is `font-700`, never colored.

---

## 5. qaBlock — all four tag treatments

Universal Q&A column matches body prose: `max-w-[65ch]`, centered.

### `standard`

```text
   01.   Hoe voelde de week na de winst aan?

         Relaxed, eigenlijk. Ik heb zondag met
         de familie gebarbecued en verder niets
         gedaan. Dat mag ook eens.
   --------------------------------------------
```

Specs:

- Numeral `01.`: `font-[var(--font-family-title)] font-700 text-5xl leading-[0.9] text-[var(--color-kcvv-green-bright)]`, floated left in a 4rem gutter, top-aligned to the question's baseline.
- Question: `font-[var(--font-family-title)] font-700 text-xl leading-[1.3] text-[var(--color-kcvv-gray-blue)] mb-3`.
- Answer: `text-lg leading-[1.6] text-[var(--color-kcvv-gray-dark)]`.
- Thin 1px rule in `kcvv-gray-light` below, `mt-10 mb-10`. No rule after the last pair.

### `key` (promoted pull-quote, takes over a spread)

Full-bleed `.full-bleed` on cream `--color-foundation-gray-light`. Subject cutout floats to one side at modest size (35% viewport width, max 380px). Answer dominates as centered display text:

```text
+----------------------------------------------------------------+
|                                                                |
|  [ cutout ]     ----------------------------------------       |
|  (PNG,          "Winnen in Elewijt voelt anders. Dat           |
|   ~360px,       merk je pas als je hier een jaar bent."        |
|   no border)    ----------------------------------------       |
|                                         02.  JONAS VERHOEVEN   |
|                                                                |
+----------------------------------------------------------------+
```

Specs:

- Answer: `font-[var(--font-family-title)] font-400 text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.25] text-[var(--color-kcvv-gray-blue)]`, wrapped in top+bottom 1px rules in `kcvv-gray-light` at `max-w-[40rem]`.
- Question is **rendered as a small caption** above the cutout column: `text-xs uppercase tracking-[var(--letter-spacing-label)] text-[var(--color-kcvv-gray)] font-500`, mono-adjacent. Not hidden — that's the `quote` variant's job.
- Attribution below rule: mono numeral + subject name in small caps, `font-[var(--font-family-mono)] text-xs tracking-[var(--letter-spacing-caps)] text-[var(--color-kcvv-gray-blue)]`.
- Section has 8rem vertical padding top and bottom. No shadow.

### `quote` (standalone dramatic, question hidden)

Even more stripped. Full-bleed white. No cutout. Just the answer, centered, with a `.font-alt` (Stenciletta) leading kicker reading `IN HET KORT` or similar editorial label:

```text
+----------------------------------------------------------------+
|                                                                |
|                      IN HET KORT                               |
|                                                                |
|            ------------------------------                      |
|              We spelen voor het dorp.                          |
|              Punt.                                             |
|            ------------------------------                      |
|                       -- Jonas Verhoeven                       |
|                                                                |
+----------------------------------------------------------------+
```

Quote text one size larger than `key`: `text-[clamp(2rem,4vw,3rem)]`, `font-[var(--font-family-title)] font-500`. Stenciletta kicker at `text-sm uppercase tracking-[var(--letter-spacing-label)]` in `kcvv-green-dark` — this is the rare "stadium banner" moment the alt font earns. 10rem vertical padding.

### `rapid-fire`

```text
   RAPID FIRE
   ---------------------------------------------
   Koffie of thee?              Koffie. Zwart.
   ---------------------------------------------
   Favoriete ploeg als kind?    Club Brugge.
   ---------------------------------------------
   Beste maat in de kleedkamer? Seppe.
   ---------------------------------------------
```

Two-column CSS grid, `grid-cols-[1fr_1.3fr] gap-8`. Questions `font-[var(--font-family-title)] font-500 text-base text-[var(--color-kcvv-gray-blue)]`. Answers `font-[var(--font-family-body)] font-400 text-base text-[var(--color-kcvv-gray-dark)]`. Thin 1px rules between rows in `kcvv-gray-light`. Section heading `RAPID FIRE` in `.font-alt` Stenciletta at `text-xs uppercase tracking-[var(--letter-spacing-label)] text-[var(--color-kcvv-green-dark)]`, preceded by `.featured-border::before` bar.

### Mobile adaptation for qaBlock

- `standard`: numeral shrinks to `text-3xl` and sits above the question on its own line, not in a gutter.
- `key`: cutout stacks above the quote, max-width 70vw, centered. Quote rules span the full column.
- `quote`: unchanged — scales naturally with clamp.
- `rapid-fire`: collapses to a single column; each pair becomes question (font-500, text-sm, green-dark) stacked over answer (text-base), rule between pairs.

---

## 6. transferFact — feature + overview variants

### Feature card (first block in a single-transfer article, full-width break-out)

```text
+-------------------------------------------------------------------+
|                                                                   |
|   [ player cutout ]    ---- INCOMING                              |
|   (PNG cutout,                                                    |
|    40% col width,      Naam Speler                                |
|    cropped to          -------------------------------            |
|    waist-up,           27 jaar · Middenvelder                     |
|    no frame)                                                      |
|                        from                                       |
|                        [logo] STANDARD LUIK                       |
|                                                                   |
|                        to                                         |
|                        [logo] KCVV ELEWIJT                        |
|                                                                   |
|                        "Blij om thuis te zijn."                   |
|                                                                   |
+-------------------------------------------------------------------+
```

Specs:

- `.full-bleed` container, content constrained to `max-w-[70rem]` inside. Background: white. 4rem vertical padding. 1px rules top and bottom across the full bleed in `kcvv-gray-light`.
- Two-column `grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10`. Cutout column: playerPhoto rendered cleanly, no circle, no frame, no shadow. Height capped at 420px, object-contain, bottom-aligned.
- Direction kicker: `.featured-border::before` bar, then `INCOMING` / `OUTGOING` / `EXTENSION` in `text-xs uppercase tracking-[var(--letter-spacing-label)] font-500 text-[var(--color-kcvv-green-dark)]`.
- Player name: `font-[var(--font-family-title)] font-700 text-5xl leading-[0.95] text-[var(--color-kcvv-gray-blue)]`.
- Age + position meta row: `text-sm uppercase tracking-[var(--letter-spacing-caps)] text-[var(--color-kcvv-gray)]`, middle-dot separator.
- From/to block: each row is a mono label (`from` / `to` / for extension `until`) in `font-[var(--font-family-mono)] text-xs uppercase text-[var(--color-kcvv-gray)]` above a club row. Club row: logo 32px square (object-contain, no background) + club name in `font-[var(--font-family-title)] font-500 text-2xl text-[var(--color-kcvv-gray-blue)]`. 1px rule in `kcvv-gray-light` between from and to rows.
- **Direction drives layout:**
  - `incoming`: from=other, to=KCVV. KCVV row gets the 2px `kcvv-green-bright` accent bar to its left (4px inset).
  - `outgoing`: from=KCVV, to=other. The KCVV row carries the accent; it's still where loyalty sits.
  - `extension`: single row only — `[logo] KCVV ELEWIJT` with `until 30 JUNI 2028` as a secondary mono line beneath. No from/to. Accent bar to the left.
- Note field: `font-[var(--font-family-title)] font-400 text-xl text-[var(--color-kcvv-gray-dark)] mt-4`, no quote glyph, no rules — it reads as a caption.
- **KCVV auto-rendered logo** always lives in whichever row represents KCVV (incoming: to; outgoing: from; extension: sole row). Identical treatment to other-club logo — no size boost, no halo.

### Overview card (compact, many per article)

```text
   +-----------------------------------------------------------+
   |  INCOMING    Naam Speler                  27 · MF         |
   |              [logo] Standard Luik  ->  [logo] KCVV        |
   +-----------------------------------------------------------+
```

Specs:

- Full body-column width (`max-w-[65ch]`), `border-t border-b border-[var(--color-kcvv-gray-light)]`, 1rem vertical padding, no side borders, no radius. Stacks flush: each subsequent card uses only `border-b` to avoid double rules.
- Left kicker column `w-[7rem]`: direction label same spec as feature but `text-xs`. For incoming/extension, kicker is `text-[var(--color-kcvv-green-dark)]`; for outgoing, `text-[var(--color-kcvv-gray)]` — outgoing is reported, not celebrated.
- Right column rows: row 1 name `font-[var(--font-family-title)] font-700 text-xl text-[var(--color-kcvv-gray-blue)]` + right-aligned age/position meta in mono small caps. Row 2 logo 20px + club name `text-base`, Lucide ArrowRight 14px in `kcvv-gray`, logo 20px + club name. Extension collapses row 2 to single club + `until 30/06/2028` in mono.
- No player cutout in overview variant. No note. If editors want prose, they use a PT paragraph between cards.

---

## 7. eventFact

Proposed fields:

```text
eventFact {
  title: string            // "Lentetornooi U13"
  date: date               // 2026-04-27
  startTime: string        // "10:00"
  endTime?: string         // "17:00"
  location: string         // "Sportpark Elewijt"
  address?: string         // "Driesstraat 14, Elewijt"
  ageGroup?: string        // "U13" — free text, not enum
  competitionTag?: string  // "Tornooi" | "Training" | "Clubfeest" etc.
  ticketUrl?: url
  ticketLabel?: string     // "Inschrijven" | "Tickets" etc.
  capacity?: number
  note?: text              // short prose
}
```

### Feature variant (first event block, full-bleed)

```text
+-------------------------------------------------------------------+
|   ---- EVENT | JEUGD                                              |
|                                                                   |
|   27                                       Lentetornooi U13       |
|   APRIL    ----------------------------                           |
|   2026     zaterdag · 10u00 - 17u00                               |
|            Sportpark Elewijt                                      |
|            Driesstraat 14, Elewijt                                |
|                                                                   |
|            Open voor spelers geboren in 2013 en 2014.             |
|                                                                   |
|            [ Inschrijven  > ]                                     |
+-------------------------------------------------------------------+
```

Specs:

- Date block left: day numeral `font-[var(--font-family-title)] font-700 text-[6rem] leading-[0.85] text-[var(--color-kcvv-gray-blue)]`, month `text-xl uppercase tracking-[var(--letter-spacing-label)] font-500 text-[var(--color-kcvv-gray-blue)]`, year in mono `text-sm text-[var(--color-kcvv-gray)]`. 1px rule in `kcvv-gray-light` to the right of the date block, spanning the column height.
- Title: `font-[var(--font-family-title)] font-700 text-4xl text-[var(--color-kcvv-gray-blue)]`.
- Metadata rows in small caps: `text-sm uppercase tracking-[var(--letter-spacing-caps)] text-[var(--color-kcvv-gray-dark)]`, middle-dot separators. Each metadata line on its own row — no pill badges.
- Note: `text-lg leading-[1.6] text-[var(--color-kcvv-gray-dark)]` body prose.
- CTA: text link, not a button. `font-[var(--font-family-title)] font-700 text-base uppercase tracking-[var(--letter-spacing-caps)] text-[var(--color-kcvv-green-dark)]`, 1px `kcvv-green-bright` underline, Lucide ArrowRight 14px trailing. Hover: underline thickens to 2px.
- Full-bleed container, content `max-w-[70rem]`, 4rem vertical padding, 1px rules top and bottom across bleed.

### Overview variant (compact, stacked)

```text
   +-----------------------------------------------------------+
   |  27 APR    Lentetornooi U13              Inschrijven >    |
   |  zaterdag  Sportpark Elewijt · U13                        |
   +-----------------------------------------------------------+
```

Specs: same top/bottom 1px-rule stack pattern as transfer overview. Left column `w-[5rem]`: `27 APR` in `font-[var(--font-family-title)] font-700 text-xl text-[var(--color-kcvv-gray-blue)]` over weekday in mono `text-xs`. Middle: title `font-[var(--font-family-title)] font-700 text-lg` over metadata line in small caps. Right: CTA link, right-aligned, same spec as feature CTA at `text-sm`.

---

## 8. Mobile philosophy

The direction is _already_ a single-column, narrow-measure design — mobile is the home viewport, not the afterthought. All full-bleed features (`key` Q&A, `transfer` feature card, `event` feature) collapse to vertical stacks with their rules re-drawn to span the new column: rules never disappear, they re-flow. Display type uses clamp() throughout so a 3rem hero on desktop becomes 2rem on a 360px screen without a breakpoint rewrite. The drop-cap stays at `text-5xl` on mobile (smaller than desktop's `text-[5.5rem]` but still recognisably a drop-cap). The one intentional mobile sacrifice: `rapid-fire` loses its two-column grid — the typographic tension of Q/A on one line disappears, but the rule-separated stack still reads as a kept-rhythm section and not a regular Q&A.

---

## 9. What I consciously rejected

- **Green fills behind headlines or hero overlays.** Would read as matchday programme, not long-read. Green stays at accent bars, drop-caps, rules, and the single Stenciletta kicker.
- **Diagonal hero cuts and gradient overlays from the existing article template.** They're a web-product motif; they fight whitespace and narrow measure. Rejecting them is the point of this direction.
- **Pills, filled badges, rounded buttons.** Kickers are small-caps text with a 4rem bar; CTAs are underlined text links. The only radius anywhere is `4px` on hero images and cream section cards — never on type containers.
- **The 15rem green `"` blockquote glyph.** Acknowledged the motif, reworked it. In a direction this restrained, an oversized colored ornament is the loudest thing on the page; rules are quieter and more magazine-correct.
- **Drop-shadows under cards in the related slider.** Shadows signal product-card affordance; cream background + hover rule handle separation without the web-y lift. `--shadow-card-hover` appears only on hover, never at rest.
- **Showing the transparent cutout in every interview surface.** Saving it for `key` Q&A spreads makes those moments land; spraying it into hero + card + pull-quote turns the signature into wallpaper.
