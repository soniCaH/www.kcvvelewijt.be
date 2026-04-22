/**
 * Badge Component Stories
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./Badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Compact label for status indicators, content types, categories, and match states. Consolidates the ad-hoc badge patterns found in CalendarView, SearchResult, and MemberDetailsModal.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "primary",
        "success",
        "warning",
        "alert",
        "outline",
        "live",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    dot: { control: "boolean" },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "Nieuws",
  },
};

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "KCVV",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Gewonnen",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Uitgesteld",
  },
};

export const Alert: Story = {
  args: {
    variant: "alert",
    children: "Afgelast",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Goud",
  },
};

export const Live: Story = {
  args: {
    variant: "live",
    children: "Live",
  },
  parameters: {
    docs: {
      description: {
        story: "Live match indicator with automatic pulsing dot.",
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="alert">Alert</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="live">Live</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foundation-gray-dark w-10 text-sm">sm</span>
        <Badge size="sm" variant="default">
          Default
        </Badge>
        <Badge size="sm" variant="primary">
          Primary
        </Badge>
        <Badge size="sm" variant="success">
          Success
        </Badge>
        <Badge size="sm" variant="warning">
          Warning
        </Badge>
        <Badge size="sm" variant="alert">
          Alert
        </Badge>
        <Badge size="sm" variant="outline">
          Outline
        </Badge>
        <Badge size="sm" variant="live">
          Live
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foundation-gray-dark w-10 text-sm">md</span>
        <Badge size="md" variant="default">
          Default
        </Badge>
        <Badge size="md" variant="primary">
          Primary
        </Badge>
        <Badge size="md" variant="success">
          Success
        </Badge>
        <Badge size="md" variant="warning">
          Warning
        </Badge>
        <Badge size="md" variant="alert">
          Alert
        </Badge>
        <Badge size="md" variant="outline">
          Outline
        </Badge>
        <Badge size="md" variant="live">
          Live
        </Badge>
      </div>
    </div>
  ),
};

export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default" dot>
        Gepland
      </Badge>
      <Badge variant="success" dot>
        Gewonnen
      </Badge>
      <Badge variant="warning" dot>
        Uitgesteld
      </Badge>
      <Badge variant="alert" dot>
        Afgelast
      </Badge>
      <Badge variant="live">Live</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Dot indicator on each variant. The live variant always has a pulsing dot.",
      },
    },
  },
};

/**
 * Match status badges — replaces the ad-hoc StatusBadge in CalendarView
 */
export const MatchStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="live">Live</Badge>
      <Badge variant="warning">Uitgesteld</Badge>
      <Badge variant="alert">Afgelast</Badge>
      <Badge variant="success">Gespeeld</Badge>
      <Badge variant="default">Gepland</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "All match status states as used in CalendarView and match cards.",
      },
    },
  },
};

/**
 * Content type badges — replaces ad-hoc type labels in SearchResult
 */
export const ContentTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Nieuws</Badge>
      <Badge variant="primary">Speler</Badge>
      <Badge variant="outline">Team</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Content type indicators as used in SearchResult cards.",
      },
    },
  },
};

/**
 * Sponsor tier badges — replaces ad-hoc tier labels in MemberDetailsModal / Sponsors
 */
export const SponsorTiers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="warning">⭐ Goud</Badge>
      <Badge variant="default">🥈 Zilver</Badge>
      <Badge variant="outline">🥉 Brons</Badge>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    children: "Badge tekst",
    variant: "primary",
    size: "md",
  },
};
