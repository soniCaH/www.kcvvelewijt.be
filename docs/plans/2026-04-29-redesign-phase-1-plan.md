# Redesign Phase 1 — Tier B Composition Primitives Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Land the eight Tier B composition primitives, rework `<SectionHeader>` to compose them, retire `<Badge>` (single-consumer migration), and capture VR baselines for every new and updated story — all in one PR.

**Architecture:** Each primitive lives at `apps/web/src/components/design-system/<Name>/` with the four standard files (`<Name>.tsx`, `<Name>.stories.tsx`, `<Name>.test.tsx`, `index.ts`) plus a barrel export from `apps/web/src/components/design-system/index.ts`. Storybook title `UI/<Name>` with `tags: ["autodocs", "vr"]`. Tier B primitives compose Tier A primitives shipped in Phase 0; **no new tokens**. Baselines captured inside the pinned `mcr.microsoft.com/playwright:v1.59.1-noble` container at the end via `pnpm vr:update`.

**Tech stack:** Tailwind v4, Next.js 15 App Router, React 19, Storybook 10 + `@storybook/test-runner`, Vitest + Testing Library for unit tests, self-hosted Playwright in Docker for VR.

**Source PRD:** `docs/prd/redesign-phase-1.md`. **Master design reference:** `docs/plans/2026-04-27-redesign-master-design.md`.

**Worktree:** `../kcvv-issue-1523` on branch `feat/issue-1523` (already created when this plan was authored). All work happens inside that worktree. **Do not work on `main`.**

---

## Pre-flight

Before Task 1, verify the worktree environment is healthy. If any check fails, fix that first — do not start tasks blind.

```bash
# Inside the worktree:
node --version                                    # >= 20
pnpm --version                                    # >= 9
docker info >/dev/null 2>&1 && echo "docker ok"   # Docker Desktop must be running for VR
git status                                        # only staged: PRD + this plan

pnpm install                                      # confirm lockfile resolves cleanly
pnpm --filter @kcvv/web run check-all             # baseline must be green
pnpm --filter @kcvv/web run vr:check              # baseline must be green
```

If `vr:check` shows diffs _before any change_, stop and report — the local Docker image is drifted from CI. Pull the pinned image: `docker pull mcr.microsoft.com/playwright:v1.59.1-noble`.

Memory note (`reference_vr_update_walltime.md`): `pnpm vr:update` for the full Phase 2+3 set takes ~41 minutes. Phase 1 captures eight new `UI/<Name>` baselines plus an updated `UI/SectionHeader` baseline — total walltime budget ~3–5 minutes on a warm cache. Run as a background task and poll the output rather than blocking the foreground session.

---

## Task 1: `<TapedCard>` — primitive + story + test

**Files:**

- Create: `apps/web/src/components/design-system/TapedCard/TapedCard.tsx`
- Create: `apps/web/src/components/design-system/TapedCard/TapedCard.stories.tsx`
- Create: `apps/web/src/components/design-system/TapedCard/TapedCard.test.tsx`
- Create: `apps/web/src/components/design-system/TapedCard/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts` (add export)

**Step 1: Write the failing test**

Cover the full prop matrix described in PRD §3.1. Assert:

- Default props render `<div>` with `bg-cream`, `shadow-paper-md`, `padding-md`, no rotation.
- `rotation="a"` applies `rotate-[-2.5deg]`; `rotation="auto"` applies `rotate-[var(--taped-card-rotation,0deg)]`; numeric `rotation={5}` applies `rotate-[5deg]`.
- `bg="ink"` applies `bg-ink text-cream`.
- `padding="none"` removes padding utilities.
- `tape={[{ position: "tl", color: "jersey" }]}` renders one `<TapeStrip>` instance.
- `as="article"` renders `<article>` (verify `tagName === "ARTICLE"`).
- `interactive={true}` adds the hover modifier classes; `interactive={false}` (default) does not.

Run: `pnpm --filter @kcvv/web run test apps/web/src/components/design-system/TapedCard/`
Expected: FAIL (file does not exist).

**Step 2: Implement `TapedCard.tsx`**

Compose existing Tier A `<TapeStrip>` for tape corners. Use `cn` from `@/lib/utils/cn` for class composition. Set the `--taped-card-rotation` CSS variable on the root only when `rotation="auto"` is consumed (the variable is _read_ via Tailwind arbitrary value, not set by this component — `<TapedCardGrid>` sets it).

For the `interactive` motion path, wrap the hover transform inside a `@media (prefers-reduced-motion: no-preference)` Tailwind variant: `motion-safe:hover:rotate-[…]`.

**Step 3: Implement `TapedCard.stories.tsx`**

