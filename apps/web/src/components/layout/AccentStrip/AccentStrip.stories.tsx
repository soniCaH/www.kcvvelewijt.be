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

/**
 * The wrapper uses `transform: translateX(0)` to create a new CSS containing
 * block for the fixed-positioned AccentStrip, so it renders relative to the
 * story container rather than the Storybook page viewport.
 */
export const Playground: Story = {
  render: () => (
    <div
      className="min-h-[80px] bg-white"
      style={{ transform: "translateX(0)" }}
    >
      <AccentStrip />
    </div>
  ),
};

export const OnDarkBackground: Story = {
  parameters: {
    docs: {
      description: {
        story: "How the strip appears above the dark nav (#1E2024).",
      },
    },
  },
  render: () => (
    <div
      className="min-h-[80px] bg-kcvv-black"
      style={{ transform: "translateX(0)" }}
    >
      <AccentStrip />
    </div>
  ),
};
