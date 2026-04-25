import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YouthSection } from "./YouthSection";
import { YouthBackdrop } from "./YouthBackdrop";
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

/** YouthSection sandwiched between sections — diagonals are owned by `SectionStack`
 *  via `SectionTransition`. The photographic backdrop bleeds into both diagonal
 *  bands because `revealFrom` / `revealTo` are auto-propagated from the
 *  `backdrop` prop. */
export const Sandwiched: Story = {
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
          backdrop: <YouthBackdrop />,
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
