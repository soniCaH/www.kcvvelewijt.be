# Team & Board Page Redesign — Design Document

> **Date:** 2026-04-06
> **Status:** Draft — awaiting approval
> **Goal:** Bring team detail pages (`/ploegen/[slug]`) and board pages (`/club/bestuur`, `/club/jeugdbestuur`, `/club/angels`) into the KCVV design language used by `/club`, `/jeugd`, `/sponsors`.

## Problem Statement

The current team detail and board pages use `TeamHeader` (banner photo + overlapping white card) and a flat white content area with generic Radix tabs. This visual language:

- Has no diagonal transitions between sections
- Uses no background color alternation (everything sits on white)
- Uses a Material-ish card-overlap hero that doesn't exist anywhere else on the site
- Creates a jarring visual break when navigating from branded pages (`/club`, `/jeugd`) into these pages
- Wastes the dark-background potential that makes player cards and green accents dramatic

## Design Language Reference

The KCVV design language (as established by `/club`, `/jeugd`, `/sponsors`) is:

1. **SectionStack** — pages are composed of discrete sections with explicit backgrounds
2. **PageHero** — every page starts with a full/compact hero on `kcvv-black` with gradient overlay
3. **Color rhythm** — backgrounds alternate: `kcvv-black` → `gray-100` → `kcvv-green-dark` → `gray-100` (never two darks adjacent)
4. **Diagonal transitions** — SVG-based diagonal cuts between sections, alternating left/right direction
5. **SectionHeader** — green left-border accent bar on section titles
6. **SectionCta** — centered call-to-action as final section
7. **Typography** — `font-title font-black uppercase` for headlines, label+green-bar for context labels

## Key Constraint

KCVV does not have a professional photographer. Designs must look great with PSD player portraits, existing archive photos, and sponsor logos. Compensate with strong graphic/typographic design, solid color sections, and diagonal cuts.

---

## Part 1: Team Detail Page (`/ploegen/[slug]`)

### Current State

- `TeamHeader`: banner photo (200-400px), dark gradient overlay, overlapping white card with team name + coach info
- `UrlTabs`: generic Radix tabs (Info / Opstelling / Wedstrijden / Klassement)
- All tab content renders on white background
- No SectionStack, no transitions, no color alternation
- Footer transition assumes `gray-100` (but page content is white — subtle mismatch)

### Data Available Per Team

| Data             | A-team      | Youth       | Club boards |
| ---------------- | ----------- | ----------- | ----------- |
| Team photo       | Often       | Sometimes   | Rarely      |
| Players          | Yes (15-25) | Yes (12-20) | No          |
| Staff            | Yes (3-6)   | Yes (2-4)   | Yes (5-15)  |
| Matches          | Yes (30+)   | Sometimes   | No          |
| Standings        | Yes         | Sometimes   | No          |
| Description      | Sometimes   | Sometimes   | Sometimes   |
| Related articles | Yes         | Rarely      | No          |

---

### Approach 1: "Full Stack Scroll"

**Concept:** Replace the entire tabbed layout with a full-page `SectionStack` scroll. Each content type (roster, matches, standings) becomes its own branded section. No tabs — everything is visible on scroll.

**Section sequence:**

