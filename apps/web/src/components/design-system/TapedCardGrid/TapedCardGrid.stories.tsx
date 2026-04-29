import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TapedCard } from "../TapedCard";
import { TapedCardGrid } from "./TapedCardGrid";

const meta = {
  title: "UI/TapedCardGrid",
  component: TapedCardGrid,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TapedCardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const card = (label: string) => (
  <TapedCard rotation="auto" padding="md">
    <p className="font-mono text-[11px] tracking-[0.08em] uppercase">{label}</p>
    <h3 className="text-display-sm mt-1">Het rooster.</h3>
    <p className="text-body-sm mt-2 leading-relaxed">
      Een korte samenvatting van wat eraan komt — speeldata, locaties en wie er
      thuis speelt.
    </p>
  </TapedCard>
);

export const Playground: Story = {
  args: {
    columns: 3,
    gap: "md",
    children: [
      card("Slot 1"),
      card("Slot 2"),
      card("Slot 3"),
      card("Slot 4"),
      card("Slot 5"),
      card("Slot 6"),
    ],
  },
};

export const Columns1: Story = {
  args: { columns: 1, children: [card("A"), card("B"), card("C")] },
};

export const Columns2: Story = {
  args: { columns: 2, children: [card("A"), card("B"), card("C"), card("D")] },
};

export const Columns3: Story = {
  args: {
    columns: 3,
    children: [
      card("A"),
      card("B"),
      card("C"),
      card("D"),
      card("E"),
      card("F"),
    ],
  },
};

export const Columns4: Story = {
  args: {
    columns: 4,
    children: [
      card("A"),
      card("B"),
      card("C"),
      card("D"),
      card("E"),
      card("F"),
      card("G"),
      card("H"),
    ],
  },
};

export const MixedRotations: Story = {
  args: {
    columns: 3,
    children: [
      <TapedCard key="auto-1" rotation="auto" padding="md">
        <p className="font-mono text-[11px]">rotation = auto (slot 0)</p>
      </TapedCard>,
      <TapedCard key="none" rotation="none" padding="md">
        <p className="font-mono text-[11px]">rotation = none (forced flat)</p>
      </TapedCard>,
      <TapedCard key="auto-2" rotation="auto" padding="md">
        <p className="font-mono text-[11px]">rotation = auto (slot 2)</p>
      </TapedCard>,
    ],
  },
};

export const EmptyWithFallback: Story = {
  args: {
    columns: 3,
    children: [],
    emptyState: (
      <p className="text-mono-md font-mono tracking-[0.08em] uppercase opacity-60">
        Geen items.
      </p>
    ),
  },
};

export const EmptyWithoutFallback: Story = {
  // 0×0 capture is meaningless to baseline — vr-skip the story.
  // The empty/no-fallback path is fully covered by unit tests.
  tags: ["vr-skip"],
  args: { columns: 3, children: [] },
};

export const WithLargeTapesOnCorners: Story = {
  args: {
    columns: 3,
    children: [],
  },
  render: () => {
    // Tape only attaches at top edges — bottom tapes overlap the offset
    // shadow region, which reads as un-physical.
    const corners = ["tl", "tr", "tl", "tr", "tl", "tr"] as const;
    return (
      <TapedCardGrid columns={3}>
        {corners.map((corner, i) => (
          <TapedCard
            key={i}
            rotation="auto"
            padding="md"
            tape={{ position: corner, color: "jersey", length: "lg" }}
          >
            <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
              tape · {corner}
            </p>
            <h3 className="text-display-sm mt-1">Het rooster.</h3>
            <p className="text-body-sm mt-2 leading-relaxed">
              Een korte samenvatting van wat eraan komt — speeldata, locaties en
              wie er thuis speelt.
            </p>
          </TapedCard>
        ))}
      </TapedCardGrid>
    );
  },
};

export const OrderedList: Story = {
  args: {
    as: "ol",
    columns: 2,
    children: [
      <TapedCard key="a" rotation="auto" padding="md" as="div">
        <p className="font-mono text-[11px]">Stap 1</p>
      </TapedCard>,
      <TapedCard key="b" rotation="auto" padding="md" as="div">
        <p className="font-mono text-[11px]">Stap 2</p>
      </TapedCard>,
      <TapedCard key="c" rotation="auto" padding="md" as="div">
        <p className="font-mono text-[11px]">Stap 3</p>
      </TapedCard>,
    ],
  },
};
