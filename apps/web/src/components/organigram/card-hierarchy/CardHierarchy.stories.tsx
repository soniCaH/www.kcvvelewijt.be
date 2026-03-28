import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CardHierarchy } from "./CardHierarchy";
import type { CardHierarchyProps } from "./CardHierarchy";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { staffMembersFixture as clubStructure } from "@/components/organigram/__fixtures__/staff-members.fixture";

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
    keywords: ["inschrijven", "lid worden"],
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

const meta = {
  title: "Features/Organigram/CardHierarchy",
  component: CardHierarchy,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**Card Hierarchy View** - Expandable/collapsible cards with visual hierarchy

**Pattern:** Vertical accordion-style cards with expand/collapse

**Strengths:**
- ✅ Shows hierarchical relationships
- ✅ Progressive disclosure (reduces overwhelm)
- ✅ Mobile-native expandable pattern
- ✅ Clear parent-child connections
- ✅ Search auto-expands to results

**Weaknesses:**
- ❌ Harder to see "big picture" at once
- ❌ Deep hierarchies require more clicks
- ❌ Can lose context when deeply nested

**Best for:** Contact-first users who know what they're looking for, mobile users

**Features:**
- 🔍 Search with auto-expand to matching results
- 📊 Department filtering
- ➕ Expand All / Collapse All controls
- 🎯 Progressive disclosure (starts partially expanded)
- ⌨️ Keyboard accessible
- 📱 Touch-friendly mobile interactions
- 🎨 Visual hierarchy indicators (indentation, connectors)
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    members: clubStructure,
    responsibilityPaths: storyPaths,
  },
  argTypes: {
    initialExpandedDepth: {
      control: { type: "number", min: 0, max: 5 },
      description: "Initial expansion depth (0 = all collapsed)",
    },
    maxDepth: {
      control: { type: "number", min: 1, max: 20 },
      description: "Maximum hierarchy depth to render",
    },
    isLoading: {
      control: "boolean",
      description: "Loading state",
    },
  },
} satisfies Meta<typeof CardHierarchy>;

export default meta;
type Story = StoryObj<typeof meta>;

// ==================== CONTROLLED COMPONENT WRAPPER ====================

const CardHierarchyWithState = (args: Partial<CardHierarchyProps>) => {
  const [selectedMember, setSelectedMember] = useState<OrgChartNode | null>(
    null,
  );

  return (
    <div>
      <CardHierarchy
        members={args.members || []}
        responsibilityPaths={args.responsibilityPaths ?? []}
        isLoading={args.isLoading ?? false}
        initialExpandedDepth={args.initialExpandedDepth ?? 2}
        maxDepth={args.maxDepth ?? 10}
        className={args.className}
        onMemberClick={(member) => {
          setSelectedMember(member);
          args.onMemberClick?.(member);
        }}
      />

      {/* Selected Member Info */}
      {selectedMember && (
        <div className="mt-6 p-4 bg-kcvv-green/10 rounded-lg border-2 border-kcvv-green">
          <p className="text-sm font-semibold text-kcvv-gray-blue mb-1">
            Last Selected:
          </p>
          <p className="text-sm text-kcvv-gray-dark">
            {selectedMember.members[0]?.name ?? selectedMember.title} -{" "}
            {selectedMember.title}
          </p>
        </div>
      )}
    </div>
  );
};

// ==================== DEFAULT STORIES ====================

export const Default: Story = {
  render: CardHierarchyWithState,
  args: {
    members: clubStructure,
    initialExpandedDepth: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default view with 2 levels expanded initially. Shows organizational hierarchy with expandable cards.",
      },
    },
  },
};

export const PartiallyExpanded: Story = {
  render: CardHierarchyWithState,
  args: {
    members: clubStructure,
    initialExpandedDepth: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Progressive disclosure: Only the first level expanded — click to explore deeper.",
      },
    },
  },
};

// ==================== EXPANSION STATES ====================

export const AllCollapsed: Story = {
  render: CardHierarchyWithState,
  args: {
    members: clubStructure,
    initialExpandedDepth: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          "All cards collapsed initially. User must expand to see structure.",
      },
    },
  },
};

export const AllExpanded: Story = {
  render: CardHierarchyWithState,
  args: {
    members: clubStructure,
    initialExpandedDepth: 10,
  },
  parameters: {
    docs: {
      description: {
        story:
          "All cards expanded initially. Shows complete hierarchy at once.",
      },
    },
  },
};

export const ThreeLevelsExpanded: Story = {
  render: CardHierarchyWithState,
  args: {
    members: clubStructure,
    initialExpandedDepth: 3,
  },
  parameters: {
    docs: {
      description: {
        story: "First 3 levels expanded - deeper than default",
      },
    },
  },
};

// ==================== DEEP HIERARCHY ====================

