---
name: KCVV Elewijt — Club Editorial
description: >
  A Belgian amateur-football club site whose identity blends editorial
  match-report warmth with the energy of a grass-green brand. Sharp-edged
  cards, a bold display serif-geometric, monospace scoreboards, and a single
  confident accent line that reveals itself on hover.
colors:
  # Brand — vibrant grass green
  brand-primary: "#4acf52"
  brand-primary-hover: "#41b147"
  brand-primary-alpha-25: "rgba(74, 207, 82, 0.25)"
  brand-primary-alpha-50: "rgba(74, 207, 82, 0.50)"
  brand-primary-alpha-75: "rgba(74, 207, 82, 0.75)"
  brand-accent-dark: "#008755"
  brand-accent-dark-hover: "#006b43"

  # Neutrals — inky blue-blacks, slate text
  neutral-black: "#1e2024"
  neutral-dark-blue: "#1e2836"
  neutral-gray-blue: "#31404b"
  neutral-gray-dark: "#292c31"
  neutral-gray: "#62656a"
  neutral-gray-light: "#cccccc"
  neutral-white: "#fefefe"

  # Foundation surfaces — near-white scaffolding
  surface-base: "#fefefe"
  surface-muted: "#f3f4f6"
  surface-quiet: "#edeff4"
  surface-hairline: "#e5e7eb"
  surface-hairline-strong: "#d1d5db"
  surface-row-alt: "#f9fafb"

  # Semantic
  semantic-success: "#3adb76"
  semantic-warning: "#ffae00"
  semantic-alert: "#cc4b37"

  # Editorial gradient overlays (photo cards, nav cards)
  overlay-editorial-top: "rgba(30, 32, 36, 0.10)"
  overlay-editorial-mid: "rgba(30, 32, 36, 0.50)"
  overlay-editorial-bottom: "rgba(30, 32, 36, 0.95)"
  overlay-nav-top: "rgba(30, 40, 54, 0.20)"
  overlay-nav-mid: "rgba(30, 40, 54, 0.60)"
  overlay-nav-bottom: "rgba(30, 32, 36, 0.95)"

  # Tap highlight (mobile)
  tap-highlight: "rgba(74, 207, 82, 0.10)"

typography:
  hero:
    fontFamily: Quasimoda, system-ui, sans-serif
    fontSize: "clamp(3rem, 7vw, 5.5rem)" # 48px → 88px
    fontWeight: "700"
    lineHeight: "0.9"
    letterSpacing: "0"
  display:
    fontFamily: Quasimoda, system-ui, sans-serif
    fontSize: "3rem" # 48px — desktop h1
    fontWeight: "700"
    lineHeight: "1.2"
  headline-lg:
    fontFamily: Quasimoda, system-ui, sans-serif
    fontSize: "2rem" # 32px — desktop h2
    fontWeight: "700"
    lineHeight: "1.2"
  headline-md:
    fontFamily: Quasimoda, system-ui, sans-serif
    fontSize: "1.5rem" # 24px — desktop h3
    fontWeight: "700"
    lineHeight: "1.2"
  headline-sm:
    fontFamily: Quasimoda, system-ui, sans-serif
    fontSize: "1.375rem" # 22px — desktop h4 / mobile h2
    fontWeight: "700"
    lineHeight: "1.25"
  title-lg:
    fontFamily: Quasimoda, system-ui, sans-serif
    fontSize: "1.25rem" # 20px — card titles
    fontWeight: "700"
    lineHeight: "1.25"
  body-lg:
    fontFamily: Montserrat, system-ui, sans-serif
    fontSize: "1.125rem" # 18px — lead / intro
    fontWeight: "400"
    lineHeight: "1.6"
  body-md:
    fontFamily: Montserrat, system-ui, sans-serif
    fontSize: "1rem" # 16px — default body
    fontWeight: "400"
    lineHeight: "1.75"
  body-sm:
    fontFamily: Montserrat, system-ui, sans-serif
    fontSize: "0.8125rem" # 13px — captions, helper text
    fontWeight: "400"
    lineHeight: "1.5"
  label-md:
    fontFamily: Montserrat, system-ui, sans-serif
    fontSize: "0.875rem" # 14px
    fontWeight: "600"
    lineHeight: "1.25"
    letterSpacing: "0"
  label-kicker:
    fontFamily: Montserrat, system-ui, sans-serif
    fontSize: "0.75rem" # 12px — uppercase meta label
    fontWeight: "700"
    lineHeight: "1.25"
    textTransform: uppercase
    letterSpacing: "0.14em"
  label-caps:
    fontFamily: Montserrat, system-ui, sans-serif
    fontSize: "0.75rem" # 12px — uppercase footer caption / link
    fontWeight: "600"
    lineHeight: "1.25"
    textTransform: uppercase
    letterSpacing: "0.08em"
  score:
    fontFamily: "IBM Plex Mono, Consolas, Liberation Mono, monospace"
    fontSize: "1.5rem" # 24px — live scores, timestamps
    fontWeight: "700"
    lineHeight: "1"
    fontVariantNumeric: tabular-nums
  stat:
    fontFamily: "IBM Plex Mono, Consolas, Liberation Mono, monospace"
    fontSize: "2.5rem" # 40px — big stat numbers
    fontWeight: "700"
    lineHeight: "1"
    fontVariantNumeric: tabular-nums
  accent-display:
    fontFamily: "Stenciletta, Quasimoda, sans-serif"
    fontSize: "2rem"
    fontWeight: "400"
    lineHeight: "1"
    # Reserved — military-stencil accent, not for new UI by default
  drop-cap:
    fontFamily: Quasimoda, system-ui, sans-serif
    fontSize: "5.5rem"
    fontWeight: "700"
    lineHeight: "0.85"
    color: "{colors.brand-primary}"