```text
╔═══════════════════════════════════════════╗
║  1. HERO (kcvv-black, 35vh compact)       ║
║                                           ║
║  Team photo as bg (darkened)              ║
║  No photo? → "dark" gradient fallback     ║
║                                           ║
║  ┌─ green bar + "Eerste ploeg"            ║
║  ├─ "KCVV ELEWIJT A"  (text-hero)        ║
║  ├─ "3de Provinciale A" (text-white/60)   ║
║  └─ CTA: "Bekijk de kalender" →          ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right, full overlap
╔═════════════╲═════════════════════════════╗
║  2. TEAM INFO (gray-100)                  ║
║                                           ║
║  Two-column layout (lg:grid-cols-[1fr,2fr])║
║                                           ║
║  ┌──────────┐  ┌─────────────────────────┐║
║  │ Coach    │  │ SectionHeader: "Info"    │║
║  │ Card     │  │                         │║
║  │ ┌──────┐ │  │ Description prose       │║
║  │ │ Photo│ │  │ (if available)          │║
║  │ └──────┘ │  │                         │║
║  │ Name     │  │ Contact info            │║
║  │ Role     │  │ (if available)          │║
║  └──────────┘  └─────────────────────────┘║
║                                           ║
║  Quick Stats Row (if data available):     ║
║  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     ║
║  │3de │ │12W │ │ 4D │ │ 2L │ │45G │     ║
║  │pos │ │won │ │draw│ │lost│ │goal│     ║
║  └────┘ └────┘ └────┘ └────┘ └────┘     ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal left
╔═════════════╲═════════════════════════════╗
║  3. ROSTER (kcvv-black)                   ║
║                                           ║
║  SectionHeader: "Spelers" (dark variant)  ║
║                                           ║
║  Position groups:                         ║
║  "Keepers (2)"                            ║
║  ┌────┐ ┌────┐                            ║
║  │Card│ │Card│  PlayerCard on dark bg     ║
║  └────┘ └────┘  (white cards pop!)        ║
║                                           ║
║  "Verdedigers (5)"                        ║
║  ┌────┐ ┌────┐ ┌────┐ ┌────┐             ║
║  │Card│ │Card│ │Card│ │Card│             ║
║  └────┘ └────┘ └────┘ └────┘             ║
║  ... etc for Middenvelders, Aanvallers    ║
║                                           ║
║  "Technische Staf (4)"                    ║
║  ┌────┐ ┌────┐ ┌────┐ ┌────┐             ║
║  │Card│ │Card│ │Card│ │Card│             ║
║  └────┘ └────┘ └────┘ └────┘             ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right
╔═════════════╲═════════════════════════════╗
║  4. MATCHES (gray-100)                    ║
║                                           ║
║  SectionHeader: "Wedstrijden"             ║
║    linkText: "Alle wedstrijden →"         ║
║    linkHref: "/kalender"                  ║
║                                           ║
║  Two sub-sections side by side (lg):      ║
║  ┌─────────────────┐ ┌─────────────────┐ ║
║  │ "Komende"       │ │ "Recent"        │ ║
║  │ MatchResultRow  │ │ MatchResultRow  │ ║
║  │ MatchResultRow  │ │ MatchResultRow  │ ║
║  │ MatchResultRow  │ │ MatchResultRow  │ ║
║  └─────────────────┘ └─────────────────┘ ║
║                                           ║
║  Mobile: stacked vertically               ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal left
╔═════════════╲═════════════════════════════╗
║  5. STANDINGS (kcvv-green-dark)           ║
║                                           ║
║  SectionHeader: "Klassement" (dark)       ║
║                                           ║
║  TeamStandings table                      ║
║  Header row: white text on green bg       ║
║  KCVV row: bg-white/20 highlight          ║
║  Other rows: bg-white/5                   ║
║  Hover: bg-white/10                       ║
║  All text: white                          ║
║  Form badges: same W/D/L colors           ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right
╔═════════════╲═════════════════════════════╗
║  6. RELATED ARTICLES (gray-100)           ║
║  (only if articles exist)                 ║
║                                           ║
║  SectionHeader: "Nieuws"                  ║
║  HorizontalSlider of ArticleCards         ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal left
╔═════════════╲═════════════════════════════╗
║  7. CTA (kcvv-green-dark)                 ║
║                                           ║
║  SectionCta:                              ║
║  "Word lid van KCVV Elewijt"              ║
║  "Kom spelen bij de plezantste..."        ║
║  [Word lid] button                        ║
║                                           ║
╚═══════════════════════════════════════════╝
   → footer transition (kcvv-green-dark → footer)
```

**Adaptive behavior:**

- Sections only render if data exists (youth team with no matches → no matches section)
- When roster is empty and only staff exists → staff renders in the info section instead
- When there's no standings → skip that section, CTA follows matches directly
- Minimum: Hero + Info + CTA (3 sections for the sparsest team)
- Maximum: Hero + Info + Roster + Matches + Standings + Articles + CTA (7 sections)

**Standings on green — visual spec:**

- The current `TeamStandings` component has a green header row on white rows
- On `kcvv-green-dark` background, flip this: all rows become semi-transparent white (`bg-white/5`)
- Header row: `bg-white/15` with white text
- KCVV row: `bg-kcvv-green-bright` text-white (pops against the dark green)
- Borders: `border-white/10` instead of `border-gray-200`
- Form badges: keep current colors (green/yellow/red are universal)

