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

/** Shows the YouthSection sandwiched between sections. Both the top and bottom
 *  diagonals are rendered inside the component so the background image shows
 *  through the transparent triangles. No SectionTransition needed around it. */
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
        },
        {
          key: "youth",
          bg: "kcvv-green-dark",
          content: <YouthSection prevBgColor="#1E2024" nextBgColor="#f3f4f6" />,
          paddingTop: "pt-0",
          paddingBottom: "pb-0",
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
