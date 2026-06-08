import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorEmptyState } from "./SponsorEmptyState";

const meta = {
  title: "Features/Sponsors/SponsorEmptyState",
  component: SponsorEmptyState,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The `/sponsors` 0-sponsors-total body (7.d4): a gracious cream message between the headline-only hero and the `<SponsorCtaBand>`. Message-only — the 'Word sponsor' action lives in the band.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto w-full max-w-5xl px-4 py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SponsorEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Displayed when the CMS returns zero sponsors. */
export const Default: Story = {};
