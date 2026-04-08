import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  QuestionCardSkeleton,
  QuestionCardSkeletonGrid,
} from "./QuestionCardSkeleton";

const meta = {
  title: "Features/Hulp/QuestionCardSkeleton",
  component: QuestionCardSkeletonGrid,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof QuestionCardSkeletonGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCard: Story = {
  render: () => (
    <div className="max-w-md">
      <QuestionCardSkeleton />
    </div>
  ),
};

export const Grid: Story = {
  args: { count: 4 },
};

export const SmallGrid: Story = {
  args: { count: 2 },
};

export const LargeGrid: Story = {
  args: { count: 6 },
};
