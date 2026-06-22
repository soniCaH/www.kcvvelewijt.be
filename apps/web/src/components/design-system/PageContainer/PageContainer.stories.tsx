import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageContainer } from "./PageContainer";

const meta = {
  title: "UI/PageContainer",
  component: PageContainer,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const Demo = ({ label }: { label: string }) => (
  <div className="border-ink bg-cream-soft text-ink border-2 px-6 py-10 text-center font-mono text-sm">
    {label}
  </div>
);

export const Default: Story = {
  args: {
    children: (
      <Demo label="width=default · 1040px (--container-wide) · detail / single-subject pages" />
    ),
  },
};

export const Index: Story = {
  args: {
    width: "index",
    children: (
      <Demo label="width=index · 1280px (--container-index) · card-grid listings + homepage" />
    ),
  },
};

export const Prose: Story = {
  args: {
    width: "prose",
    children: (
      <Demo label="width=prose · 680px (--container-prose) · reading column, forms, legal" />
    ),
  },
};
