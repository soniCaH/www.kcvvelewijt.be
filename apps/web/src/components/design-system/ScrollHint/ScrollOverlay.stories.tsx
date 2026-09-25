/**
 * ScrollOverlay Component Stories
 *
 * The "content scrolled past" idiom (#2444, as amended by #2476) — a table,
 * a diagram. No reserved rail: the control-register arrow overlays the edge
 * and mounts only on real overflow, with a fade capped at
 * `min(24px, remaining)`.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, expect, waitFor } from "storybook/test";
import { settle } from "@test-storybook/settle";
import { ScrollOverlay } from "./ScrollOverlay";

const WideContent = () => (
  <div className="flex w-[900px] gap-4 font-mono text-xs">
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="border-ink-muted flex-1 border p-3">
        Kolom {i + 1}
      </div>
    ))}
  </div>
);

const meta = {
  title: "UI/ScrollOverlay",
  component: ScrollOverlay,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Shared chrome for content scrolled past rather than a row of tap targets — HtmlTableBlock, StandingsTable, VolledigOrganigram's chart. No reserved rail; the arrow overlays the edge and mounts per direction on real overflow, with a capped fade.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-md p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScrollOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** direction="right" (the default) — a table with a sticky first column
 *  already anchors the left edge, so only the right edge needs a cue. */
export const RightOnly: Story = {
  args: {
    role: "region",
    ariaLabel: "Voorbeeldtabel",
    children: <WideContent />,
  },
};

/** direction="both" — a diagram with no anchored edge, e.g. the organigram
 *  chart. Scroll right to see the left arrow mount too. */
export const BothDirections: Story = {
  args: {
    direction: "both",
    role: "region",
    ariaLabel: "Voorbeelddiagram",
    children: <WideContent />,
  },
};

/**
 * Re-homed from `apps/web/test/e2e/scroll-arrows.spec.ts` (#3146, deleted by
 * this ticket) — the overlay arrow/overflow invariant, proven once against a
 * fixture that guarantees the overflow (an 8-column, 900px-wide track).
 * `<ScrollOverlay>` is the single idiom behind every "content scrolled past"
 * consumer (`<HtmlTableBlock>`, `<StandingsTable>`'s numbered variant,
 * `<VolledigOrganigram>`'s chart, the organigram explorer's stage) — proving
 * the mount/per-direction logic here proves it for all of them (push it
 * down, #3086 clause 1). Covers both the `direction="right"` case (the
 * `HtmlTableBlock` shape — right-only, no held space) and `"both"` (scroll
 * right, then the left arrow mounts too). `!vr`: assertion-only, no pixel
 * truth to capture — `RightOnly`/`BothDirections` above already own the
 * baselines.
 */
export const ArrowsMatchOverflowRightOnly: Story = {
  args: {
    role: "region",
    ariaLabel: "Voorbeeldtabel",
    children: <WideContent />,
  },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Settle first (review finding 8) — see `ScrollRail.stories.tsx`'s
    // `NoOverflowNoArrows` for why an absence check right after mount
    // isn't enough on its own.
    await settle(canvasElement.ownerDocument.defaultView ?? window);
    // direction="right" (default) never mounts a left arrow — a sticky
    // first column (or nothing yet) already anchors the left edge.
    expect(canvas.queryByLabelText("Scroll left")).not.toBeInTheDocument();
    const rightArrow = await canvas.findByLabelText("Scroll right");
    await expect(rightArrow).toBeVisible();

    const track = canvas.getByRole("region", { name: "Voorbeeldtabel" });
    track.scrollLeft = track.scrollWidth;
    await waitFor(() => {
      expect(canvas.queryByLabelText("Scroll right")).not.toBeInTheDocument();
    });
    expect(canvas.queryByLabelText("Scroll left")).not.toBeInTheDocument();
  },
};

export const ArrowsMatchOverflowBothDirections: Story = {
  args: {
    direction: "both",
    role: "region",
    ariaLabel: "Voorbeelddiagram",
    children: <WideContent />,
  },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = canvas.getByRole("region", { name: "Voorbeelddiagram" });

    // Settle first (review finding 8) — see `ScrollRail.stories.tsx`'s
    // `NoOverflowNoArrows` for why an absence check right after mount
    // isn't enough on its own.
    await settle(canvasElement.ownerDocument.defaultView ?? window);
    // At rest, scrolled to the start: only the right arrow is mounted —
    // "both" still means "per direction on real overflow", never "always
    // both at once".
    const rightArrow = await canvas.findByLabelText("Scroll right");
    await expect(rightArrow).toBeVisible();
    expect(canvas.queryByLabelText("Scroll left")).not.toBeInTheDocument();

    // Scroll away from the start — the left arrow mounts too.
    track.scrollLeft = 50;
    const leftArrow = await waitFor(() => canvas.getByLabelText("Scroll left"));
    await expect(leftArrow).toBeVisible();

    // Scroll back to the very start — the left arrow unmounts again
    // (overlay never holds space the way the rail idiom does).
    track.scrollLeft = 0;
    await waitFor(() => {
      expect(canvas.queryByLabelText("Scroll left")).not.toBeInTheDocument();
    });
  },
};
