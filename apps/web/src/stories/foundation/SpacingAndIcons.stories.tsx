import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpacingAndIconsDoc from "./SpacingAndIcons.mdx";

// MDX-as-story wrapper — see Overview.stories.tsx for the rationale.

const meta = {
  title: "Foundation/Spacing & Icons",
  tags: ["vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => <SpacingAndIconsDoc />,
};
