import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { JeugdVisie } from "./JeugdVisie";

const meta = {
  title: "Features/Jeugd/JeugdVisie",
  component: JeugdVisie,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'The `/jeugd` filosofie/visie block (Phase 7 / 7j0b). Carries the `#visie` anchor. A mono section kicker "Onze jeugdvisie" above a cream-soft `<TapedCard>` pairing a jersey-deep `<QuoteMark>` with the visie statement (italic display) and a mono tag row. Replaces the retired green `<MissionBanner>`.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto w-full max-w-[70rem] px-4 py-10 sm:py-14">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JeugdVisie>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The filosofie/visie block as it renders below the hero seam. */
export const Default: Story = {};

/** Mobile viewport — the quote-mark + body grid holds on narrow screens. */
export const MobileViewport: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
};
