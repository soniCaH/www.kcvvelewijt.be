import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArticleCtaBand } from "./ArticleCtaBand";

const meta = {
  title: "Features/Articles/ArticleCtaBand",
  component: ArticleCtaBand,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The optional, editor-filled call-to-action closing an article (`article.callToAction`, #2525). Reuses the shared `<CtaBand>` — no new look — and renders nothing when the field is empty or incomplete.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArticleCtaBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    question: "Kom eens gratis meetrainen?",
    emphasis: "gratis meetrainen",
    lead: "Elke dinsdag en donderdag, iedereen welkom — geen verplichtingen.",
    buttonLabel: "Schrijf je in",
    href: "https://forms.gle/LXxf2Sd25rvpM14FA",
  },
};
