# MatchWidget + SectionDivider Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the redesigned homepage match widget (dark-green full-width section with diagonal section cuts) and the reusable `SectionDivider` component that enables consistent angled dividers across the site.

**Architecture:** `SectionDivider` is a stateless design-system primitive that renders an absolutely-positioned clipped `<div>` — parent sections own the colours and placement. `MatchWidget` consumes `UpcomingMatch` directly (no new data fetching) and replaces `UpcomingMatches` on the homepage. Diagonal cuts are wired into `FeaturedArticles` (bottom) and `LatestNews` (top) in this same branch.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, Storybook 10 (`@storybook/nextjs-vite`), Vitest + React Testing Library, `next/image`

---

## Task 1: SectionDivider component

**Files:**

- Create: `apps/web/src/components/design-system/SectionDivider/SectionDivider.tsx`
- Create: `apps/web/src/components/design-system/SectionDivider/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts`

### Step 1: Write the failing test

Create `apps/web/src/components/design-system/SectionDivider/SectionDivider.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SectionDivider } from "./SectionDivider";

describe("SectionDivider", () => {
  it("renders a hidden div", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("positions at top-0 for position=top", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" />,
    );
    expect(container.firstChild).toHaveClass("top-0");
  });

  it("positions at bottom-0 for position=bottom", () => {
    const { container } = render(
      <SectionDivider color="white" position="bottom" />,
    );
    expect(container.firstChild).toHaveClass("bottom-0");
  });

  it("applies bg-white for color=white", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" />,
    );
    expect(container.firstChild).toHaveClass("bg-white");
  });

  it("applies bg-gray-100 for color=gray-100", () => {
    const { container } = render(
      <SectionDivider color="gray-100" position="top" />,
    );
    expect(container.firstChild).toHaveClass("bg-gray-100");
  });

  it("applies bg-kcvv-black for color=kcvv-black", () => {
    const { container } = render(
      <SectionDivider color="kcvv-black" position="top" />,
    );
    expect(container.firstChild).toHaveClass("bg-kcvv-black");
  });

  it("applies bg-kcvv-green-dark for color=kcvv-green-dark", () => {
    const { container } = render(
      <SectionDivider color="kcvv-green-dark" position="top" />,
    );
    expect(container.firstChild).toHaveClass("bg-kcvv-green-dark");
  });

  it("sets top clip-path for position=top", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.clipPath).toBe("polygon(0 0, 100% 0, 100% 0%, 0 100%)");
  });

  it("sets bottom clip-path for position=bottom", () => {
    const { container } = render(
      <SectionDivider color="white" position="bottom" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.clipPath).toBe(
      "polygon(0 100%, 100% 100%, 100% 0%, 0 100%)",
    );
  });

  it("accepts extra className", () => {
    const { container } = render(
      <SectionDivider color="white" position="top" className="z-20" />,
    );
    expect(container.firstChild).toHaveClass("z-20");
  });
});
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @kcvv/web test -- SectionDivider.test
```

Expected: FAIL — `SectionDivider` not found.

### Step 3: Implement SectionDivider

Create `apps/web/src/components/design-system/SectionDivider/SectionDivider.tsx`:

````tsx
import { cn } from "@/lib/utils/cn";

export type SectionDividerColor =
  | "white"
  | "gray-100"
  | "kcvv-black"
  | "kcvv-green-dark";

export type SectionDividerPosition = "top" | "bottom";

export interface SectionDividerProps {
  /**
   * Background colour of the adjacent section this divider reveals.
   * Must match the bg colour of the section above (position=top)
   * or below (position=bottom).
   */
  color: SectionDividerColor;
  /** Whether the cut sits at the top or bottom of its parent section */
  position: SectionDividerPosition;
  className?: string;
}

const colorClass: Record<SectionDividerColor, string> = {
  white: "bg-white",
  "gray-100": "bg-gray-100",
  "kcvv-black": "bg-kcvv-black",
  "kcvv-green-dark": "bg-kcvv-green-dark",
};

