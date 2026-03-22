import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CategoryFilters } from "./CategoryFilters";

const meta = {
  title: "Features/Articles/CategoryFilters",
  component: CategoryFilters,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    activeCategory: {
      control: "text",
      description: "Slug of the currently active category",
    },
    renderAsLinks: {
      control: "boolean",
      description: "Render as links (true) or buttons (false)",
    },
  },
} satisfies Meta<typeof CategoryFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Storybook wrapper that renders CategoryFilters with local, interactive category state.
 *
 * This component initializes the active category from `props.activeCategory` (or `"all"` if not provided), keeps it in local state, and passes an `onChange` handler that updates that state. It also forces `renderAsLinks` to `false` while forwarding all other props to `CategoryFilters`.
 *
 * @param props - Props forwarded to `CategoryFilters`; `activeCategory` is used as the initial selected category.
 * @returns The `CategoryFilters` element wired for interactive state updates within Storybook.
 */
function InteractiveCategoryFilters(
  props: React.ComponentProps<typeof CategoryFilters>,
) {
  const [activeCategory, setActiveCategory] = useState(
    props.activeCategory || "all",
  );

  return (
    <CategoryFilters
      {...props}
      activeCategory={activeCategory}
      renderAsLinks={false}
      onChange={setActiveCategory}
    />
  );
}

const mockCategories = [
  {
    id: "1",
    attributes: { name: "Wedstrijdverslagen", slug: "wedstrijdverslagen" },
  },
  { id: "2", attributes: { name: "Clubnieuws", slug: "clubnieuws" } },
  { id: "3", attributes: { name: "Evenementen", slug: "evenementen" } },
  { id: "4", attributes: { name: "Jeugd", slug: "jeugd" } },
];

const manyCategories = [
  ...mockCategories,
  { id: "5", attributes: { name: "Senioren", slug: "senioren" } },
  { id: "6", attributes: { name: "Dames", slug: "dames" } },
  { id: "7", attributes: { name: "G-Voetbal", slug: "g-voetbal" } },
  { id: "8", attributes: { name: "Transfers", slug: "transfers" } },
  { id: "9", attributes: { name: "Bestuur", slug: "bestuur" } },
  { id: "10", attributes: { name: "Sponsors", slug: "sponsors" } },
  { id: "11", attributes: { name: "Algemeen", slug: "algemeen" } },
  { id: "12", attributes: { name: "Toernooien", slug: "toernooien" } },
];

export const Default: Story = {
  render: (args) => <InteractiveCategoryFilters {...args} />,
  args: {
    categories: mockCategories,
  },
};

export const ActiveCategory: Story = {
  render: (args) => <InteractiveCategoryFilters {...args} />,
  args: {
    categories: mockCategories,
    activeCategory: "clubnieuws",
  },
};

export const ManyCategories: Story = {
  render: (args) => <InteractiveCategoryFilters {...args} />,
  args: {
    categories: manyCategories,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const Empty: Story = {
  render: (args) => <InteractiveCategoryFilters {...args} />,
  args: {
    categories: [],
  },
};
