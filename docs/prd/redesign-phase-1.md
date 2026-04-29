# Redesign — Phase 1: Tier B composition primitives

> **Master design reference:** `docs/plans/2026-04-27-redesign-master-design.md`
> **Tracking issue:** [#1523](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1523)
> **Implementation plan:** `docs/plans/2026-04-29-redesign-phase-1-plan.md`
> **Milestone:** `redesign-retro-terrace-fanzine`
> **Epic:** KCVV Elewijt redesign — retro-terrace fanzine aesthetic
> **Predecessor:** [#1521](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1521) — Phase 0 (closed; merged in [#1519](https://github.com/soniCaH/www.kcvvelewijt.be/pull/1519))
> **Blocks:** Phase 2 atom rework ([#1524](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1524)) and every later phase
> **Owner:** _you_
> **Estimate:** ~2 weeks

---

## Context

Phase 0 landed the foundation: tokens, seven Tier A decorative primitives, Foundation MDX, VR baselines. Phase 1 ships the **eight Tier B composition primitives** that compose Tier A pieces into editorial building blocks every later phase will reuse.

The work is **Storybook-only**. No page-level changes, no `Features/*` edits, no atoms (`<Button>`, `<Input>`, etc.) reworked yet — atoms are Phase 2. The visual contract is the Storybook `UI/<Name>` story per primitive, with `tags: ["autodocs", "vr"]` and baselines committed in this PR.

The two existing components that touch Tier B in Phase 1 are:

- **`<SectionHeader>`** — reworked from the legacy `font-body!`-overridden green-bar pattern to a thin wrapper that composes `<EditorialHeading>` + `<MonoLabelRow>`. Existing consumers continue to render via the same import path; the visual treatment changes per the redesign mockups.
- **`<Badge>`** — retired. There is exactly one consumer in the codebase (`MatchStatusBadge.tsx`, see audit in §7). That consumer migrates to `<MonoLabel variant="pill-…">`. The `design-system/Badge/` folder is deleted in this PR.

---

## Goals

1. Ship eight Tier B primitives at `apps/web/src/components/design-system/<Name>/` with the four standard files (`<Name>.tsx`, `<Name>.stories.tsx`, `<Name>.test.tsx`, `index.ts`) and barrel exports.
2. Rework `<SectionHeader>` to compose `<EditorialHeading>` + `<MonoLabelRow>`. Update existing call sites in place — no API break.
3. Retire `<Badge>` (delete folder + barrel exports). Migrate `MatchStatusBadge` to `<MonoLabel variant="pill-jersey" | "pill-ink" | "pill-cream">`.
4. VR baselines committed for every new `UI/<Name>` story and the reworked `UI/SectionHeader` story.
5. Update `apps/web/CLAUDE.md` "Redesign primitives" list to reflect Phase 1 additions.
6. **Zero new tokens.** Tier B is composition over Phase 0 tokens; if a primitive needs a value not in `globals.css`, that's a signal to revisit Phase 0, not to add tokens here.

---

## Non-goals

- Refactoring atoms (`<Button>`, `<Input>`, `<Select>`, `<Textarea>`, `<Label>`, `<Alert>`, `<Spinner>`, `<BrandedTabs>`, `<FilterTabs>`). Phase 2.
- Tier C domain figures (`<PlayerFigure>`, `<JerseyShirt>`, `<EndMark>`, `<QASectionDivider>`). Phase 3.
- `<EditorialHero>` variants. Phase 3.
- `<NewsCard>` / `<EventCard>` / `<PlayerCard>` / `<TeamCard>` etc. Phase 4–7.
- Page-level composition.
- Multi-line `<HighlighterStroke>` wrapping support (see §11 Open questions).
- Adding new colour, type, spacing, shadow, or motion tokens.
- Migrating any consumer of `<SectionHeader>` to a different primitive — the rework is structural, the call sites do not change.

---

## 1. No new tokens

Phase 1 adds **zero** entries to `apps/web/src/app/globals.css`. Every visual property used by every primitive in §3 already exists in the Phase 0 token set. If implementation reveals a missing value, treat that as a Phase 0 escape and patch it inside the existing `/* ===== Redesign / … (Phase 0) ===== */` blocks rather than opening a new section.

---

## 2. Storybook structure

All eight primitives live under `UI/<Name>` (per `apps/web/CLAUDE.md`). Each story file:

- Has `tags: ["autodocs", "vr"]` from the first commit.
- Includes a Playground story exposing every prop via `argTypes`.
- Includes one named story per discrete prop combination that meaningfully changes the rendering.
- Uses `fn()` from `storybook/test` for any handler args.
- Uses fixtures with deterministic content — short Dutch strings and stable image src URLs (Storybook static asset or pinned data URL). No `Math.random` or live dates.

The reworked `<SectionHeader>` story stays under `UI/SectionHeader` (existing path). Its baseline updates are justified in the PR body's `## VR baselines` section per the VR contract.

---

## 3. Primitive catalogue

Listed in dependency order — each primitive may compose Tier A primitives and earlier Tier B primitives in the list, but never later ones.

### 3.1 `<TapedCard>` — paper-card wrapper

The dominant card primitive of the redesign. Wraps any child in a rotated paper rectangle with optional washi-tape corners, hard offset shadow, and a coloured surface.

**Props**

```typescript
type TapedCardRotation =
  | "a" // -2.5deg (--rotate-tape-a)
  | "b" // -1.5deg (--rotate-tape-b)
  | "c" //  1deg   (--rotate-tape-c)
  | "d" //  2deg   (--rotate-tape-d)
  | "none" // no rotation
  | "auto" // consume rotation from <TapedCardGrid> via CSS custom property
  | number; // explicit deg override

interface TapedCardProps {
  rotation?: TapedCardRotation; // default: "none"
  tape?: TapeStripProps | TapeStripProps[]; // 0–4 corner tapes
  shadow?: "sm" | "md" | "lift"; // default: "md"
  bg?: "cream" | "cream-soft" | "ink" | "jersey"; // default: "cream"
  padding?: "sm" | "md" | "lg" | "none"; // default: "md"
  interactive?: boolean; // default: false — see §3.1 motion
  as?: "div" | "article" | "section" | "li" | "figure"; // default: "div"
  className?: string;
  children: React.ReactNode;
}
```

**Notes**

- `rotation="auto"` reads `--taped-card-rotation` from the parent (set by `<TapedCardGrid>` via `nth-child` rules). When the value is unset the card renders at `0deg` — the auto-mode is opt-in by being inside a grid.
- `bg="ink"` flips text to cream by default — primitives composed inside should call `text-cream` explicitly only when overriding the inherited surface.
- `tape` accepts a single `TapeStripProps` for a single corner or an array for multiple corners; nothing prevents two tapes on the same `position` (visually overlapping is acceptable).
- `as="li"` is required when used directly inside a `<TapedCardGrid as="ol" | "ul">`.

**Motion (decision: `interactive` is opt-in)**

When `interactive` is `true`, hover applies a subtle additional rotation (~`+0.5deg` opposite to the resting rotation) and shadow upgrade (`shadow-paper-md` → `shadow-paper-lift`) over `--motion-tape`. Wrapped in `@media (prefers-reduced-motion: no-preference)` — when the user prefers reduced motion the card stays static.

When `interactive` is `false` (default), no hover effect fires regardless of motion preference. Most usages (table panels, stat strips, RSVP forms) should not wobble; article hero polaroids and news cards opt in explicitly.

**Stories**

Playground + matrices:

- `RotationVariants` — `a`, `b`, `c`, `d`, `none`, `auto` (rendered inside a parent that sets `--taped-card-rotation: -1.25deg`)
- `ShadowVariants` — `sm`, `md`, `lift`
- `BgVariants` — `cream`, `cream-soft`, `ink`, `jersey`
- `WithTape` — single `tl` jersey tape; full 4-corner mixed
- `Interactive` — `interactive: true`, hover demonstrated via `parameters: { pseudo: { hover: true } }` (the addon is already used in `BrandedTabs` stories)
- `PaddingMatrix` — `sm` / `md` / `lg` / `none`

### 3.2 `<TapedCardGrid>` — auto-rotation grid

Grid wrapper that distributes the 4-rotation pool across slots via `nth-child(4n+1..4)`. Children rendered with `<TapedCard rotation="auto">` consume the slot's rotation through a CSS custom property.

**Props**

```typescript
interface TapedCardGridProps {
  columns?: 1 | 2 | 3 | 4; // default: 3
  gap?: "sm" | "md" | "lg"; // default: "md"
  as?: "div" | "ol" | "ul"; // default: "div"
  emptyState?: React.ReactNode; // rendered when children is empty
  className?: string;
  children?: React.ReactNode;
}
```

**Behaviour (decision: edge cases)**

- **1-card grid:** still rotates. Slot 0 always gets `--rotate-tape-a` (`-2.5deg`). No special-case for `Children.count === 1`.
- **Empty grid:** if `emptyState` prop is provided, render it. Otherwise render `null`. The primitive ships zero opinionated copy — calling pages own the empty-state text and tone (Dutch, brand voice).
- **Non-card children:** the grid does not enforce that children are `<TapedCard>` instances; consumers may render any element per slot. The CSS variable is set unconditionally so any descendant `<TapedCard rotation="auto">` picks it up.

**Stories**

Playground + matrices:

- `Columns1`, `Columns2`, `Columns3`, `Columns4` — same fixture set, varying columns prop
- `MixedRotations` — explicit children mix of `<TapedCard rotation="auto">` and `rotation="none"`
- `EmptyWithFallback` — `emptyState` rendered with sample Dutch copy as a fixture string passed by the story
- `EmptyWithoutFallback` — `tags: ["vr-skip"]` because rendering nothing yields a 0×0 box that would not capture meaningfully; documented inline.

### 3.3 `<TapedFigure>` — editorial photo + caption

Composes `<TapedCard>` + a caller-controlled image element + optional caption / credit row.

**Decision (image source):** the primitive accepts the image as `children` (slot pattern) — caller picks `next/image`, `<SanityImage>`, plain `<img>`, etc. The primitive owns the polaroid frame, aspect-ratio enforcement, caption typography. **Mobile-first contract:** the inner container sets `aspect-ratio` via CSS so the rendered image always letterboxes to the chosen aspect at every viewport — callers passing `next/image` should also pass `sizes="(min-width: 768px) 50vw, 100vw"` (or similar) so responsive loading respects the fluid frame width.

**Props**

```typescript
interface TapedFigureProps {
  /** The image element to render inside the polaroid frame. Caller decides next/image, SanityImage, plain <img>, etc. */
  children: React.ReactNode;
  alt?: string; // surfaced for documentation only — caller's <img>/Image owns the actual alt
  aspect?: "landscape-16-9" | "square" | "portrait-3-4" | "auto"; // default: "landscape-16-9"
  caption?: string;
  credit?: string;
  rotation?: TapedCardProps["rotation"]; // default: "none"
  tape?: TapedCardProps["tape"];
  bg?: "cream" | "cream-soft"; // default: "cream" — paper-feel only, no ink/jersey
  className?: string;
}
```

**Behaviour**

- Caption renders in `--text-body-sm` cream/ink-muted; credit renders in `--text-mono-sm` ink-muted aligned to the right within a flex row that wraps on narrow viewports.
- `aspect="auto"` lets the image's intrinsic dimensions drive the frame — used for portrait sponsor logos, edge-case mixed grids.
- The primitive is server-component-safe (no `"use client"`).

**Stories**

- `Default` — landscape 16:9, no caption
- `WithCaption`
- `WithCredit`
- `WithCaptionAndCredit`
- `Square`, `Portrait`, `Auto`
- `RotatedAndTaped` — `rotation="b"`, `tape={[{ position: 'tl', color: 'jersey' }]}`
- `InsideGrid` — three figures inside a `<TapedCardGrid>` to verify auto-rotation cascade

### 3.4 `<MonoLabelRow>` — inline label list

Renders a flex row of `<MonoLabel>` instances separated by a divider glyph.

**Props**

```typescript
interface MonoLabelRowProps {
  /** divider glyph between adjacent items. Default: middle-dot "·". */
  divider?: "·" | "|" | "/" | "★";
  /** label entries */
  items: Array<{
    label: string;
    variant?: MonoLabelProps["variant"];
    size?: MonoLabelProps["size"];
  }>;
  /** rendered element */
  as?: "div" | "ol" | "ul"; // default: "div"
  /** wrap behaviour at narrow viewports */
  wrap?: boolean; // default: true
  className?: string;
}
```

**Behaviour**

- Renders each item via `<MonoLabel>` with the per-item variant/size; the row handles divider + spacing + wrap.
- Dividers render via `aria-hidden` `<span>` so screen readers read the labels as a list.
- `as="ol" | "ul"` wraps each item in `<li>`. `as="div"` uses inline `<span>`.

**Stories**

- `Default` — three plain labels with `·` divider
- `MixedVariants` — plain + pill-jersey + pill-ink combination
- `WithStarDivider`
- `LongRowWraps` — six items at narrow viewport
- `OrderedList` — `as="ol"` with stamnummer-style entries

### 3.5 `<EditorialHeading>` — period-terminated heading

The redesign's primary headline primitive. Renders a Freight Display heading with optional italic emphasis word and optional `<HighlighterStroke>` underline beneath that emphasis.

**Props**

```typescript
type EditorialHeadingSize =
  | "display-2xl" // freight-big-pro 900
  | "display-xl"
  | "display-lg"
  | "display-md"
  | "display-sm";

interface EditorialHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6; // semantic h-level
  size?: EditorialHeadingSize; // default: "display-lg"
  /** the full heading text — the period is added automatically if missing */
  children: string;
  /** italic emphasis treatment applied to a substring */
  emphasis?: {
    text: string; // substring of children to emphasise
    highlight?: boolean; // wrap emphasised text in <HighlighterStroke>
    highlightVariant?: "a" | "b" | "c";
  };
  tone?: "ink" | "jersey-deep" | "cream"; // default: "ink"
  className?: string;
}
```

**Behaviour**

- Auto-period: if `children.endsWith(".")` no change; otherwise append a `.`. Headlines like `"Het rooster"` render as `Het rooster.`.
- Emphasis: substring match is case-sensitive and matches the first occurrence. If the emphasis text isn't found, the heading renders without italic styling and the component logs a development-mode warning (`console.warn` gated by `process.env.NODE_ENV === "development"`).
- Highlight composes `<HighlighterStroke variant="a" | "b" | "c" color="jersey">` around the emphasised substring. **Single-line only** — see §11 Open questions for the multi-line deferral and trip-wires.
- `level` controls the rendered tag (`<h1>` … `<h6>`); `size` controls visual treatment. The two are independent — a `level={2}` `size="display-2xl"` heading is valid.

**Stories**

- `Default` — `level={2}`, `size="display-lg"`, no emphasis
- `WithEmphasisInline` — `emphasis: { text: "nieuws" }` inside `Het laatste nieuws.`
- `WithEmphasisHighlighted` — same as above with `highlight: true`
- `EveryLevel` — `h1`–`h6` rendered with `display-md`
- `EverySize` — `display-2xl` through `display-sm` at fixed `level={2}`
- `ToneVariants` — `ink`, `jersey-deep`, `cream` (cream rendered on ink bg)

### 3.6 `<PullQuote>` — taped quote block

Composes `<TapedCard>` + `<QuoteMark>` + an italic display body + an attribution row.

**Props**

```typescript
interface PullQuoteProps {
  /** the quoted text — wrapped in <q> with italic display styling */
  children: string;
  attribution: {
    name: string;
    role?: string;
    source?: string;
  };
  /** colour palette */
  tone?: "cream" | "ink" | "jersey"; // default: "cream"
  /** rotation/tape pass-through to the underlying TapedCard */
  rotation?: TapedCardProps["rotation"];
  tape?: TapedCardProps["tape"];
  className?: string;
}
```

**Behaviour**

- `tone="cream"` → cream paper, ink text, jersey QuoteMark.
- `tone="ink"` → ink paper, cream text, jersey QuoteMark.
- `tone="jersey"` → jersey paper, ink text, cream QuoteMark.
- Body renders at `--text-display-sm` Freight Display italic.
- Attribution row uses `<MonoLabel>` for name (uppercase), separated from role/source by `·`.

**Stories**

- `Default` — `tone="cream"`, name only
- `WithRoleAndSource`
- `ToneInk`, `ToneJersey`
- `Rotated` — `rotation="b"`, `tape` from the `tl` corner
- `LongQuote` — long Dutch quote to verify wrap and italic readability

### 3.7 `<NumberDisplay>` — graphic monumentation

Big serif number used as a graphic device — jersey numbers, stat counters, year markers.

**Props**

```typescript
interface NumberDisplayProps {
  value: string | number;
  size?: "display-2xl" | "display-xl" | "display-lg"; // default: "display-xl"
  tone?: "jersey" | "jersey-deep" | "ink" | "cream"; // default: "ink"
  prefix?: "#" | "nr." | string;
  suffix?: string;
  /** label rendered underneath in mono */
  label?: string;
  /** semantic role */
  as?: "span" | "div" | "p"; // default: "span"
  className?: string;
}
```

**Behaviour**

- Renders the value in `--font-display-big` (Freight Big Pro) at the chosen size.
- `prefix` renders in `--font-display` (Freight Display Pro) at `0.6em` scale. `suffix` matches.
- `label` renders below in `--text-mono-sm` ink-muted (cream-muted on ink bg).
- `as="div"` adds a flex-column wrapper so labelled instances don't break inline flow.

**Stories**

- `JerseyNumber` — `#8` size `display-2xl` jersey
- `StatCounter` — `28` size `display-xl` ink with label `WEDSTRIJDEN`
- `YearMarker` — `2374` size `display-lg` jersey-deep
- `WithPrefix` — `nr. 55` size `display-xl`
- `WithSuffix` — `28+` size `display-xl`
- `LabeledRow` — three `<NumberDisplay>` instances with labels rendered side by side (validates flex behaviour inside `<StatsStrip>`-like usage)

### 3.8 `<DropCapParagraph>` — lead paragraph with oversized first letter

Lead paragraph treatment. Renders the first character at `display-2xl` Freight Big Pro 900, jersey-tinted, with proper screen-reader handling.

**Decision (accessibility):** the visual cap is wrapped in `aria-hidden="true"` and the same character is repeated immediately afterward inside a `<span className="sr-only">`. Screen readers thus pronounce the word as written; sighted readers see the cap. Same paragraph remains a single semantic block.

**Props**

```typescript
interface DropCapParagraphProps {
  as?: "p" | "div"; // default: "p"
  tone?: "jersey" | "ink"; // cap colour, default: "jersey"
  /** the paragraph body — must be a string for first-character extraction */
  children: string;
  className?: string;
}
```

**Behaviour**

- `children.charAt(0)` is rendered as the visual cap (rejected: combining diacritics — if the first character lacks a base glyph the cap collapses to the second character; a development-mode warning fires).
- The remainder of the paragraph renders inline immediately after the visual cap.
- `as="p"` is the default; `as="div"` is provided for nested-paragraph contexts (e.g. inside a card with a separate heading element).

**Stories**

- `Default` — Dutch lead paragraph, jersey cap
- `ToneInk`
- `LongParagraph` — multi-line body to verify cap doesn't break wrap
- `WithDiacritic` — body starts with `Échec` to verify accent renders inside the cap; documented inline

---

## 4. Existing component reworks

### 4.1 `<SectionHeader>` rework

**Current shape (legacy)**

```typescript
interface SectionHeaderProps {
  title: string;
  linkText?: string;
  linkHref?: string;
  variant?: "light" | "dark";
  as?: "h1" | "h2" | "h3";
  className?: string;
}
```

The current implementation overrides global `h1-h6 {}` cascade with `font-body!`/`font-black!`/`mb-0!` and renders a green left-border bar. It targets the legacy aesthetic.

**Phase 1 shape (redesign)**

```typescript
interface SectionHeaderProps {
  title: string;
  /** optional kicker rendered above the heading via <MonoLabelRow> */
  kicker?: Array<{
    label: string;
    variant?: MonoLabelProps["variant"];
  }>;
  /** optional emphasis pass-through to the underlying <EditorialHeading> */
  emphasis?: EditorialHeadingProps["emphasis"];
  /** size of the underlying <EditorialHeading> */
  size?: EditorialHeadingSize; // default: "display-lg"
  /** existing CTA props — unchanged */
  linkText?: string;
  linkHref?: string;
  /** "light" = ink on cream (default); "dark" = cream on ink */
  variant?: "light" | "dark";
  /** semantic level — unchanged */
  as?: "h1" | "h2" | "h3";
  className?: string;
}
```

**Changes**

- Drops every `!important` font/colour override. The redesign controls cascade through tokens, not specificity hacks.
- Drops the green left-border bar. The new visual contract is `<EditorialHeading>` (period-terminated, optional italic emphasis) above a thin `<MonoLabelRow>`-driven kicker.
- `kicker` is additive — existing call sites that don't pass `kicker` get a clean heading with no kicker row.
- The CTA link styling shifts from the legacy uppercase tracked-bold to a `<MonoLabel variant="plain">` tone with a Phosphor `→` arrow. (Phosphor itself lands in Phase 2 — Phase 1 keeps the existing `→` typographic glyph already in `SectionHeader` line 67.)
- All nine existing call sites continue to work without modification beyond the visual change. Verified consumers:
  - `BestuurPage.tsx`
  - `Homepage.stories.tsx`
  - `MatchesSliderSection.tsx`
  - `NewsGrid.tsx`
  - `SponsorsSection.tsx`
  - `MatchesSliderEmptyState.tsx`
  - `CategorySection.tsx` (hulp)
  - `YouthTeamsDirectory.tsx`
  - `SponsorsSection.stories.tsx`

The Storybook `UI/SectionHeader` story file is updated; baselines are recaptured. The rework is the single largest existing-baseline update in this PR — its delta is enumerated in the PR body's `## VR baselines` section per `apps/web/CLAUDE.md` §VR.

### 4.2 `<Badge>` retirement

**Current consumers (audited 2026-04-29):**

```text
apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.tsx
```

Exactly **one** consumer in production code. `<Badge>` is also imported by its own test/story files and re-exported from the design-system barrel — those references retire with the folder.

**Migration**

`MatchStatusBadge.tsx` currently maps colour strings to `BadgeVariant` and renders `<Badge variant={…}>label</Badge>`. The migration:

1. Replace `import { Badge }` / `import type { BadgeVariant }` with `import { MonoLabel }` / `import type { MonoLabelProps }`.
2. Re-map the colour table to `MonoLabelProps["variant"]`:
   ```typescript
   const colorToVariant: Record<string, MonoLabelProps["variant"]> = {
     red: "pill-ink", // was BadgeVariant red
     yellow: "pill-cream",
     green: "pill-jersey",
     blue: "pill-cream",
   };
   ```
   The exact mapping is finalised during implementation against the actual `MatchStatus` enum and current `BadgeVariant` values.
3. Update `MatchStatusBadge.stories.tsx` and `MatchStatusBadge.test.tsx` to assert the new pill rendering.
4. Delete `apps/web/src/components/design-system/Badge/`.
5. Remove `Badge` exports from `apps/web/src/components/design-system/index.ts`.
6. Run `pnpm --filter @kcvv/web run check-all` — TypeScript surfaces any reference we missed.

Because the migration is so small, it lands inside the same PR as the primitives. A standalone PR would be churn.

---

## 5. Storybook deliverables

### 5.1 New `UI/<Name>` stories

One file per primitive, all with `tags: ["autodocs", "vr"]`, all baselines committed in this PR:

- `UI/TapedCard`
- `UI/TapedCardGrid`
- `UI/TapedFigure`
- `UI/MonoLabelRow`
- `UI/EditorialHeading`
- `UI/PullQuote`
- `UI/NumberDisplay`
- `UI/DropCapParagraph`

### 5.2 Updated `UI/SectionHeader` story

The existing story file is rewritten to reflect the redesigned API. Baselines updated; rationale in the PR body.

### 5.3 Foundation MDX

No new Foundation MDX in Phase 1. Phase 0 already documents the tokens Tier B consumes.

### 5.4 VR contract

Per `apps/web/CLAUDE.md` §Visual Regression Testing:

- All eight new `UI/<Name>` stories tagged `["autodocs", "vr"]` from the first commit.
- The reworked `UI/SectionHeader` story keeps its existing `vr` tag.
- Baselines captured inside the pinned `mcr.microsoft.com/playwright:v1.59.1-noble` container via `pnpm --filter @kcvv/web run vr:update`.
- New baselines are first-time captures (acceptable per the VR contract). Updated baselines (only `UI/SectionHeader`) are justified in the PR body's `## VR baselines` section.

---

## 6. Acceptance criteria

- [ ] All eight Tier B primitives exist at `apps/web/src/components/design-system/<Name>/<Name>.tsx` with `<Name>.stories.tsx`, `<Name>.test.tsx`, and `index.ts`.
- [ ] All eight primitives are exported from `apps/web/src/components/design-system/index.ts`.
- [ ] Every primitive has a Storybook story under `UI/<Name>` with `tags: ["autodocs", "vr"]` and the variant matrix described in §3.
- [ ] Every primitive has a Vitest unit test covering: prop defaults, prop overrides that change the rendered DOM, edge-case prop combinations called out in §3 (e.g. `<EditorialHeading>` emphasis-not-found warning, `<DropCapParagraph>` first-character extraction, `<TapedCardGrid>` `emptyState` fallback).
- [ ] `<SectionHeader>` is reworked: drops `!important` overrides, composes `<EditorialHeading>` + `<MonoLabelRow>`, all nine existing call sites continue to compile and render.
- [ ] `<Badge>` folder is deleted; `Badge` exports removed from the barrel; `MatchStatusBadge` is migrated to `<MonoLabel>`.
- [ ] No new tokens added to `apps/web/src/app/globals.css`.
- [ ] `pnpm --filter @kcvv/web run check-all` passes (lint, type-check, unit tests).
- [ ] `pnpm --filter @kcvv/web run vr:check` passes after baselines are captured.
- [ ] PR body includes a `## VR baselines` section enumerating all new baselines as first-time captures and justifying the `UI/SectionHeader` baseline update.
- [ ] `apps/web/CLAUDE.md` §"Redesign primitives (Phase 0+)" updated to list Phase 1 additions.
- [ ] A follow-up GitHub issue is created tracking the multi-line `<HighlighterStroke>` deferral (see §11).

---

## 7. Out of scope

- Multi-line `<HighlighterStroke>` wrapping support (deferred — see §11).
- Phosphor Fill icon migration. Phase 2 atom rework owns the dependency install + `src/lib/icons.ts` rewrite. Phase 1 primitives keep the existing `→` typographic glyph already in `SectionHeader`.
- Refactoring any consumer of `<SectionHeader>` to use Phase 1 primitives directly. The rework is structural — consumers continue to import `<SectionHeader>` unchanged.
- `<NewsCard>` `aspectRatio` prop. Phase 4 owns `<NewsCard>`.
- Animation primitives beyond `<TapedCard interactive={true}>` hover.
- Removing legacy tokens. Phase 9 only.
- Migrating any other `Features/*` component to Tier B primitives.

---

## 8. Analytics

Phase 1 ships **no user-facing interactive UI**. All work is design-system primitives + Storybook documentation + a single internal component rename (`Badge` → `MonoLabel` inside `MatchStatusBadge`). No new events, no new GA4 dimensions, no GTM changes.

This is consistent with `apps/web/CLAUDE.md` §"Analytics Checklist for New Features" — the checklist applies to **user-facing features**. A pure primitives PR has nothing to instrument; the analytics responsibility lives at the page that consumes the primitive (Phases 4–8).

`<TapedCard interactive={true}>` hover is a visual affordance only — it does not emit events.

---

## 9. SEO & structured data

Same reasoning as §8. No page-level changes; no JSON-LD impact.

---

## 10. Testing model

Per `apps/web/CLAUDE.md` §"Layered testing model":

| Layer                       | Tool                                 | Phase 1 coverage                                                 |
| --------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| Unit / component logic      | Vitest                               | One `<Name>.test.tsx` per primitive (see §6 acceptance criteria) |
| Component visual regression | Storybook + `@storybook/test-runner` | All eight new `UI/<Name>` baselines + updated `UI/SectionHeader` |
| Page-level functional smoke | Playwright e2e                       | Not exercised — Phase 1 ships no page changes                    |

Tier B primitives are all server-component-safe by default. Any primitive that escapes that constraint during implementation (only candidate today is `<TapedCard interactive={true}>` if it ever needs a client-side measurement) must document the `"use client"` reason inline.

---

## 11. Open questions tracked across phases

### 11.1 Multi-line `<HighlighterStroke>` wrapping (decision: deferred)

Master design decision 9 stated: _"Phase 0 ships single-line only; multi-line wrapping is deferred to Phase 1+."_ Phase 1 keeps that deferral — `<EditorialHeading>` headlines are display-sized and rarely wrap inside the emphasized word, so no Phase 1 consumer needs multi-line support.

**Trip-wires** (so this can't get lost):

1. **This PRD's §7 Out of scope** explicitly names the deferral.
2. **A new GitHub issue** is opened in Phase 1's PR step `Step 7 — Track follow-up` titled `feat(ui): multi-line <HighlighterStroke> wrapping helper` with `nice to have` label and a body that links back to this section.
3. **`apps/web/CLAUDE.md` §"Redesign primitives (Phase 0+)"** continues to flag `<HighlighterStroke>` as `single-line CSS-bg SVG; multi-line is a deferred Phase 1+ enhancement` — Phase 1 does not edit that line.
4. **Phase 5 (article detail) PRD** — when authored, must reference this section and decide whether multi-line landing inside Phase 5 is required for body-copy emphasis spans, or whether the primitive can ship as-is. The first phase to need multi-line is the phase that builds the helper.

### 11.2 `<TapedCard interactive>` rotate-on-hover delta

The hover increment (`+0.5deg` opposite to resting rotation) is a starting point. After Phase 4 (homepage rebuild) lands and real news cards exercise the hover state on real-world content lengths, the delta may need tuning. Track the decision; do not optimise blind in Phase 1.

### 11.3 `<DropCapParagraph>` diacritic edge

`children.charAt(0)` returns the base character for typical Dutch diacritics (`É`, `Ë`, `Ï`). Combining-mark cases (e.g. precomposed `é` vs decomposed `é`) are handled by the same `charAt(0)` returning the base, but rendering depends on font support inside Freight Big Pro 900. The dev-mode warning + a `WithDiacritic` story documents the contract; if Phase 5 articles produce a real-world failure, fix at that time.

### 11.4 Inset dashed border for ticket-style cards (deferred to Phase 4)

The retro-terrace-fanzine mockups include a NewsCard variant where the photo half of the card carries a dashed inset border, evoking a perforated event ticket (visible on the "Eetfestijn" card in the homepage news grid). This is **not** a Tier B primitive concern — it is a NewsCard composition decoration applied per article type. Tracked here so it lands in Phase 4 (homepage rebuild) when `<NewsCard>` is built; not needed in Phase 1.

### 11.5 `<TapedCardGrid>` rotation tuning (re-evaluate at Phase 4)

The 4-rotation pool (`-2.5°`, `-1.5°`, `1°`, `2°`) inherited from the master design tokens is applied to every slot in `<TapedCardGrid>`. The retro-terrace-fanzine homepage mockups show news cards mostly upright with only occasional slight rotation — suggesting the auto-rotation default may be too aggressive for a real news grid. Phase 1 ships the master-design pool as-is. **Phase 4 (homepage rebuild) PRD must decide:** keep auto-rotation at current intensity, dial it down (smaller pool), or flip the default to no-rotation with rotation as opt-in per card. Decision driven by visual checkpoint with real article content, not in advance.

### 11.6 `<TapeStrip>` realism (parked)

Owner feedback during Phase 1 implementation: the Phase 0 flat-block `<TapeStrip>` reads more authentically than CSS-gradient overlays or feTurbulence-driven SVG grain when composed onto a `<TapedCard>`. Two iteration attempts (gradient overlay + SVG grain) were reverted. If a future phase still wants a more washi-tape feel, the next experiment to try is **hand-drawn SVG variants** (`variant: 'a' | 'b' | 'c'` with three pre-drawn tape strokes — same pattern as `<HighlighterStroke>`) rather than procedural noise. Procedural realism produced an "uncanny" feel; hand-drawn assets do not.

---

## 12. References

- `docs/plans/2026-04-27-redesign-master-design.md` — master design (Tier B section §4.2 is the source for the primitive list and prop sketches).
- `docs/prd/redesign-phase-0.md` — Phase 0 PRD (template for this PRD's structure).
- `docs/plans/2026-04-28-redesign-phase-0-plan.md` — Phase 0 plan (template for this phase's plan).
- `docs/prd/visual-regression-testing.md` — VR contract; see §12 Phase 3 for the Features/_ Include list (no Features/_ baselines change in Phase 1).
- `apps/web/CLAUDE.md` — Storybook navigation, design-system folder rules, VR contract, testing model.
- `docs/design/mockups/retro-terrace-fanzine/` — owner-curated screenshots; the visual source for every Tier B primitive.
- Existing `apps/web/src/components/design-system/SectionHeader/SectionHeader.tsx` — current legacy implementation that this phase rewrites.
- Existing `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.tsx` — sole `<Badge>` consumer that this phase migrates.

---

_End of Phase 1 PRD._