fontWeights:
  normal: "400"
  medium: "500"
  semibold: "600"
  bold: "700"

lineHeights:
  hero: "0.9"
  tight: "1.2"
  snug: "1.25"
  normal: "1.5"
  relaxed: "1.6"
  loose: "1.75"

letterSpacing:
  normal: "0"
  caps: "0.08em"
  label: "0.14em"

spacing:
  base: "8px"
  xs: "4px" # 0.25rem
  sm: "8px" # 0.5rem
  md: "12px" # 0.75rem — mobile page padding
  lg: "16px" # 1rem
  xl: "24px" # 1.5rem
  2xl: "32px" # 2rem
  3xl: "40px" # 2.5rem — desktop page padding
  4xl: "60px" # 3.75rem — section rhythm
  5xl: "70px" # 4.375rem — large section rhythm
  6xl: "90px" # 5.625rem — major section separator
  hero-image: "560px" # 35rem — canonical hero image height

breakpoints:
  sm: "640px"
  md: "768px" # handheld → tablet
  desk: "960px" # legacy desktop breakpoint
  lg: "1024px"
  xl: "1280px"
  2xl: "1536px"

layout:
  max-width-inner: "960px" # article body, narrow content
  max-width-inner-lg: "1120px"
  max-width-outer: "1440px" # full-bleed cap
  padding-mobile: "12px"
  padding-desktop: "40px"
  grid-columns-mobile: 4
  grid-columns-desktop: 12

rounded:
  none: "0"
  card: "4px" # canonical card / button radius
  sm: "4px"
  DEFAULT: "4px"
  md: "6px"
  lg: "8px"
  pill: "9999px"

shadows:
  none: none
  sm: "0 2px 5px 0 rgba(0, 0, 0, 0.16)"
  DEFAULT: "0 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12)"
  md: "0 2px 10px 0 rgba(0, 0, 0, 0.12)"
  lg: "0 0 10px rgba(0, 0, 0, 0.7)"
  card-hover: "0 12px 32px rgba(0, 0, 0, 0.15)"
  input-inset: "inset 0 1px 2px rgba(0, 0, 0, 0.10)"
  input-focus: "0 0 5px #cacaca"
  focus-ring-green: "0 0 6px 1px rgba(74, 207, 82, 0.50)"

