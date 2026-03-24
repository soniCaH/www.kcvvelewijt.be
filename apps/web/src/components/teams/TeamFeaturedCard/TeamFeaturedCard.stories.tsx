import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamFeaturedCard } from "./TeamFeaturedCard";

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
      tagline: null,
      teamImageUrl: "https://picsum.photos/800/600",
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
      tagline: null,
      teamImageUrl: null,
      staff: null,
    },
    label: "Tweede ploeg",
  },
};
