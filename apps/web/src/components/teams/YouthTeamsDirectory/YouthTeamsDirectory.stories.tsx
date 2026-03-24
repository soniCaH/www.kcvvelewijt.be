import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YouthTeamsDirectory } from "./YouthTeamsDirectory";

const meta = {
  title: "Features/Teams/YouthTeamsDirectory",
  component: YouthTeamsDirectory,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="bg-kcvv-green-dark py-20">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof YouthTeamsDirectory>;

export default meta;
type Story = StoryObj<typeof meta>;

const makeTeam = (age: string) => ({
  _id: age.toLowerCase(),
  name: `KCVV Elewijt ${age}`,
  slug: age.toLowerCase(),
  age,
  division: null,
  divisionFull: null,
  tagline: null,
  teamImageUrl: null,
  staff: null,
});

export const FullList: Story = {
  args: {
    divisions: [
      {
        label: "Bovenbouw",
        range: "U14–U21",
        teams: [
          makeTeam("U21"),
          makeTeam("U17"),
          makeTeam("U15"),
          makeTeam("U14"),
        ],
      },
      {
        label: "Middenbouw",
        range: "U10–U13",
        teams: [
          makeTeam("U13"),
          makeTeam("U12"),
          makeTeam("U11"),
          makeTeam("U10"),
        ],
      },
      {
        label: "Onderbouw",
        range: "U6–U9",
        teams: [makeTeam("U9"), makeTeam("U8"), makeTeam("U7"), makeTeam("U6")],
      },
    ],
  },
};

export const EmptyState: Story = {
  args: {
    divisions: [
      { label: "Bovenbouw", range: "U14–U21", teams: [] },
      { label: "Middenbouw", range: "U10–U13", teams: [] },
      { label: "Onderbouw", range: "U6–U9", teams: [] },
    ],
  },
};