**Quick stats row — visual spec:**

- 5 stat cards in a horizontal row (flex, gap-4, overflow-x-auto on mobile)
- Each card: `bg-white rounded-sm p-4 text-center shadow-sm`
- Large number: `font-title font-bold text-2xl text-kcvv-black`
- Label: `text-xs text-kcvv-gray uppercase tracking-label mt-1`
- Stats: Standing position, Wins, Draws, Losses, Goals scored
- Only render if standings/match data is available

**Matches split — visual spec:**

- Two-column grid on lg: `lg:grid-cols-2 gap-8`
- "Komende" column: next 3-5 scheduled matches
- "Recent" column: last 3-5 played matches, most recent first
- Each with a small heading: `text-sm font-bold uppercase tracking-label text-kcvv-gray mb-4`
- `MatchResultRow` components with light theme (white cards on gray-100)
- If only upcoming or only past matches: single column, centered

**Pros:**

- Maximum brand consistency — identical visual language to `/jeugd`
- Player cards on `kcvv-black` look dramatic (the green accents, stencil badges, white cards pop)
- Standings on `kcvv-green-dark` is a unique, memorable treatment
- Adaptive section count prevents empty pages for youth teams
- All content visible = better SEO, no hidden tab content

**Cons:**

- Long scroll for A-team (roster + 30+ match rows + standings + articles)
- No quick navigation between content types
- Match section limited to 5+5 (needs "view all" link to full calendar)

---

### Approach 2: "Anchor Scroll"

**Concept:** Same full SectionStack as Approach 1, but with a sticky anchor navigation bar that appears when scrolling past the hero. Links scroll to section anchors — all content is still rendered (no tabs).

**Section sequence:** Identical to Approach 1, with one addition:

```text
╔═══════════════════════════════════════════╗
║  1. HERO (kcvv-black, 35vh compact)       ║
║  Same as Approach 1                       ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right, full overlap

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ANCHOR BAR (sticky, kcvv-black)         ┃
┃  Position: fixed, top: 67px (below       ┃
┃  AccentStrip 3px + PageHeader 64px)      ┃
┃  z-index: 48 (below nav z-50)           ┃
┃                                          ┃
┃  Visual:                                 ┃
┃  bg-kcvv-black/95 backdrop-blur-sm       ┃
┃  border-b border-white/10               ┃
┃  py-3                                    ┃
┃                                          ┃
┃  Content (max-w-inner-lg mx-auto):       ┃
┃  ┌──────┬─────────┬────────────┬───────┐ ┃
┃  │ Info │ Spelers │ Wedstrijden│Klass. │ ┃
┃  └──────┴─────────┴────────────┴───────┘ ┃
┃                                          ┃
┃  Link styling:                           ┃
┃  text-xs font-bold uppercase             ┃
┃  tracking-[0.1em]                        ┃
┃  text-white/50 → hover:text-white/80     ┃
┃  Active: text-white,                     ┃
┃    border-b-2 border-kcvv-green-bright   ┃
┃                                          ┃
┃  Visibility:                             ┃
┃  Hidden until hero scrolls out of view   ┃
┃  (IntersectionObserver on hero element)  ┃
┃  Enters with translateY animation        ┃
┃                                          ┃
┃  Mobile:                                 ┃
┃  Horizontal scroll, no wrapping          ┃
┃  Same styling, smaller gap               ┃
┃                                          ┃
┃  Anchor links only render for sections   ┃
┃  that exist (no "Klassement" link if     ┃
┃  no standings data)                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╔═══════════════════════════════════════════╗
║  2-7. Same sections as Approach 1         ║
║  Each section has an id= attribute        ║
║  for scroll-to anchoring:                ║
║  id="info" / id="spelers" /              ║
║  id="wedstrijden" / id="klassement"      ║
╚═══════════════════════════════════════════╝
```

**Scroll behavior:**

- `scroll-behavior: smooth` on the page
- `scroll-margin-top: calc(67px + 48px + 1rem)` on each section anchor (AccentStrip + PageHeader + AnchorBar + breathing room)
- Active section detection via `IntersectionObserver` with `rootMargin: "-120px 0px -60% 0px"` (triggers when section enters upper third of viewport)
- Only sections with data get an anchor link

