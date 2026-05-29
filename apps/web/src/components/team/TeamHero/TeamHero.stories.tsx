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
          "Phase 6.C hero band for `/ploegen/[slug]`. Category-forward identity (A-ploeg./U13.) with a taped squad polaroid or JerseyShirt fallback. Composition: left words / right artefact; artefact moves above headline on mobile.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    age: { control: "text" },
    teamType: { control: "select", options: ["senior", "youth"] },
    division: { control: "text" },
    divisionFull: { control: "text" },
    season: { control: "text" },
    tagline: { control: "text" },
    teamImageUrl: { control: "text" },
  },
} satisfies Meta<typeof TeamHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A-team with squad photo — canonical senior hero composition. */
export const ATeamWithPhoto: Story = {
  args: {
    age: "A",
    teamType: "senior",
    divisionFull: "Eerste Elftal A – 3e Nat. A",
    division: "3NA",
    season: "25/26",
    tagline: "Sterk, gedreven, één ploeg.",
    teamImageUrl: "/player-fixtures/player-mendes-mouro.jpg",
  },
};

/** A-team without squad photo — JerseyShirt fallback in the same frame. */
export const ATeamNoPhoto: Story = {
  args: {
    age: "A",
    teamType: "senior",
    divisionFull: "Eerste Elftal A – 3e Nat. A",
    division: "3NA",
    season: "25/26",
    tagline: "Sterk, gedreven, één ploeg.",
  },
};

/** Youth U13 — degraded meta (youth band + season; no division), JerseyShirt fallback. */
export const YouthU13: Story = {
  args: {
    age: "U13",
    teamType: "youth",
    ageGroup: "U13",
    season: "25/26",
  },
};
