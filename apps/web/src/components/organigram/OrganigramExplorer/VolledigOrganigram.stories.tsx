import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VolledigOrganigram } from "./VolledigOrganigram";
import { explorerFixture } from "./organigram-explorer.fixture";

const meta = {
  title: "Features/Organigram/VolledigOrganigram",
  component: VolledigOrganigram,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-screen p-6">
        <Story />
      </div>
    ),
  ],
  args: { nodes: explorerFixture },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof VolledigOrganigram>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The full reporting tree as a pure-CSS box chart — the accessible fallback to
 * the spotlight AND the source for the one-A4 "Download als PDF".
 */
export const Default: Story = {};
