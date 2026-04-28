# Redesign Phase 0 — Foundations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Land the design tokens, seven Tier A decorative primitives, and Storybook documentation that every later redesign phase will build on, with VR baselines committed in the same PR and zero regressions on existing components.

**Architecture:** Tokens live additively in `apps/web/src/app/globals.css` `@theme {}` (Tailwind v4) — legacy tokens stay verbatim. Primitives land at `apps/web/src/components/design-system/<Name>/` per the existing convention; Storybook titles `UI/<Name>` with `tags: ["autodocs", "vr"]`. Tokens are documented in `apps/web/src/stories/foundation/*.mdx`. Baselines captured inside the pinned Playwright Docker image at the end via `pnpm vr:update`.

**Tech stack:** Tailwind v4, Next.js 15 App Router, React 19, Storybook 10 + `@storybook/test-runner`, Vitest + Testing Library for unit tests, self-hosted Playwright in Docker for VR.

**Source PRD:** `docs/prd/redesign-phase-0.md`. **Master design reference:** `docs/plans/2026-04-27-redesign-master-design.md`.

**Worktree convention:** This plan executes inside a worktree created via `git worktree add ../kcvv-issue-<N> -b feat/issue-<N> origin/main` once a GitHub issue exists. Until then, work continues on the existing `feat/redesign-master` branch and the plan PR is split out at the end. **Do not work on `main`.**

---

## Pre-flight

Before Task 1, verify the worktree environment is healthy. If any check fails, fix that first — do not start tasks blind.

```bash
# Inside the worktree:
node --version                                    # >= 20
pnpm --version                                    # >= 9
docker info >/dev/null 2>&1 && echo "docker ok"   # Docker Desktop must be running for VR
git status                                        # should be clean

pnpm install                                      # confirm lockfile resolves cleanly
pnpm --filter @kcvv/web run check-all             # baseline must be green
pnpm --filter @kcvv/web run vr:check              # baseline must be green
```

If `vr:check` shows diffs *before any change*, stop and report — the local Docker image is drifted from CI. Pull the pinned image: `docker pull mcr.microsoft.com/playwright:v1.59.1-noble`.

Memory note: `pnpm vr:update` runs ~30 s for Phase 1 tracer set on a warm cache; the full Phase 2+3 set takes ~41 min. For this plan we run `vr:update` once at the end to capture only the new baselines (existing baselines must remain unchanged) — see Task 18.

---

## Task 1: Add colour tokens to globals.css

**Files:**
- Modify: `apps/web/src/app/globals.css` (existing `@theme {}` block — append a new `/* ===== Redesign / Cream Surface (Phase 0) ===== */` section)

**Step 1: Read the current `@theme {}` block to find the insertion point**

Run: `grep -n "@theme" apps/web/src/app/globals.css`
Expected: a single `@theme {` line. Note the line number; tokens land before its closing `}`.

**Step 2: Insert the new colour tokens at the bottom of the existing `@theme {}` block**

Add this section (do not remove or rename any existing token):

```css
  /* ===== Redesign / Cream Surface (Phase 0) ===== */

  /* Surface */
  --color-cream:        #F5F1E6;
  --color-cream-soft:   #EDE8DA;

  /* Ink */
  --color-ink:          #0A0A0A;
  --color-ink-soft:     #1F1F1F;
  --color-ink-muted:    #6B6B6B;

  /* Brand green (anchored to existing #4ACF52 / #008755) */
  --color-jersey:       #4ACF52;
  --color-jersey-deep:  #008755;
  --color-jersey-bright:#22C55E;

  /* Edges */
  --color-paper-edge:   #D9D2BD;
```

**Step 3: Verify Tailwind v4 picks up the tokens**

Run: `pnpm --filter @kcvv/web run dev` in a separate terminal, then in another:
```bash
curl -s http://localhost:3000 > /dev/null   # warm up
```
Open the browser at http://localhost:3000, open devtools, and check `:root` computed styles include `--color-cream` with value `#F5F1E6`. Stop the dev server.

**Step 4: Verify type-check still passes**

Run: `pnpm --filter @kcvv/web run check-all`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(ui): redesign phase 0 — add cream/ink/jersey colour tokens"
```

---

## Task 2: Add typography tokens

**Files:**
- Modify: `apps/web/src/app/globals.css` (same `@theme {}` block, new section beneath colour tokens)

**Step 1: Add font-family tokens**

Insert after the colour tokens added in Task 1:

```css
  /* ===== Redesign / Typography (Phase 0) ===== */

  /* Font families — Freight already loaded via existing Adobe Typekit kit */
  --font-display:     "freight-display-pro", Georgia, "Times New Roman", serif;
  --font-display-big: "freight-big-pro", Georgia, "Times New Roman", serif;
  /* --font-body and --font-mono are existing — Quasimoda flips title→body in Phase 9 cleanup */
```

**Step 2: Add the fluid type scale**

Append to the same section:

```css
  /* Type scale (fluid via clamp) */
  --text-display-2xl:        clamp(3.5rem, 1.5rem + 8vw, 6rem);
  --text-display-2xl--lh:    1.0;
  --text-display-xl:         clamp(2.75rem, 1.5rem + 5vw, 4.5rem);
  --text-display-xl--lh:     1.05;
  --text-display-lg:         clamp(2rem, 1.25rem + 3vw, 3rem);
  --text-display-lg--lh:     1.1;
  --text-display-md:         clamp(1.5rem, 1rem + 1.5vw, 2rem);
  --text-display-md--lh:     1.2;
  --text-display-sm:         clamp(1.25rem, 1rem + 1vw, 1.5rem);
  --text-display-sm--lh:     1.3;
  --text-body-lg:            1.125rem;
  --text-body-lg--lh:        1.55;
  --text-body-md:            1rem;
  --text-body-md--lh:        1.6;
  --text-body-sm:            0.875rem;
  --text-body-sm--lh:        1.55;
  --text-mono-md:            0.875rem;
  --text-mono-md--lh:        1.4;
  --text-mono-sm:            0.75rem;
  --text-mono-sm--lh:        1.4;
  --text-label:              0.6875rem;
  --text-label--lh:          1;
  --text-label--tracking:    0.08em;
