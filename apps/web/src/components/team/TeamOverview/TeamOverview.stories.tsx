/**
 * TeamOverview Component Stories
 *
 * Grid/list of teams for overview pages like /jeugd.
 * Displays multiple TeamCard components in a responsive grid.
 *
 * Stories created BEFORE implementation (Storybook-first workflow).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamOverview } from "./TeamOverview";

// Mock team data matching Drupal API structure
const MOCK_TEAMS = {
  youth: [
    { name: "U6", slug: "u6", ageGroup: "U6" },
    { name: "U7", slug: "u7", ageGroup: "U7" },
    { name: "U8 - Groen", slug: "u8", ageGroup: "U8" },
    { name: "U8 - Wit", slug: "u8-wit", ageGroup: "U8" },
    { name: "U9 - A", slug: "u9", ageGroup: "U9" },
    { name: "U10", slug: "u10", ageGroup: "U10" },
    { name: "U11", slug: "u11", ageGroup: "U11" },
    { name: "U12", slug: "u12", ageGroup: "U12" },
    { name: "U13", slug: "u13", ageGroup: "U13" },
    { name: "U14", slug: "u14", ageGroup: "U14" },
    { name: "U15", slug: "u15", ageGroup: "U15" },
    { name: "U16", slug: "u16", ageGroup: "U16" },
    { name: "U17", slug: "u17", ageGroup: "U17" },
    { name: "U21", slug: "u21", ageGroup: "U21" },
  ],
  senior: [
    {
      name: "A-Ploeg",
      slug: "a-ploeg",
      tagline: "The A-Team",
      imageUrl: "https://picsum.photos/seed/ateam/400/300",
    },
    { name: "B-Ploeg", slug: "b-ploeg", tagline: "The B-Team" },
    { name: "Veteranen", slug: "veteranen", tagline: "Vets" },
  ],
  club: [
    {
      name: "Bestuur & Dagelijkse Werking",
      slug: "bestuur",
      tagline: "Het kloppend hart van de club",
    },
    {
      name: "Jeugdbestuur",
      slug: "jeugdbestuur",
      tagline: "De begeleiding van de toekomst",
    },
    { name: "KCVV Angels", slug: "angels", tagline: "De feestneuzen" },
  ],
};

const meta = {
  title: "Features/Teams/TeamOverview",
  component: TeamOverview,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
Grid/list component for displaying multiple teams.

**Features:**
- Responsive grid layout (1-4 columns depending on viewport)
- Filter by team type (senior, youth, club)
- Group by age for youth teams
- Loading skeleton grid
- Empty state handling

**Usage:**
Used on /jeugd overview page and team listing pages.
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    teams: {
      control: "object",
      description: "Array of team data",
    },
    teamType: {
      control: "select",
      options: ["all", "senior", "youth", "club"],
      description: "Filter by team type",
    },
    groupByAge: {
      control: "boolean",
      description: "Group youth teams by age category",
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
      description: "Message when no teams found",
    },
  },
} satisfies Meta<typeof TeamOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default - All youth teams in grid
 */
export const Default: Story = {
  args: {
    teams: MOCK_TEAMS.youth.map((t) => ({
      ...t,
      href: `/jeugd/${t.slug}`,
      teamType: "youth" as const,
    })),
    teamType: "youth",
  },
};

/**
 * Youth teams grouped by age category
 */
export const ByAgeGroup: Story = {
  args: {
    teams: MOCK_TEAMS.youth.map((t) => ({
      ...t,
      href: `/jeugd/${t.slug}`,
      teamType: "youth" as const,
    })),
    teamType: "youth",
    groupByAge: true,
  },
};

/**
 * Senior teams
 */
export const SeniorTeams: Story = {
  args: {
    teams: MOCK_TEAMS.senior.map((t) => ({
      ...t,
      href: `/ploegen/${t.slug}`,
      teamType: "senior" as const,
    })),
    teamType: "senior",
  },
};

/**
 * Club/organization teams
 */
export const ClubTeams: Story = {
  args: {
    teams: MOCK_TEAMS.club.map((t) => ({
      ...t,
      href: `/club/${t.slug}`,
      teamType: "club" as const,
    })),
    teamType: "club",
  },
};

/**
 * All teams mixed
 */
export const AllTeams: Story = {
  args: {
    teams: [
      ...MOCK_TEAMS.senior.map((t) => ({
        ...t,
        href: `/ploegen/${t.slug}`,
        teamType: "senior" as const,
      })),
      ...MOCK_TEAMS.youth.slice(0, 6).map((t) => ({
        ...t,
        href: `/jeugd/${t.slug}`,
        teamType: "youth" as const,
      })),
      ...MOCK_TEAMS.club.map((t) => ({
        ...t,
        href: `/club/${t.slug}`,
        teamType: "club" as const,
      })),
    ],
    teamType: "all",
  },
};

/**
 * Compact grid variant
 */
export const CompactGrid: Story = {
  args: {
    teams: MOCK_TEAMS.youth.map((t) => ({
      ...t,
      href: `/jeugd/${t.slug}`,
      teamType: "youth" as const,
    })),
    teamType: "youth",
    variant: "compact",
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  args: {
    teams: [],
    isLoading: true,
  },
};

/**
 * Empty state - no teams found
 */
export const Empty: Story = {
  args: {
    teams: [],
    emptyMessage: "Geen teams gevonden",
  },
};

/**
 * With filters visible
 */
export const WithFilters: Story = {
  args: {
    teams: [
      ...MOCK_TEAMS.senior.map((t) => ({
        ...t,
        href: `/ploegen/${t.slug}`,
        teamType: "senior" as const,
      })),
      ...MOCK_TEAMS.youth.map((t) => ({
        ...t,
        href: `/jeugd/${t.slug}`,
        teamType: "youth" as const,
      })),
    ],
    teamType: "all",
    showFilters: true,
  },
};

/**
 * Mobile viewport
 */
export const MobileView: Story = {
  args: {
    teams: MOCK_TEAMS.youth.slice(0, 6).map((t) => ({
      ...t,
      href: `/jeugd/${t.slug}`,
      teamType: "youth" as const,
    })),
    teamType: "youth",
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Few teams - tests grid with minimal content
 */
export const FewTeams: Story = {
  args: {
    teams: MOCK_TEAMS.senior.slice(0, 2).map((t) => ({
      ...t,
      href: `/ploegen/${t.slug}`,
      teamType: "senior" as const,
    })),
    teamType: "senior",
  },
};
