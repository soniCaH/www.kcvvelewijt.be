import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IdentityBand } from "./IdentityBand";

const meta = {
  title: "Features/Home/IdentityBand",
  component: IdentityBand,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Homepage identity band (#3417): the club motto over the youth huddle, third in the spine between "Eerste ploegen." and "Uitgelicht.". Phone stacks a 4:3 photo over the words; desktop overlays the words on a 21:9 photo. The buttons carry `data-identity-cta` for `identity_band_click`.',
      },
    },
  },
} satisfies Meta<typeof IdentityBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Desktop and tablet — 21:9 photo (26rem tall at the least), words overlaid bottom-left. Phone — 4:3 photo with the words below it on the dark field.",
      },
    },
  },
};
