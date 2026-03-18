# SectionStack System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all `SectionDivider` usages with a flexible `SectionTransition` + `SectionStack` system where page-level composition controls transitions, sections are dumb content containers, and missing sections never break layout.

**Architecture:** Two new design-system primitives: `SectionTransition` (single in-flow diagonal band) and `SectionStack` (page composer that derives `from`/`to` colors automatically, filters absent sections, applies same-bg skip). All homepage sections lose their internal dividers and negative margins. `SectionDivider` is deleted.

**Tech Stack:** React, TypeScript strict, Tailwind CSS v4, Vitest + Testing Library, Storybook 10

**Design doc:** `docs/plans/2026-03-18-section-stack-design.md`

---

## Task 1: SectionTransition component + tests

**Files:**

- Create: `apps/web/src/components/design-system/SectionTransition/SectionTransition.tsx`
- Create: `apps/web/src/components/design-system/SectionTransition/index.ts`
- Create: `apps/web/src/components/design-system/SectionTransition/SectionTransition.test.tsx`

### Step 1: Write the failing tests

```typescript
// apps/web/src/components/design-system/SectionTransition/SectionTransition.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SectionTransition } from "./SectionTransition";

const BG_COLORS: Record<string, string> = {
  white: "rgb(255, 255, 255)",
  "gray-100": "rgb(243, 244, 246)",
  "kcvv-black": "rgb(30, 32, 36)",
  "kcvv-green-dark": "rgb(0, 135, 85)",
};

describe("SectionTransition", () => {
  describe("diagonal type", () => {
    it("renders wrapper with aria-hidden", () => {
      const { container } = render(
        <SectionTransition from="kcvv-black" to="gray-100" type="diagonal" direction="left" />,
      );
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("applies clamp height for diagonal", () => {
      const { container } = render(
        <SectionTransition from="kcvv-black" to="gray-100" type="diagonal" direction="left" />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.height).toBe("clamp(2rem, 6vw, 5rem)");
    });

    it("renders clip-path overlay for direction=left", () => {
      const { container } = render(
        <SectionTransition from="kcvv-black" to="gray-100" type="diagonal" direction="left" />,
      );
      const overlay = container.querySelector("[data-testid='st-overlay']") as HTMLElement;
      expect(overlay.style.clipPath).toBe("polygon(100% 0, 100% 100%, 0 100%)");
    });

    it("renders clip-path overlay for direction=right", () => {
      const { container } = render(
        <SectionTransition from="kcvv-black" to="gray-100" type="diagonal" direction="right" />,
      );
      const overlay = container.querySelector("[data-testid='st-overlay']") as HTMLElement;
      expect(overlay.style.clipPath).toBe("polygon(0 0, 0 100%, 100% 100%)");
    });

    it("applies no margin-top for overlap=none (default)", () => {
      const { container } = render(
        <SectionTransition from="kcvv-black" to="gray-100" type="diagonal" direction="left" overlap="none" />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.marginTop).toBe("");
    });

    it("applies negative margin-top for overlap=half (diagonal)", () => {
      const { container } = render(
        <SectionTransition from="kcvv-black" to="gray-100" type="diagonal" direction="left" overlap="half" />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.marginTop).toBe("calc(-1 * clamp(1rem, 3vw, 2.5rem))");
    });

    it("applies negative margin-top for overlap=full (diagonal)", () => {
      const { container } = render(
        <SectionTransition from="kcvv-black" to="gray-100" type="diagonal" direction="left" overlap="full" />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.marginTop).toBe("calc(-1 * clamp(2rem, 6vw, 5rem))");
    });

    it("applies z-index 10 for overlap=half", () => {
      const { container } = render(
        <SectionTransition from="kcvv-black" to="gray-100" type="diagonal" direction="left" overlap="half" />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.zIndex).toBe("10");
    });

    it("does not apply z-index for overlap=none", () => {
      const { container } = render(
        <SectionTransition from="kcvv-black" to="gray-100" type="diagonal" direction="left" />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.zIndex).toBe("");
    });
  });

  describe("double-diagonal type", () => {
    it("applies double height for double-diagonal", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.height).toBe("calc(2 * clamp(2rem, 6vw, 5rem))");
    });

    it("renders two sub-dividers for double-diagonal", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
        />,
      );
      const overlays = container.querySelectorAll("[data-testid='st-sub']");
      expect(overlays).toHaveLength(2);
    });

    it("second sub-divider has opposite direction from first", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
        />,
      );
      const overlays = container.querySelectorAll("[data-testid='st-sub-overlay']") as NodeListOf<HTMLElement>;
      // direction=right → first overlay polygon(0 0, 0 100%, 100% 100%)
      expect(overlays[0].style.clipPath).toBe("polygon(0 0, 0 100%, 100% 100%)");
      // opposite = left → polygon(100% 0, 100% 100%, 0 100%)
      expect(overlays[1].style.clipPath).toBe("polygon(100% 0, 100% 100%, 0 100%)");
    });

    it("applies negative margin for overlap=half on double-diagonal", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
          overlap="half"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.marginTop).toBe("calc(-1 * clamp(2rem, 6vw, 5rem))");
    });
  });
});
```

