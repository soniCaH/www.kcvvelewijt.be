import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YouthSection } from "./YouthSection";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";

const meta = {
  title: "Features/Homepage/YouthSection",
  component: YouthSection,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof YouthSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

/** Shows the YouthSection sandwiched between sections with diagonal transitions,
 *  verifying that the background image covers the diagonal transition areas. */
export const WithDiagonalTransitions: Story = {
  render: () => (
    <SectionStack
      sections={[
        {
          key: "before",
          bg: "kcvv-black",
          content: (
            <div className="px-8 py-12 text-center text-white/60">
              Previous section (kcvv-black)
            </div>
          ),
          transition: { type: "diagonal", direction: "right" },
        },
        {
          key: "youth",
          bg: "kcvv-green-dark",
          content: <YouthSection />,
          paddingTop: "pt-0",
          paddingBottom: "pb-0",
          transition: { type: "diagonal", direction: "left" },
        },
        {
          key: "after",
          bg: "gray-100",
          content: (
            <div className="px-8 py-12 text-center text-gray-400">
              Next section (gray-100)
            </div>
          ),
        },
      ]}
    />
  ),
};
