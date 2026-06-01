import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamFeaturedCard } from "./TeamFeaturedCard";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Teams/TeamFeaturedCard",
  component: TeamFeaturedCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof TeamFeaturedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhoto: Story = {
  args: {
    team: {
      _id: "b-team",
      name: "KCVV Elewijt B",
      slug: "kcvv-elewijt-b",
      age: "B",
      division: "4C",
      divisionFull: "4de Provinciale C",
      season: null,
      tagline: null,
      teamImageUrl: fixtureImage("team-group", 0),
      staff: null,
    },
    label: "Tweede ploeg",
  },
};

export const WithoutPhoto: Story = {
  args: {
    team: {
      _id: "b-team",
      name: "KCVV Elewijt B",
      slug: "kcvv-elewijt-b",
      age: "B",
      division: "4C",
      divisionFull: "4de Provinciale C",
      season: null,
      tagline: null,
      teamImageUrl: null,
      staff: null,
    },
    label: "Tweede ploeg",
  },
};
