/**
 * PlayerShare Component Stories
 *
 * Share card with QR code for social sharing of player profiles.
 * Supports download, copy link, and social sharing.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerShare } from "./PlayerShare";

const meta = {
  title: "Features/Players/PlayerShare",
  component: PlayerShare,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Share component for player profiles with QR code generation.

Features:
- QR code linking to player profile
- Copy profile URL to clipboard
- Social share button (Facebook)
- Download QR code as image
- Print-optimized layout option
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    playerName: {
      control: "text",
      description: "Player full name",
    },
    playerSlug: {
      control: "text",
      description: "Player URL slug",
    },
    teamName: {
      control: "text",
      description: "Team name",
    },
    showQR: {
      control: "boolean",
      description: "Show QR code",
    },
    variant: {
      control: "select",
      options: ["default", "compact", "printable"],
      description: "Display variant",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerShare>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default share card with all sharing options
 */
export const Default: Story = {
  args: {
    playerName: "Chiel Bertens",
    playerSlug: "chiel-bertens",
    teamName: "Eerste Ploeg",
    showQR: true,
    variant: "default",
  },
};

/**
 * Share card with QR code prominently displayed
 */
export const WithQR: Story = {
  args: {
    playerName: "Jarne Feron",
    playerSlug: "jarne-feron",
    teamName: "Eerste Ploeg",
    showQR: true,
    variant: "default",
  },
};

/**
 * Compact variant without QR code
 */
export const Compact: Story = {
  args: {
    playerName: "Chiel Bertens",
    playerSlug: "chiel-bertens",
    teamName: "Eerste Ploeg",
    showQR: false,
    variant: "compact",
  },
};

/**
 * Print-optimized layout for physical sharing
 */
export const Printable: Story = {
  args: {
    playerName: "Chiel Bertens",
    playerSlug: "chiel-bertens",
    teamName: "Eerste Ploeg",
    showQR: true,
    variant: "printable",
  },
  parameters: {
    backgrounds: { default: "white" },
  },
};

/**
 * Loading state while generating QR
 */
export const Loading: Story = {
  args: {
    playerName: "Chiel Bertens",
    playerSlug: "chiel-bertens",
    teamName: "Eerste Ploeg",
    showQR: true,
    isLoading: true,
  },
};
