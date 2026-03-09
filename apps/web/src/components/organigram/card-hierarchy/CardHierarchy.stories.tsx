import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CardHierarchy } from "./CardHierarchy";
import type { CardHierarchyProps } from "./CardHierarchy";
import type { OrgChartNode } from "@/types/organigram";
import { clubStructure } from "@/data/club-structure";
import { responsibilityPaths } from "@/data/responsibility-paths";

const meta: Meta<typeof CardHierarchy> = {
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
    responsibilityPaths,
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
};

export default meta;
type Story = StoryObj<typeof CardHierarchy>;

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
            {selectedMember.name} - {selectedMember.title}
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
  render: () => {
    // Create a deeper hierarchy for testing
    const deepMembers: OrgChartNode[] = [
      {
        id: "root",
        name: "CEO",
        title: "Chief Executive Officer",
        department: "general",
        parentId: null,
      },
      {
        id: "vp1",
        name: "VP Operations",
        title: "Vice President Operations",
        department: "hoofdbestuur",
        parentId: "root",
      },
      {
        id: "dir1",
        name: "Director A",
        title: "Director of Department A",
        department: "hoofdbestuur",
        parentId: "vp1",
      },
      {
        id: "mgr1",
        name: "Manager A1",
        title: "Manager A1",
        department: "hoofdbestuur",
        parentId: "dir1",
      },
      {
        id: "lead1",
        name: "Team Lead A1.1",
        title: "Team Lead",
        department: "hoofdbestuur",
        parentId: "mgr1",
      },
      {
        id: "emp1",
        name: "Employee 1",
        title: "Team Member",
        department: "hoofdbestuur",
        parentId: "lead1",
      },
      {
        id: "emp2",
        name: "Employee 2",
        title: "Team Member",
        department: "hoofdbestuur",
        parentId: "lead1",
      },
    ];

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          7-level deep hierarchy to test nested expansion
        </p>
        <CardHierarchy
          members={deepMembers}
          initialExpandedDepth={3}
          onMemberClick={(member) =>
            alert(`Clicked: ${member.name} - ${member.title}`)
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
  render: () => {
    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Try searching for &quot;trainer&quot; or &quot;keeper&quot; - the
          hierarchy will auto-expand to show results
        </p>
        <CardHierarchy
          members={clubStructure}
          initialExpandedDepth={1}
          onMemberClick={(member) =>
            alert(`Clicked: ${member.name} - ${member.title}`)
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
  render: () => {
    // Pre-filtered to Hoofdbestuur
    const hoofdbestuurMembers = clubStructure.filter(
      (m) => m.department === "hoofdbestuur" || m.department === "general",
    );

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Showing only Hoofdbestuur members (use Department Filter to switch)
        </p>
        <CardHierarchy
          members={hoofdbestuurMembers}
          initialExpandedDepth={2}
          onMemberClick={(member) =>
            alert(`Clicked: ${member.name} - ${member.title}`)
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
  render: () => {
    const [expandHistory, setExpandHistory] = useState<string[]>([]);

    return (
      <div className="space-y-6">
        <CardHierarchy
          members={clubStructure}
          initialExpandedDepth={1}
          onMemberClick={(member) => {
            setExpandHistory((prev) => [
              ...prev,
              `Clicked: ${member.name} - ${member.title}`,
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
  render: () => {
    // Create a simple 3-level hierarchy for animation testing
    const simpleHierarchy: OrgChartNode[] = [
      {
        id: "1",
        name: "President",
        title: "Voorzitter",
        department: "hoofdbestuur",
        parentId: null,
      },
      {
        id: "2",
        name: "Vice President",
        title: "Ondervoorzitter",
        department: "hoofdbestuur",
        parentId: "1",
      },
      {
        id: "3",
        name: "Secretary",
        title: "Secretaris",
        department: "hoofdbestuur",
        parentId: "1",
      },
      {
        id: "4",
        name: "Assistant 1",
        title: "Assistent",
        department: "hoofdbestuur",
        parentId: "2",
      },
      {
        id: "5",
        name: "Assistant 2",
        title: "Assistent",
        department: "hoofdbestuur",
        parentId: "2",
      },
    ];

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Click expand/collapse buttons to see smooth animations
        </p>
        <CardHierarchy
          members={simpleHierarchy}
          initialExpandedDepth={1}
          onMemberClick={(member) =>
            alert(`Clicked: ${member.name} - ${member.title}`)
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
  render: () => {
    // Generate a larger hierarchy
    const largeHierarchy: OrgChartNode[] = [
      {
        id: "root",
        name: "Club",
        title: "KCVV Elewijt",
        department: "general",
        parentId: null,
      },
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `member-${i}`,
        name: `Member ${i + 1}`,
        title: `Position ${i + 1}`,
        positionShort: `P${i}`,
        email: `member${i}@kcvvelewijt.be`,
        department:
          i % 2 === 0 ? ("hoofdbestuur" as const) : ("jeugdbestuur" as const),
        parentId: i < 10 ? "root" : `member-${Math.floor(i / 5) - 2}`,
      })),
    ];

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Large dataset (50 members) to test performance
        </p>
        <CardHierarchy
          members={largeHierarchy}
          initialExpandedDepth={2}
          onMemberClick={(member) =>
            alert(`Clicked: ${member.name} - ${member.title}`)
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
    members: [clubStructure[0]],
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
            alert(`Clicked: ${member.name} - ${member.title}`)
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