### Step 2: Run tests to verify they fail

```bash
pnpm --filter @kcvv/web test -- SectionTransition.test
```

Expected: FAIL — "Cannot find module './SectionTransition'"

### Step 3: Implement SectionTransition

```typescript
// apps/web/src/components/design-system/SectionTransition/SectionTransition.tsx
import { cn } from "@/lib/utils/cn";

export type SectionBg = "white" | "gray-100" | "kcvv-black" | "kcvv-green-dark";
export type TransitionOverlap = "none" | "half" | "full";
export type SectionTransitionConfig =
  | {
      type: "diagonal";
      direction: "left" | "right";
      overlap?: TransitionOverlap;
    }
  | {
      type: "double-diagonal";
      direction: "left" | "right";
      via: SectionBg;
      overlap?: TransitionOverlap;
    };

export interface SectionTransitionProps {
  from: SectionBg;
  to: SectionBg;
  type: "diagonal" | "double-diagonal";
  direction: "left" | "right";
  via?: SectionBg;
  overlap?: TransitionOverlap;
  className?: string;
}

const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  "gray-100": "bg-gray-100",
  "kcvv-black": "bg-kcvv-black",
  "kcvv-green-dark": "bg-kcvv-green-dark",
};

const CLIP_PATH: Record<"left" | "right", string> = {
  left: "polygon(100% 0, 100% 100%, 0 100%)",
  right: "polygon(0 0, 0 100%, 100% 100%)",
};

const DIAGONAL_HEIGHT = "clamp(2rem, 6vw, 5rem)";
const DIAGONAL_HALF = "clamp(1rem, 3vw, 2.5rem)";

function SingleDiagonal({
  from,
  to,
  direction,
  testId = "st-sub",
}: {
  from: SectionBg;
  to: SectionBg;
  direction: "left" | "right";
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn("relative w-full flex-1", BG_CLASS[from])}
    >
      <div
        data-testid={`${testId}-overlay`}
        className={cn("absolute inset-0", BG_CLASS[to])}
        style={{ clipPath: CLIP_PATH[direction] }}
      />
    </div>
  );
}

export function SectionTransition({
  from,
  to,
  type,
  direction,
  via,
  overlap = "none",
  className,
}: SectionTransitionProps) {
  const isDouble = type === "double-diagonal";
  const height = isDouble
    ? `calc(2 * ${DIAGONAL_HEIGHT})`
    : DIAGONAL_HEIGHT;

  let marginTop = "";
  let zIndex = "";

  if (overlap === "half") {
    marginTop = isDouble
      ? `calc(-1 * ${DIAGONAL_HEIGHT})`
      : `calc(-1 * ${DIAGONAL_HALF})`;
    zIndex = "10";
  } else if (overlap === "full") {
    marginTop = `calc(-1 * ${DIAGONAL_HEIGHT})`;
    zIndex = "10";
  }

  const style: React.CSSProperties = { height };
  if (marginTop) style.marginTop = marginTop;
  if (zIndex) style.zIndex = zIndex;

  if (isDouble) {
    const opposite: "left" | "right" = direction === "left" ? "right" : "left";
    const midColor = via ?? to;
    return (
      <div
        aria-hidden="true"
        className={cn("relative w-full flex flex-col", className)}
        style={style}
      >
        <SingleDiagonal from={from} to={midColor} direction={direction} testId="st-sub" />
        <SingleDiagonal from={midColor} to={to} direction={opposite} testId="st-sub" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("relative w-full", BG_CLASS[from], className)}
      style={style}
    >
      <div
        data-testid="st-overlay"
        className={cn("absolute inset-0", BG_CLASS[to])}
        style={{ clipPath: CLIP_PATH[direction] }}
      />
    </div>
  );
}
```

```typescript
// apps/web/src/components/design-system/SectionTransition/index.ts
export { SectionTransition } from "./SectionTransition";
export type {
  SectionTransitionProps,
  SectionBg,
  TransitionOverlap,
  SectionTransitionConfig,
} from "./SectionTransition";
```

### Step 4: Run tests to verify they pass

```bash
pnpm --filter @kcvv/web test -- SectionTransition.test
```

Expected: PASS — all tests green

### Step 5: Commit

```bash
git add apps/web/src/components/design-system/SectionTransition/
git commit -m "feat(ui): add SectionTransition design-system primitive"
```

---

## Task 2: SectionTransition Storybook stories

**Files:**

- Create: `apps/web/src/components/design-system/SectionTransition/SectionTransition.stories.tsx`

### Step 1: Write stories

