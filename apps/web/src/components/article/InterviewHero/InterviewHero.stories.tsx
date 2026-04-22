import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InterviewHero } from "./InterviewHero";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

const playerFull: SubjectValue = {
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

const playerJerseyOnly: SubjectValue = {
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

const playerPositionOnly: SubjectValue = {
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

const staffSubject: SubjectValue = {
  kind: "staff",
  staffRef: {
    firstName: "Koen",
    lastName: "Dewaele",
    functionTitle: "Hoofdcoach A-ploeg",
    photoUrl: null,
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

export const PlayerWithJerseyAndPosition: Story = {
  args: {
    title: "Drive, passie, doorzettingsvermogen",
    subject: playerFull,
    coverImageUrl: COVER,
  },
};

export const PlayerJerseyOnly: Story = {
  args: {
    title: "Een nieuw hoofdstuk",
    subject: playerJerseyOnly,
    coverImageUrl: COVER,
  },
};

export const PlayerPositionOnly: Story = {
  args: {
    title: "Tussen de palen",
    subject: playerPositionOnly,
    coverImageUrl: COVER,
  },
};

export const StaffSubject: Story = {
  args: {
    title: "De man met het plan",
    subject: staffSubject,
    coverImageUrl: COVER,
  },
};

export const WithoutCoverImage: Story = {
  args: {
    title: "Drive, passie, doorzettingsvermogen",
    subject: playerFull,
    coverImageUrl: null,
  },
};

export const WithoutSubject: Story = {
  args: {
    title: "Een interview zonder subject",
    subject: null,
    coverImageUrl: COVER,
  },
};
