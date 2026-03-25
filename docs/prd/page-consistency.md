# PRD: Landing Page Consistency — `/club`, `/jeugd`, `/teams`

## 1. Problem Statement

The three main landing pages (`/club`, `/jeugd`, `/teams`) were built at different times and diverge in hero dimensions, diagonal transitions, quote sections, CTA layout, button styling, and color choices. This creates a fragmented user experience where structurally identical pages feel like different sites. The inconsistency also means every new landing page requires copy-pasting and manually aligning dozens of styling decisions instead of composing shared components.

## 2. Scope

**Touched:** `apps/web` only (components, pages, Storybook stories)

**Out of scope:**

- Homepage (`/`) — uses a different hero pattern (carousel + double-diagonal) by design
- Subpages (`/club/bestuur`, `/team/[slug]`, etc.) — separate concern
- Content changes — only structural/styling alignment, not copywriting
- `apps/api`, `packages/api-contract`, `apps/studio` — no changes

## 3. Tracer Bullet

Create the `LinkButton` component (extends `Button` API to `next/link`), wire it into the existing `TeamsCta` replacing the manual arrow/styling, and verify it renders correctly.

This proves the component extraction pattern works before building `PageHero` and `SectionCta`.

## 4. Phases

### Phase 1: LinkButton component (#1062)

Extract a `LinkButton` that wraps `next/link` with the same API as the existing `Button` design system component (variants, sizes, `withArrow`). Add Storybook story. Add to barrel export.

### Phase 2: SectionCta component (#1063)

Create a shared `SectionCta` component with the canonical CTA pattern:

- Centered layout, `max-w-[40rem]`
- Heading: `font-title font-extrabold text-kcvv-black`, responsive clamp sizing
- Body: `text-sm text-kcvv-gray leading-relaxed`
- Button: `LinkButton` primary variant with `withArrow`

Props: `heading`, `body`, `buttonLabel`, `buttonHref`

Replace all three CTA implementations:

- `ClubContactCta` → `SectionCta`
- `TeamsCta` → `SectionCta`
- Jeugd inline CTA JSX → `SectionCta`

Add Storybook story.

### Phase 3: PageHero component (#1064)

Create a shared `PageHero` replacing `ClubHero`, `JeugdHero`, `TeamsHero`. Canonical spec:

| Aspect            | Token / Value                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Min height        | `min-h-[60vh]`                                                                                  |
| Image filter      | `brightness(0.25) saturate(0.7)`                                                                |
| Gradient          | inline CSS rgba (consistent with Club/Jeugd pattern)                                            |
| Content position  | `flex items-end`                                                                                |
| Container         | `max-w-inner-lg mx-auto px-4 md:px-10 py-10 md:py-16`                                           |
| Label             | `text-xs font-extrabold uppercase tracking-label text-white/50` with `bg-kcvv-green` accent bar |
| Headline          | `font-title font-black text-white uppercase leading-hero text-hero`                             |
| Green highlight   | Configurable word(s) wrapped in `text-kcvv-green`                                               |
| Body text         | `text-lg text-white/60 leading-loose max-w-lg`                                                  |
| Optional CTA      | `LinkButton` primary variant with `withArrow`                                                   |
| Built-in diagonal | **None** — SectionStack handles transitions                                                     |

Props:

```typescript
interface PageHeroProps {
  image: string;
  imageAlt?: string;
  label: string;
  headline: React.ReactNode; // allows green <span> highlights
  body: string;
  cta?: { label: string; href: string };
}
```

Remove built-in SVG diagonals from ClubHero and JeugdHero. Delete the three old hero components after migration.

Add Storybook story with variants (with/without CTA).

### Phase 4: Unify page compositions + transitions (#1065)

Update all three page files to use shared components and consistent SectionStack config:

**Canonical section flow:**

| #   | Section                 | bg                | padding       | transition                          |
| --- | ----------------------- | ----------------- | ------------- | ----------------------------------- |
| 1   | PageHero                | `kcvv-black`      | `pt-0 pb-0`   | `diagonal right`, `overlap: "full"` |
| 2   | Editorial/Featured      | `gray-100`        | `pt-20 pb-20` | `diagonal left`                     |
| 3   | Dark content (optional) | `kcvv-black`      | `pt-20 pb-20` | `diagonal right`                    |
| 4   | Quote (MissionBanner)   | `kcvv-green-dark` | `pt-20 pb-20` | `diagonal right`                    |
| 5   | CTA (SectionCta)        | `gray-100`        | `pt-16 pb-16` | none (last section)                 |

