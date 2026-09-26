import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TeamsLoading from "./loading";

// This file cannot be imported under the Storybook Vitest addon's browser
// project (#3146) — see the exclusion + explanation in
// `vitest.storybook.config.ts`. A story-level `!test` tag cannot fix this:
// the crash happens while IMPORTING the module itself (before any tag can
// be read), so exclusion has to happen at the Vitest file-discovery level
// instead.
const meta = {
  title: "Pages/Teams/TeamsLandingSkeleton",
  component: TeamsLoading,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TeamsLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
