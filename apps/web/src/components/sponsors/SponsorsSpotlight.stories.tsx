import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorsSpotlight } from "./SponsorsSpotlight";
import type { SpotlightSponsor } from "./SponsorsSpotlight";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Sponsors/SponsorsSpotlight",
  component: SponsorsSpotlight,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Dark-green spotlight carousel shown on the sponsors page when at least one sponsor has featured=true. Auto-rotates every 5 seconds by default.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SponsorsSpotlight>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSpotlight: SpotlightSponsor[] = [
  {
    id: "1",
    name: "Bakkerij De Smet",
    logo: fixtureImage("sponsor-logo", 0),
    url: "https://example.com/bakkerij-de-smet",
    description:
      "Al meer dan 30 jaar trouwe partner van KCVV Elewijt. Vers brood en gebak voor de hele regio.",
  },
  {
    id: "2",
    name: "Garage Van Acker",
    logo: fixtureImage("sponsor-logo", 1),
    url: "https://example.com/garage-van-acker",
    description:
      "Officieel dealer van Ford en Volkswagen. Rijdt u ook mee met KCVV?",
  },
  {
    id: "3",
    name: "Immobiliën Claes",
    logo: fixtureImage("sponsor-logo", 2),
    description: "Uw vastgoedspecialist in de regio Elewijt en omstreken.",
  },
];

/** Multiple sponsors with 5-second auto-rotate (default). Dark green background. */
export const AutoRotating: Story = {
  args: {
    sponsors: mockSpotlight,
    autoRotateInterval: 5000,
  },
};

/** Auto-rotate disabled — manual navigation only. */
export const ManualNavigation: Story = {
  args: {
    sponsors: mockSpotlight,
    autoRotateInterval: 0,
  },
};

/** Single sponsor — no navigation dots shown. */
export const SingleSponsor: Story = {
  args: {
    sponsors: [
      mockSpotlight[0] ?? {
        id: "placeholder",
        name: "Placeholder Sponsor",
        logo: "",
      },
    ],
  },
};

/** Sponsor without URL — no "Bezoek website" button. */
export const NoWebsite: Story = {
  args: {
    sponsors: [mockSpotlight[2] ?? mockSpotlight[0]],
  },
};
