import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { JeugdCtaBand } from "./JeugdCtaBand";

const meta = {
  title: "Features/Jeugd/JeugdCtaBand",
  component: JeugdCtaBand,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'The `/jeugd` closing CTA band (Phase 7). The shared `<CtaBand>` with youth copy: "Interesse in onze jeugd?" + a warm paper-stamp "Schrijf je in +" → /hulp (until the membership form #1473 ships).',
      },
    },
  },
} satisfies Meta<typeof JeugdCtaBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — links to /hulp. */
export const Default: Story = {};
