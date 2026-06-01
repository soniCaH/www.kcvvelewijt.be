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

/** Full position-grouped squad with a mix of photos and illustration fallbacks. */
export const FullSquad: Story = {
  args: { players: fullSquad },
};

/** Youth-style squad — all "Speler" → trailing Spelers group, all illustrations. */
export const UnmappedPositions: Story = {
  args: {
    players: [
      p("20", "Vince", "Aerts", "Speler", 20),
      p("21", "Milan", "Goossens", "Speler", 21),
      p("22", " + extra", "Player", "Speler", 22),
    ],
  },
};
