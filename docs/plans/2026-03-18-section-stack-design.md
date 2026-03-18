# SectionStack System — Design

**Date:** 2026-03-18
**Status:** Approved
**Replaces:** `SectionDivider` component (deprecated, to be removed)

---

## Problem

Section components (`MatchWidget`, `LatestNews`, `MatchesSliderSection`, `YouthSection`, etc.) currently self-manage their diagonal transitions via internal `SectionDivider` components. This causes four classes of failure:

1. **Broken layout on missing sections.** When `MatchWidget` or `MatchesSliderSection` returns `null` (API failure, empty data), the `SectionDivider` elements they owned disappear with them, leaving orphaned transitions or double-wedge artifacts on whatever sections remain.

2. **Sub-pixel rendering gaps.** Transitions rely on `overflow: hidden` + negative margins (`-mt-px`, `-mt-0.5`) to prevent 1–2 px seams between sections. On high-DPR displays and with GPU-composited backgrounds (CSS `filter: blur`), this breaks.

3. **No reusability across pages.** The same `MatchesSliderSection` component needs a diagonal-top + straight-bottom on the homepage, but different transitions on other pages. Baking dividers inside the component makes this impossible.

4. **Tight coupling.** A section that controls its own top/bottom transitions must know what comes before and after it — violating the single-responsibility principle.

---

## Solution: Three primitives

Move transition responsibility **out of section components** and into a dedicated composition layer at the page level. Sections become dumb content containers. Transitions become standalone first-class elements.

### Primitive overview

| Primitive           | Where it lives                     | Responsibility                                                                                                 |
| ------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `SectionTransition` | `design-system/SectionTransition/` | Renders one diagonal (or double-diagonal) band between two color areas                                         |
| `SectionStack`      | `design-system/SectionStack/`      | Page-level composer — filters absent sections, derives transition colors, inserts `SectionTransition` elements |
| Section components  | `components/home/*/`               | Self-contained content + background only — no dividers, no negative margins                                    |

`SectionDivider` is **removed entirely** (not deprecated, deleted). It is only used on the homepage today.

---

## TypeScript interfaces

```typescript
/** All valid section background color tokens */
type SectionBg = "white" | "gray-100" | "kcvv-black" | "kcvv-green-dark";

/**
 * How much of the SectionTransition visually overlaps INTO the preceding
 * (FROM) section:
 *
 *   'none'  — transition sits entirely between sections (default)
 *   'half'  — first half of transition height overlaps the FROM section bottom;
 *             second half sits in normal flow before the TO section.
 *             USE CASE: hero carousel — first diagonal bites into the hero
 *             image, second diagonal (via color) appears below the hero.
 *   'full'  — entire transition renders inside the FROM section bottom.
 */
type TransitionOverlap = "none" | "half" | "full";

type SectionTransitionConfig =
  | {
      type: "diagonal";
      /** ↙ = 'left', ↘ = 'right' */
      direction: "left" | "right";
      overlap?: TransitionOverlap; // default: 'none'
    }
  | {
      type: "double-diagonal";
      /** Direction of the FIRST cut. Second cut is always the opposite. */
      direction: "left" | "right";
      /** Intermediate color sandwiched between the two diagonal cuts. */
      via: SectionBg;
      overlap?: TransitionOverlap; // default: 'none'
    };

interface SectionConfig {
  /** Background color token — used to derive transition colors automatically. */
  bg: SectionBg;

  /** Section content. SectionStack wraps this in a bg-colored div. */
  content: React.ReactNode;

  /**
   * Tailwind padding-top class applied to the section wrapper.
   * Default: 'pt-20' (80 px — matches the design system section rhythm).
   * Reduce (e.g. 'pt-10') when a transition sits above and the default
   * spacing would create too much dead air between the diagonal and the
   * first heading.
   */
  paddingTop?: string;

  /**
   * Tailwind padding-bottom class applied to the section wrapper.
   * Default: 'pb-20'.
   */
  paddingBottom?: string;

  /**
   * Transition config for the edge going FROM this section INTO the next.
   * Omit entirely for a straight hard edge (sections butt up directly).
   * Colors (from/to) are auto-derived from adjacent bg values — never
   * specify them manually here.
   */
  transition?: SectionTransitionConfig;

  /** Optional React key — used when sections array is dynamic. */
  key?: string;
}
```

---

## `SectionTransition` component

### Purpose

A standalone, normal-flow element that renders one transition band. It has no knowledge of sections — it just takes two colors and draws the shape.

### Props

```typescript
interface SectionTransitionProps {
  from: SectionBg;
  to: SectionBg;
  type: "diagonal" | "double-diagonal";
  direction: "left" | "right";
  via?: SectionBg; // required when type='double-diagonal'
  overlap?: TransitionOverlap; // default: 'none'
  className?: string;
}
```

