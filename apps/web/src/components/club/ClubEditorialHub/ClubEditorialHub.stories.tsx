import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ClubEditorialHub,
  CLUB_HUB_CARDS,
  type ClubHubCard,
} from "./ClubEditorialHub";

// Local committed asset served by Storybook `staticDirs` so the news covers
// render deterministically in VR (the production config points at Sanity CDN
// URLs, which are non-deterministic at capture time).
const COVER = "/images/youth-trainers.jpg";

const vrCards: ClubHubCard[] = CLUB_HUB_CARDS.map((card) =>
  card.variant === "news" ? { ...card, imageUrl: COVER } : card,
);

const meta = {
  title: "Features/Club/ClubEditorialHub",
  component: ClubEditorialHub,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The /club index nav hub (design lock 10c3): a uniform 3-up grid of 16:9 `<EditorialHubCard>`s under a 'Dit is KCVV.' header. Three news cards (newsprint-colour cover, jersey-deep tag) — Geschiedenis · Ultras · Aansluiten — and three nav cards (jersey-deep glyph panel, cream tag) — Bestuur · Organigram · Angels.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto w-full max-w-5xl px-4 py-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ClubEditorialHub>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The full six-card hub with local cover assets for deterministic VR. */
export const Default: Story = {
  args: {
    cards: vrCards,
  },
};
