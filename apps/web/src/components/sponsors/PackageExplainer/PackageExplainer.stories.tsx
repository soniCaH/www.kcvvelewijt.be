import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PackageExplainer } from "./PackageExplainer";

const meta = {
  title: "Features/Sponsors/PackageExplainer",
  component: PackageExplainer,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'The `/sponsors` package block (#3654): three bundles (Groen, Wit, Crossing) as checklists, a dashed "Op maat" box, the loose packages grouped under "Of kies apart", and the contact role with its address. It reads as a choice. No price, no tier names. Fires `sponsor_packages_view` at 40% in view.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PackageExplainer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What the page renders: the contact role and address, no person. */
export const Default: Story = {};

/** A named contact person — shown only when passed (needs board approval). */
export const WithContactName: Story = {
  args: { contactName: "An Peeters" },
};

/** Narrow viewport — the cards stack, nothing overflows at 375 px. */
export const MobileViewport: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
  parameters: {
    vr: { viewports: ["mobile"] },
  },
};
