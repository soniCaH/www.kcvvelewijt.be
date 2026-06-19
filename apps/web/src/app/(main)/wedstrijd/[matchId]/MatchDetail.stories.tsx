/**
 * Pages/* assembly story for `/wedstrijd/[matchId]` — the Phase 6.B match
 * detail composition.
 *
 * Renders the visible page sections (MatchHero → MatchLineupSection →
 * MatchEventsSection → MatchStandingsSection → MatchArticleLinkCard) with
 * fixture data, mirroring the server `page.tsx` body but WITHOUT the
 * server-only chrome (`<MatchStripSlot>`, `<PageViewTracker>`, `<TrackInView>`,
 * `<JsonLd>`), which require runtime BFF / Sanity fetches and analytics
 * context. Functional smoke for the assembled route lives in the Playwright
 * suite; the per-section visuals are VR-tested under `Features/Matches/*`.
 *
 * Per `apps/web/CLAUDE.md`, Pages/* stories are NOT VR-tested. Add or change
 * visual baselines on the per-section stories
 * (`Features/Matches/MatchHero`, `…/MatchLineupSection`, `…/MatchEventsSection`,
 * `…/MatchStandingsSection`, `…/MatchArticleLinkCard`) instead.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import type { RankingEntry } from "@kcvv/api-contract";
import { MatchHero } from "@/components/match/MatchHero";
import { MatchLineupSection } from "@/components/match/MatchLineupSection";
import type { LineupPlayer } from "@/components/match/MatchLineup/MatchLineup";
import { MatchEventsSection } from "@/components/match/MatchEventsSection";
import type { MatchEvent } from "@/components/match/MatchEvents/MatchEvents";
import { MatchStandingsSection } from "@/components/match/MatchStandingsSection";
import { MatchArticleLinkCard } from "@/components/match/MatchArticleLinkCard";
import { RECAP_KICKER } from "@/components/match/MatchArticleLinkCard/selectMatchArticle";
import { StripedSeam } from "@/components/design-system";

const KCVV_LOGO = fixtureImage("sponsor-logo", 0);
const OPPONENT_LOGO = fixtureImage("sponsor-logo", 1);

const HOME_NAME = "KCVV Elewijt";
const AWAY_NAME = "RC Mechelen";

const finishedDate = new Date("2025-09-06T13:30:00Z");

const homeLineup: LineupPlayer[] = [
  {
    id: 1,
    name: "Ben Lievens",
    number: 1,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
    isKeeper: true,
  },
  {
    id: 4,
    name: "Wim Verhoeven",
    number: 5,
    minutesPlayed: 90,
    isCaptain: true,
    status: "starter",
  },
  {
    id: 5,
    name: "Maxim Breugelmans",
    number: 6,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
    card: "yellow",
  },
  {
    id: 6,
    name: "Lars De Vos",
    number: 7,
    minutesPlayed: 71,
    isCaptain: false,
    status: "substituted",
  },
  {
    id: 7,
    name: "Pieter De Bondt",
    number: 16,
    minutesPlayed: 19,
    isCaptain: false,
    status: "subbed_in",
  },
];

const awayLineup: LineupPlayer[] = [
  {
    id: 11,
    name: "Stijn Vandenberg",
    number: 1,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
    isKeeper: true,
  },
  {
    id: 12,
    name: "Kevin Smets",
    number: 3,
    minutesPlayed: 90,
    isCaptain: false,
    status: "starter",
    card: "yellow",
  },
  {
    id: 13,
    name: "Robbie Vermeiren",
    number: 10,
    minutesPlayed: 90,
    isCaptain: true,
    status: "starter",
  },
];

const events: MatchEvent[] = [
  { id: 1, type: "goal", minute: 12, team: "home", player: "Lars De Vos" },
  {
    id: 2,
    type: "yellow_card",
    minute: 28,
    team: "away",
    player: "Kevin Smets",
  },
  {
    id: 3,
    type: "goal",
    minute: 45,
    additionalTime: 2,
    team: "home",
    player: "Maxim Breugelmans",
    isPenalty: true,
  },
  { id: 4, type: "goal", minute: 56, team: "away", player: "Tom Janssens" },
  {
    id: 5,
    type: "substitution",
    minute: 71,
    team: "home",
    playerIn: "Pieter De Bondt",
    playerOut: "Lars De Vos",
  },
  {
    id: 6,
    type: "goal",
    minute: 78,
    team: "home",
    player: "Maxim Breugelmans",
  },
];

function entry(
  position: number,
  team_id: number,
  team_name: string,
  played: number,
  won: number,
  drawn: number,
  lost: number,
  goals_for: number,
  goals_against: number,
  points: number,
): RankingEntry {
  return {
    position,
    team_id,
    club_id: team_id,
    team_name,
    played,
    won,
    drawn,
    lost,
    goals_for,
    goals_against,
    goal_difference: goals_for - goals_against,
    points,
  } as RankingEntry;
}

// KCVV (club 1235) vs RC Mechelen (club 103) — both rows surface from the full
// division, KCVV tinted.
const KCVV_CLUB_ID = 1235;
const AWAY_CLUB_ID = 103;
const standings: RankingEntry[] = [
  entry(1, 101, "KSK Kampenhout", 18, 13, 3, 2, 41, 17, 42),
  entry(2, 102, "FC Perk", 18, 12, 4, 2, 38, 19, 40),
  entry(3, AWAY_CLUB_ID, "RC Mechelen", 18, 11, 3, 4, 35, 22, 36),
  entry(4, 104, "Eppegem B", 18, 9, 5, 4, 30, 24, 32),
  entry(5, 105, "SK Kampenhout B", 18, 8, 6, 4, 28, 23, 30),
  entry(6, KCVV_CLUB_ID, "KCVV Elewijt", 18, 8, 4, 6, 27, 25, 28),
];

const recapArticle = {
  title: "KCVV kopt zich in extremis langs RC Mechelen.",
  slug: "kcvv-mechelen-verslag",
  coverImageUrl: fixtureImage("article-hero-matchverslag", 0),
  lead: "Een rommelige tweede helft kantelde pas in minuut 78 — Breugelmans besliste het duel met het hoofd.",
};

/**
 * Page-level composition of the finished-match detail route. Mirrors the
 * section ordering and the `<StripedSeam>` cadence of `page.tsx`.
 */
