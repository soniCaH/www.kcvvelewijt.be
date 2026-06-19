/**
 * Pages/* assembly story for `/ploegen/[slug]` — the Phase 6.C team detail
 * composition.
 *
 * Renders the visible page sections (TeamHero → StandingsTable →
 * TeamMatchesSection → SquadGrid → TeamStaff → TeamEditorial) with fixture
 * data, mirroring the server `page.tsx` body but WITHOUT the server-only chrome
 * (`<MatchStripSlot>`, `<TeamSectionNav>`, `<PageViewTracker>`, `<TrackInView>`,
 * `<JsonLd>`, `<VerderLezenRow>`, `<SponsorsSection>`), which require runtime
 * BFF / Sanity fetches and analytics context. Functional smoke for the
 * assembled route lives in the Playwright suite; the per-section visuals are
 * VR-tested under `Features/Teams/*`.
 *
 * Per `apps/web/CLAUDE.md`, Pages/* stories are NOT VR-tested. Add or change
 * visual baselines on the per-section stories
 * (`Features/Teams/TeamHero`, `…/StandingsTable`, `…/TeamMatchesSection`,
 * `…/SquadGrid`, `…/TeamStaff`, `…/TeamEditorial`) instead.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import type { RankingEntry } from "@kcvv/api-contract";
import type { PlayerVM } from "@/lib/repositories/player.repository";
import type { ScheduleMatch } from "@/components/match/types";
import { TeamHero } from "@/components/team/TeamHero";
import { StandingsTable } from "@/components/team/StandingsTable";
import { TeamMatchesSection } from "@/components/team/TeamMatchesSection";
import { SquadGrid } from "@/components/team/SquadGrid";
import { TeamStaff } from "@/components/team/TeamStaff";
import type { TeamStaffMemberData } from "@/components/team/TeamStaff";
import { TeamEditorial } from "@/components/team/TeamEditorial";
import { StripedSeam, PageContainer } from "@/components/design-system";

const KCVV_TEAM_ID = 1235;
const TEAM_SLUG = "kcvv-elewijt-a";

function rankEntry(
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

const standings: RankingEntry[] = [
  rankEntry(1, 101, "KSK Kampenhout", 18, 13, 3, 2, 41, 17, 42),
  rankEntry(2, 102, "FC Perk", 18, 12, 4, 2, 38, 19, 40),
  rankEntry(3, 103, "VK Weerde", 18, 11, 3, 4, 35, 22, 36),
  rankEntry(4, 104, "Eppegem B", 18, 9, 5, 4, 30, 24, 32),
  rankEntry(5, 105, "SK Kampenhout B", 18, 8, 6, 4, 28, 23, 30),
  rankEntry(6, KCVV_TEAM_ID, "KCVV Elewijt", 18, 8, 4, 6, 27, 25, 28),
  rankEntry(7, 107, "Hofstade VV", 18, 7, 5, 6, 26, 26, 26),
  rankEntry(8, 108, "FC Mollem", 18, 6, 4, 8, 22, 28, 22),
];

const KCVV = { id: KCVV_TEAM_ID, name: "KCVV Elewijt" };
const OPP_A = { id: 42, name: "VK Weerde" };
const OPP_B = { id: 43, name: "FC Mollem" };
const OPP_C = { id: 44, name: "SK Relegem" };

function scheduleMatch(
  id: number,
  daysOffset: number,
  status: ScheduleMatch["status"],
  scores?: [number, number],
  isHome = true,
  opp = OPP_A,
): ScheduleMatch {
  const date = new Date("2026-09-15T12:00:00.000Z");
  date.setDate(date.getDate() + daysOffset);
  return {
    id,
    date,
    time: "15:00",
    homeTeam: isHome ? KCVV : opp,
    awayTeam: isHome ? opp : KCVV,
    status,
    competition: "3e Provinciale A",
    isHome,
    homeScore: scores?.[0],
    awayScore: scores?.[1],
  };
}

const scheduleMatches: ScheduleMatch[] = [
  scheduleMatch(1, -14, "finished", [1, 1], true, OPP_C),
  scheduleMatch(2, -7, "finished", [3, 0], true, OPP_B),
  scheduleMatch(3, 7, "scheduled", undefined, false, OPP_A),
  scheduleMatch(4, 14, "scheduled", undefined, true, OPP_B),
];

const PHOTOS = {
  a: "/player-fixtures/player-mendes-mouro.jpg",
  b: "/player-fixtures/player-schulz.jpg",
  c: "/player-fixtures/player-vartolomaios.jpg",
};

function player(
  id: string,
  firstName: string,
  lastName: string,
  position: string,
  number: number,
  imageUrl?: string,
): PlayerVM {
  return {
    id,
    firstName,
    lastName,
    position,
    number,
    imageUrl,
    href: `/spelers/${id}`,
  };
}

const players: PlayerVM[] = [
  player("1", "Jonas", "Vermeer", "Keeper", 1, PHOTOS.a),
  player("16", "Lars", "De Smet", "Keeper", 16),
  player("2", "Bram", "Wouters", "Verdediger", 2, PHOTOS.b),
  player("3", "Senne", "Maes", "Verdediger", 3, PHOTOS.c),
  player("4", "Thibault", "Claes", "Verdediger", 4),
  player("6", "Yanni", "Janssens", "Middenvelder", 6, PHOTOS.a),
  player("8", "Robbe", "Mertens", "Middenvelder", 8, PHOTOS.b),
  player("9", "Maxim", "Breugelmans", "Aanvaller", 9, PHOTOS.c),
  player("11", "Stan", "Coppens", "Aanvaller", 11),
];

const staff: TeamStaffMemberData[] = [
  {
    id: "1",
    firstName: "Karel",
    lastName: "Vermeulen",
    functionTitle: "T1",
    imageUrl: PHOTOS.a,
  },
  {
    id: "2",
    firstName: "Dirk",
    lastName: "Janssens",
    functionTitle: "T2",
    imageUrl: PHOTOS.b,
  },
  { id: "3", firstName: "Peter", lastName: "Keepers", functionTitle: "TK" },
  { id: "4", firstName: "Annick", lastName: "De Ploeg", role: "afgevaardigde" },
];

function block(
  ...spans: ReadonlyArray<{ text: string; marks?: string[] }>
): PortableTextBlock {
  return {
    _type: "block",
    _key: `block-${spans.map((s) => s.text.slice(0, 4)).join("-")}`,
    style: "normal",
    children: spans.map((span, i) => ({
      _type: "span",
      _key: `span-${i}`,
      text: span.text,
      marks: span.marks ?? [],
    })),
    markDefs: [],
  } as unknown as PortableTextBlock;
}

const teamBody: PortableTextBlock[] = [
  block(
    {
      text: "Onze A-ploeg speelt al sinds de promotie in 2018 op het hoogste provinciale niveau. De kern bestaat uit een mix van eigen jeugd en ervaren spelers. ",
    },
    {
      text: "Hier wordt voetbal nog met het hart gespeeld.",
      marks: ["pullquote"],
    },
  ),
  block({
    text: "Elke week opnieuw zetten de spelers, de staf en de supporters samen de schouders eronder.",
  }),
];

const trainingSchedule = [
  {
    day: "Dinsdag",
    time: "19:30",
    location: "Sportpark Elewijt — Veld 1",
    type: "Training",
  },
  {
    day: "Donderdag",
    time: "20:00",
    location: "Sportpark Elewijt — Veld 1",
    type: "Tactisch",
  },
];

const contactInfo: PortableTextBlock[] = [
  block({ text: "Ploegafgevaardigde: Jan Janssens — 0470 12 34 56" }),
  block({ text: "Secretariaat: info@kcvvelewijt.be" }),
];

/**
 * Page-level composition of the senior team detail route. Mirrors the section
 * ordering, the `<StripedSeam>` cadence, and the `<PageContainer>` section
 * wrappers of `page.tsx`.
 */
