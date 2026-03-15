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