### Height

- `diagonal`: `clamp(2rem, 6vw, 5rem)` (same proportional angle at all viewports)
- `double-diagonal`: `calc(2 * clamp(2rem, 6vw, 5rem))`

### Internal structure — diagonal

```
┌──────────────────────────────────────────────────────────────┐
│  background: <from-color>                                    │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  absolute inset-0, background: <to-color>             │   │
│  │  clip-path: [triangle polygon per direction]          │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Clip-path polygons** (applied to the `to-color` overlay):

| direction | cut direction                       | `to-color` polygon                   |
| --------- | ----------------------------------- | ------------------------------------ |
| `'left'`  | ↙ (upper-left from, lower-right to) | `polygon(100% 0, 100% 100%, 0 100%)` |
| `'right'` | ↘ (upper-right from, lower-left to) | `polygon(0 0, 0 100%, 100% 100%)`    |

### Internal structure — double-diagonal

Two `SingleDiagonal` divs stacked:

1. First: `from → via`, direction as specified
2. Second: `via → to`, direction is the **opposite** of the first

### Overlap mechanism

When `overlap !== 'none'`, the transition element shifts upward (negative `margin-top`) so part of it renders visually inside the FROM section:

| overlap  | `margin-top`                              | `position` | `z-index` |
| -------- | ----------------------------------------- | ---------- | --------- |
| `'none'` | `0`                                       | `relative` | auto      |
| `'half'` | `-clamp(1rem, 3vw, 2.5rem)` (half height) | `relative` | `10`      |
| `'full'` | `-clamp(2rem, 6vw, 5rem)` (full height)   | `relative` | `10`      |

For `double-diagonal` with `'half'`: `margin-top` = `-clamp(2rem, 6vw, 5rem)` (half of `2×` height).

The FROM section automatically gets `position: relative; z-index: 0` applied by SectionStack whenever its outgoing transition uses `overlap !== 'none'`. This ensures the z-index relationship is always correct without manual configuration.

**Why this avoids the sub-pixel gap problem:** The negative margin is mathematically exact — `margin-top` equals precisely the portion of the element that overlaps. There is no separate section with a tiny 1–2 px margin trick. The `SectionTransition` element itself provides the visual color bridge.

---

## `SectionStack` component

### Purpose

Takes a mixed array of `SectionConfig | null | false | undefined`, filters out all falsy entries, and renders sections with correctly derived `SectionTransition` elements between them.

### Props

```typescript
interface SectionStackProps {
  /**
   * Mixed array — null/false/undefined entries are filtered before rendering.
   * Supports conditional sections without ternary nesting:
   *   sections={[ condition && { bg: ..., content: ... }, ... ]}
   */
  sections: (SectionConfig | null | false | undefined)[];
  className?: string;
}
```

### Rendering algorithm

```
filtered = sections.filter(Boolean)

for i in 0..filtered.length-1:
  fromSection = filtered[i]
  toSection   = filtered[i + 1]  // undefined if last

  1. If fromSection has overlap transition AND i > 0:
     Apply `position: relative; z-index: 0` to fromSection's wrapper
     (so the SectionTransition can use z-index to overlap it)

  2. Render fromSection.content wrapped in:
       <div class="w-full {bg-class} {paddingTop} {paddingBottom}">
         {fromSection.content}
       </div>
     Default paddingTop: 'pt-20', paddingBottom: 'pb-20'

  3. If toSection exists AND fromSection.transition is set:
     - If fromSection.bg === toSection.bg  →  SKIP (no visual transition needed)
     - Otherwise  →  render:
         <SectionTransition
           from={fromSection.bg}
           to={toSection.bg}
           {...fromSection.transition}
         />
