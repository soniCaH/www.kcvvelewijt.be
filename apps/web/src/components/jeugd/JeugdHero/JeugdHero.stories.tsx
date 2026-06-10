import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { JeugdHero } from "./JeugdHero";

const meta = {
  title: "Features/Jeugd/JeugdHero",
  component: JeugdHero,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'The `/jeugd` split hero (Phase 7 / 7j1). Left column: MonoLabel kicker "De jeugdopleiding · U6 tot U21" + EditorialHeading "Beter worden begint met plezier." (jersey-deep period) + italic-display lead for parents + a mono division-path line. Right column: a youth photo in a newsprint `<TapedFigure>`. Mirrors `<SponsorHero>` / `<BoardHero>` on cream.',
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
} satisfies Meta<typeof JeugdHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default split hero with the committed youth photo (served by Storybook staticDirs). */
export const Default: Story = {};

/** Mobile viewport — the split stacks to a single column. */
export const MobileViewport: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
};
