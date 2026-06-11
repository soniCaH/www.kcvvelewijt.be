import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SpotlightNodeCard } from "./SpotlightNodeCard";
import type { OrgChartNode } from "@/types/organigram";

const single: OrgChartNode = {
  id: "voorzitter",
  title: "Voorzitter",
  parentId: "club",
  members: [{ id: "p1", name: "Jan Janssens" }],
};
const shared: OrgChartNode = {
  id: "kledij",
  title: "Kledij",
  parentId: "voorzitter",
  members: [
    { id: "a", name: "An Maes" },
    { id: "b", name: "Tom Claes" },
    { id: "c", name: "Els Wouters" },
  ],
};
const vacant: OrgChartNode = {
  id: "ouderraad",
  title: "Ouderraad",
  parentId: "jeugdvoorzitter",
  members: [],
};

const meta = {
  title: "Features/Organigram/SpotlightNodeCard",
  component: SpotlightNodeCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep-dark p-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SpotlightNodeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CenterSingle: Story = {
  args: { node: single, variant: "center" },
};
export const NodeSingle: Story = { args: { node: single, variant: "node" } };
export const NodeShared: Story = { args: { node: shared, variant: "node" } };
export const NodeVacant: Story = { args: { node: vacant, variant: "node" } };
