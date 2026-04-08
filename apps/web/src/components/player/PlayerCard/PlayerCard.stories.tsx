/**
 * PlayerCard Component Stories
 *
 * Diagonal-cut player card with stencil number on the seam — see
 * `PlayerCard.tsx` for design notes.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerCard } from "./PlayerCard";

// Real player images from KCVV API
const REAL_PLAYER_IMAGES = {
  chiel:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
  jarne:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/jarne-front.png",
  louie:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/louie-front.png",
  yoran:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/yoran-front.png",
};

const meta = {
  title: "Features/Players/PlayerCard",
  component: PlayerCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Diagonal-cut player card for team rosters and player listings.

- Photo is clipped via CSS \`clip-path\` so the white card surface flows
  up into the cut-away triangle
- Stenciletta-font jersey number sits on the diagonal seam
- Green hover accent bar at the top scales from the center
- \`flex h-full flex-col\` keeps cards in a CSS Grid row equal height
        `,
      },
    },
    backgrounds: {
      default: "light",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[260px]">
        <Story />
      </div>
    ),
  ],
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
    href: {
      control: "text",
      description: "Link to player profile",
    },
  },
} satisfies Meta<typeof PlayerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default player card with real KCVV player photo
 */
export const Default: Story = {
  args: {
    firstName: "Jarne",
    lastName: "Feron",
    position: "Middenvelder",
    number: 7,
    imageUrl: REAL_PLAYER_IMAGES.jarne,
    href: "/player/jarne-feron",
  },
};

/**
 * Goalkeeper variant
 */
export const Goalkeeper: Story = {
  args: {
    firstName: "Louie",
    lastName: "Speler",
    position: "Keeper",
    number: 1,
    imageUrl: REAL_PLAYER_IMAGES.louie,
    href: "/player/louie-speler",
  },
};

/**
 * Without photo - shows placeholder silhouette
 */
export const WithoutPhoto: Story = {
  args: {
    firstName: "Nieuwe",
    lastName: "Speler",
    position: "Aanvaller",
    number: 99,
    href: "/player/nieuwe-speler",
  },
};

/**
 * Without jersey number - omits the seam badge
 */
export const WithoutNumber: Story = {
  args: {
    firstName: "Yoran",
    lastName: "Speler",
    position: "Middenvelder",
    imageUrl: REAL_PLAYER_IMAGES.yoran,
    href: "/player/yoran-speler",
  },
};

/**
 * Long name handling
 */
export const LongName: Story = {
  args: {
    firstName: "Jean-Baptiste",
    lastName: "Van Der Meersberghen",
    position: "Verdediger",
    number: 23,
    imageUrl: REAL_PLAYER_IMAGES.chiel,
    href: "/player/jean-baptiste",
  },
};

/**
 * Loading skeleton state
 */
export const Loading: Story = {
  args: {
    firstName: "",
    lastName: "",
    position: "",
    href: "",
    isLoading: true,
  },
};

/**
 * Grid layout with multiple cards (verifies equal-height rows)
 */
export const GridLayout: Story = {
  args: {
    firstName: "",
    lastName: "",
    position: "",
    href: "",
  },
  decorators: [],
  render: () => (
    <div className="grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <PlayerCard
        firstName="Louie"
        lastName="Keeper"
        position="Keeper"
        number={1}
        imageUrl={REAL_PLAYER_IMAGES.louie}
        href="/player/louie"
      />
      <PlayerCard
        firstName="Chiel"
        lastName="Bertens"
        position="Verdediger"
        number={5}
        imageUrl={REAL_PLAYER_IMAGES.chiel}
        href="/player/chiel-bertens"
      />
      <PlayerCard
        firstName="Jarne"
        lastName="Feron"
        position="Middenvelder"
        number={7}
        imageUrl={REAL_PLAYER_IMAGES.jarne}
        href="/player/jarne-feron"
      />
      <PlayerCard
        firstName="Yoran"
        lastName="Aanvaller"
        position="Aanvaller"
        number={9}
        imageUrl={REAL_PLAYER_IMAGES.yoran}
        href="/player/yoran"
      />
      <PlayerCard
        firstName="Nieuwe"
        lastName="Speler"
        position="Verdediger"
        number={99}
        href="/player/nieuwe-speler"
      />
      <PlayerCard firstName="" lastName="" position="" href="" isLoading />
    </div>
  ),
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  args: {
    firstName: "Jarne",
    lastName: "Feron",
    position: "Aanvaller",
    number: 19,
    imageUrl: REAL_PLAYER_IMAGES.jarne,
    href: "/player/jarne-feron",
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};
