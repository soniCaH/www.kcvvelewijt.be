---
name: Direction 2 — Stadium Graphic
description: Article detail redesign exploration — bold, angular, diagonal-cut direction with broadcast-intensity typography and four structural surfaces
status: draft — brainstorming exploration, not the final design
---

# Direction 2 — Stadium Graphic

One of three parallel explorations for the KCVV Elewijt article-detail page redesign. See also `01-editorial-magazine.md` and `03-broadcast-dramatic.md`. None of these is the final spec; the approved design will be merged from the winning direction + borrowable elements.

---

## 1. The direction in 3 bullets

**Mantra: "Print the matchday program at broadcast resolution."** Every article reads like a TV lower-third froze mid-broadcast and got pasted into a stadium program. It is loud, angular, mechanically confident, and it never apologizes for taking the whole screen.

Three rules that keep it coherent:

1. **One angle, everywhere: 7°.** Every diagonal cut, gradient seam, clip-path slash, and arrow chevron uses exactly `polygon()` with a 7° rake. 7° is steep enough to register as intentional on mobile (where a 4–6° cut flattens visually) but shallow enough that body copy within clipped sections still reads without the eye fighting the edge. Six is too polite, ten feels like a sports-bar menu. Seven is the KCVV rake.
2. **Four surfaces, hard cuts, no gradients between them.** `kcvv-black` (#1E2024), `kcvv-green-bright` (#4acf52), `kcvv-green-dark` (#008755), `kcvv-white` (#fefefe). These are the only structural backgrounds. Rhythm comes from alternating them with 7° seams. `foundation-gray-light` only appears as a tertiary rest surface inside long-form prose. No soft gradients except the existing editorial-card-overlay black→transparent and the already-shipped diagonal hero gradient, both of which we keep.
3. **Type is the stadium PA system.** Quasimoda 700 uppercase with `--letter-spacing-label` for every functional label. Stenciletta (`.font-alt`) for three and only three moments: transfer direction verbs, event date blocks, and the rapid-fire section header. If it is used anywhere else, it stops meaning anything.

---

## 2. Hero treatment per type

All heroes share a full-bleed 90rem outer width and a 7° bottom seam (`clip-path: polygon(0 0, 100% 0, 100% calc(100% - 4rem), 0 100%)`). Below the seam sits a 3px `kcvv-green-bright` accent line with `--shadow-green` glow. The existing article hero already does a shallow version of this; we commit.

### interview — desktop

```text
+------------------------------------------------------------------+
| [kcvv-black full bleed, 7deg bottom cut]                         |
|                                                                  |
|  INTERVIEW . 19 APR 2026 . LEES 6 MIN       [share row, right]   |
|  ----                                                            |
|                                                       +--------+ |
|  "IK SPEEL VOOR                                       |        | |
|   DEZE SHIRT, NIET                                    | PLAYER | |
|   VOOR DE STATS."                                     | CUTOUT | |
|                                                       |  PNG   | |
|  [Quasimoda 700, hero clamp, white, line-height 0.9]  |        | |
|                                                       |  half- | |
|  MET JONAS PEETERS, #9, AANVALLER                     |  bleed | |
|  [Quasimoda 500, sm, green-bright, label tracking]    |        | |
|                                                       +--------+ |
|================= 3px green-bright glow line =====================|
+------------------------------------------------------------------+
 ^ bottom-aligned cutout emerges from a radial vignette
```

The `subject.transparentImage` sits right-aligned, `object-position: bottom right`, scaled to 120% of its container so the player's head clears the 7° seam and the feet crop cleanly at the green line. Background behind the cutout stays flat `kcvv-black` — no drop shadow, no vignette. The cutout is the silhouette; flat black is the stadium tunnel.

Hero title uses the existing `hero` font size (`clamp(3rem, 7vw, 5.5rem)`), `font-[var(--font-family-title)]`, weight 700, `line-height: var(--line-height-hero)` (0.9), color `kcvv-white`. A real statement title will wrap to three lines — that is desired. The subject kicker below uses `text-sm`, `tracking-[var(--letter-spacing-label)]`, `text-[var(--color-kcvv-green-bright)]`. If `subject.kind='custom'`, no cutout, title widens to full column, featured-border green bar sits under the kicker.

### interview — mobile

```text
+--------------------------+
| [black, 7deg bottom]     |
|                          |
|   INTERVIEW . 19 APR     |
|   ---                    |
|       +------------+     |
|       |  CUTOUT    |     |
|       |  centered  |     |
|       |  top       |     |
|       +------------+     |
|                          |
|  "IK SPEEL VOOR          |
|   DEZE SHIRT."           |
|                          |
|  #9 . JONAS PEETERS      |
|==== green line ==========|
+--------------------------+
```

Mobile moves the cutout _above_ the title, centered, height ~45vh, then the title slams in underneath at `text-5xl`. The hero reads as a trading card, which is exactly right for the format.

### announcement — desktop

No cutout. The 7° cut black hero stays, the kicker reads `MEDEDELING`, the title gets full column width up to `inner-lg` (70rem), and a 4rem green `featured-border` accent bar sits 1.5rem above the kicker. No image unless the article has a `mainImage`, in which case the image replaces the flat black and the existing left-92%-to-right-10% diagonal gradient overlay stays (this is our one gradient exception and it is already in production).

### transfer — desktop

```text
+------------------------------------------------------------------+
| [left half: neutral dark from other club's jersey - we compute    |
|  from otherClubLogo's dominant via Sanity hotspot or fallback to  |
|  kcvv-gray-blue #31404b]  |  [right half: kcvv-green-bright]      |
|                           /                                       |
|   TRANSFER . INKOMEND    /   JONAS PEETERS                        |
|                         /                                         |
|            +-----------/----------+                               |
|            |          /           |                               |
|            |     PLAYER CUTOUT    |                               |
|            |    (breaks seam)     |                               |
|            |          /           |                               |
|            +-----------/----------+                               |
|     [OTHER CLUB LOGO] /   [KCVV LOGO]                             |
|          KFC XYZ      /   KCVV ELEWIJT                            |
|                      /                                            |
|====================/=============================================|
+------------------------------------------------------------------+
```

Hero is the feature `transferFact` promoted. The 7° seam is vertical-ish here (runs top-right to bottom-left, `clip-path` on each half). `direction='incoming'` puts other club left, KCVV right, cutout breaks the seam L→R. `direction='outgoing'` mirrors it. `direction='extension'` drops the split entirely — full `kcvv-green-bright` background, cutout center, title replaced by Stenciletta "VERLENGD TOT [until-year]".

The word **INKOMEND / UITGAAND / VERLENGD** sits top-left in Stenciletta `font-alt`, `text-4xl`, `tracking-[var(--letter-spacing-caps)]`, `kcvv-white`. Player name below in Quasimoda 700 uppercase, `text-6xl`. Metadata strip at the bottom inside a black 7°-cut band: position, age, number — pipe-separated, Quasimoda 500 `text-sm` uppercase, tracking `--letter-spacing-label`.

### event — desktop

```text
+------------------------------------------------------------------+
| [kcvv-green-dark full bleed, 7deg bottom]                         |
|                                                                   |
|  EVENEMENT . JEUGD U15                                            |
|  ---                                                              |
|                                                                   |
|   ZA 27                  ZOMERSTAGE                               |
|   JUN             x      KCVV ELEWIJT                             |
|   2026                   SPORTCENTRUM HEIDE                       |
|                                                                   |
|  [Stenciletta date block]  [Quasimoda 700 title]                  |
|                                                                   |
|  [>>] SCHRIJF JE IN   (angular arrow CTA, green-bright on white)  |
|===================================================================|
+------------------------------------------------------------------+
```

Event hero lives on `kcvv-green-dark` so it is visually distinct from interviews (black) and transfers (split). Proposed `eventFact` fields: `title`, `startDate`, `endDate?`, `location` (name + optional address), `ageGroup?` (`U7`–`U21`, `Senioren`, `Allen`), `competitionTag?` (e.g. "Beker", "Jeugdtornooi"), `ctaLabel`, `ctaUrl`, `capacity?`, `priceLabel?` (free text: "Gratis", "€10 p.p.", "Vooraf reserveren").

Mobile event hero stacks: kicker, then the Stenciletta date block full width, then title, then CTA button full-width bottom.

---

## 3. Metadata bar + related slider framing

The metadata strip sits **inside** the black hero, top row, above the title: `kicker . date . readTime` on the left, share icons right (Lucide `Share2`, `Facebook`, `Twitter` at 20px, `kcvv-green-bright`). Author and breadcrumb move _below_ the hero, on a thin `foundation-gray-light` band that runs full-bleed and has its own 7° top seam echoing the hero's bottom seam — the two seams are parallel, creating a 4rem parallelogram of cream between hero and body. This is where breadcrumb (`Home > Nieuws > Interviews`) sits in Quasimoda 500 `text-sm` uppercase tracking labels, and the byline sits right-aligned: small round author photo + "DOOR KEVIN V.R." in same treatment.

**RelatedContentSlider** lives on `kcvv-black` full-bleed, with its own 7° top cut. Section header in Stenciletta is _rejected_ — Stenciletta is reserved. Header uses Quasimoda 700 uppercase `text-4xl` white with a `featured-border` green bar. Cards are angular: `border-radius: var(--radius-card)` (4px) stays, but each card has a 7° clipped top-right corner via `clip-path: polygon(0 0, calc(100% - 2rem) 0, 100% 2rem, 100% 100%, 0 100%)` — a single chamfer, not a full diagonal, so the card still reads as a card. Hover scales to 1.02 and pulls in `--shadow-green`. Category badge on the card uses the existing green/black uppercase treatment, pinned to the clipped corner.

---

## 4. Baseline body typography (announcement)

Body measure: `max-w-[60rem]` (inner), centered, mobile padding .75rem, desktop 2.5rem. Prose base size **1.125rem** (`text-lg`) on desktop, 1rem on mobile. Line height `--line-height-relaxed` (1.6) for paragraphs, `--line-height-snug` (1.25) for headings. Body font Montserrat 400, color `--color-kcvv-gray-dark` (#292c31). Paragraph spacing 1.25rem between paragraphs, no first-line indent.

**Headings inside prose:**

- `h2`: Quasimoda 700, `text-4xl` (1.75rem), uppercase, `tracking-[var(--letter-spacing-caps)]`, `kcvv-gray-blue`. Preceded by a 4rem × 2px `kcvv-green-bright` accent bar (reuse `.featured-border::before`) with 1rem gap. 3rem top margin, .75rem bottom.
- `h3`: Quasimoda 500, `text-2xl` (1.375rem), sentence case, `kcvv-gray-blue`. No accent bar. 2rem top margin.

**Blockquote: keep the 15rem `"` glyph, but shift it.** The existing `.prose blockquote::before` motif is strong and on-brand. Our one change: the quote sits inside a full-bleed `foundation-gray-light` band with a 7° top and bottom seam, breaking the 60rem measure. Inside that band the quote goes back to 60rem, the 15rem green `"` glyph stays top-left at `-6.5rem`, quote text is Quasimoda 500 `text-3xl` (1.5rem), italic removed, color `kcvv-gray-blue`, line-height 1.25. Attribution below in Montserrat 500 `text-sm` uppercase tracking labels, prefixed by an em-rule `——` rendered as a 2rem × 2px green bar (not an em-dash character). This is the argument for reworking rather than honoring blindly: the glyph stays, the typographic frame gets upgraded to stadium-graphic rhythm.

**Lists:** unordered list markers replaced with a 0.5rem × 2px `kcvv-green-bright` bar positioned at `::marker`. Ordered lists use Quasimoda 700 numerals in `kcvv-green-bright`. List item spacing .5rem.

**How does the direction hold up on pure prose?** It works because the hero, the metadata parallelogram, the h2 accent bars, the full-bleed blockquote band, and the related slider all inject angular moments into an otherwise quiet body. The 60rem measure is classically editorial; the surrounding architecture is stadium. Stadium Graphic is not about making paragraphs loud, it is about making the frame loud so paragraphs feel like locker-room intel.

---

## 5. qaBlock — four tag treatments

### standard

```text
  V  WAT IS JE MOOISTE HERINNERING BIJ KCVV?
     [green-bright Q glyph, Quasimoda 700 question uppercase]

     De promotie vorig seizoen. We speelden thuis,
     de tribunes zaten vol, en na het laatste fluitsignaal...
     [Montserrat 400, text-lg, gray-dark, 1.6 lh]
```

The `V` is not a letter — it is a Lucide `ChevronRight` rotated 90° downward, 24px, `kcvv-green-bright`, marking the question. Question in Quasimoda 700 uppercase `text-xl` `kcvv-gray-blue`, tracking `--letter-spacing-caps`. Answer in Montserrat 400 `text-lg`. 2rem vertical spacing between pairs. 1.5rem between Q and A.

### key (promoted pull-quote)

Question still visible, but answer gets promoted. Full-bleed `foundation-gray-light` band with 7° top/bottom seams. Inside, two-column desktop grid: left column (40%) holds the question in Quasimoda 700 `text-3xl` uppercase `kcvv-gray-blue` plus a 4rem green accent bar above it. Right column (60%) holds the answer in Quasimoda 500 `text-2xl` (1.375rem), `line-height: 1.25`, `kcvv-gray-dark`. Mobile: stacks, question on top, answer below, same typography scaled one step down.

### quote — the peak moment

```text
+------------------------------------------------------------------+
| [kcvv-green-bright full bleed, 7deg top cut]                     |
|                                                                  |
|  "                                                               |
|   [15rem Quasimoda 700 white open-quote, top-left, -4rem offset] |
|                                                                  |
|            IK WIL HIER                                           |
|            KAMPIOEN                                              |
|            WORDEN. PUNT.                                         |
|                                                                  |
|  [Quasimoda 700, text-6xl (3rem), white, line-height 0.9,        |
|   uppercase, centered vertically, left-aligned text]             |
|                                                                  |
|                                          — JONAS PEETERS, #9     |
|                                   [Quasimoda 500 sm uppercase,   |
|                                    kcvv-black, tracking label,   |
|                                    prefixed by 2rem green-dark   |
|                                    rule not em-dash]             |
|                                                                  |
| [7deg bottom cut]                                                |
+------------------------------------------------------------------+
```

Question is **hidden** per spec. Full-bleed, both seams angled, `kcvv-green-bright` background. Oversized white `"` watermark behind, 15rem, Quasimoda 700, `kcvv-white` at 100% opacity (not a tint — this is the TV graphic moment, commit). Quote text `text-6xl` (3rem) desktop, `text-4xl` mobile. Attribution bottom-right, Quasimoda 500 `text-sm` uppercase `kcvv-black`. Mobile: seam angle stays 7°, quote wraps naturally, watermark glyph scales to 10rem and anchors top-left at `-2rem`.

If the article has a `subject.kind='player'`, the `transparentImage` appears bottom-right at 60% container height, `object-position: bottom right`, behind the attribution, acting as a silhouette. This is the moment the cutout earns its keep.

### rapid-fire (sneltreinronde)

```text
  SNELTREINRONDE
  [Stenciletta font-alt, text-4xl, kcvv-black on green-bright
   full-bleed band with 7deg cuts, 4rem vertical padding]

  KOFFIE OF THEE?              SAMBA OF TECHNO?
  Koffie. Altijd.              Techno, in de auto.

  BESTE MAATJE IN DE KLEEDKAMER?   LAATSTE SERIE DIE JE KEEK?
  Timo. Hij zeurt nooit.            Adolescence. Zwaar.

  [Two-col grid desk, single-col mobile. Q in Quasimoda 700 sm
   uppercase kcvv-green-dark tracking label. A in Montserrat 500
   text-base kcvv-gray-dark. 1rem gap between Q and A.
   1.5rem gap between pairs. Column gap 3rem.]
```

Rapid-fire is a whole section, not a per-pair treatment — when an editor tags items `rapid-fire`, the renderer groups consecutive rapid-fire pairs into one block with the Stenciletta header, then breaks back to standard treatment when the tag changes. This is the second of three Stenciletta uses.

---

## 6. transferFact — feature + overview

### feature (already shown as hero in §2)

Recap of the mechanics: 7° vertical-ish seam splits the card into two color fields driven by `direction`. Cutout breaks the seam. Direction verb in Stenciletta top-left (third and final Stenciletta use: **VERLENGD / INKOMEND / UITGAAND**). Player name huge Quasimoda uppercase. Logos sit mid-height: other club logo inside the left field, KCVV logo (auto-rendered) inside the right field, both at 3.5rem height, white or black monochrome depending on field luminance. Metadata strip (position, age, note) is a thin `kcvv-black` band with 7° cuts top and bottom running under the main card. For `direction='extension'`, the seam collapses, the whole card becomes `kcvv-green-bright`, and the Stenciletta reads `VERLENGD TOT [until]` where `[until]` is the year in `text-6xl` — the until year becomes the graphic.

### overview

```text
+------------------------------------------------------------------+
| [white, 4px border-left kcvv-green-bright, 7deg clipped top-right|
|  corner only - the single chamfer we used on related cards]      |
|                                                                  |
| [cutout 6rem | JONAS PEETERS              INKOMEND  >            |
|   thumb]     | Aanvaller . 24 . van KFC XYZ          [arrow]     |
|                                                                  |
+------------------------------------------------------------------+
```

Stackable, 6rem tall, single chamfer. Cutout thumbnail (same `transparentImage`, rectangular, `object-fit: cover`, `object-position: top`) on the left. Name in Quasimoda 700 uppercase `text-lg` `kcvv-gray-blue`. Metadata row in Montserrat 500 `text-sm` `kcvv-gray`. Direction pill right-aligned: `INKOMEND` in Quasimoda 700 `text-xs` uppercase `kcvv-white` on `kcvv-green-bright` pill, 4px radius, no chamfer (too small to bear it). `UITGAAND` same pill but `kcvv-alert` (#cc4b37) background — we lean on the one semantic color that earns its place. `VERLENGD` gets `kcvv-green-dark`. Lucide `ArrowRight` 20px `kcvv-green-bright` at far right. Hover state: `--shadow-card-hover` plus 2px left border thickens to 4px.

---

## 7. eventFact

Fields (as proposed in §2): `title`, `startDate`, `endDate?`, `location` (name + address?), `ageGroup?`, `competitionTag?`, `ctaLabel`, `ctaUrl`, `capacity?`, `priceLabel?`.

### feature (hero-promoted, one event article)

Already described in §2 hero: `kcvv-green-dark` surface, Stenciletta date block (day number `text-6xl`, month abbreviation `text-2xl`, year `text-lg`, stacked, left-aligned, white), separator rule 2px × 4rem green-bright vertical, then title + location + ageGroup stack. CTA is an angular arrow button: `kcvv-white` background, `kcvv-green-dark` text Quasimoda 700 uppercase `text-sm` tracking label, right edge clipped to a 7° chevron point using `clip-path: polygon(0 0, calc(100% - 1.5rem) 0, 100% 50%, calc(100% - 1.5rem) 100%, 0 100%)`. Lucide `ArrowRight` 20px inside the chevron. This is the "angular arrow button" motif and it is reused for all CTAs site-wide on article pages.

### overview (stackable, multiple events)

```text
+------------------------------------------------------------------+
| [foundation-gray-light, 4px left border kcvv-green-dark]         |
|                                                                  |
| ZA 27  |  ZOMERSTAGE U15                                         |
| JUN    |  Sportcentrum Heide . 09:00 - 16:00                     |
| 2026   |  Gratis voor leden                                      |
|        |                                    [INSCHRIJVEN >]      |
+------------------------------------------------------------------+
```

Date block left, Stenciletta, `kcvv-green-dark` text, 8rem fixed width with 2px right border `kcvv-green-bright`. Content right: title Quasimoda 700 uppercase `text-lg` `kcvv-gray-blue`, meta Montserrat 500 `text-sm` `kcvv-gray`, priceLabel optional row. CTA bottom-right, same chevron-button motif scaled down to `text-xs`. If `ageGroup` is set, a small pill above the title: `U15` in Quasimoda 700 `text-xs` green-bright on black, 4px radius.

---

## 8. Mobile philosophy

Stadium Graphic is **stronger on mobile than desktop**, and it should be. On a 1440px monitor every site can look impressive — the real test is a phone in a cold stand during a youth match. On mobile we keep the 7° cuts at full steepness (a 4° cut on a 390px screen is invisible), we keep the full-bleed color blocks (on mobile, full-bleed _is_ the layout — there is no sidebar to fight), and we keep the hero cutout but move it above the title so the silhouette reads like a trading card. Typography scales down by one step per level but the _relationships_ stay constant: hero remains the largest thing on screen by a factor of 3+, kickers stay tiny and letter-spaced, body stays `text-base` not `text-sm`. Touch targets are minimum 48px; the chevron CTA buttons get a comfortable 52px tall. The qaBlock `quote` treatment on mobile is arguably the peak of the whole system — a 390px screen filled with `kcvv-green-bright`, a diagonal cut, and a 2rem Quasimoda pull-quote reads like a match-day Instagram Story, which is exactly where our readers live.

---

## 9. What I consciously rejected

- **Rounded corners beyond 4px.** A 12px or 16px radius would instantly read "SaaS marketing site." The single chamfer (7° clipped corner) replaces radius as the card-shaping tool. Default radius stays at the token-defined 4px; never larger.
- **Soft shadows and blurs.** `--shadow-card-hover` is permitted because it already exists and pairs with motion; `--shadow-green` earns its glow. No drop shadows on hero type, no backdrop-blur, no frosted glass. Stadium graphics do not blur.
- **`foundation-gray-light` as a primary surface.** It is a _rest_ surface for long-form prose and blockquote bands. If we let it become structural, the whole system drifts toward magazine softness and loses the broadcast quality.
- **Italics and serif accents.** The instinct to set blockquotes in italic or reach for a serif display face would read as "editorial." We are not editorial, we are broadcast. All italics are removed from prose; emphasis is Quasimoda 700 uppercase or a green accent bar.
- **Using Stenciletta anywhere other than the three declared moments** (transfer direction verb, event date block, rapid-fire header). The stencil face is load-bearing exactly because it is rare. Letting it leak into section headers or CTAs would turn it into wallpaper and cost us the "stadium banner" reflex it is supposed to trigger.