```typescript
// apps/web/src/components/design-system/SectionTransition/SectionTransition.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { SectionTransition } from "./SectionTransition";

const meta = {
  title: "UI/SectionTransition",
  component: SectionTransition,
  tags: ["autodocs"],
  args: {
    from: "kcvv-black",
    to: "gray-100",
    type: "diagonal",
    direction: "left",
    overlap: "none",
  },
  argTypes: {
    from: {
      control: "select",
      options: ["white", "gray-100", "kcvv-black", "kcvv-green-dark"],
    },
    to: {
      control: "select",
      options: ["white", "gray-100", "kcvv-black", "kcvv-green-dark"],
    },
    type: { control: "select", options: ["diagonal", "double-diagonal"] },
    direction: { control: "select", options: ["left", "right"] },
    overlap: { control: "select", options: ["none", "half", "full"] },
    via: {
      control: "select",
      options: ["white", "gray-100", "kcvv-black", "kcvv-green-dark"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "100vw" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SingleDiagonalLeft: Story = {
  name: "Single — Left (↙)",
  args: { from: "kcvv-black", to: "gray-100", type: "diagonal", direction: "left" },
};

export const SingleDiagonalRight: Story = {
  name: "Single — Right (↘)",
  args: { from: "kcvv-black", to: "gray-100", type: "diagonal", direction: "right" },
};

export const DarkToLight: Story = {
  name: "kcvv-black → gray-100",
  args: { from: "kcvv-black", to: "gray-100", type: "diagonal", direction: "left" },
};

export const DarkToDarkGreen: Story = {
  name: "kcvv-black → kcvv-green-dark",
  args: { from: "kcvv-black", to: "kcvv-green-dark", type: "diagonal", direction: "right" },
};

export const GreenDarkToLight: Story = {
  name: "kcvv-green-dark → gray-100",
  args: { from: "kcvv-green-dark", to: "gray-100", type: "diagonal", direction: "left" },
};

export const GreenDarkToDark: Story = {
  name: "kcvv-green-dark → kcvv-black",
  args: { from: "kcvv-green-dark", to: "kcvv-black", type: "diagonal", direction: "right" },
};

export const LightToDark: Story = {
  name: "gray-100 → kcvv-black",
  args: { from: "gray-100", to: "kcvv-black", type: "diagonal", direction: "left" },
};

export const ViaWhiteToDark: Story = {
  name: "white → kcvv-black (via color for double-diagonal sandwich)",
  args: { from: "white", to: "kcvv-black", type: "diagonal", direction: "right" },
};

export const DoubleDiagonalRightViaWhite: Story = {
  name: "Double — Right, via white (hero usage)",
  args: {
    from: "kcvv-black",
    to: "kcvv-green-dark",
    type: "double-diagonal",
    direction: "right",
    via: "white",
  },
};

export const DoubleDiagonalLeftViaGray: Story = {
  name: "Double — Left, via gray-100",
  args: {
    from: "kcvv-black",
    to: "kcvv-black",
    type: "double-diagonal",
    direction: "left",
    via: "gray-100",
  },
};

export const OverlapNone: Story = {
  name: "Overlap — None (default)",
  decorators: [
    (Story) => (
      <div>
        <div className="w-full h-32 bg-kcvv-black" />
        <Story />
        <div className="w-full h-32 bg-gray-100" />
      </div>
    ),
  ],
  args: { from: "kcvv-black", to: "gray-100", type: "diagonal", direction: "left", overlap: "none" },
};

export const OverlapHalf: Story = {
  name: "Overlap — Half (bites into FROM section)",
  decorators: [
    (Story) => (
      <div className="relative">
        <div className="w-full h-32 bg-kcvv-black relative z-0" />
        <Story />
        <div className="w-full h-32 bg-gray-100" />
      </div>
    ),
  ],
  args: { from: "kcvv-black", to: "gray-100", type: "diagonal", direction: "left", overlap: "half" },
};

export const OverlapFull: Story = {
  name: "Overlap — Full (entirely inside FROM section)",
  decorators: [
    (Story) => (
      <div className="relative">
        <div className="w-full h-32 bg-kcvv-black relative z-0" />
        <Story />
        <div className="w-full h-32 bg-gray-100" />
      </div>
    ),
  ],
  args: { from: "kcvv-black", to: "gray-100", type: "diagonal", direction: "left", overlap: "full" },
};
```

### Step 2: Verify stories render in Storybook

```bash
pnpm --filter @kcvv/web storybook
```

Navigate to `UI/SectionTransition` — verify all stories render without console errors.

### Step 3: Commit

```bash
git add apps/web/src/components/design-system/SectionTransition/SectionTransition.stories.tsx
git commit -m "feat(ui): add SectionTransition Storybook stories"
```

---

## Task 3: SectionStack component + tests

**Files:**

- Create: `apps/web/src/components/design-system/SectionStack/SectionStack.tsx`
- Create: `apps/web/src/components/design-system/SectionStack/index.ts`
- Create: `apps/web/src/components/design-system/SectionStack/SectionStack.test.tsx`

### Step 1: Write the failing tests

