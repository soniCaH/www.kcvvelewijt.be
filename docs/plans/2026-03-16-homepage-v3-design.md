# Homepage v3 — Design

**Date:** 2026-03-16
**Status:** Approved
**Scope:** Complete homepage redesign — all blocks finalised, ready for mockup (v3 HTML) and implementation

---

## 1. Process

- Build `docs/mockups/homepage-v3.html` to lock in the full design
- Once approved, implement block-by-block in Next.js
- Other pages: brainstorm with Claude per page before implementing — homepage establishes the visual contract

---

## 2. Section Structure

```
Accent strip (3px kcvv-green)           sticky
Nav (kcvv-black)                         sticky
─────────────────────────────────────────────────
Hero — FeaturedArticles carousel         dark / kcvv-black
  └─ diagonal bottom cut ▿
─────────────────────────────────────────────────
[BANNER SLOT A — optional]               flat, contained
─────────────────────────────────────────────────
Match Widget — next A-team match         kcvv-green-dark, diagonals top+bottom
─────────────────────────────────────────────────
News — image overlay cards               gray-100
  └─ featured slot: article OR event
─────────────────────────────────────────────────
[BANNER SLOT B — optional]               flat, contained
─────────────────────────────────────────────────
Match Slider — all teams → /calendar     kcvv-black, diagonal top
─────────────────────────────────────────────────
Youth — stat block + jersey photo        kcvv-green-dark, diagonals top+bottom
─────────────────────────────────────────────────
[BANNER SLOT C — optional]               flat, contained
─────────────────────────────────────────────────
Sponsors — logo grid                     kcvv-black
─────────────────────────────────────────────────
Footer                                   kcvv-black
```

### Diagonal cut strategy

Each section owns its own diagonal pseudo-elements (`::before` / `::after`). Banner slots are flat rectangles — they sit between sections with `py-8` breathing room on the surrounding section's background. When a banner is absent, adjacent sections compose their diagonals normally. Banner slots never carry diagonal cuts themselves.

---

## 3. Block Designs

### 3.1 Accent strip + Nav

No changes from v2. Keep as-is.

### 3.2 Hero — FeaturedArticles carousel

No changes from v2. Keep as-is.

### 3.3 Banner Slots (A, B, C)

- Wide image provided by editor (campaign/sponsor supplies the image with all text and branding baked in)
- Contained within `max-width` container — not full bleed
- `rounded` (4px) corners, subtle `box-shadow`
- Optional `<a>` wrapper when link configured, plain `<div>` when not
- Sits on surrounding section's background — no dedicated bg color
- `py-8` vertical spacing
- **Hidden entirely when no banner configured in Sanity**

**Sanity schema fields:** `image` (required), `href` (optional), `alt` (required for a11y)

### 3.4 Match Widget

No changes from v2. Keep as-is. Data source: BFF `/matches` (A-team next match).

### 3.5 News section — image overlay cards

Keep v2 styling. One change: the featured card slot (`card--featured`, spanning 2 columns) can render as either an **article card** or an **event card** depending on whether an upcoming event exists.

**Featured event card variant:**

- Same `card--featured` dimensions and image overlay structure as article card
- Background: event image if available; fallback to jersey chevron pattern on `kcvv-black` (no blank gray)
- Top-left badge: "EVENEMENT" pill in `kcvv-green` — visually distinct from article category badge
- Content overlay (bottom):
  - Event title in same large bold type as article card
  - Date/time strip using Lucide `Calendar` + `Clock` SVG icons — no emojis
  - Optional 2-line excerpt (same `-webkit-line-clamp: 2` as article cards)
- Footer bar: right-aligned countdown chip ("over 33 dagen") — uppercase, muted bg, small text; same style as competition badge on match widget
- External link indicator: Lucide `ExternalLink` icon shown when `href` present; card is non-interactive when absent
- Hover: same green top-border slide-in as article cards (only when link present)

**Logic:** query Sanity events ordered by date — show next upcoming event if `featuredOnHome: true` is set on any event, else fall back to next upcoming event by date, else fall back to featured article card.

### 3.6 Match Slider section

Replaces the v2 match schedule list (which is **preserved separately** for reuse on other pages).

**Section wrapper:**

- Background: `kcvv-black`, diagonal top cut from gray-100
- Section header: "Wedstrijden" with green left-border title, white text — `/calendar` link right-aligned as `section-link--dark`
- Prev/next arrow buttons: `rounded-sm` (2px), `kcvv-black` bg with `kcvv-green` border + green Lucide chevron icon

**`MatchTeaser` — dark-theme reskin:**

- `kcvv-black` bg, `border border-white/8`, `rounded` (4px)
- Date/time: `white/70`
- Team names: `white/85`; highlighted KCVV team name in full `white` bold
- Team logos rendered; fallback initial letter adapted for dark bg
- Score: `white` bold monospace; winning side's score in `kcvv-green`
- VS separator: `white/30`
- Status badges (postponed/stopped): adapted for dark bg
- W/L/D result chips: green/15 + green, red/15 + red, yellow/15 + yellow

