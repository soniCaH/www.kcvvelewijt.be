# PRD: /jeugd Landing Page Redesign

**Issues:** #1038, #1039, #1040, #1041
**Status:** Design approved
**Mockup:** `docs/mockups/jeugd-landing-B.html`
**Follow-up:** #1036 (Sanity-driven editorial cards)
**Depends on:** #1031 (full /club editorial grid — must be merged first)

## 1. Problem Statement

The `/jeugd` page currently shows a plain listing of youth teams with a basic header — no hero, no visual hierarchy, no connection to youth news or practical information. Parents and players arriving at `/jeugd` see a functional but uninspiring grid that doesn't communicate the energy and scale of the youth programme (200+ players, 7 age groups, 25+ staff). The redesign transforms `/jeugd` into a visually rich hub page that combines a dramatic hero, an editorial grid mixing news with navigation cards, the full team listing using the onderbouw/middenbouw/bovenbouw grouping from `/teams`, and a youth philosophy quote.

## 2. Scope

**Packages:**

| Package    | Changes                                                          |
| ---------- | ---------------------------------------------------------------- |
| `apps/web` | Page rewrite, new components, refactored `TeamOverview` grouping |

**In scope:**

- Rewrite `/jeugd` page with `SectionStack`, 4 sections with diagonal transitions
- New component: `JeugdHero` (based on `ClubHero` pattern)
- New component: `JeugdEditorialGrid` — 9-item asymmetric grid (3 dynamic articles + 6 hardcoded nav cards)
- New component: `JeugdQuote` (youth mission banner, same pattern as `MissionBanner`)
- Refactor `TeamOverview`'s `getAgeCategory()` — replace 7-category grouping (Kleuters/Duiveltjes/Preminiemen/Miniemen/Kadetten/Scholieren/Beloften) with 3-tier grouping (Bovenbouw/Middenbouw/Onderbouw)
- Reuse `EditorialCard` from `/club` (#1031) — already has `backgroundImage` and `featured` props; extend with `variant` prop for nav card blue-ish tint
- Reuse `MissionBanner` from `/club` (#1031) — `JeugdQuote` can be a direct reuse with different props, or a thin wrapper
- Reuse `ClubEditorialGrid` grid layout pattern from `/club` (#1031) — adapt from 6 to 9 cards
- Use design tokens from #1031: `tracking-label`, `tracking-caps`, `rounded-card`, `shadow-card-hover`, `text-stat`
- Fetch 3 latest articles tagged "jeugd" via existing `SanityService.getArticlesPaginated({ category: "jeugd", offset: 0, limit: 3 })`

**Out of scope:**

- Sanity CMS-driven editorial card configuration (#1036 — follow-up)
- Creating the sub-pages linked by nav cards (`/jeugd/visie`, `/jeugd/medisch`) — separate issues
- New Sanity document types
- Any BFF / api-contract changes
- Real club photos (use placeholders; real photos are a follow-up)
- Mobile hamburger menu changes

## 3. Tracer Bullet

A static page at `/jeugd` rendering:

1. `JeugdHero` with hardcoded title/subtitle and placeholder background image, using bleed-through diagonal
2. A single `EditorialCard` (hardcoded, linking to an existing page like `/club/organigram`)
3. `TeamOverview` with the **new 3-tier grouping** (bovenbouw/middenbouw/onderbouw) using real Sanity team data

Uses `SectionStack` with diagonal transitions between hero and editorial sections. No article fetching, no full editorial grid, no quote section.

Proves: hero bleed-through works (same pattern as `/club`), `TeamOverview` 3-tier refactor works with real data, `SectionStack` integration is sound.

## 4. Phases

```
Phase 1: Tracer bullet — hero + single card + refactored team listing (#1038)
Phase 2: Full editorial grid with dynamic articles + nav cards (#1039)
Phase 3: Youth quote section + final polish (#1040)
Phase 4: Storybook stories for all new components (#1041)
```

## 5. Acceptance Criteria per Phase

### Phase 1 — Tracer bullet

- [ ] `/jeugd` renders with `SectionStack` (not the old plain layout)
- [ ] `JeugdHero` renders with background image bleeding through the diagonal (same technique as `ClubHero`)
- [ ] At least one `EditorialCard` renders in the editorial section
- [ ] `TeamOverview` groups youth teams into 3 tiers: Bovenbouw (U14–U21), Middenbouw (U10–U13), Onderbouw (U6–U9)
- [ ] Old 7-category grouping (Kleuters, Duiveltjes, etc.) is fully removed from `getAgeCategory()`
- [ ] `TeamOverview` tests updated for new grouping
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — Full editorial grid

- [ ] `JeugdEditorialGrid` renders 9 cards in 4-row asymmetric layout (7/5/5 + 4/4/4 + 4/4/4)
- [ ] 3 article slots filled dynamically from Sanity (`category: "jeugd"`, `limit: 3`)
- [ ] 6 navigation cards rendered from hardcoded config array (editable in code)
- [ ] Nav cards visually distinct from article cards (blue-ish gradient tint)
- [ ] Grid collapses responsively: 2-col at `≤960px` (featured full-width), 1-col at `≤640px`
- [ ] Graceful fallback when fewer than 3 jeugd articles exist (show only available articles, fill remaining slots with nav cards or hide empty slots)
- [ ] All nav card links point to correct routes
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3 — Quote section + polish

- [ ] `JeugdQuote` renders between diagonal transitions (kcvv-green-dark bg)
- [ ] Full `SectionStack` with all 4 sections: hero → editorial → teams → quote
- [ ] Diagonal directions alternate correctly: right → left → right → left
- [ ] Page metadata updated (title, description, OpenGraph)
- [ ] ISR revalidation maintained (1 hour for article freshness)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4 — Storybook

- [ ] `JeugdHero` story under `Features/Jeugd/JeugdHero`
- [ ] `JeugdEditorialGrid` story under `Features/Jeugd/JeugdEditorialGrid`
- [ ] `JeugdQuote` story under `Features/Jeugd/JeugdQuote`
- [ ] All stories use `StoryObj<typeof meta>` pattern
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. Article fetching uses the existing `SanityService.getArticlesPaginated()`. Team fetching uses the existing `SanityService.getTeams()`.

## 7. Page Structure (SectionStack)

### Section 1 — Jeugd Hero (with bleed-through diagonal)

| Property        | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| `bg`            | `"kcvv-black"`                                              |
| `paddingTop`    | `"pt-0"`                                                    |
| `paddingBottom` | `"pb-0"`                                                    |
| `transition`    | `{ type: "diagonal", direction: "right", overlap: "full" }` |

**Component:** `JeugdHero` (new — follows `ClubHero` pattern exactly)

Uses the same bleed-through diagonal technique as `ClubHero`: the component renders its own built-in diagonal at the bottom, and `SectionStack` transition uses `overlap="full"`.

#### Hero content

| Element     | Details                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Label       | "Jeugdopleiding" with green dash                                                                       |
| Title       | "DE TOEKOMST" `<br>` "VAN " + `<span className="text-kcvv-green">ELEWIJT</span>`                       |
| Title style | `font-title font-black text-white uppercase leading-[0.9]`, `fontSize: clamp(3rem, 7vw, 5.5rem)`       |
| Subtitle    | "Meer dan 200 jonge voetballers. Gediplomeerde trainers. Eén missie: plezier, techniek en teamspirit." |
| Background  | Placeholder image, `brightness(0.25) saturate(0.7)`, same gradient overlay as `ClubHero`               |

### Section 2 — Editorial Grid

| Property        | Value                                     |
| --------------- | ----------------------------------------- |
| `bg`            | `"gray-100"`                              |
| `paddingTop`    | `"pt-20"`                                 |
| `paddingBottom` | `"pb-20"`                                 |
| `transition`    | `{ type: "diagonal", direction: "left" }` |

**Component:** `JeugdEditorialGrid` (new)

#### Section header

Same pattern as `/club` editorial header (label + green dash above title, NOT `<SectionHeader>`):

- Label: "Ontdek onze jeugd"
- Title: "Alles op één plek"

#### 9-item editorial grid

12-column CSS grid: `grid grid-cols-12 gap-5`, 4 rows.

| #   | Position                                 | Type    | Tag        | Title                      | Description                                         | Arrow           | href                  |
| --- | ---------------------------------------- | ------- | ---------- | -------------------------- | --------------------------------------------------- | --------------- | --------------------- |
| 1   | Featured (col 1-7, row 1-2, min-h 520px) | Article | _dynamic_  | _latest jeugd article_     | _from Sanity_                                       | Lees meer →     | `/news/[slug]`        |
| 2   | Medium 1 (col 8-12, row 1, min-h 280px)  | Nav     | Aansluiten | Word lid van KCVV          | Nieuwe spelers zijn altijd welkom — van U6 tot U21. | Schrijf je in → | `/club/register`      |
| 3   | Medium 2 (col 8-12, row 2, min-h 280px)  | Article | _dynamic_  | _2nd jeugd article_        |                                                     | Lees meer →     | `/news/[slug]`        |
| 4   | Third 1 (col 1-4, row 3, min-h 280px)    | Nav     | Visie      | Onze jeugdvisie            |                                                     | Ontdek →        | `/jeugd/visie`        |
| 5   | Third 2 (col 5-8, row 3)                 | Article | _dynamic_  | _3rd jeugd article_        |                                                     | Lees meer →     | `/news/[slug]`        |
| 6   | Third 3 (col 9-12, row 3)                | Nav     | Praktisch  | Trainingen & ProSoccerData |                                                     | Meer info →     | `/news/prosoccerdata` |
| 7   | Third 4 (col 1-4, row 4)                 | Nav     | Structuur  | Organigram                 |                                                     | Bekijk →        | `/club/organigram`    |
| 8   | Third 5 (col 5-8, row 4)                 | Nav     | Hulp       | Wie contacteer ik?         |                                                     | Zoek het op →   | `/hulp`               |
| 9   | Third 6 (col 9-12, row 4)                | Nav     | Medisch    | Blessure of afmelding?     |                                                     | Lees meer →     | `/jeugd/medisch`      |

#### Nav card config (hardcoded, editable in code)

The 6 nav cards are defined as a typed array in the component file:

```typescript
interface NavCardConfig {
  tag: string;
  title: string;
  description?: string;
  arrowText: string;
  href: string;
  imageUrl: string;
}

const NAV_CARDS: NavCardConfig[] = [
  {
    tag: "Aansluiten",
    title: "Word lid van KCVV",
    description: "Nieuwe spelers zijn altijd welkom — van U6 tot U21.",
    arrowText: "Schrijf je in →",
    href: "/club/register",
    imageUrl: "/images/jeugd/inschrijven.jpg",
  },
  // ... 5 more
];
```

#### EditorialCard reuse (from #1031)

The `EditorialCard` component (`components/club/EditorialCard/`) from the /club landing page (#1031) already has:

- **`backgroundImage?: string`** — renders background image with zoom effect on hover
- **`featured?: boolean`** — increases padding (`p-10` vs `p-6`) and title size (`text-stat`)
- Uses design tokens: `rounded-card`, `shadow-card-hover`, `tracking-label`, `tracking-caps`
- Animated top border bar with `clip-path` hover effect

**Needed extension for /jeugd:**

1. **`variant` prop** — `"default" | "nav"` — nav variant applies a blue-ish gradient tint to differentiate navigation cards from article cards:
   ```css
   linear-gradient(to top, rgba(30,32,36,0.95) 0%, rgba(30,40,54,0.6) 40%, rgba(30,40,54,0.2) 100%)
   ```

Since `EditorialCard` is now used by both `/club` and `/jeugd`, keep in `components/club/` for now (it's a shared editorial pattern). Reconsider location if a third page uses it.

#### Responsive grid behavior

```
≤960px: grid-cols-2, all cards col-auto row-auto min-h-[260px], featured col-span-full min-h-[320px]
≤640px: grid-cols-1, featured min-h-[280px]
```

### Section 3 — Youth Teams

| Property        | Value                                      |
| --------------- | ------------------------------------------ |
| `bg`            | `"kcvv-black"`                             |
| `paddingTop`    | `"pt-20"`                                  |
| `paddingBottom` | `"pb-20"`                                  |
| `transition`    | `{ type: "diagonal", direction: "right" }` |

**Component:** `TeamOverview` (existing, refactored)

Reuses the existing `TeamOverview` component with `groupByAge={true}`, but now grouped into 3 tiers instead of 7 categories.

#### TeamOverview refactor: 3-tier grouping

Replace `getAgeCategory()`:

```typescript
// Before (7 categories — REMOVED):
// "Kleuters (U6-U7)", "Duiveltjes (U8-U9)", "Preminiemen (U10-U11)",
// "Miniemen (U12-U13)", "Kadetten (U14-U15)", "Scholieren (U16-U17)", "Beloften (U21)"

// After (3 tiers):
function getAgeCategory(ageGroup: string | undefined): string {
  const age = parseAgeGroup(ageGroup);
  if (age <= 9) return "Onderbouw (U6–U9)";
  if (age <= 13) return "Middenbouw (U10–U13)";
  if (age <= 21) return "Bovenbouw (U14–U21)";
  return "Overig";
}
```

**Sort order:** Bovenbouw first (oldest → youngest within tier), then Middenbouw, then Onderbouw. This matches the /teams page mockup which lists bovenbouw at the top.

#### Visual treatment on dark bg

The `TeamOverview` component needs a dark variant for rendering on `kcvv-black` bg. Options:

1. Add a `colorScheme?: "light" | "dark"` prop that changes group heading and card styles
2. Or: render the section header and team listing directly in the page component, using `TeamOverview` only for the card grid

Decision: add `colorScheme` prop — cleaner, reusable on `/teams` page too.

### Section 4 — Youth Philosophy Quote

| Property        | Value               |
| --------------- | ------------------- |
| `bg`            | `"kcvv-green-dark"` |
| `paddingTop`    | `"pt-20"`           |
| `paddingBottom` | `"pb-20"`           |

No transition after — last section before footer.

**Component:** `MissionBanner` (reuse from #1031) or `JeugdQuote` wrapper

The `MissionBanner` component from `/club` (#1031) renders a quote section with large opening quotation mark, quote text, and attribution. If `MissionBanner` accepts props for quote/attribution text, **reuse it directly**. If it has hardcoded club content, either:

1. Add props to `MissionBanner` (preferred — it's a generic pattern)
2. Create a thin `JeugdQuote` wrapper

| Element     | Content                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Quote icon  | `"` (Georgia serif, white/20)                                                                               |
| Quote text  | "Bij KCVV Elewijt staat plezier op één. We geloven dat spelplezier de beste basis is voor sportieve groei." |
| Attribution | "— Jeugdopleiding KCVV Elewijt"                                                                             |

## 8. Component File Structure

```
apps/web/src/
├── app/(main)/jeugd/
│   └── page.tsx                          # Rewritten: SectionStack, data fetching
├── components/jeugd/
│   ├── JeugdHero/
│   │   ├── JeugdHero.tsx
│   │   └── JeugdHero.stories.tsx         # Features/Jeugd/JeugdHero
│   └── JeugdEditorialGrid/
│       ├── JeugdEditorialGrid.tsx        # Grid layout + nav card config
│       └── JeugdEditorialGrid.stories.tsx
├── components/club/
│   ├── EditorialCard/
│   │   └── EditorialCard.tsx             # Extended: add variant prop (backgroundImage + featured already exist from #1031)
│   └── MissionBanner/
│       └── MissionBanner.tsx             # Reused directly (add props if hardcoded)
└── components/team/
    └── TeamOverview/
        └── TeamOverview.tsx              # Refactored: 3-tier grouping, colorScheme
```

## 9. Data Fetching

The `/jeugd` page fetches two data sources in parallel:

```typescript
const [teams, articles] = await Promise.all([
  fetchYouthTeams(), // existing — SanityService.getTeams()
  fetchJeugdArticles(), // new — SanityService.getArticlesPaginated({ category: "jeugd", offset: 0, limit: 3 })
]);
```

Article data is passed to `JeugdEditorialGrid` which interleaves them with the hardcoded nav cards at the designated positions.

## 10. Existing Component Reuse

| Component           | Reuse?              | Notes                                                                                               |
| ------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `SectionStack`      | **Yes**             | Orchestrates all 4 sections                                                                         |
| `SectionTransition` | **Yes**             | Standard diagonals + hero bleed-through via `overlap="full"`                                        |
| `ClubHero`          | **Pattern**         | `JeugdHero` follows the same implementation pattern but is a separate component (different content) |
| `EditorialCard`     | **Yes, extended**   | Already has `backgroundImage` + `featured` from #1031; add `variant` prop for nav card tint         |
| `ClubEditorialGrid` | **Pattern**         | `JeugdEditorialGrid` adapts the same 12-col asymmetric grid from 6 to 9 cards (4 rows)              |
| `MissionBanner`     | **Yes, reuse**      | Reuse directly with props for quote/attribution (or make it accept props if currently hardcoded)    |
| `ClubContactCta`    | **No**              | /jeugd has no contact CTA section (quote section replaces it)                                       |
| `TeamOverview`      | **Yes, refactored** | New 3-tier grouping replaces 7-category grouping                                                    |
| `TeamCard`          | **Yes**             | Used internally by `TeamOverview`                                                                   |
| `SectionHeader`     | **No**              | Mockup uses label + green dash pattern (inline header, same as /club)                               |

## 11. Design Token Reference

### Colors

| Token        | Tailwind class                      | Hex       |
| ------------ | ----------------------------------- | --------- |
| Green bright | `text-kcvv-green` / `bg-kcvv-green` | `#4acf52` |
| Green dark   | `bg-kcvv-green-dark`                | `#008755` |
| Green hover  | `hover:bg-kcvv-green-hover`         | `#41b147` |
| Black        | `bg-kcvv-black` / `text-kcvv-black` | `#1E2024` |
| Gray blue    | `text-kcvv-gray-blue`               | `#31404b` |
| Gray         | `text-kcvv-gray`                    | `#62656A` |
| Gray 100     | `bg-gray-100`                       | `#f3f4f6` |

### Typography

| Token      | Tailwind class        | Value                                  |
| ---------- | --------------------- | -------------------------------------- |
| Title font | `font-title`          | quasimoda stack                        |
| Body font  | `font-body` (default) | montserrat stack                       |
| Stat size  | `text-stat`           | `2.5rem` (40px) — featured card titles |

### Spacing & Effects (from #1031)

| Token             | Tailwind class      | Value                          |
| ----------------- | ------------------- | ------------------------------ |
| Label tracking    | `tracking-label`    | `0.14em`                       |
| Caps tracking     | `tracking-caps`     | `0.08em`                       |
| Card radius       | `rounded-card`      | `4px`                          |
| Card hover shadow | `shadow-card-hover` | `0 12px 32px rgba(0,0,0,0.15)` |

### Opacity patterns (on dark backgrounds)

| Purpose            | Class           |
| ------------------ | --------------- |
| Primary text       | `text-white`    |
| Secondary/subtitle | `text-white/60` |
| Tertiary/label     | `text-white/50` |
| Muted/subtle       | `text-white/55` |
| Decorative dash    | `bg-kcvv-green` |

## 12. Metadata

```typescript
export const metadata: Metadata = {
  title: "Jeugdopleiding | KCVV Elewijt",
  description:
    "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
  openGraph: {
    title: "Jeugdopleiding | KCVV Elewijt",
    description:
      "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
    type: "website",
  },
};
```

## 13. Open Questions

- [ ] **Hero image:** Which real youth photo to use? — Needs your decision. Use Unsplash placeholder until then.
- [ ] **Nav card images:** Same question for the 6 nav card background images. — Use Unsplash placeholders.
- [ ] **Sub-page routes:** `/jeugd/visie` and `/jeugd/medisch` don't exist yet. Cards will link to 404s. — Acceptable for now; create stub pages or separate issues.
- [ ] **ProSoccerData article:** Does an article about ProSoccerData exist in Sanity, or should we create one? — If not, this nav card could link to an external PSD URL or a future article.
- [ ] **`EditorialCard` location:** Keep in `components/club/` or move to `components/shared/`? — Now used by both `/club` and `/jeugd`; keep in `components/club/` for now, reconsider if a third page uses it.
- [ ] **`MissionBanner` props:** Does the #1031 `MissionBanner` accept quote/attribution props, or is it hardcoded? — Check during implementation; if hardcoded, refactor to accept props.
- [ ] **TeamOverview sort direction:** Bovenbouw first (oldest at top, like /teams mockup) or Onderbouw first (youngest at top, like current /jeugd)? — Mockup shows Bovenbouw first. Confirm.
- [ ] **Article fallback:** If fewer than 3 jeugd-tagged articles exist, should empty article slots show as nav cards, be hidden, or show a placeholder? — Will be answered during Phase 2 implementation.

## 14. Discovered Unknowns (filled during implementation)

_Empty — to be updated during Ralph loop._
