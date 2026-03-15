# Design: MatchWidget + SectionDivider — Issue #812

**Date:** 2026-03-15
**Issue:** #812 (feat: next match widget — hero-style green section with diagonal cuts)
**Epic:** #807 (Visual redesign)
**Branch:** feat/812-match-widget

---

## Scope

1. New `SectionDivider` design-system component (reusable diagonal cuts for all sections)
2. New `MatchWidget` home component (replaces `UpcomingMatches` on homepage)
3. `FeaturedArticles` — add bottom diagonal cut
4. `LatestNews` — add top diagonal cut + `bg-gray-100 relative overflow-hidden`
5. `homepage/page.tsx` — wire `MatchWidget` in place of `UpcomingMatches`
6. Storybook stories for `SectionDivider` and `MatchWidget`
7. Tests for `MatchWidget`

---

## 1. SectionDivider

### Location

`apps/web/src/components/design-system/SectionDivider/`

### API

```typescript
interface SectionDividerProps {
  /** Background colour of the adjacent section this divider reveals */
  color: "white" | "gray-100" | "kcvv-black" | "kcvv-green-dark";
  /** Whether the cut sits at the top or bottom of its parent section */
  position: "top" | "bottom";
  className?: string;
}
```

### Mechanics

- Absolutely-positioned `<div aria-hidden="true">`
- Full width (`inset-x-0`), height `h-20` (80px) — produces ~3.6° angle at 1280px / ~12° on 375px (intentionally aggressive on mobile)
- `top-0` for `position="top"`, `bottom-0` for `position="bottom"`
- Inline `style={{ clipPath }}` — arbitrary Tailwind clip-path values don't compose cleanly with dynamic values
- **Top polygon:** `polygon(0 0, 100% 0, 100% 0%, 0 100%)` — right triangle at top, diagonal runs top-right → bottom-left
- **Bottom polygon:** `polygon(0 100%, 100% 100%, 100% 0%, 0 100%)` — right triangle at bottom, diagonal runs bottom-left → top-right
- Both triangles point the same direction → consistent site-wide diagonal language
- Parent section **must** have `relative overflow-hidden`
- Added to `src/components/design-system/index.ts` barrel

### Colour map

| `color` prop      | Tailwind class       |
| ----------------- | -------------------- |
| `white`           | `bg-white`           |
| `gray-100`        | `bg-gray-100`        |
| `kcvv-black`      | `bg-kcvv-black`      |
| `kcvv-green-dark` | `bg-kcvv-green-dark` |

### Storybook

`UI/SectionDivider` — stories:

- `TopWhite`, `TopGray100`, `TopKcvvBlack`, `TopKcvvGreenDark`
- `BottomWhite`, `BottomGray100`, `BottomKcvvBlack`, `BottomKcvvGreenDark`
- `PairExample` — two dividers showing how adjacent sections connect

---

## 2. MatchWidget

### Location

`apps/web/src/components/home/MatchWidget/`

### Files

- `MatchWidget.tsx`
- `MatchWidget.stories.tsx`
- `MatchWidget.test.tsx`
- `MatchWidget.mocks.ts`
- `index.ts`

### API

```typescript
interface MatchWidgetProps {
  /** The match to display — first result from BffService.getNextMatches() */
  match: UpcomingMatch;
  /** Label shown in the overline (default: "A-Ploeg") */
  teamLabel?: string;
}
```

`teamId` from the original issue spec is dropped in favour of `teamLabel` — the component identifies KCVV's side by checking which team name contains "KCVV" (using the existing `normalizeTeamName` convention).

### Layout

Section: `relative overflow-hidden bg-kcvv-green-dark`

**Padding:** `py-24` — intentional exception to the `py-20` section rule; the extra 16px clears the 80px diagonal so no content is obscured by the cut.

**Overline** (full width, centered):

```
VOLGENDE WEDSTRIJD · A-PLOEG
text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-white/50
flex items-center gap-2 justify-center mb-6
before/after: w-5 h-px bg-white/30 (decorative rules)
```

**3-column grid** (`grid-cols-[1fr_auto_1fr] gap-4 lg:gap-8 items-center`):