**New `teamLabel` prop on `MatchTeaser`:**

- `teamLabel?: string` — e.g. `"A-Ploeg"`, `"U21"`
- Rendered as small `kcvv-green` uppercase badge, top-left of card, above date row
- No space reserved when absent

**Data:** reuses match data already fetched on the homepage (same fetch as Match Widget — no second request). Sorted chronologically across all teams. Calling page responsible for mapping team ID → label string.

### 3.7 Youth section — stat block + jersey photo

- Background: `kcvv-green-dark`, diagonal top+bottom cuts
- Optional jersey chevron pattern at ~4% opacity as full-bleed texture

**Layout (single centered column, `max-w-3xl`, `text-center`):**

1. Section label: "Jeugd" — centered, white, section-title style
2. Stat row:
   - `220+` / "SPELERS" and `16` / "PLOEGEN" side by side
   - Numbers: `clamp(4rem, 10vw, 8rem)`, `font-weight: 900`, `kcvv-green`, display/stencil font
   - Labels: `text-xs tracking-widest uppercase white/50`
   - Separated by thin vertical `white/15` divider
3. Jersey photo: high-def youth jerseys image, centered, `max-w-lg`, clean with subtle drop shadow — no gradient overlay. Optional very slight `rotate-1` for editorial energy.
4. CTA: `btn--primary` "Ontdek onze jeugd" → `/jeugd`, centered below photo

### 3.8 Sponsors section

- Background: `kcvv-black`
- Section header: "Sponsors" with green left-border title, white text; "Word sponsor →" link right-aligned in `kcvv-green`
- Layout: single centered flex row, `flex-wrap`, generous gap
- Logos: transparent bg, `grayscale(100%) opacity-50` default → `grayscale(0) opacity-100` on hover, smooth transition
- Each logo: `<a href={sponsor.url}>` when URL present, plain `<div>` when not — no visual difference

### 3.9 Footer

- Background: `kcvv-black`, `border-top: 1px solid white/6`
- Grid: brand column (2fr) + 2–3 link columns (TBD at implementation)
- Bottom bar: copyright left, privacy policy link right — `white/25`

**Brand column:**

- KCVV logo (`kcvv-logo.png`, ~56px tall)
- Club name "K.C.V.V. Elewijt" white, "Opgericht in 1964" `white/30`
- Contact block (Lucide icons, `white/50` text):
  - `MapPin` — Driesstraat 32, 1982 Elewijt
  - `Mail` — info@kcvvelewijt.be
- Social icon links (`white/30` → `kcvv-green` on hover):
  - `Facebook` (Lucide)
  - `Instagram` (Lucide)

---

## 4. Components to Create / Modify

| Component           | Change                                                          |
| ------------------- | --------------------------------------------------------------- |
| `MatchTeaser`       | Add `teamLabel?: string` prop; add dark-theme variant styling   |
| `MatchesSlider`     | Restyle arrows for dark theme; pass `teamLabel` from match data |
| `FeaturedEventCard` | New — variant of news featured card                             |
| `BannerSlot`        | New — image + optional link, contained                          |
| `YouthSection`      | New homepage block component                                    |
| `SponsorsSection`   | Restyle — grayscale/hover treatment                             |
| `PageFooter`        | Add contact info, social icons, logo                            |

---

## 5. Sanity Schema Changes

| Document             | Change                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `event`              | Add optional `featuredOnHome: boolean` (defaults false; falls back to next upcoming event) |
| `banner`             | New document: `image` (required), `href` (optional), `alt` (required)                      |
| `homePage` singleton | Add `bannerSlotA`, `bannerSlotB`, `bannerSlotC` references to `banner`                     |

---

## 6. Data / Fetch Strategy

- **Match Widget + Match Slider** share a single fetch — homepage fetches all upcoming matches once, passes data to both components as props. No duplicate requests.
- **Featured event** — Sanity query: next event where `featuredOnHome == true`, fallback to earliest upcoming event by date.
- **Banner slots** — Sanity query on homepage singleton, resolve references.
- **Sponsors** — existing Sanity sponsors query, unchanged.

---

## 7. Implementation Notes

- The v2 match schedule list (`.section-schedule` / `.match-list` / `.match-row`) is **preserved** — not deleted. Will be reused on team/calendar pages.
- `MatchTeaser` dark-theme: determine at implementation whether to use a `theme` prop (`"light" | "dark"`) or Tailwind `dark:` variant scoped to the section wrapper.
- Jersey photo for youth section: confirm filename in `public/images/` before implementation.
- Banner slot diagonal handling: sections adjacent to banner slots keep their own diagonal pseudo-elements unchanged. The banner's `py-8` provides visual separation.
