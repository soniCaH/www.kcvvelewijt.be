import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { SponsorHero } from "./SponsorHero";

const meta = {
  title: "Features/Sponsors/SponsorHero",
  component: SponsorHero,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'The `/sponsors` split hero (7.d2). Left column: MonoLabel kicker + EditorialHeading "Merci aan onze sponsors." + italic-display lead. Right column: the single `<FeaturedSponsorCard>` marquee. With no featured sponsor the left column spans full width and no card renders.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SponsorHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Split hero with the featured marquee card on the right. */
export const Featured: Story = {
  args: {
    featured: {
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

/** No featured sponsor → the headline spans the full width (no card). */
export const Collapsed: Story = {
  args: { featured: null },
};

/** Mobile viewport — the split stacks to a single column. */
export const MobileViewport: Story = {
  args: Featured.args,
  globals: { viewport: { value: "kcvvMobile" } },
};
