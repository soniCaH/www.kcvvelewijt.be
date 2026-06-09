import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BoardCtaBand } from "./BoardCtaBand";

const meta = {
  title: "Features/Club/BoardCtaBand",
  component: BoardCtaBand,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BoardCtaBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
