import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BodyQuote } from "./BodyQuote";

const meta = {
  title: "UI/BodyQuote",
  component: BodyQuote,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-3xl p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BodyQuote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children:
      "Wie wil komen afscheid nemen, kan dat op zaterdag 7 juni in het clubhuis.",
  },
};

export const Short: Story = {
  args: { children: "Compagnie." },
};

export const Multiline: Story = {
  args: {
    children:
      "Het was niet de mooiste of moeilijkste save uit mijn carrière — maar wel een save die ik nooit zal vergeten.",
  },
};

export const InProseFlow: Story = {
  args: { children: "" },
  render: () => (
    <div className="font-body text-ink mx-auto max-w-[40rem] text-base">
      <p>
        Op een rustige dinsdagavond in het clubhuis vraagt iemand om koffie. Het
        kopje van Maxim staat al op tafel. Tijd voor één vraag — de
        belangrijkste.
      </p>
      <BodyQuote>
        Hier kan ik tonen wat ik in mij heb. KCVV ademt voetbal — dat zegt me
        alles.
      </BodyQuote>
      <p>
        Het antwoord zit in zijn opvoeding: rust onder druk, en geen omwegen.
      </p>
    </div>
  ),
};
