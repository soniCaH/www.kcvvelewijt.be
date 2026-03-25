/**
 * TeamDetail Component Stories
 *
 * Page-level layout for team detail pages: club header, URL-synced tabs
 * (Info · Lineup · Wedstrijden · Stand), with each tab shown conditionally
 * based on available data.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamDetail } from "./TeamDetail";
import type { RosterPlayer, StaffMember } from "../TeamRoster";
import type { ScheduleMatch } from "../TeamSchedule";
import type { StandingsEntry } from "../TeamStandings";

// ---------------------------------------------------------------------------
// Fixture images
// ---------------------------------------------------------------------------

const PLAYER_IMAGES = {
  chiel:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
  jarne:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/jarne-front.png",
  louie:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/louie-front.png",
  yoran:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/yoran-front.png",
};

// ---------------------------------------------------------------------------
// Mock staff
// ---------------------------------------------------------------------------

const mockStaff: StaffMember[] = [
  {
    id: "staff-1",
    firstName: "Marc",
    lastName: "Janssen",
    role: "Hoofdtrainer",
    roleCode: "T1",
    imageUrl: PLAYER_IMAGES.chiel,
  },
  {
    id: "staff-2",
    firstName: "Koen",
    lastName: "Peeters",
    role: "Assistent-trainer",
    roleCode: "T2",
    imageUrl: PLAYER_IMAGES.jarne,
  },
  {
    id: "staff-3",
    firstName: "Pieter",
    lastName: "De Smet",
    role: "Keeperstrainer",
    roleCode: "TK",
  },
];

// ---------------------------------------------------------------------------
// Mock players
// ---------------------------------------------------------------------------

const mockPlayers: RosterPlayer[] = [
  {
    id: "player-1",
    firstName: "Thomas",
    lastName: "Vermeersch",
    position: "Keeper",
    number: 1,
    href: "/spelers/thomas-vermeersch",
    imageUrl: PLAYER_IMAGES.louie,
  },
  {
    id: "player-2",
    firstName: "Jef",
    lastName: "Willems",
    position: "Verdediger",
    number: 4,
    href: "/spelers/jef-willems",
  },
  {
    id: "player-3",
    firstName: "Arne",
    lastName: "Claes",
    position: "Verdediger",
    number: 5,
    href: "/spelers/arne-claes",
    imageUrl: PLAYER_IMAGES.chiel,
  },
  {
    id: "player-4",
    firstName: "Lucas",
    lastName: "Mertens",
    position: "Middenvelder",
    number: 8,
    href: "/spelers/lucas-mertens",
    imageUrl: PLAYER_IMAGES.yoran,
  },
  {
    id: "player-5",
    firstName: "Ruben",
    lastName: "Jacobs",
    position: "Middenvelder",
    number: 10,
    href: "/spelers/ruben-jacobs",
  },
  {
    id: "player-6",
    firstName: "Stef",
    lastName: "Van den Berg",
    position: "Aanvaller",
    number: 9,
    href: "/spelers/stef-van-den-berg",
    imageUrl: PLAYER_IMAGES.jarne,
  },
  {
    id: "player-7",
    firstName: "Dries",
    lastName: "Wouters",
    position: "Aanvaller",
    number: 11,
    href: "/spelers/dries-wouters",
  },
];

// ---------------------------------------------------------------------------
// Mock matches
// ---------------------------------------------------------------------------

const KCVV_TEAM_ID = 12345;

const mockMatches: ScheduleMatch[] = [
  {
    id: 1,
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    time: "15:00",
    homeTeam: { id: KCVV_TEAM_ID, name: "KCVV Elewijt" },
    awayTeam: { id: 200, name: "Racing Mechelen" },
    homeScore: 3,
    awayScore: 1,
    status: "finished",
    competition: "3de Nationale A",
  },
  {
    id: 2,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    time: "15:00",
    homeTeam: { id: 201, name: "Diegem Sport" },
    awayTeam: { id: KCVV_TEAM_ID, name: "KCVV Elewijt" },
    homeScore: 0,
    awayScore: 2,
    status: "finished",
    competition: "3de Nationale A",
  },
  {
    id: 3,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    time: "15:00",
    homeTeam: { id: KCVV_TEAM_ID, name: "KCVV Elewijt" },
    awayTeam: { id: 202, name: "Strombeek" },
    status: "scheduled",
    competition: "3de Nationale A",
  },
  {
    id: 4,
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    time: "15:00",
    homeTeam: { id: 203, name: "FC Kampenhout" },
    awayTeam: { id: KCVV_TEAM_ID, name: "KCVV Elewijt" },
    status: "scheduled",
    competition: "3de Nationale A",
  },
  {
    id: 5,
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    time: "15:00",
    homeTeam: { id: KCVV_TEAM_ID, name: "KCVV Elewijt" },
    awayTeam: { id: 204, name: "Jeugd Zemst" },
    status: "scheduled",
    competition: "3de Nationale A",
  },
];

// ---------------------------------------------------------------------------
// Mock standings
// ---------------------------------------------------------------------------

const mockStandings: StandingsEntry[] = [
  {
    position: 1,
    teamId: 205,
    teamName: "Racing Mechelen",
    played: 20,
    won: 15,
    drawn: 3,
    lost: 2,
    goalsFor: 48,
    goalsAgainst: 18,
    goalDifference: 30,
    points: 48,
  },
  {
    position: 2,
    teamId: KCVV_TEAM_ID,
    teamName: "KCVV Elewijt",
    played: 20,
    won: 12,
    drawn: 5,
    lost: 3,
    goalsFor: 38,
    goalsAgainst: 18,
    goalDifference: 20,
    points: 41,
  },
  {
    position: 3,
    teamId: 201,
    teamName: "Diegem Sport",
    played: 20,
    won: 11,
    drawn: 4,
    lost: 5,
    goalsFor: 35,
    goalsAgainst: 22,
    goalDifference: 13,
    points: 37,
  },
  {
    position: 4,
    teamId: 202,
    teamName: "Strombeek",
    played: 20,
    won: 10,
    drawn: 4,
    lost: 6,
    goalsFor: 30,
    goalsAgainst: 25,
    goalDifference: 5,
    points: 34,
  },
  {
    position: 5,
    teamId: 203,
    teamName: "FC Kampenhout",
    played: 20,
    won: 9,
    drawn: 3,
    lost: 8,
    goalsFor: 28,
    goalsAgainst: 28,
    goalDifference: 0,
    points: 30,
  },
  {
    position: 6,
    teamId: 204,
    teamName: "Jeugd Zemst",
    played: 20,
    won: 7,
    drawn: 3,
    lost: 10,
    goalsFor: 22,
    goalsAgainst: 35,
    goalDifference: -13,
    points: 24,
  },
];

// ---------------------------------------------------------------------------
// Shared content fixtures
// ---------------------------------------------------------------------------

const contactInfo = `
<p><strong>Training:</strong> Dinsdag en donderdag van 18u30 tot 20u00</p>
<p><strong>Locatie:</strong> Sportcomplex Elewijt, Tervuursesteenweg 252</p>
<p><strong>Contact:</strong> <a href="mailto:info@kcvvelewijt.be">info@kcvvelewijt.be</a></p>
`;

const bodyContent = `
<p>De U15 is een ambitieuze ploeg die zich richt op de verdere ontwikkeling van jonge talenten.
Met een focus op techniek, tactiek en teamspirit bereiden we onze spelers voor op de volgende stap in hun voetbalcarrière.</p>
<p>We trainen twee keer per week en nemen deel aan de gewestelijke competitie.</p>
`;

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: "Pages/TeamDetail",
  component: TeamDetail,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Page-level layout for team detail pages. URL-synced tabs show Info, Lineup, Wedstrijden, and Stand — each tab appears only when data is available.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TeamDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Senior team with all four tabs: Info, Lineup, Wedstrijden, Stand.
 */
