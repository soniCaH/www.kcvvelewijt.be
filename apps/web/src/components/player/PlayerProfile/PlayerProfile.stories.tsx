/**
 * PlayerProfile Component Stories
 *
 * Main player profile page layout component.
 * Combines PlayerCard visual, PlayerBio info, and stats sections.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerProfile } from "./PlayerProfile";
import PlayerDetailLoading from "@/app/(main)/spelers/[slug]/loading";

// Real player images from KCVV API
const REAL_PLAYER_IMAGES = {
  chiel:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
  jarne:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/jarne-front.png",
};

const meta = {
  title: "Features/Players/PlayerProfile",
  component: PlayerProfile,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
Main player profile page layout component that displays:
- Hero section with player photo and jersey number
- Player name with first name (semibold) / last name (thin) styling
- Position and team information
- Biography section (via PlayerBio)
- Statistics section (future - data from Footbalisto API)

This is the container component for the /player/[slug] route.
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    firstName: {
      control: "text",
      description: "Player first name",
    },
    lastName: {
      control: "text",
      description: "Player last name",
    },
    position: {
      control: "select",
      options: ["Keeper", "Verdediger", "Middenvelder", "Aanvaller"],
      description: "Player position",
    },
    number: {
      control: "number",
      description: "Jersey number",
    },
    imageUrl: {
      control: "text",
      description: "Player photo URL",
    },
    teamName: {
      control: "text",
      description: "Team name",
    },
    isCaptain: {
      control: "boolean",
      description: "Is team captain",
    },
  },
} satisfies Meta<typeof PlayerProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default player profile with all sections
 */
export const Default: Story = {
  args: {
    firstName: "Chiel",
    lastName: "Bertens",
    position: "Verdediger",
    number: 5,
    imageUrl: REAL_PLAYER_IMAGES.chiel,
    teamName: "Eerste Ploeg",
    birthDate: "1995-03-15",
    joinDate: "2020-07-01",
    biography:
      "Chiel is een ervaren verdediger die al meerdere seizoenen bij KCVV speelt. Bekend om zijn leiderschap en sterke tackles.\n\nHij begon zijn carrière bij de jeugd en groeide uit tot een vaste waarde in de eerste ploeg.",
    isCaptain: true,
  },
};

/**
 * Player with all information filled in
 */
export const WithAllSections: Story = {
  args: {
    firstName: "Jarne",
    lastName: "Feron",
    position: "Middenvelder",
    number: 7,
    imageUrl: REAL_PLAYER_IMAGES.jarne,
    teamName: "Eerste Ploeg",
    birthDate: "1998-06-22",
    joinDate: "2019-08-15",
    biography:
      "Jarne is een creatieve middenvelder met een uitstekend overzicht. Zijn passes en vrije trappen zijn gevreesd bij de tegenstanders.\n\nNa een succesvolle periode bij de jeugdopleiding maakte hij de overstap naar de eerste ploeg waar hij inmiddels een sleutelspeler is geworden.",
    isCaptain: false,
  },
};

/**
 * Minimal profile - only required information
 */
export const Minimal: Story = {
  args: {
    firstName: "Nieuwe",
    lastName: "Speler",
    position: "Aanvaller",
    teamName: "Eerste Ploeg",
  },
};

/**
 * Goalkeeper profile
 */
export const Goalkeeper: Story = {
  args: {
    firstName: "Louie",
    lastName: "Keeper",
    position: "Keeper",
    number: 1,
    teamName: "Eerste Ploeg",
    birthDate: "1997-01-10",
    joinDate: "2021-01-15",
  },
};

/**
 * Former player with leave date
 */
export const FormerPlayer: Story = {
  args: {
    firstName: "Oud",
    lastName: "Speler",
    position: "Verdediger",
    number: 23,
    teamName: "Eerste Ploeg",
    birthDate: "1990-05-20",
    joinDate: "2015-07-01",
    leaveDate: "2022-06-30",
    biography: "Een trouwe dienaar van de club gedurende 7 seizoenen.",
  },
};

/**
 * Youth team player
 */
export const YouthPlayer: Story = {
  args: {
    firstName: "Jong",
    lastName: "Talent",
    position: "Middenvelder",
    number: 10,
    teamName: "U17",
    birthDate: "2008-09-12",
    joinDate: "2018-09-01",
  },
};

/**
 * Loading state - skeleton placeholder
 */
export const Loading: Story = {
  args: {
    firstName: "",
    lastName: "",
    position: "",
    teamName: "",
    isLoading: true,
  },
};

/**
 * Error state with retry option
 */
export const ErrorState: Story = {
  args: {
    firstName: "",
    lastName: "",
    position: "",
    teamName: "",
    error: "Kon spelersprofiel niet laden. Probeer het later opnieuw.",
    onRetry: () => alert("Retry clicked"),
  },
};

export const RouteSkeleton: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {} as any,
  render: () => <PlayerDetailLoading />,
  parameters: { layout: "fullscreen" },
};
