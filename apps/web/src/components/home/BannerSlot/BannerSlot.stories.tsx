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

// #2401 review finding 5 — `image` and `mobileImage` deliberately use two
// VISUALLY DIFFERENT fixtures (a green line-art pattern vs. a photograph),
// not the same URL twice. If a future refactor ever fed the desktop crop to
// the mobile `<source>` (or vice versa) — the exact class of bug the
// `<picture>` art-direction swap in `BannerSlot.tsx` exists to avoid — the
// mismatch would show up as an obviously wrong baseline instead of staying
// green because both fixtures happened to render identically.
const DESKTOP_FIXTURE = "/images/header-pattern.png";
const MOBILE_FIXTURE = "/images/ultras.jpg";

export const WithLink: Story = {
  args: {
    image: DESKTOP_FIXTURE,
    mobileImage: MOBILE_FIXTURE,
    alt: "Anti-racism campaign",
    href: "https://example.com",
  },
};

export const NoLink: Story = {
  args: {
    image: DESKTOP_FIXTURE,
    mobileImage: MOBILE_FIXTURE,
    alt: "Summer camp 2026",
  },
};

// #2401 item 2 — the mobile breakpoint gets its own, taller crop (3:1) so a
// banner's text zone stays legible at a ~375px column, where the desktop
// 6:1 ratio resolves to an illegible ~60px strip. `vr.viewports` (not the
// Storybook-10-removed `parameters.viewport.defaultViewport`, which the VR
// runner doesn't read at all) locks this story to the VR runner's "mobile"
// viewport so the 3:1 crop — and the mobile fixture, per finding 5 above —
// is what gets captured.
export const MobileRatio: Story = {
  args: {
    image: DESKTOP_FIXTURE,
    mobileImage: MOBILE_FIXTURE,
    alt: "Summer camp 2026",
    href: "https://example.com",
  },
  parameters: {
    vr: { viewports: ["mobile"] },
  },
};
