import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteHeader } from "./SiteHeader";
import type { TeamNavVM } from "@/lib/repositories/team.repository";

const makeTeam = (over: Partial<TeamNavVM>): TeamNavVM => ({
  id: over.slug ?? "team",
  name: over.name ?? "Team",
  slug: over.slug ?? "team",
  age: over.age ?? null,
  psdId: null,
  division: null,
  divisionFull: null,
  tagline: null,
  teamImageUrl: null,
});

const meta = {
  title: "Layout/SiteHeader",
  component: SiteHeader,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const seniorTeams: TeamNavVM[] = [
  makeTeam({ slug: "kcvv-elewijt-a", name: "KCVV Elewijt A" }),
  makeTeam({ slug: "kcvv-elewijt-b", name: "KCVV Elewijt B" }),
];

const youthTeams: TeamNavVM[] = [
  makeTeam({ slug: "u15", name: "U15", age: "U15" }),
  makeTeam({ slug: "u13", name: "U13", age: "U13" }),
  makeTeam({ slug: "u11", name: "U11", age: "U11" }),
];

export const Default: Story = {
  args: { seniorTeams, youthTeams },
};

export const NoDynamicTeams: Story = {
  args: {},
};