```

**Step 3: Smoke-test in browser**

Run: `pnpm --filter @kcvv/web run dev`. In devtools console:
```js
getComputedStyle(document.documentElement).getPropertyValue('--font-display')
// expected: "freight-display-pro", Georgia, "Times New Roman", serif
getComputedStyle(document.documentElement).getPropertyValue('--text-display-xl')
// expected: a clamp() value
```

**Step 4: Verify check-all**

Run: `pnpm --filter @kcvv/web run check-all`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(ui): redesign phase 0 — add display/body/mono typography tokens"
```

---

## Task 3: Add spacing, rotation, shadow, and motion tokens

**Files:**
- Modify: `apps/web/src/app/globals.css`

**Step 1: Append the layout / motion section**

Insert beneath the typography tokens:

```css
  /* ===== Redesign / Layout & Motion (Phase 0) ===== */

  --container-prose:    680px;
  --container-default:  1200px;
  /* --max-width-outer (1440px) already exists — reuse for full-bleed */

  --rotate-tape-a:     -2.5deg;
  --rotate-tape-b:     -1.5deg;
  --rotate-tape-c:      1deg;
  --rotate-tape-d:      2deg;

  --shadow-paper-sm:   4px 4px 0 0 var(--color-ink);
  --shadow-paper-md:   6px 6px 0 0 var(--color-ink);
  --shadow-paper-lift: 8px 8px 0 0 var(--color-ink);
  --shadow-soft:       0 2px 8px rgba(0, 0, 0, 0.08);

  --motion-fast:  150ms ease-out;
  --motion-base:  240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  --motion-tape:  300ms ease-out;
```

**Step 2: Verify check-all**

Run: `pnpm --filter @kcvv/web run check-all`
Expected: PASS.

**Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(ui): redesign phase 0 — add layout, rotation, shadow, motion tokens"
```

---

## Task 4: Add pattern tokens

**Files:**
- Modify: `apps/web/src/app/globals.css`

**Step 1: Append the patterns section**

```css
  /* ===== Redesign / Pattern Tokens (Phase 0) ===== */

  --pattern-jersey-stripes: repeating-linear-gradient(
    90deg,
    var(--color-jersey) 0 32px,
    var(--color-cream) 32px 64px
  );

  --pattern-jersey-stripes-tight: repeating-linear-gradient(
    90deg,
    var(--color-jersey) 0 14px,
    var(--color-cream) 14px 28px
  );

  --pattern-seam: repeating-linear-gradient(
    -45deg,
    var(--color-ink) 0 8px,
    var(--color-cream) 8px 16px
  );
```

**Step 2: Verify check-all**

Run: `pnpm --filter @kcvv/web run check-all`
Expected: PASS.

**Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(ui): redesign phase 0 — add jersey-stripes and seam pattern tokens"
```

---

## Task 5: Update `Foundation/Colors.mdx` with new swatches

**Files:**
- Modify: `apps/web/src/stories/foundation/Colors.mdx`
- Possibly modify: `apps/web/src/stories/foundation/Colors.stories.tsx` (only if its meta needs an update — usually no change required)

**Step 1: Read the current `Colors.mdx` to understand the swatch table format**

Run: `cat apps/web/src/stories/foundation/Colors.mdx | head -60`
Note the table structure — copy it for new swatches.

**Step 2: Append a new "Redesign / Phase 0" section to Colors.mdx**

The MDX file uses native HTML `<table>` elements (MDX 2 caveat from `apps/web/CLAUDE.md`). Add a section like:

```mdx
## Redesign / Phase 0 — Cream Surface

These tokens land in Phase 0 of the editorial-magazine redesign. Legacy
`--color-kcvv-*` tokens remain valid until Phase 9 cleanup; both
vocabularies coexist.

<table>
  <thead>
    <tr><th>Token</th><th>Hex</th><th>Sample</th><th>Role</th><th>Contrast on cream</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>--color-cream</code></td>
      <td>#F5F1E6</td>
      <td><div style={{background:'var(--color-cream)', height:'2rem', border:'1px solid var(--color-paper-edge)'}}/></td>
      <td>Default page bg</td>
      <td>—</td>
    </tr>
    {/* repeat for: cream-soft, ink, ink-soft, ink-muted, jersey, jersey-deep, jersey-bright, paper-edge */}
  </tbody>
</table>
```

Use the contrast ratios from `docs/prd/redesign-phase-0.md` §1.1 (verified WCAG values).

**Step 3: Run Storybook locally to confirm the new section renders**

Run: `pnpm --filter @kcvv/web run storybook` and open the `Foundation/Colors` page.
Expected: new section visible, all swatches render the right colour.

**Step 4: Commit**

```bash
git add apps/web/src/stories/foundation/Colors.mdx
git commit -m "docs(ui): redesign phase 0 — document cream/ink/jersey swatches in Foundation/Colors"
```

---

## Task 6: Update `Foundation/Typography.mdx` with new type tokens

**Files:**
- Modify: `apps/web/src/stories/foundation/Typography.mdx`

**Step 1: Read the current `Typography.mdx` to understand layout**

Run: `cat apps/web/src/stories/foundation/Typography.mdx | head -80`

**Step 2: Append a "Redesign / Phase 0" section**

Render Dutch sample text including diacritics (`ë`, `é`, `ï`) and italics. Show Freight Display italic + Quasimoda body together so the pairing is visible:

```mdx
## Redesign / Phase 0 — Editorial Type Scale

<div style={{fontFamily:'var(--font-display)', fontSize:'var(--text-display-xl)', lineHeight:'var(--text-display-xl--lh)', fontWeight:900}}>
  Laatste <em style={{fontStyle:'italic', fontWeight:700}}>nieuws.</em>
</div>

<div style={{fontFamily:'var(--font-display)', fontSize:'var(--text-display-lg)', lineHeight:'var(--text-display-lg--lh)', fontWeight:700}}>
  Het rooster.
</div>

<div style={{fontFamily:'var(--font-body)', fontSize:'var(--text-body-md)', lineHeight:'var(--text-body-md--lh)'}}>
  Drie afdelingen, 320 kinderen, één idee: plezier eerst. Onze academie draait op vrijwilligers, koffie en ouders die nog lang na de match blijven hangen.
</div>

<div style={{fontFamily:'var(--font-mono)', fontSize:'var(--text-label)', letterSpacing:'var(--text-label--tracking)', textTransform:'uppercase', lineHeight:1}}>
  INTERVIEW · SNELTREIN · 8 MIN
</div>
```

Add a token table beneath the samples documenting every new `--text-*` value.

**Step 3: Verify in Storybook**

Run: `pnpm --filter @kcvv/web run storybook`. Open `Foundation/Typography`. Verify Freight Display renders the sample text (not the Georgia fallback).

