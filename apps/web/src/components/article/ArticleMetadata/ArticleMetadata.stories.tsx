import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArticleMetadata } from "./ArticleMetadata";

const meta = {
  title: "Features/Articles/ArticleMetadata",
  component: ArticleMetadata,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Design §7.6 article metadata bar: single row, 1px kcvv-gray-light rules top + bottom, mono small-caps facts cluster on the left, Share2 + Facebook icons on the right.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    author: { control: "text" },
    date: { control: "text" },
    readingTime: { control: "text" },
  },
} satisfies Meta<typeof ArticleMetadata>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    author: "Redactie KCVV",
    date: "19.04.2026",
    readingTime: "4 min lezen",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/belangrijke-overwinning",
    },
  },
};

export const WithoutReadingTime: Story = {
  args: {
    author: "Redactie KCVV",
    date: "19.04.2026",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/belangrijke-overwinning",
    },
  },
};

export const WithoutShare: Story = {
  args: {
    author: "Redactie KCVV",
    date: "19.04.2026",
    readingTime: "4 min lezen",
  },
};

export const AuthorOnly: Story = {
  args: {
    author: "Redactie KCVV",
  },
};