elevation:
  level-0:
    description: Page surface — kcvv-white
    backgroundColor: "{colors.surface-base}"
    shadow: none
  level-1:
    description: Resting card (news, team, player, editorial)
    backgroundColor: "{colors.surface-base}"
    border: "1px solid {colors.surface-hairline}"
    shadow: "{shadows.sm}"
  level-2:
    description: Hovered card — lifted 4px with a soft, wide drop
    backgroundColor: "{colors.surface-base}"
    border: "1px solid {colors.surface-hairline}"
    shadow: "{shadows.card-hover}"
    transform: "translateY(-4px)"
  level-3:
    description: Modal / overlay surface
    backgroundColor: "{colors.surface-base}"
    shadow: "{shadows.lg}"
  dark-surface:
    description: Cookie banner, footer, match-intro hero
    backgroundColor: "{colors.neutral-black}"
    textColor: "{colors.neutral-white}"

motion:
  duration-fast: "150ms"
  duration-base: "300ms" # standard card / button transitions
  duration-slow: "500ms" # image zoom, fade-up motion
  duration-spinner: "6000ms" # KCVV logo spin cycle
  easing-standard: "cubic-bezier(0.4, 0, 0.2, 1)" # ease-in-out
  easing-out: "cubic-bezier(0, 0, 0.2, 1)"
  easing-article: "cubic-bezier(0.22, 1, 0.36, 1)" # editorial fade-up
  easing-spinner-a: "cubic-bezier(0.5, 0, 1, 0.5)"
  easing-spinner-b: "cubic-bezier(0, 0.5, 0.5, 1)"
  card-lift: "-4px"
  card-image-zoom: "1.05"
  reduced-motion: respect prefers-reduced-motion

animations:
  fade-up:
    # Body content reveal as the reader scrolls into view
    from: { opacity: 0, transform: "translateY(24px)" }
    to: { opacity: 1, transform: "translateY(0)" }
    duration: "500ms"
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
  fade-in:
    from: { opacity: 0, transform: "translateY(10px)" }
    to: { opacity: 1, transform: "translateY(0)" }
    duration: "300ms"
    easing: ease-out
  accent-bar-reveal:
    # 3px green bar expands from card center on hover
    property: clip-path
    from: "inset(0 50%)"
    to: "inset(0 0%)"
    duration: "300ms"
    easing: ease-out
  carousel-progress:
    property: transform
    from: "scaleX(0)"
    to: "scaleX(1)"
    easing: linear
  kcvv-logo-spin:
    # Flip the club crest on its vertical axis — 10 full rotations per cycle
    keyframes: "0% rotateY(0deg) · 50% rotateY(1800deg) · 100% rotateY(3600deg)"
    duration: "6000ms"
    easing: linear
    iterationCount: infinite

