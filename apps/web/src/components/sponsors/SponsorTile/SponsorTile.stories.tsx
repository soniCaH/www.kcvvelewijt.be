import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { SponsorTile } from "./SponsorTile";

const meta = {
  title: "Features/Sponsors/SponsorTile",
  component: SponsorTile,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Shared sponsor logo tile used by the homepage `<SponsorsBlock>` and the `/sponsors` page. Cream-soft cell, greyscale logo that resolves to colour on hover/focus, italic Freight Display wordmark fallback when no logo, and an optional external link with a jersey-deep focus ring.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream-deep w-48 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SponsorTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLogo: Story = {
  args: {
    sponsor: {
      id: "s-1",
      name: "Bakkerij Peeters",
      logo: fixtureImage("sponsor-logo", 0),
      url: "https://example.com/peeters",
      tier: "hoofdsponsor",
    },
  },
};

export const NoLogoFallback: Story = {
  args: {
    sponsor: {
      id: "s-2",
      name: "Garage Vermeulen",
      logo: "",
      url: "https://example.com/vermeulen",
      tier: "sponsor",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "No `logo` → the italic Freight Display wordmark fills the cell instead of an image.",
      },
    },
  },
};

export const WithoutLink: Story = {
  args: {
    sponsor: {
      id: "s-3",
      name: "Tuinaanleg De Smet",
      logo: fixtureImage("sponsor-logo", 2),
      tier: "sympathisant",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "No `url` → the tile renders as a static cell with no link wrapper.",
      },
    },
  },
};

export const Framed: Story = {
  args: {
    sponsor: {
      id: "s-4",
      name: "Apotheek Dilbeek",
      logo: fixtureImage("sponsor-logo", 1),
      url: "https://example.com/apotheek",
      tier: "sponsor",
    },
    framed: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "`framed` → the `/sponsors` merged-wall variant: a 1.5px ink border + light ink-muted offset shadow that presses down on hover. One step lighter than the hoofd tiles.",
      },
    },
  },
};