```typescript
// apps/web/src/components/design-system/SectionStack/SectionStack.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionStack } from "./SectionStack";
import type { SectionConfig } from "./SectionStack";

const makeSection = (bg: SectionConfig["bg"], label: string, transition?: SectionConfig["transition"]): SectionConfig => ({
  bg,
  content: <div data-testid={`section-${label}`}>{label}</div>,
  key: label,
  transition,
});

describe("SectionStack", () => {
  it("filters null entries", () => {
    const { container } = render(
      <SectionStack
        sections={[makeSection("gray-100", "A"), null, makeSection("kcvv-black", "B")]}
      />,
    );
    expect(screen.getByTestId("section-A")).toBeInTheDocument();
    expect(screen.getByTestId("section-B")).toBeInTheDocument();
  });

  it("filters false entries", () => {
    render(
      <SectionStack
        sections={[makeSection("gray-100", "A"), false, makeSection("kcvv-black", "B")]}
      />,
    );
    expect(screen.getByTestId("section-A")).toBeInTheDocument();
    expect(screen.getByTestId("section-B")).toBeInTheDocument();
  });

  it("filters undefined entries", () => {
    render(
      <SectionStack
        sections={[makeSection("gray-100", "A"), undefined, makeSection("kcvv-black", "B")]}
      />,
    );
    expect(screen.getByTestId("section-A")).toBeInTheDocument();
    expect(screen.getByTestId("section-B")).toBeInTheDocument();
  });

  it("renders correct number of sections after filtering", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("gray-100", "A"),
          null,
          false,
          makeSection("kcvv-black", "B"),
          makeSection("kcvv-green-dark", "C"),
        ]}
      />,
    );
    expect(screen.getByTestId("section-A")).toBeInTheDocument();
    expect(screen.getByTestId("section-B")).toBeInTheDocument();
    expect(screen.getByTestId("section-C")).toBeInTheDocument();
  });

  it("renders SectionTransition between sections with differing bg", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("kcvv-black", "A", { type: "diagonal", direction: "left" }),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    // SectionTransition renders aria-hidden div
    const transitions = container.querySelectorAll("[aria-hidden='true']");
    expect(transitions.length).toBeGreaterThan(0);
  });

  it("skips SectionTransition when adjacent bg values are equal", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("gray-100", "A", { type: "diagonal", direction: "left" }),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    const transitions = container.querySelectorAll("[aria-hidden='true']");
    expect(transitions).toHaveLength(0);
  });

  it("adapts transition when middle section is absent", () => {
    // A (black) → [null] → B (gray-100)
    // transition is configured on A; null is filtered; A fires transition into B
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("kcvv-black", "A", { type: "diagonal", direction: "left" }),
          null,
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    const transitions = container.querySelectorAll("[aria-hidden='true']");
    expect(transitions.length).toBeGreaterThan(0);
  });

  it("applies default pt-20 pb-20 to section wrappers", () => {
    const { container } = render(
      <SectionStack sections={[makeSection("gray-100", "A")]} />,
    );
    const wrapper = container.querySelector(".pt-20");
    expect(wrapper).not.toBeNull();
    const pbWrapper = container.querySelector(".pb-20");
    expect(pbWrapper).not.toBeNull();
  });

  it("applies custom paddingTop and paddingBottom when specified", () => {
    const { container } = render(
      <SectionStack
        sections={[{ ...makeSection("gray-100", "A"), paddingTop: "pt-0", paddingBottom: "pb-10" }]}
      />,
    );
    expect(container.querySelector(".pt-0")).not.toBeNull();
    expect(container.querySelector(".pb-10")).not.toBeNull();
    expect(container.querySelector(".pt-20")).toBeNull();
  });

  it("applies bg class to section wrapper", () => {
    const { container } = render(
      <SectionStack sections={[makeSection("kcvv-black", "A")]} />,
    );
    expect(container.querySelector(".bg-kcvv-black")).not.toBeNull();
  });

  it("applies position relative z-0 to FROM section when its transition has overlap", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("kcvv-black", "A", {
            type: "diagonal",
            direction: "left",
            overlap: "half",
          }),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    // The FROM section wrapper should have relative + z-0
    const fromWrapper = container.querySelector(".z-0");
    expect(fromWrapper).not.toBeNull();
  });
});
```

### Step 2: Run tests to verify they fail

```bash
pnpm --filter @kcvv/web test -- SectionStack.test
```

Expected: FAIL — "Cannot find module './SectionStack'"

### Step 3: Implement SectionStack

