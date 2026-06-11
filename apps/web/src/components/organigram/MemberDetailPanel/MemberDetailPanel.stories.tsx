import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { MemberDetailPanel } from "./MemberDetailPanel";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

const PHOTO = "/player-fixtures/player-schulz.jpg";

const single: OrgChartNode = {
  id: "president",
  title: "Voorzitter",
  roleCode: "VZ",
  department: "hoofdbestuur",
  members: [
    {
      id: "staff-president",
      name: "Luc Boons",
      email: "voorzitter@kcvvelewijt.be",
      phone: "+32 470 11 22 33",
      href: "/staf/luc-boons",
    },
  ],
};

const singlePhoto: OrgChartNode = {
  id: "secretary",
  title: "Secretaris",
  roleCode: "SEC",
  department: "hoofdbestuur",
  members: [
    {
      id: "staff-sec",
      name: "Karel Vermeulen",
      imageUrl: PHOTO,
      email: "secretaris@kcvvelewijt.be",
      href: "/staf/karel",
    },
  ],
};

const shared: OrgChartNode = {
  id: "party-committee",
  title: "Feestcomité",
  department: "jeugdbestuur",
  members: [
    { id: "staff-els", name: "Els Claes", email: "els@kcvvelewijt.be" },
    { id: "staff-nina", name: "Nina Bral", phone: "+32 470 99 88 77" },
    { id: "staff-wout", name: "Wout Verlinden", href: "/staf/wout" },
  ],
};

const vacant: OrgChartNode = {
  id: "sponsor-coordinator",
  title: "Sponsorverantwoordelijke",
  roleCode: "SPON",
  department: "hoofdbestuur",
  members: [],
};

function responsibility(
  id: string,
  question: string,
  memberId: string,
  memberName: string,
): ResponsibilityPath {
  return {
    id,
    role: ["niet-lid"],
    question,
    keywords: [],
    summary: `${question}.`,
    steps: [],
    category: "algemeen",
    primaryContact: {
      contactType: "position",
      members: [{ id: memberId, name: memberName }],
    },
  };
}

const responsibilityPaths: ResponsibilityPath[] = [
  responsibility("lid-worden", "Lid worden", "staff-president", "Luc Boons"),
  responsibility(
    "algemene-vragen",
    "Algemene vragen",
    "staff-president",
    "Luc Boons",
  ),
  responsibility("evenement", "Evenement aanvragen", "staff-els", "Els Claes"),
];

const meta = {
  title: "Features/Organigram/MemberDetailPanel",
  component: MemberDetailPanel,
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, iframeHeight: 560 } },
  },
  args: {
    open: true,
    onClose: fn(),
    onMemberShown: fn(),
    responsibilityPaths,
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof MemberDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single holder, monogram fallback (~90% of positions have no photo). */
export const SingleMonogram: Story = {
  args: { node: single },
};

/** Single holder with a newsprint photo. */
export const SinglePhoto: Story = {
  args: { node: singlePhoto },
};

/** Shared position — lands on holder #1 with the first-name tab switcher. */
export const Shared: Story = {
  args: { node: shared },
};

/** Vacant carve-out — no contact actions, just the recruit CTA. */
export const Vacant: Story = {
  args: { node: vacant },
};

/** Full-width bottom sheet under the mobile breakpoint. */
export const MobileSheet: Story = {
  args: { node: single },
  globals: { viewport: { value: "mobile1" } },
};
