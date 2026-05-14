# KCVV Elewijt — Homepage Design Refinement

## Context

This prompt refines the existing homepage to bring it closer to the editorial/fanzine design language of the mockup, while respecting our Sanity CMS data constraints. The current implementation is functionally correct but visually generic compared to the mockup — same color palette, but uniform cards, photo-overlay aesthetic, and missing decorative patterns and variant-driven treatment.

Reference images (in repo / available alongside this prompt):

- `Untitled_Panorama-1.jpg` — target visual language (mockup)
- `full_fanzine.jpeg` — current implementation (what to refine)

The panorama is a design mockup, not a content spec. Some content shown in it (match previews, match reports, illustration fallbacks instead of real photos) does NOT apply — see "What NOT to do" at the end.

**Normative vs illustrative.** When the rest of this document (or any later instruction) says "compare visually against the panorama", match only the **normative** aspects below, not the content instances:

- _Normative (match these):_ visual treatment, layout/composition, typography, color palette, decorative patterns (washi tape, diagonal/horizontal stripes), spacing rhythm, card variants and their bg/accent rules.
- _Illustrative (ignore these):_ specific article subjects, match preview / match report content, illustration fallbacks used in place of real photos, any other concrete example content referenced under "What NOT to do".

When a section of this doc tells you to "compare against the panorama", read it as "compare against the normative visual aspects above" — not the example content rendered into the mockup.

## Visual Direction

The site should read as an editorial/fanzine, not a generic amateur-football website. Distinctive elements:

- Italic serif headlines with period punctuation ("Laatste _nieuws_.", "De toekomst van _Elewijt_.")
- Washi tape decorations on cards and hero
- Multiple card backgrounds (cream, green, accented) driven by article type
- Two repeated decorative patterns: **diagonal green-on-green stripes** (youth + clubshop) and **horizontal dark stripes** (specific news card accents)
- Strong contrast between editorial flair and clean grid layout

The page is cream-dominant. Dark/green moments are: the youth section, the (relocated) Brandsfit clubshop section, and the footer.

## Design System

### Decorative Patterns

**Diagonal stripe band** — used at the top of the youth section, and top + bottom of the Brandsfit clubshop section.

- Repeating linear-gradient
- Alternating `green` and `light-green` (or a `dark-green` / `green` pair for stronger contrast against dark backgrounds)
- ~20px diagonal stripes at 45°
- Section width (full bleed), ~24px tall

**Horizontal stripe pattern** — used as a meta-panel accent on specific news cards (jeugd-milestone, column subcategories).

- Subtle repeating horizontal dark stripes
- Applied to the card's meta panel below the photo, not the whole card background

**Washi tape stickers**

- Already exists in the implementation. Use multiple "colors" (warm orange, green, cream) for variety across cards.
- Tape can carry text labels (e.g. "INTERVIEW", "TRANSFER", "EVENT", "AANKONDIGING", "OFFICIEEL").

### Typography Rules

- Display / section headers: italic serif (existing). When used as a section title, append a period: "Laatste _nieuws_.", "Onze _clubkledij_.", "De toekomst van _Elewijt_."
- Italic-serif treatment of "Elewijt" applies wherever the club name appears in **display typography** (logo, large headlines). NOT in inline body copy.
- Tags / eyebrows: small, tracked, all-caps, sans-serif.

### Date Format (standardise everywhere)

- `Do 14 mei · 18:00` — title-case day abbreviation, middle-dot separator, 24h time.
- Apply consistently: match strip, news cards, schedule rows, event listings, etc.

### Standard Card Anatomy

Every news/article card includes:

- Landscape hero image (full-bleed within the card, at the top)
- Headline in serif
- Meta row: tag chip + date
- Washi tape decoration
- Variant-driven background and accents (see Laatste Nieuws spec below)

## Section-by-Section Specs

### 1. Top Navigation Bar

- **Background**: cream — KEEP (do not change to dark)
- **Active link color**: dark green
- **Inactive link color**: black
- **"Word lid" button**: outlined (green border, green text, transparent fill) — NOT a solid pill
- **Logo lockup**: "KCVV" + italic-serif "Elewijt" — keep current

### 2. Match Info Strip

