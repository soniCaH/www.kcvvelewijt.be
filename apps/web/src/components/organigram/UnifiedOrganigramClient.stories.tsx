import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UnifiedOrganigramClient } from "./UnifiedOrganigramClient";
import { staffMembersFixture as clubStructure } from "@/components/organigram/__fixtures__/staff-members.fixture";
import type { ResponsibilityPath } from "@/types/responsibility";
import OrganigramLoading from "@/app/(main)/club/organigram/loading";

const storyPaths: ResponsibilityPath[] = [
  {
    id: "ongeval-speler-training",
    role: ["speler", "ouder"],
    question: "heb een ongeval op training/wedstrijd",
    keywords: ["ongeval", "blessure", "letsel"],
    summary:
      "Meld het ongeval onmiddellijk bij je trainer en neem contact op met de verzekeringverantwoordelijke.",
    category: "medisch",
    icon: "heart",
    primaryContact: {
      role: "Verzekeringverantwoordelijke",
      email: "verzekering@kcvvelewijt.be",
      department: "algemeen",
    },
    steps: [
      { description: "Meld het ongeval bij je trainer" },
      {
        description: "Contacteer de verzekeringverantwoordelijke binnen 48 uur",
        contact: {
          role: "Verzekeringverantwoordelijke",
          email: "verzekering@kcvvelewijt.be",
        },
      },
    ],
  },
  {
    id: "inschrijving-nieuw-lid",
    role: ["niet-lid", "ouder"],
    question: "wil mij graag inschrijven",
    keywords: ["inschrijven", "lid worden", "lidmaatschap"],
    summary: "Gebruik het online inschrijvingsformulier.",
    category: "administratief",
    icon: "file-text",
    primaryContact: {
      role: "Jeugdsecretaris",
      email: "jeugd@kcvvelewijt.be",
      department: "jeugdbestuur",
    },
    steps: [
      {
        description: "Ga naar de inschrijvingspagina",
        link: "/club/inschrijven",
      },
      { description: "Vul het formulier in" },
    ],
  },
];

/**
 * UnifiedOrganigramClient - Tabbed interface for organigram views
 *
 * Combines three views into a single unified interface:
 * - Card Hierarchy: Collapsible card-based hierarchy view
 * - Diagram: Interactive D3-based organizational chart
 * - Responsibilities: Help system to find the right contact person
 *
 * Features:
 * - View toggle with localStorage persistence
 * - Responsive defaults (mobile → cards, desktop → chart)
 * - Shared state across all views
 * - Member details modal
 */
const meta = {
  title: "Features/Organigram/UnifiedOrganigram",
  component: UnifiedOrganigramClient,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: {
        pathname: "/club/organigram",
      },
    },
    docs: {
      description: {
        component:
          "Unified organigram interface with three view modes: Card Hierarchy, Interactive Chart, and Responsibility Finder. View preference is saved to localStorage and restored on next visit.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    responsibilityPaths: storyPaths,
  },
} satisfies Meta<typeof UnifiedOrganigramClient>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view with full club structure.
 * On first load, mobile devices show cards view, desktop shows chart view.
 * View preference is saved to localStorage.
 */
export const Default: Story = {
  args: {
    members: clubStructure,
  },
};

/**
 * Minimal example with just a few members for testing.
 * Useful for quick verification of layout and interactions.
 */
export const MinimalStructure: Story = {
  args: {
    members: clubStructure.slice(0, 5),
  },
};

/**
 * Empty state - no members.
 * Shows how the component handles empty data.
 */
export const EmptyState: Story = {
  args: {
    members: [],
  },
};

/**
 * Single department view - only hoofdbestuur (main board).
 * Tests filtering behavior with subset of data.
 */
export const HoofdbestuurOnly: Story = {
  args: {
    members: clubStructure.filter(
      (m) => m.department === "hoofdbestuur" || m.department === "algemeen",
    ),
  },
};

/**
 * Single department view - only jeugdbestuur (youth board).
 * Tests filtering behavior with subset of data.
 */
export const JeugdbestuurOnly: Story = {
  args: {
    members: clubStructure.filter((m) => m.department === "jeugdbestuur"),
  },
};

export const RouteSkeleton: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {} as any,
  render: () => <OrganigramLoading />,
  parameters: { layout: "fullscreen" },
};
