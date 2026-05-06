import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorialByline } from "./EditorialByline";

const meta = {
  title: "UI/EditorialByline",
  component: EditorialByline,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialByline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { author: "Tom Janssens" },
};

export const Default: Story = {
  args: {},
};

export const NamedAuthor: Story = {
  args: { author: "Tom Janssens" },
};