components:
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "{colors.neutral-white}"
    typography: "{typography.label-md}"
    rounded: "{rounded.card}"
    paddingX: "{spacing.xl}"
    paddingY: "{spacing.sm}"
    transition: "all 300ms"
    hover: { backgroundColor: "rgba(74, 207, 82, 0.5)" }
    focusRing: "{shadows.focus-ring-green}"
  button-secondary:
    backgroundColor: "{colors.neutral-gray}"
    textColor: "{colors.neutral-white}"
    typography: "{typography.label-md}"
    rounded: "{rounded.card}"
    hover: { backgroundColor: "{colors.neutral-gray-dark}" }
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.brand-primary}"
    border: "2px solid {colors.brand-primary}"
    rounded: "{rounded.card}"
    hover:
      {
        backgroundColor: "{colors.brand-primary}",
        textColor: "{colors.neutral-white}",
      }
  button-link:
    backgroundColor: transparent
    textColor: "{colors.brand-primary}"
    underlineOffset: "4px"
    hover: { textDecoration: underline }
  badge-default:
    backgroundColor: "{colors.surface-quiet}"
    textColor: "{colors.neutral-gray}"
    typography: "{typography.label-kicker}"
    rounded: "{rounded.pill}"
    paddingX: "10px"
    paddingY: "4px"
  badge-primary:
    backgroundColor: "rgba(74, 207, 82, 0.15)"
    textColor: "{colors.brand-accent-dark}"
    rounded: "{rounded.pill}"
  badge-live:
    backgroundColor: "{colors.semantic-alert}"
    textColor: "{colors.neutral-white}"
    dot: "pulsing, 8px circle, semantic-alert"
    rounded: "{rounded.pill}"
  input-field:
    backgroundColor: "{colors.surface-base}"
    textColor: "{colors.neutral-gray-dark}"
    border: "1px solid {colors.surface-hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.card}"
    shadow: "{shadows.input-inset}"
    focus:
      shadow: "{shadows.input-focus}"
      ring: "2px {colors.brand-primary}"
  card-navigation:
    # News, Editorial, Player, Team, Event, Search — cards that navigate
    backgroundColor: "{colors.surface-base}"
    border: "1px solid {colors.surface-hairline}"
    rounded: "{rounded.card}"
    shadow: "{shadows.sm}"
    overflow: hidden
    accentBar:
      position: "top, full-width, 3px"
      color: "{colors.brand-primary}"
      rest: "clip-path: inset(0 50%)"
      hover: "clip-path: inset(0 0%)"
    hover:
      shadow: "{shadows.card-hover}"
      transform: "translateY(-4px)"
      imageZoom: "1.05 over 500ms"
    transition: "all 300ms"
  card-info:
    # Contact, Sponsor-tier — informational, no accent bar
    backgroundColor: "{colors.surface-base}"
    border: "1px solid {colors.surface-hairline}"
    rounded: "{rounded.card}"
    shadow: "{shadows.sm}"
    hover:
      shadow: "{shadows.card-hover}"
      transform: "translateY(-4px)"
  row-match:
    # MatchTeaser, MatchResultRow — compact list rows
    backgroundColor: "{colors.surface-base}"
    border: "1px solid {colors.surface-hairline}"
    rounded: "{rounded.card}"
    shadow: "{shadows.sm}"
    padding: "10px 16px"
    hover: { shadow: "{shadows.md}" } # radius + shadow only, no lift
  card-sponsor:
    # Sponsor logos — grayscale-to-color is the primary interaction
    backgroundColor: "{colors.surface-base}"
    filter-rest: "grayscale(100%)"
    filter-hover: "grayscale(0%)"
    rounded: "{rounded.card}"
  editorial-overlay:
    # Photo-backed cards — 3-stop vertical gradient, legible caption at base
    gradient: "linear-gradient(to top, rgba(30,32,36,0.95) 0%, rgba(30,32,36,0.50) 40%, rgba(30,32,36,0.10) 100%)"
  drop-cap:
    # First letter of announcement / transfer articles
    fontFamily: Quasimoda
    fontWeight: "700"
    fontSize: "5.5rem"
    lineHeight: "0.85"
    float: left
    color: "{colors.brand-primary}"
    paddingRight: "{spacing.md}"
    paddingTop: "{spacing.sm}"
  article-h2-rule:
    # 4rem × 2px green kicker-rule above every article H2
    width: "64px"
    height: "2px"
    color: "{colors.brand-primary}"
    position: "absolute, top:0, left:0"
  blockquote-editorial:
    # Rule-framed, centered, Quasimoda 400 — article body context
    fontFamily: Quasimoda
    fontWeight: "400"
    fontSize: "1.375rem"
    lineHeight: "1.4"
    color: "{colors.neutral-gray-blue}"
    textAlign: center
    maxWidth: "50ch"
    padding: "2rem 0"
    borderTop: "1px solid {colors.neutral-gray-light}"
    borderBottom: "1px solid {colors.neutral-gray-light}"
  blockquote-quote-glyph:
    # Legacy oversized left-floated quote mark — used for `.prose` generic
    character: "“"
    fontSize: "15rem"
    color: "{colors.brand-primary}"
    lineHeight: "0.8"
    float: left
  section-heading-rule:
    # Short horizontal rule under section titles
    width: "4rem"
    height: "2px"
    color: "{colors.brand-primary}"
    marginBottom: "10px"
---

## Brand & Style

KCVV Elewijt is a Belgian amateur football club. The site has two jobs that
pull in different directions: it's a **newsroom** (match reports, transfers,
interviews, youth news) and it's a **matchday product** (live scores, fixtures,
rankings, squads). The design holds both by leaning on _editorial composure_
— generous air, confident type, a strict palette — and punctuating it with
one electric, unmistakable brand color.

The personality is **grounded, proud, and local**. Not corporate, not
nostalgic. Club motto — _"Er is maar één plezante compagnie"_ — sits at the
friendly end; the layout language stays crisp and professional so the club
reads as a serious institution, not a hobby project.

