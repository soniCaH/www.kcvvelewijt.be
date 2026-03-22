import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorCallToAction } from "./SponsorCallToAction";

const meta = {
  title: "Features/Sponsors/SponsorCallToAction",
  component: SponsorCallToAction,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SponsorCallToAction>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Green gradient CTA block encouraging new sponsors to make contact. */
export const Default: Story = {};