Mirror the Phase 0 primitive pattern (e.g. `MonoLabel.stories.tsx`). `meta.tags = ["autodocs", "vr"]`. Stories: `Playground`, `RotationVariants`, `ShadowVariants`, `BgVariants`, `WithTape`, `Interactive`, `PaddingMatrix`. Use Dutch fixture children — short headline + paragraph excerpt.

**Step 4: Add barrel export**

`TapedCard/index.ts`:

```typescript
export { TapedCard } from "./TapedCard";
export type { TapedCardProps, TapedCardRotation } from "./TapedCard";
```

`design-system/index.ts` — append:

```typescript
// TapedCard
export { TapedCard } from "./TapedCard";
export type { TapedCardProps, TapedCardRotation } from "./TapedCard";
```

**Step 5: Verify tests pass and check-all is clean**

```bash
pnpm --filter @kcvv/web run test apps/web/src/components/design-system/TapedCard/
pnpm --filter @kcvv/web run check-all
```

Expected: PASS.

**Step 6: Commit**

```bash
git add apps/web/src/components/design-system/TapedCard/ apps/web/src/components/design-system/index.ts
git commit -m "feat(ui): add <TapedCard> Tier B primitive

Phase 1 of redesign — rotated paper card wrapper with optional tape
corners, hard offset shadow, coloured surface, and opt-in interactive
hover tilt. Composes Tier A <TapeStrip> for corner decorations.

Refs #1523"
```

---

## Task 2: `<TapedCardGrid>` — auto-rotation grid

**Files:**

- Create: `apps/web/src/components/design-system/TapedCardGrid/TapedCardGrid.tsx`
- Create: `apps/web/src/components/design-system/TapedCardGrid/TapedCardGrid.stories.tsx`
- Create: `apps/web/src/components/design-system/TapedCardGrid/TapedCardGrid.test.tsx`
- Create: `apps/web/src/components/design-system/TapedCardGrid/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts`

**Step 1: Write the failing test**

Assert:

- Default props render `<div>` with `grid-cols-3`, `gap-md`.
- Each child wrapped in a slot div that sets `--taped-card-rotation` via `style` from the rotation pool: `--rotate-tape-a`, `…b`, `…c`, `…d`, cycling per `nth-child(4n+1..4)`.
- `as="ol"` renders `<ol>` with `<li>` slot wrappers; `as="ul"` likewise.
- Empty children with `emptyState` prop renders the prop's content.
- Empty children without `emptyState` renders `null`.

**Step 2: Implement `TapedCardGrid.tsx`**

The CSS variable per slot is set via inline `style` on the slot element using the `nth-child` pseudo-class is impractical at runtime — instead, iterate `React.Children.toArray(children)` and assign `--taped-card-rotation` per index using `index % 4`. This keeps the rotation deterministic without relying on CSS `nth-child`.

```typescript
const ROTATION_POOL = [
  "var(--rotate-tape-a)",
  "var(--rotate-tape-b)",
  "var(--rotate-tape-c)",
  "var(--rotate-tape-d)",
] as const;
```

**Step 3: Stories**

`Playground`, `Columns1` … `Columns4`, `MixedRotations`, `EmptyWithFallback`, `EmptyWithoutFallback` (the last with `tags: ["vr-skip"]` and an inline comment explaining the 0×0 capture issue).

**Step 4: Barrel + run tests**

Same pattern as Task 1.

**Step 5: Commit**

```bash
git add apps/web/src/components/design-system/TapedCardGrid/ apps/web/src/components/design-system/index.ts
git commit -m "feat(ui): add <TapedCardGrid> auto-rotation grid

Distributes the 4-rotation pool across slots via index-driven CSS
custom properties. Children rendered with <TapedCard rotation=\"auto\">
consume the slot's rotation. Accepts emptyState fallback prop;
renders null when no children and no emptyState.

Refs #1523"
```

---

## Task 3: `<TapedFigure>` — editorial photo + caption

**Files:**

- Create: `apps/web/src/components/design-system/TapedFigure/TapedFigure.tsx`
- Create: `apps/web/src/components/design-system/TapedFigure/TapedFigure.stories.tsx`
- Create: `apps/web/src/components/design-system/TapedFigure/TapedFigure.test.tsx`
- Create: `apps/web/src/components/design-system/TapedFigure/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts`

**Step 1: Write the failing test**

Assert:

