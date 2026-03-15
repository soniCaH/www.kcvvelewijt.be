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

export const Playground: Story = {
  render: () => (
    <div className="min-h-[120px] bg-white relative">
      <AccentStrip />
      <div className="pt-4 px-4 text-sm text-kcvv-gray">
        3px kcvv-green strip fixed at top-0
      </div>
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
    <div className="min-h-[120px] bg-kcvv-black relative">
      <AccentStrip />
      <div className="pt-4 px-4 text-sm text-kcvv-gray-light">
        Strip above dark nav background
      </div>
    </div>
  ),
};
