import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { UnifiedSearchBar } from "./UnifiedSearchBar";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

const mockMembers: OrgChartNode[] = [
  {
    id: "m-1",
    title: "Voorzitter",
    department: "hoofdbestuur",
    parentId: null,
    members: [{ id: "staff-m-1", name: "Jan Janssen" }],
  },
  {
    id: "m-2",
    title: "Secretaris",
    department: "hoofdbestuur",
    parentId: null,
    members: [{ id: "staff-m-2", name: "Els Pieters" }],
  },
  {
    id: "m-3",
    title: "Penningmeester",
    department: "hoofdbestuur",
    parentId: null,
    members: [{ id: "staff-m-3", name: "Koen De Smedt" }],
  },
  {
    id: "m-4",
    title: "Jeugdcoördinator",
    department: "jeugdbestuur",
    parentId: null,
    members: [{ id: "staff-m-4", name: "Lien Van Acker" }],
  },
  {
    id: "m-5",
    title: "Trainer U15",
    department: "jeugdbestuur",
    parentId: "m-4",
    members: [{ id: "staff-m-5", name: "Tom Claes" }],
  },
];

const mockPaths: ResponsibilityPath[] = [
  {
    id: "rp-1",
    role: ["speler"],
    question: "Wie contacteer ik bij een blessure?",
    keywords: ["blessure", "medisch", "dokter"],
    summary: "Contacteer de medische verantwoordelijke.",
    steps: [{ order: 1, description: "Meld de blessure aan je trainer." }],
    primaryContact: {
      contactType: "manual",
      role: "Medische verantwoordelijke",
      email: "medisch@kcvvelewijt.be",
      department: "hoofdbestuur",
    },
    category: "medisch",
  },
  {
    id: "rp-2",
    role: ["ouder", "speler"],
    question: "Hoe schrijf ik mijn kind in?",
    keywords: ["inschrijving", "lidmaatschap", "jeugd"],
    summary: "Contacteer de jeugdcoördinator voor inschrijvingen.",
    steps: [
      {
        order: 1,
        description: "Vul het inschrijvingsformulier in op de website.",
      },
    ],
    primaryContact: {
      contactType: "manual",
      role: "Jeugdcoördinator",
      email: "jeugd@kcvvelewijt.be",
      department: "jeugdbestuur",
    },
    category: "administratief",
  },
  {
    id: "rp-3",
    role: ["trainer"],
    question: "Hoe beheer ik de spelerslijst?",
    keywords: ["spelerslijst", "selectie", "technisch"],
    summary: "Beheer je spelerslijst via het clubportaal.",
    steps: [
      {
        order: 1,
        description: "Log in op het clubportaal en ga naar je ploeg.",
      },
    ],
    primaryContact: {
      contactType: "manual",
      role: "Technisch coördinator",
      email: "technisch@kcvvelewijt.be",
      department: "hoofdbestuur",
    },
    category: "sportief",
  },
];

const meta = {
  title: "Features/Organigram/UnifiedSearchBar",
  component: UnifiedSearchBar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    onChange: fn(),
    onSelectMember: fn(),
    onSelectResponsibility: fn(),
  },
} satisfies Meta<typeof UnifiedSearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  members: mockMembers,
  responsibilityPaths: mockPaths,
  showAutocomplete: true,
};

/** Empty search bar, autocomplete enabled. */
export const Default: Story = {
  args: { ...baseArgs, value: "" },
};

/** With a pre-filled search term. */
export const WithValue: Story = {
  args: { ...baseArgs, value: "voorzitter" },
};

/** Custom placeholder. */
export const CustomPlaceholder: Story = {
  args: {
    ...baseArgs,
    value: "",
    placeholder: "Zoek een persoon of verantwoordelijkheid...",
  },
};

/** Autocomplete disabled. */
export const NoAutocomplete: Story = {
  args: {
    value: "",
    members: mockMembers,
    responsibilityPaths: [],
    showAutocomplete: false,
  },
};
