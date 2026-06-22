import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KickoffTemplate } from "./KickoffTemplate";

const meta = {
  title: "Features/Share/KickoffTemplate",
  component: KickoffTemplate,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof KickoffTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

// `/images/logo-flat.png` stands in for the opponent crest in Storybook —
// in the app this comes from the selected match's `away_team.logo`.
const OPPONENT_CREST = "/images/logo-flat.png";

export const NoImage: Story = {
  args: {
    matchName: "KCVV Elewijt — Eppegem",
    competition: "2e Provinciale",
    dateTime: "Zaterdag · 20:00 · Terrein A",
    awayLogo: OPPONENT_CREST,
  },
};

export const NoOpponentCrest: Story = {
  args: {
    matchName: "KCVV Elewijt — Eppegem",
    competition: "2e Provinciale",
    dateTime: "Zaterdag · 20:00 · Terrein A",
  },
};

export const WithImage: Story = {
  args: {
    matchName: "KCVV Elewijt — Eppegem",
    competition: "2e Provinciale",
    dateTime: "Zaterdag · 20:00",
    imageUrl: "/images/ultras.jpg",
  },
};

export const AwayMatch: Story = {
  args: {
    matchName: "Sporting Hasselt — KCVV Elewijt",
    competition: "Beker van Vlaanderen",
    dateTime: "Zondag · 15:00",
    homeLogo: OPPONENT_CREST,
  },
};
