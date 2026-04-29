import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TapedCard } from "./TapedCard";

const meta = {
  title: "UI/TapedCard",
  component: TapedCard,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge inline-block border p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TapedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sample = (
  <div className="font-display max-w-[280px]">
    <p className="text-mono-sm font-mono tracking-[0.08em] uppercase opacity-70">
      Editie · 1909
    </p>
    <h3 className="text-display-sm mt-1">Het rooster.</h3>
    <p className="text-body-sm mt-2 leading-relaxed">
      Een korte samenvatting van wat eraan komt — speeldata, locaties en wie er
      thuis speelt.
    </p>
  </div>
);

export const Playground: Story = {
  args: {
    rotation: "none",
    shadow: "md",
    bg: "cream",
    padding: "md",
    interactive: false,
    children: sample,
  },
};

export const RotationVariants: Story = {
  args: { children: sample },
  render: () => (
    <div className="grid grid-cols-3 items-start gap-10">
      {(["a", "b", "c", "d", "none", "auto"] as const).map((r) => (
        <div
          key={r}
          style={{ "--taped-card-rotation": "-1.25deg" } as React.CSSProperties}
        >
          <TapedCard rotation={r}>
            <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
              rotation = {r}
            </p>
          </TapedCard>
        </div>
      ))}
    </div>
  ),
};

export const ShadowVariants: Story = {
  args: { children: sample },
  render: () => (
    <div className="grid grid-cols-3 items-start gap-10">
      {(["sm", "md", "lift"] as const).map((s) => (
        <TapedCard key={s} shadow={s} rotation="b">
          <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
            shadow = {s}
          </p>
        </TapedCard>
      ))}
    </div>
  ),
};

export const BgVariants: Story = {
  args: { children: sample },
  render: () => (
    <div className="grid grid-cols-2 items-start gap-10">
      {(["cream", "cream-soft", "ink", "jersey"] as const).map((b) => (
        <TapedCard key={b} bg={b} rotation="b" padding="md">
          <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
            bg = {b}
          </p>
        </TapedCard>
      ))}
    </div>
  ),
};

export const WithTape: Story = {
  args: { children: sample },
  render: () => (
    <div className="grid grid-cols-2 items-start gap-10">
      <TapedCard
        rotation="a"
        tape={{ position: "tl", color: "jersey", length: "md" }}
      >
        <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
          single tl tape
        </p>
      </TapedCard>
      <TapedCard
        rotation="c"
        tape={[
          { position: "tl", color: "jersey", length: "md" },
          { position: "tr", color: "ink", length: "sm" },
          { position: "bl", color: "cream", length: "sm" },
          { position: "br", color: "jersey", length: "lg" },
        ]}
      >
        <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
          all four corners
        </p>
      </TapedCard>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    rotation: "b",
    interactive: true,
    children: (
      <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
        hover me
      </p>
    ),
  },
};

export const PaddingMatrix: Story = {
  args: { children: sample },
  render: () => (
    <div className="grid grid-cols-2 items-start gap-10">
      {(["sm", "md", "lg", "none"] as const).map((p) => (
        <TapedCard key={p} padding={p} rotation="none">
          <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
            padding = {p}
          </p>
        </TapedCard>
      ))}
    </div>
  ),
};

export const NumericRotation: Story = {
  args: {
    rotation: 4,
    children: (
      <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
        rotation = 4 (numeric)
      </p>
    ),
  },
};
