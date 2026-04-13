import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchStripSkeleton } from "./MatchStripSkeleton";

const meta = {
  title: "Features/Matches/MatchStripSkeleton",
  component: MatchStripSkeleton,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Pulse-animated skeleton placeholder for the match strip. " +
          "Shown inside a Suspense boundary while the BFF fetch resolves. " +
          "Matches the 40px min-height of the real strip to prevent CLS.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MatchStripSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
