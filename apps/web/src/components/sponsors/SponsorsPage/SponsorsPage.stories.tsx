/**
 * SponsorsPage Stories
 *
 * Full sponsors page composition: intro text, optional featured spotlight,
 * and a size-differentiated logo grid (hoofdsponsor large, sponsor medium,
 * sympathisant small). No tier labels, no dividers.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorsPage } from "./SponsorsPage";
import { mockSponsors } from "../Sponsors.mocks";

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: "Pages/SponsorsPage",
  component: SponsorsPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full sponsors page for /sponsors. Dark header section (replaces legacy PageTitle), intro paragraph, optional dark-green spotlight with diagonal transition for featured sponsors, size-differentiated logo grid (hoofdsponsor largest, sponsor medium, sympathisant smallest), and dark CTA with diagonal transition. No tier labels or dividers.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SponsorsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

const hoofdsponsors = mockSponsors.filter((s) => s.tier === "hoofdsponsor");
const sponsors = mockSponsors.filter((s) => s.tier === "sponsor");
const sympathisanten = mockSponsors.filter((s) => s.tier === "sympathisant");
const featured = mockSponsors.filter((s) => s.featured);

/**
 * All tiers populated, with one featured sponsor in the spotlight.
 */
export const Default: Story = {
  args: {
    goldSponsors: hoofdsponsors,
    silverSponsors: sponsors,
    bronzeSponsors: sympathisanten,
    featuredSponsors: featured,
  },
};

/**
 * No featured sponsors — spotlight section is hidden.
 */
export const NoSpotlight: Story = {
  args: {
    goldSponsors: hoofdsponsors,
    silverSponsors: sponsors,
    bronzeSponsors: sympathisanten,
    featuredSponsors: [],
  },
};

/**
 * Only hoofdsponsors — silver and sympathisant sections are hidden.
 */
export const HoofdsponsorsOnly: Story = {
  args: {
    goldSponsors: hoofdsponsors,
    silverSponsors: [],
    bronzeSponsors: [],
    featuredSponsors: featured,
  },
};

/**
 * No sponsors at all — empty state is shown.
 */
export const NoSponsors: Story = {
  args: {
    goldSponsors: [],
    silverSponsors: [],
    bronzeSponsors: [],
    featuredSponsors: [],
  },
};

/**
 * Mobile viewport.
 */
export const MobileViewport: Story = {
  args: {
    goldSponsors: hoofdsponsors,
    silverSponsors: sponsors,
    bronzeSponsors: sympathisanten,
    featuredSponsors: featured,
  },
  globals: { viewport: { value: "kcvvMobile" } },
};
