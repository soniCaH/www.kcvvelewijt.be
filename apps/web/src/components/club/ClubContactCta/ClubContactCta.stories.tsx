import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ClubContactCta } from "./ClubContactCta";

const meta = {
  title: "Features/Club/ClubContactCta",
  component: ClubContactCta,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
    docs: {
      description: {
        component:
          "Contact call-to-action bar for the /club landing page. Two-column layout with heading and body text on the left, CTA button on the right. Collapses to centered single-column on mobile.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ClubContactCta>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default desktop layout — text left, CTA button right.
 */
export const Default: Story = {};

/**
 * Mobile viewport — stacked and centered layout.
 */
export const MobileViewport: Story = {
  globals: {
    viewport: { value: "kcvvMobile" },
  },
};
