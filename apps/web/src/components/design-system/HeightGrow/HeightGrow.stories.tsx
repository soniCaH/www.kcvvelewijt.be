import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { TapedCard } from "../TapedCard";
import { HeightGrow } from "./HeightGrow";

const meta = {
  title: "UI/HeightGrow",
  component: HeightGrow,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A height change is Arrival (`500ms`, `ease-out`) — DESIGN.md → Motion → The Height Rule. A one-row grid whose row track transitions `grid-template-rows` between `0fr` and `1fr`: CSS only, no measuring, works both ways. `enter` grows on mount; `open` toggles a wrapper that stays mounted. Under `prefers-reduced-motion` the change is instant. Collapsed paints nothing; content that paints below its own box (a card's offset shadow) brings its own bottom padding.",
      },
    },
  },
  args: {
    open: true,
    enter: false,
    children: null,
  },
} satisfies Meta<typeof HeightGrow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A rotated paper card with an offset shadow — what the clip must not cut. */
const Card = () => (
  <div className="pt-1 pb-8">
    <TapedCard rotation={-0.5} shadow="md" bg="cream" padding="md">
      <p className="font-body">
        Content that arrives above something already on screen.
      </p>
    </TapedCard>
  </div>
);

/** The wrapper sits between a line above and a line below, so a leak at `0fr`
 *  or a pushed neighbour is visible. */
const render: Story["render"] = (args) => (
  <div className="max-w-xl">
    <p className="font-mono text-xs">Above</p>
    <HeightGrow {...args} className="mb-0">
      <Card />
    </HeightGrow>
    <p className="font-mono text-xs">Below</p>
  </div>
);

/** Knobs for both props. */
export const Playground: Story = { render };

/** Open: the content at its natural height, shadow and corners unclipped. */
export const Open: Story = {
  render,
  play: async ({ canvasElement }) => {
    const text = within(canvasElement).getByText(/arrives above/i);
    const card = text.closest("section, div[data-rotation]") as HTMLElement;
    const clip = card.closest("[class*='overflow-hidden']") as HTMLElement;
    const c = card.getBoundingClientRect();
    const k = clip.getBoundingClientRect();
    // Room for the rotated corners (sides, and `pt-1` on top) and the 6px
    // shadow (`pb-8` below).
    await expect(c.left).toBeGreaterThanOrEqual(k.left);
    await expect(c.right).toBeLessThanOrEqual(k.right);
    await expect(c.top).toBeGreaterThanOrEqual(k.top);
    await expect(c.bottom + 6).toBeLessThanOrEqual(k.bottom);
  },
};

/**
 * Closed (`0fr`): the wrapper has no height and paints nothing — no strip of
 * the content shows below it, and "Below" sits right under "Above".
 */
export const Closed: Story = {
  args: { open: false },
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const clip = canvas
      .getByText(/arrives above/i)
      .closest("[class*='overflow-hidden']") as HTMLElement;
    const wrapper = clip.parentElement as HTMLElement;
    const w = wrapper.getBoundingClientRect();
    const k = clip.getBoundingClientRect();

    // Exactly zero tall: nothing of the content, or its padding, is visible.
    await expect(w.height).toBe(0);
    await expect(k.height).toBe(0);
  },
};

/**
 * `enter`: grows from zero on mount at the Arrival speed. The capture is taken
 * after (the VR runner freezes transitions); `play` checks the transition names
 * the property it animates.
 */
export const Enter: Story = {
  args: { enter: true },
  render,
  play: async ({ canvasElement }) => {
    if (navigator.userAgent.includes("StorybookTestRunner")) return;
    const clip = within(canvasElement)
      .getByText(/arrives above/i)
      .closest("[class*='overflow-hidden']") as HTMLElement;
    const wrapper = clip.parentElement as HTMLElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await expect(getComputedStyle(wrapper).transitionProperty).toBe("none");
      return;
    }
    await expect(getComputedStyle(wrapper).transitionProperty).toBe(
      "grid-template-rows",
    );
    await expect(getComputedStyle(wrapper).transitionDuration).toBe("0.5s");
  },
};
