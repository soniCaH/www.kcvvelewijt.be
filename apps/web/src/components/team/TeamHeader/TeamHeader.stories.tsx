/**
 * TeamHeader Component Stories
 *
 * Hero section for team detail pages.
 * Displays team name, photo, and optional coach info.
 *
 * Stories created BEFORE implementation (Storybook-first workflow).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamHeader } from "./TeamHeader";

const meta = {
  title: "Features/Teams/TeamHeader",
  component: TeamHeader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
Hero section for team detail pages.

**Features:**
- Team name with optional tagline
- Team/group photo banner
- Age group badge for youth teams
- Optional coach info display
- Responsive layout (stacked on mobile)

**Usage:**
Used at the top of team detail pages (/team/[slug], /jeugd/[slug]).
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    name: { control: "text", description: "Team name" },
    tagline: { control: "text", description: "Team tagline or motto" },
    imageUrl: { control: "text", description: "Team/group photo URL" },
    ageGroup: { control: "text", description: "Age group for youth teams" },
    teamType: {
      control: "select",
      options: ["senior", "youth", "club"],
      description: "Team type for styling",
    },
    coach: { control: "object", description: "Coach information" },
    isLoading: { control: "boolean", description: "Loading state" },
  },
} satisfies Meta<typeof TeamHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default - Team name and photo
 */
export const Default: Story = {
  args: {
    name: "A-Ploeg",
    tagline: "Eerste elftal van KCVV Elewijt",
    imageUrl: "https://picsum.photos/seed/team-header/1200/400",
    teamType: "senior",
  },
};

/**
 * With coach info prominent
 */
export const WithCoach: Story = {
  args: {
    name: "A-Ploeg",
    tagline: "Eerste elftal van KCVV Elewijt",
    imageUrl: "https://picsum.photos/seed/team-coach/1200/400",
    teamType: "senior",
    coach: {
      name: "Marc Van den Berg",
      role: "Hoofdtrainer",
      imageUrl:
        "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
    },
  },
};

/**
 * Youth team with age badge
 */
export const Youth: Story = {
  args: {
    name: "U17",
    tagline: "Scholieren",
    imageUrl: "https://picsum.photos/seed/team-youth/1200/400",
    ageGroup: "U17",
    teamType: "youth",
    coach: {
      name: "Jan Peeters",
      role: "Trainer",
    },
  },
};

/**
 * Senior team with full details
 */
export const Senior: Story = {
  args: {
    name: "A-Ploeg",
    tagline: "Eerste elftal van KCVV Elewijt",
    imageUrl: "https://picsum.photos/seed/team-senior/1200/400",
    teamType: "senior",
    coach: {
      name: "Marc Van den Berg",
      role: "Hoofdtrainer",
      imageUrl:
        "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
    },
  },
};

/**
 * Club/Organization team
 */
export const Club: Story = {
  args: {
    name: "Bestuur & Dagelijkse Werking",
    tagline: "Het kloppend hart van de club",
    imageUrl: "https://picsum.photos/seed/team-club/1200/400",
    teamType: "club",
  },
};

/**
 * Without photo - placeholder background
 */
export const WithoutPhoto: Story = {
  args: {
    name: "B-Ploeg",
    tagline: "Reserve elftal",
    teamType: "senior",
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  args: {
    name: "",
    isLoading: true,
  },
};

/**
 * Mobile viewport
 */
export const MobileView: Story = {
  args: {
    name: "U15",
    tagline: "Kadetten",
    imageUrl: "https://picsum.photos/seed/team-mobile/1200/400",
    ageGroup: "U15",
    teamType: "youth",
    coach: {
      name: "Dirk Hermans",
      role: "Trainer",
    },
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Minimal - just team name
 */
export const Minimal: Story = {
  args: {
    name: "Veteranen",
    teamType: "senior",
  },
};
