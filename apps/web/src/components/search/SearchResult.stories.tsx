/**
 * SearchResult Storybook Stories
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchResult } from "./SearchResult";

const meta = {
  title: "Features/Search/SearchResult",
  component: SearchResult,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SearchResult>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Article result with image and tags
 */
export const Article: Story = {
  args: {
    result: {
      id: "1",
      type: "article",
      title: "KCVV Elewijt wint belangrijke wedstrijd",
      description:
        "In een spannende wedstrijd heeft KCVV Elewijt met 3-2 gewonnen van de tegenstander. De goals kwamen van De Bruyne, Lukaku en Hazard.",
      url: "/nieuws/kcvv-elewijt-wint-belangrijke-wedstrijd",
      imageUrl: "https://placehold.co/400x300/4acf52/ffffff?text=Match+Win",
      tags: ["A-ploeg", "Wedstrijdverslag", "Overwinning"],
      date: "2026-01-15T10:00:00Z",
    },
  },
};

/**
 * Article without image
 */
export const ArticleNoImage: Story = {
  args: {
    result: {
      id: "2",
      type: "article",
      title: "Trainingsschema aangepast voor winterperiode",
      description:
        "Wegens de koude temperaturen is het trainingsschema aangepast. Alle teams trainen nu binnen.",
      url: "/nieuws/trainingsschema-aangepast",
      tags: ["Training", "Algemeen"],
      date: "2026-01-10T14:30:00Z",
    },
  },
};

/**
 * Player result with image
 */
export const Player: Story = {
  args: {
    result: {
      id: "3",
      type: "player",
      title: "John De Ron",
      description: "Doelman",
      url: "/spelers/john-de-ron",
      imageUrl: "https://placehold.co/200x200/4acf52/ffffff?text=JDR",
    },
  },
};

/**
 * Player without image
 */
export const PlayerNoImage: Story = {
  args: {
    result: {
      id: "4",
      type: "player",
      title: "Kevin Van Ransbeeck",
      description: "Verdediger",
      url: "/spelers/kevin-van-ransbeeck",
    },
  },
};

/**
 * Team result with image
 */
export const Team: Story = {
  args: {
    result: {
      id: "5",
      type: "team",
      title: "A-Ploeg",
      description: "3e Provinciale",
      url: "/team/a-ploeg",
      imageUrl: "https://placehold.co/200x200/4acf52/ffffff?text=A",
    },
  },
};

/**
 * Team without image
 */
export const TeamNoImage: Story = {
  args: {
    result: {
      id: "6",
      type: "team",
      title: "U15",
      url: "/team/u15",
    },
  },
};
