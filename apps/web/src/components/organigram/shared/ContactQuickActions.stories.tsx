import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContactQuickActions } from "./ContactQuickActions";

const meta = {
  title: "Features/Organigram/ContactQuickActions",
  component: ContactQuickActions,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
**ContactQuickActions** - Inline contact action buttons

Provides quick access to contact methods:
- 📧 Email (mailto link)
- 📞 Phone (tel link)
- 💬 WhatsApp (web.whatsapp.com)

**Features:**
- Hover tooltips showing full contact info
- Right-click to copy to clipboard
- Green KCVV branding with hover states
- Fully accessible with ARIA labels
- Touch-friendly (44px+ touch targets)

**Tip:** Right-click any button to copy the contact info!
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    name: "Jan Janssen",
  },
  argTypes: {
    email: {
      control: "text",
      description: "Email address",
    },
    phone: {
      control: "text",
      description: "Phone number",
    },
    name: {
      control: "text",
      description: "Name for ARIA labels",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Button size",
    },
  },
} satisfies Meta<typeof ContactQuickActions>;

export default meta;
type Story = StoryObj<typeof meta>;

// ==================== DEFAULT STORIES ====================

export const Default: Story = {
  args: {
    email: "jan.janssens@kcvvelewijt.be",
    phone: "+32 470 12 34 56",
    name: "Jan Janssens",
    size: "md",
  },
};

export const EmailOnly: Story = {
  args: {
    email: "secretaris@kcvvelewijt.be",
    name: "Secretaris",
    size: "md",
  },
};

export const PhoneOnly: Story = {
  args: {
    phone: "+32 470 12 34 56",
    name: "Trainer",
    size: "md",
  },
};

export const NoContact: Story = {
  args: {
    name: "Member Without Contact",
    size: "md",
  },
};

// ==================== SIZE VARIANTS ====================

export const SizeSmall: Story = {
  args: {
    email: "contact@kcvvelewijt.be",
    phone: "+32 470 12 34 56",
    name: "Contact Person",
    size: "sm",
  },
};

export const SizeMedium: Story = {
  args: {
    email: "contact@kcvvelewijt.be",
    phone: "+32 470 12 34 56",
    name: "Contact Person",
    size: "md",
  },
};

export const SizeLarge: Story = {
  args: {
    email: "contact@kcvvelewijt.be",
    phone: "+32 470 12 34 56",
    name: "Contact Person",
    size: "lg",
  },
};

// ==================== SIZE COMPARISON ====================

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Small (sm)</p>
        <ContactQuickActions
          email="small@kcvvelewijt.be"
          phone="+32 470 12 34 56"
          name="Small Size"
          size="sm"
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">
          Medium (md) - Default
        </p>
        <ContactQuickActions
          email="medium@kcvvelewijt.be"
          phone="+32 470 12 34 56"
          name="Medium Size"
          size="md"
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Large (lg)</p>
        <ContactQuickActions
          email="large@kcvvelewijt.be"
          phone="+32 470 12 34 56"
          name="Large Size"
          size="lg"
        />
      </div>
    </div>
  ),
};

// ==================== PHONE NUMBER FORMATS ====================

export const PhoneFormatBelgium: Story = {
  args: {
    phone: "+32 470 12 34 56",
    name: "Belgium Format",
    size: "md",
  },
};

export const PhoneFormatInternational: Story = {
  args: {
    phone: "+31 6 12 34 56 78",
    name: "Netherlands Format",
    size: "md",
  },
};

export const PhoneFormatDashes: Story = {
  args: {
    phone: "+32-470-12-34-56",
    name: "Dashes Format",
    size: "md",
  },
};

export const PhoneFormatNoSpaces: Story = {
  args: {
    phone: "+32470123456",
    name: "No Spaces Format",
    size: "md",
  },
};

// ==================== INTEGRATION EXAMPLES ====================

