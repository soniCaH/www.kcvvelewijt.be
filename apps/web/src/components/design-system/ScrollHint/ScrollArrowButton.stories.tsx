import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ScrollArrowButton } from "./ScrollArrowButton";

const meta = {
  title: "UI/ScrollArrowButton",
  component: ScrollArrowButton,
  tags: ["autodocs"],
  args: {
    direction: "right",
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: 200, height: 80 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScrollArrowButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground with all controls.
 */
export const Playground: Story = {};

/**
 * Right arrow — light variant (default).
 */
export const RightLight: Story = {};

/**
 * Left arrow — light variant.
 */
export const LeftLight: Story = {
  args: {
    direction: "left",
  },
};

/**
 * Right arrow — dark variant for use on dark backgrounds.
 */
export const RightDark: Story = {
  args: {
    variant: "dark",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          width: 200,
          height: 80,
          backgroundColor: "#1a1a1a",
          borderRadius: 8,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

/**
 * Left arrow — dark variant.
 */
export const LeftDark: Story = {
  args: {
    direction: "left",
    variant: "dark",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          width: 200,
          height: 80,
          backgroundColor: "#1a1a1a",
          borderRadius: 8,
        }}
      >
        <Story />
      </div>
    ),
  ],
};
