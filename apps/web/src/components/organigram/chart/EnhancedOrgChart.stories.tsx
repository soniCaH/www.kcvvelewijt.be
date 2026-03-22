import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { EnhancedOrgChart } from "./EnhancedOrgChart";
import type { EnhancedOrgChartProps } from "./EnhancedOrgChart";
import type { OrgChartNode } from "@/types/organigram";
import { staffMembersFixture as clubStructure } from "@/components/organigram/__fixtures__/staff-members.fixture";

const meta = {
  title: "Features/Organigram/InteractiveChart",
  component: EnhancedOrgChart,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**Interactive Chart View** - D3-based hierarchical visualization with mobile enhancements

**Pattern:** Enhanced d3-org-chart with better mobile UX

**Strengths:**
- ✅ Preserves visual hierarchy (best "big picture" view)
- ✅ Shows reporting relationships clearly
- ✅ Impressive presentation
- ✅ Familiar org chart pattern
- ✅ Enhanced mobile navigation drawer
- ✅ Contact overlay for quick actions

**Weaknesses:**
- ❌ Complex on mobile (even with enhancements)
- ❌ Not optimized for quick lookup
- ❌ Steeper learning curve
- ❌ Requires d3-org-chart dependency

**Best for:** Users wanting to understand organizational structure, presentations, desktop users

**Enhancements over current OrgChart.tsx:**
- 📱 Mobile navigation drawer (bottom sheet)
- 💬 Contact overlay on hover/tap
- 👆 Larger touch targets for mobile
- 🔍 Search highlighting with auto-zoom
- 🎯 Simplified zoom controls
- 📊 Better visual hierarchy
- 📱 Compact mobile nodes (200×100px)
- 🎨 KCVV branding throughout
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    members: clubStructure,
  },
  argTypes: {
    isLoading: {
      control: "boolean",
      description: "Loading state",
    },
  },
} satisfies Meta<typeof EnhancedOrgChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ==================== CONTROLLED COMPONENT WRAPPER ====================

const EnhancedOrgChartWithState = (args: Partial<EnhancedOrgChartProps>) => {
  const [selectedMember, setSelectedMember] = useState<OrgChartNode | null>(
    null,
  );

  return (
    <div>
      <EnhancedOrgChart
        members={args.members || []}
        isLoading={args.isLoading ?? false}
        className={args.className}
        onMemberClick={(member) => {
          setSelectedMember(member);
          args.onMemberClick?.(member);
          alert(`Clicked: ${member.name} - ${member.title}`);
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
  render: EnhancedOrgChartWithState,
  args: {
    members: clubStructure,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default enhanced d3-org-chart view. Shows full organizational hierarchy with improved mobile UX.",
      },
    },
  },
};

export const FullHierarchy: Story = {
  render: EnhancedOrgChartWithState,
  args: {
    members: clubStructure,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Complete organizational hierarchy visualization with all members visible",
      },
    },
  },
};

// ==================== SEARCH & ZOOM ====================

export const SearchAndZoom: Story = {
  render: () => {
    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Try searching for &quot;trainer&quot; or &quot;keeper&quot; - the
          chart will automatically zoom to the matching member
        </p>
        <EnhancedOrgChart
          members={clubStructure}
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
          "Search functionality with auto-zoom to selected member. Type to search, select to zoom.",
      },
    },
  },
};

// ==================== MOBILE FEATURES ====================

export const MobileNavigation: Story = {
  render: () => {
    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          On mobile: Tap &quot;Navigatie&quot; button to open bottom drawer with
          searchable member list
        </p>
        <EnhancedOrgChart
          members={clubStructure}
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
          "Mobile-specific navigation drawer provides easy access to member list with search and filters",
      },
    },
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const Mobile: Story = {
  render: EnhancedOrgChartWithState,
  args: {
    members: clubStructure,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Mobile view with compact nodes (200×100px), navigation drawer, and simplified controls",
      },
    },
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const Tablet: Story = {
  render: EnhancedOrgChartWithState,
  args: {
    members: clubStructure,
  },
  parameters: {
    docs: {
      description: {
        story: "Tablet view - balanced between mobile and desktop layouts",
      },
    },
  },
  globals: {
    viewport: { value: "tablet" },
  },
};

