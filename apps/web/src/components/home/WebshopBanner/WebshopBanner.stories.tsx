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
          'Homepage webshop pointer banner (Phase 4.B.5). Solid ink band with a jersey-tape strip on top, editorial italic headline accenting "Trainingsgear", lead copy, and a single cream paper CTA that opens the partner webshop in a new tab. KCVV does not run an in-site store — no product thumbnails, no imagery.',
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
          "Desktop default — ink section, jersey-tape green strip at top, warm-yellow accent on Trainingsgear, single primary CTA.",
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
          "Mobile (<640px) — narrower headline wrap, single-column lead + CTA stack. Tape strip stays full-width.",
      },
    },
  },
};
