import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent } from "storybook/test";
import { HulpFinder } from "./HulpFinder";
import { FINDER_FIXTURE_PATHS } from "./__fixtures__/paths.fixture";

const meta = {
  title: "Features/Hulp/HulpFinder",
  component: HulpFinder,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto max-w-[760px] p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof HulpFinder>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — the "Alles" capped category preview (top-3 per category + "Alle N →"). */
export const AllesPreview: Story = {
  args: { responsibilityPaths: FINDER_FIXTURE_PATHS },
};

/** An answer opened — summary · numbered steps · person-vocab contact. */
export const WithOpenAnswer: Story = {
  args: { responsibilityPaths: FINDER_FIXTURE_PATHS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: /mijn kind is geblesseerd tijdens de match/i,
      }),
    );
  },
};

/** Empty corpus — the friendly fallback. */
export const Empty: Story = {
  args: { responsibilityPaths: [] },
};
