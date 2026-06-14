/**
 * SearchNoResultsCard Storybook Stories
 *
 * The `/zoeken` no-results state (8s4 E2, copy 8s4.1): taped jersey artefact +
 * "Geen treffers." + a body line naming the query and inline way-forward links.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchNoResultsCard } from "./SearchNoResultsCard";

const meta = {
  title: "Features/Search/SearchNoResultsCard",
  component: SearchNoResultsCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SearchNoResultsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Short query — the missing term is named inline.
 */
export const Default: Story = {
  args: {
    query: "elewijt",
  },
};

/**
 * A longer query, to check the body line wraps cleanly.
 */
export const LongQuery: Story = {
  args: {
    query: "kampioenschap tweede provinciale b",
  },
};
