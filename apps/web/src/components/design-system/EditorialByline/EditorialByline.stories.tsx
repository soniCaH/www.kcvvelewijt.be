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

// Fallback path — no author supplied. Byline reads "Door redactie";
// monogram chip skipped (no chip for the generic editorial signature
// per the 5.d-col lock).
export const Default: Story = {
  args: {},
};

// Named author — renders the inline 24px monogram chip ("T") to the
// left of "Door Tom Janssens" per 5.d-col.
export const NamedAuthor: Story = {
  args: { author: "Tom Janssens" },
};

// Edge: whitespace-only author behaves like missing author — chip
// skips, byline falls back to "Door redactie".
export const WhitespaceAuthor: Story = {
  args: { author: "   " },
};

// Variety check: monogram derivation cycles through letters of the
// alphabet so the disc + initial render consistently across names.
export const MonogramVariety: Story = {
  args: { author: "Anouk De Wit" },
};
