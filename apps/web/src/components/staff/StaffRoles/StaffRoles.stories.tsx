import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StaffRoles } from "./StaffRoles";

const meta = {
  title: "Features/Staff/StaffRoles",
  component: StaffRoles,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
  decorators: [
    // Cream page background (matches the real `/staf/[slug]` body) — the
    // section's cream paper cards pop against it, as on the live page.
    (Story) => (
      <div className="bg-cream min-h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StaffRoles>;

export default meta;
type Story = StoryObj<typeof meta>;

const POSITIONS = [
  { id: "a", title: "Hoofdtrainer", roleCode: "T1", department: "A-ploeg" },
  { id: "b", title: "Jeugdtrainer", roleCode: "T3", department: "U15" },
];

const RESPONSIBILITIES = [
  { title: "Inschrijven A-ploeg", slug: "inschrijven-a", category: "Spelers" },
  {
    title: "Trainingsschema opvragen",
    slug: "trainingsschema",
    category: "Trainingen",
  },
];

/** Full merged section — positions rows + "Aanspreekpunt voor" link cards. */
export const Full: Story = {
  args: {
    positions: POSITIONS,
    responsibilities: RESPONSIBILITIES,
  },
};

/** Positions only — no responsibility link cards. */
export const PositionsOnly: Story = {
  args: {
    positions: POSITIONS,
    responsibilities: [],
  },
};

/** Responsibilities only — heading + "Aanspreekpunt voor" cards, no rows. */
export const ResponsibilitiesOnly: Story = {
  args: {
    positions: [],
    responsibilities: RESPONSIBILITIES,
  },
};

/** Sparse position with no roleCode / department. */
export const MinimalPosition: Story = {
  args: {
    positions: [{ id: "x", title: "Materiaalmeester" }],
    responsibilities: [],
  },
};
