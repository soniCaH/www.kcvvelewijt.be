import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { ShareItem } from "../looks/share-content";
import { SharePage } from "./SharePage";

const meta = {
  title: "Pages/Share",
  component: SharePage,
  parameters: {
    layout: "fullscreen",
  },
  // The tool is a fixed full-screen layer (#3538); the transform makes this
  // box its containing block, so it stays inside its slot on the docs page.
  decorators: [
    (Story) => (
      <div style={{ height: "100dvh", transform: "translateZ(0)" }}>
        <Story />
      </div>
    ),
  ],
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
        kcvvTeamLabel: "A-Ploeg",
      },
      {
        id: 1002,
        label: "Sporting Hasselt - KCVV Elewijt (A-Ploeg)",
        matchName: "Sporting Hasselt — KCVV Elewijt",
        competition: "Beker van Vlaanderen",
        dateTime: "Zondag · 15:00",
        homeLogo: OPPONENT_CREST,
        kcvvTeamLabel: "A-Ploeg",
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

const ARTICLES: ShareItem[] = [
  {
    kind: "article",
    slug: "interview-jan",
    type: "interview",
    title: "Jan over zijn eerste seizoen",
    spans: [
      { text: "Jan over zijn ", accent: false },
      { text: "eerste seizoen", accent: true },
    ],
    date: "vrijdag 17 oktober",
    time: "",
    location: "",
    day: "17",
    month: "okt",
    cover: null,
  },
  {
    kind: "article",
    slug: "kantine",
    type: "announcement",
    title: "Nieuwe kantine open",
    spans: [{ text: "Nieuwe kantine open", accent: false }],
    date: "zaterdag 18 oktober",
    time: "",
    location: "",
    day: "18",
    month: "okt",
    cover: null,
  },
];

/** A deep link to an unknown article: the tool opens on Inhoud, picker first. */
export const InhoudPicker: Story = {
  args: {
    ...Default.args,
    articles: ARTICLES,
    initial: { kind: "article", item: null },
  },
};

/** Opens one tab of the bottom bar, so the a11y check reads its panel. */
const withTab = (name: "Inhoud" | "Stijl" | "Tekst" | "Schik"): Story => ({
  args: Default.args,
  play: async ({ canvasElement }) => {
    const tab = within(canvasElement).getByRole("button", { name });
    if (tab.getAttribute("aria-expanded") !== "true")
      await userEvent.click(tab);
    await expect(
      within(canvasElement).getByRole("region", { name }),
    ).toBeVisible();
  },
});

export const InhoudTab = withTab("Inhoud");
export const StijlTab = withTab("Stijl");
export const TekstTab = withTab("Tekst");
export const SchikTab = withTab("Schik");
