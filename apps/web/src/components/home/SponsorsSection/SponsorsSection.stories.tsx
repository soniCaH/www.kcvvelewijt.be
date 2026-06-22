import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorsBlock } from "@/components/sponsors";
import {
  mockHoofdsponsors,
  mockSponsorsTier,
} from "@/components/sponsors/SponsorsBlock/SponsorsBlock.mocks";

/**
 * SponsorsSection is an async server component (fetches from Sanity) that renders
 * the redesign `<SponsorsBlock>`. This story renders that block with the homepage
 * subset (hoofd + sponsor tiers). Uses the local-fixture mocks (`fixtureImage`
 * logos) rather than `Sponsors.mocks` so the VR baseline stays deterministic —
 * the latter's `placehold.co` logos are remote and the runner does not block them.
 */
const meta = {
  title: "Features/Home/SponsorsSection",
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  render: () => (
    <SponsorsBlock sponsors={[...mockHoofdsponsors, ...mockSponsorsTier]} />
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
