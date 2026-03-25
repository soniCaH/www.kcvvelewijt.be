/**
 * SearchResults Storybook Stories
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchResults } from "./SearchResults";

const meta = {
  title: "Features/Search/SearchResults",
  component: SearchResults,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockResults = [
  {
    id: "1",
    type: "article" as const,
    title: "KCVV Elewijt wint belangrijke wedstrijd",
    description:
      "In een spannende wedstrijd heeft KCVV Elewijt met 3-2 gewonnen.",
    url: "/nieuws/kcvv-elewijt-wint",
    imageUrl: "https://placehold.co/400x300/4acf52/ffffff?text=Match",
    tags: ["A-ploeg", "Wedstrijdverslag"],
    date: "2026-01-15T10:00:00Z",
  },
  {
    id: "2",
    type: "player" as const,
    title: "John De Ron",
    description: "Doelman",
    url: "/spelers/john-de-ron",
    imageUrl: "https://placehold.co/200x200/4acf52/ffffff?text=JDR",
  },
  {
    id: "3",
    type: "team" as const,
    title: "A-Ploeg",
    url: "/team/a-ploeg",
    imageUrl: "https://placehold.co/200x200/4acf52/ffffff?text=A",
  },
];

/**
 * Multiple results of different types
 */
export const MultipleResults: Story = {
  args: {
    results: mockResults,
    query: "KCVV",
    activeType: "all",
  },
};

/**
 * Only article results
 */
export const ArticlesOnly: Story = {
  args: {
    results: [mockResults[0]],
    query: "wedstrijd",
    activeType: "article",
  },
};

/**
 * Only player results
 */
export const PlayersOnly: Story = {
  args: {
    results: [mockResults[1]],
    query: "john",
    activeType: "player",
  },
};

/**
 * Only team results
 */
export const TeamsOnly: Story = {
  args: {
    results: [mockResults[2]],
    query: "a-ploeg",
    activeType: "team",
  },
};

/**
 * No results (empty state)
 */
export const NoResults: Story = {
  args: {
    results: [],
    query: "nonexistent",
    activeType: "all",
  },
};

/**
 * Single result
 */
export const SingleResult: Story = {
  args: {
    results: [mockResults[0]],
    query: "wedstrijd",
    activeType: "all",
  },
};
