import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { YouthDivisionGroup } from "@/lib/utils/group-teams";
import { YouthDirectory } from "./YouthDirectory";
import { youthTeam as team } from "./youth-directory.fixtures";

const divisions: YouthDivisionGroup[] = [
  {
    label: "Bovenbouw",
    range: "U17–U21",
    teams: [team("U21"), team("U19"), team("U17")],
  },
  { label: "Middenbouw", range: "U12–U16", teams: [team("U15"), team("U13")] },
  {
    label: "Onderbouw",
    range: "U6–U11",
    teams: [team("U11"), team("U9"), team("U8"), team("U7"), team("U6")],
  },
];

const meta = {
  title: "Features/Teams/YouthDirectory",
  component: YouthDirectory,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof YouthDirectory>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full youth working — three divisions, age-code cards. */
export const FullDirectory: Story = {
  args: { divisions },
};

/** Sparse — one division with members, empty groups omitted. */
export const SparseDirectory: Story = {
  args: {
    divisions: [
      { label: "Bovenbouw", range: "U17–U21", teams: [] },
      { label: "Middenbouw", range: "U12–U16", teams: [team("U13")] },
      { label: "Onderbouw", range: "U6–U11", teams: [] },
    ],
  },
};