## Colors

### Brand green is the whole voice

The primary `#4acf52` is a **vivid, saturated grass green**. It only gets
used where it earns the attention: primary buttons, inline content links,
the reveal-on-hover accent bar above navigation cards, the drop-cap in
feature articles, the short rule under section headings, the focus ring.
Nothing tertiary ever wears it. When a darker, more serious green is
needed — section backgrounds, links on light surfaces in the article body —
`#008755` (brand-accent-dark) carries the same signal without shouting.

- **Primary action**: `brand-primary` — fill for buttons, badges, focus rings, accents
- **Primary text-on-light for links**: `brand-accent-dark` — content-link underline
- **Hover states**: step down in brightness (`brand-primary-hover`) or fade toward transparent
- **Alpha variants**: used almost exclusively for subtle badge backgrounds (`rgba(74,207,82,0.15)`) and the mobile tap highlight

### Neutrals are cold, not warm

The neutral stack is **blue-tinted** (`#31404b` gray-blue for headings,
`#1e2836` dark-blue for the nav-card overlay, `#1e2024` near-black). That
cold cast is deliberate — it reads newsprint-modern against the hot green,
not muddy-warm. Pure white (`#fefefe`) carries the page; four near-white
scaffolding grays (`#f3f4f6`, `#edeff4`, `#e5e7eb`, `#d1d5db`, `#f9fafb`)
handle table zebra striping, card hairlines, and muted pill backgrounds.

### Semantic colors stay literal

`#3adb76` for success (a _different_ green from the brand — bright and slightly
teal), `#ffae00` for warnings, `#cc4b37` for alerts and the _live-match_
pulsing dot. These never double as decoration.

### Editorial gradients

Photo-backed cards — the big home-page news tiles, nav cards with
backgrounds — get a **three-stop vertical gradient** from near-transparent
black at the top to 95% black at the bottom, so captions read cleanly on
any image. A second variant tints the mid-stop toward dark-blue
(`#1e2836`) for navigation cards to quietly distinguish them from news.

## Typography

Four families, each with one job. Pairing them is half the voice of the site.

- **Quasimoda** (Adobe Typekit, 700) — every heading `h1`–`h6`, drop-caps,
  article blockquotes. Quasimoda is a near-monolinear sans with slightly
  humanist proportions — sporty without being geometric-sterile. It carries
  the big hero type (`clamp(3rem, 7vw, 5.5rem)`) with poise at `line-height: 0.9`.
- **Montserrat** (self-hosted via `next/font/google`, 400/500/600/700) — all
  body text, labels, buttons, UI. A workhorse that stays legible at 12px and
  holds up in a 1.75 `leading-loose` body paragraph.
- **IBM Plex Mono** (self-hosted, 400/600/700) — **scores, minute marks,
  countdowns, timestamps**. Mono is a match-day signal: `2 — 1   90′   45+2′`.
  Pair with `tabular-nums`. Big stat blocks use it at 40px/bold.
- **Stenciletta** (Adobe Typekit, 400) — military-stencil accent. Used
  sparingly (logo lockups, the "KCVV" monogram), _not_ introduced into new
  UI without a specific reason.

### Type scale is pragmatic, not geometric

The scale is a working-designer list (12, 13, 16, 18, 20, 22, 24, 28, 32,
40, 48, clamp hero) rather than a 1.25 modular progression. It reflects
the real content: card titles at 20, section heads at 32, stats at 40, hero
at 48–88.

### Headings respond

Headings resize at the 768px breakpoint:

- `h1`: 28 → 48
- `h2`: 22 → 32
- `h3`: 20 → 24
- `h4`: 18 → 22

They share a single tight line-height (1.2), Quasimoda 700, gray-blue
color, and a bottom margin of `1em`.

### Meta labels are uppercase + tracked

Kicker labels (category tags above headlines, section eyebrows) are 12px
Montserrat 700, uppercase, with **0.14em tracking**. Secondary uppercase
treatments (footer captions, small links) step down to 0.08em. This
tracked-uppercase pattern is one of the three signatures of the voice (the
others: the green accent bar and the oversized quote glyph).

## Layout & Spacing

### Rhythm

