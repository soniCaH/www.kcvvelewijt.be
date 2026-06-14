/**
 * SearchPreSearchCard Storybook Stories
 *
 * The `/zoeken` pre-search state (8s4 E2): football-voice prompt + type hints,
 * shown while the query is shorter than 2 characters.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchPreSearchCard } from "./SearchPreSearchCard";

const meta = {
  title: "Features/Search/SearchPreSearchCard",
  component: SearchPreSearchCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SearchPreSearchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default pre-search prompt with the three mono type-hint chips.
 */
export const Default: Story = {};
