/**
 * ScrollArrowButton Component Stories
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Single canonical 48 × 48 paper button
 * with an italic Freight Display `←` / `→` glyph. The `variant` prop was
 * retired — dark-context callers pass a soft-shadow `className` so the
 * offset stays visible against the ink panel.
 *
 * Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html
 * (`.arrow-btn` rules).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ScrollArrowButton } from "./ScrollArrowButton";

const meta = {
  title: "UI/ScrollArrowButton",
  component: ScrollArrowButton,
  tags: ["autodocs", "vr"],
  args: {
    direction: "right",
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="bg-cream relative h-20 w-48">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScrollArrowButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground — adjust direction and className via controls.
 */
export const Playground: Story = {};

/**
 * Right arrow — default cream paper button on a cream surface.
 */
export const RightOnCream: Story = {};

/**
 * Left arrow — same canonical button, mirrored glyph.
 */
export const LeftOnCream: Story = {
  args: {
    direction: "left",
  },
};

/**
 * On a dark/ink panel — caller passes a soft-shadow override so the offset
 * depth stays visible. Same button surface, different shadow palette.
 */
export const RightOnInk: Story = {
  args: {
    direction: "right",
    className:
      "shadow-[var(--shadow-paper-sm-soft)] hover:shadow-[3px_3px_0_0_var(--color-ink-muted)]",
  },
  decorators: [
    (Story) => (
      <div className="bg-ink-soft relative h-20 w-48">
        <Story />
      </div>
    ),
  ],
};

/**
 * Left arrow on dark panel.
 */
export const LeftOnInk: Story = {
  args: {
    direction: "left",
    className:
      "shadow-[var(--shadow-paper-sm-soft)] hover:shadow-[3px_3px_0_0_var(--color-ink-muted)]",
  },
  decorators: [
    (Story) => (
      <div className="bg-ink-soft relative h-20 w-48">
        <Story />
      </div>
    ),
  ],
};

/**
 * Both directions side-by-side on a cream surface — visual reference for
 * the canonical paper button's symmetry.
 */
export const BothDirections: Story = {
  decorators: [
    () => (
      <div className="bg-cream relative h-20 w-72">
        <ScrollArrowButton direction="left" onClick={() => {}} />
        <ScrollArrowButton direction="right" onClick={() => {}} />
      </div>
    ),
  ],
};
