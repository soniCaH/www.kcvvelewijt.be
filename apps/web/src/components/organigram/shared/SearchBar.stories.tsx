import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { SearchBar } from "./SearchBar";
import type { SearchBarProps } from "./types";
import type { OrgChartNode } from "@/types/organigram";

const meta = {
  title: "Features/Organigram/SearchBar",
  component: SearchBar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**SearchBar** - Unified search with fuzzy matching and autocomplete

**Features:**
- 🔍 Fuzzy search by name, title, position, email, department
- 📊 Scoring algorithm for relevance ranking
- ⌨️ Keyboard navigation (Arrow keys, Enter, Escape)
- 🎯 Autocomplete dropdown with visual match indicators
- ✨ Click-outside to close
- 🧹 Clear button

**Keyboard Shortcuts:**
- \`Arrow Down/Up\`: Navigate results
- \`Enter\`: Select highlighted result
- \`Escape\`: Close dropdown or clear search

**Search Algorithm:**
- Name match: 10 points (+5 if starts with query)
- Title match: 8 points
- Position match: 7 points
- Email match: 5 points
- Department match: 3 points
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    value: "",
    onChange: fn(),
    members: [],
  },
  argTypes: {
    value: {
      control: "text",
      description: "Current search value",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    showAutocomplete: {
      control: "boolean",
      description: "Show autocomplete dropdown",
    },
    maxResults: {
      control: "number",
      description: "Max autocomplete results",
    },
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock Data
const mockMembers: OrgChartNode[] = [
  {
    id: "1",
    title: "Voorzitter Hoofdbestuur",
    roleCode: "PRES",
    department: "hoofdbestuur",
    parentId: null,
    members: [
      {
        id: "staff-1",
        name: "Jan Janssens",
        email: "jan.janssens@kcvvelewijt.be",
      },
    ],
  },
  {
    id: "2",
    title: "Secretaris Jeugdbestuur",
    roleCode: "JSEC",
    department: "jeugdbestuur",
    parentId: null,
    members: [
      {
        id: "staff-2",
        name: "Marie Peeters",
        email: "marie.peeters@kcvvelewijt.be",
      },
    ],
  },
  {
    id: "3",
    title: "Trainer U10",
    roleCode: "T-U10",
    department: "jeugdbestuur",
    parentId: null,
    members: [
      {
        id: "staff-3",
        name: "Tom Vermeulen",
        email: "tom.vermeulen@kcvvelewijt.be",
      },
    ],
  },
  {
    id: "4",
    title: "Coördinator Jeugdwerking",
    roleCode: "COORD",
    department: "jeugdbestuur",
    parentId: null,
    members: [
      {
        id: "staff-4",
        name: "Els Van de Broek",
        email: "els.vandebroek@kcvvelewijt.be",
      },
    ],
  },
  {
    id: "5",
    title: "Penningmeester Hoofdbestuur",
    roleCode: "PM",
    department: "hoofdbestuur",
    parentId: null,
    members: [
      {
        id: "staff-5",
        name: "Peter Janssens",
        email: "peter.janssens@kcvvelewijt.be",
      },
    ],
  },
  {
    id: "6",
    title: "Trainer U13",
    roleCode: "T-U13",
    department: "jeugdbestuur",
    parentId: null,
    members: [
      {
        id: "staff-6",
        name: "Anna De Vries",
        email: "anna.devries@kcvvelewijt.be",
      },
    ],
  },
  {
    id: "7",
    title: "Technisch Coördinator",
    roleCode: "TC",
    department: "hoofdbestuur",
    parentId: null,
    members: [
      { id: "staff-7", name: "Dirk Smits", email: "dirk.smits@kcvvelewijt.be" },
    ],
  },
  {
    id: "8",
    title: "Jeugdcoördinator",
    roleCode: "JC",
    department: "jeugdbestuur",
    parentId: null,
    members: [
      {
        id: "staff-8",
        name: "Sarah Willems",
        email: "sarah.willems@kcvvelewijt.be",
      },
    ],
  },
];

// ==================== CONTROLLED COMPONENT WRAPPER ====================

const SearchBarWithState = (args: Partial<SearchBarProps>) => {
  const [value, setValue] = useState((args.value as string) || "");

  return (
    <SearchBar
      members={args.members || []}
      placeholder={args.placeholder}
      showAutocomplete={args.showAutocomplete ?? true}
      maxResults={args.maxResults}
      className={args.className}
      value={value}
      onChange={setValue}
      onSelect={(member) => {
        args.onSelect?.(member);
        console.log("Selected:", member);
        alert(
          `Selected: ${member.members[0]?.name ?? member.title} - ${member.title}`,
        );
      }}
    />
  );
};

// ==================== DEFAULT STORIES ====================

export const Default: Story = {
  render: SearchBarWithState,
  args: {
    members: mockMembers,
    showAutocomplete: true,
    maxResults: 6,
  },
};

export const WithInitialValue: Story = {
  render: SearchBarWithState,
  args: {
    value: "Jan",
    members: mockMembers,
    showAutocomplete: true,
  },
};

export const CustomPlaceholder: Story = {
  render: SearchBarWithState,
  args: {
    members: mockMembers,
    placeholder: "Typ een naam, functie of afdeling...",
    showAutocomplete: true,
  },
};

// ==================== AUTOCOMPLETE VARIATIONS ====================

export const WithAutocomplete: Story = {
  render: SearchBarWithState,
  args: {
    value: "Jan",
    members: mockMembers,
    showAutocomplete: true,
    maxResults: 6,
  },
};

export const WithoutAutocomplete: Story = {
  render: SearchBarWithState,
  args: {
    value: "Jan",
    members: mockMembers,
    showAutocomplete: false,
  },
};

export const LimitedResults: Story = {
  render: SearchBarWithState,
  args: {
    value: "a",
    members: mockMembers,
    showAutocomplete: true,
    maxResults: 3,
  },
};

// ==================== SEARCH SCENARIOS ====================

export const SearchByName: Story = {
  render: SearchBarWithState,
  args: {
    value: "jan",
    members: mockMembers,
    showAutocomplete: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Searching by name 'jan' finds both Jan Janssens and Peter Janssens",
      },
    },
  },
};

export const SearchByTitle: Story = {
  render: SearchBarWithState,
  args: {
    value: "trainer",
    members: mockMembers,
    showAutocomplete: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Searching by title 'trainer' finds all trainers",
      },
    },
  },
};

export const SearchByDepartment: Story = {
  render: SearchBarWithState,
  args: {
    value: "jeugd",
    members: mockMembers,
    showAutocomplete: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Searching by department 'jeugd' finds all youth board members",
      },
    },
  },
};

export const SearchByEmail: Story = {
  render: SearchBarWithState,
  args: {
    value: "@kcvv",
    members: mockMembers,
    showAutocomplete: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Searching by email domain finds all members with that domain",
      },
    },
  },
};

export const PartialMatch: Story = {
  render: SearchBarWithState,
  args: {
    value: "coord",
    members: mockMembers,
    showAutocomplete: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Partial match 'coord' finds both Coördinator Jeugdwerking and Technisch Coördinator",
      },
    },
  },
};

// ==================== NO RESULTS ====================

export const NoResults: Story = {
  render: SearchBarWithState,
  args: {
    value: "xyz123",
    members: mockMembers,
    showAutocomplete: true,
  },
};

export const EmptyMembers: Story = {
  render: SearchBarWithState,
  args: {
    value: "jan",
    members: [],
    showAutocomplete: true,
  },
};

// ==================== MOBILE VIEWPORT ====================

export const Mobile: Story = {
  render: SearchBarWithState,
  args: {
    value: "jan",
    members: mockMembers,
    showAutocomplete: true,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

// ==================== INTEGRATION EXAMPLES ====================

export const InPageHeader: Story = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <div className="from-kcvv-green to-kcvv-green-hover rounded-lg bg-gradient-to-br p-8">
        <h1
          className="mb-4 text-3xl font-bold text-white"
          style={{
            fontFamily:
              "quasimoda, -apple-system, system-ui, Montserrat, sans-serif",
          }}
        >
          Organigram KCVV Elewijt
        </h1>
        <SearchBar
          value={value}
          onChange={setValue}
          members={mockMembers}
          placeholder="Zoek een bestuurslid..."
          showAutocomplete={true}
        />
      </div>
    );
  },
};

export const WithFilters: Story = {
  render: () => {
    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState<
      "all" | "hoofdbestuur" | "jeugdbestuur"
    >("all");

    const filteredMembers =
      department === "all"
        ? mockMembers
        : mockMembers.filter((m) => m.department === department);

    return (
      <div className="space-y-4">
        {/* Department Filter */}
        <div className="flex gap-2">
          {(
            [
              ["all", "Alle"],
              ["hoofdbestuur", "Hoofdbestuur"],
              ["jeugdbestuur", "Jeugdbestuur"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setDepartment(value)}
              className={`rounded-lg px-4 py-2 font-medium transition-all ${
                department === value
                  ? "bg-kcvv-green text-white shadow-md"
                  : "text-kcvv-gray-dark bg-gray-100 hover:bg-gray-200"
              } `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          members={filteredMembers}
          showAutocomplete={true}
        />

        {/* Results Count */}
        <p className="text-kcvv-gray text-sm">
          {filteredMembers.length} leden {search && `gevonden voor "${search}"`}
        </p>
      </div>
    );
  },
};

// ==================== KEYBOARD NAVIGATION ====================

export const KeyboardNavigation: Story = {
  render: SearchBarWithState,
  args: {
    value: "jan",
    members: mockMembers,
    showAutocomplete: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Try these keyboard shortcuts:**
- Type to search
- \`Arrow Down\` to navigate results
- \`Arrow Up\` to go back
- \`Enter\` to select
- \`Escape\` to close or clear
        `,
      },
    },
  },
};

