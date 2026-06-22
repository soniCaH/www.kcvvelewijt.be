import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HalftimeTemplate } from "./HalftimeTemplate";

const meta = {
  title: "Features/Share/HalftimeTemplate",
  component: HalftimeTemplate,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof HalftimeTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

// Placeholder opponent crest for Storybook (real value: away_team.logo).
const OPPONENT_CREST = "/images/logo-flat.png";

export const NoImage: Story = {
  args: {
    matchName: "KCVV Elewijt — Eppegem",
    score: "2 - 0",
    competition: "2e Provinciale",
    awayLogo: OPPONENT_CREST,
  },
};

export const WithImage: Story = {
  args: {
    matchName: "KCVV Elewijt — Eppegem",
    score: "2 - 0",
    competition: "2e Provinciale",
    imageUrl: "/images/ultras.jpg",
  },
};

export const Trailing: Story = {
  args: {
    matchName: "Sporting Hasselt — KCVV Elewijt",
    score: "0 - 1",
    competition: "2e Provinciale",
    homeLogo: OPPONENT_CREST,
  },
};
