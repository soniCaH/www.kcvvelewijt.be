import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PlayerVM } from "@/lib/repositories/player.repository";
import { SquadGrid } from "./SquadGrid";

const PHOTOS = {
  a: "/player-fixtures/player-mendes-mouro.jpg",
  b: "/player-fixtures/player-schulz.jpg",
  c: "/player-fixtures/player-vartolomaios.jpg",
};

function p(
  id: string,
  firstName: string,
  lastName: string,
  position: string | undefined,
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

const meta = {
  title: "Features/Teams/SquadGrid",
  component: SquadGrid,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SquadGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const fullSquad: PlayerVM[] = [
  p("1", "Jonas", "Vermeer", "Keeper", 1, PHOTOS.a),
  p("16", "Lars", "De Smet", "Keeper", 16),
  p("2", "Bram", "Wouters", "Verdediger", 2, PHOTOS.b),
  p("3", "Senne", "Maes", "Verdediger", 3, PHOTOS.c),
  p("4", "Thibault", "Claes", "Verdediger", 4),
  p("6", "Yanni", "Janssens", "Middenvelder", 6, PHOTOS.a),
  p("8", "Robbe", "Mertens", "Middenvelder", 8, PHOTOS.b),
  p("9", "Maxim", "Breugelmans", "Aanvaller", 9, PHOTOS.c),
  p("11", "Stan", "Coppens", "Aanvaller", 11),
];

/**
 * Full four-group squad (Doelmannen · Verdedigers · Middenvelders ·
 * Aanvallers) with a mix of photos and illustration fallbacks — the U17/U19
 * shape the position buckets exist for (#2638).
 */
export const FullSquad: Story = {
  args: { players: fullSquad },
};

/**
 * Ungrouped — a single implicit group (the trailing "Spelers" catch-all),
 * so the partition-gate (#2638) hides the heading entirely. This is the U9
 * shape: nobody's position is known, keeper or otherwise.
 */
export const Ungrouped: Story = {
  args: {
    players: [
      p("20", "Vince", "Aerts", undefined, 20),
      p("21", "Milan", "Goossens", undefined, 21),
      p("22", " + extra", "Player", undefined, 22),
    ],
  },
};

/**
 * Two groups (Doelmannen + the trailing Spelers catch-all) — e.g. `kcvve-u10`
 * today: one known keeper, the rest unauthored. Both headings still render;
 * the gate only fires on a single group.
 */
export const TwoGroups: Story = {
  args: {
    players: [
      p("30", "Jarne", "De Backer", "Keeper", 1, PHOTOS.a),
      p("31", "Wout", "Peeters", undefined, 4),
      p("32", "Robbe", "Van Hove", undefined, 7),
    ],
  },
};

/**
 * Youth squad (#3431) — the same players as `FullSquad`, split only in
 * Doelmannen and Veldspelers. Senior squads keep the four position groups.
 */
export const YouthSquad: Story = {
  args: { players: fullSquad, teamType: "youth" },
};
