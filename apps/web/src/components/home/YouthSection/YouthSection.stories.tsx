import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YouthSection } from "./YouthSection";
import { YouthBackdrop } from "./YouthBackdrop";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";

const meta = {
  title: "Features/Homepage/YouthSection",
  component: YouthSection,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Homepage Jeugd block (Phase 4.B.4). Palette swap to retro jersey-deep tokens with the composed gradient overlay + halftone print texture. Text rebuilt on `<EditorialHeading>` (italic accent on "De toekomst") + `<MonoLabel>` + `<LinkButton variant=primary>` per the locked spec.',
      },
    },
  },
} satisfies Meta<typeof YouthSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const withBackdrop = (children: React.ReactNode) => (
  <div className="relative isolate min-h-[640px] overflow-hidden">
    <YouthBackdrop />
    <div className="relative z-10 py-20 md:py-28">{children}</div>
  </div>
);

export const Default: Story = {
  args: {},
  render: () => withBackdrop(<YouthSection />),
  parameters: {
    docs: {
      description: {
        story:
          "Desktop default — jersey-deep gradient (135deg) + halftone overlay layered on the blurred youth-trainers photo.",
      },
    },
  },
};

export const Mobile: Story = {
  args: {},
  render: () => withBackdrop(<YouthSection />),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    docs: {
      description: {
        story:
          "Mobile (<640px) — gradient flips to vertical via the Tailwind base/md cascade on the backdrop.",
      },
    },
  },
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