```typescript
// apps/web/src/components/design-system/SectionStack/SectionStack.tsx
import { cn } from "@/lib/utils/cn";
import {
  SectionTransition,
} from "@/components/design-system/SectionTransition/SectionTransition";
import type {
  SectionBg,
  SectionTransitionConfig,
} from "@/components/design-system/SectionTransition/SectionTransition";

export type { SectionBg, SectionTransitionConfig };

export interface SectionConfig {
  bg: SectionBg;
  content: React.ReactNode;
  paddingTop?: string;
  paddingBottom?: string;
  transition?: SectionTransitionConfig;
  key?: string;
}

export interface SectionStackProps {
  sections: (SectionConfig | null | false | undefined)[];
  className?: string;
}

const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  "gray-100": "bg-gray-100",
  "kcvv-black": "bg-kcvv-black",
  "kcvv-green-dark": "bg-kcvv-green-dark",
};

export function SectionStack({ sections, className }: SectionStackProps) {
  const filtered = sections.filter(Boolean) as SectionConfig[];

  return (
    <div className={cn("w-full", className)}>
      {filtered.map((section, i) => {
        const next = filtered[i + 1];
        const hasOverlap =
          section.transition && section.transition.overlap && section.transition.overlap !== "none";
        const showTransition =
          next !== undefined &&
          section.transition !== undefined &&
          section.bg !== next.bg;

        return (
          <div key={section.key ?? i}>
            {/* Section content wrapper */}
            <div
              className={cn(
                "w-full",
                BG_CLASS[section.bg],
                section.paddingTop ?? "pt-20",
                section.paddingBottom ?? "pb-20",
                hasOverlap && "relative z-0",
              )}
            >
              {section.content}
            </div>

            {/* Transition between this section and the next */}
            {showTransition && (
              <SectionTransition
                from={section.bg}
                to={next.bg}
                type={section.transition!.type}
                direction={section.transition!.direction}
                via={"via" in section.transition! ? section.transition!.via : undefined}
                overlap={section.transition!.overlap}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

```typescript
// apps/web/src/components/design-system/SectionStack/index.ts
export { SectionStack } from "./SectionStack";
export type { SectionStackProps, SectionConfig } from "./SectionStack";
export type { SectionBg, SectionTransitionConfig } from "./SectionStack";
```

### Step 4: Run tests to verify they pass

```bash
pnpm --filter @kcvv/web test -- SectionStack.test
```

Expected: PASS — all tests green

### Step 5: Commit

```bash
git add apps/web/src/components/design-system/SectionStack/
git commit -m "feat(ui): add SectionStack page-level composer"
```

---

## Task 4: SectionStack Storybook stories

**Files:**

- Create: `apps/web/src/components/design-system/SectionStack/SectionStack.stories.tsx`

### Step 1: Write stories

```typescript
// apps/web/src/components/design-system/SectionStack/SectionStack.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { SectionStack } from "./SectionStack";
import type { SectionConfig } from "./SectionStack";

const meta = {
  title: "UI/SectionStack",
  component: SectionStack,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SectionStack>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Mock section content helpers ────────────────────────────────────────────

function MockSection({ label, height = "h-32" }: { label: string; height?: string }) {
  return (
    <div className={`max-w-7xl mx-auto px-4 md:px-8 flex items-center ${height}`}>
      <span className="text-sm font-bold uppercase tracking-widest opacity-50">{label}</span>
    </div>
  );
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    sections: [
      {
        bg: "kcvv-black",
        content: <MockSection label="Hero (kcvv-black)" height="h-48" />,
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        transition: { type: "double-diagonal", direction: "right", via: "white", overlap: "half" },
      },
      {
        bg: "kcvv-green-dark",
        content: <MockSection label="Match Widget (kcvv-green-dark)" />,
        paddingTop: "pt-12",
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "gray-100",
        content: <MockSection label="Latest News (gray-100)" />,
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "kcvv-black",
        content: <MockSection label="Matches Slider (kcvv-black)" />,
        paddingTop: "pt-10",
        transition: { type: "diagonal", direction: "right" },
      },
      {
        bg: "kcvv-green-dark",
        content: <MockSection label="Youth (kcvv-green-dark)" />,
        paddingTop: "pt-10",
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "gray-100",
        content: <MockSection label="Sponsors (gray-100)" />,
      },
    ],
  },
};

// ─── Homepage full stack ──────────────────────────────────────────────────────

const heroSection: SectionConfig = {
  bg: "kcvv-black",
  content: <MockSection label="FeaturedArticles — Hero (kcvv-black)" height="h-48" />,
  paddingTop: "pt-0",
  paddingBottom: "pb-0",
  transition: { type: "double-diagonal", direction: "right", via: "white", overlap: "half" },
};
const matchWidgetSection: SectionConfig = {
  bg: "kcvv-green-dark",
  content: <MockSection label="MatchWidget (kcvv-green-dark)" />,
  paddingTop: "pt-12",
  transition: { type: "diagonal", direction: "left" },
};
const latestNewsSection: SectionConfig = {
  bg: "gray-100",
  content: <MockSection label="LatestNews (gray-100)" />,
  transition: { type: "diagonal", direction: "left" },
};
const bannerSlotBSection: SectionConfig = {
  bg: "gray-100",
  content: <MockSection label="BannerSlot B (gray-100)" />,
  transition: { type: "diagonal", direction: "left" },
};
const matchesSliderSection: SectionConfig = {
  bg: "kcvv-black",
  content: <MockSection label="MatchesSlider (kcvv-black)" />,
  paddingTop: "pt-10",
  transition: { type: "diagonal", direction: "right" },
};
const youthSection: SectionConfig = {
  bg: "kcvv-green-dark",
  content: <MockSection label="YouthSection (kcvv-green-dark)" />,
  paddingTop: "pt-10",
  transition: { type: "diagonal", direction: "left" },
};
const sponsorsSection: SectionConfig = {
  bg: "gray-100",
  content: <MockSection label="SponsorsSection (gray-100)" />,
};

