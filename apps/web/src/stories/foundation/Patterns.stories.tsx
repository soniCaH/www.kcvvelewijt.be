import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PatternsDoc from "./Patterns.mdx";

// MDX-as-story wrapper — see Overview.stories.tsx for the rationale.

const meta = {
  title: "Foundation/Patterns",
  tags: ["vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => <PatternsDoc />,
};
