import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SharePage } from "./SharePage";

const meta = {
  title: "Pages/Share",
  component: SharePage,
  parameters: {
    layout: "fullscreen",
  },
  // Page-level composition for the /share route — not VR-tagged (page coverage
  // is the Playwright e2e suite's job). Its constituent Features/Share/* image
  // templates are each individually vr-tagged.
  tags: ["autodocs"],
} satisfies Meta<typeof SharePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPPONENT_CREST = "/images/logo-flat.png";

export const Default: Story = {
  args: {
    matches: [
      {
        id: 1001,
        label: "KCVV Elewijt - Eppegem (A-Ploeg)",
        matchName: "KCVV Elewijt — Eppegem",
        competition: "2e Provinciale",
        dateTime: "Zaterdag · 20:00",
        awayLogo: OPPONENT_CREST,
      },
      {
        id: 1002,
        label: "Sporting Hasselt - KCVV Elewijt (A-Ploeg)",
        matchName: "Sporting Hasselt — KCVV Elewijt",
        competition: "Beker van Vlaanderen",
        dateTime: "Zondag · 15:00",
        homeLogo: OPPONENT_CREST,
      },
    ],
    players: [
      {
        id: "p1",
        firstName: "Jan",
        lastName: "Janssen",
        number: 14,
        celebrationImageUrl: "/images/ultras.jpg",
      },
      { id: "p2", firstName: "Piet", lastName: "Pieters", number: 9 },
      { id: "p3", firstName: "Ali", lastName: "Zengin", number: 7 },
    ],
  },
};
