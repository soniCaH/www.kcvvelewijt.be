/**
 * ScrollRail Component Stories
 *
 * The "row of discrete things" idiom (#2444, as amended by #2489) — chips,
 * crumbs, nav items. Held space follows real overflow: both control-register
 * arrows mount together and hold a 40px gutter on both sides exactly when
 * the track overflows, and the spent direction disables in place rather
 * than unmounting.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, expect, waitFor } from "storybook/test";
import { ScrollRail } from "./ScrollRail";

const Chip = ({ label }: { label: string }) => (
  <span className="border-ink bg-cream-soft shadow-paper-sm inline-flex shrink-0 items-center border-2 px-3 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
    {label}
  </span>
);

const fewChips = (
  <>
    <Chip label="Alles" />
    <Chip label="Nieuws" />
    <Chip label="Jeugd" />
  </>
);

const manyChips = (
  <>
    {[
      "Alles",
      "Nieuws",
      "Jeugd",
      "Evenementen",
      "Transfers",
      "Interviews",
      "Bestuur",
      "Sponsors",
      "Kalender",
      "Historiek",
    ].map((label) => (
      <Chip key={label} label={label} />
    ))}
  </>
);

const meta = {
  title: "UI/ScrollRail",
  component: ScrollRail,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Shared chrome for a row of discrete, tappable things — FilterTabs, TeamSectionNav, the organigram breadcrumb. Both control-register arrows mount together and hold a 40px gutter exactly when the track overflows; the spent direction disables in place.",
      },
    },
  },
  args: {
    role: "group",
    ariaLabel: "Voorbeeldrij",
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-md p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScrollRail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fits the row — no arrows, no held rail. */
export const Fits: Story = {
  args: {
    trackClassName: "flex gap-3",
    children: fewChips,
  },
};

/** Overflows — both arrows mount, the left one disabled at rest. */
export const Overflows: Story = {
  args: {
    trackClassName: "flex gap-3",
    children: manyChips,
  },
};

/**
 * Re-homed from `apps/web/test/e2e/scroll-arrows.spec.ts` (#3146, deleted by
 * this ticket) — the rail arrow/overflow invariant, proven once here against
 * a fixture that GUARANTEES the overflow (ten chips in a 448px decorator)
 * rather than against whatever a live team/route happens to render that day.
 * `<ScrollRail>` is the single idiom behind every "row of discrete things"
 * consumer (`<FilterTabs>` on `/nieuws` and `/hulp`, `<TeamSectionNav>` on
 * `/ploegen/[slug]`, the organigram breadcrumb) — the mount/unmount logic
 * lives entirely in this component + `useScrollHint`, never in a consumer,
 * so proving it here proves it for all of them (push it down, #3086 clause
 * 1). `!vr`: assertion-only, no pixel truth to capture — `Overflows` above
 * already owns the baseline.
 */
export const ArrowsMatchOverflow: Story = {
  args: {
    trackClassName: "flex gap-3",
    children: manyChips,
  },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = canvas.getByRole("group", { name: "Voorbeeldrij" });

    // At rest: both arrows mount (the track overflows), left disabled
    // (nothing scrolled left of the start yet), right enabled.
    const rightArrow = await canvas.findByLabelText("Scroll right");
    const leftArrow = await canvas.findByLabelText("Scroll left");
    await expect(leftArrow).toBeDisabled();
    await expect(rightArrow).toBeEnabled();

    // Scroll to the end — the spent direction disables IN PLACE (#2489
    // rule 1); it does not unmount. Setting `scrollLeft` fires the native
    // `scroll` event `useScrollHint` listens for.
    track.scrollLeft = track.scrollWidth;
    await waitFor(async () => {
      await expect(rightArrow).toBeDisabled();
    });
    await expect(leftArrow).toBeEnabled();

    // Held space follows overflow, not scroll position — both arrows are
    // still present, never unmounted mid-scroll.
    expect(canvas.getAllByRole("button")).toHaveLength(2);
  },
};

/** Sibling of `ArrowsMatchOverflow` for the non-overflowing case — no
 * arrows mount at all when the track fits. `!vr`: assertion-only. */
export const NoOverflowNoArrows: Story = {
  args: {
    trackClassName: "flex gap-3",
    children: fewChips,
  },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryAllByRole("button")).toHaveLength(0);
  },
};

/**
 * Regression fixture for #3016 (review finding, fixed on `<ScrollRail>`
 * itself): `useScrollHint`'s overflow arithmetic subtracts the rail's own
 * padding from `scrollWidth` on the assumption that padding shrinks the
 * track's CONTENT box while its border box stays fixed — the ordinary
 * `box-sizing: border-box` case. That assumption breaks when `<ScrollRail>`'s
 * own outer wrapper becomes a flex item: a flex item's default
 * `min-width: auto` lets the rail padding raise its own floor instead, so
 * `scrollWidth` and `clientWidth` move together and the padding gets
 * subtracted once instead of cancelling — the overflow verdict then inverts
 * on every re-measure. Shipped on `/hulp`'s audience row: ~3 arrow
 * mount/unmount flips a second while a chip stayed hovered (each hover
 * transition fires `transitionend`, which re-measures).
 *
 * `<ScrollRail>` holds up its half of the contract with `min-w-0` on its own
 * wrapper (`ScrollRail.tsx`) — this fixture puts that wrapper directly
 * inside an outer flex row (the shape that makes `min-w-0` load-bearing;
 * without a flex-item context the property is inert) and forces several
 * remeasures the way a burst of hover transitions would (`transitionend`,
 * which `useScrollHint` listens for on the track), asserting the arrow
 * state settles correctly and stays stable rather than flipping. `!vr`:
 * assertion-only, and no consumer renders this composition today (the
 * component's own docblock notes it), so there is no baseline to protect.
 */
export const StaysStableAsAFlexItem: Story = {
  render: (args) => (
    <div className="flex items-start gap-4">
      <ScrollRail {...args} />
      <span className="shrink-0 self-center text-xs">sibling</span>
    </div>
  ),
  args: {
    trackClassName: "flex gap-3",
    children: manyChips,
  },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = canvas.getByRole("group", {
      name: "Voorbeeldrij",
    }) as HTMLElement;

    await canvas.findByLabelText("Scroll right");

    for (let i = 0; i < 5; i++) {
      track.dispatchEvent(new Event("transitionend", { bubbles: true }));
    }

    // Settled state: still overflowing, both arrows present, the read
    // stays consistent across the burst rather than having flipped to "no
    // overflow" on an intermediate remeasure.
    await waitFor(async () => {
      expect(canvas.getAllByRole("button")).toHaveLength(2);
    });
    expect(track.scrollWidth).toBeGreaterThan(track.clientWidth);
  },
};