**Anchor bar appearance:**

- The bar itself is dark (`kcvv-black/95`) to visually continue the PageHeader
- Separated by a subtle `border-b border-white/10`
- `backdrop-blur-sm` adds a frosted glass effect when content scrolls behind it
- Links use the same typography as the PageHero label: `text-xs font-bold uppercase tracking-[0.1em]`
- Active indicator matches `SectionHeader`'s green left-border: a `border-b-2 border-kcvv-green-bright`

**Pros:**

- All the visual benefits of Approach 1 (dark roster, green standings, diagonal rhythm)
- Quick navigation for data-heavy A-team pages
- All content rendered = SEO-friendly
- Anchor links in URL = shareable direct section links (`/ploegen/a-team#klassement`)
- Anchor bar is itself a design element that extends the dark header aesthetic

**Cons:**

- Most complex to implement (IntersectionObserver, sticky positioning, scroll-margin)
- Z-index management needs care (3 stacked sticky elements)
- On mobile the anchor bar takes up screen space (48px) — acceptable but not free
- For youth teams with only 2-3 sections, the anchor bar feels excessive (could auto-hide when < 3 sections)

---

### Approach 3: "Hero Tabs"

**Concept:** Keep the tabbed UX but replace `TeamHeader` with `PageHero` and wrap everything in a `SectionStack`. Tab content stays on a single background but the page envelope (hero + CTA) is fully branded.

**Section sequence:**

```text
╔═══════════════════════════════════════════╗
║  1. HERO (kcvv-black, 35vh compact)       ║
║                                           ║
║  Same PageHero as Approaches 1/2          ║
║  Team photo bg, team name, division       ║
║                                           ║
║  Additional element below headline:       ║
║  Coach pill (inline with hero content):   ║
║  ┌─────────────────────────────────┐      ║
║  │ 👤 Coach Name · Trainer        │      ║
║  │ bg-white/10 backdrop-blur-sm   │      ║
║  │ rounded-full px-4 py-2        │      ║
║  │ text-white/80 text-sm         │      ║
║  └─────────────────────────────────┘      ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right, full overlap
╔═════════════╲═════════════════════════════╗
║  2. TAB AREA (gray-100)                   ║
║                                           ║
║  Branded Tab Bar:                         ║
║  ┌─────────────────────────────────────┐  ║
║  │ max-w-inner-lg mx-auto              │  ║
║  │                                     │  ║
║  │ ┌──────┬──────────┬────────┬──────┐ │  ║
║  │ │ Info │ Spelers  │Wedstr. │Klass.│ │  ║
║  │ └──┬───┴──────────┴────────┴──────┘ │  ║
║  │    │  ← green bottom border (4px)   │  ║
║  │ border-b border-gray-200            │  ║
║  └─────────────────────────────────────┘  ║
║                                           ║
║  Tab trigger styling:                     ║
║  font-body font-bold uppercase            ║
║  text-sm tracking-[0.05em]                ║
║  text-kcvv-gray → hover:text-kcvv-black   ║
║  Active: text-kcvv-green-dark             ║
║    border-b-4 border-kcvv-green-bright    ║
║  px-1 py-4 (generous click target)        ║
║  gap-8 between tabs                       ║
║                                           ║
║  Tab Content Panel:                       ║
║  max-w-inner-lg mx-auto px-4 md:px-10    ║
║  py-12                                    ║
║                                           ║
║  ┌─────────────────────────────────────┐  ║
║  │ INFO TAB:                           │  ║
║  │ Two-column: Coach card + Prose      │  ║
║  │ Quick stats row (if standings)      │  ║
║  │ Same layout as Approach 1 Info      │  ║
║  ├─────────────────────────────────────┤  ║
║  │ SPELERS TAB:                        │  ║
║  │ Position-grouped grid               │  ║
║  │ PlayerCards (default size)          │  ║
║  │ Staff section below                 │  ║
║  ├─────────────────────────────────────┤  ║
║  │ WEDSTRIJDEN TAB:                    │  ║
║  │ Upcoming / Recent split             │  ║
║  │ MatchResultRow components           │  ║
║  │ "Bekijk alle wedstrijden →" link    │  ║
║  ├─────────────────────────────────────┤  ║
║  │ KLASSEMENT TAB:                     │  ║
║  │ TeamStandings table                 │  ║
║  │ Standard light theme (green header) │  ║
║  └─────────────────────────────────────┘  ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal left
╔═════════════╲═════════════════════════════╗
║  3. RELATED ARTICLES (kcvv-black)         ║
║  (only if articles exist)                 ║
║                                           ║
║  SectionHeader: "Nieuws" (dark variant)   ║
║  HorizontalSlider of ArticleCards         ║
║  Cards with dark theme                    ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right
╔═════════════╲═════════════════════════════╗
║  4. CTA (kcvv-green-dark)                 ║
║                                           ║
║  SectionCta: "Word lid"                   ║
║  White text on green                      ║
║  White button with green hover            ║
║                                           ║
╚═══════════════════════════════════════════╝
   → footer transition
```

