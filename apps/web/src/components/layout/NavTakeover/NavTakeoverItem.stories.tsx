import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NavTakeoverItem } from "./NavTakeoverItem";

const meta = {
  title: "UI/NavTakeover/Item",
  component: NavTakeoverItem,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[400px] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NavTakeoverItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Leaf: Story = {
  args: { label: "Home", href: "/" },
};

export const Submenu: Story = {
  args: { label: "Teams", hasSubmenu: true },
};

export const Active: Story = {
  args: { label: "Nieuws", href: "/nieuws", active: true },
};
