/**
 * SponsorsPage Stories — Phase 7.
 *
 * Split `<SponsorHero>` (Merci headline + "In de kijker" marquee) over a cream
 * `<SponsorTile>` grid of all sponsors. Not `vr`-tagged: the hero, marquee card
 * and tile each carry their own VR coverage.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorsPage } from "./SponsorsPage";
import { mockSponsors } from "../Sponsors.mocks";
import { sortByTierThenName } from "../sortByTierThenName";
import SponsorsLoading from "@/app/(landing)/sponsors/loading";

const ordered = [...mockSponsors].sort(sortByTierThenName);

const meta = {
  title: "Features/Sponsors/SponsorsPage",
  component: SponsorsPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase 7 /sponsors. Split `<SponsorHero>` (MonoLabel kicker + EditorialHeading + italic lead + the single `<FeaturedSponsorCard>` marquee) over a cream `<SponsorTile>` grid of all sponsors. Replaces the legacy dark header + SectionStack/diagonal composition. Tier bodies and the CTA band land in later phases.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SponsorsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All sponsors across every tier, ordered hoofdsponsor → sponsor → sympathisant. */
export const Default: Story = {
  args: { sponsors: ordered },
};

/** No sponsors — header only (the full empty state lands in Phase 4). */
export const Empty: Story = {
  args: { sponsors: [] },
};

/** Mobile viewport — grid collapses to two columns. */
export const MobileViewport: Story = {
  args: { sponsors: ordered },
  globals: { viewport: { value: "kcvvMobile" } },
};

/** Route-level loading skeleton. */
export const RouteSkeleton: StoryObj = {
  render: () => <SponsorsLoading />,
  parameters: { layout: "fullscreen" },
};
