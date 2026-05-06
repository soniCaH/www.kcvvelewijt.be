import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorialLead } from "./EditorialLead";

const meta = {
  title: "UI/EditorialLead",
  component: EditorialLead,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialLead>;

export default meta;
type Story = StoryObj<typeof meta>;

const SHORT =
  "Linkse spits met een neus voor de tweede paal. Dertiende seizoen in groen-wit.";

const LONG =
  "Een uitgebreide editorial lead die rustig de toon zet voor het artikel. " +
  "De lead vat de essentie samen, lokt door, maar verraadt niet alles. " +
  "Bij KCVV-stijl ligt de nadruk op rust en helderheid — nooit clickbait.";

export const Playground: Story = {
  args: { children: SHORT },
};

export const Short: Story = {
  args: { children: SHORT },
};

export const TwoLines: Story = {
  args: { children: LONG },
};
