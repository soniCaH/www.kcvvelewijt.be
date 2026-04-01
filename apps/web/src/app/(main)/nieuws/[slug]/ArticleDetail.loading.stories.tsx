import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ArticleDetailLoading from "./loading";

const meta = {
  title: "Pages/News/ArticleDetailSkeleton",
  component: ArticleDetailLoading,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ArticleDetailLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