| Column | Mobile                        | Desktop                                |
| ------ | ----------------------------- | -------------------------------------- |
| Home   | `flex-col items-center gap-2` | `flex-col items-end text-right gap-3`  |
| Center | `flex-col items-center gap-1` | `flex-col items-center gap-2`          |
| Away   | `flex-col items-center gap-2` | `flex-col items-start text-left gap-3` |

**Team logos:** `w-12 h-12 lg:w-[72px] lg:h-[72px]` — `next/image` with fallback div (initials)
**Team names:** `text-[11px] sm:text-sm lg:text-2xl xl:text-3xl font-black uppercase tracking-tight line-clamp-2 text-white`
**VS:** `text-4xl lg:text-5xl font-black text-kcvv-green leading-none`
**Score (finished):** same size as VS, `font-mono text-white`

**Center column meta:**

- Date: `text-[11px] sm:text-xs lg:text-sm font-semibold text-white/70`
- Time: same
- Competition badge: `text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/40 px-2.5 py-0.5 rounded-sm mt-1`

**Special states:**

- `postponed` / `stopped`: centre col shows badge `UITGESTELD` / `GESTOPT` (orange: `bg-orange-500/15 text-orange-400`) instead of VS
- `forfeited`: badge `FF`

**SectionDividers:**

- Top: `<SectionDivider color="kcvv-black" position="top" />` — black triangle overlaid on green-dark
- Bottom: `<SectionDivider color="gray-100" position="bottom" />` — gray-100 triangle

### Storybook

`Features/Home/MatchWidget` — stories:

- `Upcoming` (default — scheduled match)
- `Finished` (with score, win)
- `Draw`
- `Postponed`
- `Forfeited`
- `LongTeamNames` (stress test for truncation)

### Tests (`MatchWidget.test.tsx`)

- Renders team names and logos
- Shows VS for scheduled match
- Shows score (home – away) for finished match
- Shows postponed badge
- Applies `teamLabel` to overline

---

## 3. FeaturedArticles — bottom diagonal

Section already has `relative overflow-hidden` ✅

Add at the **end** of the section JSX (after all content, inside `<section>`):

```tsx
<SectionDivider color="kcvv-green-dark" position="bottom" />
```

This overlays a green-dark triangle at the bottom of the black hero, creating the visual impression that the green MatchWidget section starts at a diagonal.

---

## 4. LatestNews — top diagonal

Add to section element:

- `relative overflow-hidden bg-gray-100` (bg needed for divider to contrast against)
- Update padding to `py-20` (align to redesign standard)

Add at the **start** of section JSX (before content container):

```tsx
<SectionDivider color="kcvv-green-dark" position="top" />
```

Content container gets `relative z-10` to render above divider.

---

## 5. Homepage page.tsx

Replace:

```tsx
<UpcomingMatches matches={upcomingMatches} title="Volgende wedstrijden" ... />
```

With:

```tsx
{
  upcomingMatches[0] && (
    <MatchWidget match={upcomingMatches[0]} teamLabel="A-Ploeg" />
  );
}
```

`UpcomingMatches` component stays — used on team/calendar pages.

---

## Mobile layout at 375px — verified

```
┌────────────────────────────────────────┐
│ [kcvv-black diagonal cut — 80px]       │  ← SectionDivider top
│                                        │
│   VOLGENDE WEDSTRIJD · A-PLOEG         │  ← overline
│                                        │
│  [logo]      VS       [logo]           │  ← 115px / 80px / 115px
│  KCVV     (text-4xl)  KVC              │
│  ELEWIJT              WILRIJK          │  ← text-[11px] fits ✅
│           Za 22 mrt                    │
│             15:00                      │
│         [3e Afd. VV]                   │
│                                        │
│ [gray-100 diagonal cut — 80px]         │  ← SectionDivider bottom
└────────────────────────────────────────┘
```

Angle: ~12° on mobile (aggressive), ~3.6° on 1280px desktop (per #807 spec).

---

## Build sequence

1. `SectionDivider` component + story + barrel export
2. `MatchWidget` component + mocks + story + tests
3. Update `FeaturedArticles` (add bottom divider)
4. Update `LatestNews` (add top divider + bg + relative + py-20)
5. Update `homepage/page.tsx`
6. Run `pnpm --filter @kcvv/web check-all`
