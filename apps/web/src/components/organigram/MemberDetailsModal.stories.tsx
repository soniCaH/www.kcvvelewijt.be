import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { MemberDetailsModal } from "./MemberDetailsModal";
import type { OrgChartNode } from "@/types/organigram";

const meta = {
  title: "Features/Organigram/MemberDetailsModal",
  component: MemberDetailsModal,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 600,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    onClose: fn(),
  },
  argTypes: {
    isOpen: { control: "boolean" },
  },
} satisfies Meta<typeof MemberDetailsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockMember: OrgChartNode = {
  id: "1",
  title: "Voorzitter",
  roleCode: "VOOR",
  department: "hoofdbestuur",
  description:
    "Algemene leiding van de club. Vertegenwoordiging bij de bond en gemeente. Financieel beleid.",
  members: [
    {
      id: "staff-1",
      name: "Jean-Pierre Van Rossem",
      email: "jp.vanrossem@kcvv.be",
      phone: "+32 470 12 34 56",
      href: "/staff/jp-vanrossem",
    },
  ],
};

export const Open: Story = {
  args: {
    isOpen: true,
    member: mockMember,
  },
};

export const MinimalData: Story = {
  args: {
    isOpen: true,
    member: {
      id: "2",
      title: "Lid",
      members: [{ id: "staff-2", name: "John Doe" }],
    },
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    member: mockMember,
  },
};

export const MobileView: Story = {
  args: {
    isOpen: true,
    member: mockMember,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};
