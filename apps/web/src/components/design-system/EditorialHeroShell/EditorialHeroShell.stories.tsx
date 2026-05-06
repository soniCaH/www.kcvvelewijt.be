import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorialHeroShell } from "./EditorialHeroShell";

const meta = {
  title: "UI/EditorialHeroShell",
  component: EditorialHeroShell,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialHeroShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const editorialPlaceholder = (
  <>
    <p className="text-ink-muted font-mono text-[10px] tracking-[0.18em] uppercase">
      KICKER · MONO · ROW
    </p>
    <h1 className="text-ink font-serif text-5xl leading-tight font-black">
      Headline column placeholder.
    </h1>
    <p className="text-ink-soft max-w-[52ch] font-serif text-xl italic">
      Editorial lead placeholder paragraph.
    </p>
  </>
);

const coverPlaceholder = (
  <div className="border-ink bg-cream flex aspect-video w-full items-center justify-center border-2">
    <span className="font-mono text-xs uppercase">Cover slot</span>
  </div>
);

export const Playground: Story = {
  args: {
    editorial: editorialPlaceholder,
    cover: coverPlaceholder,
  },
};

export const WithCover: Story = {
  args: {
    editorial: editorialPlaceholder,
    cover: coverPlaceholder,
  },
};

export const WithoutCover: Story = {
  args: { editorial: editorialPlaceholder },
};
