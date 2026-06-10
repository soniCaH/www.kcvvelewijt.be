import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionKicker } from "./SectionKicker";

const meta = {
  title: "UI/SectionKicker",
  component: SectionKicker,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A mono section label followed by a trailing paper-edge hairline rule. The redesign's standard header for landing-page sub-sections (filosofie/visie, the jeugd nav hub, sponsor tiers).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionKicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive playground — tweak the label via Controls. */
export const Playground: Story = {
  args: { children: "Ontdek onze jeugd" },
};

export const Default: Story = {
  args: { children: "Ontdek onze jeugd" },
};

export const ShortLabel: Story = {
  args: { children: "Hoofdsponsors" },
};
