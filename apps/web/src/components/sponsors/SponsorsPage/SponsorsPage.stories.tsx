/**
 * SponsorsPage Stories — Phase 7.
 *
 * Split `<SponsorHero>` (Merci headline + "In de kijker" marquee) → `<StripedSeam>`
 * → `<SponsorTiers>` (labelled Hoofdsponsors grid + unlabelled merged wall). Not
 * `vr`-tagged: the hero, marquee card, hoofd tile, tile and tiers each carry
 * their own VR coverage.
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
          "Phase 7 /sponsors. Split `<SponsorHero>` (MonoLabel kicker + EditorialHeading + italic lead + the single `<FeaturedSponsorCard>` marquee) → `<StripedSeam>` → `<SponsorTiers>`: a labelled Hoofdsponsors grid over one unlabelled merged wall of sponsor + sympathisant tiles. Replaces the legacy dark header + SectionStack/diagonal composition. The CTA band + full empty states land in later phases.",
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

/** Mobile viewport — hoofd grid + wall collapse to fewer columns. */
export const MobileViewport: Story = {
  args: { sponsors: ordered },
  globals: { viewport: { value: "kcvvMobile" } },
};

/**
 * Route-level loading skeleton. Kept as a bare `StoryObj` (not
 * `StoryObj<typeof meta>`): it renders `<SponsorsLoading />`, not
 * `<SponsorsPage>`, so it has no `sponsors` arg — `StoryObj<typeof meta>` would
 * require one (TS2322).
 */
export const RouteSkeleton: StoryObj = {
  render: () => <SponsorsLoading />,
  parameters: { layout: "fullscreen" },
};
