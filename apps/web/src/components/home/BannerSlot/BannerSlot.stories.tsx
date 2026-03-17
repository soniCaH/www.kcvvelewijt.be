import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BannerSlot } from "./BannerSlot";

const meta = {
  title: "Features/Homepage/BannerSlot",
  component: BannerSlot,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BannerSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLink: Story = {
  args: {
    image: "/images/header-pattern.png",
    alt: "Anti-racism campaign",
    href: "https://example.com",
  },
};

export const NoLink: Story = {
  args: {
    image: "/images/header-pattern.png",
    alt: "Summer camp 2026",
  },
};
