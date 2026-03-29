import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorCallToAction } from "./SponsorCallToAction";

const meta = {
  title: "Features/Sponsors/SponsorCallToAction",
  component: SponsorCallToAction,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Minimal dark-green CTA block at the bottom of the sponsors page. Headline: 'Word sponsor', one-sentence pitch, email button and contact link. No emoji, no benefits grid.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SponsorCallToAction>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dark green CTA encouraging new sponsors to make contact. */
export const Default: Story = {};
