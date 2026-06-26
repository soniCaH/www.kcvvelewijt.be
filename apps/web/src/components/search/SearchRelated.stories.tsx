/**
 * SearchRelated Storybook Stories
 *
 * The `/zoeken` low-confidence semantic fallback (8s5 / ZOEK-3): a plain
 * "Gerelateerd" list of related links shown BELOW the lexical results when the
 * top semantic score is too weak for an LLM answer (0.35–0.5).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchRelated } from "./SearchRelated";

const meta = {
  title: "Features/Search/SearchRelated",
  component: SearchRelated,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SearchRelated>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        type: "article",
        title: "Jeugddag groot succes",
        excerpt: "Sfeerverslag van de open trainingen.",
        href: "/nieuws/jeugddag",
      },
      {
        type: "page",
        title: "Onze jeugdvisie",
        excerpt: "Hoe we ploegen samenstellen.",
        href: "/club/jeugdvisie",
      },
      {
        type: "responsibility",
        title: "Hoe schrijf ik mijn kind in?",
        excerpt: "De stappen om lid te worden.",
        href: "/hulp#inschrijven",
      },
    ],
  },
};