export const HomepageFullStack: Story = {
  name: "Homepage — All sections present",
  args: {
    sections: [
      heroSection,
      matchWidgetSection,
      latestNewsSection,
      bannerSlotBSection,
      matchesSliderSection,
      youthSection,
      sponsorsSection,
    ],
  },
};

export const MissingMatchWidget: Story = {
  name: "Resilience — MatchWidget absent",
  args: {
    sections: [
      heroSection,
      null, // MatchWidget missing
      latestNewsSection,
      bannerSlotBSection,
      matchesSliderSection,
      youthSection,
      sponsorsSection,
    ],
  },
};

export const MissingMatchesSlider: Story = {
  name: "Resilience — MatchesSlider absent",
  args: {
    sections: [
      heroSection,
      matchWidgetSection,
      latestNewsSection,
      bannerSlotBSection,
      null, // MatchesSlider missing
      youthSection,
      sponsorsSection,
    ],
  },
};

export const MissingBannerSlotB: Story = {
  name: "Resilience — BannerSlot B absent",
  args: {
    sections: [
      heroSection,
      matchWidgetSection,
      latestNewsSection,
      null, // BannerSlot B missing — LatestNews transitions directly to MatchesSlider
      matchesSliderSection,
      youthSection,
      sponsorsSection,
    ],
  },
};

export const BannerSlotBPresent: Story = {
  name: "Resilience — BannerSlot B present (same-bg skip fires)",
  args: {
    sections: [
      heroSection,
      matchWidgetSection,
      latestNewsSection,
      bannerSlotBSection, // same-bg gray-100: skip fires between LatestNews and BannerSlot B
      matchesSliderSection,
      youthSection,
      sponsorsSection,
    ],
  },
};

export const AllDataAbsent: Story = {
  name: "Resilience — Only sponsors remain",
  args: {
    sections: [
      null, // no hero
      null, // no match widget
      null, // no news
      null, // no banner
      null, // no slider
      null, // no youth
      sponsorsSection,
    ],
  },
};

export const StraightEdges: Story = {
  name: "Straight edges (no transition configs)",
  args: {
    sections: [
      { bg: "kcvv-black", content: <MockSection label="Section 1 (kcvv-black)" /> },
      { bg: "gray-100", content: <MockSection label="Section 2 (gray-100)" /> },
      { bg: "kcvv-green-dark", content: <MockSection label="Section 3 (kcvv-green-dark)" /> },
    ],
  },
};

export const AlternatingDirections: Story = {
  name: "Alternating left/right diagonal directions",
  args: {
    sections: [
      {
        bg: "kcvv-black",
        content: <MockSection label="A (kcvv-black)" />,
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "gray-100",
        content: <MockSection label="B (gray-100)" />,
        transition: { type: "diagonal", direction: "right" },
      },
      {
        bg: "kcvv-green-dark",
        content: <MockSection label="C (kcvv-green-dark)" />,
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "gray-100",
        content: <MockSection label="D (gray-100)" />,
      },
    ],
  },
};
```

### Step 2: Verify stories render

```bash
pnpm --filter @kcvv/web storybook
```

Navigate to `UI/SectionStack` — verify all resilience stories render without transitions between same-bg sections.

### Step 3: Commit

```bash
git add apps/web/src/components/design-system/SectionStack/SectionStack.stories.tsx
git commit -m "feat(ui): add SectionStack Storybook stories with resilience scenarios"
```

---

## Task 5: Update design-system barrel exports

**Files:**

- Modify: `apps/web/src/components/design-system/index.ts`

### Step 1: Add SectionTransition + SectionStack exports

Edit `apps/web/src/components/design-system/index.ts`:

Remove the SectionDivider block (lines 66–72):

```typescript
// SectionDivider
export { SectionDivider } from "./SectionDivider";
export type {
  SectionDividerProps,
  SectionDividerColor,
  SectionDividerPosition,
} from "./SectionDivider";
```

Add SectionTransition and SectionStack exports after the Alert block:

```typescript
// SectionTransition
export { SectionTransition } from "./SectionTransition";
export type {
  SectionTransitionProps,
  SectionBg,
  TransitionOverlap,
  SectionTransitionConfig,
} from "./SectionTransition";

