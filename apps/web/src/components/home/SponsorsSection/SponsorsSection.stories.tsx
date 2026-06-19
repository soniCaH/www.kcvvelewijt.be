import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorsBlock } from "@/components/sponsors";
import { mockSponsors } from "@/components/sponsors/Sponsors.mocks";

/**
 * SponsorsSection is an async server component (fetches from Sanity) that renders
 * the redesign `<SponsorsBlock>`. This story renders that block with mock data
 * (hoofd + sponsor tiers — the homepage subset).
 */
const meta = {
  title: "Features/Home/SponsorsSection",
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  render: () => {
    const homepageSponsors = mockSponsors.filter(
      (s) => s.tier === "hoofdsponsor" || s.tier === "sponsor",
    );
    return <SponsorsBlock sponsors={homepageSponsors} />;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
