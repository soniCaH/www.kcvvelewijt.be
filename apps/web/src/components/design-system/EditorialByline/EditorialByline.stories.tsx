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

// Named author — renders the inline 24px monogram chip ("T") to the
// left of "Door Tom Janssens" per 5.d-col.
export const NamedAuthor: Story = {
  args: { author: "Tom Janssens" },
};

// Variety check: monogram derivation cycles through letters of the
// alphabet so the disc + initial render consistently across names.
export const MonogramVariety: Story = {
  args: { author: "Anouk De Wit" },
};
