import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UpcomingMatches } from "./UpcomingMatches";
import {
  mockScheduledMatches,
  mockLiveMatch,
  mockFinishedMatch,
  mockPostponedMatch,
  mockForfeitedMatch,
  mockMatches,
} from "./UpcomingMatches.mocks";

const meta: Meta<typeof UpcomingMatches> = {
  title: "Features/Home/UpcomingMatches",
  component: UpcomingMatches,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Horizontal slider component for displaying upcoming matches using native CSS scroll-snap. Features touch-friendly scrolling, navigation arrows, and responsive design.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof UpcomingMatches>;

// Stories
export const Default: Story = {
  args: {
    matches: mockScheduledMatches,
    title: "Volgende wedstrijden",
    showViewAll: true,
    viewAllHref: "/matches",
  },
};

export const WithLiveMatch: Story = {
  args: {
    matches: [mockLiveMatch, ...mockScheduledMatches],
    title: "Volgende wedstrijden",
    showViewAll: true,
    viewAllHref: "/matches",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Displays a live match with pulsing indicator and current scores.",
      },
    },
  },
};

export const WithFinishedMatch: Story = {
  args: {
    matches: [mockFinishedMatch, ...mockScheduledMatches],
    title: "Volgende wedstrijden",
    showViewAll: true,
    viewAllHref: "/matches",
  },
  parameters: {
    docs: {
      description: {
        story: "Displays a finished match with final scores.",
      },
    },
  },
};

export const WithPostponedMatch: Story = {
  args: {
    matches: [mockPostponedMatch, ...mockScheduledMatches],
    title: "Volgende wedstrijden",
    showViewAll: true,
    viewAllHref: "/matches",
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays a postponed match with "Uitgesteld" status.',
      },
    },
  },
};

export const WithForfeitedMatch: Story = {
  args: {
    matches: [mockForfeitedMatch, ...mockScheduledMatches],
    title: "Volgende wedstrijden",
    showViewAll: true,
    viewAllHref: "/matches",
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays a forfeited match with "FF" status.',
      },
    },
  },
};

export const ManyMatches: Story = {
  args: {
    matches: [
      mockLiveMatch,
      ...mockScheduledMatches,
      mockFinishedMatch,
      ...mockScheduledMatches.map((m, i) => ({
        ...m,
        id: 20 + i,
        round: `Speeldag ${20 + i}`,
      })),
      mockPostponedMatch,
      mockForfeitedMatch,
    ],
    title: "Volgende wedstrijden",
    showViewAll: true,
    viewAllHref: "/matches",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Displays many matches to demonstrate horizontal scrolling with navigation arrows.",
      },
    },
  },
};

export const SingleMatch: Story = {
  args: {
    matches: [mockScheduledMatches[0]],
    title: "Volgende wedstrijden",
    showViewAll: true,
    viewAllHref: "/matches",
  },
  parameters: {
    docs: {
      description: {
        story: "Displays a single match without scrolling.",
      },
    },
  },
};

export const WithoutViewAll: Story = {
  args: {
    matches: mockScheduledMatches,
    title: "Volgende wedstrijden",
    showViewAll: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays matches without the "View All" link.',
      },
    },
  },
};

export const CustomTitle: Story = {
  args: {
    matches: mockScheduledMatches,
    title: "Wedstrijdkalender",
    showViewAll: true,
    viewAllHref: "/kalender",
  },
  parameters: {
    docs: {
      description: {
        story: "Displays matches with a custom title and view all link.",
      },
    },
  },
};

export const NoMatches: Story = {
  args: {
    matches: [],
    title: "Volgende wedstrijden",
    showViewAll: true,
    viewAllHref: "/matches",
  },
  parameters: {
    docs: {
      description: {
        story:
          "When no matches are provided, the component renders nothing (returns null).",
      },
    },
  },
};

export const MixedStatuses: Story = {
  args: {
    matches: mockMatches.mixed,
    title: "Alle wedstrijden",
    showViewAll: true,
    viewAllHref: "/matches",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Displays matches with mixed statuses: scheduled, finished, postponed, stopped, and forfeited.",
      },
    },
  },
};