**Tab bar visual details:**

- Tab triggers sit in a `flex gap-8` row
- Bottom border: `border-b border-gray-200` (full width separator)
- Active tab: green bottom border extends below the gray separator, creating a "selected" look
- The 4px green border matches the `SectionHeader` left-border weight — consistent accent language
- Tabs dynamically render: no data = no tab (same as current behavior)
- URL synced via query param (`?tab=spelers`) for shareability

**Coach pill in hero:**

- Inline element within the PageHero content area
- Positioned below the body text, above the CTA
- `bg-white/10 backdrop-blur-sm rounded-full px-4 py-2`
- Lucide `User` icon (16px) + coach name + separator + role
- `text-white/80 text-sm font-medium`
- Only renders if coach data exists

**Pros:**

- Familiar tabbed UX — less scrolling for data-heavy teams
- Hero + diagonal + CTA sections create branded envelope
- Tab bar styling is branded (green accent, uppercase, tracking)
- Simplest implementation — reuses existing `UrlTabs` with restyled triggers
- Coach info moves into hero (no separate card needed)

**Cons:**

- Tab content panel is one uniform gray-100 — no dark roster section, no green standings
- Player cards on gray-100 have less visual drama than on kcvv-black
- Page is "branded wrapper around generic content" rather than "fully branded page"
- Hidden tab content is not visible to search engines on initial render (URL tabs mitigate this)

---

## Part 2: Board Pages (`/club/bestuur`, `/club/jeugdbestuur`, `/club/angels`)

### Current State

- `TeamHeader` with `teamType="club"` (amber badge, banner photo, overlapping white card)
- `BestuurPage` renders: optional description (green left-border), TeamRoster (staff cards), organigram CTA
- All on white background, no transitions, no SectionStack
- Board pages are simpler: no matches, no standings, just people

### Data Available

- **Team photo**: Rarely (most board pages use a generic/group photo or nothing)
- **Staff members**: 5-15 people with name, role, optional photo
- **Description**: Optional HTML block about the board
- **No players, no matches, no standings**

---

### Approach A: "Clean Section Flow"

**Concept:** Simple 3-4 section SectionStack. Hero + members + CTA. Clean, minimal, fully branded.

**Section sequence:**

