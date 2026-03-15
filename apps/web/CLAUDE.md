# apps/web — Next.js App

This is the KCVV Elewijt club website. See root `.claude/CLAUDE.md` for monorepo-wide rules.

## Implemented Routes

`/`, `/news`, `/news/[slug]`, `/players/[slug]`, `/team/[slug]`, `/jeugd`, `/game/[matchId]`, `/sponsors`, `/club/organigram`, `/hulp`, `/search`, `/privacy`

## Test Coverage

- Services ~98% | Schemas 100% | Components 100% | Utils ~74%
- Gap: `dates.ts` at 52%, 3 unused schemas at 0%
- No E2E tests yet (Playwright configured, no specs)

## Design System & Storybook (MANDATORY)

### When to update UI stories

- **New design system component** (`src/components/design-system/<Name>/`) → create `<Name>.stories.tsx` alongside with title `UI/<Name>`, add `tags: ["autodocs"]`, write a Playground + all variant stories. Also add to barrel `src/components/design-system/index.ts`.
- **New icon** added to `src/lib/icons.ts` → add to the `Foundation/Spacing & Icons` icon grid in `src/stories/foundation/SpacingAndIcons.mdx`.
- **Existing component changed** (new variant, new prop) → update the corresponding story and test files.

### When to update Foundation MDX

- **New color token** in `src/app/globals.css` `@theme {}` → add a swatch to `src/stories/foundation/Colors.mdx`.
- **New font/type token** → add to `src/stories/foundation/Typography.mdx`.
- **New spacing / breakpoint / shadow token** → add to `src/stories/foundation/SpacingAndIcons.mdx`.

### Story authoring rules

- **Handlers:** use `fn()` from `storybook/test` in `meta.args`, never `argTypes: { prop: { action: "..." } }`.
- **Story type:** `StoryObj<typeof meta>`, not `StoryObj<typeof ComponentName>`.
- **No non-null assertions** on fixture lookups — use `?? fallback` so the story never crashes at import time.
- **Non-serialisable props** (e.g. `Set<string>`): define a `StoryArgs` type override with a serialisable equivalent and convert in a named render helper. No `as unknown as` casts in `args`.

### Storybook navigation structure (MANDATORY)

Use these top-level groups — enforced by `storySort` in `.storybook/preview.ts`:

| Group         | What goes here                                                                                                                                   | title prefix         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| `Foundation/` | Design tokens only — Colors, Typography, Spacing, Icons (MDX docs, no component stories)                                                         | `Foundation/`        |
| `UI/`         | Pure design system primitives with zero domain knowledge — could ship as a standalone package                                                    | `UI/`                |
| `Features/`   | Domain components that require KCVV data types (Articles, Calendar, Home, Matches, Organigram, Players, Responsibility, Search, Sponsors, Teams) | `Features/<Domain>/` |
| `Layout/`     | Page infrastructure — PageHeader, PageFooter, PageTitle                                                                                          | `Layout/`            |
| `Pages/`      | Full-page compositions                                                                                                                           | `Pages/`             |

**Rule:** If a new component knows about `MatchResult`, `Player`, `Sponsor`, or any other KCVV domain type → it goes in `Features/<Domain>/`. If it's a generic primitive → `UI/`. Never nest domain components directly at the top level.

### MDX table gotcha

MDX 2 (Storybook 10) does **not** parse GFM pipe-table syntax (`| col |`) without `remark-gfm`. Always use native HTML `<table>` elements in `.mdx` files.

## Design Conventions (Redesign — locked)

### Section padding

All full-width page sections use `py-20` (80px). Do not use `py-16`, `py-24`, or other values
for top-level sections — consistency is load-bearing for the dark/light alternation rhythm.

### Border-radius

| Context                                       | Class                      | Value         |
| --------------------------------------------- | -------------------------- | ------------- |
| Interactive elements (buttons, chips, badges) | `rounded-sm`               | 2px           |
| Cards                                         | `rounded`                  | 4px (maximum) |
| Never outside design system components        | `rounded-lg`, `rounded-xl` | —             |

No `rounded-lg` or larger outside of design system primitives.

### Colour tokens (redesign palette)

| Token             | Hex       | Usage                                        |
| ----------------- | --------- | -------------------------------------------- |
| `kcvv-green`      | `#4acf52` | Primary brand — CTAs, accents, active states |
| `kcvv-green-dark` | `#008755` | Dark section backgrounds, depth accents      |
| `kcvv-black`      | `#1E2024` | Nav, dark sections                           |

### Section alternation

Dark/light sections must alternate: `kcvv-black` / `kcvv-green-dark` ↔ white / `gray-100`.
Never two dark or two light sections in a row.

### Design system locations

| Concern           | Path                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| Component source  | `src/components/design-system/<Name>/`                                        |
| Component stories | `src/components/design-system/<Name>/<Name>.stories.tsx` (title: `UI/<Name>`) |
| Component tests   | `src/components/design-system/<Name>/<Name>.test.tsx`                         |
| Barrel export     | `src/components/design-system/index.ts`                                       |
| Icons             | `src/lib/icons.ts`                                                            |
| Foundation docs   | `src/stories/foundation/`                                                     |
| Design tokens     | `src/app/globals.css` (`@theme {}`)                                           |