// ==================== DEPARTMENT FILTERING ====================

export const FilteredHoofdbestuur: Story = {
  render: () => {
    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Showing only Hoofdbestuur members (use Department Filter to switch) -
          The component handles filtering internally to maintain hierarchy
        </p>
        <EnhancedOrgChart
          members={clubStructure}
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

export const FilteredJeugdbestuur: Story = {
  render: () => {
    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Showing only Jeugdbestuur members - The component handles filtering
          internally to maintain hierarchy
        </p>
        <EnhancedOrgChart
          members={clubStructure}
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
        story: "Hierarchy filtered to Jeugdbestuur department only",
      },
    },
  },
};

// ==================== ZOOM & CONTROLS ====================

export const ZoomControls: Story = {
  render: () => {
    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Use zoom controls (bottom right): Zoom In, Zoom Out, Fit View. Also
          try expand/collapse all buttons.
        </p>
        <EnhancedOrgChart
          members={clubStructure}
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
          "Demonstrates zoom and pan controls. Use bottom-right buttons to zoom in/out or fit view.",
      },
    },
  },
};

// ==================== LOADING & EMPTY STATES ====================

export const Loading: Story = {
  render: EnhancedOrgChartWithState,
  args: {
    members: clubStructure,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Loading state with skeleton loaders",
      },
    },
  },
};

export const EmptyState: Story = {
  render: EnhancedOrgChartWithState,
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

// ==================== DIFFERENT DATASET SIZES ====================

export const SmallDataset: Story = {
  render: () => {
    // Small hierarchy (10 members)
    const smallMembers: OrgChartNode[] = [
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
        name: "Treasurer",
        title: "Penningmeester",
        department: "hoofdbestuur",
        parentId: "1",
      },
      {
        id: "5",
        name: "Youth Coordinator",
        title: "Jeugdcoördinator",
        department: "jeugdbestuur",
        parentId: "1",
      },
      {
        id: "6",
        name: "Assistant 1",
        title: "Assistent Secretary",
        department: "hoofdbestuur",
        parentId: "3",
      },
      {
        id: "7",
        name: "Assistant 2",
        title: "Assistent Treasurer",
        department: "hoofdbestuur",
        parentId: "4",
      },
      {
        id: "8",
        name: "U10 Coach",
        title: "Trainer U10",
        department: "jeugdbestuur",
        parentId: "5",
      },
      {
        id: "9",
        name: "U12 Coach",
        title: "Trainer U12",
        department: "jeugdbestuur",
        parentId: "5",
      },
      {
        id: "10",
        name: "U15 Coach",
        title: "Trainer U15",
        department: "jeugdbestuur",
        parentId: "5",
      },
    ];

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Small dataset (10 members) - easier to see full hierarchy at once
        </p>
        <EnhancedOrgChart
          members={smallMembers}
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
          "Small dataset (10 members) provides clearer view of hierarchy structure",
      },
    },
  },
};

export const LargeDataset: Story = {
  render: () => {
    // Generate larger hierarchy (60 members)
    const largeHierarchy: OrgChartNode[] = [
      {
        id: "root",
        name: "Club",
        title: "KCVV Elewijt",
        department: "algemeen",
        parentId: null,
      },
      ...Array.from({ length: 60 }, (_, i) => ({
        id: `member-${i}`,
        name: `Member ${i + 1}`,
        title: `Position ${i + 1}`,
        positionShort: `P${i}`,
        email: `member${i}@kcvvelewijt.be`,
        department:
          i % 2 === 0 ? ("hoofdbestuur" as const) : ("jeugdbestuur" as const),
        // Fix parentId calculation to ensure valid references
        parentId:
          i < 15 ? "root" : `member-${Math.max(0, Math.floor(i / 4) - 4)}`,
      })),
    ];

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          Large dataset (60 members) to test performance and zoom/pan
          functionality
        </p>
        <EnhancedOrgChart
          members={largeHierarchy}
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
          "Large dataset (60 members) tests performance and navigation with many nodes",
      },
    },
  },
};