- Default `aspect="landscape-16-9"` sets the inner container's `aspect-ratio: 16 / 9`.
- `aspect="square"` → `1 / 1`; `aspect="portrait-3-4"` → `3 / 4`; `aspect="auto"` omits the property.
- `caption` prop renders inside `<figcaption>`; `credit` prop renders aligned-right within the same `<figcaption>` flex row.
- `bg="cream-soft"` applies the cream-soft surface to the wrapping `<TapedCard>`.
- The component renders `<figure>` semantically (regardless of the `<TapedCard as>` value, the outer element is a `<figure>`).
- Children pass through into the inner aspect-ratio container — the test renders `<TapedFigure><img alt="t" src="https://example.com/t.jpg" /></TapedFigure>` and asserts the `<img>` is in the DOM.

**Step 2: Implement `TapedFigure.tsx`**

Render `<TapedCard as="figure">` directly — the `as` union in Task 1 already includes `"figure"`.

The aspect-ratio container is a `<div>` with `style={{ aspectRatio }}` — Tailwind v4 `aspect-[16/9]` is also acceptable but the inline style keeps the four cases trivially data-driven.

Mobile-first contract: the `<figcaption>` flex row wraps via `flex-wrap` so caption + credit stack on narrow viewports. The aspect-ratio container has `width: 100%` so it follows the parent (fluid).

**Step 3: Stories**

`Default`, `WithCaption`, `WithCredit`, `WithCaptionAndCredit`, `Square`, `Portrait`, `Auto`, `RotatedAndTaped`, `InsideGrid`. The `InsideGrid` story renders three `<TapedFigure>` instances inside a `<TapedCardGrid columns={3}>` to validate the auto-rotation cascade.

For story image fixtures, use a stable data URL (a 16:9 cream-coloured rectangle with a small jersey-green badge) so the VR baseline is deterministic and doesn't depend on a third-party image host.

**Step 4: Barrel + run tests + commit**

Pattern as before. Commit message:

```text
feat(ui): add <TapedFigure> editorial photo primitive

Composes <TapedCard> + caller-supplied image element + optional
caption/credit row. Aspect ratio enforced via CSS so any image element
(next/image, plain <img>, SanityImage) letterboxes to the configured
frame. Mobile-first: caption row wraps on narrow viewports.

Refs #1523
```

---

## Task 4: `<MonoLabelRow>` — inline label list

**Files:**

- Create: `apps/web/src/components/design-system/MonoLabelRow/MonoLabelRow.tsx` + stories + test + index
- Modify: `apps/web/src/components/design-system/index.ts`

**Step 1: Write the failing test**

Assert:

- Default `divider="·"` renders middle-dot between adjacent items.
- `divider="★"` renders the star glyph.
- Items pass `variant` and `size` through to `<MonoLabel>`.
- `as="ol"` wraps each item in `<li>`; `as="ul"` likewise; `as="div"` uses `<span>`.
- Dividers carry `aria-hidden="true"`.
- `wrap={true}` (default) applies `flex-wrap`.

**Step 2: Implement**

Render via `React.Children` is unnecessary — items are passed as a typed array (PRD §3.4). Map with index, render `<MonoLabel>`, append divider `<span aria-hidden>` between adjacent items (`index < items.length - 1`).

**Step 3: Stories**

`Default`, `MixedVariants`, `WithStarDivider`, `LongRowWraps` (six items, narrow viewport via `parameters: { viewport: { defaultViewport: "mobile1" } }`), `OrderedList`.

**Step 4: Barrel + run + commit**

```text
feat(ui): add <MonoLabelRow> inline label list

Renders an array of <MonoLabel> items separated by an aria-hidden
divider glyph. Handles list semantics (ol/ul/div) and mobile-friendly
wrap behaviour.

Refs #1523
```

---

## Task 5: `<EditorialHeading>` — period-terminated heading

**Files:** Standard four files for the new primitive + barrel update.

**Step 1: Write the failing test**

Assert:

- `level={1}` renders `<h1>`; `level={6}` renders `<h6>`.
- `size="display-2xl"` applies the `text-display-2xl` font-size variable; size variants map to the right CSS variables.
- Auto-period: `children="Het rooster"` renders `Het rooster.`; `children="Het rooster."` renders `Het rooster.` unchanged.
- `emphasis: { text: "nieuws" }` inside `Het laatste nieuws.` wraps `nieuws` in an italic `<em>`.
- `emphasis: { text: "nieuws", highlight: true }` wraps the `<em>` inside `<HighlighterStroke variant="a" color="jersey">`.
- `emphasis: { text: "missing" }` against `Het rooster.` logs a development-mode warning and renders unchanged.
- `tone="jersey-deep"` applies `text-jersey-deep`.

**Step 2: Implement**

Tone class table:

```typescript
const TONE_CLASS = {
  ink: "text-ink",
  "jersey-deep": "text-jersey-deep",
  cream: "text-cream",
} as const;
```