export const InMemberCard: Story = {
  render: () => (
    <div className="max-w-sm rounded-lg border-2 border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="bg-kcvv-green/20 text-kcvv-green flex h-12 w-12 items-center justify-center rounded-full font-bold">
          JJ
        </div>
        <div className="flex-1">
          <h3 className="text-kcvv-gray-blue font-bold">Jan Janssens</h3>
          <p className="text-kcvv-gray-dark text-sm">Voorzitter</p>
        </div>
      </div>
      <ContactQuickActions
        email="jan.janssens@kcvvelewijt.be"
        phone="+32 470 12 34 56"
        name="Jan Janssens"
        size="md"
      />
    </div>
  ),
};

export const InCompactList: Story = {
  render: () => (
    <div className="space-y-2">
      {[
        {
          name: "Jan Janssens",
          role: "Voorzitter",
          email: "jan@kcvv.be",
          phone: "+32 470 12 34 56",
        },
        {
          name: "Marie Peeters",
          role: "Secretaris",
          email: "marie@kcvv.be",
          phone: "+32 471 23 45 67",
        },
        {
          name: "Tom Vermeulen",
          role: "Penningmeester",
          email: "tom@kcvv.be",
          phone: null,
        },
      ].map((member, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
        >
          <div className="flex-1">
            <p className="text-kcvv-gray-blue text-sm font-semibold">
              {member.name}
            </p>
            <p className="text-kcvv-gray-dark text-xs">{member.role}</p>
          </div>
          <ContactQuickActions
            email={member.email}
            phone={member.phone || undefined}
            name={member.name}
            size="sm"
          />
        </div>
      ))}
    </div>
  ),
};

// ==================== MOBILE VIEWPORT ====================

export const MobileView: Story = {
  args: {
    email: "mobile@kcvvelewijt.be",
    phone: "+32 470 12 34 56",
    name: "Mobile User",
    size: "lg",
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

// ==================== INTERACTIVE STATES ====================

export const HoverState: Story = {
  args: {
    email: "hover@kcvvelewijt.be",
    phone: "+32 470 12 34 56",
    name: "Hover Example",
    size: "md",
  },
  parameters: {
    pseudo: { hover: true },
  },
};

// ==================== ACCESSIBILITY ====================

export const AccessibilityTest: Story = {
  args: {
    email: "accessible@kcvvelewijt.be",
    phone: "+32 470 12 34 56",
    name: "Accessible Contact",
    size: "md",
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "button-name", enabled: true },
          { id: "link-name", enabled: true },
          { id: "target-size", enabled: true },
        ],
      },
    },
  },
};

// ==================== EDGE CASES ====================

export const VeryLongEmail: Story = {
  args: {
    email: "very.long.email.address.for.testing.tooltips@kcvvelewijt.be",
    name: "Long Email",
    size: "md",
  },
};

export const MultiplePhoneFormats: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs text-gray-600">Standard: +32 470 12 34 56</p>
        <ContactQuickActions
          phone="+32 470 12 34 56"
          name="Standard Format"
          size="md"
        />
      </div>
      <div>
        <p className="mb-1 text-xs text-gray-600">Dashes: +32-470-12-34-56</p>
        <ContactQuickActions
          phone="+32-470-12-34-56"
          name="Dash Format"
          size="md"
        />
      </div>
      <div>
        <p className="mb-1 text-xs text-gray-600">No spaces: +32470123456</p>
        <ContactQuickActions phone="+32470123456" name="No Spaces" size="md" />
      </div>
      <div>
        <p className="mb-1 text-xs text-gray-600">
          Brackets: +32 (470) 12 34 56
        </p>
        <ContactQuickActions
          phone="+32 (470) 12 34 56"
          name="Brackets"
          size="md"
        />
      </div>
    </div>
  ),
};

// ==================== DARK BACKGROUND ====================

export const OnDarkBackground: Story = {
  args: {
    email: "dark@kcvvelewijt.be",
    phone: "+32 470 12 34 56",
    name: "Dark Background",
    size: "md",
  },
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-gray-900 p-8">
        <Story />
      </div>
    ),
  ],
};
