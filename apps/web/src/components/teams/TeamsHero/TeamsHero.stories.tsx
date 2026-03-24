import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamsHero } from "./TeamsHero";

const meta = {
  title: "Features/Teams/TeamsHero",
  component: TeamsHero,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TeamsHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhoto: Story = {
  args: {
    team: {
      _id: "a-team",
      name: "KCVV Elewijt A",
      slug: "kcvv-elewijt-a",
      age: "A",
      division: "3B",
      divisionFull: "3de Provinciale B",
      tagline: null,
      teamImageUrl: "https://picsum.photos/1600/900",
      staff: null,
    },
  },
};

export const WithoutPhoto: Story = {
  args: {
    team: {
      _id: "a-team",
      name: "KCVV Elewijt A",
      slug: "kcvv-elewijt-a",
      age: "A",
      division: "3B",
      divisionFull: "3de Provinciale B",
      tagline: null,
      teamImageUrl: null,
      staff: null,
    },
  },
};
