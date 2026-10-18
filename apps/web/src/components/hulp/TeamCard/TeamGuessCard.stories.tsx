import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { aiTeamResult } from "@/lib/utils/match-youth-team";
import { TeamGuessCard } from "./TeamCard";
import {
  TEAM_CARD_CALENDAR_YEAR,
  TEAM_CARD_SEASON_YEAR,
  TEAM_CARD_TEAMS,
} from "./team-card.fixture";

/**
 * The AI fallback asks first (#3559): "mijn zoon speelt bij de pupillen" — the
 * rules find nothing, the AI picks U9, and the parent confirms before the card.
 */
const meta = {
  title: "Features/Hulp/TeamGuessCard",
  component: TeamGuessCard,
  parameters: { layout: "centered" },
  args: {
    result: aiTeamResult(
      "U9",
      TEAM_CARD_TEAMS,
      TEAM_CARD_SEASON_YEAR,
      TEAM_CARD_CALENDAR_YEAR,
    ),
    onAnswer: fn(),
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[min(420px,calc(100vw-2rem))] p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof TeamGuessCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before the tap: band title, "Ja, toon contact" / "Nee", the hint. */
export const AskFirst: Story = {};
