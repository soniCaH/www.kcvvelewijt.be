import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MentionedEntitiesStrip } from "./MentionedEntitiesStrip";
import type {
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
} from "../types";

const player1: RelatedPlayerItem = {
  type: "player",
  source: "reference",
  id: "p-1",
  firstName: "Lirian",
  lastName: "Zumberaj",
  position: "Aanvaller",
  imageUrl: "https://picsum.photos/seed/lirian/200/200",
  psdId: "12345",
};

const player2: RelatedPlayerItem = {
  type: "player",
  source: "reference",
  id: "p-2",
  firstName: "Jan",
  lastName: "Janssens",
  position: "Middenvelder",
  imageUrl: "https://picsum.photos/seed/jan/200/200",
  psdId: "23456",
};

const player3: RelatedPlayerItem = {
  type: "player",
  source: "reference",
  id: "p-3",
  firstName: "Pieter",
  lastName: "De Smet",
  position: "Verdediger",
  imageUrl: null,
  psdId: "34567",
};

const team1: RelatedTeamItem = {
  type: "team",
  source: "reference",
  id: "t-1",
  name: "Eerste Elftal A",
  slug: "eerste-elftal-a",
  imageUrl: "https://picsum.photos/seed/team-a/300/200",
  tagline: "3e Nationale A",
};

const team2: RelatedTeamItem = {
  type: "team",
  source: "reference",
  id: "t-2",
  name: "U17",
  slug: "u17",
  imageUrl: null,
  tagline: "Provinciale jeugdcompetitie",
};

const staff1: RelatedStaffItem = {
  type: "staff",
  source: "reference",
  id: "s-1",
  firstName: "Marc",
  lastName: "Vermeulen",
  role: "Hoofdtrainer",
  imageUrl: "https://picsum.photos/seed/marc/200/200",
};

const staff2: RelatedStaffItem = {
  type: "staff",
  source: "reference",
  id: "s-2",
  firstName: "Sofie",
  lastName: "Peeters",
  role: "Jeugdcoördinator",
  imageUrl: null,
};

const meta = {
  title: "Features/Related/MentionedEntitiesStrip",
  component: MentionedEntitiesStrip,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'Compact strip listing players, teams, and staff "mentioned in this article". ' +
          "Renders pills with avatar (circle for people, rounded-square for teams) + name + role/position. " +
          "Wraps on overflow. Hidden when no entities. " +
          "Sits ABOVE the magazine Gerelateerd grid — separates ontology (who/what) from editorial (read more).",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1120 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MentionedEntitiesStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mixed: Story = {
  args: {
    entities: [player1, player2, team1, staff1, player3, staff2, team2],
  },
};

export const PlayersOnly: Story = {
  args: { entities: [player1, player2, player3] },
};

export const TeamsOnly: Story = {
  args: { entities: [team1, team2] },
};

export const SingleEntity: Story = {
  args: { entities: [player1] },
};

export const ManyWraps: Story = {
  args: {
    entities: [
      player1,
      player2,
      player3,
      team1,
      team2,
      staff1,
      staff2,
      { ...player1, id: "p-4", firstName: "Tom", lastName: "Claes" },
      { ...player2, id: "p-5", firstName: "Bart", lastName: "Van Hove" },
      { ...player3, id: "p-6", firstName: "Wim", lastName: "Maes" },
      { ...staff1, id: "s-3", firstName: "Erik", lastName: "Daems" },
      { ...team1, id: "t-3", name: "U15", tagline: "Provinciale" },
    ],
  },
};

export const NoImages: Story = {
  args: {
    entities: [
      { ...player1, imageUrl: null },
      { ...player2, imageUrl: null },
      { ...team1, imageUrl: null },
      { ...staff1, imageUrl: null },
    ],
  },
};

export const Empty: Story = {
  args: { entities: [] },
};