// ==================== INTERACTION EXAMPLES ====================

export const InteractionExample: Story = {
  render: () => {
    const [interactionHistory, setInteractionHistory] = useState<string[]>([]);

    return (
      <div className="space-y-6">
        <EnhancedOrgChart
          members={clubStructure}
          onMemberClick={(member) => {
            setInteractionHistory((prev) => [
              ...prev,
              `Clicked: ${member.name} - ${member.title}`,
            ]);
          }}
        />

        {/* Interaction History */}
        {interactionHistory.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-kcvv-gray-blue mb-2">
              Interaction History
            </h3>
            <ul className="text-xs text-kcvv-gray-dark space-y-1">
              {interactionHistory.slice(-5).map((item, i) => (
                <li key={i}>
                  {i + 1}. {item}
                </li>
              ))}
            </ul>
            {interactionHistory.length > 5 && (
              <p className="text-xs text-kcvv-gray mt-2">
                ... and {interactionHistory.length - 5} more
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
        story: "Interactive example tracking member clicks and selections",
      },
    },
  },
};

// ==================== ACCESSIBILITY ====================

export const AccessibilityTest: Story = {
  render: EnhancedOrgChartWithState,
  args: {
    members: clubStructure,
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "button-name", enabled: true },
          { id: "aria-valid-attr-value", enabled: true },
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
  render: EnhancedOrgChartWithState,
  args: {
    members: [
      clubStructure[0] ?? {
        id: "fallback",
        name: "Naam",
        title: "Functie",
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

export const DeepHierarchy: Story = {
  render: () => {
    // Create deeper hierarchy (7 levels)
    const deepMembers: OrgChartNode[] = [
      {
        id: "root",
        name: "CEO",
        title: "Chief Executive Officer",
        department: "algemeen",
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
        id: "senior1",
        name: "Senior Member 1",
        title: "Senior Team Member",
        department: "hoofdbestuur",
        parentId: "lead1",
      },
      {
        id: "emp1",
        name: "Employee 1",
        title: "Team Member",
        department: "hoofdbestuur",
        parentId: "senior1",
      },
      {
        id: "emp2",
        name: "Employee 2",
        title: "Team Member",
        department: "hoofdbestuur",
        parentId: "senior1",
      },
    ];

    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4">
          7-level deep hierarchy to test vertical scaling and expand/collapse
        </p>
        <EnhancedOrgChart
          members={deepMembers}
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
        story: "Deep hierarchy (7 levels) to test vertical organization",
      },
    },
  },
};

// ==================== COMPARISON WITH CURRENT ====================

export const EnhancedVsCurrent: Story = {
  render: () => {
    return (
      <div>
        <p className="text-sm text-kcvv-gray mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <strong>Key Enhancements over current OrgChart.tsx:</strong>
          <br />
          ✅ Mobile navigation drawer for easier browsing
          <br />
          ✅ Contact overlay for quick actions (email, phone)
          <br />
          ✅ Compact mobile nodes (200×100px vs 280×140px)
          <br />
          ✅ Larger touch targets (48×48px minimum)
          <br />
          ✅ Simplified controls bar
          <br />
          ✅ Better search integration with auto-zoom
          <br />
          ✅ Department filtering
          <br />✅ Enhanced KCVV branding throughout
        </p>
        <EnhancedOrgChart
          members={clubStructure}
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
          "Side-by-side comparison demonstrating enhancements over the current OrgChart implementation",
      },
    },
  },
};
