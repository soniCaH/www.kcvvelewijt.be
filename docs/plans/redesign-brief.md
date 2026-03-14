# KCVV Visual Redesign — Design Brief

Living document. Fill in as decisions are made. Becomes the implementation spec.

---

## Status

- [x] Color palette defined
- [x] Typography decisions made
- [x] Graphic motif(s) defined
- [x] Spacing/layout principles set
- [x] Component style direction agreed

---

## Inspiration Sites

- https://www.sportinghasselt.be — Belgian football club, similar scale
- https://www.realmadrid.com — Elite football club, benchmark for football UX patterns
- https://www.intermiamicf.com — Modern MLS club, bold graphic identity

---

## Color Palette

| Token              | Value     | Usage                                                     |
| ------------------ | --------- | --------------------------------------------------------- |
| `--color-green`    | `#4acf52` | Primary CTA, links, badges, active states                 |
| `--color-green-dk` | `#008755` | Accent for dark sections, jersey-inspired, depth/contrast |
| `--color-black`    | `#1E2024` | Primary text, dark backgrounds                            |
| Grays              | unchanged | Body text variants, borders, muted states                 |
| White              | `#ffffff` | Light section backgrounds, card surfaces                  |

**Decision:** Two-green system. `#4acf52` remains the lead brand green. `#008755` (from new kits) is the secondary/dark accent — used sparingly to add depth. Not interchangeable.

---

## Typography

| Font          | Role          | Decision |
| ------------- | ------------- | -------- |
| `quasimoda`   | Display/title | **Keep** |
| `montserrat`  | Body copy     | **Keep** |
| `stenciletta` | Accent/alt    | **Keep** |

All three fonts are retained. Redesign adjusts hierarchy, weights, and sizing — not the font choice. `stenciletta` stays reserved for sporty accent moments (jerseys, badges, hero numbers).

---

## Graphic Motifs

**Direction: Bold & Graphic — derived from jersey/kit assets**

The kit has two distinct visual layers, both available as SVGs in `/Downloads/Redesign/`:

### Layer breakdown

- **Asset 2.svg** — Full light colorway: `#4acf52` on white. Chaotic angular slashes + halftone dot clusters. Energetic, painterly.
- **Asset 3.svg / Asset 4.svg** — Isolated speed bands: wide sweeping diagonals at ~15°, mirrored into a V/chevron. Bold, jagged/frayed edges. The dominant structural jersey graphic.
- **Layer 1.svg** — Full dark colorway: `#4acf52` on near-black (`#1E2024`). Same pattern, richer and more dramatic. The primary kit.

### Web translations

| Jersey element               | Web usage                                    | Implementation                          |
| ---------------------------- | -------------------------------------------- | --------------------------------------- |
| Speed bands (Asset 3/4)      | Hero bottom edge, major section transitions  | `clip-path: polygon()` at ~10–15°       |
| Full pattern dark (Layer 1)  | Hero / dark section background texture       | SVG `background-image` at 5–10% opacity |
| Full pattern light (Asset 2) | Light section subtle texture, card accents   | SVG bg at 3–5% opacity                  |
| Single slash band            | Decorative accent behind headings, CTA zones | Inline SVG, `overflow: hidden`          |
| Halftone dots                | Card or section filler texture               | CSS `radial-gradient` dot pattern       |

### Angle rules

- **Hero / focal elements:** ~15° — matches jersey speed band energy
- **Between-section dividers:** ~3–5° — subtle rhythm, doesn't overpower content

### Key principle

The pattern is **organic and aggressive, not clean geometric.** Edges are jagged/frayed, not smooth. Web use should preserve this — never simplify to a plain diagonal rectangle.

### Dark/light alternation

Sections alternate between dark (`#1E2024` or `#008755`) and light (white/near-white). Never two dark or two light sections in a row.

---

## Photography Constraint

**KCVV does not have a professional photographer.** All design decisions must account for this:

- **Available:** PSD player portraits (auto-synced), existing club archive photos, jersey/kit photos, sponsor logos
- **Not available:** action shots, event photography on demand, professionally lit portraits
- **Compensate with:** strong graphic design, bold typography as visual texture, solid color sections, diagonal cuts, pattern overlays, `#008755` / `#1E2024` dark backgrounds that look strong without imagery

---

## Layout Principles

- **Max width:** `1280px` centered, `px-4 md:px-8` gutters
- **Section rhythm:** alternating dark/light (see Graphic Motifs), each section min `py-16`
- **Grid:** 12-column base, collapsing to 4 on mobile. Cards: 3-up desktop / 2-up tablet / 1-up mobile.
- **Whitespace:** generous. Less content density than current site — let images breathe.
- **Images:** full-bleed hero images with dark overlay (`#1E2024` at 40–60% opacity) + diagonal cut at bottom.
- **URL language:** Full Dutch standardisation at redesign relaunch. All English slugs → Dutch equivalents with 301 redirects.

---

## Component Style Direction

**Cards**

- Elevated with soft shadow on light backgrounds
- Borderless on dark backgrounds — use contrast only
- Image top, content below, CTA link at bottom flush right
- Green top-border accent on hover (3px, `#4acf52`)

**Buttons**

- Primary: solid `#4acf52`, black text, sharp corners (not pill)
- Secondary: outlined `#4acf52` border, transparent bg, `#4acf52` text
- Hover: invert fill
- Size: `px-6 py-3`, consistent across all breakpoints

**Badges / Pills**

- Sharp rectangular (no border-radius or very low `rounded-sm`)
- Sporty, dense — fits the stenciletta aesthetic

**Navigation**

- Dark background nav (`#1E2024`) always, sticky on scroll
- Active link: `#4acf52` underline rule
- Mobile: slide-in drawer, dark background

**Section headers**

- All-caps `montserrat` or `quasimoda` for main heading
- `#4acf52` rule or left-border accent underneath
- Optional: oversize muted number or `stenciletta` texture behind

---

## Homepage Blocks (Required — see issue #734)

These blocks must appear on the redesigned homepage:

1. **Next / Previous Match** — prominent hero-style widget for first team's upcoming and most recent match result
2. **Youth Team Matches Sidebar** — compact list of upcoming/recent matches for all youth teams
3. **Featured Event** — spotlight block for one upcoming club event (configurable in Sanity)
4. **Banners** — editorial banner slots (sponsorship highlights, announcements)

---

## What Changes vs What Stays

| Element              | Decision                                                       |
| -------------------- | -------------------------------------------------------------- |
| Primary green        | Stays `#4acf52`                                                |
| Secondary accent     | New: `#008755` added                                           |
| All three fonts      | Kept                                                           |
| Section dividers     | Change: diagonal cuts replace straight horizontal rules        |
| Dark/light sections  | New: explicit alternation rule enforced                        |
| Card borders         | Remove filled borders; use shadow (light bg) or none (dark bg) |
| Button shape         | Change: sharp corners (remove full pill rounding)              |
| URL slugs (English)  | Change: all → Dutch on redesign launch, 301s for old URLs      |
| `/contact` + `/hulp` | Keep separate — different user journeys                        |
| `/game/[matchId]`    | Keep team-agnostic (a match involves two teams)                |
| GDPR/legal pages     | Audit at redesign time — add any missing legal pages           |
