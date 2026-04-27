import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import OverviewDoc from "./Overview.mdx";

// CSF wrapper that renders the sibling Foundation/*.mdx as a story so the VR
// test-runner can baseline it — `@storybook/test-runner` filters out
// type=docs entries (see PRD §12 Phase 2 + apps/web/CLAUDE.md → Visual
// Regression Testing). The MDX file is excluded from the Storybook stories
// glob (apps/web/.storybook/main.ts) and consumed only via this import.

const meta = {
  title: "Foundation/Overview",
  tags: ["vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => <OverviewDoc />,
};
