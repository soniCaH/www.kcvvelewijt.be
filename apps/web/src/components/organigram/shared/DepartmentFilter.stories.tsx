import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { DepartmentFilter } from "./DepartmentFilter";
import type { DepartmentFilterProps } from "./types";
import type { OrgChartNode } from "@/types/organigram";

const meta = {
  title: "Features/Organigram/DepartmentFilter",
  component: DepartmentFilter,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**DepartmentFilter** - Department selection with horizontal scrolling

Inspired by CategoryFilters pattern with:
- Three options: Alle, Hoofdbestuur, Jeugdbestuur
- Member counts per department
- Active state highlighting (green background)
- Horizontal scrolling on mobile with navigation arrows
- Smooth scroll animation
- Three display variants: tabs, pills, buttons

**Features:**
- 📊 Shows member count per department
- ⬅️➡️ Horizontal scroll arrows (appear when needed)
- 🎨 Three visual variants
- ⌨️ Keyboard accessible
- 📱 Mobile-friendly horizontal scroll
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    value: "all",
    onChange: fn(),
    members: [],
  },
  argTypes: {
    value: {
      control: "select",
      options: ["all", "hoofdbestuur", "jeugdbestuur"],
      description: "Current active department",
    },
    showCounts: {
      control: "boolean",
      description: "Show member counts",
    },
    variant: {
      control: "select",
      options: ["tabs", "pills", "buttons"],
      description: "Display style",
    },
  },
} satisfies Meta<typeof DepartmentFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock Data
const mockMembers: OrgChartNode[] = [
  // Hoofdbestuur (8 members)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `hb-${i}`,
    name: `Hoofdbestuur Member ${i + 1}`,
    title: `Position ${i + 1}`,
    department: "hoofdbestuur" as const,
    parentId: null,
  })),
  // Jeugdbestuur (15 members)
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `jb-${i}`,
    name: `Jeugdbestuur Member ${i + 1}`,
    title: `Position ${i + 1}`,
    department: "jeugdbestuur" as const,
    parentId: null,
  })),
  // General (2 members)
  {
    id: "gen-1",
    name: "Club",
    title: "KCVV Elewijt",
    department: "algemeen" as const,
    parentId: null,
  },
  {
    id: "gen-2",
    name: "President",
    title: "Voorzitter",
    department: "algemeen" as const,
    parentId: null,
  },
];

// ==================== CONTROLLED COMPONENT WRAPPER ====================

