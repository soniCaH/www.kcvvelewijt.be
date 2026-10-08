import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamHero } from "./TeamHero";

const meta = {
  title: "Features/Teams/TeamHero",
  component: TeamHero,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase 6.C hero band for `/ploegen/[slug]`. Headline is the team's display name (`teamDisplayName()`, #2630) — never derived here. Landscape squad photo or JerseyShirt fallback. Two-column desktop / artefact-above-headline mobile.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    displayName: { control: "text" },
    teamType: { control: "select", options: ["senior", "youth"] },
    division: { control: "text" },
    divisionFull: { control: "text" },
    tagline: { control: "text" },
    teamImageUrl: { control: "text" },
  },
} satisfies Meta<typeof TeamHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A-team with squad photo — canonical senior hero composition. The photo is a
 * button that opens the uncropped photo full screen (#3447).
 */
export const ATeamWithPhoto: Story = {
  args: {
    displayName: "A-ploeg",
    teamType: "senior",
    divisionFull: "Eerste Elftal A – 3e Nat. A",
    division: "3NA",
    tagline: "Sterk, gedreven, één ploeg.",
    teamImageUrl: "/player-fixtures/player-mendes-mouro.jpg",
    photoViewer: {
      fullUrl: "/player-fixtures/player-mendes-mouro.jpg",
      teamSlug: "a-ploeg",
    },
  },
};

/** A-team without squad photo — JerseyShirt fallback in the same frame. */
export const ATeamNoPhoto: Story = {
  args: {
    displayName: "A-ploeg",
    teamType: "senior",
    divisionFull: "Eerste Elftal A – 3e Nat. A",
    division: "3NA",
    tagline: "Sterk, gedreven, één ploeg.",
  },
};

/** Youth U13 — degraded meta (youth band only; no division), JerseyShirt fallback. */
export const YouthU13: Story = {
  args: {
    displayName: "U13",
    teamType: "youth",
    ageGroup: "U13",
  },
};
