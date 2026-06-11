import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OrgPersonCard } from "./OrgPersonCard";
import type { OrgChartNode } from "@/types/organigram";

const PHOTOS = {
  a: "/player-fixtures/player-schulz.jpg",
  b: "/player-fixtures/player-vartolomaios.jpg",
};

const single: OrgChartNode = {
  id: "president",
  title: "Voorzitter",
  roleCode: "VZ",
  department: "hoofdbestuur",
  members: [
    { id: "p-1", name: "Luc Boons", email: "voorzitter@kcvvelewijt.be" },
  ],
};

const singlePhoto: OrgChartNode = {
  id: "secretary",
  title: "Secretaris",
  department: "hoofdbestuur",
  members: [{ id: "p-2", name: "Karel Vermeulen", imageUrl: PHOTOS.a }],
};

const shared: OrgChartNode = {
  id: "match-secretariat",
  title: "Wedstrijdsecretariaat",
  roleCode: "WS",
  department: "hoofdbestuur",
  members: [
    { id: "p-3", name: "Jan De Smet" },
    { id: "p-4", name: "Paula Vos", imageUrl: PHOTOS.b },
  ],
};

const sharedThreePlus: OrgChartNode = {
  id: "party-committee",
  title: "Feestcomité",
  department: "algemeen",
  members: [
    { id: "p-5", name: "Els Claes" },
    { id: "p-6", name: "Nina Bral" },
    { id: "p-7", name: "Bert Aerts" },
  ],
};

const vacant: OrgChartNode = {
  id: "treasurer",
  title: "Penningmeester",
  roleCode: "PM",
  department: "hoofdbestuur",
  members: [],
};

const meta = {
  title: "Features/Organigram/OrgPersonCard",
  component: OrgPersonCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[180px] p-2">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof OrgPersonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single holder, monogram fallback (~90% of positions have no photo) + roleCode pill. */
export const SingleMonogram: Story = {
  args: { node: single },
};

/** Single holder with a newsprint photo. */
export const SinglePhoto: Story = {
  args: { node: singlePhoto },
};

/** Shared position — two overlapping avatars + "N personen" (static cue, no hover). */
export const Shared: Story = {
  args: { node: shared },
};

/** Shared position with 3+ holders — two avatars + a "+N" chip. */
export const SharedThreePlus: Story = {
  args: { node: sharedThreePlus },
};

/** Vacant position — warm recruit card with the "Iets voor jou? →" CTA. */
export const Vacant: Story = {
  args: { node: vacant },
};

/** The smaller explorer-leaf chrome (Phase 3) — identical idiom at node scale. */
export const NodeScale: Story = {
  args: { node: single, scale: "node" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[150px] p-2">
        <Story />
      </div>
    ),
  ],
};