```

**Key rule: same-bg skip.** If two adjacent sections share a background token (e.g., `BannerSlot` gray-100 adjacent to `LatestNews` gray-100), no `SectionTransition` is rendered even if `transition` is configured. This means BannerSlots "disappear" from the transition logic automatically — they are never a source of orphaned dividers.

---

## Homepage composition example

This is the canonical reference for how `page.tsx` uses the system:

```tsx
const sections: SectionConfig[] = [
  featuredArticles.length > 0 && {
    bg: "kcvv-black",
    paddingTop: "pt-0", // hero has no top padding — image fills to top
    paddingBottom: "pb-0", // hero bottom is handled by overlap transition
    content: <FeaturedArticles articles={featuredArticles} />,
    transition: {
      type: "double-diagonal",
      direction: "right", // first cut: ↘ (bites into bottom of hero image)
      via: "white",
      overlap: "half", // first diagonal inside hero, second below
    },
  },

  nextMatch && {
    bg: "kcvv-green-dark",
    paddingTop: "pt-12", // reduced — double-diagonal second cut already
    content: <MatchWidget match={nextMatch} teamLabel="A-Ploeg" />,
    transition: { type: "diagonal", direction: "left" },
  },

  banners.bannerSlotA && {
    bg: "gray-100",
    content: <BannerSlot {...banners.bannerSlotA} />,
    // no transition = straight hard edge (same bg as LatestNews follows)
  },

  (latestNewsArticles.length > 0 || featuredEvent) && {
    bg: "gray-100",
    content: (
      <LatestNews articles={latestNewsArticles} featuredEvent={featuredEvent} />
    ),
    transition: { type: "diagonal", direction: "left" },
    // same-bg skip fires if BannerSlot A is present (gray-100 → gray-100)
    // fires correctly if BannerSlot A is absent (gray-100 → kcvv-black)
  },

  banners.bannerSlotB && {
    bg: "gray-100",
    content: <BannerSlot {...banners.bannerSlotB} />,
    transition: { type: "diagonal", direction: "left" },
    // same-bg skip fires between LatestNews and BannerSlot B
    // but when BannerSlot B → MatchesSlider, colors differ → fires
  },

  sliderMatches.length > 0 && {
    bg: "kcvv-black",
    paddingTop: "pt-10", // tighten dead space after diagonal
    content: (
      <MatchesSliderSection matches={sliderMatches} highlightTeamId={1235} />
    ),
    transition: { type: "diagonal", direction: "right" },
  },

  {
    bg: "kcvv-green-dark",
    paddingTop: "pt-10",
    content: <YouthSection />,
    transition: { type: "diagonal", direction: "left" },
  },

  banners.bannerSlotC && {
    bg: "gray-100",
    content: <BannerSlot {...banners.bannerSlotC} />,
    // no transition — SponsorsSection is also gray-100
  },

  {
    bg: "gray-100",
    content: <SponsorsSection />,
  },
].filter(Boolean);

return <SectionStack sections={sections} />;
```

### Resilience scenarios

| Missing section                                                   | What SectionStack renders                                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MatchWidget` absent                                              | `FeaturedArticles` (kcvv-black) → double-diagonal `kcvv-black ↘ white ↙ gray-100` → LatestNews. Correct.                                                |
| `MatchesSlider` absent                                            | `LatestNews`/`BannerSlot B` (gray-100) → diagonal → `YouthSection` (kcvv-green-dark). `LatestNews` transition fires instead of `BannerSlot B`. Correct. |
| `BannerSlot B` absent                                             | `LatestNews` (gray-100) transition fires directly into `MatchesSlider` (kcvv-black). Same-bg skip never even triggers. Correct.                         |
| `BannerSlot B` present                                            | `LatestNews` → `BannerSlot B`: same bg, skip. `BannerSlot B` → `MatchesSlider`: different bg, `BannerSlot B` transition fires. Correct.                 |
| All three absent (`MatchWidget`, `MatchesSlider`, `YouthSection`) | `LatestNews` (gray-100) → straight → `SponsorsSection` (gray-100). No orphaned dividers. Correct.                                                       |

---

## Section component migration

Every section component loses:

- All `import { SectionDivider }` and `<SectionDivider .../>` usages
- All negative top margins (`-mt-px`, `-mt-0.5`, etc.)
- `overflow-hidden` where it was only needed to contain `SectionDivider` geometry
- Own `py-20` top padding (SectionStack wrapper provides `paddingTop`)

Every section component keeps:

