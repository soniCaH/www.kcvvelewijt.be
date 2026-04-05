/**
 * TeamRoster Component Stories
 *
 * Player grid showing full team roster grouped by position.
 * Displays PlayerCard components organized by position (GK, DEF, MID, FWD).
 *
 * Stories created BEFORE implementation (Storybook-first workflow).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamRoster } from "./TeamRoster";

// Real player images from KCVV API (with transparent backgrounds)
const REAL_PLAYER_IMAGES = {
  chiel:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
  jarne:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/jarne-front.png",
  louie:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/louie-front.png",
  yoran:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/yoran-front.png",
};

// Mock player data matching Drupal API structure with real player images
const MOCK_PLAYERS = {
  goalkeepers: [
    {
      id: "gk-1",
      firstName: "Kevin",
      lastName: "Van Ransbeeck",
      position: "Keeper",
      number: 1,
      href: "/speler/kevin-van-ransbeeck",
      imageUrl: REAL_PLAYER_IMAGES.louie,
    },
    {
      id: "gk-2",
      firstName: "Jean-Baptiste",
      lastName: "Van Der Meersberghen",
      position: "Keeper",
      number: 16,
      href: "/speler/bram-willems",
      // No image - tests placeholder
    },
  ],
  defenders: [
    {
      id: "def-1",
      firstName: "Jan",
      lastName: "Peeters",
      position: "Verdediger",
      number: 2,
      href: "/speler/jan-peeters",
      imageUrl: REAL_PLAYER_IMAGES.chiel,
    },
    {
      id: "def-2",
      firstName: "Pieter",
      lastName: "Janssens",
      position: "Verdediger",
      number: 3,
      href: "/speler/pieter-janssens",
      imageUrl: REAL_PLAYER_IMAGES.yoran,
    },
    {
      id: "def-3",
      firstName: "Thomas",
      lastName: "Maes",
      position: "Verdediger",
      number: 4,
      href: "/speler/thomas-maes",
      isCaptain: true,
      imageUrl: REAL_PLAYER_IMAGES.jarne,
    },
    {
      id: "def-4",
      firstName: "Jef",
      lastName: "De Smedt",
      position: "Verdediger",
      number: 5,
      href: "/speler/jef-de-smedt",
      imageUrl: REAL_PLAYER_IMAGES.chiel,
    },
  ],
  midfielders: [
    {
      id: "mid-1",
      firstName: "Wouter",
      lastName: "Vermeersch",
      position: "Middenvelder",
      number: 6,
      href: "/speler/wouter-vermeersch",
      imageUrl: REAL_PLAYER_IMAGES.yoran,
    },
    {
      id: "mid-2",
      firstName: "Stijn",
      lastName: "Claes",
      position: "Middenvelder",
      number: 8,
      href: "/speler/stijn-claes",
      imageUrl: REAL_PLAYER_IMAGES.jarne,
    },
    {
      id: "mid-3",
      firstName: "Raf",
      lastName: "Wouters",
      position: "Middenvelder",
      number: 10,
      href: "/speler/raf-wouters",
      imageUrl: REAL_PLAYER_IMAGES.louie,
    },
    {
      id: "mid-4",
      firstName: "Koen",
      lastName: "Van Damme",
      position: "Middenvelder",
      number: 14,
      href: "/speler/koen-van-damme",
      // No image - tests placeholder
    },
  ],
  forwards: [
    {
      id: "fwd-1",
      firstName: "Michiel",
      lastName: "Hendrickx",
      position: "Aanvaller",
      number: 7,
      href: "/speler/michiel-hendrickx",
      imageUrl: REAL_PLAYER_IMAGES.chiel,
    },
    {
      id: "fwd-2",
      firstName: "Bert",
      lastName: "Goossens",
      position: "Aanvaller",
      number: 9,
      href: "/speler/bert-goossens",
      imageUrl: REAL_PLAYER_IMAGES.jarne,
    },
    {
      id: "fwd-3",
      firstName: "Lars",
      lastName: "Mertens",
      position: "Aanvaller",
      number: 11,
      href: "/speler/lars-mertens",
      imageUrl: REAL_PLAYER_IMAGES.yoran,
    },
  ],
};

const MOCK_STAFF = [
  {
    id: "staff-1",
    firstName: "Marc",
    lastName: "Van den Berg",
    role: "Hoofdtrainer",
    functionTitle: "T1",
    imageUrl: REAL_PLAYER_IMAGES.chiel,
  },
  {
    id: "staff-2",
    firstName: "Dirk",
    lastName: "Hermans",
    role: "Assistent-trainer",
    functionTitle: "T2",
    imageUrl: REAL_PLAYER_IMAGES.jarne,
  },
  {
    id: "staff-3",
    firstName: "Peter",
    lastName: "Jacobs",
    role: "Keeperstrainer",
    functionTitle: "TK",
    // No image - tests placeholder
  },
  {
    id: "staff-4",
    firstName: "Johan",
    lastName: "De Vries",
    role: "TV Jeugdopleiding",
    functionTitle: "TVJO",
  },
  {
    id: "staff-5",
    firstName: "Stefan",
    lastName: "Peeters",
    role: "Ploegdelegé",
    functionTitle: "PDG",
    imageUrl: REAL_PLAYER_IMAGES.yoran,
  },
];

const ALL_PLAYERS = [
  ...MOCK_PLAYERS.goalkeepers,
  ...MOCK_PLAYERS.defenders,
  ...MOCK_PLAYERS.midfielders,
  ...MOCK_PLAYERS.forwards,
];

const meta = {
  title: "Features/Teams/TeamRoster",
  component: TeamRoster,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
Player grid showing full team roster.

**Features:**
- Players grouped by position (GK, DEF, MID, FWD)
- Position section headers with player count
- Optional staff display (coaches, trainers)
- Compact list view variant
- Loading skeleton grid
- Empty state handling

**Position Order:**
1. Keepers (Keeper)
2. Verdedigers (Verdediger)
3. Middenvelders (Middenvelder)
4. Aanvallers (Aanvaller)

**Usage:**
Used on team detail pages to display the full squad.
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    players: {
      control: "object",
      description: "Array of player data",
    },
    staff: {
      control: "object",
      description: "Array of staff data (coaches, trainers)",
    },
    teamName: {
      control: "text",
      description: "Team name for accessibility",
    },
    groupByPosition: {
      control: "boolean",
      description: "Group players by position with headers",
    },
    showStaff: {
      control: "boolean",
      description: "Display staff section",
    },
    variant: {
      control: "radio",
      options: ["grid", "compact"],
      description: "Layout variant",
    },
    isLoading: {
      control: "boolean",
      description: "Show loading skeleton",
    },
    emptyMessage: {
      control: "text",
      description: "Message when no players found",
    },
  },
} satisfies Meta<typeof TeamRoster>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default - Full roster grouped by position
 */
