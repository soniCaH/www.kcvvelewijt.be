import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { VolledigOrganigram } from "./VolledigOrganigram";
import { explorerFixture } from "./organigram-explorer.fixture";

const meta = {
  title: "Features/Organigram/VolledigOrganigram",
  component: VolledigOrganigram,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-screen p-6">
        <Story />
      </div>
    ),
  ],
  args: { nodes: explorerFixture },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof VolledigOrganigram>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The full reporting tree as a pure-CSS box chart — the accessible fallback to
 * the spotlight. It opens centred on the club root, not at the far left.
 */
export const Default: Story = {};

/**
 * The chart is far wider than most viewports, and it used to open scrolled to
 * the far left of the tree. Geometry, so a play assertion on the real layout:
 * the root box sits in the middle of the scroll track on arrival, fully in view,
 * with no sideways scrolling.
 */
async function expectRootInView(canvasElement: HTMLElement) {
  const track = canvasElement.querySelector<HTMLElement>(".vo-chart");
  const root = canvasElement.querySelector<HTMLElement>('[data-state="root"]');
  if (!track || !root) throw new Error("chart track or root box missing");
  // The track really overflows, or the assertion proves nothing.
  await expect(track.scrollWidth).toBeGreaterThan(track.clientWidth);
  const t = track.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  await expect(r.left).toBeGreaterThanOrEqual(t.left);
  await expect(r.right).toBeLessThanOrEqual(t.right);
  await expect(
    Math.abs(r.left + r.width / 2 - (t.left + t.width / 2)),
  ).toBeLessThanOrEqual(2);
}

export const OpensWithTheRootInViewAt390: Story = {
  tags: ["!vr"],
  globals: { viewport: { value: "kcvvPhone390" } },
  play: ({ canvasElement }) => expectRootInView(canvasElement),
};

export const OpensWithTheRootInViewOnDesktop: Story = {
  tags: ["!vr"],
  globals: { viewport: { value: "kcvvExplorerDesktop" } },
  play: ({ canvasElement }) => expectRootInView(canvasElement),
};

function chartParts(canvasElement: HTMLElement) {
  const track = canvasElement.querySelector<HTMLElement>(".vo-chart");
  const root = canvasElement.querySelector<HTMLElement>('[data-state="root"]');
  if (!track || !root) throw new Error("chart track or root box missing");
  return { track, root };
}

/** How far the root's centre is from the track's centre, in px. */
function rootOffset(canvasElement: HTMLElement) {
  const { track, root } = chartParts(canvasElement);
  const t = track.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return Math.abs(r.left + r.width / 2 - (t.left + t.width / 2));
}

/**
 * The root stays centred while the layout changes under it (a resize, a rotation,
 * a late font swap), until the visitor scrolls the chart themselves. The frame's
 * width stands in for the viewport.
 */
export const StaysCentredOnResizeUntilTheVisitorScrolls: Story = {
  tags: ["!vr"],
  decorators: [
    (Story) => (
      <div data-testid="frame" style={{ width: 700 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>(
      '[data-testid="frame"]',
    );
    if (!frame) throw new Error("frame missing");
    const { track } = chartParts(canvasElement);
    await waitFor(() =>
      expect(rootOffset(canvasElement)).toBeLessThanOrEqual(2),
    );

    // Narrower, as when a phone is turned: still centred.
    frame.style.width = "420px";
    await waitFor(() =>
      expect(rootOffset(canvasElement)).toBeLessThanOrEqual(2),
    );

    // The visitor scrolls the chart: from then on it is theirs.
    track.dispatchEvent(new WheelEvent("wheel"));
    track.scrollTo({ left: track.scrollLeft + 300, behavior: "instant" });
    frame.style.width = "560px";
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(rootOffset(canvasElement)).toBeGreaterThan(50);
  },
};