/**
 * Full-width diagonal section divider.
 *
 * Place inside a `relative overflow-hidden` parent section.
 * The divider renders an 80px-tall absolutely-positioned triangle
 * that visually "cuts" the section boundary at a consistent angle
 * (~3.6° at 1280px, ~12° on 375px mobile).
 *
 * @example
 * ```tsx
 * // At the bottom of FeaturedArticles (bg-kcvv-black) above MatchWidget (bg-kcvv-green-dark):
 * <SectionDivider color="kcvv-green-dark" position="bottom" />
 * ```
 */
export function SectionDivider({
  color,
  position,
  className,
}: SectionDividerProps) {
  const clipPath =
    position === "top"
      ? "polygon(0 0, 100% 0, 100% 0%, 0 100%)"
      : "polygon(0 100%, 100% 100%, 100% 0%, 0 100%)";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-x-0 h-20 z-10",
        position === "top" ? "top-0" : "bottom-0",
        colorClass[color],
        className,
      )}
      style={{ clipPath }}
    />
  );
}
````

Create `apps/web/src/components/design-system/SectionDivider/index.ts`:

```ts
export { SectionDivider } from "./SectionDivider";
export type {
  SectionDividerProps,
  SectionDividerColor,
  SectionDividerPosition,
} from "./SectionDivider";
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @kcvv/web test -- SectionDivider.test
```

Expected: All tests PASS.

### Step 5: Add to design-system barrel

In `apps/web/src/components/design-system/index.ts`, append after the last export:

```ts
// SectionDivider
export { SectionDivider } from "./SectionDivider";
export type {
  SectionDividerProps,
  SectionDividerColor,
  SectionDividerPosition,
} from "./SectionDivider";
```

### Step 6: Commit

```bash
git add apps/web/src/components/design-system/SectionDivider/ apps/web/src/components/design-system/index.ts
git commit -m "feat(ui): SectionDivider — diagonal section cut primitive"
```

---

## Task 2: SectionDivider Storybook story

**Files:**

- Create: `apps/web/src/components/design-system/SectionDivider/SectionDivider.stories.tsx`

### Step 1: Create the story file

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionDivider } from "./SectionDivider";

const meta = {
  title: "UI/SectionDivider",
  component: SectionDivider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full-width diagonal section divider. Place inside a `relative overflow-hidden` parent. The triangle colour must match the adjacent section's background to create the visual cut effect. Used at every dark/light section boundary in the redesign.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: "select",
      options: ["white", "gray-100", "kcvv-black", "kcvv-green-dark"],
    },
    position: { control: "radio", options: ["top", "bottom"] },
  },
} satisfies Meta<typeof SectionDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrap in a coloured box so the transparent triangle is visible
const Wrapper = ({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) => (
  <div className={`relative overflow-hidden h-32 w-full ${bg}`}>{children}</div>
);

export const TopWhite: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-black">
      <SectionDivider color="white" position="top" />
    </Wrapper>
  ),
};

export const TopGray100: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-green-dark">
      <SectionDivider color="gray-100" position="top" />
    </Wrapper>
  ),
};

export const TopKcvvBlack: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-green-dark">
      <SectionDivider color="kcvv-black" position="top" />
    </Wrapper>
  ),
};

export const TopKcvvGreenDark: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-black">
      <SectionDivider color="kcvv-green-dark" position="top" />
    </Wrapper>
  ),
};

export const BottomWhite: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-black">
      <SectionDivider color="white" position="bottom" />
    </Wrapper>
  ),
};

export const BottomGray100: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-green-dark">
      <SectionDivider color="gray-100" position="bottom" />
    </Wrapper>
  ),
};

export const BottomKcvvBlack: Story = {
  render: () => (
    <Wrapper bg="bg-white">
      <SectionDivider color="kcvv-black" position="bottom" />
    </Wrapper>
  ),
};

export const BottomKcvvGreenDark: Story = {
  render: () => (
    <Wrapper bg="bg-kcvv-black">
      <SectionDivider color="kcvv-green-dark" position="bottom" />
    </Wrapper>
  ),
};

