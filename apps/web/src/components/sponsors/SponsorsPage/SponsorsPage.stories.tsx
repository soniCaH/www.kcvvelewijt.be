/**
 * SponsorsPage Stories — Phase 7.
 *
 * Split `<SponsorHero>` → `<StripedSeam>` → `<SponsorTiers>` (Hoofdsponsors grid
 * + unlabelled wall) → `<SponsorCtaBand>`; 0 sponsors collapses to a
 * `<SponsorEmptyState>` + band. Page-level composition for the /sponsors route —
 * not `vr`-tagged (page coverage is the Playwright e2e suite's job); the hero,
 * marquee card, hoofd tile, tile, tiers, empty state and CTA band each carry
 * their own VR coverage.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorsPage } from "./SponsorsPage";
import { mockSponsors } from "../Sponsors.mocks";
import { sortByTierThenName } from "../sortByTierThenName";
import SponsorsLoading from "@/app/(landing)/sponsors/loading";

const ordered = [...mockSponsors].sort(sortByTierThenName);

const meta = {
  title: "Pages/Sponsors",
  component: SponsorsPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase 7 /sponsors. `<SponsorHero>` (kicker + EditorialHeading + lead + `<FeaturedSponsorCard>` marquee) → `<StripedSeam>` → `<SponsorTiers>` (labelled Hoofdsponsors grid over one unlabelled merged wall) → `<SponsorCtaBand>` (jersey-deep-dark footer invitation). With zero sponsors the body collapses to a `<SponsorEmptyState>` + the band. Replaces the legacy dark header + SectionStack/diagonal composition.",
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

/** No sponsors — headline-only hero → `<SponsorEmptyState>` → CTA band. */
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
