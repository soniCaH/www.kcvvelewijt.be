/**
 * HorizontalSlider Component Stories
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Generic horizontal scroll container with
 * paper-card prev/next arrows (`<ScrollArrowButton register="paper">` —
 * the card slider's sole register, #2444 as amended by #2489). Demonstrated
 * with generic sample cards — no production surface composes matches into a
 * horizontal slider (the homepage and `/kalender` both render vertical
 * match rows), so the former match-card showcase was removed.
 *
 * `title`/`theme` were deleted (#2444 resolution) — neither had a consumer.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, expect, waitFor } from "storybook/test";
import { HorizontalSlider } from "./HorizontalSlider";

// ---------------------------------------------------------------------------
// Generic sample cards — retro paper-card vocabulary
// ---------------------------------------------------------------------------

const SampleCard = ({ label }: { label: string }) => (
  <div className="border-ink bg-cream font-display text-ink flex h-32 w-64 shrink-0 items-center justify-center border-2 text-2xl italic shadow-[var(--shadow-paper-sm)]">
    {label}
  </div>
);

const fewItems = (
  <>
    <SampleCard label="Card 1" />
    <SampleCard label="Card 2" />
    <SampleCard label="Card 3" />
  </>
);

const manyItems = (
  <>
    <SampleCard label="Card 1" />
    <SampleCard label="Card 2" />
    <SampleCard label="Card 3" />
    <SampleCard label="Card 4" />
    <SampleCard label="Card 5" />
    <SampleCard label="Card 6" />
    <SampleCard label="Card 7" />
    <SampleCard label="Card 8" />
  </>
);

const meta = {
  title: "UI/HorizontalSlider",
  component: HorizontalSlider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Generic horizontal scroll container with smooth scrolling, hidden scrollbar, and the paper-register arrows (48 × 48, cream, `-16px` overhang) from `<ScrollArrowButton>` — the card slider's only register.",
      },
    },
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof HorizontalSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive playground — adjust props in the controls panel. */
export const Playground: Story = {
  args: {
    children: manyItems,
  },
};

/** Few items — arrows may not appear if all items fit the viewport. */
export const FewItems: Story = {
  args: {
    children: fewItems,
  },
};

/** Many items — paper-card sample cards plus the overhung paper arrows. */
export const ManyItems: Story = {
  args: {
    children: manyItems,
  },
};

/**
 * Re-homed from `apps/web/test/e2e/scroll-arrows.spec.ts`'s "HorizontalSlider
 * (RelatedRow) on /nieuws/[slug]" case (#3146, deleted by this ticket).
 * Unlike the rail/overlay idioms, `<HorizontalSlider>` absorbs
 * `useScrollHint` directly rather than going through `<ScrollRail>`/
 * `<ScrollOverlay>` — the sole "paper" register consumer — so its own
 * mount/unmount invariant needs its own fixture rather than riding on
 * `ScrollRail`'s or `ScrollOverlay`'s story. `ManyItems` already guarantees
 * the overflow deterministically (8 fixed-width cards); `FewItems` guarantees
 * the opposite. `!vr`: assertion-only — both baselines already exist above.
 */
export const ArrowsMatchOverflow: Story = {
  args: {
    children: manyItems,
  },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = canvas.getByRole("group", { name: "Scrollable cards" });

    // At rest, scrolled to the start: only the right arrow is mounted.
    const rightArrow = await canvas.findByLabelText("Scroll right");
    await expect(rightArrow).toBeVisible();
    expect(canvas.queryByLabelText("Scroll left")).not.toBeInTheDocument();

    track.scrollLeft = 50;
    const leftArrow = await waitFor(() => canvas.getByLabelText("Scroll left"));
    await expect(leftArrow).toBeVisible();

    track.scrollLeft = track.scrollWidth;
    await waitFor(() => {
      expect(canvas.queryByLabelText("Scroll right")).not.toBeInTheDocument();
    });
  },
};

/** Sibling of `ArrowsMatchOverflow` for the non-overflowing case — neither
 * arrow mounts when the track fits. `!vr`: assertion-only. */
export const NoOverflowNoArrows: Story = {
  args: {
    children: fewItems,
  },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryAllByRole("button")).toHaveLength(0);
  },
};
