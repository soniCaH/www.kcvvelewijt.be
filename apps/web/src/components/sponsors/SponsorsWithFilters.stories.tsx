import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorsWithFilters } from "./SponsorsWithFilters";
import { mockSponsors } from "./Sponsors.mocks";

const meta = {
  title: "Features/Sponsors/SponsorsWithFilters",
  component: SponsorsWithFilters,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SponsorsWithFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full sponsor list across all three tiers with interactive filters. */
export const Default: Story = {
  args: {
    goldSponsors: mockSponsors.slice(0, 3),
    silverSponsors: mockSponsors.slice(3, 7),
    bronzeSponsors: mockSponsors.slice(7, 10),
  },
};

/** Only gold-tier sponsors — silver and bronze rows are hidden. */
export const GoldOnly: Story = {
  args: {
    goldSponsors: mockSponsors.slice(0, 4),
    silverSponsors: [],
    bronzeSponsors: [],
  },
};

/** No sponsors at all — renders SponsorEmptyState. */
export const Empty: Story = {
  args: {
    goldSponsors: [],
    silverSponsors: [],
    bronzeSponsors: [],
  },
};