**Step 4: Commit**

```bash
git add apps/web/src/stories/foundation/Typography.mdx
git commit -m "docs(ui): redesign phase 0 — document editorial type scale in Foundation/Typography"
```

---

## Task 7: Update `Foundation/SpacingAndIcons.mdx` with new tokens

**Files:**
- Modify: `apps/web/src/stories/foundation/SpacingAndIcons.mdx`

**Step 1: Append a "Redesign / Phase 0" section**

Document container widths, rotation pool, shadow tokens, motion tokens. Use native HTML tables. Render visual swatches:
- Container widths as horizontal rule samples at the actual width.
- Rotations as taped-card mockups (small `<div>` rotated by each `--rotate-tape-*` value).
- Shadows as lifted divs with each `--shadow-paper-*` value applied.
- Motion tokens as a description-only table — interactive demo lives inside `TapedCard.stories.tsx` later.

**Step 2: Verify in Storybook**

Open `Foundation/SpacingAndIcons` — confirm new section renders with visible rotation samples and stepped shadow depths.

**Step 3: Commit**

```bash
git add apps/web/src/stories/foundation/SpacingAndIcons.mdx
git commit -m "docs(ui): redesign phase 0 — document containers, rotations, shadows, motion in Foundation/SpacingAndIcons"
```

---

## Task 8: Create `Foundation/Patterns.mdx` and sibling story wrapper

**Files:**
- Create: `apps/web/src/stories/foundation/Patterns.mdx`
- Create: `apps/web/src/stories/foundation/Patterns.stories.tsx`
- Modify: `apps/web/.storybook/main.ts` if `**/foundation/*.stories.tsx` is not already auto-discovered (check first; usually no change needed)

**Step 1: Create `Patterns.mdx`**