export const Default: Story = {
  args: {
    players: ALL_PLAYERS,
    teamName: "A-Ploeg",
    groupByPosition: true,
  },
};

/**
 * With staff section (coaches, trainers)
 */
export const WithStaff: Story = {
  args: {
    players: ALL_PLAYERS,
    staff: MOCK_STAFF,
    teamName: "A-Ploeg",
    groupByPosition: true,
    showStaff: true,
  },
};

/**
 * Compact list view - denser layout
 */
export const Compact: Story = {
  args: {
    players: ALL_PLAYERS,
    teamName: "A-Ploeg",
    variant: "compact",
    groupByPosition: true,
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  args: {
    players: [],
    teamName: "A-Ploeg",
    isLoading: true,
  },
};

/**
 * Empty state - no players
 */
export const Empty: Story = {
  args: {
    players: [],
    teamName: "A-Ploeg",
    emptyMessage: "Geen spelers gevonden voor dit team",
  },
};

/**
 * Without position grouping - flat list
 */
export const FlatList: Story = {
  args: {
    players: ALL_PLAYERS,
    teamName: "A-Ploeg",
    groupByPosition: false,
  },
};

/**
 * Only goalkeepers
 */
export const GoalkeepersOnly: Story = {
  args: {
    players: MOCK_PLAYERS.goalkeepers,
    teamName: "A-Ploeg",
    groupByPosition: true,
  },
};

/**
 * Youth team roster (smaller squad)
 */
export const YouthTeam: Story = {
  args: {
    players: [
      ...MOCK_PLAYERS.goalkeepers.slice(0, 1),
      ...MOCK_PLAYERS.defenders.slice(0, 3),
      ...MOCK_PLAYERS.midfielders.slice(0, 3),
      ...MOCK_PLAYERS.forwards.slice(0, 2),
    ],
    staff: MOCK_STAFF.slice(0, 2),
    teamName: "U17",
    groupByPosition: true,
    showStaff: true,
  },
};

/**
 * Mobile viewport
 */
export const MobileView: Story = {
  args: {
    players: ALL_PLAYERS.slice(0, 8),
    teamName: "A-Ploeg",
    groupByPosition: true,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Staff only (no players)
 */
export const StaffOnly: Story = {
  args: {
    players: [],
    staff: MOCK_STAFF,
    teamName: "Technische Staf",
    showStaff: true,
    emptyMessage: "Geen spelers in deze selectie",
  },
};
