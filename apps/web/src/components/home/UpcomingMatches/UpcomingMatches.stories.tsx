import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UpcomingMatches } from "./UpcomingMatches";
import {
  mockUpcomingFive,
  mockUpcomingTwelve,
  mockUpcomingThree,
} from "./UpcomingMatches.mocks";

const meta = {
  title: "Features/Homepage/UpcomingMatches",
  component: UpcomingMatches,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage upcoming-matches block (Phase 4.B.2). Single-purpose schedule listing across all KCVV teams. Renames the legacy `<MatchesSliderSection>` and absorbs `<MatchWidget>`. Default shows 5 chronological matches; inline expand reveals all upcoming, and the `/kalender` link is only visible after expansion. Empty state returns null.",
      },
    },
  },
} satisfies Meta<typeof UpcomingMatches>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default5: Story = {
  args: { matches: mockUpcomingTwelve },
  parameters: {
    docs: {
      description: {
        story:
          "12 upcoming matches, collapsed — shows first 5 + expand button. `/kalender` link hidden.",
      },
    },
  },
};

export const ExactlyFive: Story = {
  args: { matches: mockUpcomingFive },
  parameters: {
    docs: {
      description: {
        story:
          "Exactly 5 upcoming matches — no expand button (nothing more to reveal).",
      },
    },
  },
};

export const SparseUnder5: Story = {
  args: { matches: mockUpcomingThree },
  parameters: {
    docs: {
      description: {
        story:
          "3 upcoming matches — no expand button. End-of-season tail behaviour.",
      },
    },
  },
};

export const Empty: Story = {
  args: { matches: [] },
  parameters: {
    docs: {
      description: {
        story:
          "Zero upcoming matches — entire section returns null. Matches the NewsGrid E.1 convention.",
      },
    },
  },
};

export const Expanded: Story = {
  args: { matches: mockUpcomingTwelve, initialExpanded: true },
  parameters: {
    docs: {
      description: {
        story:
          "Expanded state — all upcoming matches visible in one chronological list, `/kalender` link revealed.",
      },
    },
  },
};
