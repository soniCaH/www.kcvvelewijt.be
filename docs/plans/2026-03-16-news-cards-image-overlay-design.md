# Design: News Cards — Image-Overlay Style (#813)

**Date:** 2026-03-16
**Issue:** #813
**Epic:** #807 (Visual redesign)

## Context

Replace the existing `ArticleCard` (horizontal mobile / overlapping white card desktop) in the
homepage `LatestNews` section with a full-bleed image-overlay card style (Inter Miami-inspired).
The existing `ArticleCard` is left untouched for the news overview page — its redesign is tracked
in #690, which will adopt the same visual pattern for full site consistency.

## Decisions

### Option chosen: new `NewsCard` component (Option A)

`ArticleCard` is not modified. A new `NewsCard` is created alongside it. `LatestNews` is updated
to use `NewsCard`. This avoids breaking the `/news` overview page before #690 is done.

### Grid layout: 1 featured + 2 standard (3 total)

The homepage news section shows exactly 3 articles:

- **Featured slot** (left, `col-span-2`, `aspect-[21/9]`): first article or, in the future, an
  upcoming featured event (#802)
- **Standard slots** (right column, stacked): 2 articles at `aspect-[3/2]`

On mobile: all 3 cards stack to a single column.

### Future events hook

The `LatestNews` component accepts an optional `featuredEvent` prop (typed, unused until #802).
When present, the event fills the featured slot; articles fill the 2 standard slots.
The `event` Sanity schema will need a `featured` boolean added in #802.

### Article selection logic (wired in #818, not #813)

- **Hero carousel** → up to 3 most recent `featured: true` articles; fallback to newest if fewer
  than 3 are flagged
- **News grid** → 3 most recent articles not already shown in the hero (featured flag is a
  priority signal, not an exclusion filter — no article is ever invisible)

### `NewsCard` is reusable

Props are content-type agnostic (`title`, `href`, `imageUrl`, `imageAlt`, `badge`, `date`,
`variant`). Both articles and future event cards feed the same component. `Features/Articles/`
Storybook domain may eventually be retired as everything migrates to this style.

## Components

### `NewsCard`

**Path:** `src/components/home/LatestNews/NewsCard.tsx`
**Storybook:** `Features/News/NewsCard`

```typescript
interface NewsCardProps {
  title: string;
  href: string;
  imageUrl?: string;
  imageAlt?: string;
  badge?: string; // single label — replaces tags array
  date?: string;
  variant?: "standard" | "featured";
  className?: string;
}
```

**Visual spec:**

| Element           | Classes                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card wrapper      | `relative group overflow-hidden rounded bg-kcvv-black`                                                                                                        |
| Image             | `next/image` fill, `object-cover`, zoom `group-hover:scale-105 transition-transform duration-500`                                                             |
| Gradient overlay  | `absolute inset-0 bg-gradient-to-t from-kcvv-black/90 to-transparent`                                                                                         |
| Content area      | `absolute bottom-0 left-0 right-0 p-5` (featured: `p-6 md:p-8`)                                                                                               |
| Category badge    | `border-l-2 border-kcvv-green pl-2 text-kcvv-green text-xs font-bold uppercase tracking-wider mb-2`                                                           |
| Title (standard)  | `text-white font-bold leading-snug text-base line-clamp-3`                                                                                                    |
| Title (featured)  | `text-white font-bold leading-snug text-2xl line-clamp-3`                                                                                                     |
| Footer            | `border-t border-white/10 mt-3 pt-3 text-white/40 text-xs flex gap-3`                                                                                         |
| Hover: lift       | `group-hover:-translate-y-1 transition-transform` on wrapper                                                                                                  |
| Hover: shadow     | `group-hover:shadow-xl` on wrapper                                                                                                                            |
| Hover: top border | `before:absolute before:top-0 before:inset-x-0 before:h-0.5 before:bg-kcvv-green before:scale-x-0 group-hover:before:scale-x-100 before:transition-transform` |
| Aspect (standard) | `aspect-[3/2]`                                                                                                                                                |
| Aspect (featured) | `aspect-[21/9]`                                                                                                                                               |
| Border radius     | `rounded` (4px — max per design conventions)                                                                                                                  |

**No image fallback:** solid `bg-kcvv-black` with a subtle pattern placeholder div.

### `LatestNews` (updated)

**Path:** `src/components/home/LatestNews/LatestNews.tsx` (updated in-place)
**Storybook:** `Features/News/NewsGrid`

```typescript
interface FeaturedEventStub {
  title: string;
  href: string;
  imageUrl?: string;
  imageAlt?: string;
  badge?: string;
  date?: string;
}

interface LatestNewsProps {
  articles: LatestNewsArticle[]; // 2–3; first used as featured when no event
  featuredEvent?: FeaturedEventStub; // #802 hook — unused for now
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  className?: string;
}
```

**Grid:**

```
Desktop (md+):
┌──────────────────────┬──────────┐
│  Featured (col-span-2)│ Standard │
│  aspect-[21/9]        │ aspect-  │
│                       │ [3/2]    │
│                       ├──────────┤
│                       │ Standard │
│                       │ aspect-  │
│                       │ [3/2]    │
└──────────────────────┴──────────┘

Mobile:
┌──────────┐
│ Featured │ aspect-[3/2] (21/9 too wide for mobile)
├──────────┤
│ Standard │
├──────────┤
│ Standard │
└──────────┘
```

Grid classes: `grid grid-cols-1 md:grid-cols-3 gap-4`
Featured: `md:col-span-2`
Standards: `md:col-span-1`

**Section:** `bg-gray-100 py-20` (consistent with redesign section padding rule)

Section header: green left-border title + "Alle berichten →" link (same pattern as other sections).

## Storybook Stories

**`Features/News/NewsCard`** (`NewsCard.stories.tsx`):

- `Default` — standard variant with image
- `Featured` — featured variant with image
- `WithoutImage` — fallback background
- `LongTitle` — line-clamp behaviour
- `MobileView` — viewport override

**`Features/News/NewsGrid`** (`LatestNews.stories.tsx` retitled):

- `Default` — 3 articles, first featured
- `TwoArticles` — graceful degradation (both standard, no featured)
- `WithFeaturedEventStub` — event in featured slot (stub data, shows hook works)
- `WithoutImages`
- `WithoutViewAll`

## Tests

**`NewsCard.test.tsx`:**

- Renders as `<article>`
- Renders title and link
- Renders image when `imageUrl` provided; fallback when not
- Renders badge with correct classes
- Renders date in footer
- `featured` variant applies `text-2xl` title
- Has `group` class for hover coordination
- Has green top-border `before:` pseudo-element classes
- Accessible: link, heading level, image alt

## File changes

| File                                                    | Action                            |
| ------------------------------------------------------- | --------------------------------- |
| `src/components/home/LatestNews/NewsCard.tsx`           | Create                            |
| `src/components/home/LatestNews/NewsCard.stories.tsx`   | Create                            |
| `src/components/home/LatestNews/NewsCard.test.tsx`      | Create                            |
| `src/components/home/LatestNews/LatestNews.tsx`         | Update (use `NewsCard`, new grid) |
| `src/components/home/LatestNews/LatestNews.test.tsx`    | Update                            |
| `src/components/home/LatestNews/LatestNews.stories.tsx` | Update (new stories, retitled)    |
| `src/components/home/index.ts`                          | Update (export `NewsCard`)        |

`ArticleCard` and its stories/tests are **not modified** in this PR.

## Out of scope

- Article selection logic (`featured` flag wiring) → #818
- Events in featured slot (implementation) → #802
- `featured` boolean on Sanity `event` schema → #802
- `ArticleCard` redesign for `/news` overview → #690
