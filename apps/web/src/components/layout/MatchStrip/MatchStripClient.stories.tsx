import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchStripClient } from "./MatchStripClient";
import type { UpcomingMatch } from "@/components/match/types";

const baseMatch: UpcomingMatch = {
  id: 100,
  date: new Date("2026-04-20T14:30:00"),
  time: "14:30",
  homeTeam: { id: 1235, name: "KCVV Elewijt", score: undefined },
  awayTeam: { id: 999, name: "FC Testploeg", score: undefined },
  status: "scheduled",
  competition: "2e Nationale",
};

const finishedMatch: UpcomingMatch = {
  id: 101,
  date: new Date("2026-04-13T15:00:00"),
  homeTeam: { id: 1235, name: "KCVV Elewijt", score: 3 },
  awayTeam: { id: 888, name: "SK Rivaal", score: 1 },
  status: "finished",
  competition: "2e Nationale",
};

const longNameMatch: UpcomingMatch = {
  id: 102,
  date: new Date("2026-04-27T15:00:00"),
  time: "15:00",
  homeTeam: {
    id: 777,
    name: "KFC Verbroedering Geel-Meerhout Laakdal",
    score: undefined,
  },
  awayTeam: { id: 1235, name: "KCVV Elewijt", score: undefined },
  status: "scheduled",
  competition: "2e Nationale",
};

const meta = {
  title: "Features/Matches/MatchStripClient",
  component: MatchStripClient,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full-width sticky match strip at the top of the page. " +
          "Shows the next scheduled or most recent finished match for the A-team. " +
          "Dismissible per session via the close button (persisted in sessionStorage).",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    match: baseMatch,
  },
} satisfies Meta<typeof MatchStripClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scheduled: Story = {
  args: { match: baseMatch },
  parameters: {
    docs: {
      description: {
        story: "Upcoming match — shows 'Volgende: vs <opponent> · date time'.",
      },
    },
  },
};

export const Finished: Story = {
  args: { match: finishedMatch },
  parameters: {
    docs: {
      description: {
        story: "Finished match — shows date and final score.",
      },
    },
  },
};

export const NoMatch: Story = {
  args: { match: null },
  parameters: {
    docs: {
      description: {
        story: "No match data — renders nothing.",
      },
    },
  },
};

export const LongOpponentName: Story = {
  args: { match: longNameMatch },
  parameters: {
    docs: {
      description: {
        story:
          "Stress test: long opponent name. The opponent text truncates on narrow viewports.",
      },
    },
  },
};
