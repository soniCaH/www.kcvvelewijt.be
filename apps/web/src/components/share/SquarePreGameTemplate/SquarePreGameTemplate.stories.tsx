import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SquarePreGameTemplate } from "./SquarePreGameTemplate";

const meta = {
  title: "Features/Share/SquarePreGameTemplate",
  component: SquarePreGameTemplate,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SquarePreGameTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

// Placeholder opponent crest for Storybook (real value: away_team.logo).
const OPPONENT_CREST = "/images/logo-flat.png";

export const NoImage: Story = {
  args: {
    matchName: "KCVV Elewijt — Eppegem",
    competition: "2e Provinciale",
    dateTime: "Zaterdag · 20:00",
    awayLogo: OPPONENT_CREST,
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