function MatchDetailAssembly() {
  return (
    <>
      <MatchHero
        homeTeam={{ name: HOME_NAME, logo: KCVV_LOGO, score: 3 }}
        awayTeam={{ name: AWAY_NAME, logo: OPPONENT_LOGO, score: 1 }}
        date={finishedDate}
        time="14:30"
        venue="Sportpark Elewijt"
        status="finished"
        competition="3e provinciale A"
        kcvvTeamLabel="KCVV-A"
      />

      <StripedSeam colorPair="ink-cream" height="md" />

      <MatchLineupSection
        homeTeamName={HOME_NAME}
        awayTeamName={AWAY_NAME}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
      />

      <StripedSeam colorPair="ink-cream" height="md" />

      <MatchEventsSection
        homeTeamName={HOME_NAME}
        awayTeamName={AWAY_NAME}
        homeTeamLogo={KCVV_LOGO}
        awayTeamLogo={OPPONENT_LOGO}
        events={events}
      />

      <StripedSeam colorPair="ink-cream" height="md" />

      <MatchStandingsSection
        entries={standings}
        homeClubId={KCVV_CLUB_ID}
        awayClubId={AWAY_CLUB_ID}
        highlightTeamId={KCVV_CLUB_ID}
      />

      <StripedSeam colorPair="ink-cream" height="md" />

      <MatchArticleLinkCard article={recapArticle} kicker={RECAP_KICKER} />
    </>
  );
}

const meta = {
  title: "Pages/Matches/MatchDetail",
  component: MatchDetailAssembly,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase 6.B `/wedstrijd/[matchId]` composition (finished league match). See the per-section stories under `Features/Matches/*` for VR-tested visuals; this story exists as a design reference only and is not VR-tested.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatchDetailAssembly>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Finished league match — every body section renders (lineup, events,
 * standings, recap card), the maximal composition.
 */
export const FinishedLeagueMatch: Story = {};
