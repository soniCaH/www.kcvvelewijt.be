import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InterviewHero } from "./InterviewHero";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";

const playerFull: IndexedSubject = {
  _key: "k1",
  kind: "player",
  playerRef: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    jerseyNumber: 9,
    position: "Middenvelder",
    transparentImageUrl: null,
    psdImageUrl: null,
  },
};

const playerJerseyOnly: IndexedSubject = {
  _key: "k1",
  kind: "player",
  playerRef: {
    firstName: "Jan",
    lastName: "Janssens",
    jerseyNumber: 7,
    position: null,
    transparentImageUrl: null,
    psdImageUrl: null,
  },
};

const playerPositionOnly: IndexedSubject = {
  _key: "k1",
  kind: "player",
  playerRef: {
    firstName: "Pieter",
    lastName: "Peeters",
    jerseyNumber: null,
    position: "Keeper",
    transparentImageUrl: null,
    psdImageUrl: null,
  },
};

const staffSubject: IndexedSubject = {
  _key: "s1",
  kind: "staff",
  staffRef: {
    firstName: "Koen",
    lastName: "Dewaele",
    functionTitle: "Hoofdcoach A-ploeg",
    photoUrl: null,
  },
};

// Each entry in a multi-subject hero renders from its own photoUrl — use
// distinct placeholder images so the grid stories feel realistic.
const JEROEN: IndexedSubject = {
  _key: "k2",
  kind: "player",
  playerRef: {
    firstName: "Jeroen",
    lastName: "Van den Berghe",
    jerseyNumber: 5,
    position: "Verdediger",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&q=80",
  },
};

const THOMAS: IndexedSubject = {
  _key: "k3",
  kind: "player",
  playerRef: {
    firstName: "Thomas",
    lastName: "Peeters",
    jerseyNumber: 11,
    position: "Aanvaller",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1605235186583-a65c4f4d1c3a?w=600&q=80",
  },
};

const LUC: IndexedSubject = {
  _key: "k4",
  kind: "player",
  playerRef: {
    firstName: "Luc",
    lastName: "Janssens",
    jerseyNumber: 3,
    position: "Keeper",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80",
  },
};

const playerFullPhoto: IndexedSubject = {
  ...playerFull,
  playerRef: {
    ...playerFull.playerRef!,
    psdImageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80",
  },
};

const meta = {
  title: "Features/Articles/InterviewHero",
  component: InterviewHero,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof InterviewHero>;

export default meta;
type Story = StoryObj<typeof meta>;

const COVER =
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80";

// N=1 variants — kicker meta populated for players, bare for staff/custom.

export const SinglePlayerWithJerseyAndPosition: Story = {
  name: "Single / Player — jersey + position",
  args: {
    title: "Drive, passie, doorzettingsvermogen",
    subjects: [playerFull],
    coverImageUrl: COVER,
  },
};

export const SinglePlayerJerseyOnly: Story = {
  name: "Single / Player — jersey only",
  args: {
    title: "Een nieuw hoofdstuk",
    subjects: [playerJerseyOnly],
    coverImageUrl: COVER,
  },
};

export const SinglePlayerPositionOnly: Story = {
  name: "Single / Player — position only",
  args: {
    title: "Tussen de palen",
    subjects: [playerPositionOnly],
    coverImageUrl: COVER,
  },
};

export const SingleStaffSubject: Story = {
  name: "Single / Staff",
  args: {
    title: "De man met het plan",
    subjects: [staffSubject],
    coverImageUrl: COVER,
  },
};

export const SingleWithoutCoverImage: Story = {
  name: "Single / No cover image",
  args: {
    title: "Drive, passie, doorzettingsvermogen",
    subjects: [playerFull],
    coverImageUrl: null,
  },
};

export const SingleWithoutSubject: Story = {
  name: "Single / No subject (defensive)",
  args: {
    title: "Een interview zonder subject",
    subjects: [],
    coverImageUrl: COVER,
  },
};

// N=2 variants — duo.

export const Duo: Story = {
  name: "Duo / Two players",
  args: {
    title: "Afscheid duo: Maxim en Jeroen sluiten vijf seizoenen af.",
    subjects: [playerFullPhoto, JEROEN],
  },
};

// N=3 variants — trio (panel).

export const Trio: Story = {
  name: "Trio / Panel — three subjects",
  args: {
    title: "Drie generaties, één shirt.",
    subjects: [playerFullPhoto, JEROEN, THOMAS],
  },
};

// N=4 variants — panel (max cap).

export const Panel: Story = {
  name: "Panel / Four subjects (max cap)",
  args: {
    title: "Vier generaties over hetzelfde shirt.",
    subjects: [playerFullPhoto, JEROEN, THOMAS, LUC],
  },
};
