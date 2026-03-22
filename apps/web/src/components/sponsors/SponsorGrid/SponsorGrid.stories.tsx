/**
 * SponsorGrid Component Stories
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorGrid } from "./SponsorGrid";
import { mockSponsors } from "../Sponsors.mocks";

const meta = {
  title: "Features/Sponsors/SponsorGrid",
  component: SponsorGrid,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Responsive grid of SponsorCard items. Supports variable columns, card sizes, and light/dark theme variants.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SponsorGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sponsors: mockSponsors,
  },
};

export const ThreeColumns: Story = {
  args: {
    sponsors: mockSponsors.slice(0, 6),
    columns: 3,
  },
};

export const SixColumns: Story = {
  args: {
    sponsors: mockSponsors,
    columns: 6,
  },
};

export const SmallSize: Story = {
  args: {
    sponsors: mockSponsors.slice(0, 4),
    size: "sm",
  },
};

export const LargeSize: Story = {
  args: {
    sponsors: mockSponsors.slice(0, 4),
    size: "lg",
    columns: 2,
  },
};

export const WithNames: Story = {
  args: {
    sponsors: mockSponsors.slice(0, 4),
    showNames: true,
  },
};

export const DarkVariant: Story = {
  args: {
    sponsors: mockSponsors,
    variant: "dark",
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

export const Empty: Story = {
  args: {
    sponsors: [],
  },
};