- **Layout**: single inline tag + datetime (panorama-style), NOT label/value stacks
- **Tag**: just `COMPETITIE` / `BEKER` / `TORNOOI` as a single inline tag — no sub-label below it
- **Datetime**: `Do 14 mei · 18:00` (standard format)
- **CTA**: always `Wedstrijddetails →` (the club doesn't sell tickets — never use "Tickets")
- **Data**: single next match across all teams
- **Hidden state**: hide the entire strip when no upcoming match exists in Sanity

### 3. Hero

CMS-driven with 4 variants from the Sanity article schema. All variants share:

- Landscape hero image on the right, with washi tape
- Headline + intro paragraph on the left
- `LEES VERDER →` link
- Variant tape sticker

Variant-specific flourishes:

**Interview** (1 or multiple interviewees)

- Tape sticker: `INTERVIEW`
- Interviewee name chip(s) under the headline ("Met Dieter Van Dionant"; stacked chips if multiple)
- If a referenced Person has a portrait in Sanity, show as a small thumbnail next to the headline

**Announcement**

- Tape sticker: `AANKONDIGING`
- Optional date stamp overlay on the photo
- Most flexible variant — minimal extra structure beyond the shared base

**Event**

- Tape sticker: `EVENT`
- Prominent day-number block overlaid on the photo lower-left, e.g. `ZA 27/4`
- Venue strip below the headline

**Transfer** (in / out / verlenging)

- Tape sticker: `TRANSFER`
- Type chip with directional arrow: `IN ↓` / `OUT ↑` / `VERLENGING ↻`
- If the referenced Person has a jersey number, badge overlaid on photo's bottom-left
- Player portrait thumbnail (if available) next to the headline

### 4. Featured Event (existing component)

Keep as-is. Already renders when a featured event exists in Sanity, hides otherwise. No changes needed.

### 5. Uitgelicht Section

- **Heading**: `Uitgelicht.` (italic serif on the word, period after)
- **No right-side link** (the `ALLE ARTIKELS →` link belongs to Laatste nieuws below)
- **Data**: 3 articles flagged `featured: true` in Sanity
- **Layout**: 3 cards in a row, **prominently sized — larger than the Laatste nieuws cards below**
- **Card structure**: same variant-driven design as Laatste nieuws cards, just bigger and with more washi-tape decoration
- **Critical**: featured cards MUST read as visually MORE prominent than the chronological grid below. The current implementation has them smaller, which is backwards and was the original confusion driver.

### 6. Laatste Nieuws Grid

- **Heading**: `Laatste nieuws.` (italic on "nieuws", period after)
- **Right-side link**: `ALLE ARTIKELS →`
- **Layout**: **3×2 equal-sized cards** (6 total). No asymmetric/hero-grid hybrid — the variety lives in the _cards_, not the _layout_.
- **Data**: most recent articles, EXCLUDING the 3 featured ones from Uitgelicht

Card variants (driven by Sanity `type` field):

**Interview card**

- Cream/white card background
- Tag chip: `INTERVIEW`
- Interviewee name(s) under headline (stacked chips for multiple)
- Portrait thumbnail next to headline if a referenced Person has one

**Transfer card**

- Green card background, white text
- Tag chip: `TRANSFER` + in/out/verlenging directional chip
- Jersey number badge overlaid on photo bottom-left if Person has a number
- Player portrait thumbnail if available

**Announcement card**

- Cream/white card background
- Tag chip: `AANKONDIGING`
- For tag-driven subcategories (jeugd-victory, column), the meta panel below the photo gets a **horizontal dark-stripe accent** (this is the only place that pattern appears)

**Event card**

- Cream/white card background
- Big day-number stamp overlaid on photo's lower-left (e.g. `ZA 27/4`)
- Tag chip: `EVENT`
- Venue strip under headline

All variants share: landscape hero at top, washi tape, headline + date + `LEES VERDER →`.

**Photo constraint** (important): all article hero images are landscape jpgs with their own backgrounds. Player portraits (if present) also have backgrounds — there are NO cutouts/transparency. Colored card backgrounds (cream for Interview/Announcement/Event, green for Transfer) apply to the area _around_ the photo, not behind it.

### 7. Komende Wedstrijden (Schedule)

- **Heading**: `Komende wedstrijden.`
- **Behavior**: keep current — single next match per team, chronological order, 5 visible by default, expand button to show more, links to `/kalender` for the full overview
- **No tabs, no team grouping** — single mixed list
- **Add to each row**: both team logos (home + away). Currently only team names are shown.
- **Per-row data**: date + time, KCVV team that plays (A-ploeg / U17 / B-ploeg / etc.), opponent name, both team logos, competition type (Competitie / Beker / Tornooi), home/away badge (`THUIS` / `UIT`), tap target → match details page
- **Date format**: standard (`Do 14 mei · 18:00`)
- **Hidden state**: hide section if no upcoming matches

### 8. De Toekomst Van Elewijt (Youth)

- **Background**: keep the photo + green overlay (current implementation). Do NOT switch to flat illustration.
- **Top decoration**: add a **diagonal green-on-green stripe band** spanning the full section width at the very top of the section. This is the youth-section signature flourish.
- **Heading**: short — `De toekomst van Elewijt.` (italic on "Elewijt", period after)
- **Eyebrow**: `WORD JEUGDSPELER`
- **Stats**: inline (`220+ SPELERS · 16 PLOEGEN`), NOT a featured number badge
- **CTAs**: TWO buttons, side by side:
  - `Ontdek onze jeugd →` (primary)
  - `Word zelf lid →` (secondary)
- **Body copy**: existing short narrative is fine

### 9. Sponsors

Keep as-is. No changes.

### 10. Brandsfit Clubshop

- **Position**: MOVED — now comes AFTER sponsors (previously between youth and sponsors). This makes it less prominent on the page.
- **Layout**: **full-bleed dark green section**
- **Decoration**: **diagonal stripe band at BOTH top and bottom** of the section (mirrored), framing it like a taped package. This is the only section with stripes on both edges.
- **Heading**: `Onze clubkledij.` (italic on "clubkledij", period after)
- **Subheading**: `Beschikbaar via Brandsfit, onze kledingpartner.`
- **CTA**: `Naar de Brandsfit clubshop →` (single, prominent button)
- **No product images** — we don't have a CMS shop, and we don't have usable photos of clothing. Don't fake it with stock imagery.
- **Optional flourish**: a small SVG icon (jersey, hanger) or a washi-tape `OFFICIEEL` sticker for visual texture
- **Drop**: the generic `WEBSHOP · ONZE PARTNER` eyebrow — Brandsfit is now surfaced in the subheading and CTA instead

### 11. Footer

- **Wordmark**: keep implementation style (medium "KCVV Elewijt" with italic "Elewijt") — do NOT switch to the panorama's larger caps treatment
- **Tagline**: `Er is maar één plezante compagnie.` (this is the only official tagline — drop any AI-generated alternatives like "Amateur. Ambitieus. ...")
- **Columns**: keep current 3-column structure: `Ontdek` / `Aansluiten` / `Bij de club`
- **Add to "Ontdek"**: `Brandsfit clubshop` link (the footer should reference the same destination as the section above)
- **Contact info** (email, address): keep tucked in the bottom copyright row (do not promote to its own block)

## CMS / Sanity Constraints

- Article schema has a `type` field with 4 variants: `interview`, `announcement`, `event`, `transfer`
- Article schema has a `featured` boolean — used to populate Uitgelicht
- Transfer articles have an `in` / `out` / `extension` sub-type
- Interview articles can reference 1 or multiple `Person` documents
- Person documents can have an optional portrait image — but it's a **jpg with its own background** (no transparency / cutouts available)
- Person documents can have a jersey number
- All article hero images are **landscape jpgs** — no portrait orientation, no cutouts
- No product or shop schema — Brandsfit is purely an external link
- Match data: single next match per team is queryable
- Featured event: a separate component, renders when present

## What NOT to do

- Do NOT introduce a dark navigation bar — we explored it, decided to keep cream
- Do NOT use the "Ook deze week" heading — it's `Uitgelicht.`
- Do NOT make news cards visually uniform — variant treatment per Sanity `type` is intentional
- Do NOT make Uitgelicht cards smaller than Laatste nieuws cards — featured must read as larger
- Do NOT use image cutouts for players — they don't exist; portraits always have backgrounds
- Do NOT add a standings/league table to the schedule section — matches span multiple teams with no single league
- Do NOT add match preview or match report content types — they don't exist in our editorial workflow
- Do NOT generate tagline copy — only `Er is maar één plezante compagnie.` is used
- Do NOT show the partner badge as `ONZE PARTNER` — surface the actual name "Brandsfit"
- Do NOT use the panorama's "320" big number badge or the U11 jersey illustration — we chose the photo+overlay treatment for youth
- Do NOT add a thin horizontal rule above every section as a global pattern — that was an over-generalisation in the design conversation; the only repeating decorative section element is the diagonal stripe band (used on youth and clubshop only)

## Suggested Implementation Order

1. Design tokens: diagonal stripe pattern, horizontal stripe pattern, washi tape color variations
2. Card component refactor — variant-driven base, then 4 type-specific treatments (Interview / Announcement / Event / Transfer)
3. Hero variants — same 4 types, larger format
4. Uitgelicht section — featured-flagged data + larger card sizing
5. Laatste nieuws grid — switch to 3×2 equal layout, exclude featured
6. Komende wedstrijden — add team logos to each row
7. Youth section — add diagonal stripe top, swap to short headline, add second CTA
8. Brandsfit clubshop — relocate after sponsors, full-bleed dark green with mirrored stripe frame, new copy
9. Footer — add Brandsfit clubshop link to Ontdek column

After each section, compare visually against the panorama for that specific area, and against this prompt for behavior.
