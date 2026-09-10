import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BannerSlot } from "./BannerSlot";

const meta = {
  title: "Features/Home/BannerSlot",
  component: BannerSlot,
  // #2401 item 2 — this component had no VR coverage at all before this
  // change (no `"vr"` tag), so the mobile-ratio regression the issue found
  // could not have been caught by VR in the first place. Opting in here so
  // the new mobile crop gets a baseline.
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BannerSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLink: Story = {
  args: {
    image: "/images/header-pattern.png",
    mobileImage: "/images/header-pattern.png",
    alt: "Anti-racism campaign",
    href: "https://example.com",
  },
};

export const NoLink: Story = {
  args: {
    image: "/images/header-pattern.png",
    mobileImage: "/images/header-pattern.png",
    alt: "Summer camp 2026",
  },
};

// #2401 item 2 — the mobile breakpoint gets its own, taller crop (3:1) so a
// banner's text zone stays legible at a ~375px column, where the desktop
// 6:1 ratio resolves to an illegible ~60px strip. `vr.viewports` (not the
// Storybook-10-removed `parameters.viewport.defaultViewport`, which the VR
// runner doesn't read at all) locks this story to the VR runner's "mobile"
// viewport so the 3:1 crop is what gets captured.
export const MobileRatio: Story = {
  args: {
    image: "/images/header-pattern.png",
    mobileImage: "/images/header-pattern.png",
    alt: "Summer camp 2026",
    href: "https://example.com",
  },
  parameters: {
    vr: { viewports: ["mobile"] },
  },
};