Period auto-append: a one-liner `const display = children.endsWith(".") ? children : `${children}.`;`. Emphasis substring matching: `String.prototype.indexOf` (case-sensitive); split into `[before, emphasis, after]` and render each segment. Wrap the emphasis segment in `<HighlighterStroke>` when `emphasis.highlight === true`. Default `highlightVariant="a"`.

Render the heading via `React.createElement(`h${level}`, …)` — see `apps/web/src/components/design-system/SectionHeader/SectionHeader.tsx` for the existing pattern.

**Step 3: Stories**

`Default`, `WithEmphasisInline`, `WithEmphasisHighlighted`, `EveryLevel`, `EverySize`, `ToneVariants` (cream tone rendered on an ink-bg container).

**Step 4: Barrel + run + commit**

```text
feat(ui): add <EditorialHeading> with optional emphasis + highlight

Period-terminated heading primitive that renders Freight Display at
configurable display sizes with optional italic emphasis substring and
optional <HighlighterStroke> underline. Single-line highlighter is
sufficient for Phase 1 — multi-line wrapping deferred.

Refs #1523
```

---

## Task 6: `<PullQuote>` — taped quote block

**Files:** Standard four files + barrel.

**Step 1: Write the failing test**

Assert:

- Default `tone="cream"` renders cream `<TapedCard>` + ink text + jersey `<QuoteMark>`.
- `tone="ink"` renders ink card + cream text + jersey QuoteMark.
- `tone="jersey"` renders jersey card + ink text + cream QuoteMark.
- Body renders inside a `<q>` element with italic display-sm class.
- Attribution renders `<MonoLabel>` for name; role and source separated by `·` middle-dots.
- `rotation="b"` and `tape` pass through to `<TapedCard>`.

**Step 2: Implement**

Tone → palette mapping inside the component. Pass `bg`, `text-*` via the wrapping `<TapedCard>` and the body `<q>` className respectively.

**Step 3: Stories**

`Default`, `WithRoleAndSource`, `ToneInk`, `ToneJersey`, `Rotated`, `LongQuote`.

**Step 4: Barrel + run + commit**

```text
feat(ui): add <PullQuote> taped quote primitive

Composes <TapedCard> + <QuoteMark> + italic display body +
attribution row. Three tone variants (cream/ink/jersey). Rotation
and tape pass-through to the underlying card.

Refs #1523
```

---

## Task 7: `<NumberDisplay>` — graphic monumentation

**Files:** Standard four files + barrel.

**Step 1: Write the failing test**

Assert:

- `value={8} prefix="#"` renders `# 8` with `#` at `0.6em` Freight Display.
- `value="2374"` renders the string verbatim.
- `tone="jersey-deep"` applies `text-jersey-deep`.
- `label="WEDSTRIJDEN"` renders below in `<MonoLabel>` (or a styled `<span>` matching the mono treatment).
- `as="div"` wraps in a flex column; `as="span"` (default) preserves inline flow.

**Step 2: Implement**

Use `--font-display-big` for the value. Prefix and suffix scale with `text-[0.6em]`.

**Step 3: Stories**

`JerseyNumber`, `StatCounter`, `YearMarker`, `WithPrefix`, `WithSuffix`, `LabeledRow`. The `LabeledRow` story demonstrates `<NumberDisplay as="div">` instances inside a flex row to validate side-by-side rendering for a future `<StatsStrip>`.

**Step 4: Barrel + run + commit**

```text
feat(ui): add <NumberDisplay> serif number primitive

Big serif number with optional prefix/suffix in lighter scale and
optional mono label underneath. Used for jersey numbers, stat
counters, year markers.

Refs #1523
```

---

## Task 8: `<DropCapParagraph>` — lead paragraph with oversized first letter

**Files:** Standard four files + barrel.

**Step 1: Write the failing test**

Assert:

- `children="Acht keer Elewijt..."` renders `A` as the visual cap (`aria-hidden="true"`, display-2xl Freight Big Pro 900) plus a `<span className="sr-only">A</span>` so SR pronounces the full word.
- The remainder `cht keer Elewijt...` renders inline immediately after.
- `tone="ink"` applies ink to the cap.
- `as="div"` renders `<div>`; default renders `<p>`.
- Empty `children=""` triggers a development-mode warning and renders nothing decoratively.

**Step 2: Implement**

```typescript
const first = children.charAt(0);
const rest = children.slice(1);
```

Render:

```jsx
<Tag>
  <span aria-hidden="true" className="…drop-cap-classes…">
    {first}
  </span>
  <span className="sr-only">{first}</span>
  {rest}
</Tag>
```