export const DeepHierarchy: Story = {
  render: (args) => {
    // Create a deeper hierarchy for testing
    const deepMembers: OrgChartNode[] = [
      {
        id: "root",
        title: "Chief Executive Officer",
        department: "algemeen",
        parentId: null,
        members: [{ id: "s-root", name: "CEO" }],
      },
      {
        id: "vp1",
        title: "Vice President Operations",
        department: "hoofdbestuur",
        parentId: "root",
        members: [{ id: "s-vp1", name: "VP Operations" }],
      },
      {
        id: "dir1",
        title: "Director of Department A",
        department: "hoofdbestuur",
        parentId: "vp1",
        members: [{ id: "s-dir1", name: "Director A" }],
      },
      {
        id: "mgr1",
        title: "Manager A1",
        department: "hoofdbestuur",
        parentId: "dir1",
        members: [{ id: "s-mgr1", name: "Manager A1" }],
      },
      {
        id: "lead1",
        title: "Team Lead",
        department: "hoofdbestuur",
        parentId: "mgr1",
        members: [{ id: "s-lead1", name: "Team Lead A1.1" }],
      },
      {
        id: "emp1",
        title: "Team Member",
        department: "hoofdbestuur",
        parentId: "lead1",
        members: [{ id: "s-emp1", name: "Employee 1" }],
      },
      {
        id: "emp2",
        title: "Team Member",
        department: "hoofdbestuur",
        parentId: "lead1",
        members: [{ id: "s-emp2", name: "Employee 2" }],
      },
    ];

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          7-level deep hierarchy to test nested expansion
        </p>
        <CardHierarchy
          {...args}
          members={deepMembers}
          initialExpandedDepth={3}
          onMemberClick={(member) =>
            alert(
              `Clicked: ${member.members[0]?.name ?? member.title} - ${member.title}`,
            )
          }
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Deep hierarchy (7 levels) to test performance and UX",
      },
    },
  },
};

// ==================== SEARCH & AUTO-EXPAND ====================

export const SearchWithAutoExpand: Story = {
  render: (args) => {
    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Try searching for &quot;trainer&quot; or &quot;keeper&quot; - the
          hierarchy will auto-expand to show results
        </p>
        <CardHierarchy
          {...args}
          members={clubStructure}
          initialExpandedDepth={1}
          onMemberClick={(member) =>
            alert(
              `Clicked: ${member.members[0]?.name ?? member.title} - ${member.title}`,
            )
          }
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Search automatically expands ancestor cards to reveal matching results",
      },
    },
  },
};

// ==================== RESPONSIVE VIEWPORTS ====================

export const Mobile: Story = {
  render: CardHierarchyWithState,
  args: {
    members: clubStructure,
    initialExpandedDepth: 2,
  },
  parameters: {
    docs: {
      description: {
        story: "Mobile view - touch-friendly expand/collapse buttons",
      },
    },
  },
  globals: {
    viewport: { value: "kcvvMobile" },
  },
};

export const Tablet: Story = {
  render: CardHierarchyWithState,
  args: {
    members: clubStructure,
    initialExpandedDepth: 2,
  },
  parameters: {
    docs: {
      description: {
        story: "Tablet view - good balance of hierarchy visibility",
      },
    },
  },
  globals: {
    viewport: { value: "tablet" },
  },
};

// ==================== LOADING & EMPTY STATES ====================

export const Loading: Story = {
  render: CardHierarchyWithState,
  args: {
    members: clubStructure,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Loading state with skeleton cards at various depths",
      },
    },
  },
};

export const EmptyState: Story = {
  render: CardHierarchyWithState,
  args: {
    members: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no members exist",
      },
    },
  },
};

// ==================== DEPARTMENT FILTERING ====================

export const FilteredHoofdbestuur: Story = {
  render: (args) => {
    // Pre-filtered to Hoofdbestuur
    const hoofdbestuurMembers = clubStructure.filter(
      (m) => m.department === "hoofdbestuur" || m.department === "algemeen",
    );

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Showing only Hoofdbestuur members (use Department Filter to switch)
        </p>
        <CardHierarchy
          {...args}
          members={hoofdbestuurMembers}
          initialExpandedDepth={2}
          onMemberClick={(member) =>
            alert(
              `Clicked: ${member.members[0]?.name ?? member.title} - ${member.title}`,
            )
          }
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Hierarchy filtered to Hoofdbestuur department only",
      },
    },
  },
};

// ==================== INTERACTION EXAMPLES ====================

