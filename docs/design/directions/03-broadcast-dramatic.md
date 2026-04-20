---
name: Direction 3 — Broadcast Dramatic
description: Article detail redesign exploration — cinematic, dark-dominant direction with atmospheric motion and numbers-as-drama
status: draft — brainstorming exploration, not the final design
---

# Direction 3 — Broadcast Dramatic

One of three parallel explorations for the KCVV Elewijt article-detail page redesign. See also `01-editorial-magazine.md` and `02-stadium-graphic.md`. None of these is the final spec; the approved design will be merged from the winning direction + borrowable elements.

---

## 1. The direction in 3 bullets

**Mantra:** _"The stadium goes dark, the floodlights come on, and you read."_

- **Dark is the default canvas, green is the floodlight.** `kcvv-black` (#1E2024) dominates every hero, every interview panel, every transfer card. `kcvv-green-bright` appears only where the eye needs to land — a kicker, an underline stroke, a rim-light on a player cutout. If green is everywhere it is nowhere.
- **Numbers and names scale to where they feel broadcast-sized.** Player ages, transfer years, event dates, and jersey numbers render in Quasimoda at `--font-size-6xl` or `--font-size-stat`. Body copy stays at comfortable reading sizes. Drama lives in contrast, not in everything-is-big.
- **Motion is meteorological, not choreographed.** Parallax drift, fade-ups, and a single quote-mark grow-in. All cued by scroll, all capped at 600ms, all disabled under `prefers-reduced-motion`. The page feels _atmospheric_, never _animated_.

---

## 2. Hero treatment per type

### 2.1 Interview (subject.kind='player')

```text
Desktop — 90vh, kcvv-black surface
+----------------------------------------------------------------+
|  KCVV wordmark (top-left, white 60%)        [Share] [Save]     |
|                                                                |
|                                                                |
|                                    ,,,,,,,,,                   |
|                                 ,#############,                |
|                               ,###############,    INTERVIEW   |
|                              ,#### PLAYER #####,   ---         |
|                              ##### CUTOUT #####    14 APRIL    |
|                              ##### (PNG)   ####                |
|                              ####  rim-lit  ###                |
|   "Ik voetbal nog altijd       ###############                 |
|    met schrik in de buik."      #############                  |
|                                   #########                    |
|   JEROEN                             ####                      |
|   VAN DEN BERGHE                                               |
|                                                                |
|   #9 ATTACKER                                                  |
+----------------------------------------------------------------+
 ^ bottom-aligned cutout emerges from a radial vignette
```

- Surface: `bg-[var(--color-kcvv-black)]`. Behind the cutout, a radial gradient from `rgba(74,207,82,0.12)` at the cutout's center-base fading to transparent at 60% radius. This is the rim-light.
- Cutout: `transparentImage`, object-position bottom, height `90vh`, max 720px wide, horizontally offset to the right third of the grid. Drop-shadow: `drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]`.
- Title: Quasimoda 700, `--font-size-hero` clamp(3rem,7vw,5.5rem), `--line-height-hero` 0.9, `text-[var(--color-kcvv-white)]`. Sits bottom-left, paired below a pulled-up opening quote in Quasimoda 500 at `--font-size-4xl` (1.75rem) with italic set, `--line-height-tight`.
- Kicker: top-right, `.font-mono`, `--font-size-xs`, `--letter-spacing-label`, uppercase, `text-[var(--color-kcvv-green-bright)]`. Three em-wide underline rule in `kcvv-green-bright` 2px below, built from `.featured-border::before` motif.
- Metadata row (position, jersey number): Quasimoda 500, `--font-size-sm`, `--letter-spacing-caps`, uppercase, `text-[var(--color-kcvv-gray-light)]`.
- Motion: hero image parallaxes at 0.92x scroll speed, max 80px drift. Title fades up 24px over 500ms `cubic-bezier(0.22,1,0.36,1)` on mount.

**Interview (subject.kind='staffMember' or 'custom'):** same hero frame, no cutout. Replace with a full-bleed portrait photo at 90vh, overlaid with `.editorial-card-overlay--default` (black 95%→10% bottom-to-top). Name + kicker sit bottom-left with the same type scale.

### 2.2 Announcement

```text
Desktop — 70vh, kcvv-black
+----------------------------------------------------------------+
|  KCVV wordmark                                    [Share]      |
|                                                                |
|         /full-bleed photograph, edge-to-edge/                  |
|         /overlay: kcvv-black 70% bottom -> 0% top/             |
|                                                                |
|   CLUBNIEUWS  ---  14 APRIL                                    |
|                                                                |
|   Nieuwe kunstgrasmat                                          |
|   klaar voor het                                               |
|   seizoen 2026.                                                |
|                                                                |
+----------------------------------------------------------------+
```

- Height: 70vh (less cinematic than interview; announcements are informational, not profile pieces).
- Single image, no cutout. Overlay uses `.editorial-card-overlay--default`.
- Title: Quasimoda 700, `--font-size-5xl` (2rem) on mobile scaling to `--font-size-hero` at desk. `text-[var(--color-kcvv-white)]`.
- Kicker: `.font-mono` uppercase category tag + pipe + date, `--font-size-xs`, `--letter-spacing-label`, `text-[var(--color-kcvv-green-bright)]` for the category, `text-[var(--color-kcvv-gray-light)]` for the date.

### 2.3 Transfer

```text
Desktop — 85vh, kcvv-black
+----------------------------------------------------------------+
|                                                                |
|   TRANSFER  ---  INCOMING                                      |
|                                                                |
|        ########              ----\                             |
|      ############          /      >            /``\            |
|     ### PLAYER ###        | ARROW |           |KCVV|           |
|     ### CUTOUT ###         \      /            \__/            |
|      ############           ----/                              |
|        ########         (from-club logo)  (auto KCVV logo)     |
|                                                                |
|   ROBBE JANSSENS                                               |
|                                                                |
|   24                    MIDFIELDER        FROM RC HARELBEKE    |
|   (stat size)           (caps)            (caps)               |
+----------------------------------------------------------------+
```

- Feels like a post-match lower-third frozen in place.
- Player cutout centered, 60vh tall, with a green rim-light (same radial gradient spec as interview).
- Below the cutout: a thin 1px `rgba(254,254,254,0.1)` horizontal rule spanning `max-w-[var(--max-width-inner-lg)]`, with three marks — from-logo left, a Lucide ArrowRight at 32px in `kcvv-green-bright` center, KCVV crest right. For `direction='outgoing'` the arrow flips; KCVV logo left, destination logo right. For `extension`, no arrow — replace with the Lucide RefreshCw icon and a thin green underline beneath the `until` year.
- Name: Quasimoda 700, `--font-size-hero`.
- Data column: age in `--font-size-stat` (2.5rem), position and from-club in Quasimoda 500 `--font-size-sm` `--letter-spacing-caps` uppercase. All three sit on a shared baseline grid.

### 2.4 Event

```text
Desktop — 85vh, kcvv-black with subtle gradient
+----------------------------------------------------------------+
|                                                                |
|   EVENT  ---  FIRST TEAM                                       |
|                                                                |
|             2 6                                                |
|             0 4                                                |
|             (stat x 3, Quasimoda 700)                          |
|                                                                |
|             OPENING NIGHT                                      |
|             -----                                              |
|             GEMEENTELIJK STADION ELEWIJT                       |
|                                                                |
|             [Koop tickets >]                                   |
|                                                                |
+----------------------------------------------------------------+
```

- Massive stacked date. Day and month render as two vertical numerals each (`26` / `04`), each digit at Quasimoda 700, custom inline size `6rem`, `--line-height-hero`. Positioned left third.
- Title in Quasimoda 700 `--font-size-5xl`. Venue in Quasimoda 500 `--font-size-sm` uppercase `--letter-spacing-caps`. Thin 4rem `kcvv-green-bright` underline rule between them (the `.featured-border::before` motif).
- CTA button: `bg-[var(--color-kcvv-green-bright)] text-[var(--color-kcvv-black)]`, Quasimoda 700, `--font-size-sm`, Lucide ArrowRight at 16px trailing. Hover state triggers `--shadow-green`.
- Background: very subtle linear gradient from `kcvv-black` top-left to `kcvv-dark-blue` (#1E2836) bottom-right. Atmosphere, not decoration.

### Mobile heroes (all types)

```text
+------------------+
|                  |
|  (image/cutout,  |
|   60vh)          |
|                  |
|  KICKER  ---     |
|                  |
|  Title in        |
|  Quasimoda 700   |
|  3xl (1.5rem).   |
|                  |
+------------------+
```

Heroes drop to 60vh on mobile. Cutouts still bottom-align, but capped at 50vh height so headline type has room above. Parallax disables below 768px — drift feels wrong on a phone held in-hand.

---

## 3. Metadata bar + related slider framing

Metadata (breadcrumb, date, author, share) sits **inside** the hero on dark, not in a separate white strip. Rationale: cinematic coherence. A white metadata bar below a 90vh black hero breaks the spell and feels like a news site. Keep everything on black until the body.

```text
+----------------------------------------------------------------+
|  NEWS / INTERVIEWS                       [Lucide Share2 20px]  |
|  14 APRIL 2026  ---  JEROEN AERTS                              |
+----------------------------------------------------------------+
```

- Breadcrumb: `.font-mono`, `--font-size-xs`, `--letter-spacing-label`, uppercase, `text-[var(--color-kcvv-gray-light)]`. Active crumb in `text-[var(--color-kcvv-green-bright)]`.
- Date + author row: Quasimoda 500, `--font-size-sm`. Separator is a 2ch `---` rule in `text-[var(--color-kcvv-green-bright)]`.
- Share: Lucide Share2 at 20px in `text-[var(--color-kcvv-white)]`, hover transitions fill to `kcvv-green-bright` over 150ms.

**RelatedContentSlider:** lives at page end on `kcvv-black`. Cards are 16:9 photos with the `.editorial-card-overlay--default` gradient. Between cards, 1px `rgba(254,254,254,0.1)` vertical dividers — not gutters. Each card's title in Quasimoda 700 `--font-size-xl`, bottom-aligned. On hover: card photo scales to 1.03 over 400ms `cubic-bezier(0.22,1,0.36,1)`, and a 1px `kcvv-green-bright` top border fades in. No `--shadow-card-hover` — feels too webby for this direction. Glow the edge instead with `--shadow-green` at 20% opacity.

---

## 4. Baseline body typography (announcement)

**The body goes on light.** Specifically `--color-foundation-gray-light` (#edeff4, the cream off-white). After a 70vh black hero, the reader transitions into a calm reading surface. Locking long-form text to dark is a design flex that costs legibility — Real Madrid does it for 200-word match reports, not for 800-word club announcements. The KCVV editorial voice is often long, and legibility wins.

- Surface: `bg-[var(--color-foundation-gray-light)]`, body copy `text-[var(--color-kcvv-gray-dark)]` (#292c31).
- Measure: `max-w-[var(--max-width-inner)]` (60rem) but with text column capped at `max-w-[42rem]` inside — proper reading measure.
- Paragraph: Montserrat 400, `--font-size-lg` (1.125rem), `--line-height-relaxed` 1.6. Paragraph spacing 1.5em.
- H2: Quasimoda 700, `--font-size-3xl` (1.5rem), `--line-height-snug` 1.25, `text-[var(--color-kcvv-gray-blue)]`. Preceded by a 4rem `kcvv-green-bright` 2px rule (the `.featured-border::before` motif, pulled straight from the design system).
- H3: Quasimoda 500, `--font-size-xl` (1.25rem), no underline rule.
- Lists: Montserrat 400, `--font-size-lg`. Custom bullet replaced by a `kcvv-green-bright` square 6px marker, 1.25rem indent.
- **Blockquote:** honor the 15rem `"` glyph from `.prose blockquote::before`, but tint it `rgba(74,207,82,0.18)` instead of solid green. Quote text in Quasimoda 500 italic, `--font-size-2xl` (1.375rem), `text-[var(--color-kcvv-gray-blue)]`. The oversized glyph stays as sculpted ghost-mark, not shouting mark. This is the one moment where the light body borrows the cinematic vocabulary.
- Inline links: `text-[var(--color-kcvv-green-dark)]` (#008755 — the deep brand green reads better on cream than the bright green), underlined 1px, offset 3px. Hover lifts underline to 2px.

---

## 5. qaBlock — all four tag treatments

The qaBlock sits on a dark surface regardless of article type body. Interview articles stay dark body top-to-bottom — interviews are a cinematic exception to the "body on light" rule because they are profile pieces, not long-form. The reader is watching a conversation, not reading a press release.

Surface: `bg-[var(--color-kcvv-black)]`, body in `text-[var(--color-kcvv-white)]`.

### 5.1 `standard`

```text
Q:  Hoe voelde je eerste wedstrijd?
    (Montserrat 500, kcvv-gray-light, sm, caps-label)

    Ik voelde me klaar. Twee jaar in de A-kern
    wachten op een kans, en dan begint het
    echt. Adrenaline, daarna rust.
    (Montserrat 400, white, lg, relaxed)
```

- Q-label: "Q:" prefix, `.font-mono`, `--font-size-xs`, `--letter-spacing-label`, `text-[var(--color-kcvv-green-bright)]`. Question text in Montserrat 500 `--font-size-base`, `text-[var(--color-kcvv-gray-light)]`.
- Answer: Montserrat 400, `--font-size-lg`, `--line-height-relaxed`, white. Left-aligned, no indent.
- Spacing: 2rem between Q and A, 3rem between Q&A pairs.

### 5.2 `key` (promoted pull-quote — inline highlight)

Inline in the flow, but the answer is promoted to Quasimoda 500 italic, `--font-size-3xl`, `--line-height-snug`. Behind the text, a soft radial `rgba(74,207,82,0.15)` glow, 120px radius, centered on the text block (CSS radial gradient, not an image). Below the answer: a single thin 2px `kcvv-green-bright` underline stroke, 4rem wide, left-aligned. No cream box, no diagonal.

Motion: the glow fades in from 0 to 0.15 opacity over 600ms on scroll-enter. `prefers-reduced-motion`: glow renders at final state immediately.

### 5.3 `quote` (standalone dramatic)

Full-bleed `.full-bleed` black panel. Question hidden entirely.

```text
+================================================================+
|                                                                |
|      "                                                         |
|     (15rem Quasimoda, kcvv-green-bright at 25% opacity,        |
|      pulled -6.5rem left following .prose blockquote::before   |
|      motif)                                                    |
|                                                                |
|   Ik voetbal nog altijd met schrik                             |
|   in de buik. Dat is het enige                                 |
|   wat mij scherp houdt.                                        |
|   (Quasimoda 500, 4xl/1.75rem desk, 2xl mobile, white)         |
|                                                                |
|   ---  JEROEN VAN DEN BERGHE, #9                               |
|        (font-mono, xs, letter-spacing-label, gray-light)       |
|                                                                |
+================================================================+
```

- Vertical padding 6rem desk, 3rem mobile.
- Attribution pulls from `subject` autofill (name + jerseyNumber for player kind, role for staff, free-form for custom).
- Motion: the `"` glyph scales from 0.6 to 1.0 over 700ms `cubic-bezier(0.22,1,0.36,1)` and fades in opacity 0 → 0.25 on scroll-enter. Reduced-motion: renders at final state.

### 5.4 `rapid-fire`

A contiguous run of consecutive `rapid-fire`-tagged pairs collapses into a single two-column block.

```text
+----------------------------+----------------------------+
|  Favoriete spits?          |  Beste moment?             |
|  (mono, xs, gray-light)    |  (mono, xs, gray-light)    |
|  Lewandowski.              |  Titelviering 2019.        |
|  (Quasimoda 500, xl)       |  (Quasimoda 500, xl)       |
+----------------------------+----------------------------+
|  Pre-match ritueel?        |  Laatste nummer gehoord?   |
|  ...                       |  ...                       |
+----------------------------+----------------------------+
```

- Grid: `grid-cols-2` desktop, `grid-cols-1` mobile.
- 1px `rgba(254,254,254,0.1)` dividers between rows and columns.
- Questions in `.font-mono`, `--font-size-xs`, `--letter-spacing-label`, `text-[var(--color-kcvv-gray-light)]`.
- Answers in Quasimoda 500, `--font-size-xl`, `text-[var(--color-kcvv-white)]`.
- Cell padding 1.5rem.

**Subject cutout in qaBlock:** if `subject.kind='player'`, the transparentImage anchors bottom-right of the first qaBlock as a "watching presence" — 40vh, 25% opacity, behind a radial black gradient so text readability is preserved. Disappears on mobile (too cluttered).

---

## 6. transferFact — feature + overview

### 6.1 Feature (first block, single-transfer article)

The post-match lower-third frozen in place. Already specified as the transfer hero in section 2.3 — the feature card _is_ the hero treatment for `articleType='transfer'`. No separate feature card below; the hero carries the full broadcast graphic.

If the article has a transfer-type but also has ambient body copy before the transferFact, the feature card renders inside the body as a `.full-bleed` black panel following the same layout as 2.3, minus the top wordmark/share chrome.

### 6.2 Overview (compact, stackable)

```text
+------------------------------------------------------------+
|  ##                                                        |
|  ####   NAAM VAN SPELER          24   MIDFIELDER   ->      |
|  ####   (Quasimoda 700, xl)    (stat) (caps, sm)  (arrow)  |
|  ##                                                        |
|  (40px cutout or photo circle)                             |
|                                                            |
|  FROM RC HARELBEKE           (mono, xs, kcvv-green-bright) |
+------------------------------------------------------------+
```

- `bg-[var(--color-kcvv-black)]`, 1rem padding, 1px `rgba(254,254,254,0.1)` bottom border. Stacks vertically. No card radii — flat panels.
- Left: 56px circular crop of `playerPhoto` (or cutout if present). A 2px `kcvv-green-bright` ring for `direction='incoming'`, `kcvv-alert` (#cc4b37) for `outgoing`, `kcvv-warning` (#ffae00) for `extension`. This is the only place semantic colors appear.
- Name: Quasimoda 700, `--font-size-xl`, white.
- Age: Quasimoda 700, `--font-size-stat` (2.5rem), `text-[var(--color-kcvv-green-bright)]`. Huge on purpose — overview rows stack 20 at a time and the age number is the visual rhythm.
- Position: Quasimoda 500, `--font-size-sm`, uppercase, `--letter-spacing-caps`, gray-light.
- Arrow: Lucide ArrowRight at 20px, gray-light, hover to green-bright.
- Bottom line: `.font-mono`, `--font-size-xs`, `--letter-spacing-label`, uppercase. `FROM [club]`, `TO [club]`, or `UNTIL 2028`.

---

## 7. eventFact — proposed fields + variants

**Proposed fields:** `title` (string), `date` (datetime), `endDate` (datetime, optional — for multi-day), `location` (object: venueName, city, optional mapLink), `ticketUrl` (url, optional), `signupUrl` (url, optional), `ageGroup` (enum: first-team / reserves / youth-bovenbouw / youth-middenbouw / youth-onderbouw / all), `competitionTag` (string, optional — e.g. "Beker van België"), `note` (optional portable text block for one-paragraph detail), `coverImage` (optional image).

### 7.1 Feature (hero in section 2.4 + first in-body block)

As specified. Movie-poster countdown logic: if the event is ≤7 days away, a small `.font-mono` kicker above the date reads `IN 3 DAGEN` in `kcvv-green-bright`. If in the past, the kicker reads `ARCHIEF` in `kcvv-gray-light`. This is static text rendered server-side from the published date relative to now — no countdown timer animation.

### 7.2 Overview (stackable)

```text
+------------------------------------------------------------+
|   26   OPENING NIGHT                          [Tickets >]  |
|   04   Gemeentelijk Stadion Elewijt                        |
|        FIRST TEAM  ---  BEKER VAN BELGIE                   |
+------------------------------------------------------------+
```

- `bg-[var(--color-kcvv-black)]`, 1.25rem padding.
- Date: stacked day/month at Quasimoda 700, `--font-size-4xl` (1.75rem), `--line-height-hero`. Left-aligned, fixed 64px column.
- Title: Quasimoda 700, `--font-size-xl`, white.
- Venue: Montserrat 400, `--font-size-base`, gray-light.
- Kicker: ageGroup + competitionTag, `.font-mono`, `--font-size-xs`, `--letter-spacing-label`, green-bright.
- CTA on the right: text-only link, `text-[var(--color-kcvv-green-bright)]`, Quasimoda 500, `--font-size-sm`, Lucide ArrowRight at 14px trailing.

---

## 8. Mobile philosophy

Cinematic on phone is a lie if you chase full-bleed spectacle — viewport heights at 60vh on a 6.1-inch screen render as crammed. The move is to **preserve the vocabulary (black surfaces, green highlights, Quasimoda drama) but shrink the drama to fit the frame.** Heroes drop from 90vh to 60vh. Parallax disables below 768px. Cutouts cap at 50vh to leave headline room. Two-column rapid-fire collapses to single column. The transfer feature card flips from horizontal lower-third to vertical stack: cutout top, name-age-position as a data block center, from-logo-arrow-to-logo as a horizontal strip beneath, all within a single `.full-bleed` panel. The body-on-light rule survives: announcements still transition to cream after the hero. What the reader loses in raw spectacle they gain in pacing — the vertical scroll becomes the cinema, each panel a cut.

---

## 9. What I consciously rejected

- **Diagonal cuts, angled section dividers, hex-pattern overlays.** Those are the Stadium Graphic direction's territory. Broadcast Dramatic uses atmospheric gradients, vignettes, and thin rules. Decorative chrome reads as "sports marketing," not "documentary."
- **Green as a background color.** No green panels, no green hero wash, no green callout boxes. Green is rim-light, underline, kicker, link — a highlight element. Painting surfaces green collapses the contrast that makes the direction work.
- **Rounded cards and drop shadows on content.** `--shadow-card-hover` is too webby for this direction. Flat panels with 1px hairlines and halo glows carry more weight.
- **Cream pull-quote boxes with decorative quote marks as punctuation.** The `key` treatment was tempting to render as a warm cream callout — that is a magazine move, not a broadcast move. The thin green underline + halo glow keeps it elite.
- **Countdown timers and animated tickers on event cards.** Movie-poster countdown means static typography that _feels_ tense, not a live ticking display. The KCVV site is not a streaming service interface. Restraint over spectacle, always.