Spacing is **8px-based** for all interior detail, then jumps onto a
larger rhythm (40, 60, 70, 90px) for section vertical separation. That jump
is deliberate — inside a card spacing is tight and efficient; between
sections the page _breathes_ like a printed magazine.

Mobile page padding is 12px; desktop opens to 40px at the `md` breakpoint.
The hero image uses a fixed `35rem` (560px) height so the home page feels
substantial on first paint regardless of content below.

### Widths

Content is **capped three ways**:

- `max-w-inner` 960px for article bodies and narrow reading columns
- `max-w-inner-lg` 1120px for mixed editorial layouts
- `max-w-outer` 1440px for the full-bleed container

Anything needing to break the container uses a `.full-bleed` pattern
(viewport-width negative margins) — common for hero photos, sponsor bars,
and editorial imagery.

### Grid

Mobile is a **4-column** grid; desktop opens to 12. Cards are usually
one-up, two-up, or three-up depending on context. Row-style components
(match teasers, match results) stack vertically in tight lists.

## Elevation & Depth

Depth is built from **hairlines + soft drop shadows**, not backdrop blur or
heavy ambient fills.

- **Resting card**: 1px `#e5e7eb` border, `shadow-sm`, white background
- **Hovered card**: lifted 4px (`translateY(-4px)`), shadow grows to
  `0 12px 32px rgba(0,0,0,0.15)` — wide, soft, unmistakable
- **Transition**: 300ms on all properties, standard easing
- **Image inside card**: scales `1.05×` over 500ms on hover, clipped by the
  card's overflow

The effect is **tactile, not theatrical**. No glow, no rim-light, no
parallax. A card that rises, a photo that breathes in, and a green line
that draws across the top edge.

### The accent bar

The defining interaction. Navigation cards (news, players, teams,
editorial, events, search results) carry a **3px `brand-primary` bar** at
their top edge, clipped to zero width at rest and revealed from the center
outward on hover via `clip-path` animation (300ms ease-out). It replaces
the need for a heavy hover color-fill and signals "this is a navigation
target" — info cards without destinations don't get it.

### Focus

Focus states use a **2px green ring with a 2px white offset** (`focus-visible`
only — no mouse-click rings). For form inputs, the focus state swaps the
inset input shadow for a subtle outer glow and the ring lights up in
`brand-primary`.

## Shapes

The site's corner language is **sharp, not soft**. The canonical card
radius is **4px**, which applies uniformly to buttons, cards, inputs, and
rows. Pills (badges, the live-match indicator) use `border-radius: 9999px`.
Nothing in between — the sharpness is part of the identity, it keeps the
editorial tone from tipping into consumer-app softness.

Images do not round their own corners unless they sit inside a card; the
card is what carries the corner.

## Components

### Buttons

Four variants — **primary**, **secondary**, **ghost**, **link** — and three
sizes. Primary is green-filled with white text; hover fades toward 50%
opacity of the green (not a darker shade) for a _light-leak_ feel. Ghost
is a 2px green outline that inverts on hover. The link variant is an
underlined text button in brand-primary. All buttons include a right-arrow
icon variant that animates `translate-x: 4px` on hover — a small forward
nudge that pairs with the accent-bar reveal.

### Inputs

Inputs sit on the page surface with a 1px hairline, soft inset shadow, and
4px radius. Leading/trailing icon slots scale with the size token
(sm/md/lg). Error states swap the ring to `semantic-alert` and render a
hint line below. Search inputs pair with a leading `Search` icon and a
trailing clear button.

### Badges

Pill-shaped (`border-radius: 9999px`), 12px Montserrat, uppercase optional.
Seven variants: default (gray), primary (green tint), success, warning,
alert, outline, and **live** — which auto-enables a pulsing 8px dot and
ships in red. Live badges are the single place red shows on the site.

### Cards

Three families, by interaction contract:

- **Navigation cards** (full recipe): lift + shadow + accent bar + image
  zoom. Used for news, editorial, player, team, event, search-result.
- **Info cards**: lift + shadow only. Contact blocks, sponsor tiers.
- **Row items**: radius + subtle `shadow-md` on hover. No lift, no accent
  bar. Reserved for match teasers and match-result rows where lift would
  feel excessive in tight vertical stacks.
