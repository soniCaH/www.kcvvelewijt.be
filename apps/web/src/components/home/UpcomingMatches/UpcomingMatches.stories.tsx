import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UpcomingMatches } from "./UpcomingMatches";
import {
  mockUpcomingFive,
  mockUpcomingTwelve,
  mockUpcomingThree,
  mockUpcomingSingleTeam,
  mockUpcomingWithReservation,
  mockUpcomingWithTournament,
} from "./UpcomingMatches.mocks";

const meta = {
  title: "Features/Home/UpcomingMatches",
  component: UpcomingMatches,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage upcoming-matches block (Phase 4.B.2). Single-purpose schedule listing across all KCVV teams. Renames the legacy `<MatchesSliderSection>` and absorbs `<MatchWidget>`. Default shows 5 chronological matches; inline expand reveals all upcoming and is reversible, and the `/kalender` link is only visible after expansion. Empty state returns null.\n\n#2398 added the youth-parent path: a label-sorted team-chip filter (`<FilterTabs>`) above the list, the venue in each row's caption, and the home/away badge reconciled with `<TeamAgendaRow>`'s House/Bus glyph per drill 2398-1 variant B. Venue renders for a home fixture in production (#2491) and is absent otherwise — the fixtures below carry one to keep the populated caption covered regardless of live data.",
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
          "Zero upcoming matches, the read succeeded — entire section returns null. Matches the NewsGrid E.1 convention. `unavailable: true` (see FeedUnavailable) is the one case that holds the band's shape instead.",
      },
    },
  },
};

/** #2505/#2844 — the read failed rather than the feed genuinely being empty.
 *  Holds the band's shape with `<EmptyState tier="slot" reason="unavailable">`
 *  instead of returning null. */
export const FeedUnavailable: Story = {
  args: { matches: [], unavailable: true },
  parameters: {
    docs: {
      description: {
        story:
          "Zero upcoming matches because the BFF/PSD read failed — the band holds its shape and names the reason instead of vanishing (#2505/#2844).",
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
          "Expanded state — all upcoming matches visible in one chronological list, `/kalender` link revealed, and the control now reads 'Toon minder ↑' so the expansion is reversible (#2398).",
      },
    },
  },
};

export const SingleTeamNoFilter: Story = {
  args: { matches: mockUpcomingSingleTeam },
  parameters: {
    docs: {
      description: {
        story:
          "Every fixture belongs to one squad — the end-of-season tail. The team filter drops out entirely rather than rendering a reset beside a single dead facet (#2398).",
      },
    },
  },
};

/**
 * A youth tournament placeholder (#2606) among the other-teams agenda — no
 * opponent, no link, the club crest and the competition subject instead of
 * "KCVV Elewijt — KCVV Elewijt" (#2688).
 */
export const WithReservation: Story = {
  args: { matches: mockUpcomingWithReservation },
  parameters: {
    docs: {
      description: {
        story:
          "A pitch-reservation placeholder in the mix — the reduced row (#2688), not an ordinary linked fixture between the club and itself.",
      },
    },
  },
};

/**
 * A tournament fixture with no result yet (#2696/#2802) — a real named
 * opponent, not a self-match. The gap this ticket closes: before it,
 * `<UpcomingMatchesClient>` never called `isReducedMatchRow`, so this row
 * rendered as an ordinary linked scoreboard here even though every other
 * reservation-aware renderer already reduced it.
 */
export const WithTournament: Story = {
  args: { matches: mockUpcomingWithTournament },
  parameters: {
    docs: {
      description: {
        story:
          "A tournament fixture with a hidden result in the mix — the reduced row names the other club, never KCVV's own crest twice (#2696/#2802).",
      },
    },
  },
};
