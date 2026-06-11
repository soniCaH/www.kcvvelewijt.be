import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent, expect } from "storybook/test";
import { StructureDirectory } from "./StructureDirectory";
import { staffMembersFixture } from "@/components/organigram/__fixtures__/staff-members.fixture";

const meta = {
  title: "Features/Organigram/StructureDirectory",
  component: StructureDirectory,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto max-w-[64rem] p-6 sm:p-10">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof StructureDirectory>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default compact directory — positions grouped by afdeling, each capped at
 * `initialPerDepartment` with a single "Toon alle N →" control. Includes the
 * fixture's real vacant (Sponsorverantwoordelijke) + shared (Co-Penningmeester)
 * positions.
 */
export const Collapsed: Story = {
  args: { nodes: staffMembersFixture },
};

/**
 * Same data, fully expanded via the "Toon alle N →" control — every position
 * visible and the control flipped to "Toon minder ←".
 */
export const Expanded: Story = {
  args: { nodes: staffMembersFixture },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = await canvas.findByRole("button", { name: /Toon alle/ });
    await userEvent.click(toggle);
    await expect(
      canvas.getByRole("button", { name: /Toon minder/ }),
    ).toBeInTheDocument();
  },
};