**Step 3: Stories**

`Default`, `ToneInk`, `LongParagraph`, `WithDiacritic`. Inline comment in `WithDiacritic`:

```typescript
// Verifies precomposed diacritics (É, Ë, Ï) survive charAt(0). Combining-mark
// edge cases would require Unicode-aware splitting — deferred until a real
// content failure surfaces (PRD §11.3).
```

**Step 4: Barrel + run + commit**

```text
feat(ui): add <DropCapParagraph> lead paragraph primitive

Oversized first letter wrapped in aria-hidden plus an sr-only
duplicate so screen readers pronounce the full word as written. Cap
renders in Freight Big Pro 900 at display-2xl, jersey-tinted by
default.

Refs #1523
```

---

## Task 9: Rework `<SectionHeader>` to compose Tier B

**Files:**

- Modify: `apps/web/src/components/design-system/SectionHeader/SectionHeader.tsx`
- Modify: `apps/web/src/components/design-system/SectionHeader/SectionHeader.test.tsx`
- Modify: `apps/web/src/components/design-system/SectionHeader/SectionHeader.stories.tsx`

**Step 1: Update the test**

The existing test asserts the legacy `font-body!`/`font-black!`/`mb-0!`/`border-l-4` shape. Rewrite to assert:

- Renders an `<EditorialHeading>` internally (e.g. by querying for the `<h2>` and verifying its className includes the display token).
- `kicker` prop renders a `<MonoLabelRow>` above the heading.
- `emphasis` prop passes through to `<EditorialHeading>`.
- `linkText` + `linkHref` render a `<Link>` with mono-label tone (no longer the old uppercase-tracked-bold).
- `variant="dark"` applies cream text + dark CTA.

**Step 2: Update `SectionHeader.tsx`**

Replace the body with a thin wrapper:

```tsx
import { EditorialHeading } from "../EditorialHeading";
import { MonoLabelRow } from "../MonoLabelRow";

export const SectionHeader = ({
  title,
  kicker,
  emphasis,
  size = "display-lg",
  linkText,
  linkHref,
  variant = "light",
  as = "h2",
  className,
}: SectionHeaderProps) => {
  const isDark = variant === "dark";
  return (
    <header className={cn("mb-10 flex flex-col gap-2", className)}>
      {kicker && <MonoLabelRow items={kicker} />}
      <div className="flex items-end justify-between">
        <EditorialHeading
          level={as === "h1" ? 1 : as === "h3" ? 3 : 2}
          size={size}
          emphasis={emphasis}
          tone={isDark ? "cream" : "ink"}
        >
          {title}
        </EditorialHeading>
        {linkText && linkHref && (
          <Link
            href={linkHref}
            className={cn(
              "inline-flex items-center gap-2 font-mono text-[length:var(--text-label)] tracking-[var(--text-label--tracking)] uppercase transition-colors",
              isDark
                ? "text-cream/80 hover:text-cream"
                : "text-jersey-deep hover:text-jersey",
            )}
          >
            {linkText}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </header>
  );
};
```

The legacy `!important` cascade fights are eliminated — the redesign tokens cascade cleanly from `globals.css`.

**Step 3: Verify all nine call sites still compile**

```bash
pnpm --filter @kcvv/web run check-all
```

