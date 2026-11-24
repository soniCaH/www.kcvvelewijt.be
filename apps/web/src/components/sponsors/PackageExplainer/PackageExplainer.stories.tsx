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
          'The `/sponsors` package block (#3654): three bundles (Groen, Wit, Crossing) as checklists, a dashed "Op maat" box, the loose packages grouped under "Of kies apart", and the contact role with its address. It reads as a choice. No price, no tier names. `sponsor_packages_view` fires once the heading, intro and bundle cards are 40% in view.',
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

/** What the page renders. The baseline shows the first screen; the lower part has its own stories (`PackageExplainerTail`). */
export const Default: Story = {};