// SectionStack
export { SectionStack } from "./SectionStack";
export type { SectionStackProps, SectionConfig } from "./SectionStack";
```

### Step 2: Run type-check

```bash
pnpm --filter @kcvv/web type-check
```

Expected: errors — SectionDivider still imported in section components. These will be fixed in Tasks 6–10.

### Step 3: Commit

```bash
git add apps/web/src/components/design-system/index.ts
git commit -m "feat(ui): expose SectionTransition and SectionStack from design-system barrel"
```

---

## Task 6: Migrate FeaturedArticles

**Files:**

- Modify: `apps/web/src/components/home/FeaturedArticles/FeaturedArticles.tsx`

The only change: remove line 363 `<SectionDivider color="white" position="bottom" flip />` and its import if no longer used.

### Step 1: Remove SectionDivider from FeaturedArticles

In `FeaturedArticles.tsx`:

1. Remove the import line: `import { SectionDivider } from "@/components/design-system";`
   (check if `SectionDivider` is the only import from design-system — if not, just remove `SectionDivider` from the destructure)

2. Remove line 363:
   ```typescript
   {/* Bottom diagonal — white cut in lower-left, matching MatchWidget's white top cut */}
   <SectionDivider color="white" position="bottom" flip />
   ```

The navigation dot positioning at `bottom-[calc(clamp(2rem,6vw,5rem)+0.75rem)]` can be left as-is — it references the old divider height for dot placement. After SectionStack migration, if the dots need repositioning, update in a follow-up. For now, remove the divider and keep the dot class unchanged.

### Step 2: Run type-check

```bash
pnpm --filter @kcvv/web type-check
```

Expected: no new errors from this file.

### Step 3: Commit

```bash
git add apps/web/src/components/home/FeaturedArticles/FeaturedArticles.tsx
git commit -m "feat(ui): remove SectionDivider from FeaturedArticles"
```

---

## Task 7: Migrate MatchWidget

**Files:**

- Modify: `apps/web/src/components/home/MatchWidget/MatchWidget.tsx`

Changes:

- Remove `import { SectionDivider } from "@/components/design-system";` (line 3)
- Remove `<SectionDivider color="white" position="top" />` (line 48)
- Remove `<SectionDivider color="gray-100" position="bottom" />` (line 51)
- Change `py-20` → `pb-20` on the content div (line 53): `className="relative z-20 py-20 px-4 ...` → `className="relative z-20 pb-20 px-4 ...`

### Step 1: Apply changes

Make the four changes listed above.

### Step 2: Run type-check

```bash
pnpm --filter @kcvv/web type-check
```

### Step 3: Commit

```bash
git add apps/web/src/components/home/MatchWidget/MatchWidget.tsx
git commit -m "feat(ui): remove SectionDivider and negative margin from MatchWidget"
```

---

## Task 8: Migrate MatchesSliderSection

**Files:**

- Modify: `apps/web/src/components/home/MatchesSliderSection/MatchesSliderSection.tsx`

Changes:

- Remove `SectionHeader` from the `SectionDivider` import (or remove the whole SectionDivider import separately — `SectionDivider` and `SectionHeader` come from the same barrel)
- Remove `SectionDivider` from the destructured import on line 2: `import { MatchesSlider } from ...` / `import { SectionDivider, SectionHeader } from "@/components/design-system"` → `import { SectionHeader } from "@/components/design-system"`
- Remove `<SectionDivider color="gray-100" position="top" />` (line 28)
- Remove `-mt-px` from section className (line 22): `"relative bg-kcvv-black overflow-hidden py-20 -mt-px"` → `"relative bg-kcvv-black overflow-hidden pb-20"`
  - Note: `py-20` includes `pt-20` — SectionStack will provide top padding, so change to `pb-20` only

### Step 1: Apply changes

Make the three changes listed above.

### Step 2: Run type-check

```bash
pnpm --filter @kcvv/web type-check
```

### Step 3: Commit

```bash
git add apps/web/src/components/home/MatchesSliderSection/MatchesSliderSection.tsx
git commit -m "feat(ui): remove SectionDivider and negative margin from MatchesSliderSection"
```

---

## Task 9: Migrate YouthSection

**Files:**

- Modify: `apps/web/src/components/home/YouthSection/YouthSection.tsx`

Changes:

- Remove `import { SectionDivider } from "@/components/design-system"` (line 3)
- Remove `<SectionDivider color="kcvv-black" position="top" />` (line 36)
- Remove `<SectionDivider color="gray-100" position="bottom" flip />` (line 38)
- Remove `-mt-0.5` from section className (line 14): `"relative bg-kcvv-green-dark overflow-hidden py-20 text-center -mt-0.5"` → `"relative bg-kcvv-green-dark overflow-hidden pb-20 text-center"`
  - Change `py-20` to `pb-20` — SectionStack provides top padding

### Step 1: Apply changes

### Step 2: Run type-check

```bash
pnpm --filter @kcvv/web type-check
```

### Step 3: Commit

```bash
git add apps/web/src/components/home/YouthSection/YouthSection.tsx
git commit -m "feat(ui): remove SectionDivider and negative margin from YouthSection"
```

---

## Task 10: Migrate SponsorsSection

**Files:**

- Modify: `apps/web/src/components/home/SponsorsSection/SponsorsSection.tsx`

Changes:

- Remove `-mt-0.5` from section className (line 11): `"bg-gray-100 py-20 -mt-0.5"` → `"bg-gray-100 pb-20"`
  - Change `py-20` to `pb-20` — SectionStack provides top padding

### Step 1: Apply change

### Step 2: Run type-check

```bash
pnpm --filter @kcvv/web type-check
```

### Step 3: Commit

```bash
git add apps/web/src/components/home/SponsorsSection/SponsorsSection.tsx
git commit -m "feat(ui): remove negative margin from SponsorsSection"
```

---

## Task 11: Delete SectionDivider

**Files:**

- Delete: `apps/web/src/components/design-system/SectionDivider/` (entire directory)

### Step 1: Verify no remaining SectionDivider imports

```bash
grep -r "SectionDivider" apps/web/src/
```

Expected: zero results (all removed in Tasks 5–10).

If any results remain, fix them before proceeding.

### Step 2: Delete the directory

```bash
rm -rf apps/web/src/components/design-system/SectionDivider/
```

### Step 3: Run type-check and tests

```bash
pnpm --filter @kcvv/web type-check
pnpm --filter @kcvv/web test
```

Expected: all pass (no SectionDivider references remain).

### Step 4: Commit

```bash
git add -A
git commit -m "feat(ui): delete SectionDivider component"
```

---

## Task 12: Update page.tsx to use SectionStack

**Files:**

- Modify: `apps/web/src/app/page.tsx`

### Step 1: Add imports

Add to imports:

```typescript
import { SectionStack } from "@/components/design-system";
import type { SectionConfig } from "@/components/design-system";
```

### Step 2: Replace the JSX return with SectionStack composition

Replace the `return (` block starting at line 180 (the `<>` block) with:

```tsx
const sections: (SectionConfig | false | null)[] = [
  featuredArticles.length > 0 && {
    bg: "kcvv-black" as const,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
    content: (
      <FeaturedArticles
        articles={featuredArticles}
        autoRotate={true}
        autoRotateInterval={5000}
      />
    ),
    transition: {
      type: "double-diagonal" as const,
      direction: "right" as const,
      via: "white" as const,
      overlap: "half" as const,
    },
    key: "hero",
  },

  nextMatch != null && {
    bg: "kcvv-green-dark" as const,
    paddingTop: "pt-12",
    content: <MatchWidget match={nextMatch} teamLabel="A-Ploeg" />,
    transition: { type: "diagonal" as const, direction: "left" as const },
    key: "match-widget",
  },

  banners.bannerSlotA != null && {
    bg: "gray-100" as const,
    content: (
      <BannerSlot
        image={banners.bannerSlotA.imageUrl}
        alt={banners.bannerSlotA.alt}
        href={banners.bannerSlotA.href ?? undefined}
      />
    ),
    key: "banner-a",
    // no transition — LatestNews also gray-100, same-bg skip will fire
  },

  (latestNewsArticles.length > 0 || featuredEvent != null) && {
    bg: "gray-100" as const,
    content: (
      <LatestNews
        articles={latestNewsArticles}
        featuredEvent={featuredEvent}
        title="Laatste nieuws"
        showViewAll
        viewAllHref="/news"
      />
    ),
    transition: { type: "diagonal" as const, direction: "left" as const },
    key: "latest-news",
  },

  banners.bannerSlotB != null && {
    bg: "gray-100" as const,
    content: (
      <BannerSlot
        image={banners.bannerSlotB.imageUrl}
        alt={banners.bannerSlotB.alt}
        href={banners.bannerSlotB.href ?? undefined}
      />
    ),
    transition: { type: "diagonal" as const, direction: "left" as const },
    key: "banner-b",
  },

  sliderMatches.length > 0 && {
    bg: "kcvv-black" as const,
    paddingTop: "pt-10",
    content: (
      <MatchesSliderSection matches={sliderMatches} highlightTeamId={1235} />
    ),
    transition: { type: "diagonal" as const, direction: "right" as const },
    key: "matches-slider",
  },

  {
    bg: "kcvv-green-dark" as const,
    paddingTop: "pt-10",
    content: <YouthSection />,
    transition: { type: "diagonal" as const, direction: "left" as const },
    key: "youth",
  },

  banners.bannerSlotC != null && {
    bg: "gray-100" as const,
    content: (
      <BannerSlot
        image={banners.bannerSlotC.imageUrl}
        alt={banners.bannerSlotC.alt}
        href={banners.bannerSlotC.href ?? undefined}
      />
    ),
    key: "banner-c",
    // no transition — SponsorsSection also gray-100
  },

  {
    bg: "gray-100" as const,
    content: <SponsorsSection />,
    key: "sponsors",
  },
];

return <SectionStack sections={sections} />;
```

Also remove the empty-state guard block (lines 167–178 — the `if (articles.length === 0 && matches.length === 0)` block) or leave it in place — it is harmless. Leaving it in is fine.

### Step 3: Run type-check

```bash
pnpm --filter @kcvv/web type-check
```

Expected: clean.

### Step 4: Commit

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(ui): migrate homepage to SectionStack composition"
```

---

## Task 13: Final verification

### Step 1: Run full check

```bash
pnpm --filter @kcvv/web check-all
```

Expected: lint passes, type-check passes, tests pass.

### Step 2: Verify no SectionDivider references remain

```bash
grep -r "SectionDivider" apps/web/src/
```

Expected: zero results.

### Step 3: Commit if any lint-fix changes were made

```bash
git add -A
git commit -m "fix(ui): address lint findings from check-all"
```

Only commit if there are actual changes. Skip if check-all was already clean.

---

**Plan complete and saved to `docs/plans/2026-03-18-section-stack-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** — Fresh subagent per task, review between tasks, fast iteration.

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints.

**Which approach?**