function TeamDetailAssembly() {
  return (
    <>
      <PageContainer>
        <TeamHero
          name="KCVV Elewijt A"
          age="A"
          teamType="senior"
          divisionFull="Eerste Elftal A – 3e Nat. A"
          division="3NA"
          season="25/26"
          tagline="Sterk, gedreven, één ploeg."
          teamImageUrl={PHOTOS.a}
          className="py-8 sm:py-12"
        />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />
      <PageContainer as="section" className="py-10">
        <StandingsTable entries={standings} highlightTeamId={KCVV_TEAM_ID} />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />
      <PageContainer as="section" className="py-10">
        <TeamMatchesSection
          matches={scheduleMatches}
          teamSlug={TEAM_SLUG}
          kcvvTeamId={KCVV_TEAM_ID}
        />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />
      <PageContainer as="section" className="py-10">
        <SquadGrid players={players} />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />
      <PageContainer as="section" className="py-10">
        <TeamStaff staff={staff} />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />
      <PageContainer as="section" className="py-10">
        <TeamEditorial
          body={teamBody}
          trainingSchedule={trainingSchedule}
          contactInfo={contactInfo}
        />
      </PageContainer>
    </>
  );
}

const meta = {
  title: "Pages/Teams/TeamDetail",
  component: TeamDetailAssembly,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase 6.C `/ploegen/[slug]` composition (senior A-team, all sections present). See the per-section stories under `Features/Teams/*` for VR-tested visuals; this story exists as a design reference only and is not VR-tested.",
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
} satisfies Meta<typeof TeamDetailAssembly>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Senior A-team — every section renders (standings, matches, squad, staff,
 * editorial), the maximal composition.
 */
export const SeniorTeam: Story = {};