The PRD §4.1 list confirms each call site passes `title` and optionally `linkText`/`linkHref`/`variant`/`as`. None pass `kicker` or `emphasis` today, so they all continue to render headlines without those affordances. Visual treatment changes per the redesign — that's the intended VR baseline shift on each consumer's story (the consumers' Storybook stories live under `Features/<Domain>/` and are not in the Phase 3 VR Include list yet, so no Features baselines change in this phase).

**Step 4: Update the story**

Add Playground + variants demonstrating the new affordances: `WithKicker`, `WithEmphasisHighlighted`, `Dark`, `WithCta`. Keep `tags: ["autodocs", "vr"]`.

**Step 5: Commit**

```bash
git add apps/web/src/components/design-system/SectionHeader/
git commit -m "refactor(ui): rework <SectionHeader> to compose Tier B primitives

Drops the legacy !important font/colour overrides and the green
left-border bar. New shape composes <EditorialHeading> +
<MonoLabelRow> for the kicker and uses MonoLabel-tone CTA styling.
All nine existing call sites continue to compile and render — visual
treatment intentionally changes per the redesign.

Refs #1523"
```

---

## Task 10: Retire `<Badge>` — migrate `<MatchStatusBadge>`

**Files:**

- Modify: `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.tsx`
- Modify: `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.test.tsx`
- Modify: `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.stories.tsx` (if it exists)
- Modify: `apps/web/src/components/design-system/index.ts` (remove Badge exports)
- Delete: `apps/web/src/components/design-system/Badge/` (entire folder)

**Step 1: Inspect the current `MatchStatusBadge` shape**

Read the file. Note:

- Imports `Badge` and `BadgeVariant`.
- `colorToVariant` table maps `MatchStatus` colours to `BadgeVariant`.
- Renders `<Badge variant={…}>{label}</Badge>` for the matched status.

**Step 2: Migrate the consumer**

Replace imports and rewrite the colour map to `MonoLabelProps["variant"]`:

```typescript
import {
  MonoLabel,
  type MonoLabelProps,
} from "@/components/design-system/MonoLabel";

const colorToVariant: Record<string, MonoLabelProps["variant"]> = {
  red: "pill-ink",
  yellow: "pill-cream",
  green: "pill-jersey",
  blue: "pill-cream",
};
```

The exact mapping is finalised against the actual `MatchStatus` enum and current `BadgeVariant` values during implementation. Render `<MonoLabel variant={…}>{label}</MonoLabel>`.

**Step 3: Update the test**

Adjust assertions to expect the `<MonoLabel>` rendering. Drop any `BadgeVariant`-specific assertions.

**Step 4: Delete `<Badge>`**

```bash
rm -r apps/web/src/components/design-system/Badge
```

**Step 5: Remove Badge exports from the barrel**

Open `apps/web/src/components/design-system/index.ts` and delete:

```typescript
export { Badge } from "./Badge";
export type { BadgeProps, BadgeVariant, BadgeSize } from "./Badge";
```

**Step 6: Verify no stragglers**

```bash
grep -rn "from.*['\"].*Badge['\"]" apps/web/src --include="*.tsx" --include="*.ts" \
  | grep -v "MatchStatusBadge\|NumberBadge"
```

Expected: zero matches. (`MatchStatusBadge` still exists as a different component; `NumberBadge` is unrelated to the design-system Badge.)

**Step 7: Run check-all**

```bash
pnpm --filter @kcvv/web run check-all
```

Expected: PASS. TypeScript surfaces any reference we missed.

**Step 8: Commit**

```bash
git add -A
git commit -m "refactor(ui): retire <Badge> — migrate MatchStatusBadge to <MonoLabel>

<Badge> is superseded by <MonoLabel variant=\"pill-…\"> per the
redesign master plan (Tier A primitive replaces the legacy chip).
Audit confirmed exactly one consumer (MatchStatusBadge) — migrated
and Badge folder + barrel exports deleted.

Refs #1523"
```

---

## Task 11: Update `apps/web/CLAUDE.md`

**Files:**

- Modify: `apps/web/CLAUDE.md` (§"Redesign primitives (Phase 0+)")

**Step 1: Append Phase 1 primitives**

Locate the existing list under §"Redesign primitives (Phase 0+)". Append a new sub-section:

```markdown
**Phase 1 additions:**

- `<TapedCard>` — paper-card wrapper with rotation/tape/shadow/bg/padding props and opt-in `interactive` hover tilt.
- `<TapedCardGrid>` — auto-rotation grid that distributes the 4-rotation pool across slots; accepts `emptyState` fallback prop.
- `<TapedFigure>` — editorial photo + caption primitive; caller-controlled image element via children slot, aspect-ratio enforced by frame.
- `<MonoLabelRow>` — inline `<MonoLabel>` row with configurable divider glyph.
- `<EditorialHeading>` — period-terminated heading with optional italic emphasis substring and optional `<HighlighterStroke>` highlight.
- `<PullQuote>` — taped quote block (`<TapedCard>` + `<QuoteMark>` + italic body + attribution).
- `<NumberDisplay>` — big serif number with optional prefix/suffix and mono label.
- `<DropCapParagraph>` — lead paragraph with oversized first letter (`aria-hidden` + `sr-only` duplicate so screen readers pronounce the full word).

`<SectionHeader>` was reworked to compose `<EditorialHeading>` + `<MonoLabelRow>`; all nine existing call sites continue to use the same import path.

`<Badge>` was retired in favour of `<MonoLabel variant="pill-…">`. The single consumer (`MatchStatusBadge`) was migrated.
```

**Step 2: Verify no other CLAUDE.md edits needed**

The Phase 0 line about `<HighlighterStroke>` "single-line CSS-bg SVG; multi-line is a deferred Phase 1+ enhancement" is intentionally **not** removed — Phase 1 keeps the deferral (PRD §11.1 trip-wire #3).

**Step 3: Commit**

```bash
git add apps/web/CLAUDE.md
git commit -m "docs(ui): note Phase 1 redesign primitives in CLAUDE.md

Refs #1523"
```

---

## Task 12: Capture VR baselines

**Files:**

- Create: `apps/web/test/vr/__snapshots__/` PNGs for each new `UI/<Name>` story
- Update: `apps/web/test/vr/__snapshots__/` PNGs for the reworked `UI/SectionHeader` story

**Step 1: Verify Docker is running**

```bash
docker info >/dev/null 2>&1 && echo "docker ok" || echo "DOCKER MISSING"
```

If missing, ask the owner to start Docker Desktop before continuing.

**Step 2: Capture baselines**

Run as a background task — the full Phase 1 story set will take ~3–5 minutes on a warm cache:

```bash
pnpm --filter @kcvv/web run vr:update
```

When the run completes, inspect `apps/web/test/vr/__snapshots__/` for new PNGs.

**Step 3: Verify baselines pass on a fresh check**

```bash
pnpm --filter @kcvv/web run vr:check
```

Expected: PASS, zero diffs.

**Step 4: Commit baselines**

```bash
git add apps/web/test/vr/__snapshots__/
git commit -m "chore(vr): capture Phase 1 baselines

- ui-tapedcard--*: first-time captures (8 stories)
- ui-tapedcardgrid--*: first-time captures
- ui-tapedfigure--*: first-time captures
- ui-monolabelrow--*: first-time captures
- ui-editorialheading--*: first-time captures
- ui-pullquote--*: first-time captures
- ui-numberdisplay--*: first-time captures
- ui-dropcapparagraph--*: first-time captures
- ui-sectionheader--*: updated — composition rewrite drops legacy
  green-bar / !important font cascade, adopts EditorialHeading +
  MonoLabelRow per the redesign master plan

Refs #1523"
```

The exact PNG list is pasted into the PR body's `## VR baselines` section in Task 14.

---

## Task 13: Open follow-up issue for multi-line `<HighlighterStroke>`

**Files:** none (creates a GitHub issue via `gh`).

**Step 1: Open the tracking issue**

```bash
gh issue create \
  --title "feat(ui): multi-line <HighlighterStroke> wrapping helper" \
  --label "nice to have" \
  --body "$(cat <<'EOF'
## Context

Phase 0 shipped `<HighlighterStroke>` with single-line wrapping only — the CSS `background-image` data-URL approach lays one stroke across the highlighted span's bounding box and does not repeat per visual line when text wraps. Phase 1 deferred multi-line support per `docs/prd/redesign-phase-1.md` §11.1.

Multi-line wrapping is needed when an emphasized substring inside body copy (typically inside `<EditorialHeading size="display-md">` or smaller, used inside long article passages) wraps across multiple lines. The first phase to need it will be the phase that builds the helper.

## Likely trigger phase

Phase 5 (article detail) — `<EditorialHeading>` headlines used inside body copy with longer emphasis spans. Phase 5 PRD must reference `docs/prd/redesign-phase-1.md` §11.1 and decide whether to ship the helper as part of Phase 5 or earlier.

## Acceptance criteria

- A helper (likely a wrapping React component or a CSS technique using `box-decoration-break` plus per-line span chunking) emits one `<HighlighterStroke>` per visual line.
- `<HighlighterStroke>`'s existing single-line behaviour is preserved when the text fits on one line.
- The Phase 0 `MultiLineUnsupported` story is removed (or relabelled `MultiLineSupported`) and its `parameters: { vr: { disable: true } }` flag is dropped.
- VR baselines updated.

## References

- `docs/plans/2026-04-27-redesign-master-design.md` decision 9 — multi-line deferral.
- `docs/prd/redesign-phase-0.md` §3.8 resolved question 3 — single-line implementation choice.
- `docs/prd/redesign-phase-1.md` §11.1 — Phase 1 deferral and trip-wires.
EOF
)"
```

**Step 2: Note the new issue number**

`gh issue create` prints the URL on success — extract the issue number for the PR body in Task 14.

This task does **not** create a commit. The trip-wire is the GitHub issue itself, surfaced via `gh issue list`.

---

## Task 14: Open the PR

**Files:** none (uses `gh pr create`).

**Step 1: Push the branch**

```bash
git push -u origin feat/issue-1523
```

**Step 2: Create the PR**

```bash
ISSUE_NUM=1523
FOLLOWUP_NUM=<from Task 13>

gh pr create \
  --title "feat(ui): redesign Phase 1 — Tier B composition primitives (#${ISSUE_NUM})" \
  --label "ready-for-review" \
  --body "$(cat <<'EOF'
Closes #1523

## Summary

Phase 1 of the editorial-redesign series. Ships eight Tier B composition primitives, reworks `<SectionHeader>` to compose them, and retires `<Badge>` (single-consumer migration).

PRD: `docs/prd/redesign-phase-1.md`
Plan: `docs/plans/2026-04-29-redesign-phase-1-plan.md`
Master design: `docs/plans/2026-04-27-redesign-master-design.md`

## New primitives

- `<TapedCard>` — paper card wrapper (rotation, tape, shadow, bg, padding, opt-in interactive hover)
- `<TapedCardGrid>` — auto-rotation grid (4-slot pool, accepts `emptyState`)
- `<TapedFigure>` — editorial photo + caption (caller-supplied image element via children slot)
- `<MonoLabelRow>` — inline label row with configurable divider glyph
- `<EditorialHeading>` — period-terminated heading with italic emphasis + highlighter
- `<PullQuote>` — taped quote block (cream/ink/jersey tones)
- `<NumberDisplay>` — big serif number with prefix/suffix/label
- `<DropCapParagraph>` — lead paragraph with screen-reader-safe oversized first letter

## Reworks

- `<SectionHeader>` rebuilt as a thin wrapper over `<EditorialHeading>` + `<MonoLabelRow>` — drops legacy `!important` cascade fights, drops green left-border bar.
- `<Badge>` retired; sole consumer `<MatchStatusBadge>` migrated to `<MonoLabel variant="pill-…">`.

## Tokens

**No new tokens.** Tier B is composition over Phase 0.

## VR baselines

First-time captures (acceptable per the VR contract):

- `ui-tapedcard--*` (Playground + 7 variant stories)
- `ui-tapedcardgrid--*` (Playground + columns + mixed-rotations + empty-state stories; one story carries `tags: ["vr-skip"]` for the empty-without-fallback 0×0 case)
- `ui-tapedfigure--*` (Playground + 9 variant stories)
- `ui-monolabelrow--*` (Playground + 4 variant stories)
- `ui-editorialheading--*` (Playground + 5 variant stories)
- `ui-pullquote--*` (Playground + 5 variant stories)
- `ui-numberdisplay--*` (Playground + 5 variant stories)
- `ui-dropcapparagraph--*` (Playground + 3 variant stories)

Updated baselines (justified):

- `ui-sectionheader--*` — composition rewrite per PRD §4.1. Drops legacy green-bar / `!important` cascade; adopts `<EditorialHeading>` + `<MonoLabelRow>` shape. Visual delta is intentional and matches the redesign master plan §4.4 row "SectionHeader: Becomes a thin wrapper over EditorialHeading + MonoLabelRow (Phase 1)".

## Multi-line `<HighlighterStroke>` deferral

Phase 1 keeps the single-line behaviour from Phase 0. Tracking issue: #${FOLLOWUP_NUM}. See PRD §11.1 for the full trip-wires (Out of scope, this section, CLAUDE.md note, and the Phase 5 PRD obligation).

## Testing

- `pnpm --filter @kcvv/web run check-all` — green
- `pnpm --filter @kcvv/web run vr:check` — green after baselines committed
- Manual review: each new `UI/<Name>` story rendered in local Storybook against Dutch fixture content

## Out of scope (handled in later phases)

- Atom rework (`<Button>`, `<Input>`, etc.) — Phase 2
- Phosphor Fill icon migration — Phase 2
- Tier C domain figures (`<PlayerFigure>`, `<JerseyShirt>`, etc.) — Phase 3
- `<EditorialHero>` variants — Phase 3
- `<NewsCard>` and other domain cards — Phase 4–7

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 3: Flip the issue label**

```bash
gh issue edit 1523 --remove-label "in-progress" --add-label "ready-for-review"
```

**Step 4: Comment with the PR URL**

```bash
gh issue comment 1523 --body "PR opened: <pr-url>"
```

The PR URL is printed by `gh pr create` on success.

---

## Definition of Done

The plan is complete when **every** item below is true:

- [ ] All eight Tier B primitives committed under `apps/web/src/components/design-system/<Name>/`.
- [ ] All eight primitives exported from the barrel.
- [ ] `<SectionHeader>` reworked.
- [ ] `<Badge>` deleted; `<MatchStatusBadge>` migrated.
- [ ] `apps/web/CLAUDE.md` updated with Phase 1 additions.
- [ ] VR baselines committed and `vr:check` green.
- [ ] Follow-up GitHub issue created for multi-line `<HighlighterStroke>`.
- [ ] PR opened with `ready-for-review` label and the issue label flipped to match.
- [ ] PR body includes a `## VR baselines` section matching the actual snapshot list.

Anything missing means the phase is not done — fix and recommit before requesting review.
