import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ContactCard } from "./ContactCard";
import type { OrgChartNode } from "@/types/organigram";

const meta = {
  title: "Features/Organigram/ContactCard",
  component: ContactCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**ContactCard** - Unified member card component used across all organigram prototypes.

Provides consistent visual design following KCVV design system with:
- Green accent bar (#4acf52)
- Profile image with green border
- Name in Quasimoda/Acumin Pro
- Title in Montserrat
- Optional quick actions and badges

**Variants:**
- \`compact\`: Small card for mobile/list views (96px height)
- \`detailed\`: Full card with all information (140px+ height)
- \`grid\`: Optimized for grid layouts (square aspect ratio)
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    member: { id: "default", name: "Naam", title: "Titel" },
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["compact", "detailed", "grid"],
      description: "Card display variant",
    },
    showQuickActions: {
      control: "boolean",
      description: "Show inline email/phone actions",
    },
    showDepartment: {
      control: "boolean",
      description: "Show department badge",
    },
    showExpandIndicator: {
      control: "boolean",
      description: "Show expand/collapse indicator",
    },
    isExpanded: {
      control: "boolean",
      description: "Current expansion state",
    },
  },
} satisfies Meta<typeof ContactCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock Data
const mockMemberComplete: OrgChartNode = {
  id: "president",
  name: "Jan Janssens",
  title: "Voorzitter van het Hoofdbestuur",
  roleCode: "PRES",
  imageUrl:
    "https://ui-avatars.com/api/?name=Jan+Janssens&background=4acf52&color=fff&size=96",
  email: "jan.janssens@kcvvelewijt.be",
  phone: "+32 470 12 34 56",
  department: "hoofdbestuur",
  responsibilities:
    "Leiding geven aan het volledige bestuur, vertegenwoordigen van de club naar buiten toe, strategische beslissingen en algemene coördinatie.",
  parentId: "club",
  _children: [{} as OrgChartNode, {} as OrgChartNode], // Simulate children
};

const mockMemberMinimal: OrgChartNode = {
  id: "member-2",
  name: "Marie Peeters",
  title: "Secretaris Jeugdbestuur",
  department: "jeugdbestuur",
  parentId: "youth-coordinator",
};

const mockMemberNoContact: OrgChartNode = {
  id: "member-3",
  name: "Tom Vermeulen",
  title: "Trainer U10",
  roleCode: "T-U10",
  department: "jeugdbestuur",
  imageUrl: "https://ui-avatars.com/api/?name=Tom+Vermeulen&background=random",
  parentId: "u10-coordinator",
};

const mockMemberLongTitle: OrgChartNode = {
  id: "member-4",
  name: "Els Van de Broek-Vandenberghe",
  title:
    "Coördinator Jeugdwerking en Vrijwilligers voor de Benjamins en Pupillen",
  roleCode: "COORD",
  email: "els.vandebroek@kcvvelewijt.be",
  department: "jeugdbestuur",
  parentId: "youth",
};

// ==================== DEFAULT STORIES ====================

export const Default: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
  },
};

export const Compact: Story = {
  args: {
    member: mockMemberComplete,
    variant: "compact",
  },
};

export const Grid: Story = {
  args: {
    member: mockMemberComplete,
    variant: "grid",
  },
};

// ==================== WITH FEATURES ====================

export const WithQuickActions: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
    showQuickActions: true,
  },
};

export const WithDepartment: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
    showDepartment: true,
  },
};

export const WithExpandIndicator: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
    showExpandIndicator: true,
    isExpanded: false,
  },
};

export const ExpandIndicatorExpanded: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
    showExpandIndicator: true,
    isExpanded: true,
  },
};

export const AllFeatures: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
    showQuickActions: true,
    showDepartment: true,
    showExpandIndicator: true,
    isExpanded: false,
  },
};

// ==================== DATA VARIATIONS ====================

export const MinimalData: Story = {
  args: {
    member: mockMemberMinimal,
    variant: "detailed",
  },
};

export const NoContactInfo: Story = {
  args: {
    member: mockMemberNoContact,
    variant: "detailed",
    showQuickActions: true,
  },
};

export const LongText: Story = {
  args: {
    member: mockMemberLongTitle,
    variant: "detailed",
    showDepartment: true,
  },
};

export const NoImage: Story = {
  args: {
    member: {
      ...mockMemberComplete,
      imageUrl: undefined,
    },
    variant: "detailed",
  },
};

// ==================== MOBILE VIEWPORT ====================

export const CompactMobile: Story = {
  args: {
    member: mockMemberComplete,
    variant: "compact",
    showExpandIndicator: true,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const DetailedMobile: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
    showQuickActions: true,
    showDepartment: true,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

// ==================== GRID LAYOUT ====================

export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ContactCard member={mockMemberComplete} variant="grid" showDepartment />
      <ContactCard member={mockMemberMinimal} variant="grid" showDepartment />
      <ContactCard member={mockMemberNoContact} variant="grid" showDepartment />
      <ContactCard member={mockMemberLongTitle} variant="grid" showDepartment />
      <ContactCard
        member={{ ...mockMemberComplete, id: "5" }}
        variant="grid"
        showDepartment
      />
      <ContactCard
        member={{ ...mockMemberMinimal, id: "6" }}
        variant="grid"
        showDepartment
      />
    </div>
  ),
};

// ==================== LIST LAYOUT ====================

export const CompactList: Story = {
  render: () => (
    <div className="space-y-2">
      <ContactCard
        member={mockMemberComplete}
        variant="compact"
        showExpandIndicator
        isExpanded={false}
      />
      <ContactCard member={mockMemberMinimal} variant="compact" />
      <ContactCard
        member={mockMemberNoContact}
        variant="compact"
        showExpandIndicator
        isExpanded={true}
      />
      <ContactCard member={mockMemberLongTitle} variant="compact" />
    </div>
  ),
};

// ==================== INTERACTIVE STATES ====================

export const Clickable: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
  },
};

export const HoverState: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
  },
  parameters: {
    pseudo: { hover: true },
  },
};

// ==================== ACCESSIBILITY ====================

export const AccessibilityTest: Story = {
  args: {
    member: mockMemberComplete,
    variant: "detailed",
    showQuickActions: true,
    showDepartment: true,
    testId: "contact-card-test",
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "button-name", enabled: true },
          { id: "link-name", enabled: true },
          { id: "image-alt", enabled: true },
        ],
      },
    },
  },
};

// ==================== EDGE CASES ====================

export const VeryLongName: Story = {
  args: {
    member: {
      ...mockMemberComplete,
      name: "Johannesburg Van de Meerschautbroeck-Vandenberghe III",
    },
    variant: "detailed",
  },
};

export const EmptyMember: Story = {
  args: {
    member: {
      id: "empty",
      name: "",
      title: "",
      parentId: null,
    },
    variant: "detailed",
  },
};
