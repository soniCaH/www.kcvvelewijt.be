import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorEmptyState } from "./SponsorEmptyState";

const meta = {
  title: "Features/Sponsors/SponsorEmptyState",
  component: SponsorEmptyState,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SponsorEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Displayed when the CMS returns zero sponsors. */
export const Default: Story = {};
