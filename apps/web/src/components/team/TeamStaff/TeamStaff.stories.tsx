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
    functionTitle: "T1",
    imageUrl: PHOTOS.a,
  },
  {
    id: "2",
    firstName: "Dirk",
    lastName: "Janssens",
    functionTitle: "T2",
    imageUrl: PHOTOS.b,
  },
  {
    id: "3",
    firstName: "Peter",
    lastName: "Keepers",
    functionTitle: "TK",
  },
  {
    id: "4",
    firstName: "Annick",
    lastName: "De Ploeg",
    role: "afgevaardigde",
  },
];

const monogramsOnly: TeamStaffMemberData[] = [
  { id: "10", firstName: "Tom", lastName: "Mertens", functionTitle: "T1" },
  { id: "11", firstName: "Greet", lastName: "Wouters", role: "afgevaardigde" },
  {
    id: "12",
    firstName: "Sven",
    lastName: "Coördinator",
    functionTitle: "TVJO",
  },
];

const meta = {
  title: "Features/Teams/TeamStaff",
  component: TeamStaff,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof TeamStaff>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mixed staff — photos + a monogram fallback; code + bucket labels. */
export const WithPhotos: Story = {
  args: { staff: withPhotos },
};

/** No photos — all monogram fallbacks. */
export const MonogramsOnly: Story = {
  args: { staff: monogramsOnly },
};

/**
 * Reachable members link to their `/staf/{psdId}` profile (canonical paper
 * press-down on hover); members without a detail page stay as plain cards.
 */
export const WithDetailLinks: Story = {
  args: {
    staff: [
      { ...withPhotos[0]!, href: "/staf/11111" },
      { ...withPhotos[2]!, href: "/staf/22222" },
      withPhotos[3]!, // no href → plain card
    ],
  },
};
