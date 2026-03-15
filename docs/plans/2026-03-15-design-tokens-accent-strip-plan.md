# Design Tokens — Accent Strip, Spacing Scale, Border-Radius Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the visual redesign token foundation: update `kcvv-green-dark` to `#008755`, add the 3px brand accent strip, and document spacing/border-radius conventions.

**Architecture:** `<AccentStrip />` is a fixed, decorative layout primitive rendered in root `layout.tsx` above `<PageHeader />`. The nav shifts down by `top-[3px]` to avoid overlap. Token update is a single value change in `globals.css` that propagates to all consumers via CSS custom properties.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, Storybook 10 (Vite), Vitest + Testing Library

---

## Task 1: Update `kcvv-green-dark` token

**Files:**

- Modify: `apps/web/src/app/globals.css`

**Step 1: Update both `:root` and `@theme` blocks**

In `globals.css`, find and update every occurrence of `#4B9B48` under `kcvv-green-dark`:

```css
/* :root block — line ~13 */
--color-kcvv-green-dark: #008755;
--color-kcvv-green-dark-hover: #006b43; /* darken #008755 by ~10% */

/* @theme block — line ~103 */
--color-kcvv-green-dark: #008755;
--color-kcvv-green-hover-dark: #006b43;
```

Also update the legacy alias at line ~45:

```css
--color-green--dark: #008755;
--color-green-dark-hover: #006b43;
```

**Step 2: Verify no stale `#4B9B48` values remain**

```bash
grep -n "4B9B48\|4b9b48" apps/web/src/app/globals.css
```

Expected: no output.

**Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(ui): update kcvv-green-dark token to #008755 for visual redesign"
```

---

## Task 2: Update Foundation/Colors Storybook MDX

**Files:**

- Modify: `apps/web/src/stories/foundation/Colors.mdx`

**Step 1: Update the green swatch row**

Find the `SwatchRow` in the `## Green (Brand Primary)` section. Update the `kcvv-green-dark` entry hex value and add a note about the redesign:

```mdx
<SwatchRow
  items={[
    {
      name: "kcvv-green / kcvv-green-bright",
      variable: "--color-kcvv-green-bright",
      hex: "#4acf52",
    },
    {
      name: "kcvv-green-hover",
      variable: "--color-kcvv-green-hover",
      hex: "#41b147",
    },
    {
      name: "kcvv-green-dark (section bg)",
      variable: "--color-kcvv-green-dark",
      hex: "#008755",
    },
    {
      name: "kcvv-green-hover-dark",
      variable: "--color-kcvv-green-hover-dark",
      hex: "#006b43",
    },
  ]}
/>
```

**Step 2: Verify Storybook renders correctly**

```bash
pnpm --filter @kcvv/web storybook
```

Open `Foundation/Colors` — confirm the dark green swatch shows `#008755` (deep forest green, not the old muted `#4B9B48`).

**Step 3: Commit**

```bash
git add apps/web/src/stories/foundation/Colors.mdx
git commit -m "feat(ui): update Colors MDX with #008755 kcvv-green-dark swatch"
```

---

## Task 3: Create `<AccentStrip />` component

**Files:**

- Create: `apps/web/src/components/layout/AccentStrip/AccentStrip.tsx`
- Create: `apps/web/src/components/layout/AccentStrip/AccentStrip.test.tsx`
- Create: `apps/web/src/components/layout/AccentStrip/AccentStrip.stories.tsx`
- Create: `apps/web/src/components/layout/AccentStrip/index.ts`

**Step 1: Write the failing test**

```tsx
// AccentStrip.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AccentStrip } from "./AccentStrip";

describe("AccentStrip", () => {
  it("renders a decorative fixed bar", () => {
    const { container } = render(<AccentStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("fixed", "top-0", "left-0", "right-0");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @kcvv/web test AccentStrip
```

Expected: FAIL — `AccentStrip` not found.

**Step 3: Write the component**

```tsx
// AccentStrip.tsx
/**
 * AccentStrip
 * A 3px kcvv-green decorative bar pinned to the top of the viewport.
 * Sits above the sticky nav (z-[51] > nav z-50).
 * Purely decorative — hidden from screen readers.
 */
export const AccentStrip = () => (
  <div
    aria-hidden="true"
    className="fixed top-0 left-0 right-0 h-[3px] bg-kcvv-green-bright z-[51]"
  />
);
```

**Step 4: Create barrel export**

```ts
// index.ts
export { AccentStrip } from "./AccentStrip";
```

**Step 5: Run test to verify it passes**

```bash
pnpm --filter @kcvv/web test AccentStrip
```

Expected: PASS.

**Step 6: Write Storybook story**

```tsx
// AccentStrip.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccentStrip } from "./AccentStrip";

const meta = {
  title: "Layout/AccentStrip",
  component: AccentStrip,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "3px kcvv-green brand accent bar fixed to the top of the viewport. " +
          "Sits above the nav (z-[51]). Purely decorative — aria-hidden.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AccentStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OnDarkBackground: Story = {
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story: "How the strip appears above the dark nav (#1E2024).",
      },
    },
  },
};
```

**Step 7: Commit**

```bash
git add apps/web/src/components/layout/AccentStrip/
git commit -m "feat(ui): add AccentStrip component with Storybook story"
```

---

## Task 4: Export `AccentStrip` from layout barrel

**Files:**

- Modify: `apps/web/src/components/layout/index.ts`

**Step 1: Add export**