```text
╔═══════════════════════════════════════════╗
║  1. HERO (kcvv-black, 35vh compact)       ║
║                                           ║
║  PageHero with:                           ║
║  label: "De club"                         ║
║  headline: "Bestuur" (or "Jeugdbestuur")  ║
║  body: "De mensen achter KCVV Elewijt"    ║
║  gradient: "dark" (no photo available)    ║
║  If photo available: darken as bg         ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right, full overlap
╔═════════════╲═════════════════════════════╗
║  2. MEMBERS (gray-100)                    ║
║                                           ║
║  Optional description block:              ║
║  ┌─────────────────────────────────────┐  ║
║  │ border-l-4 border-kcvv-green-bright │  ║
║  │ pl-6 mb-12                          │  ║
║  │ prose prose-gray                    │  ║
║  │ "Het bestuur van KCVV Elewijt..."   │  ║
║  └─────────────────────────────────────┘  ║
║                                           ║
║  SectionHeader: "Ons bestuur"             ║
║                                           ║
║  Staff cards in grid:                     ║
║  grid-cols-1 sm:grid-cols-2              ║
║  lg:grid-cols-3 xl:grid-cols-4           ║
║  gap-6                                    ║
║                                           ║
║  ┌────┐ ┌────┐ ┌────┐ ┌────┐            ║
║  │Card│ │Card│ │Card│ │Card│            ║
║  │Voorz│ │Secr│ │Pnmr│ │Lid │            ║
║  └────┘ └────┘ └────┘ └────┘            ║
║  ┌────┐ ┌────┐ ┌────┐ ┌────┐            ║
║  │Card│ │Card│ │Card│ │Card│            ║
║  └────┘ └────┘ └────┘ └────┘            ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal left
╔═════════════╲═════════════════════════════╗
║  3. ORGANIGRAM CTA (kcvv-green-dark)      ║
║                                           ║
║  SectionCta (white text on green):        ║
║  heading: "Wie doet wat?"                 ║
║  body: "Bekijk het volledige organigram"  ║
║  button: "Organigram bekijken" →          ║
║  href: "/club/organigram"                 ║
║                                           ║
╚═══════════════════════════════════════════╝
   → footer transition (kcvv-green-dark → footer)
```

**Staff card treatment:**

