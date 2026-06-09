/**
 * BestuurPage stories — Phase 7 board spine (design reference; page-level
 * composition is VR-covered via Playwright e2e, not Storybook snapshots).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { BestuurPage } from "./BestuurPage";
import type { TeamStaffMemberData } from "@/components/team/TeamStaff";
import BoardLoading from "@/app/(main)/club/bestuur/loading";

// Board members: titles live in `role` with an empty PSD `functionTitle` — the
// case the role-label fix targets (renders "Voorzitter", not "Staf").
const mockStaff: TeamStaffMemberData[] = [
  { id: "m-1", firstName: "Rudy", lastName: "Bautmans", role: "Voorzitter" },
  { id: "m-2", firstName: "Ilona", lastName: "Trouwkens", role: "Secretaris" },
  {
    id: "m-3",
    firstName: "Stefan",
    lastName: "Robberechts",
    role: "Penningmeester",
  },
  {
    id: "m-4",
    firstName: "Erik",
    lastName: "Talboom",
    role: "Sportief verantwoordelijke",
  },
  { id: "m-5", firstName: "Stef", lastName: "Pieters", role: "Bestuurslid" },
  { id: "m-6", firstName: "Peter", lastName: "Lemmens", role: "Bestuurslid" },
];

const body: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "b1",
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: "s1",
        marks: [],
        text: "KCVV Elewijt wordt al enkele jaren geleid door een gepassioneerde en trouwe kern van bestuursleden. In een toffe mix van jong en iets minder jong wordt enthousiast gewerkt om van KCVV een gezonde en aangename club te maken en houden, waarin sportieve ambitie en plezier gecombineerd kunnen worden.",
      },
    ],
  },
];

const meta = {
  title: "Pages/BestuurPage",
  component: BestuurPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Board page spine: <BoardHero> (dark group photo) → <StripedSeam> → editorial description → 'De leden' <TeamStaff> → organigram <BoardCtaBand>.",
      },
    },
  },
  // vr-skip: page-level composition is covered by Playwright e2e, not Storybook
  // VR. The `--excludeTags vr-skip` filter keeps this heavy story from being
  // visited under Docker's memory cap (see page-level-testing-rework.md). The
  // hero + CTA band carry their own VR via their component stories.
  tags: ["autodocs", "vr-skip"],
  args: {
    header: {
      name: "Bestuur",
      tagline: "Het kloppend hart van de club.",
      teamType: "club",
    },
    body,
    staff: mockStaff,
  },
} satisfies Meta<typeof BestuurPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full page: hero + description + roster + organigram CTA. */
export const Default: Story = {};

/** No description — hero, roster, and CTA only. */
export const NoDescription: Story = {
  args: { body: null },
};

/** No members yet — hero, optional description, and CTA. */
export const NoMembers: Story = {
  args: { staff: [] },
};

/** Mobile viewport — single-column layout. */
export const MobileViewport: Story = {
  globals: {
    viewport: { value: "kcvvMobile" },
  },
};

export const RouteSkeleton: Story = {
  render: () => <BoardLoading />,
  parameters: { layout: "fullscreen" },
};
