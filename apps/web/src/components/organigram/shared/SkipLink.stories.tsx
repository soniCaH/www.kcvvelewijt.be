import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SkipLink } from "./SkipLink";
import type { ComponentProps } from "react";

const meta = {
  title: "Features/Organigram/SkipLink",
  component: SkipLink,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Visually hidden accessibility link. Becomes visible on keyboard focus, allowing keyboard users to skip directly to the organigram content. **Tab into the preview to see it appear.**",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

function renderWithTarget(args: ComponentProps<typeof SkipLink>) {
  return (
    <div>
      <SkipLink {...args} />
      <div
        id={args.targetId}
        tabIndex={-1}
        className="mt-4 p-4 bg-foundation-gray-light rounded"
      >
        Organigram content
      </div>
    </div>
  );
}

/** Tab into the preview canvas to see the link appear. */
export const Default: Story = {
  args: {
    targetId: "organigram-content",
    label: "Ga naar organogram",
  },
  render: renderWithTarget,
};

export const CustomLabel: Story = {
  args: {
    targetId: "main-content",
    label: "Sla navigatie over",
  },
  render: renderWithTarget,
};
