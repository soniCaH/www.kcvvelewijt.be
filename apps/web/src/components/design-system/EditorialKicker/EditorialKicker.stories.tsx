import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorialKicker } from "./EditorialKicker";

const meta = {
  title: "UI/EditorialKicker",
  component: EditorialKicker,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialKicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    items: [
      { label: "INTERVIEW" },
      { label: "8 MIN" },
      { label: "06 MEI 2026" },
    ],
  },
};

export const Default: Story = {
  args: {
    items: [{ label: "ANNOUNCEMENT" }, { label: "06 MEI 2026" }],
  },
};

export const TwoItems: Story = {
  args: {
    items: [{ label: "TRANSFER" }, { label: "INCOMING" }],
  },
};

export const FourItems: Story = {
  args: {
    items: [
      { label: "INTERVIEW" },
      { label: "A-PLOEG" },
      { label: "8 MIN" },
      { label: "06 MEI 2026" },
    ],
  },
};

export const EmptyItems: Story = {
  args: { items: [] },
  parameters: {
    vr: {
      disable: true,
      reason:
        "EditorialKicker returns null when items=[]; an empty snapshot adds noise to the VR diff suite without exercising layout.",
    },
  },
};