export const PairExample: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "FeaturedArticles (black) → MatchWidget (green-dark) → LatestNews (gray-100) boundary pair.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col">
      {/* FeaturedArticles bottom */}
      <div className="relative overflow-hidden h-32 bg-kcvv-black">
        <SectionDivider color="kcvv-green-dark" position="bottom" />
      </div>
      {/* MatchWidget */}
      <div className="relative overflow-hidden h-48 bg-kcvv-green-dark">
        <SectionDivider color="kcvv-black" position="top" />
        <SectionDivider color="gray-100" position="bottom" />
      </div>
      {/* LatestNews */}
      <div className="relative overflow-hidden h-32 bg-gray-100">
        <SectionDivider color="kcvv-green-dark" position="top" />
      </div>
    </div>
  ),
};
```

### Step 2: Verify Storybook builds

```bash
pnpm --filter @kcvv/web storybook:build 2>&1 | tail -5
```

Expected: no errors.

### Step 3: Commit

```bash
git add apps/web/src/components/design-system/SectionDivider/SectionDivider.stories.tsx
git commit -m "feat(storybook): SectionDivider stories — UI/SectionDivider"
```

---

## Task 3: MatchWidget mocks

**Files:**

- Create: `apps/web/src/components/home/MatchWidget/MatchWidget.mocks.ts`

### Step 1: Create mocks file

```ts
import type { UpcomingMatch } from "@/components/match/types";

export const mockUpcomingMatch: UpcomingMatch = {
  id: 100,
  date: new Date("2026-03-22T14:00:00Z"),
  time: "15:00",
  homeTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  awayTeam: {
    id: 59,
    name: "KVC Wilrijk",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1",
  },
  status: "scheduled",
  round: "A",
  competition: "3e Afdeling VV",
  venue: "Thuis",
};

export const mockFinishedMatchWin: UpcomingMatch = {
  id: 101,
  date: new Date("2026-03-08T14:00:00Z"),
  time: "15:00",
  homeTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    score: 3,
  },
  awayTeam: {
    id: 448,
    name: "FC Wezel Sport",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/448.png?v=1",
    score: 1,
  },
  status: "finished",
  round: "A",
  competition: "3e Afdeling VV",
};

export const mockFinishedMatchDraw: UpcomingMatch = {
  id: 102,
  date: new Date("2026-03-01T14:00:00Z"),
  time: "15:00",
  homeTeam: {
    id: 628,
    name: "City Pirates",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/628.png?v=1",
    score: 2,
  },
  awayTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
    score: 2,
  },
  status: "finished",
  round: "A",
  competition: "3e Afdeling VV",
};

export const mockPostponedMatch: UpcomingMatch = {
  id: 103,
  date: new Date("2026-03-29T14:00:00Z"),
  homeTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  awayTeam: {
    id: 230,
    name: "KCS Machelen",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/230.png?v=1",
  },
  status: "postponed",
  round: "A",
  competition: "3e Afdeling VV",
};

export const mockForfeitedMatch: UpcomingMatch = {
  id: 104,
  date: new Date("2026-03-15T14:00:00Z"),
  homeTeam: {
    id: 59,
    name: "KVC Wilrijk",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1",
  },
  awayTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  status: "forfeited",
  round: "A",
  competition: "3e Afdeling VV",
};

export const mockLongTeamNames: UpcomingMatch = {
  id: 105,
  date: new Date("2026-04-05T13:00:00Z"),
  time: "14:00",
  homeTeam: {
    id: 1235,
    name: "KCVV Elewijt",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1",
  },
  awayTeam: {
    id: 756,
    name: "Verbroedering Hofstade-Zemst",
    logo: "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/756.png?v=1",
  },
  status: "scheduled",
  round: "A",
  competition: "3e Afdeling VV",
  venue: "Sportpark Elewijt",
};
```

### Step 2: Commit

```bash
git add apps/web/src/components/home/MatchWidget/MatchWidget.mocks.ts
git commit -m "feat(home): MatchWidget mocks"
```

---

## Task 4: MatchWidget component + tests (TDD)

**Files:**

- Create: `apps/web/src/components/home/MatchWidget/MatchWidget.tsx`
- Create: `apps/web/src/components/home/MatchWidget/MatchWidget.test.tsx`
- Create: `apps/web/src/components/home/MatchWidget/index.ts`

### Step 1: Write failing tests

Create `apps/web/src/components/home/MatchWidget/MatchWidget.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchWidget } from "./MatchWidget";
import {
  mockUpcomingMatch,
  mockFinishedMatchWin,
  mockFinishedMatchDraw,
  mockPostponedMatch,
  mockForfeitedMatch,
} from "./MatchWidget.mocks";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} {...props} />,
}));

