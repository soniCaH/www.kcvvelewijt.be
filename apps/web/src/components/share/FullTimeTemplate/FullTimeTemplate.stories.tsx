import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FullTimeTemplate } from "./FullTimeTemplate";

const meta = {
  title: "Features/Share/FullTimeTemplate",
  component: FullTimeTemplate,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FullTimeTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

// Placeholder opponent crest for Storybook (real value: away_team.logo).
const OPPONENT_CREST = "/images/logo-flat.png";

export const Win: Story = {
  args: {
    matchName: "KCVV Elewijt — Eppegem",
    score: "3 - 1",
    mood: "win",
    competition: "2e Provinciale",
    awayLogo: OPPONENT_CREST,
  },
};

export const Draw: Story = {
  args: {
    matchName: "KCVV Elewijt — Sporting Hasselt",
    score: "2 - 2",
    mood: "draw",
    competition: "2e Provinciale",
    awayLogo: OPPONENT_CREST,
  },
};

export const Loss: Story = {
  args: {
    matchName: "Sporting Hasselt — KCVV Elewijt",
    score: "3 - 1",
    mood: "loss",
    competition: "2e Provinciale",
    homeLogo: OPPONENT_CREST,
  },
};

export const WinWithImage: Story = {
  args: {
    matchName: "KCVV Elewijt — Eppegem",
    score: "3 - 1",
    mood: "win",
    competition: "2e Provinciale",
    imageUrl: "/images/ultras.jpg",
  },
};