**Per-page changes:**

`/club`:

- Replace `ClubHero` with `PageHero`
- Replace `ClubContactCta` with `SectionCta`
- Add missing transition on mission section (already has `diagonal right` — verify)

`/jeugd`:

- Replace `JeugdHero` with `PageHero`
- Replace inline CTA with `SectionCta`
- CTA bg: `gray-100` (was `white`)
- Add missing `transition: { type: "diagonal", direction: "right" }` on quote section

`/teams`:

- Replace `TeamsHero` with `PageHero` (with CTA prop)
- Youth directory bg: `kcvv-black` (was `kcvv-green-dark`)
- Add `MissionBanner` quote section after youth directory
- Replace `TeamsCta` with `SectionCta`
- Hero transition: add `overlap: "full"`

### Phase 5: Cleanup (#1066)

- Delete `ClubHero`, `JeugdHero`, `TeamsHero` components
- Delete `ClubContactCta`, `TeamsCta` components
- Remove unused imports
- Verify no other files reference deleted components

## 5. Acceptance Criteria Per Phase

### Phase 1: LinkButton

- [ ] `LinkButton` renders as `<a>` (via `next/link`) with identical styling to `Button`
- [ ] Supports all `Button` variants: `primary`, `secondary`, `ghost`, `link`
- [ ] Supports all sizes: `sm`, `md`, `lg`
- [ ] `withArrow` renders animated `ArrowRight` icon (reuses Button's pattern, no duplication)
- [ ] Storybook story at `UI/LinkButton` with Playground + variant stories
- [ ] Exported from `src/components/design-system/index.ts`
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2: SectionCta

- [ ] `SectionCta` renders centered layout matching Teams CTA visual pattern
- [ ] Uses `LinkButton` with `withArrow` (no manual ArrowRight)
- [ ] All three pages render CTAs identically (same heading style, same button style)
- [ ] Storybook story at `UI/SectionCta` with Playground
- [ ] Old CTA components still exist but are unused (deleted in Phase 5)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3: PageHero

- [ ] `PageHero` renders with all token values from the spec table above
- [ ] No built-in SVG diagonal — relies on SectionStack transition
- [ ] Optional CTA renders `LinkButton` when `cta` prop provided
- [ ] Storybook story at `Features/PageHero` with variants (with/without CTA)
- [ ] Old hero components still exist but are unused (deleted in Phase 5)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4: Page compositions

- [ ] All three pages use `PageHero`, `SectionCta`, `MissionBanner`
- [ ] SectionStack configs match the canonical flow table exactly
- [ ] `/teams` youth directory uses `kcvv-black` bg
- [ ] `/teams` has MissionBanner quote section
- [ ] `/jeugd` quote section has `transition: { type: "diagonal", direction: "right" }`
- [ ] `/jeugd` CTA bg is `gray-100`
- [ ] All hero transitions: `diagonal right` + `overlap: "full"`
- [ ] Visual regression check: all three pages follow same rhythm
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 5: Cleanup

- [ ] `ClubHero`, `JeugdHero`, `TeamsHero` directories deleted
- [ ] `ClubContactCta`, `TeamsCta` directories deleted
- [ ] No broken imports across the codebase
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. This is a pure frontend component refactor.

## 7. Open Questions

- [ ] `PageHero` Storybook group: `UI/PageHero` (pure design system) or `Features/PageHero` (knows about KCVV layout conventions)? — Leaning `Features/` since it encodes specific KCVV design decisions (gradient, label bar style). Will decide during implementation.
- [ ] `SectionCta` Storybook group: `UI/SectionCta` or `Features/SectionCta`? — Same question. Leaning `UI/` since it's generic (heading + body + button).
- [ ] Should `YouthTeamsDirectory` be checked for green-dark-specific color assumptions when moving to `kcvv-black` bg? — Will be answered during Phase 4 implementation.

## 8. Discovered Unknowns (filled during implementation)

```
(none yet)
```
