import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamStaff } from "./TeamStaff";
import type { TeamStaffMemberData } from "./TeamStaff";

const PHOTOS = {
  a: "/player-fixtures/player-schulz.jpg",
  b: "/player-fixtures/player-vartolomaios.jpg",
};

const withPhotos: TeamStaffMemberData[] = [
  {
    id: "1",
    firstName: "Karel",
    lastName: "Vermeulen",
    functionTitle: "Hoofdtrainer",
    imageUrl: PHOTOS.a,
  },
  {
    id: "2",
    firstName: "Dirk",
    lastName: "Janssens",
    functionTitle: "Assistent-trainer",
    imageUrl: PHOTOS.b,
  },
  {
    id: "3",
    firstName: "Peter",
    lastName: "Keepers",
    functionTitle: "Keeperstrainer",
  },
  {
    id: "4",
    firstName: "Annick",
    lastName: "De Ploeg",
    role: "afgevaardigde",
  },
];

const illustrationsOnly: TeamStaffMemberData[] = [
  {
    id: "10",
    firstName: "Tom",
    lastName: "Mertens",
    functionTitle: "Hoofdtrainer",
  },
  { id: "11", firstName: "Greet", lastName: "Wouters", role: "afgevaardigde" },
  {
    id: "12",
    firstName: "Sven",
    lastName: "Coördinator",
    functionTitle: "Jeugdcoördinator",
  },
];

const meta = {
  title: "Features/Teams/TeamStaff",
  component: TeamStaff,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
  args: { heading: "Staf" },
} satisfies Meta<typeof TeamStaff>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mixed staff — photos + the coat-garment illustration fallback (#2485). */
export const WithPhotos: Story = {
  args: { staff: withPhotos },
};

/** No photos — every card falls back to the coat-garment illustration (#2485). */
export const IllustrationsOnly: Story = {
  args: { staff: illustrationsOnly },
};

/**
 * Reachable members link to their `/staf/{psdId}` profile and carry the
 * "Bekijk →" resting affordance; members without a detail page stay plain.
 */
export const WithDetailLinks: Story = {
  args: {
    // First two members link to their detail page; the rest stay plain. Derived
    // via map so the story never depends on hard-coded fixture indices.
    staff: withPhotos.map((member, i) =>
      i < 2 ? { ...member, href: `/staf/1111${i}` } : member,
    ),
  },
};

/** A board page's word for the run — same heading `<BestuurPage>` passes (#2575 review). */
export const BoardHeading: Story = {
  args: { staff: withPhotos, heading: "De leden" },
};

/**
 * Fully labelled — every card resolves a function, so the notice never
 * renders even with `unlabelledNotice` on (#2638).
 */
export const FullyLabelled: Story = {
  args: { staff: withPhotos, unlabelledNotice: true },
};

/**
 * Partially labelled — some cards resolve no function (ordered last), so
 * the ProSoccerData routing line renders beneath the grid (#2638). The
 * `kcvve-u9` shape: two named roles, three helpers.
 */
export const PartiallyLabelled: Story = {
  args: {
    staff: [
      { id: "1", firstName: "Wendy", lastName: "Voorzitter", role: "trainer" },
      {
        id: "2",
        firstName: "Piet",
        lastName: "Coördinator",
        functionTitle: "Jeugdcoördinator",
      },
      { id: "3", firstName: "Sofie", lastName: "Helper" },
      { id: "4", firstName: "Bram", lastName: "Helper" },
      { id: "5", firstName: "Kris", lastName: "Helper" },
    ],
    unlabelledNotice: true,
  },
};

/** No labels — every card omits the function line, and the routing line still renders once (#2638). */
export const NoLabels: Story = {
  args: {
    staff: [
      { id: "1", firstName: "Sofie", lastName: "Helper" },
      { id: "2", firstName: "Bram", lastName: "Helper" },
      { id: "3", firstName: "Kris", lastName: "Helper" },
    ],
    unlabelledNotice: true,
  },
};