// ==================== ACCESSIBILITY ====================

export const AccessibilityTest: Story = {
  render: SearchBarWithState,
  args: {
    value: "jan",
    members: mockMembers,
    showAutocomplete: true,
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "label", enabled: true },
          { id: "aria-required-attr", enabled: true },
          { id: "aria-valid-attr-value", enabled: true },
        ],
      },
    },
  },
};

// ==================== LARGE DATASET ====================

export const LargeDataset: Story = {
  render: () => {
    const [value, setValue] = useState("");

    // Generate 50 mock members
    const largeMemberList: OrgChartNode[] = Array.from(
      { length: 50 },
      (_, i) => ({
        id: `member-${i}`,
        title: `Position ${i + 1}`,
        roleCode: `P${i}`,
        department: (i % 2 === 0 ? "hoofdbestuur" : "jeugdbestuur") as
          | "hoofdbestuur"
          | "jeugdbestuur",
        parentId: null,
        members: [
          {
            id: `staff-member-${i}`,
            name: `Member ${i + 1}`,
            email: `member${i}@kcvvelewijt.be`,
          },
        ],
      }),
    );

    return (
      <div className="space-y-4">
        <SearchBar
          value={value}
          onChange={setValue}
          members={largeMemberList}
          showAutocomplete={true}
          maxResults={10}
        />
        <p className="text-kcvv-gray text-sm">
          Dataset: 50 members (showing max 10 results)
        </p>
      </div>
    );
  },
};
