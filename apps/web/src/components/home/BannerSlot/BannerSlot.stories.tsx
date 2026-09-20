import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BannerSlot } from "./BannerSlot";

const meta = {
  title: "Features/Home/BannerSlot",
  component: BannerSlot,
  // Kept from #2401: this component had no VR coverage before that change.
  // It matters more now — with no fixed `aspect-[]` box, the rendered height
  // comes entirely from the asset's own `width`/`height`, so a regression
  // here is a silently wrong page height rather than a wrong crop (#2928).
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BannerSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

// Two fixtures with DIFFERENT, deliberately non-banner ratios — ~2:1 and
// 4:3. That is the point, not a shortcut: the slot no longer imposes a shape
// (#2928), so the contract these stories pin is "the rendered box follows the
// asset". Fixtures that were both already banner-shaped could not tell a
// working component apart from one that forced a ratio back in.
//
// The declared `width`/`height` must stay the fixtures' TRUE pixel sizes. They
// are what the browser reserves the box from before the bytes land, so a wrong
// number here reintroduces exactly the layout shift this change removed.
const WIDE_FIXTURE = "/images/header-pattern.png";
const WIDE_W = 2098;
const WIDE_H = 1029;

const TALL_FIXTURE = "/images/ultras.jpg";
const TALL_W = 2048;
const TALL_H = 1536;

export const WithLink: Story = {
  args: {
    image: WIDE_FIXTURE,
    width: WIDE_W,
    height: WIDE_H,
    alt: "Anti-racism campaign",
    href: "https://example.com",
  },
};

export const NoLink: Story = {
  args: {
    image: WIDE_FIXTURE,
    width: WIDE_W,
    height: WIDE_H,
    alt: "Summer camp 2026",
  },
};

// The regression guard for #2928. This used to be `MobileRatio`, and it
// existed to capture a SECOND, taller crop (3:1) that the mobile breakpoint
// was served instead of the desktop 6:1 — two shapes from one file, which is
// what cut the first line off the live banner's quote at every hotspot value.
//
// Its job is now the opposite: prove the phone gets the SAME picture at the
// SAME ratio as the desktop, just narrower. Compared against `WithLink`'s
// baseline, the two captures must differ only in width.
//
// `vr.viewports` (not the Storybook-10-removed
// `parameters.viewport.defaultViewport`, which the VR runner does not read)
// locks this story to the runner's "mobile" viewport.
export const Mobile: Story = {
  args: {
    image: WIDE_FIXTURE,
    width: WIDE_W,
    height: WIDE_H,
    alt: "Summer camp 2026",
    href: "https://example.com",
  },
  parameters: {
    vr: { viewports: ["mobile"] },
  },
};

// The failure mode the removed crop used to absorb, captured on purpose.
// Nothing clips a banner any more, so a portrait-ish upload becomes a very
// tall band. `validateBannerAspectRatio` warns an editor below 2.5:1 but
// never blocks — this is what they get if they publish anyway, and it should
// be reviewed as a baseline rather than discovered on the live homepage.
export const TallUploadIsNotClipped: Story = {
  args: {
    image: TALL_FIXTURE,
    width: TALL_W,
    height: TALL_H,
    alt: "A 4:3 upload, shown in full rather than cropped",
  },
};
