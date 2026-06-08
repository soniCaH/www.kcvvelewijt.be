import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { FeaturedSponsorCard } from "./FeaturedSponsorCard";

const meta = {
  title: "Features/Sponsors/FeaturedSponsorCard",
  component: FeaturedSponsorCard,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'The single "In de kijker" marquee card in the `/sponsors` hero (7.d5 F3). A jersey-deep banner tab over a cream-soft body: logo inset (or italic-name fallback) → italic-display name → optional ~3-line `description` blurb → mono "Bezoek website ↗" when a `url` is present. When linked, the whole card presses down on hover (canonical paper-stamp).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[340px] p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FeaturedSponsorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sponsor: {
      id: "s-1",
      name: "Garage Peeters",
      logo: fixtureImage("sponsor-logo", 0),
      url: "https://example.com/peeters",
      tier: "hoofdsponsor",
      featured: true,
      description:
        "Hoofdsponsor sinds dag één — leverde de wedstrijdballen voor het hele seizoen.",
    },
  },
};

export const NoLogo: Story = {
  args: {
    sponsor: {
      id: "s-2",
      name: "Bouwwerken Van Assche",
      logo: "",
      url: "https://example.com/vanassche",
      tier: "hoofdsponsor",
      featured: true,
      description: "Vernieuwde de kleedkamers in de zomerstop.",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "No `logo` → the italic-display name fills the logo inset (and repeats as the caption below).",
      },
    },
  },
};

export const NoBlurb: Story = {
  args: {
    sponsor: {
      id: "s-3",
      name: "Frituur 't Pleintje",
      logo: fixtureImage("sponsor-logo", 1),
      url: "https://example.com/pleintje",
      tier: "sponsor",
      featured: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "No `description` → the blurb line is omitted and the card shrinks.",
      },
    },
  },
};

export const NoLink: Story = {
  args: {
    sponsor: {
      id: "s-4",
      name: "Immo Zennevallei",
      logo: fixtureImage("sponsor-logo", 2),
      tier: "hoofdsponsor",
      featured: true,
      description: "Steunt de jeugdwerking al meer dan tien seizoenen.",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'No `url` → the card renders statically: no link wrapper, no press-down, no "Bezoek website ↗".',
      },
    },
  },
};
