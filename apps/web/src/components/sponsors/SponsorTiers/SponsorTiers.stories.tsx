import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { SponsorTiers } from "./SponsorTiers";
import type { Sponsor } from "../Sponsors";

const hoofd: Sponsor[] = [
  {
    id: "h1",
    name: "Garage Peeters",
    logo: fixtureImage("sponsor-logo", 0),
    url: "https://example.com/peeters",
    tier: "hoofdsponsor",
  },
  {
    id: "h2",
    name: "Bouwwerken Van Assche",
    logo: fixtureImage("sponsor-logo", 1),
    url: "https://example.com/vanassche",
    tier: "hoofdsponsor",
  },
  {
    id: "h3",
    name: "Immo Zennevallei",
    logo: "",
    url: "https://example.com/zennevallei",
    tier: "hoofdsponsor",
  },
];

const wall: Sponsor[] = [
  {
    id: "w1",
    name: "Apotheek Dilbeek",
    logo: fixtureImage("sponsor-logo", 2),
    url: "https://example.com/apotheek",
    tier: "sponsor",
  },
  {
    id: "w2",
    name: "Frituur 't Pleintje",
    logo: fixtureImage("sponsor-logo", 3),
    tier: "sponsor",
  },
  {
    id: "w3",
    name: "Tuinaanleg De Smet",
    logo: fixtureImage("sponsor-logo", 4),
    url: "https://example.com/desmet",
    tier: "sympathisant",
  },
  { id: "w4", name: "Slagerij Janssens", logo: "", tier: "sympathisant" },
  {
    id: "w5",
    name: "Café De Hoek",
    logo: fixtureImage("sponsor-logo", 5),
    tier: "sympathisant",
  },
];

const meta = {
  title: "Features/Sponsors/SponsorTiers",
  component: SponsorTiers,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The `/sponsors` body (7.d3): a labelled Hoofdsponsors group (MonoLabel kicker + paper-edge rule + large taped tiles) over one unlabelled merged wall of `sponsor` + `sympathisant` + untiered sponsors. Empty branches collapse: 0 hoofd → wall only; 0 wall → hoofd only.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto w-full max-w-5xl px-4 py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SponsorTiers>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Both tiers: labelled hoofd grid + unlabelled wall. */
export const Both: Story = {
  args: { sponsors: [...hoofd, ...wall] },
};

/** No wall — only hoofdsponsors render. */
export const HoofdOnly: Story = {
  args: { sponsors: hoofd },
};

/** No hoofdsponsors — only the unlabelled wall renders. */
export const WallOnly: Story = {
  args: { sponsors: wall },
};