- Same `PlayerCard`/staff card component as today (white card, navy badge, name, role)
- Cards on `gray-100` background (clean, professional)
- No grouping by role (board members don't have position groups like players)
- Sort order: determined by CMS / PSD order (voorzitter first, then alphabetical)

**Pros:**

- Simplest approach — only 3 sections, clean and focused
- Fully branded with minimal implementation effort
- Works well even when no team photo exists (gradient fallback hero)
- The green CTA at the bottom ties back to the organigram — creates a natural flow

**Cons:**

- All members on one gray background — can feel like a long grid for large boards
- No visual hierarchy between roles (voorzitter looks same as regular lid)
- Minimal visual interest if board has many members without photos

---

### Approach B: "Dark Roster Spotlight"

**Concept:** Split the page into description (light) and members (dark). The dark background makes staff cards dramatic — navy badges and white cards pop against `kcvv-black`.

**Section sequence:**

```text
╔═══════════════════════════════════════════╗
║  1. HERO (kcvv-black, 35vh compact)       ║
║                                           ║
║  Same as Approach A                       ║
║  PageHero compact, "dark" gradient        ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right, full overlap
╔═════════════╲═════════════════════════════╗
║  2. ABOUT (gray-100)                      ║
║  (only if description exists)             ║
║                                           ║
║  Description block with green left border ║
║  border-l-4 border-kcvv-green-bright      ║
║  pl-6, max-w-3xl                          ║
║  prose prose-gray                         ║
║                                           ║
║  "Het bestuur van KCVV Elewijt staat in   ║
║   voor het dagelijks beheer van de club..." ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal left
╔═════════════╲═════════════════════════════╗
║  3. MEMBERS (kcvv-black)                  ║
║                                           ║
║  SectionHeader: "Ons bestuur" (dark)      ║
║                                           ║
║  Staff cards on dark background:          ║
║  White cards POP against kcvv-black       ║
║  Navy NumberBadge codes visible           ║
║  Card shadows more pronounced            ║
║                                           ║
║  ┌────┐ ┌────┐ ┌────┐ ┌────┐            ║
║  │████│ │████│ │████│ │████│  white      ║
║  │████│ │████│ │████│ │████│  cards on   ║
║  │Voorz│ │Secr│ │Pnmr│ │Lid │  dark bg   ║
║  └────┘ └────┘ └────┘ └────┘            ║
║                                           ║
║  Optional: "Meer info? Neem contact op"   ║
║  inline link to /hulp                     ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right
╔═════════════╲═════════════════════════════╗
║  4. ORGANIGRAM CTA (kcvv-green-dark)      ║
║                                           ║
║  Same SectionCta as Approach A            ║
║                                           ║
╚═══════════════════════════════════════════╝
   → footer transition
```

**Dark card treatment:**

- The staff cards themselves stay white (card bg, text colors unchanged)
- The _section background_ is dark — creating contrast
- Card `shadow-sm` becomes more visible against dark
- Card border (`border-foundation-gray-light`) still works — subtle frame on dark
- The overall effect: white floating cards on a dark canvas

**When description is missing:**

- Skip the "About" section entirely
- Page becomes: Hero (black) → Members (black) → CTA (green)
- Since hero and members are both `kcvv-black`, SectionStack won't render a transition between them (same bg = no transition)
- This creates one long dark zone from hero through roster — dramatic but potentially monotone
- Alternative: insert a thin visual break (a green accent line or a `gray-100` spacer section)

**Pros:**

- Dramatic visual impact — the dark section is the KCVV signature
- 4 sections with good color rhythm: black → gray → black → green
- Staff cards without photos look better on dark (the gray placeholder blends less awkwardly)
- Matches the team pages' roster treatment (if we go with Approach 1 or 2 for teams)

**Cons:**

- When no description exists, the dark-on-dark hero→members needs a workaround
- Slightly more complex than Approach A (one extra section)
- Some might find the dark aesthetic too heavy for a "board members" page

---

### Approach C: "Featured Leader + Grid"

**Concept:** Highlight the primary leader (voorzitter, jeugdcoördinator) in a large featured card, then show remaining members in a compact grid. Creates visual hierarchy within the people.

**Section sequence:**

```text
╔═══════════════════════════════════════════╗
║  1. HERO (kcvv-black, 35vh compact)       ║
║                                           ║
║  Same PageHero as Approaches A/B          ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right, full overlap
╔═════════════╲═════════════════════════════╗
║  2. FEATURED LEADER (gray-100)            ║
║                                           ║
║  SectionHeader: "Voorzitter" (or role)    ║
║                                           ║
║  Large featured card (centered):          ║
║  ┌────────────────────────────────────┐   ║
║  │  max-w-3xl mx-auto                │   ║
║  │  bg-white rounded-sm shadow-sm    │   ║
║  │  grid grid-cols-1 md:grid-cols-   │   ║
║  │  [280px,1fr]                      │   ║
║  │                                    │   ║
║  │  ┌──────────┐  ┌────────────────┐ │   ║
║  │  │          │  │ First name     │ │   ║
║  │  │  Large   │  │ (semibold, 3xl)│ │   ║
║  │  │  Photo   │  │ Last name      │ │   ║
║  │  │  or      │  │ (thin, 3xl)    │ │   ║
║  │  │  Silh.   │  │                │ │   ║
║  │  │          │  │ "Voorzitter"   │ │   ║
║  │  │  aspect  │  │ (green text)   │ │   ║
║  │  │  [3/4]   │  │                │ │   ║
║  │  │          │  │ Optional quote │ │   ║
║  │  │          │  │ or description │ │   ║
║  │  │          │  │ (gray prose)   │ │   ║
║  │  └──────────┘  └────────────────┘ │   ║
║  │                                    │   ║
║  │  Green top accent (3px)           │   ║
║  └────────────────────────────────────┘   ║
║                                           ║
║  Optional description block below card:   ║
║  border-l-4 green, prose                  ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal left
╔═════════════╲═════════════════════════════╗
║  3. REST OF BOARD (kcvv-black)            ║
║                                           ║
║  SectionHeader: "Bestuursleden" (dark)    ║
║                                           ║
║  Compact staff card grid:                 ║
║  grid-cols-2 md:grid-cols-3 lg:grid-cols-4║
║  gap-4 (tighter than default)             ║
║                                           ║
║  ┌───┐ ┌───┐ ┌───┐ ┌───┐                ║
║  │ S │ │ P │ │ L │ │ L │  compact size   ║
║  │ecr│ │nmr│ │id │ │id │  200px img      ║
║  └───┘ └───┘ └───┘ └───┘                ║
║  ┌───┐ ┌───┐ ┌───┐ ┌───┐                ║
║  │ L │ │ L │ │ L │ │ L │                ║
║  │id │ │id │ │id │ │id │                ║
║  └───┘ └───┘ └───┘ └───┘                ║
║                                           ║
╚═══════════╲═══════════════════════════════╝
             ╲  diagonal right
╔═════════════╲═════════════════════════════╗
║  4. ORGANIGRAM CTA (kcvv-green-dark)      ║
║                                           ║
║  Same SectionCta as Approaches A/B        ║
║                                           ║
╚═══════════════════════════════════════════╝
   → footer transition
```

**Featured card visual details:**

- `max-w-3xl mx-auto` centered container
- `bg-white rounded-sm shadow-sm overflow-hidden` card
- Green 3px top accent bar (matches PlayerCard language)
- Two-column on md+: photo (280px fixed width) + content
- Single column on mobile: photo full width, content below
- Photo: `aspect-[3/4]`, `object-cover object-top`, same treatment as PlayerCard
- Name: `font-title text-3xl uppercase` — first name semibold, last name thin (same as PlayerCard but larger)
- Role: `text-kcvv-green-dark text-lg font-bold uppercase tracking-label`
- Quote/description: `text-kcvv-gray text-base leading-relaxed mt-4` (optional — sourced from team description or left empty)

**Who gets featured?**

- Convention: first staff member in CMS order = featured
- Or: the member with the highest-ranking role (Voorzitter > Secretaris > Penningmeester > Lid)
- Could also be a CMS flag in Sanity (e.g., `featured: true` on the staff member)

**Rest of board — compact treatment:**

- Uses compact variant of staff cards (`variant="compact"`)
- Tighter grid (4 columns on lg vs 3 for default)
- 200px fixed image height
- Smaller text sizes
- On dark background for contrast with the featured card's light section

**Pros:**

- Clear leadership hierarchy — visitors immediately see who's in charge
- The featured card treatment mirrors how `/ploegen` features the A-team in a large hero
- Compact grid for remaining members keeps the page tight
- Strong visual rhythm: black hero → gray featured → black grid → green CTA

**Cons:**

- Requires knowing which person to feature (convention or CMS flag)
- If the featured person has no photo, the large card feels empty (mitigate with navy badge + large stencil role code)
- Not all board pages have a clear single leader (Angels? Ultras?)
- More design work than A or B (new FeaturedStaffCard component)

---

## Comparison Matrix

### Team Detail Pages

| Aspect                    | Approach 1: Full Stack | Approach 2: Anchor Scroll | Approach 3: Hero Tabs  |
| ------------------------- | ---------------------- | ------------------------- | ---------------------- |
| Brand consistency         | Full                   | Full                      | Partial (wrapper only) |
| Dark roster section       | Yes                    | Yes                       | No                     |
| Green standings           | Yes                    | Yes                       | No                     |
| Quick navigation          | No                     | Yes (sticky bar)          | Yes (tabs)             |
| Scroll length             | Long                   | Long (with shortcuts)     | Short (tabbed)         |
| SEO (all content visible) | Yes                    | Yes                       | Partial (URL tabs)     |
| Implementation complexity | Low                    | High                      | Low-Medium             |
| Works for sparse teams    | Great (sections skip)  | OK (bar auto-hides)       | Great (tabs skip)      |
| Diagonal transitions      | 5-6                    | 5-6                       | 2                      |
| Mobile experience         | Good scroll            | Good (bar takes space)    | Good (compact)         |

### Board Pages

| Aspect                | Approach A: Clean    | Approach B: Dark Roster | Approach C: Featured Leader |
| --------------------- | -------------------- | ----------------------- | --------------------------- |
| Brand consistency     | Full                 | Full                    | Full                        |
| Visual drama          | Medium               | High                    | High                        |
| Implementation effort | Low                  | Low                     | Medium (new component)      |
| Works without photos  | Good (gradient hero) | Great (dark hides gaps) | OK (large empty card risk)  |
| Visual hierarchy      | Flat                 | Flat                    | Strong (leader stands out)  |
| Section count         | 3                    | 3-4                     | 4                           |
| Diagonal transitions  | 2                    | 2-3                     | 3                           |
| Best for              | Simple boards        | All boards              | Boards with clear leader    |

---

## Recommendations

**Team detail pages:** Approach 2 (Anchor Scroll) for best balance of visual impact and usability, with graceful degradation to Approach 1 behavior when < 3 sections exist (hide anchor bar).

**Board pages:** Approach B (Dark Roster) for maximum visual impact with minimal implementation effort. Works especially well given the "no professional photography" constraint — dark backgrounds are more forgiving.

**Shared benefit:** If teams use Approach 1/2 and boards use Approach B, the roster-on-dark treatment becomes a consistent pattern across both page types — reinforcing the design language.
