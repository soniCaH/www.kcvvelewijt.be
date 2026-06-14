/**
 * SearchMasthead Storybook Stories
 *
 * The softened-S3 `/zoeken` dark masthead band (8s1). Rendered with a live
 * `<SearchForm>` slot so the field-on-dark composition is visible.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SearchMasthead } from "./SearchMasthead";
import { SearchForm } from "./SearchForm";

const meta = {
  title: "Features/Search/SearchMasthead",
  component: SearchMasthead,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
  args: {
    children: <SearchForm onSearch={fn()} />,
  },
} satisfies Meta<typeof SearchMasthead>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default masthead — empty field, no hint line (the `/zoeken` composition;
 * guidance lives in the pre-search card below the band).
 */
export const Default: Story = {};

/**
 * Optional hint line — opted into via the `hint` prop.
 */
export const WithHint: Story = {
  args: {
    hint: "Typ minstens 2 letters",
  },
};

/**
 * Masthead with a populated query (clear affordance visible).
 */
export const WithQuery: Story = {
  args: {
    children: <SearchForm onSearch={fn()} initialValue="elewijt" />,
  },
};
