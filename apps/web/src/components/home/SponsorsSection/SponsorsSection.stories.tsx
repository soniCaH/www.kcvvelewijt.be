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
 * the latter's `placehold.co` logos are remote, and the runner's
 * deny-by-default network route (#3137) now aborts and fails any story that
 * requests them, rather than merely risking a non-deterministic capture.
 *
 * The `className` override matches `app/(landing)/(home)/page.tsx`'s own call
 * exactly (#2571 review finding 2): homepage air is #2402's call, still open,
 * so the homepage keeps its pre-#2571 padding rather than following
 * `<SponsorsBlock>`'s own literal down to `py-12 sm:py-16`. Without this the
 * story would drift from what the homepage actually renders — it stands in
 * for `<SponsorsSection>` precisely because that's an async server component
 * Storybook can't render live.
 */
const meta = {
  title: "Features/Home/SponsorsSection",
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  render: () => (
    <SponsorsBlock
      sponsors={[...mockHoofdsponsors, ...mockSponsorsTier]}
      className="py-16 sm:py-16 md:py-20"
    />
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
