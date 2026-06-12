import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ContactCard } from "./ContactCard";

const meta = {
  title: "Features/Hulp/ContactCard",
  component: ContactCard,
  parameters: { layout: "centered" },
  args: { onContactClick: fn(), onShowInStructure: fn() },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[420px] p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof ContactCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Position contact — real person, ✉/☎, and the "Toon in structuur →" cross-link. */
export const PositionWithStructuurLink: Story = {
  args: {
    contact: {
      name: "Luc Boons",
      role: "Gerechtigd correspondent",
      email: "gc@kcvvelewijt.be",
      phone: "0470 12 34 56",
      nodeId: "node-gc",
      organigramHref: "/hulp?member=node-gc#structuur",
    },
  },
};

/** Manual contact — name == role, e-mail only (no phone, no cross-link). */
export const ManualEmailOnly: Story = {
  args: {
    contact: {
      name: "Secretariaat",
      role: "Secretariaat",
      email: "info@kcvvelewijt.be",
    },
  },
};

/** Team-role contact — generic label + a plain "Vind je ploeg →" link. */
export const TeamRole: Story = {
  args: {
    contact: {
      name: "Trainer van jouw ploeg",
      role: "Trainer van jouw ploeg",
      organigramHref: "/ploegen",
    },
  },
};
