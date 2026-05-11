import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WebshopBanner } from "./WebshopBanner";

const meta = {
  title: "Features/Homepage/WebshopBanner",
  component: WebshopBanner,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Homepage webshop pointer banner (Phase 4.B.5). Cream-deep page surface with a deep jersey-deep-dark <TapedCard> (ink border + lift offset shadow), an editorial italic headline accenting "Trainingsgear", and a single cream paper (inverted) CTA opening the partner webshop in a new tab. KCVV does not run an in-site store — no product thumbnails, no imagery, no top tape strip.',
      },
    },
  },
} satisfies Meta<typeof WebshopBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Desktop default — cream-deep surface, jersey-deep-dark TapedCard (ink border + lift offset shadow), warm-yellow accent on Trainingsgear, single cream inverted CTA with a green arrow.",
      },
    },
  },
};

export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    docs: {
      description: {
        story:
          "Mobile (<640px) — same composition as Default; the headline wraps over multiple lines and the lead + CTA stack vertically inside the jersey-deep-dark card.",
      },
    },
  },
};
