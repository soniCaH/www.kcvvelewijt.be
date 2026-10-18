import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { matchYouthTeams } from "@/lib/utils/match-youth-team";
import { TeamCard } from "./TeamCard";
import {
  TEAM_CARD_NODES,
  TEAM_CARD_CALENDAR_YEAR,
  TEAM_CARD_SEASON_YEAR,
  TEAM_CARD_TEAMS,
  withoutHolder,
} from "./team-card.fixture";

/** Each story is the card for one query, as `/hulp`'s search would show it. */
const forQuery = (query: string) =>
  matchYouthTeams(
    query,
    TEAM_CARD_TEAMS,
    TEAM_CARD_SEASON_YEAR,
    TEAM_CARD_CALENDAR_YEAR,
  );

const meta = {
  title: "Features/Hulp/TeamCard",
  component: TeamCard,
  parameters: { layout: "centered" },
  args: { result: forQuery("U12"), nodes: TEAM_CARD_NODES },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[min(420px,calc(100vw-2rem))] p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof TeamCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "U12" — one team: band, coordinator, TVJO, one staff link. */
export const UCode: Story = {};

/** "vraag over de U8" — two teams at one age: one card, a link per team. */
export const TwoTeamsOneAge: Story = {
  args: { result: forQuery("vraag over de U8") },
};

/** "miniemen" — an old name covering U12 and U13. */
export const OldName: Story = {
  args: { result: forQuery("miniemen") },
};

/** "mijn zoon is 8 jaar" — two birth years, two bands, the TVJO once. */
export const PlainAge: Story = {
  args: { result: forQuery("mijn zoon is 8 jaar, wie moet ik contacteren?") },
};

/** "geboren in 2018" — with the late-born note for the U8 teams. */
export const BirthYearLateBorn: Story = {
  args: {
    result: forQuery("mijn dochter is geboren in 2018, welke ploeg is dat?"),
  },
};

/** "geboren in 2009" — no U18, so the U19 with a one-line explanation. */
export const NextTeamUp: Story = {
  args: { result: forQuery("geboren in 2009") },
};

/** "U5" — no band in the title; the Onderbouw coordinator looks after it. */
export const U5: Story = {
  args: { result: forQuery("U5") },
};

/** "U14" with an empty Bovenbouw box — the coordinator row is hidden. */
export const CoordinatorMissing: Story = {
  args: { result: forQuery("U14"), nodes: withoutHolder("JC-BB") },
};

/** "8 jaar" with an empty TVJO box — no "Voor alle jeugd" heading over nothing. */
export const TvjoMissing: Story = {
  args: {
    result: forQuery("mijn zoon is 8 jaar, wie moet ik contacteren?"),
    nodes: withoutHolder("TVJO"),
  },
};