const DepartmentFilterWithState = (args: Partial<DepartmentFilterProps>) => {
  const [value, setValue] = useState<"all" | "hoofdbestuur" | "jeugdbestuur">(
    (args.value as "all" | "hoofdbestuur" | "jeugdbestuur") || "all",
  );

  return (
    <div className="space-y-4">
      <DepartmentFilter
        members={args.members || []}
        showCounts={args.showCounts ?? true}
        variant={args.variant || "tabs"}
        className={args.className}
        value={value}
        onChange={setValue}
      />

      {/* Selected Department Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Selected:</strong>{" "}
          {value === "all" ? "Alle afdelingen" : value}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Members:</strong>{" "}
          {value === "all"
            ? mockMembers.length
            : mockMembers.filter(
                (m) =>
                  m.department === value ||
                  (value === "hoofdbestuur" && m.department === "algemeen"),
              ).length}
        </p>
      </div>
    </div>
  );
};

// ==================== DEFAULT STORIES ====================

export const Default: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: mockMembers,
    showCounts: true,
    variant: "tabs",
  },
};

export const Pills: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: mockMembers,
    showCounts: true,
    variant: "pills",
  },
};

export const Buttons: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: mockMembers,
    showCounts: true,
    variant: "buttons",
  },
};

// ==================== WITH/WITHOUT COUNTS ====================

export const WithoutCounts: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: mockMembers,
    showCounts: false,
    variant: "tabs",
  },
};

// ==================== VARIANT COMPARISON ====================

export const AllVariants: Story = {
  render: () => {
    const [tabsValue, setTabsValue] = useState<
      "all" | "hoofdbestuur" | "jeugdbestuur"
    >("all");
    const [pillsValue, setPillsValue] = useState<
      "all" | "hoofdbestuur" | "jeugdbestuur"
    >("all");
    const [buttonsValue, setButtonsValue] = useState<
      "all" | "hoofdbestuur" | "jeugdbestuur"
    >("all");

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Tabs</h3>
          <DepartmentFilter
            value={tabsValue}
            onChange={setTabsValue}
            members={mockMembers}
            variant="tabs"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Pills</h3>
          <DepartmentFilter
            value={pillsValue}
            onChange={setPillsValue}
            members={mockMembers}
            variant="pills"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Buttons</h3>
          <DepartmentFilter
            value={buttonsValue}
            onChange={setButtonsValue}
            members={mockMembers}
            variant="buttons"
          />
        </div>
      </div>
    );
  },
};

// ==================== INITIAL SELECTION ====================

export const SelectedHoofdbestuur: Story = {
  render: DepartmentFilterWithState,
  args: {
    value: "hoofdbestuur",
    members: mockMembers,
    showCounts: true,
    variant: "tabs",
  },
};

export const SelectedJeugdbestuur: Story = {
  render: DepartmentFilterWithState,
  args: {
    value: "jeugdbestuur",
    members: mockMembers,
    showCounts: true,
    variant: "tabs",
  },
};

// ==================== MOBILE VIEWPORT ====================

export const Mobile: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: mockMembers,
    showCounts: true,
    variant: "tabs",
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const MobilePills: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: mockMembers,
    showCounts: true,
    variant: "pills",
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

// ==================== EDGE CASES ====================

export const EmptyMembers: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: [],
    showCounts: true,
    variant: "tabs",
  },
};

export const OnlyHoofdbestuur: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: mockMembers.filter((m) => m.department === "hoofdbestuur"),
    showCounts: true,
    variant: "tabs",
  },
};

export const OnlyJeugdbestuur: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: mockMembers.filter((m) => m.department === "jeugdbestuur"),
    showCounts: true,
    variant: "tabs",
  },
};

export const LargeCounts: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: [
      ...mockMembers,
      ...Array.from({ length: 100 }, (_, i) => ({
        id: `extra-${i}`,
        name: `Extra Member ${i}`,
        title: "Position",
        department:
          i % 2 === 0 ? ("hoofdbestuur" as const) : ("jeugdbestuur" as const),
        parentId: null,
      })),
    ],
    showCounts: true,
    variant: "tabs",
  },
};

// ==================== INTEGRATION EXAMPLES ====================

export const WithSearchBar: Story = {
  render: () => {
    const [department, setDepartment] = useState<
      "all" | "hoofdbestuur" | "jeugdbestuur"
    >("all");
    const [search, setSearch] = useState("");

    const filteredMembers =
      department === "all"
        ? mockMembers
        : mockMembers.filter(
            (m) =>
              m.department === department ||
              (department === "hoofdbestuur" && m.department === "algemeen"),
          );

    const searchedMembers = search
      ? filteredMembers.filter(
          (m) =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.title.toLowerCase().includes(search.toLowerCase()),
        )
      : filteredMembers;

    return (
      <div className="space-y-4">
        <DepartmentFilter
          value={department}
          onChange={setDepartment}
          members={mockMembers}
          variant="pills"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek in geselecteerde afdeling..."
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-kcvv-green focus:outline-none"
        />

        <div className="text-sm text-gray-600">
          {searchedMembers.length} resultaten
        </div>
      </div>
    );
  },
};

export const InPageHeader: Story = {
  render: () => {
    const [department, setDepartment] = useState<
      "all" | "hoofdbestuur" | "jeugdbestuur"
    >("all");

    return (
      <div className="bg-gradient-to-br from-kcvv-green to-kcvv-green-hover p-8 rounded-lg">
        <h1
          className="text-3xl font-bold text-white mb-6"
          style={{
            fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
          }}
        >
          Organigram KCVV Elewijt
        </h1>

        <div className="bg-white rounded-lg p-4">
          <DepartmentFilter
            value={department}
            onChange={setDepartment}
            members={mockMembers}
            variant="tabs"
          />
        </div>
      </div>
    );
  },
};

// ==================== ACCESSIBILITY ====================

export const AccessibilityTest: Story = {
  render: DepartmentFilterWithState,
  args: {
    members: mockMembers,
    showCounts: true,
    variant: "tabs",
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
  },
};

// ==================== SCROLL BEHAVIOR ====================

export const ScrollBehavior: Story = {
  render: () => {
    const [department, setDepartment] = useState<
      "all" | "hoofdbestuur" | "jeugdbestuur"
    >("all");

    return (
      <div className="max-w-md">
        <p className="text-sm text-gray-600 mb-4">
          On small viewports, scroll arrows will appear. Try resizing your
          browser!
        </p>
        <DepartmentFilter
          value={department}
          onChange={setDepartment}
          members={mockMembers}
          variant="tabs"
        />
      </div>
    );
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};
