import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YouthSection } from "./YouthSection";
import { YouthBackdrop } from "./YouthBackdrop";

const meta = {
  title: "Features/Home/YouthSection",
  component: YouthSection,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Homepage Jeugd block. Phase 4.5 R5.B adds a top stripe band (cream-jersey-deep StripedSeam, xl height — cream paper-tape on the dark green field), shifts the editorial accent from "De toekomst" to "Elewijt", and introduces a dual CTA row ("Ontdek onze jeugd" → /jeugd, "Schrijf je in" → /club/word-lid). Background stays the composed jersey-deep gradient + halftone photo overlay from Phase 4.B.4.',
      },
    },
  },
} satisfies Meta<typeof YouthSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const withBackdrop = (children: React.ReactNode) => (
  <div className="relative isolate min-h-[640px] overflow-hidden">
    <YouthBackdrop />
    {/* No top padding — the YouthSection's own top stripe band hugs
        the section edge. Bottom padding kept so the CTA row doesn't
        touch the next section. */}
    <div className="relative z-10 pb-20 md:pb-28">{children}</div>
  </div>
);

export const Default: Story = {
  args: {},
  render: () => withBackdrop(<YouthSection />),
  parameters: {
    docs: {
      description: {
        story:
          "Desktop default — top stripe band + dual CTA row over the jersey-deep gradient + halftone overlay photo.",
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
          "Mobile (<640px) — CTAs stack vertically thanks to `flex-wrap` on the dual-CTA row. Top stripe band stays full-bleed.",
      },
    },
  },
};
