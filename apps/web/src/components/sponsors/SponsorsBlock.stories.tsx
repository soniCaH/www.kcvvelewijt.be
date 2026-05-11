import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Sponsors, type Sponsor } from "./Sponsors";
import { fixtureImage } from "@test-fixtures/images";

/**
 * SponsorsBlock is an async server component that fetches sponsors from Sanity
 * and renders the Sponsors presentational component. This story exercises the
 * Sponsors component directly with representative fixture data.
 */
const meta = {
  title: "Features/Sponsors/Sponsors",
  component: Sponsors,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    columns: {
      control: { type: "select" },
      options: [2, 3, 4, 5, 6],
      description: "Number of columns in the sponsor grid",
    },
    variant: {
      control: { type: "select" },
      options: ["light", "dark"],
      description: "Theme variant",
    },
  },
} satisfies Meta<typeof Sponsors>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSponsors: Sponsor[] = [
  {
    id: "sponsor-1",
    name: "Bakkerij Peeters",
    logo: fixtureImage("sponsor-logo", 0),
    url: "https://example.com/bakkerij",
  },
  {
    id: "sponsor-2",
    name: "Garage Willems",
    logo: fixtureImage("sponsor-logo", 1),
    url: "https://example.com/garage",
  },
  {
    id: "sponsor-3",
    name: "Slagerij De Smet",
    logo: fixtureImage("sponsor-logo", 2),
  },
  {
    id: "sponsor-4",
    name: "Elektro Janssens",
    logo: fixtureImage("sponsor-logo", 3),
    url: "https://example.com/elektro",
  },
  {
    id: "sponsor-5",
    name: "Apotheek Centrum",
    logo: fixtureImage("sponsor-logo", 4),
    url: "https://example.com/apotheek",
  },
  {
    id: "sponsor-6",
    name: "Tuincentrum Groen",
    logo: fixtureImage("sponsor-logo", 5),
  },
];

/**
 * Default sponsor block with a full list of sponsors
 */
export const Default: Story = {
  args: {
    sponsors: mockSponsors,
  },
};

/**
 * Empty sponsor list — renders nothing
 */
export const Empty: Story = {
  args: {
    sponsors: [],
  },
};

/**
 * Loading state simulation — uses a skeleton-like appearance via minimal data
 */
export const Loading: Story = {
  args: {
    sponsors: Array.from({ length: 4 }, (_, i) => ({
      id: `skeleton-${i}`,
      name: " ",
      logo: fixtureImage("sponsor-logo", i),
    })),
    title: "Onze sponsors",
    description: "Laden...",
  },
};