export const SeniorTeam: Story = {
  args: {
    header: {
      name: "Eerste Ploeg",
      tagline: "3de Nationale A",
      teamType: "senior",
      imageUrl: "https://picsum.photos/seed/team-senior/1200/400",
      stats: {
        wins: 12,
        draws: 5,
        losses: 3,
        goalsFor: 38,
        goalsAgainst: 18,
        position: 2,
      },
    },
    contactInfo,
    staff: mockStaff,
    players: mockPlayers,
    matches: mockMatches,
    standings: mockStandings,
    highlightTeamId: KCVV_TEAM_ID,
    teamSlug: "a-ploeg",
  },
};

/**
 * Youth team with Info and Lineup tabs only (no Footbalisto data).
 */
export const YouthTeam: Story = {
  args: {
    header: {
      name: "U15A",
      tagline: "GEWESTELIJKE U15 K",
      ageGroup: "U15",
      teamType: "youth",
      imageUrl: "https://picsum.photos/seed/team-u15/1200/400",
    },
    contactInfo,
    bodyContent,
    staff: mockStaff,
    players: mockPlayers,
  },
};

/**
 * Staff-only team — no players, so staff shows in Info tab and no Lineup tab.
 */
export const StaffOnly: Story = {
  args: {
    header: {
      name: "U6 Kleuters",
      tagline: "Recreatief",
      ageGroup: "U6",
      teamType: "youth",
    },
    contactInfo,
    bodyContent:
      "<p>Bij de U6 staat plezier centraal. We leren de kleintjes de basis van het voetbal in een speelse omgeving.</p>",
    staff: mockStaff.slice(0, 2),
    players: [],
  },
};

/**
 * Empty state — no players, no staff, no content, no matches. Info tab only.
 */
export const EmptyState: Story = {
  args: {
    header: {
      name: "Nieuwe Ploeg",
      tagline: "In opbouw",
      teamType: "youth",
    },
  },
};

/**
 * Info + Matches + Stand tabs only (no roster loaded yet).
 */
export const WithMatchesNoRoster: Story = {
  args: {
    header: {
      name: "Tweede Ploeg",
      tagline: "4de Provinciale",
      teamType: "senior",
    },
    matches: mockMatches,
    standings: mockStandings,
    highlightTeamId: KCVV_TEAM_ID,
    teamSlug: "tweede-ploeg",
  },
};

/**
 * Mobile viewport — single-column stacked layout.
 */
export const MobileViewport: Story = {
  ...SeniorTeam,
  globals: {
    viewport: { value: "kcvvMobile" },
  },
};