- **Sponsor cards** break the pattern entirely — grayscale-to-color on
  hover is their whole interaction.

### Tables

Semantic rendering with a light header (`#f3f4f6` bg, `#d1d5db` bottom
border), a `#e5e7eb` border between rows, and a `#f9fafb` alternating row
stripe. No radius — tables extend to the container edge.

### Article body (announcements, transfers, interviews)

Three editorial signatures compose the long-form template:

1. **Drop-cap** — the first paragraph's first letter renders as a floated
   Quasimoda 700 at 5.5rem, colored in `brand-primary`, 4 lines tall.
2. **Section rule** — every `h2` inside the article body gets a 64×2px
   green bar absolutely positioned above it.
3. **Rule-framed blockquote** — centered Quasimoda 400 at 22px, bounded
   top and bottom by 1px `gray-light` rules, max 50ch, 3rem block margin.
   The decorative oversized `“` glyph is _only_ used in the generic
   legacy blockquote treatment, never inside the article-body scope.

Content enters with a **fade-up motion** (`translateY(24px) → 0`, opacity
0 → 1, 500ms) triggered by IntersectionObserver. Respects `prefers-reduced-motion`
by rendering at the final state instantly.

## Motion

- **300ms** is the house duration for anything interactive (buttons, cards,
  accent bars, link color, transforms). Standard ease-in-out.
- **500ms** for richer reveals (article fade-up with a custom
  `cubic-bezier(0.22, 1, 0.36, 1)`, card image zoom).
- **6-second full-rotation flip** for the KCVV crest spinner — the crest
  rotates on its Y-axis 10 times (3600°) per cycle, with a two-piece
  bezier easing that accelerates into the mid-point and decelerates out.
  A loader that _plays_.
- **Carousel progress** fills linearly from `scaleX(0)` to `scaleX(1)` as
  a slide's dwell time elapses. Pausable on hover or focus.
- **Reduced motion**: globally respected. The article fade-up, carousel
  progress, and spinner all collapse to final-state renders under
  `prefers-reduced-motion: reduce`.

## Iconography

All icons are **Lucide React outlines** — consistent stroke weight, slightly
rounded caps. Never use emojis in UI; there is an explicit mapping from
emoji to Lucide equivalents to support content migration (🤝 → `handshake`,
⚽ → `trophy`, 🎓 → `graduation-cap`).

The icon set is curated — only what the product uses is imported — and
grouped semantically: navigation, status, social, content, communication,
people, location, accessibility, sports, medical, business, layout, media
controls, zoom, actions, misc. Sport-specific icons (`trophy`, `activity`,
`flag`, `timer`, `rectangle-vertical`, `square`) cover the match-report
vocabulary: goals, cards, substitutions, whistles.

Icons inside buttons sit at 16px (sm/md) or 18px (lg), with a 6px gap. In
text links that use a trailing arrow, the arrow translates 4px right on
hover.

## Accessibility

- **Color contrast**: text uses `neutral-gray-dark` (`#292c31`) on white —
  well above AAA. Kicker labels drop to `neutral-gray` (`#62656a`) which
  still clears AA at 12px 700.
- **Focus rings**: visible 2px `brand-primary` ring with 2px offset, via
  `:focus-visible` so keyboard users always see them and mouse users never
  do.
- **Tap targets**: minimum 44×44px on mobile; touch-manipulation + safe-area
  insets applied to bottom nav.
- **Reduced motion**: honored across fade-ups, carousel progress, and
  spinner.
- **Tap highlight color**: the native iOS tap highlight is set to a 10%
  brand-primary so even the momentary flash is on-brand.

## What this design system is _not_

- Not glassmorphism, not neobrutalism, not "editorial" in the stuck-in-print
  sense. It's a sports club's news product — structured, confident, warm
  only where the brand color lets it be.
- Not a Material or shadcn clone. The 4px radius, the 300ms timing, the
  accent-bar-on-hover pattern, and the Quasimoda/Montserrat/Plex Mono trio
  are chosen together — swapping any of them breaks the voice.
- Not ornamental. Every decorative flourish (drop-cap, section rule, accent
  bar, oversized quote glyph, stencil monogram) is brand-specific and used
  in exactly one place. If you're about to invent a new green glow, ring,
  or sparkle: don't.
