import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { QuestionCard } from "./QuestionCard";
import type { ResponsibilityPath } from "@/types/responsibility";

const medical: ResponsibilityPath = {
  id: "blessure",
  category: "medisch",
  role: ["ouder", "speler"],
  question: "Mijn kind is geblesseerd tijdens de match — wat nu?",
  keywords: ["blessure"],
  summary:
    "Eerste zorg gaat altijd voor. Daarna helpt de gerechtigd correspondent je met de ongevalsaangifte zodat de verzekering tussenkomt.",
  steps: [
    { description: "Zorg voor eerste hulp; roep een verzorger of trainer." },
    { description: "Vraag binnen 48u het aangifteformulier bij de GC." },
  ],
  primaryContact: {
    contactType: "position",
    position: "Gerechtigd correspondent",
    nodeId: "node-gc",
    members: [
      {
        id: "m-gc",
        name: "Luc Boons",
        email: "gc@kcvvelewijt.be",
        phone: "0470 12 34 56",
      },
    ],
  },
};

const admin: ResponsibilityPath = {
  id: "inschrijven",
  category: "administratief",
  role: ["ouder", "niet-lid"],
  question: "Hoe schrijf ik mijn kind in?",
  keywords: ["inschrijven"],
  summary: "Inschrijven kan het hele seizoen door.",
  steps: [
    { description: "Mail of bel de jeugdsecretaris." },
    { description: "Vul het inschrijvingsformulier in.", link: "/inschrijven" },
    { description: "Betaal het lidgeld." },
  ],
  primaryContact: {
    contactType: "manual",
    role: "Jeugdsecretaris",
    email: "jeugd@kcvvelewijt.be",
  },
};

const meta = {
  title: "Features/Hulp/QuestionCard",
  component: QuestionCard,
  parameters: { layout: "padded" },
  args: {
    onToggle: fn(),
    onContactClick: fn(),
    onStepLinkClick: fn(),
    onShowInStructure: fn(),
  },
  decorators: [
    (Story) => (
      <div className="bg-cream max-w-[640px] p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof QuestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed — the default browse state (admin glyph, ink). */
export const Closed: Story = {
  args: { path: admin, open: false },
};

/** Open — summary · numbered steps · person-vocab contact. */
export const Open: Story = {
  args: { path: admin, open: true },
};

/** Medical open — the brick glyph accent (7o6c · 1) + position contact with the
 *  "Toon in structuur →" cross-link. */
export const MedicalOpen: Story = {
  args: { path: medical, open: true },
};