Append after the `CookieConsentBanner` export:

```ts
// AccentStrip
export { AccentStrip } from "./AccentStrip";
```

**Step 2: Commit**

```bash
git add apps/web/src/components/layout/index.ts
git commit -m "feat(ui): export AccentStrip from layout barrel"
```

---

## Task 5: Add `<AccentStrip />` to root layout

**Files:**

- Modify: `apps/web/src/app/layout.tsx`

**Step 1: Import and render AccentStrip**

Add the import at the top alongside other layout imports:

```tsx
import { AccentStrip } from "@/components/layout/AccentStrip";
```

Inside `<body>`, render it as the **first child** before `<PageHeader />`:

```tsx
<body suppressHydrationWarning>
  <AccentStrip />
  <PageHeader youthTeams={youthTeams} seniorTeams={seniorTeams} />
  {children}
  <PageFooter />
  <CookieConsentBanner />
</body>
```

**Step 2: Commit**

```bash
git add apps/web/src/app/layout.tsx
git commit -m "feat(ui): render AccentStrip in root layout above PageHeader"
```

---

## Task 6: Restyle `PageHeader` — dark nav, offset position

**Files:**

- Modify: `apps/web/src/components/layout/PageHeader/PageHeader.tsx`
- Modify: `apps/web/src/components/layout/PageHeader/PageHeader.test.tsx`
- Modify: `apps/web/src/components/layout/PageHeader/PageHeader.stories.tsx`

**Step 1: Update the failing test first**

In `PageHeader.test.tsx`, find the test `should have fixed navigation` and update the expected class:

```tsx
it("should have fixed navigation", () => {
  const { container } = render(<PageHeader />);
  const nav = container.querySelector("nav");
  expect(nav).toHaveClass("fixed");
  expect(nav).toHaveClass("top-[3px]");
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @kcvv/web test PageHeader
```

Expected: FAIL — nav has `top-0`, not `top-[3px]`.

**Step 3: Update PageHeader component**

In `PageHeader.tsx`, find the `<nav>` element (around line 57). Replace the `className` and `style` prop:

```tsx
<nav
  className="fixed top-[3px] left-0 right-0 z-50 h-20 lg:h-[7.5rem] transition-[height] duration-300 bg-kcvv-black border-b border-white/[0.06]"
>
```

Remove the `style` prop entirely (it contained `backgroundColor`, `backgroundImage`, `backgroundRepeat`, `backgroundSize`, `backgroundPosition`, and `transform`).

Also update the spacer div below to account for the 3px shift:

```tsx
{
  /* Spacer — accounts for fixed nav height + 3px accent strip */
}
<div
  className="h-[calc(5rem+3px)] lg:h-[calc(7.5rem+3px)]"
  aria-hidden="true"
/>;
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @kcvv/web test PageHeader
```

Expected: all PASS.

**Step 5: Update PageHeader story description**

In `PageHeader.stories.tsx`, update the `component` description string to reflect the dark nav:

```tsx
description: {
  component:
    "Main site header with logo and navigation. Dark background (#1E2024), " +
    "white text, sticky below the 3px AccentStrip. Offset top-[3px].",
},
```

**Step 6: Commit**

```bash
git add apps/web/src/components/layout/PageHeader/
git commit -m "feat(ui): restyle PageHeader to dark nav (#1E2024), offset top-[3px] below AccentStrip"
```

---

## Task 7: Document conventions in `apps/web/CLAUDE.md`

**Files:**

- Modify: `apps/web/CLAUDE.md`

**Step 1: Add a Design Conventions section**

Find a suitable location (after the existing Design System & Storybook section) and add:

```markdown
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
```

**Step 2: Commit**

```bash
git add apps/web/CLAUDE.md
git commit -m "docs(migration): document section padding, border-radius, and colour conventions"
```

---

## Task 8: Final verification

**Step 1: Run full check**

```bash
pnpm --filter @kcvv/web check-all
```

Expected: lint clean, type-check passes, all tests green.

**Step 2: Build check**

```bash
pnpm turbo build --filter=@kcvv/web
```

Expected: build succeeds.

**Step 3: Push and update GitHub**

```bash
git push -u origin feat/redesign-design-tokens-809
```

Comment on issue #809:

```bash
gh issue comment 809 --body "Implementation complete on \`feat/redesign-design-tokens-809\`. All acceptance criteria met."
```

**Step 4: Close issue and open PR**

```bash
gh pr create \
  --title "feat(ui): design tokens — accent strip, kcvv-green-dark #008755, dark nav" \
  --body "Closes #809

## Changes
- \`kcvv-green-dark\` updated \`#4B9B48\` → \`#008755\` across \`:root\` and \`@theme\`
- \`AccentStrip\` component: fixed 3px green bar, \`Layout/AccentStrip\` Storybook story
- \`PageHeader\` restyled: dark (\`#1E2024\`) background, \`top-[3px]\` offset
- Section padding (\`py-20\`) and border-radius conventions documented in \`apps/web/CLAUDE.md\`
- \`Foundation/Colors\` MDX updated with \`#008755\` swatch

## Test plan
- [ ] AccentStrip renders above nav on all pages
- [ ] Nav is dark, strip is green
- [ ] All tests pass (\`pnpm --filter @kcvv/web test\`)
- [ ] Build passes (\`pnpm turbo build --filter=@kcvv/web\`)

🤖 Generated with [Claude Code](https://claude.com/claude-code)" \
  --base main
```
