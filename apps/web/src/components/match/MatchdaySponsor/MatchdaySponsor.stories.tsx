import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { MatchdaySponsor } from "./MatchdaySponsor";

// No `vr` tag yet: visited and axe-checked, no pixel baseline.
const meta = {
  title: "Features/Matches/MatchdaySponsor",
  component: MatchdaySponsor,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    sponsor: {
      id: "sponsor-1",
      name: "Alupoort",
      url: "https://www.alupoort.be",
      logoUrl: fixtureImage("sponsor-logo", 0),
    },
  },
} satisfies Meta<typeof MatchdaySponsor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutLogoOrLink: Story = {
  args: {
    sponsor: { id: "sponsor-2", name: "Bar-a-Vis", url: null, logoUrl: null },
  },
};
