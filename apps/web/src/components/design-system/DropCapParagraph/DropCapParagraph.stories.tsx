import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DropCapParagraph } from "./DropCapParagraph";

const meta = {
  title: "UI/DropCapParagraph",
  component: DropCapParagraph,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge max-w-prose border p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DropCapParagraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    tone: "jersey",
    children:
      "Acht keer Elewijt — niet omdat hij telkens iets nieuws moest leren, maar omdat hij er telkens weer naartoe gewild heeft.",
  },
};

export const Default: Story = {
  args: {
    children:
      "Acht keer Elewijt — niet omdat hij telkens iets nieuws moest leren, maar omdat hij er telkens weer naartoe gewild heeft. Maxim Breugelmans speelde door alle leeftijdscategorieën van onze kern, en doet dat dit jaar ook nog eens met de armband.",
  },
};

export const ToneInk: Story = {
  args: {
    tone: "ink",
    children:
      "Een gedeeld pintje na de match. Een tribune die zingt. Een ouder die langs de zijlijn naar zijn kind kijkt. Dat zijn de momenten waarvoor we 's zondags terugkomen.",
  },
};

export const LongParagraph: Story = {
  args: {
    children:
      "Het clubgevoel zit in de kleinste dingen — een kop koffie na de match, een gedeeld pintje, een ouder die zijn kind langs de zijlijn ziet groeien. Dat verkoop je niet, dat bouw je generatie na generatie. En dat is precies waarom Elewijt niet de grootste hoeft te zijn om de plezantste te zijn.",
  },
};

export const WithDiacritic: Story = {
  // Verifies precomposed diacritics survive charAt(0). Combining-mark
  // edge cases would require Unicode-aware splitting — deferred per PRD §11.3.
  args: {
    children:
      "Échec, victoire, doelpunt — alles wat we beleven gebeurt in dezelfde kleedkamer.",
  },
};
