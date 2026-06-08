/**
 * SponsorsPage Stories — Phase 7 tracer.
 *
 * Editorial header over a cream `<SponsorTile>` grid of all sponsors. Not
 * `vr`-tagged: the tile itself carries the VR coverage (see SponsorTile).
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
          "Phase 7 tracer for /sponsors. Editorial header (MonoLabel kicker + EditorialHeading) over a cream `<SponsorTile>` grid of all sponsors. Replaces the legacy dark header + SectionStack/diagonal composition. Tier bodies, the featured marquee and the CTA band land in later phases.",
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
