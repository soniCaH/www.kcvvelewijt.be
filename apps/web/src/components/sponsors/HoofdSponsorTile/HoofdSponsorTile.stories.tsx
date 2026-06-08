import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { HoofdSponsorTile } from "./HoofdSponsorTile";

const meta = {
  title: "Features/Sponsors/HoofdSponsorTile",
  component: HoofdSponsorTile,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Large taped tile for the labelled Hoofdsponsors group on `/sponsors` (7.d3). Cream-soft `<TapedCard>` with a greyscale logo (colour on hover/focus) or italic-name fallback, over an italic-display name caption. Links out with a jersey-deep focus ring + canonical press-down when `url` is present.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-64 p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HoofdSponsorTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLogo: Story = {
  args: {
    sponsor: {
      id: "h-1",
      name: "Garage Peeters",
      logo: fixtureImage("sponsor-logo", 0),
      url: "https://example.com/peeters",
      tier: "hoofdsponsor",
    },
  },
};

export const NoLogoFallback: Story = {
  args: {
    sponsor: {
      id: "h-2",
      name: "Bouwwerken Van Assche",
      logo: "",
      url: "https://example.com/vanassche",
      tier: "hoofdsponsor",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "No `logo` → the italic wordmark fills the logo slot (and repeats as the caption).",
      },
    },
  },
};

export const WithoutLink: Story = {
  args: {
    sponsor: {
      id: "h-3",
      name: "Immo Zennevallei",
      logo: fixtureImage("sponsor-logo", 1),
      tier: "hoofdsponsor",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "No `url` → a static taped tile with no link wrapper and no press-down.",
      },
    },
  },
};