describe("MatchWidget", () => {
  describe("Overline label", () => {
    it("renders default teamLabel", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText(/A-Ploeg/i)).toBeInTheDocument();
    });

    it("renders custom teamLabel", () => {
      render(<MatchWidget match={mockUpcomingMatch} teamLabel="B-Ploeg" />);
      expect(screen.getByText(/B-Ploeg/i)).toBeInTheDocument();
    });

    it("renders overline prefix text", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText(/VOLGENDE WEDSTRIJD/i)).toBeInTheDocument();
    });
  });

  describe("Team names", () => {
    it("renders home team name", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getAllByText(/KCVV Elewijt/i).length).toBeGreaterThan(0);
    });

    it("renders away team name", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText(/KVC Wilrijk/i)).toBeInTheDocument();
    });
  });

  describe("Scheduled match", () => {
    it("shows VS for scheduled match", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("shows match time", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText("15:00")).toBeInTheDocument();
    });

    it("shows competition name", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText(/3e Afdeling VV/i)).toBeInTheDocument();
    });
  });

  describe("Finished match", () => {
    it("shows score for finished match", () => {
      render(<MatchWidget match={mockFinishedMatchWin} />);
      expect(screen.getByText("3 – 1")).toBeInTheDocument();
    });

    it("shows draw score correctly", () => {
      render(<MatchWidget match={mockFinishedMatchDraw} />);
      expect(screen.getByText("2 – 2")).toBeInTheDocument();
    });

    it("does not show VS for finished match", () => {
      render(<MatchWidget match={mockFinishedMatchWin} />);
      expect(screen.queryByText("VS")).not.toBeInTheDocument();
    });
  });

  describe("Special states", () => {
    it("shows UITGESTELD badge for postponed match", () => {
      render(<MatchWidget match={mockPostponedMatch} />);
      expect(screen.getByText(/UITGESTELD/i)).toBeInTheDocument();
    });

    it("shows FF badge for forfeited match", () => {
      render(<MatchWidget match={mockForfeitedMatch} />);
      expect(screen.getByText("FF")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders as a section landmark", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });
});
```

### Step 2: Run tests to confirm they fail

```bash
pnpm --filter @kcvv/web test -- MatchWidget.test
```

Expected: FAIL — `MatchWidget` not found.

### Step 3: Implement MatchWidget

Create `apps/web/src/components/home/MatchWidget/MatchWidget.tsx`:

````tsx
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { SectionDivider } from "@/components/design-system";
import { formatMatchDate } from "@/lib/utils/dates";
import type { UpcomingMatch } from "@/components/match/types";

export interface MatchWidgetProps {
  /** The match to display — typically the first result from BffService.getNextMatches() */
  match: UpcomingMatch;
  /** Team label shown in the section overline (default: "A-Ploeg") */
  teamLabel?: string;
}

/**
 * Homepage match widget — hero-style dark-green section showing the
 * next (or most recent) match for the first team.
 *
 * Sits between FeaturedArticles (bg-kcvv-black) and LatestNews (bg-gray-100).
 * Diagonal cuts at top and bottom connect all three sections.
 *
 * Parent sections must set their own SectionDivider to complete the boundary:
 * - FeaturedArticles: `<SectionDivider color="kcvv-green-dark" position="bottom" />`
 * - LatestNews: `<SectionDivider color="kcvv-green-dark" position="top" />`
 *
 * @example
 * ```tsx
 * <MatchWidget match={upcomingMatches[0]} teamLabel="A-Ploeg" />
 * ```
 */
export function MatchWidget({
  match,
  teamLabel = "A-Ploeg",
}: MatchWidgetProps) {
  const isFinished =
    match.status === "finished" || match.status === "forfeited";
  const isPostponed =
    match.status === "postponed" || match.status === "stopped";
  const isForfeited = match.status === "forfeited";

  const hasScore =
    isFinished &&
    match.homeTeam.score !== undefined &&
    match.awayTeam.score !== undefined;

  return (
    <section
      aria-label={`Wedstrijd: ${match.homeTeam.name} vs ${match.awayTeam.name}`}
      className="relative overflow-hidden bg-kcvv-green-dark"
    >
      {/* Top diagonal — reveals kcvv-black from FeaturedArticles */}
      <SectionDivider color="kcvv-black" position="top" />

      {/* Bottom diagonal — reveals gray-100 from LatestNews */}
      <SectionDivider color="gray-100" position="bottom" />

      <div className="relative z-20 py-24 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Overline label */}
        <p className="flex items-center justify-center gap-2 mb-6 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
          <span aria-hidden="true" className="block w-5 h-px bg-white/30" />
          VOLGENDE WEDSTRIJD · {teamLabel}
          <span aria-hidden="true" className="block w-5 h-px bg-white/30" />
        </p>

        {/* 3-column grid: home | center | away */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 lg:gap-8">
          {/* Home team */}
          <TeamColumn team={match.homeTeam} align="home" />

          {/* Center: VS / score / meta */}
          <div className="flex flex-col items-center gap-1 lg:gap-2 min-w-[72px] lg:min-w-[140px]">
            {isPostponed && (
              <StatusBadge>
                {match.status === "stopped" ? "GESTOPT" : "UITGESTELD"}
              </StatusBadge>
            )}

            {isForfeited && !isPostponed && <StatusBadge>FF</StatusBadge>}

            {!isPostponed && !isForfeited && hasScore && (
              <span className="text-4xl lg:text-5xl font-black text-white font-mono leading-none tracking-tight">
                {match.homeTeam.score} – {match.awayTeam.score}
              </span>
            )}

            {!isPostponed && !isFinished && (
              <span className="text-4xl lg:text-5xl font-black text-kcvv-green leading-none tracking-tight">
                VS
              </span>
            )}

            {/* Date / time / competition — always shown unless postponed with no date */}
            {!isPostponed && (
              <div className="flex flex-col items-center gap-0.5 mt-1 lg:mt-2">
                <span className="text-[11px] sm:text-xs lg:text-sm font-semibold text-white/70">
                  {formatMatchDate(match.date)}
                </span>
                {match.time && (
                  <span className="text-[11px] sm:text-xs lg:text-sm font-semibold text-white/70">
                    {match.time}
                  </span>
                )}
                {match.competition && (
                  <span className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/40 px-2.5 py-0.5 rounded-sm">
                    {match.competition}
                    {match.venue ? ` · ${match.venue}` : ""}
                  </span>
                )}
              </div>
            )}

            {isPostponed && match.competition && (
              <span className="mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/40 px-2.5 py-0.5 rounded-sm">
                {match.competition}
              </span>
            )}
          </div>

          {/* Away team */}
          <TeamColumn team={match.awayTeam} align="away" />
        </div>
      </div>
    </section>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface TeamColumnProps {
  team: UpcomingMatch["homeTeam"];
  align: "home" | "away";
}

function TeamColumn({ team, align }: TeamColumnProps) {
  const isHome = align === "home";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 lg:gap-3",
        isHome ? "items-center lg:items-end" : "items-center lg:items-start",
      )}
    >
      <TeamLogo logo={team.logo} name={team.name} />
      <span
        className={cn(
          "text-[11px] sm:text-sm lg:text-2xl xl:text-3xl font-black uppercase tracking-tight text-white line-clamp-2 leading-tight",
          isHome ? "text-center lg:text-right" : "text-center lg:text-left",
        )}
      >
        {team.name}
      </span>
    </div>
  );
}

function TeamLogo({ logo, name }: { logo?: string; name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="relative w-12 h-12 lg:w-[72px] lg:h-[72px] flex items-center justify-center rounded bg-white/10 border-2 border-white/15 shrink-0 overflow-hidden">
      {logo ? (
        <Image
          src={logo}
          alt={`${name} logo`}
          fill
          className="object-contain p-1"
          sizes="(max-width: 1024px) 48px, 72px"
        />
      ) : (
        <span className="text-kcvv-green font-black text-lg lg:text-2xl">
          {initials}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 px-3 py-1 rounded-sm">
      {children}
    </span>
  );
}
````

Create `apps/web/src/components/home/MatchWidget/index.ts`:

```ts
export { MatchWidget } from "./MatchWidget";
export type { MatchWidgetProps } from "./MatchWidget";
```

### Step 4: Run tests to verify they pass

```bash
pnpm --filter @kcvv/web test -- MatchWidget.test
```

Expected: All tests PASS.

### Step 5: Commit

```bash
git add apps/web/src/components/home/MatchWidget/
git commit -m "feat(home): MatchWidget component with diagonal cuts"
```

---

## Task 5: MatchWidget Storybook story

**Files:**

- Create: `apps/web/src/components/home/MatchWidget/MatchWidget.stories.tsx`

### Step 1: Create story file

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchWidget } from "./MatchWidget";
import {
  mockUpcomingMatch,
  mockFinishedMatchWin,
  mockFinishedMatchDraw,
  mockPostponedMatch,
  mockForfeitedMatch,
  mockLongTeamNames,
} from "./MatchWidget.mocks";

const meta = {
  title: "Features/Home/MatchWidget",
  component: MatchWidget,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage match widget — dark-green full-width section showing the next or most recent A-team match. Diagonal cuts at top (kcvv-black) and bottom (gray-100) connect to adjacent sections. Replaces `UpcomingMatches` on the homepage.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MatchWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Upcoming: Story = {
  args: { match: mockUpcomingMatch, teamLabel: "A-Ploeg" },
};

export const Finished: Story = {
  args: { match: mockFinishedMatchWin, teamLabel: "A-Ploeg" },
  parameters: {
    docs: { description: { story: "Finished match with final score (win)." } },
  },
};

export const Draw: Story = {
  args: { match: mockFinishedMatchDraw, teamLabel: "A-Ploeg" },
  parameters: {
    docs: { description: { story: "Finished match with draw score." } },
  },
};

export const Postponed: Story = {
  args: { match: mockPostponedMatch, teamLabel: "A-Ploeg" },
  parameters: {
    docs: {
      description: {
        story: "Postponed match — shows UITGESTELD badge in centre column.",
      },
    },
  },
};

export const Forfeited: Story = {
  args: { match: mockForfeitedMatch, teamLabel: "A-Ploeg" },
  parameters: {
    docs: { description: { story: "Forfeited match — shows FF badge." } },
  },
};

export const LongTeamNames: Story = {
  args: { match: mockLongTeamNames, teamLabel: "A-Ploeg" },
  parameters: {
    docs: {
      description: {
        story:
          "Stress test: away team name is 30+ characters. Verifies line-clamp truncation.",
      },
    },
  },
};

export const CustomTeamLabel: Story = {
  args: { match: mockUpcomingMatch, teamLabel: "B-Ploeg" },
};
```

### Step 2: Verify Storybook builds

```bash
pnpm --filter @kcvv/web storybook:build 2>&1 | tail -5
```

Expected: no errors.

### Step 3: Commit

```bash
git add apps/web/src/components/home/MatchWidget/MatchWidget.stories.tsx
git commit -m "feat(storybook): MatchWidget stories — Features/Home/MatchWidget"
```

---

## Task 6: Export MatchWidget from home barrel

**Files:**

- Modify: `apps/web/src/components/home/index.ts`

### Step 1: Add export

Append to `apps/web/src/components/home/index.ts`:

```ts
export { MatchWidget } from "./MatchWidget";
export type { MatchWidgetProps } from "./MatchWidget";
```

### Step 2: Commit

```bash
git add apps/web/src/components/home/index.ts
git commit -m "chore: export MatchWidget from home barrel"
```

---

## Task 7: FeaturedArticles — add bottom diagonal cut

**Files:**

- Modify: `apps/web/src/components/home/FeaturedArticles/FeaturedArticles.tsx`

### Step 1: Add the import

At the top of `FeaturedArticles.tsx`, add:

```tsx
import { SectionDivider } from "@/components/design-system";
```

### Step 2: Add divider to JSX

The `<section>` element already has `relative overflow-hidden` ✅. At the very end of the `<section>`, immediately before the closing `</section>` tag, add:

```tsx
{
  /* Diagonal cut — transitions into MatchWidget (bg-kcvv-green-dark) below */
}
<SectionDivider color="kcvv-green-dark" position="bottom" />;
```

### Step 3: Verify existing FeaturedArticles tests still pass

```bash
pnpm --filter @kcvv/web test -- FeaturedArticles.test
```

Expected: All tests PASS (no layout assertions that would break).

### Step 4: Commit

```bash
git add apps/web/src/components/home/FeaturedArticles/FeaturedArticles.tsx
git commit -m "feat(ui): FeaturedArticles bottom diagonal cut into MatchWidget"
```

---

## Task 8: LatestNews — add top diagonal cut

**Files:**

- Modify: `apps/web/src/components/home/LatestNews/LatestNews.tsx`

### Step 1: Add the import

```tsx
import { SectionDivider } from "@/components/design-system";
```

### Step 2: Update section className

Change the section's `className` from:

```tsx
"frontpage__main_content page__section w-full py-12 lg:py-16";
```

to:

```tsx
"frontpage__main_content page__section w-full py-20 bg-gray-100 relative overflow-hidden";
```

**Why:** `py-20` aligns with the redesign rhythm; `bg-gray-100` is needed so the SectionDivider's green-dark colour is visible against it; `relative overflow-hidden` is required for the absolute-positioned divider.

### Step 3: Add divider + fix content z-index

Immediately after the opening `<section ...>` tag, add:

```tsx
{
  /* Diagonal cut — transitions from MatchWidget (bg-kcvv-green-dark) above */
}
<SectionDivider color="kcvv-green-dark" position="top" />;
```

Wrap the content `<div>` (the one with `max-w-inner-lg`) in:

```tsx
<div className="relative z-10">{/* existing content div */}</div>
```

This ensures the section header and article grid render above the divider (z-10 > divider's z-10 since it comes later in DOM — or bump content to z-20 to be explicit).

> **Note:** Change content wrapper to `z-20` to be unambiguous:
>
> ```tsx
> <div className="relative z-20 max-w-inner-lg mx-auto px-3 lg:px-0">
> ```

### Step 4: Verify existing LatestNews tests still pass

```bash
pnpm --filter @kcvv/web test -- LatestNews.test
```

Expected: All tests PASS.

### Step 5: Commit

```bash
git add apps/web/src/components/home/LatestNews/LatestNews.tsx
git commit -m "feat(ui): LatestNews top diagonal cut from MatchWidget"
```

---

## Task 9: Wire MatchWidget into homepage

**Files:**

- Modify: `apps/web/src/app/page.tsx`

### Step 1: Update imports

Replace:

```tsx
import {
  FeaturedArticles,
  LatestNews,
  UpcomingMatches,
} from "@/components/home";
```

With:

```tsx
import { FeaturedArticles, LatestNews, MatchWidget } from "@/components/home";
```

### Step 2: Replace UpcomingMatches with MatchWidget

Replace:

```tsx
{
  /* Upcoming Matches Slider - component handles empty array internally */
}
<UpcomingMatches
  matches={upcomingMatches}
  title="Volgende wedstrijden"
  showViewAll={true}
  viewAllHref="/matches"
/>;
```

With:

```tsx
{
  /* Match Widget — next A-team match, green section with diagonal cuts */
}
{
  upcomingMatches[0] && (
    <MatchWidget match={upcomingMatches[0]} teamLabel="A-Ploeg" />
  );
}
```

### Step 3: Commit

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(homepage): wire MatchWidget replacing UpcomingMatches"
```

---

## Task 10: Full quality check + GitHub

### Step 1: Run full check

```bash
pnpm --filter @kcvv/web check-all
```

Expected: lint ✅, type-check ✅, tests ✅.

If `check-all` isn't available:

```bash
pnpm --filter @kcvv/web lint:fix && pnpm --filter @kcvv/web type-check && pnpm --filter @kcvv/web test
```

### Step 2: Update GitHub issue #812

```bash
gh issue comment 812 --body "Implementation complete on \`feat/812-match-widget\`:

- \`SectionDivider\` component — \`UI/SectionDivider\` Storybook
- \`MatchWidget\` component — \`Features/Home/MatchWidget\` Storybook
- FeaturedArticles bottom diagonal cut wired
- LatestNews top diagonal cut wired
- Homepage wired with \`MatchWidget\`

All tests passing. Ready for review."
```

### Step 3: Push branch

```bash
git push -u origin feat/812-match-widget
```

### Step 4: Open PR

```bash
gh pr create \
  --title "feat(redesign): MatchWidget + SectionDivider (#812)" \
  --body "$(cat <<'EOF'
## Summary

- New `SectionDivider` design-system primitive — reusable diagonal cuts for all section boundaries
- New `MatchWidget` homepage component — dark-green hero-style next-match section with top/bottom diagonal cuts
- `FeaturedArticles` wired with bottom diagonal cut into `MatchWidget`
- `LatestNews` wired with top diagonal cut from `MatchWidget`
- Homepage replaces `UpcomingMatches` slider with focused `MatchWidget`

## Design decisions

- `SectionDivider` uses inline `style={{ clipPath }}` (not Tailwind arbitrary values) for dynamic polygon values
- `py-24` on `MatchWidget` content — intentional exception to `py-20` rule; required to clear the 80px diagonal
- `teamId` prop from issue spec replaced by `teamLabel?: string` — simpler, no ID lookup needed
- Diagonal direction is consistent site-wide (top-right → bottom-left) — sets the language for all future section boundaries

## Test plan

- [ ] Visual check in Storybook: `UI/SectionDivider > PairExample` — verify three-section stack looks correct
- [ ] Visual check in Storybook: `Features/Home/MatchWidget` — all 6 stories (upcoming, finished, draw, postponed, forfeited, long names)
- [ ] Mobile viewport (375px) in Storybook — verify 3-col grid fits without overflow
- [ ] Homepage in browser — verify diagonal cuts connect FeaturedArticles → MatchWidget → LatestNews
- [ ] `pnpm --filter @kcvv/web check-all` passes

Closes #812
Part of #807

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Quick reference — file list

| Action | Path                                                                              |
| ------ | --------------------------------------------------------------------------------- |
| Create | `apps/web/src/components/design-system/SectionDivider/SectionDivider.tsx`         |
| Create | `apps/web/src/components/design-system/SectionDivider/SectionDivider.test.tsx`    |
| Create | `apps/web/src/components/design-system/SectionDivider/SectionDivider.stories.tsx` |
| Create | `apps/web/src/components/design-system/SectionDivider/index.ts`                   |
| Modify | `apps/web/src/components/design-system/index.ts`                                  |
| Create | `apps/web/src/components/home/MatchWidget/MatchWidget.tsx`                        |
| Create | `apps/web/src/components/home/MatchWidget/MatchWidget.test.tsx`                   |
| Create | `apps/web/src/components/home/MatchWidget/MatchWidget.stories.tsx`                |
| Create | `apps/web/src/components/home/MatchWidget/MatchWidget.mocks.ts`                   |
| Create | `apps/web/src/components/home/MatchWidget/index.ts`                               |
| Modify | `apps/web/src/components/home/index.ts`                                           |
| Modify | `apps/web/src/components/home/FeaturedArticles/FeaturedArticles.tsx`              |
| Modify | `apps/web/src/components/home/LatestNews/LatestNews.tsx`                          |
| Modify | `apps/web/src/app/page.tsx`                                                       |
| Create | `docs/plans/2026-03-15-match-widget-812-design.md` ✅                             |
| Create | `docs/plans/2026-03-15-match-widget-812-plan.md` ✅                               |