export const InteractionExample: Story = {
  render: (args) => {
    const [expandHistory, setExpandHistory] = useState<string[]>([]);

    return (
      <div className="space-y-6">
        <CardHierarchy
          {...args}
          members={clubStructure}
          initialExpandedDepth={1}
          onMemberClick={(member) => {
            setExpandHistory((prev) => [
              ...prev,
              `Clicked: ${member.members[0]?.name ?? member.title} - ${member.title}`,
            ]);
          }}
        />

        {/* Interaction History */}
        {expandHistory.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-kcvv-gray-blue mb-2">
              Interaction History
            </h3>
            <ul className="text-xs text-kcvv-gray-dark space-y-1">
              {expandHistory.slice(-5).map((item, i) => (
                <li key={i}>
                  {i + 1}. {item}
                </li>
              ))}
            </ul>
            {expandHistory.length > 5 && (
              <p className="text-xs text-kcvv-gray mt-2">
                ... and {expandHistory.length - 5} more
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive example tracking clicks and expansions",
      },
    },
  },
};

// ==================== ANIMATION SHOWCASE ====================

export const AnimationShowcase: Story = {
  render: (args) => {
    // Create a simple 3-level hierarchy for animation testing
    const simpleHierarchy: OrgChartNode[] = [
      {
        id: "1",
        title: "Voorzitter",
        department: "hoofdbestuur",
        parentId: null,
        members: [{ id: "sh-1", name: "President" }],
      },
      {
        id: "2",
        title: "Ondervoorzitter",
        department: "hoofdbestuur",
        parentId: "1",
        members: [{ id: "sh-2", name: "Vice President" }],
      },
      {
        id: "3",
        title: "Secretaris",
        department: "hoofdbestuur",
        parentId: "1",
        members: [{ id: "sh-3", name: "Secretary" }],
      },
      {
        id: "4",
        title: "Assistent",
        department: "hoofdbestuur",
        parentId: "2",
        members: [{ id: "sh-4", name: "Assistant 1" }],
      },
      {
        id: "5",
        title: "Assistent",
        department: "hoofdbestuur",
        parentId: "2",
        members: [{ id: "sh-5", name: "Assistant 2" }],
      },
    ];

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Click expand/collapse buttons to see smooth animations
        </p>
        <CardHierarchy
          {...args}
          members={simpleHierarchy}
          initialExpandedDepth={1}
          onMemberClick={(member) =>
            alert(
              `Clicked: ${member.members[0]?.name ?? member.title} - ${member.title}`,
            )
          }
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Simple hierarchy to showcase smooth expand/collapse animations",
      },
    },
  },
};

// ==================== LARGE DATASET ====================

export const LargeDataset: Story = {
  render: (args) => {
    // Generate a larger hierarchy
    const largeHierarchy: OrgChartNode[] = [
      {
        id: "root",
        title: "KCVV Elewijt",
        department: "algemeen",
        parentId: null,
        members: [{ id: "lh-root", name: "Club" }],
      },
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `member-${i}`,
        title: `Position ${i + 1}`,
        roleCode: `P${i}`,
        department:
          i % 2 === 0 ? ("hoofdbestuur" as const) : ("jeugdbestuur" as const),
        parentId: i < 10 ? "root" : `member-${Math.floor(i / 5) - 2}`,
        members: [
          {
            id: `lh-staff-${i}`,
            name: `Member ${i + 1}`,
            email: `member${i}@kcvvelewijt.be`,
          },
        ],
      })),
    ];

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Large dataset (50 members) to test performance
        </p>
        <CardHierarchy
          {...args}
          members={largeHierarchy}
          initialExpandedDepth={2}
          onMemberClick={(member) =>
            alert(
              `Clicked: ${member.members[0]?.name ?? member.title} - ${member.title}`,
            )
          }
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Large dataset (50 members) to test scrolling and performance",
      },
    },
  },
};

// ==================== ACCESSIBILITY ====================

export const AccessibilityTest: Story = {
  render: CardHierarchyWithState,
  args: {
    members: clubStructure,
    initialExpandedDepth: 2,
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "button-name", enabled: true },
          { id: "aria-valid-attr-value", enabled: true },
          { id: "aria-expanded", enabled: true },
        ],
      },
    },
    docs: {
      description: {
        story:
          "Accessibility testing - keyboard navigation and screen reader support",
      },
    },
  },
};

// ==================== EDGE CASES ====================

export const SingleMember: Story = {
  render: CardHierarchyWithState,
  args: {
    members: [
      clubStructure[0] ?? {
        id: "club",
        name: "KCVV Elewijt",
        title: "Voetbalclub",
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Edge case: Single member with no children",
      },
    },
  },
};

export const FlatHierarchy: Story = {
  render: () => {
    // All members at same level (no hierarchy)
    const flatMembers = clubStructure.map((m) => ({ ...m, parentId: null }));

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          All members at root level (no hierarchy)
        </p>
        <CardHierarchy
          members={flatMembers}
          initialExpandedDepth={0}
          onMemberClick={(member) =>
            alert(
              `Clicked: ${member.members[0]?.name ?? member.title} - ${member.title}`,
            )
          }
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Edge case: Flat structure with no parent-child relationships",
      },
    },
  },
};
