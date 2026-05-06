import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { JerseyShirt } from "./JerseyShirt";

const meta = {
  title: "UI/JerseyShirt",
  component: JerseyShirt,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JerseyShirt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const Default: Story = {
  args: {},
};

export const WithLetterU11: Story = {
  args: { letterOverlay: "U11", ariaLabel: "U11 jersey" },
};

export const WithLetterA: Story = {
  args: { letterOverlay: "A", ariaLabel: "A-ploeg jersey" },
};

/**
 * In context: against the jersey-deep YouthBlock band, the ink underprint
 * reads strongly while the jersey-deep stripes near-tonal-merge with the
 * background — matching `master design §5.1 step 8`.
 */
export const OnYouthBlockBand: Story = {
  args: { letterOverlay: "U11", ariaLabel: "U11 jersey" },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep border-ink border-2 p-16">
        <Story />
      </div>
    ),
  ],
};