- Its own `bg-*` class (for correct standalone Storybook rendering without SectionStack)
- `overflow-hidden` where genuinely required (MatchesSlider carousel, YouthSection background image)
- `pb-20` bottom padding (bottom padding is still the section's responsibility)
- All content, props, and internal logic unchanged

### Affected components

| Component              | Remove                                   | Keep                                  |
| ---------------------- | ---------------------------------------- | ------------------------------------- |
| `FeaturedArticles`     | bottom `SectionDivider`                  | all content, carousel                 |
| `MatchWidget`          | top + bottom `SectionDivider`, `-mt-*`   | content, `py-20` → `pb-20` only       |
| `LatestNews`           | any `SectionDivider`                     | content                               |
| `BannerSlot`           | any `SectionDivider`                     | `bg-gray-100` wrapper                 |
| `MatchesSliderSection` | top `SectionDivider`, `-mt-px`           | `overflow-hidden` (carousel), content |
| `YouthSection`         | top + bottom `SectionDivider`, `-mt-0.5` | `overflow-hidden` + bg image, content |
| `SponsorsSection`      | `-mt-0.5`                                | content                               |

---

## `SectionDivider` removal

1. Delete `src/components/design-system/SectionDivider/` directory entirely:
   - `SectionDivider.tsx`
   - `SectionDivider.stories.tsx`
   - `SectionDivider.test.tsx`
   - `index.ts`
2. Remove `SectionDivider` export from `src/components/design-system/index.ts`
3. Verify no remaining imports (`grep -r SectionDivider src/`)

---

## Storybook specification

### `UI/SectionTransition`

**Playground story** — all props controllable via args.

**Color combinations** (stories for every meaningful pair):

```
kcvv-black     → gray-100       (dark → light, most common)
kcvv-black     → kcvv-green-dark (dark → accent dark)
kcvv-green-dark → gray-100      (accent dark → light)
kcvv-green-dark → kcvv-black    (accent dark → dark)
gray-100       → kcvv-black     (light → dark)
white          → kcvv-black     (via color → dark, for double-diagonal sandwich)
```

**Direction variants** for each: `direction='left'` and `direction='right'`.

**Type variants:**

- `SingleDiagonalLeft` / `SingleDiagonalRight`
- `DoubleDiagonalRightViaWhite` (matches hero usage)
- `DoubleDiagonalLeftViaGray` (alternative)

**Overlap variants:**

- `OverlapNone` — transition in isolation, no color context above/below
- `OverlapHalf` — rendered below a dark colored box to show half-overlap into it
- `OverlapFull` — rendered below a dark colored box to show full overlap

### `UI/SectionStack`

**Playground story** — simple 3-section stack with configurable bgs and transition types.

**Scenario stories** (critical — these document the resilience contract):

| Story name              | What it shows                                                          |
| ----------------------- | ---------------------------------------------------------------------- |
| `HomepageFullStack`     | All homepage sections present                                          |
| `MissingMatchWidget`    | No MatchWidget — double-diagonal adapts to LatestNews                  |
| `MissingMatchesSlider`  | No slider — LatestNews diagonal fires into YouthSection                |
| `MissingBannerSlotB`    | No BannerSlot B — LatestNews diagonal goes to MatchesSlider            |
| `BannerSlotBPresent`    | BannerSlot B present — same-bg skip fires, BannerSlot B diagonal fires |
| `AllDataAbsent`         | Only SponsorsSection — no orphaned dividers                            |
| `StraightEdges`         | Sections without transition configs — hard edges everywhere            |
| `AlternatingDirections` | Left/right alternation across multiple sections                        |

### `Features/Home/*` section stories

Section component stories are **unchanged** — sections render correctly in Storybook without SectionStack by virtue of keeping their own `bg-*` class. No migration needed for existing stories.

---

## Testing specification

### `SectionTransition.test.tsx`

- Renders `background-color` matching `from` color token
- Renders clip-path overlay with `background-color` matching `to` color token
- Correct `clip-path` polygon for `direction='left'` and `direction='right'`
- Double-diagonal renders two sub-dividers, second direction is opposite of first
- `overlap='none'` → no `margin-top`, no `z-index`
- `overlap='half'` → correct negative `margin-top` value
- `overlap='full'` → negative `margin-top` equals full height

### `SectionStack.test.tsx`

- Filters `null`, `false`, `undefined` entries
- Renders correct number of sections after filtering
- Renders `SectionTransition` between sections with differing `bg`
- Skips `SectionTransition` when adjacent `bg` values are equal (same-bg skip)
- Adapts transition `from`/`to` when middle section is absent
- Applies `position: relative; z-index: 0` to FROM section when its transition has `overlap !== 'none'`
- Applies custom `paddingTop`/`paddingBottom` when specified
- Falls back to `pt-20 pb-20` defaults when padding props are omitted

---

## Design constraints (unchanged from CLAUDE.md)

- Section padding bottom remains `pb-20` (80 px). Do not reduce.
- `paddingTop` may be reduced (e.g. `pt-10`, `pt-12`) when a transition creates dead space, but never below `pt-8` (32 px).
- SectionTransition height uses `clamp(2rem, 6vw, 5rem)` — do not change this value; it keeps the diagonal angle consistent across viewports.
- Border-radius, color tokens, and font conventions from `apps/web/CLAUDE.md` are unaffected.

---

## Using this system on new pages

When adding section transitions to any page outside the homepage:

1. Import `SectionStack` from `@/components/design-system`
2. Build a `sections` array using `SectionConfig` entries — include all conditional sections as `condition && { ... }` — the `.filter(Boolean)` in SectionStack handles falsy values
3. Assign `bg` token matching the section's actual background color
4. Set `transition` config only on sections where a diagonal is desired going INTO the next section — omit for hard edges
5. Tune `paddingTop` per section to avoid dead space after diagonals — start with `pt-10` or `pt-12` and adjust visually
6. For sections with background images (like `YouthSection`), use the dominant color as `bg` (e.g. `'kcvv-green-dark'`) — the image is self-contained inside the section

No section component modifications are needed when reusing them on a new page. All transition variation is expressed in the page's `sections` array.