Per `apps/web/CLAUDE.md` Foundation MDX wrapper convention: the MDX file has no `<Meta>` block (so it doesn't register a docs entry); only the sibling `.stories.tsx` renders it. Content:

```mdx
# Patterns

Background patterns used by the redesign as first-class CSS variable tokens. Compose primitives reference these directly via `background: var(--pattern-...)` rather than redefining gradients inline.

## `--pattern-jersey-stripes`

Wide green/cream horizontal stripes (32 px / 32 px). Used on hero illustrations, dark interlude backgrounds, and the jersey shirt thumbnail in the homepage webshop strip.

<div style={{height:'120px', background:'var(--pattern-jersey-stripes)', border:'1px solid var(--color-paper-edge)'}}/>

## `--pattern-jersey-stripes-tight`

Tight green/cream horizontal stripes (14 px / 14 px). Used on small player figures, retro shirt thumbnails, and background fills where the wide stripes feel coarse.

<div style={{height:'120px', background:'var(--pattern-jersey-stripes-tight)', border:'1px solid var(--color-paper-edge)'}}/>

## `--pattern-seam`

Diagonal black/cream barber-pole stripe at -45° (8 px / 8 px). Used by `<StripedSeam>` for horizontal section dividers. Never apply with negative margins; `<StripedSeam>` is SVG-backed for clean caps.

<div style={{height:'24px', background:'var(--pattern-seam)'}}/>
```

**Step 2: Create the sibling story wrapper**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import Patterns from "./Patterns.mdx";

const meta = {
  title: "Foundation/Patterns",
  component: () => <Patterns />,
  tags: ["vr"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {};
```

**Step 3: Verify it appears in Storybook**

Run: `pnpm --filter @kcvv/web run storybook`. Navigate to `Foundation/Patterns/Reference`. All three pattern swatches render.

**Step 4: Commit**

```bash
git add apps/web/src/stories/foundation/Patterns.mdx apps/web/src/stories/foundation/Patterns.stories.tsx
git commit -m "docs(ui): redesign phase 0 — add Foundation/Patterns MDX with jersey and seam patterns"
```

---

## Task 9: `<TapeStrip>` primitive — TDD

**Files:**
- Create: `apps/web/src/components/design-system/TapeStrip/TapeStrip.tsx`
- Create: `apps/web/src/components/design-system/TapeStrip/TapeStrip.test.tsx`
- Create: `apps/web/src/components/design-system/TapeStrip/TapeStrip.stories.tsx`
- Create: `apps/web/src/components/design-system/TapeStrip/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts` (barrel export)

**Step 1: Write the failing tests**

```tsx
// TapeStrip.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TapeStrip } from "./TapeStrip";

describe("TapeStrip", () => {
  it("renders with default jersey colour and tl position", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "jersey");
    expect(el).toHaveAttribute("data-position", "tl");
  });

  it("respects color, position, length, and rotation props", () => {
    const { container } = render(
      <TapeStrip color="ink" position="br" length="lg" rotation={-12} />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "ink");
    expect(el).toHaveAttribute("data-position", "br");
    expect(el).toHaveAttribute("data-length", "lg");
    expect(el.style.transform).toContain("rotate(-12deg)");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @kcvv/web vitest run src/components/design-system/TapeStrip/TapeStrip.test.tsx`
Expected: FAIL with "Cannot find module './TapeStrip'".

**Step 3: Implement minimal `<TapeStrip>`**

```tsx
// TapeStrip.tsx
import type { CSSProperties } from "react";

export type TapeStripColor = "jersey" | "ink" | "cream";
export type TapeStripPosition = "tl" | "tr" | "bl" | "br";
export type TapeStripLength = "sm" | "md" | "lg";

export interface TapeStripProps {
  color?: TapeStripColor;
  position?: TapeStripPosition;
  length?: TapeStripLength;
  rotation?: number;
}

const LENGTH_CLASS: Record<TapeStripLength, string> = {
  sm: "h-3 w-12",
  md: "h-4 w-16",
  lg: "h-5 w-24",
};

const COLOR_CLASS: Record<TapeStripColor, string> = {
  jersey: "bg-jersey",
  ink: "bg-ink",
  cream: "bg-cream",
};

const POSITION_CLASS: Record<TapeStripPosition, string> = {
  tl: "absolute -top-2 -left-2 origin-top-left",
  tr: "absolute -top-2 -right-2 origin-top-right",
  bl: "absolute -bottom-2 -left-2 origin-bottom-left",
  br: "absolute -bottom-2 -right-2 origin-bottom-right",
};

const DEFAULT_ROTATION: Record<TapeStripPosition, number> = {
  tl: -8,
  tr: 8,
  bl: 8,
  br: -8,
};

export function TapeStrip({
  color = "jersey",
  position = "tl",
  length = "md",
  rotation,
}: TapeStripProps) {
  const rot = rotation ?? DEFAULT_ROTATION[position];
  const style: CSSProperties = { transform: `rotate(${rot}deg)` };
  return (
    <span
      data-color={color}
      data-position={position}
      data-length={length}
      className={`${POSITION_CLASS[position]} ${LENGTH_CLASS[length]} ${COLOR_CLASS[color]} block opacity-90`}
      style={style}
      aria-hidden="true"
    />
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @kcvv/web vitest run src/components/design-system/TapeStrip/TapeStrip.test.tsx`
Expected: PASS (2 tests).

**Step 5: Write the Storybook story**

```tsx
// TapeStrip.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { TapeStrip } from "./TapeStrip";

const meta = {
  title: "UI/TapeStrip",
  component: TapeStrip,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="relative h-40 w-64 bg-cream-soft border border-paper-edge">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TapeStrip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: { color: "jersey", position: "tl", length: "md" } };

export const AllPositions: Story = {
  render: () => (
    <>
      <TapeStrip position="tl" />
      <TapeStrip position="tr" />
      <TapeStrip position="bl" />
      <TapeStrip position="br" />
    </>
  ),
};

export const InkColor: Story = { args: { color: "ink" } };
export const CreamColor: Story = { args: { color: "cream" } };
export const LongLength: Story = { args: { length: "lg" } };
export const ShortLength: Story = { args: { length: "sm" } };
export const CustomRotation: Story = { args: { rotation: -25 } };
```

**Step 6: Add to the barrel export**

Create `apps/web/src/components/design-system/TapeStrip/index.ts`:
```ts
export { TapeStrip, type TapeStripProps, type TapeStripColor, type TapeStripPosition, type TapeStripLength } from "./TapeStrip";
```

Add to `apps/web/src/components/design-system/index.ts` (insert in alphabetical order):
```ts
export * from "./TapeStrip";
```

**Step 7: Verify Storybook renders the new stories**

Run: `pnpm --filter @kcvv/web run storybook`. Navigate `UI/TapeStrip`. All variant stories render.

**Step 8: Commit**

```bash
git add apps/web/src/components/design-system/TapeStrip apps/web/src/components/design-system/index.ts
git commit -m "feat(ui): redesign phase 0 — add <TapeStrip> primitive with stories and tests"
```

---

## Task 10: `<StripedSeam>` primitive — TDD

**Files:**
- Create: `apps/web/src/components/design-system/StripedSeam/StripedSeam.tsx`
- Create: `apps/web/src/components/design-system/StripedSeam/StripedSeam.test.tsx`
- Create: `apps/web/src/components/design-system/StripedSeam/StripedSeam.stories.tsx`
- Create: `apps/web/src/components/design-system/StripedSeam/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts`

**Step 1: Write the failing tests**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StripedSeam } from "./StripedSeam";

describe("StripedSeam", () => {
  it("renders an SVG with horizontal direction by default", () => {
    const { container } = render(<StripedSeam />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute("data-direction", "horizontal");
    expect(svg).toHaveAttribute("data-color-pair", "ink-cream");
  });

  it("respects direction, height, and colorPair props", () => {
    const { container } = render(
      <StripedSeam direction="vertical" height="lg" colorPair="jersey-cream" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-direction", "vertical");
    expect(svg).toHaveAttribute("data-height", "lg");
    expect(svg).toHaveAttribute("data-color-pair", "jersey-cream");
  });
});
```

**Step 2: Run failing tests**

Run: `pnpm --filter @kcvv/web vitest run src/components/design-system/StripedSeam`
Expected: FAIL.

**Step 3: Implement minimal**

```tsx
// StripedSeam.tsx
export type StripedSeamDirection = "horizontal" | "vertical";
export type StripedSeamHeight = "sm" | "md" | "lg";
export type StripedSeamColorPair = "ink-cream" | "jersey-cream";

export interface StripedSeamProps {
  direction?: StripedSeamDirection;
  height?: StripedSeamHeight;
  colorPair?: StripedSeamColorPair;
}

const HEIGHT_PX: Record<StripedSeamHeight, number> = { sm: 12, md: 18, lg: 24 };

export function StripedSeam({
  direction = "horizontal",
  height = "md",
  colorPair = "ink-cream",
}: StripedSeamProps) {
  const h = HEIGHT_PX[height];
  const isVertical = direction === "vertical";
  const stroke1 =
    colorPair === "ink-cream" ? "var(--color-ink)" : "var(--color-jersey)";
  const stroke2 = "var(--color-cream)";
  const patternId = `seam-pattern-${direction}-${height}-${colorPair}`;
  return (
    <svg
      data-direction={direction}
      data-height={height}
      data-color-pair={colorPair}
      role="presentation"
      aria-hidden="true"
      width={isVertical ? h : "100%"}
      height={isVertical ? "100%" : h}
      style={{ display: "block" }}
    >
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width="16"
          height="16"
          patternTransform="rotate(-45)"
        >
          <rect x="0" y="0" width="8" height="16" fill={stroke1} />
          <rect x="8" y="0" width="8" height="16" fill={stroke2} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
```

**Step 4: Run tests to verify pass**

Run: `pnpm --filter @kcvv/web vitest run src/components/design-system/StripedSeam`
Expected: PASS (2 tests).

**Step 5: Write the story**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { StripedSeam } from "./StripedSeam";

const meta = {
  title: "UI/StripedSeam",
  component: StripedSeam,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof StripedSeam>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: { direction: "horizontal", height: "md", colorPair: "ink-cream" } };
export const HeightSmall: Story = { args: { height: "sm" } };
export const HeightLarge: Story = { args: { height: "lg" } };
export const JerseyCream: Story = { args: { colorPair: "jersey-cream" } };
export const Vertical: Story = {
  args: { direction: "vertical" },
  decorators: [(Story) => <div style={{ height: "200px", display: "flex" }}><Story /></div>],
};
```

**Step 6: Add barrel exports** (same pattern as Task 9 step 6).

**Step 7: Commit**

```bash
git add apps/web/src/components/design-system/StripedSeam apps/web/src/components/design-system/index.ts
git commit -m "feat(ui): redesign phase 0 — add <StripedSeam> SVG-backed section divider"
```

---

## Task 11: Divider primitives (`<DottedDivider>`, `<DashedDivider>`, `<SolidDivider>`) — TDD

**Files:**
- Create: `apps/web/src/components/design-system/Divider/Divider.tsx`
- Create: `apps/web/src/components/design-system/Divider/Divider.test.tsx`
- Create: `apps/web/src/components/design-system/Divider/Divider.stories.tsx`
- Create: `apps/web/src/components/design-system/Divider/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts`

**Step 1: Write the failing tests**

Test all three exports render with correct `border-style`:
```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashedDivider, DottedDivider, SolidDivider } from "./Divider";

describe("Divider variants", () => {
  it.each([
    ["dotted", DottedDivider],
    ["dashed", DashedDivider],
    ["solid", SolidDivider],
  ] as const)("%s renders with correct style", (style, Component) => {
    const { container } = render(<Component />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-style", style);
  });

  it("inset adds left padding", () => {
    const { container } = render(<DashedDivider inset />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-inset", "true");
  });

  it("color prop changes data attribute", () => {
    const { container } = render(<SolidDivider color="paper-edge" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "paper-edge");
  });
});
```

**Step 2: Run failing tests**

**Step 3: Implement**

Single file with three exports. `DottedDivider`, `DashedDivider`, `SolidDivider` are pre-bound `<Divider style="dotted" />` etc:
```tsx
// Divider.tsx
export type DividerStyle = "dotted" | "dashed" | "solid";
export type DividerColor = "ink" | "paper-edge";

export interface DividerProps {
  style?: DividerStyle;
  color?: DividerColor;
  inset?: boolean;
}

const STYLE_CLASS: Record<DividerStyle, string> = {
  dotted: "border-t-2 border-dotted",
  dashed: "border-t-2 border-dashed",
  solid: "border-t border-solid",
};

const COLOR_CLASS: Record<DividerColor, string> = {
  ink: "border-ink",
  "paper-edge": "border-paper-edge",
};

export function Divider({ style = "solid", color = "ink", inset = false }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      data-style={style}
      data-color={color}
      data-inset={inset || undefined}
      className={`${STYLE_CLASS[style]} ${COLOR_CLASS[color]} ${inset ? "ml-12" : ""} w-full`}
    />
  );
}

export const DottedDivider = (props: Omit<DividerProps, "style">) => <Divider {...props} style="dotted" />;
export const DashedDivider = (props: Omit<DividerProps, "style">) => <Divider {...props} style="dashed" />;
export const SolidDivider = (props: Omit<DividerProps, "style">) => <Divider {...props} style="solid" />;
```

**Step 4: Run passing tests**

**Step 5: Write the story** — single story file with three sub-stories per variant × colour × inset combo.

**Step 6: Add barrel exports.**

**Step 7: Commit**

```bash
git add apps/web/src/components/design-system/Divider apps/web/src/components/design-system/index.ts
git commit -m "feat(ui): redesign phase 0 — add Divider primitive with dotted/dashed/solid variants"
```

---

## Task 12: `<QuoteMark>` primitive — TDD

**Files:**
- Create: `apps/web/src/components/design-system/QuoteMark/QuoteMark.tsx`
- Create: `apps/web/src/components/design-system/QuoteMark/QuoteMark.test.tsx`
- Create: `apps/web/src/components/design-system/QuoteMark/QuoteMark.stories.tsx`
- Create: `apps/web/src/components/design-system/QuoteMark/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts`

**Step 1: Write failing tests**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuoteMark } from "./QuoteMark";

describe("QuoteMark", () => {
  it("renders an SVG with default jersey color", () => {
    const { container } = render(<QuoteMark />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute("data-color", "jersey");
  });

  it("respects color prop", () => {
    const { container } = render(<QuoteMark color="cream" />);
    expect(container.querySelector("svg")).toHaveAttribute("data-color", "cream");
  });
});
```

**Step 2: Run failing tests.**

**Step 3: Implement** — pure SVG, ~20px square, two stacked italic open-quote glyphs:

```tsx
export type QuoteMarkColor = "jersey" | "ink" | "cream";

export interface QuoteMarkProps { color?: QuoteMarkColor }

const COLOR: Record<QuoteMarkColor, string> = {
  jersey: "var(--color-jersey)",
  ink: "var(--color-ink)",
  cream: "var(--color-cream)",
};

export function QuoteMark({ color = "jersey" }: QuoteMarkProps) {
  return (
    <svg
      data-color={color}
      role="presentation"
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={COLOR[color]}
    >
      {/* two slanted "double-quote" tear-drops; tweak path to taste */}
      <path d="M4 6 C4 4 6 3 8 3 L8 9 C6 9 5 10 5 12 L4 12 Z" />
      <path d="M14 6 C14 4 16 3 18 3 L18 9 C16 9 15 10 15 12 L14 12 Z" />
    </svg>
  );
}
```

(Designer can refine the path in the SVG; tests only assert the element exists with correct attribute.)

**Step 4: Run passing tests.**

**Step 5: Write the story** — Playground + each colour, decorated on cream and ink backgrounds.

**Step 6: Add barrel exports.**

**Step 7: Commit**

```bash
git commit -m "feat(ui): redesign phase 0 — add <QuoteMark> SVG glyph primitive"
```

---

## Task 13: `<TicketStub>` primitive — TDD

**Files:**
- Create: `apps/web/src/components/design-system/TicketStub/TicketStub.tsx`
- Create: `apps/web/src/components/design-system/TicketStub/TicketStub.test.tsx`
- Create: `apps/web/src/components/design-system/TicketStub/TicketStub.stories.tsx`
- Create: `apps/web/src/components/design-system/TicketStub/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts`

**Step 1: Write failing tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TicketStub } from "./TicketStub";

describe("TicketStub", () => {
  it("renders label and value", () => {
    render(<TicketStub label="STAMNR." value="55" />);
    expect(screen.getByText("STAMNR.")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
  });

  it("position controls absolute placement", () => {
    const { container } = render(<TicketStub label="X" value="Y" position="overlay-tr" />);
    expect(container.firstChild).toHaveAttribute("data-position", "overlay-tr");
  });

  it("rotation prop is applied as transform", () => {
    const { container } = render(<TicketStub label="X" value="Y" rotation={4} />);
    expect((container.firstChild as HTMLElement).style.transform).toContain("rotate(4deg)");
  });
});
```

**Step 2: Run failing tests.**

**Step 3: Implement** — perforated-edge styling via SVG path, mono content inside. Use `position: absolute` for `overlay-*`, normal flow for `inline`:

```tsx
import type { CSSProperties } from "react";

export type TicketStubPosition = "overlay-tr" | "overlay-bl" | "inline";
export interface TicketStubProps {
  label: string;
  value: string;
  rotation?: number;
  position?: TicketStubPosition;
}

const POSITION_CLASS: Record<TicketStubPosition, string> = {
  "overlay-tr": "absolute top-2 right-2",
  "overlay-bl": "absolute bottom-2 left-2",
  inline: "",
};

export function TicketStub({ label, value, rotation = 0, position = "inline" }: TicketStubProps) {
  const style: CSSProperties = { transform: `rotate(${rotation}deg)` };
  return (
    <span
      data-position={position}
      style={style}
      className={`${POSITION_CLASS[position]} inline-flex flex-col items-start bg-ink text-cream px-3 py-1 font-mono text-[11px] leading-none uppercase tracking-[0.08em] shadow-paper-sm relative`}
    >
      {/* perforated edge — left */}
      <span aria-hidden="true" className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-cream" />
      <span aria-hidden="true" className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rounded-full bg-cream" />
      <span className="text-jersey-bright">{label}</span>
      <span>{value}</span>
    </span>
  );
}
```

**Step 4: Run passing tests.**

**Step 5: Write the story** — multiple ticket stubs (`STAMNR. 55`, `SINDS 1909`, `A-PLOEG 26/27`, `NIEUW`) inside a card frame.

**Step 6: Add barrel exports.**

**Step 7: Commit**

```bash
git commit -m "feat(ui): redesign phase 0 — add <TicketStub> mono-content ephemera primitive"
```

---

## Task 14: `<HighlighterStroke>` primitive — TDD

**Files:**
- Create: `apps/web/src/components/design-system/HighlighterStroke/HighlighterStroke.tsx`
- Create: `apps/web/src/components/design-system/HighlighterStroke/HighlighterStroke.test.tsx`
- Create: `apps/web/src/components/design-system/HighlighterStroke/HighlighterStroke.stories.tsx`
- Create: `apps/web/src/components/design-system/HighlighterStroke/strokes.ts` (3 hand-drawn SVG path strings)
- Create: `apps/web/src/components/design-system/HighlighterStroke/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts`

**Decision recorded:** for Phase 0 we ship a single-line CSS-only approach using a background-image SVG. This is server-component-safe and renders correctly for the 99 % case (single italic word emphasis like `nieuws.`, `woorden.`). If a multi-line case ever appears, a follow-up phase adds a client-side `useLineMeasure` hook. See PRD §7 open question 1.

**Step 1: Write failing tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HighlighterStroke } from "./HighlighterStroke";

describe("HighlighterStroke", () => {
  it("renders children", () => {
    render(<HighlighterStroke>nieuws</HighlighterStroke>);
    expect(screen.getByText("nieuws")).toBeInTheDocument();
  });

  it("variant prop selects different stroke", () => {
    const { container } = render(<HighlighterStroke variant="b">x</HighlighterStroke>);
    expect(container.firstChild).toHaveAttribute("data-variant", "b");
  });

  it("renders a span with data-variant default a", () => {
    const { container } = render(<HighlighterStroke>x</HighlighterStroke>);
    expect(container.firstChild).toHaveAttribute("data-variant", "a");
  });
});
```

**Step 2: Run failing tests.**

**Step 3: Implement strokes.ts**

```ts
// Three hand-drawn-ish horizontal stroke paths, scalable via viewBox 0 0 100 8.
// Designer can refine these later; the API stays stable.
export const STROKES = {
  a: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'><path d='M2 4 Q 20 2, 50 4 T 98 4' stroke='%234ACF52' stroke-width='5' fill='none' stroke-linecap='round'/></svg>`,
  b: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'><path d='M3 5 Q 30 1, 60 5 T 97 4' stroke='%234ACF52' stroke-width='6' fill='none' stroke-linecap='round'/></svg>`,
  c: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'><path d='M2 5 Q 25 6, 50 4 T 97 5' stroke='%234ACF52' stroke-width='4' fill='none' stroke-linecap='round'/></svg>`,
} as const;
```

**Step 4: Implement HighlighterStroke.tsx**

```tsx
import { STROKES } from "./strokes";

export type HighlighterStrokeVariant = "a" | "b" | "c";

export interface HighlighterStrokeProps {
  variant?: HighlighterStrokeVariant;
  children: React.ReactNode;
}

export function HighlighterStroke({ variant = "a", children }: HighlighterStrokeProps) {
  const dataUrl = `data:image/svg+xml;utf8,${STROKES[variant]}`;
  return (
    <span
      data-variant={variant}
      style={{
        backgroundImage: `url("${dataUrl}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 88%",
        backgroundSize: "100% 0.4em",
        paddingBottom: "0.1em",
      }}
    >
      {children}
    </span>
  );
}
```

**Step 5: Run passing tests.**

**Step 6: Write the story** — show all 3 variants applied to `<em>nieuws</em>`, `<em>woorden</em>`, `<em>toekomst</em>` inside a Freight Display headline at `--text-display-lg`. Include a multi-line story marked `vr-skip` documenting the Phase 0 limitation.

**Step 7: Add barrel exports.**

**Step 8: Commit**

```bash
git commit -m "feat(ui): redesign phase 0 — add <HighlighterStroke> CSS-bg SVG underline primitive"
```

---

## Task 15: `<MonoLabel>` primitive — TDD

**Files:**
- Create: `apps/web/src/components/design-system/MonoLabel/MonoLabel.tsx`
- Create: `apps/web/src/components/design-system/MonoLabel/MonoLabel.test.tsx`
- Create: `apps/web/src/components/design-system/MonoLabel/MonoLabel.stories.tsx`
- Create: `apps/web/src/components/design-system/MonoLabel/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts`

**Step 1: Write failing tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonoLabel } from "./MonoLabel";

describe("MonoLabel", () => {
  it("renders children uppercased visually", () => {
    render(<MonoLabel>interview</MonoLabel>);
    const el = screen.getByText("interview");
    expect(el).toBeInTheDocument();
    expect(window.getComputedStyle(el).textTransform).toBe("uppercase");
  });

  it("variant pill-jersey adds bg class", () => {
    const { container } = render(<MonoLabel variant="pill-jersey">X</MonoLabel>);
    expect(container.firstChild).toHaveAttribute("data-variant", "pill-jersey");
  });

  it("size md uses larger token", () => {
    const { container } = render(<MonoLabel size="md">X</MonoLabel>);
    expect(container.firstChild).toHaveAttribute("data-size", "md");
  });
});
```

**Step 2: Run failing tests.**

**Step 3: Implement**

```tsx
export type MonoLabelVariant = "plain" | "pill-jersey" | "pill-ink" | "pill-cream";
export type MonoLabelSize = "sm" | "md";

export interface MonoLabelProps {
  variant?: MonoLabelVariant;
  size?: MonoLabelSize;
  children: React.ReactNode;
}

const VARIANT_CLASS: Record<MonoLabelVariant, string> = {
  plain: "text-ink",
  "pill-jersey": "bg-jersey text-ink px-2 py-0.5",
  "pill-ink": "bg-ink text-cream px-2 py-0.5",
  "pill-cream": "bg-cream-soft text-ink px-2 py-0.5 border border-paper-edge",
};

const SIZE_CLASS: Record<MonoLabelSize, string> = {
  sm: "text-[11px] tracking-[0.08em]",
  md: "text-[13px] tracking-[0.06em]",
};

export function MonoLabel({ variant = "plain", size = "sm", children }: MonoLabelProps) {
  return (
    <span
      data-variant={variant}
      data-size={size}
      className={`${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} font-mono uppercase font-medium leading-none inline-block`}
    >
      {children}
    </span>
  );
}
```

**Step 4: Run passing tests.**

**Step 5: Write the story**

Show every (variant × size) combo with Dutch sample content: `INTERVIEW`, `MATCHVERSLAG`, `JEUGD ⋅ U15`, `8 MIN`, `NIEUW`, `KAMPIOEN.`, `TRANSFER ⋅ INCOMING`. Include both light and dark backgrounds in decorators.

**Step 6: Add barrel exports.**

**Step 7: Commit**

```bash
git commit -m "feat(ui): redesign phase 0 — add <MonoLabel> tracked-uppercase pill primitive"
```

---

## Task 16: Adobe Typekit cleanup — Stenciletta retirement

**Files:**
- No code change required (Typekit kit is configured in the Adobe portal). This task creates a record of the manual step.
- Create: `docs/plans/2026-04-28-redesign-phase-0-typekit-cleanup.md` — short note describing the manual step, when it was performed, and which fonts were removed.

**Step 1: Owner removes Stenciletta from the Adobe Typekit kit**

This is a manual step in the Adobe portal:
1. Sign in at fonts.adobe.com.
2. Open the existing kcvv-elewijt web project.
3. Remove all Stenciletta weights.
4. Confirm Quasimoda + Freight Display Pro + Freight Big Pro remain.
5. Save the kit.

**Step 2: Verify no code references Stenciletta**

Run:
```bash
git -C /Users/kevinvanransbeeck/Sites/KCVV/kcvv-redesign-master grep -n "stenciletta" -- apps packages
```
Expected: matches in the existing `globals.css` `--font-family-alt` token (legacy — leave for Phase 9 cleanup) and possibly some component CSS that uses `font-family: stenciletta`. **Do not remove these in Phase 0** — the legacy token coexists per the dual-coexistence policy. Stenciletta-using components keep working visually because the Typekit kit no longer serves it but the token still exists in CSS; they fall back to the system serif until those components are redesigned in their own phase.

If any Stenciletta-using component is *visually critical* (e.g. used in nav header or hero), flag it as a Phase 0 follow-up: that component's redesign moves up the schedule, OR Stenciletta is reinstated until the component is rebuilt.

**Step 3: Document**

Create `docs/plans/2026-04-28-redesign-phase-0-typekit-cleanup.md`:

```markdown
# Phase 0 — Adobe Typekit Cleanup

**Date performed:** YYYY-MM-DD
**Performed by:** <owner github handle>

## Removed
- Stenciletta — all weights

## Confirmed remaining
- Quasimoda — all current weights
- Freight Display Pro — 400 italic, 600, 700, 700 italic, 900
- Freight Big Pro — 700, 900

## Verification
Storybook Foundation/Typography story renders Freight, not Georgia fallback.
Production Storybook deployment loads kit without 404 for any font URL.
```

**Step 4: Commit**

```bash
git add docs/plans/2026-04-28-redesign-phase-0-typekit-cleanup.md
git commit -m "docs(ui): redesign phase 0 — record Stenciletta retirement from Typekit kit"
```

---

## Task 17: Capture VR baselines for all new stories

**Files:**
- Add: `apps/web/test/vr/__snapshots__/foundation-*.png`, `apps/web/test/vr/__snapshots__/ui-*.png` (auto-generated)

**Pre-flight:** Docker Desktop running. The `pnpm vr:update` script runs the test-runner inside the pinned Playwright image so font rendering matches CI.

**Step 1: Run the visual regression update**

Run: `pnpm --filter @kcvv/web run vr:update` (run in the background — see memory: full set ~41 min, Phase 0 set should be 5–10 min).

While it runs, monitor for `[VR] image failed to load` warnings in the output (broken images log to stdout per `apps/web/.storybook/test-runner.ts`).

**Step 2: Inspect the generated diff output**

If `vr:update` reports any *update* to an existing baseline (rather than a new capture), STOP. Inspect the diff PNG with `pnpm --filter @kcvv/web run vr:diff <story-id>` and confirm the change is intentional. If unintentional, fix the offending change before continuing.

**Step 3: Stage and review the new PNG files**

```bash
git -C /Users/kevinvanransbeeck/Sites/KCVV/kcvv-redesign-master status apps/web/test/vr/__snapshots__/
git -C /Users/kevinvanransbeeck/Sites/KCVV/kcvv-redesign-master diff --stat apps/web/test/vr/__snapshots__/
```

Verify only **new** baselines appear (`untracked`), not modifications to existing ones.

**Step 4: Run vr:check to confirm green**

Run: `pnpm --filter @kcvv/web run vr:check`
Expected: PASS — every committed baseline matches the rendered story exactly.

**Step 5: Commit baselines**

```bash
git add apps/web/test/vr/__snapshots__/
git commit -m "$(cat <<'EOF'
test(ui): redesign phase 0 — capture VR baselines for new primitives + foundation MDX

New baselines for: Foundation/Patterns, UI/TapeStrip, UI/StripedSeam,
UI/DottedDivider, UI/DashedDivider, UI/SolidDivider, UI/QuoteMark,
UI/TicketStub, UI/HighlighterStroke, UI/MonoLabel.

Updates to existing baselines: none. The cream/ink/jersey token additions
are additive and do not alter the rendered output of any existing story.
EOF
)"
```

---

## Task 18: Final integration check

**Step 1: Run the full check-all suite**

Run: `pnpm --filter @kcvv/web run check-all`
Expected: PASS (typecheck, lint, unit tests, build).

**Step 2: Run vr:check against the full baseline set**

Run: `pnpm --filter @kcvv/web run vr:check`
Expected: PASS.

**Step 3: Run the worktree-wide turbo build to validate api-contract isn't broken**

Run: `pnpm turbo build --filter=@kcvv/web`
Expected: PASS.

**Step 4: Confirm legacy tokens are intact**

Run:
```bash
git -C /Users/kevinvanransbeeck/Sites/KCVV/kcvv-redesign-master diff origin/main -- apps/web/src/app/globals.css | grep "^-" | grep -v "^---"
```
Expected: zero output (additive changes only). If any legacy token line was deleted, restore it before continuing — the dual-coexistence policy requires legacy tokens stay verbatim through Phase 8.

---

## Task 19: Update `apps/web/CLAUDE.md`

**Files:**
- Modify: `apps/web/CLAUDE.md`

**Step 1: Add a "Redesign primitives" subsection beneath "Design System & Storybook"**

```markdown
### Redesign primitives (Phase 0+)

Phase 0 of the editorial-magazine redesign added the following design-system primitives. They live alongside legacy components per the dual-coexistence policy. See `docs/plans/2026-04-27-redesign-master-design.md` for the design language audit and `docs/prd/redesign-phase-0.md` for token + primitive specs.

- `<TapeStrip>` — diagonal washi-tape graphic for card corners.
- `<StripedSeam>` — SVG-backed diagonal barber-pole horizontal section divider.
- `<DottedDivider>`, `<DashedDivider>`, `<SolidDivider>` — thin row dividers (interview Q&A, table rows).
- `<QuoteMark>` — two stacked italic open-quote glyphs.
- `<TicketStub>` — perforated-edge mono-content ephemera.
- `<HighlighterStroke>` — green hand-drawn underline beneath italic emphasis (single-line CSS-bg SVG).
- `<MonoLabel>` — tracked uppercase pill or plain label.

A new `Foundation/Patterns` MDX story documents `--pattern-jersey-stripes`, `--pattern-jersey-stripes-tight`, and `--pattern-seam`.
```

**Step 2: Verify the rendered MDX in Storybook**

Run: `pnpm --filter @kcvv/web run storybook`
Confirm all new primitives appear under `UI/*` and the Foundation MDX pages reference the new tokens.

**Step 3: Commit**

```bash
git add apps/web/CLAUDE.md
git commit -m "docs(ui): redesign phase 0 — list new primitives in apps/web/CLAUDE.md"
```

---

## Task 20: Open the PR

**Step 1: Push the branch**

```bash
git -C /Users/kevinvanransbeeck/Sites/KCVV/kcvv-redesign-master push -u origin feat/redesign-master
```

If the worktree was renamed for an issue (`kcvv-issue-N`), push with the appropriate branch name.

**Step 2: Open the PR**

```bash
gh pr create --title "redesign phase 0 — design tokens + Tier A primitives + foundation MDX" --body "$(cat <<'EOF'
## Summary

- Adds the cream/ink/jersey colour, editorial typography, layout, shadow, motion, and pattern tokens as additive entries in `apps/web/src/app/globals.css` `@theme {}`. Legacy `--color-kcvv-*` and font tokens stay verbatim per the dual-coexistence policy.
- Ships seven Tier A decorative primitives under `apps/web/src/components/design-system/`: `<TapeStrip>`, `<StripedSeam>`, three `<Divider>` variants, `<QuoteMark>`, `<TicketStub>`, `<HighlighterStroke>`, `<MonoLabel>`. Each has unit tests, a Storybook story under `UI/*` with `tags: ["autodocs", "vr"]`, and committed VR baselines.
- Documents the new tokens in `Foundation/Colors`, `Foundation/Typography`, `Foundation/SpacingAndIcons`, and a new `Foundation/Patterns`.
- Records the Stenciletta retirement from the Adobe Typekit kit.

This is the first PR in the editorial-magazine redesign series. Master design reference: `docs/plans/2026-04-27-redesign-master-design.md`. Phase 0 PRD: `docs/prd/redesign-phase-0.md`.

## VR baselines

All new captures (no updates to existing baselines):

- `foundation-patterns--reference` — first capture.
- `ui-tapestrip--*`, `ui-stripedseam--*`, `ui-dotteddivider--*`, `ui-dasheddivider--*`, `ui-soliddivider--*`, `ui-quotemark--*`, `ui-ticketstub--*`, `ui-highlighterstroke--*`, `ui-monolabel--*` — first captures across each variant story and viewport.

No existing `Features/*` or `Layout/*` baselines were touched. Token additions are additive and do not alter rendered output of any existing component.

## Test plan

- [x] `pnpm --filter @kcvv/web run check-all` green.
- [x] `pnpm --filter @kcvv/web run vr:check` green against all committed baselines.
- [x] Storybook Foundation/Typography renders Freight Display, not Georgia fallback.
- [x] Token additions are visible in `:root` computed styles (manual smoke check).
- [x] Quasimoda body fonts continue to load via Typekit with `display: swap`; no observable CLS on initial paint.
- [x] No legacy tokens removed (`git diff origin/main -- apps/web/src/app/globals.css` shows additions only).

## Out of scope (per Phase 0 PRD)

- Refactoring existing components to consume new tokens (per-phase work).
- Tier B / C primitives (`<TapedCard>`, `<TapedCardGrid>`, `<PlayerFigure>`, `<JerseyShirt>`, etc.) — Phase 1+.
- Atom rework (`<Button>`, `<Badge>` retirement, `<BrandedTabs>`) — Phase 2.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Return the PR URL.

---

## Definition of Done

- All tasks committed in order.
- `pnpm --filter @kcvv/web run check-all` green.
- `pnpm --filter @kcvv/web run vr:check` green.
- PR opened against `main` with the body template above.
- PR includes a VR baselines section enumerating new captures.
- `apps/web/CLAUDE.md` updated.
- Master design doc + Phase 0 PRD referenced from the PR body.

---

*End of Phase 0 implementation plan.*
