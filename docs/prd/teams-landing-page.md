# PRD: /teams Landing Page

**Issue:** #1020
**Status:** Design approved
**Mockup:** `docs/mockups/teams-landing-final.html`

## Overview

A visual landing page at `/teams` listing all club teams. Senior teams (A and B) get prominent hero/featured treatment at the top; youth teams are grouped by Voetbal Vlaanderen division (Bovenbouw, Middenbouw, Onderbouw) in a section below.

The page uses `SectionStack` with diagonal transitions between sections, matching the homepage pattern.

## Route

`/app/(main)/teams/page.tsx` — server component (RSC).

## Data

### Sanity Query

New query `TEAMS_LANDING_QUERY` in `apps/web/src/lib/sanity/queries/teams.ts`:

```groq
*[_type == "team" && showInNavigation != false] | order(name asc) {
  _id, name, "slug": slug.current, age,
  division, divisionFull, tagline,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  staff[]-> { firstName, lastName, role }
}
```

Only fetch the fields needed for the landing page — no players, no body, no training schedule.

### TypeScript type

```typescript
type TeamLandingItem = {
  _id: string;
  name: string;
  slug: string;
  age: string; // "A", "B", "U21", "U17", "U15", "U14", "U13", "U12", "U11", "U10", "U9", "U8", "U7", "U6"
  division: string | null;
  divisionFull: string | null;
  tagline: string | null;
  teamImageUrl: string | null;
  staff: { firstName: string; lastName: string; role: string }[] | null;
};
```

### Grouping logic

Split the query results into three buckets in the page component:

Use the `groupTeamsForLanding(teams)` helper from `src/lib/utils/group-teams.ts`:

```typescript
import { groupTeamsForLanding } from "@/lib/utils/group-teams";

const { aTeam, bTeam, youthByDivision } = groupTeamsForLanding(teams);
```

