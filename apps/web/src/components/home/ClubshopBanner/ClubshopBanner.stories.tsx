import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ClubshopBanner } from "./ClubshopBanner";

const meta = {
  title: "Features/Home/ClubshopBanner",
  component: ClubshopBanner,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage clubshop pointer (R6.C). Renamed from WebshopBanner in #1753: full-bleed jersey-deep-dark surface framed by mirrored StripedSeams (top -45° / bottom +45° jersey-tonal stripes), corner-anchored <JerseyShirt> illustration top-right, editorial 'Onze clubkledij.' heading with warm accent on 'clubkledij', and a single cream inverted CTA pointing at the Brandsfit kledij shop in a new tab.",
      },
    },
  },
} satisfies Meta<typeof ClubshopBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Desktop default — full-bleed jersey-deep-dark surface, mirrored stripe frame at top and bottom, JerseyShirt anchored top-right (~140px), warm-accent emphasis on 'clubkledij', Brandsfit CTA.",
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
          "Mobile (<640px) — the JerseyShirt illustration is hidden so the heading + subheading + CTA stack cleanly without competing for horizontal space. Mirrored stripe frame stays.",
      },
    },
  },
};
