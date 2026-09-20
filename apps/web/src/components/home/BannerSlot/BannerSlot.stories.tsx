import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BannerSlot } from "./BannerSlot";

const meta = {
  title: "Features/Home/BannerSlot",
  component: BannerSlot,
  // Kept from #2401: this component had no VR coverage before that change.
  // It matters more now — with no fixed `aspect-[]` box, the rendered height
  // comes entirely from the asset's own `width`/`height`, so a regression
  // here is a silently wrong page height rather than a wrong crop (#2928).
  //
  // #2928 removed a `MobileRatio` story that existed to capture the SECOND,
  // narrower crop the mobile breakpoint used to be served. There is one URL
  // now, so "the phone gets the same picture at the same ratio" is already
  // proved by comparing each story's own `--desktop` and `--mobile`
  // baselines: they must differ in width and in nothing else. A dedicated
  // mobile story would have been argument-identical to `WithLink` and
  // captured a byte-identical image — a baseline to maintain that guards
  // nothing.
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
