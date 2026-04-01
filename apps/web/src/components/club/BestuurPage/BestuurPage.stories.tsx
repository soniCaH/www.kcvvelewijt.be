/**
 * BestuurPage Component Stories
 *
 * Page-level layout for /club/bestuur: club-team header, description with
 * green left-border accent, member roster, and organigram CTA card.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BestuurPage } from "./BestuurPage";
import type { StaffMember } from "@/components/team/TeamRoster";
import BoardLoading from "@/app/(main)/club/bestuur/loading";

const MEMBER_IMAGES = {
  rudy: "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
  ilona:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/jarne-front.png",
  stefan:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/louie-front.png",
  erik: "https://api.kcvvelewijt.be/sites/default/files/player-picture/yoran-front.png",
};

const mockStaff: StaffMember[] = [
  {
    id: "m-1",
    firstName: "Rudy",
    lastName: "Bautmans",
    role: "Voorzitter",
    roleCode: "VZ",
    imageUrl: MEMBER_IMAGES.rudy,
  },
  {
    id: "m-2",
    firstName: "Ilona",
    lastName: "Trouwkens",
    role: "Secretaris",
    roleCode: "SEC",
    imageUrl: MEMBER_IMAGES.ilona,
  },
  {
    id: "m-3",
    firstName: "Stefan",
    lastName: "Robberechts",
    role: "Penningmeester",
    roleCode: "PEN",
    imageUrl: MEMBER_IMAGES.stefan,
  },
  {
    id: "m-4",
    firstName: "Erik",
    lastName: "Talboom",
    role: "Sportief verantwoordelijke",
    roleCode: "SV",
    imageUrl: MEMBER_IMAGES.erik,
  },
  {
    id: "m-5",
    firstName: "Stef",
    lastName: "Pieters",
    role: "Jeugdcoördinator",
    roleCode: "JC",
  },
  {
    id: "m-6",
    firstName: "Peter",
    lastName: "Lemmens",
    role: "Materiaalmeester",
    roleCode: "MAT",
  },
];

const description = `
  <p>KCVV Elewijt wordt al enkele jaren geleid door een gepassioneerde en trouwe kern van
  bestuursleden. In een toffe mix van jong en iets minder jong wordt enthousiast gewerkt om
  van KCVV een gezonde en aangename club te maken en houden, waarin sportieve ambitie en
  plezier gecombineerd kunnen worden.</p>
`;

const meta = {
  title: "Pages/BestuurPage",
  component: BestuurPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Page layout for /club/bestuur. Shows a club-team header, a description section with a green left-border accent above the member roster, and an organigram CTA card. No tabs, no Footbalisto data.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    header: {
      name: "Bestuur",
      tagline: "Het kloppend hart van de club",
      teamType: "club",
    },
    staff: mockStaff,
    description,
  },
} satisfies Meta<typeof BestuurPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full page with description, roster, and organigram CTA.
 */
export const Default: Story = {};

/**
 * No description — roster and CTA only.
 */
export const NoDescription: Story = {
  args: {
    description: undefined,
  },
};

/**
 * No members yet — shows only header, optional description, and CTA.
 */
export const NoMembers: Story = {
  args: {
    staff: [],
  },
};

/**
 * Mobile viewport — single-column layout.
 */
export const MobileViewport: Story = {
  globals: {
    viewport: { value: "kcvvMobile" },
  },
};

export const RouteSkeleton: Story = {
  render: () => <BoardLoading />,
  parameters: { layout: "fullscreen" },
};
