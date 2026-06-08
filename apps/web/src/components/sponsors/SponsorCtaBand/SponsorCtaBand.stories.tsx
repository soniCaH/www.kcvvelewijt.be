import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorCtaBand } from "./SponsorCtaBand";

const meta = {
  title: "Features/Sponsors/SponsorCtaBand",
  component: SponsorCtaBand,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'The `/sponsors` closing footer band (7.d4 · C1): a full-width jersey-deep-dark band (border-y-2 ink + leading StripedSeam) with an italic "Ook jouw zaak langs de lijn?" question (warm accent), a sub-line, and a warm paper-stamp "Word sponsor +" button. Mirrors the homepage `<ClubshopBanner>`.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SponsorCtaBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Narrow viewport — heading wraps, button stays centred. */
export const MobileViewport: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
};
