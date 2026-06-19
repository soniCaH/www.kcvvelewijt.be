import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorsBlock } from "./SponsorsBlock";
import {
  mockHoofdsponsors,
  mockSponsorsMixed,
  mockSponsorsMissingLogos,
  mockSponsorsTier,
} from "./SponsorsBlock.mocks";

const meta = {
  title: "Features/Sponsors/SponsorsBlock",
  component: SponsorsBlock,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage sponsors block (Phase 4.B.3). Single equal grid (2/3/5 cols) of cream-soft tiles with greyscale-by-default logos that resolve to colour on hover. Tier hierarchy is preserved through order only (hoofdsponsors first). `/sponsors` link sits at the section bottom and routes to the full tier-explicit Phase 7 page.",
      },
    },
  },
} satisfies Meta<typeof SponsorsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { sponsors: mockSponsorsMixed },
  parameters: {
    docs: {
      description: {
        story:
          "3 hoofdsponsors + 10 sponsors, all with logos. Hoofdsponsors render first (alphabetical within tier).",
      },
    },
  },
};

export const HoofdsponsorsOnly: Story = {
  args: { sponsors: mockHoofdsponsors },
  parameters: {
    docs: {
      description: {
        story: "Only hoofdsponsors (no `sponsor` tier rows).",
      },
    },
  },
};

export const SponsorsOnly: Story = {
  args: { sponsors: mockSponsorsTier.slice(0, 8) },
  parameters: {
    docs: {
      description: {
        story: "Only `sponsor`-tier rows, no hoofdsponsors.",
      },
    },
  },
};

export const Empty: Story = {
  args: { sponsors: [] },
  parameters: {
    docs: {
      description: {
        story:
          "Zero sponsors match the filter — entire section returns null. Matches the NewsGrid / UpcomingMatches convention.",
      },
    },
  },
};

export const MissingLogos: Story = {
  args: { sponsors: mockSponsorsMissingLogos },
  parameters: {
    docs: {
      description: {
        story:
          "Mix of sponsors with and without `logo`. No-logo cells render the italic Freight Display wordmark fallback.",
      },
    },
  },
};