The helper groups youth teams into Bovenbouw (U14–U21), Middenbouw (U10–U13), and Onderbouw (U6–U9), sorted by descending age within each bucket (matching the mockup's visual flow).

## Page Structure (SectionStack)

### Section 1 — A-Team Hero

| Property        | Value                                      |
| --------------- | ------------------------------------------ |
| `bg`            | `"kcvv-black"`                             |
| `paddingTop`    | `"pt-0"`                                   |
| `paddingBottom` | `"pb-0"`                                   |
| `transition`    | `{ type: "diagonal", direction: "right" }` |

**Component:** `TeamsHero` (new)

Full-bleed hero, minimum height `min-h-[70vh]`, `flex items-end`.

#### Background layers (stacked with `absolute inset-0`)

1. Team photo (`next/image`, `fill`, `object-cover`, `brightness-[0.4]` via CSS filter — NOT Tailwind class, to avoid needing a plugin)
2. Gradient overlay: `bg-gradient-to-t from-kcvv-black via-kcvv-black/85 via-40% to-kcvv-black/20`

#### Content (inside `relative z-10 max-w-[70rem] mx-auto px-4 md:px-10 py-10 md:py-16 w-full`)

| Element                | Tailwind classes                                                                                                                                                                | Notes                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Label ("Eerste ploeg") | `flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-white/50 mb-6`                                                                        | Preceded by `<span className="block w-5 h-0.5 bg-white/30" />` dash                                 |
| Team name              | `font-title font-black text-white uppercase leading-[0.9] mb-3`                                                                                                                 | `style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}`                                                    |
| Green accent in name   | The "Elewijt" part wrapped in `<span className="text-kcvv-green">`                                                                                                              | Renders as: "KCVV" `<br>` "ELEWIJT A" (green + white)                                               |
| Division               | `font-title font-bold text-white/60 mb-10`                                                                                                                                      | `style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}` — e.g. "3de Provinciale B" from `divisionFull` |
| CTA link               | `inline-flex items-center gap-2 px-8 py-3.5 bg-kcvv-green text-kcvv-black font-bold text-sm uppercase tracking-[0.08em] rounded-sm transition-colors hover:bg-kcvv-green-hover` | "Bekijk de A-ploeg →" — links to `/team/{slug}`                                                     |

### Section 2 — B-Team Featured Card

| Property        | Value                                     |
| --------------- | ----------------------------------------- |
| `bg`            | `"gray-100"`                              |
| `paddingTop`    | `"pt-20"`                                 |
| `paddingBottom` | `"pb-20"`                                 |
| `transition`    | `{ type: "diagonal", direction: "left" }` |

**Component:** `TeamFeaturedCard` (new, reusable for either team)

Inside `max-w-[70rem] mx-auto px-4 md:px-10`:

A two-column card: `grid grid-cols-1 md:grid-cols-2 bg-white rounded-sm overflow-hidden shadow-sm`

#### Left column — Photo

`relative min-h-[220px] md:min-h-[340px]`

- `next/image` with `fill` + `object-cover`
- Green tint overlay: `absolute inset-0 bg-gradient-to-br from-kcvv-green-dark/30 to-transparent`
- Fallback (no image): `bg-gray-100` with centered `Users` lucide icon `w-16 h-16 text-gray-300`

#### Right column — Content

`p-8 md:p-12 flex flex-col justify-center`

| Element                | Tailwind classes                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Label ("Tweede ploeg") | `flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-kcvv-gray mb-4` with green dash `<span className="block w-5 h-0.5 bg-kcvv-green" />`         |
| Team name              | `font-title font-black text-kcvv-gray-blue uppercase leading-none mb-3` at `style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}`                                                        |
| Division               | `text-[0.9375rem] text-kcvv-gray mb-6` — e.g. "4de Provinciale C" from `divisionFull`                                                                                                  |
| CTA link               | `inline-flex items-center gap-2 px-6 py-3 bg-kcvv-black text-white font-bold text-[0.8125rem] uppercase tracking-[0.08em] rounded-sm w-fit transition-colors hover:bg-kcvv-green-dark` |

### Section 3 — Youth Teams

| Property        | Value                                      |
| --------------- | ------------------------------------------ |
| `bg`            | `"kcvv-green-dark"`                        |
| `paddingTop`    | `"pt-20"`                                  |
| `paddingBottom` | `"pb-20"`                                  |
| `transition`    | `{ type: "diagonal", direction: "right" }` |

**Component:** `YouthTeamsDirectory` (new)

Inside `max-w-[70rem] mx-auto px-4 md:px-10`:

#### Section header

Use existing `<SectionHeader title="Jeugdploegen" linkText="Jeugdwerking" linkHref="/jeugd" variant="dark" />`

#### Age group blocks

For each division in `youthByDivision`:

**Group title:**
`font-title font-bold text-sm uppercase tracking-[0.1em] text-white/45 mb-4 flex items-center gap-3`
Text: `{label} ({range})` — e.g. "Bovenbouw (U14–U21)"
After-element: `<span className="flex-1 h-px bg-white/10" />`

**Team grid:**
`grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4`

Spacing between groups: `mb-10` (last group `mb-0`)

#### Youth team card (dark variant)

`<Link>` styled as:
`flex items-center gap-4 px-5 py-4 bg-white/8 border border-white/8 rounded-sm no-underline transition-colors hover:bg-white/[0.14] hover:border-white/15`

| Element      | Tailwind classes                                                                    |
| ------------ | ----------------------------------------------------------------------------------- |
| Badge circle | `flex items-center justify-center w-12 h-12 bg-kcvv-green/15 rounded-full shrink-0` |
| Badge text   | `font-title font-black text-sm text-kcvv-green` — shows age group (e.g. "U15")      |
| Team name    | `font-title font-bold text-[0.9375rem] text-white truncate`                         |

No meta text below team name — just name.

### Section 4 — CTA Banner

| Property        | Value          |
| --------------- | -------------- |
| `bg`            | `"kcvv-black"` |
| `paddingTop`    | `"pt-16"`      |
| `paddingBottom` | `"pb-16"`      |

**No transition after** — this is the last section before the footer.

Inside `max-w-[40rem] mx-auto px-4 md:px-10 text-center`:

| Element    | Tailwind classes                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title      | `font-title font-extrabold text-white mb-3` at `style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}` — "Aansluiten bij KCVV Elewijt?"                                                                             |
| Body text  | `text-[0.9375rem] text-white/55 mb-8 leading-relaxed` — "Vanaf de allerkleinsten tot de eerste ploeg — iedereen is welkom op Sportpark Elewijt."                                                               |
| CTA button | `inline-flex items-center gap-2 px-8 py-3.5 bg-white text-kcvv-black font-bold text-sm uppercase tracking-wider rounded-sm transition-colors hover:bg-kcvv-green` — "Meer info →", links to `/club/aansluiten` |

## Component File Structure

```text
apps/web/src/
├── app/(main)/teams/
│   └── page.tsx                          # Server component, data fetching, SectionStack
├── components/teams/
│   ├── TeamsHero/
│   │   ├── TeamsHero.tsx
│   │   └── TeamsHero.stories.tsx         # Features/Teams/TeamsHero
│   ├── TeamFeaturedCard/
│   │   ├── TeamFeaturedCard.tsx
│   │   └── TeamFeaturedCard.stories.tsx  # Features/Teams/TeamFeaturedCard
│   ├── YouthTeamsDirectory/
│   │   ├── YouthTeamsDirectory.tsx
│   │   └── YouthTeamsDirectory.stories.tsx  # Features/Teams/YouthTeamsDirectory
│   └── TeamsCta/
│       ├── TeamsCta.tsx
│       └── TeamsCta.stories.tsx          # Features/Teams/TeamsCta
```

## Design Token Reference (exact values)

These are the only tokens that should appear in the implementation. Do not hardcode hex values — use Tailwind classes that reference the `@theme` tokens.

| Token        | Tailwind class                      | Hex              |
| ------------ | ----------------------------------- | ---------------- |
| Green bright | `text-kcvv-green` / `bg-kcvv-green` | `#4acf52`        |
| Green dark   | `bg-kcvv-green-dark`                | `#008755`        |
| Green hover  | `hover:bg-kcvv-green-hover`         | `#41b147`        |
| Black        | `bg-kcvv-black` / `text-kcvv-black` | `#1E2024`        |
| Gray blue    | `text-kcvv-gray-blue`               | `#31404b`        |
| Gray         | `text-kcvv-gray`                    | `#62656A`        |
| Title font   | `font-title`                        | quasimoda stack  |
| Body font    | `font-body` (default)               | montserrat stack |

### Opacity patterns (on dark backgrounds)

| Purpose            | Class                                         |
| ------------------ | --------------------------------------------- |
| Primary text       | `text-white`                                  |
| Secondary/division | `text-white/60`                               |
| Tertiary/label     | `text-white/50`                               |
| Muted/subtle       | `text-white/45`                               |
| Decorative lines   | `bg-white/30` (dash), `bg-white/10` (divider) |
| Card bg            | `bg-white/8`                                  |
| Card border        | `border-white/8`, hover `border-white/15`     |
| Card hover bg      | `bg-white/[0.14]`                             |

### Typography scale (clamp values)

| Element           | Font size                               | Weight                 | Family         |
| ----------------- | --------------------------------------- | ---------------------- | -------------- |
| Hero team name    | `clamp(3rem, 8vw, 6rem)`                | `font-black` (900)     | `font-title`   |
| Hero division     | `clamp(1rem, 2.5vw, 1.5rem)`            | `font-bold` (700)      | `font-title`   |
| B-team name       | `clamp(1.8rem, 4vw, 2.8rem)`            | `font-black` (900)     | `font-title`   |
| Section header    | via `<SectionHeader>` component         | —                      | —              |
| CTA banner title  | `clamp(1.5rem, 3vw, 2rem)`              | `font-extrabold` (800) | `font-title`   |
| Labels            | `0.6875rem` (11px)                      | `font-extrabold`       | default (body) |
| CTA buttons       | `0.875rem` (14px) or `0.8125rem` (13px) | `font-bold`            | default (body) |
| Youth card name   | `0.9375rem` (15px)                      | `font-bold`            | `font-title`   |
| Youth group title | `0.875rem` (14px)                       | `font-bold`            | `font-title`   |

## Storybook

All four components get stories under `Features/Teams/`:

- `TeamsHero` — with and without team photo
- `TeamFeaturedCard` — with photo, without photo, loading skeleton
- `YouthTeamsDirectory` — full list, empty state
- `TeamsCta` — default

Story type: `StoryObj<typeof meta>`, handlers via `fn()`.

## Metadata

```typescript
export const metadata: Metadata = {
  title: "Onze ploegen | KCVV Elewijt",
  description:
    "Alle ploegen van KCVV Elewijt: eerste ploeg, tweede ploeg en jeugd van U6 tot U21.",
};
```

## Out of scope

- Live ranking/stats in the hero (no BFF call for now)
- Search/filter functionality
- Training schedule display
- Player counts per team
