import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties, ReactNode } from "react";
import { TapeStrip } from "./TapeStrip";

const meta = {
  title: "UI/TapeStrip",
  component: TapeStrip,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof TapeStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Shared cream-soft panel decorator. Applied per-story rather than via
// meta.decorators so layout-heavy stories (SlotDrivenInset) and
// surface-swap stories (WarmOnJerseyDeep) can opt out without the wrapper
// bleeding through inter-slot gaps or the wrong background colour.
const panelDecorator = (Story: () => ReactNode) => (
  // Pin --tape-left so client-side navigation between stories (e.g. from
  // SlotDrivenInset which sets it inline) cannot leak a stale value into
  // subsequent story screenshots.
  <div
    style={
      {
        "--tape-left": "12%",
      } as CSSProperties
    }
    className="bg-cream-soft border-paper-edge relative h-40 w-64 border"
  >
    <Story />
  </div>
);

// Un-seeded, un-pinned tape is flat — an un-seeded tape has not said what it is.
export const Playground: Story = {
  args: { color: "jersey", length: "md" },
  decorators: [panelDecorator],
};

// The tape inset is placement, so it stays slot-driven: <TapedCardGrid> sets
// --tape-left per slot (4% / 7% / 10% / 12%). The angle is not the slot's.
export const SlotDrivenInset: Story = {
  render: () => {
    const lefts = ["4%", "7%", "10%", "12%"];
    return (
      <div className="flex flex-col gap-4">
        {lefts.map((left) => (
          <div
            key={left}
            style={{ "--tape-left": left } as CSSProperties}
            className="bg-cream-soft border-paper-edge relative h-20 w-64 border"
          >
            <TapeStrip seed={`inset ${left}`} />
            <span className="text-mono-sm absolute bottom-2 left-2 font-mono uppercase">
              left {left}
            </span>
          </div>
        ))}
      </div>
    );
  },
};

// The bigger tier of the site tilt scale (#3329): six pinned angles
// -6° / -4° / -2° / +2° / +4° / +6°, plus the explicit flat `none`.
export const BiggerTier: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["a", "b", "c", "d", "e", "f", "none"] as const).map((rotation) => (
        <div
          key={rotation}
          className="bg-cream-soft border-paper-edge relative h-16 w-64 border"
        >
          <TapeStrip rotation={rotation} />
          <span className="text-mono-sm absolute bottom-2 left-2 font-mono uppercase">
            {rotation}
          </span>
        </div>
      ))}
    </div>
  ),
};

// A seed derives the angle from the card's identity — same seed, same tape,
// on every page the card appears on.
export const SeededFromIdentity: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {["KCVV 1 wint thuis", "Jeugdkamp 2026", "Nieuwe sponsor"].map((seed) => (
        <div
          key={seed}
          className="bg-cream-soft border-paper-edge relative h-16 w-64 border"
        >
          <TapeStrip seed={seed} />
          <span className="text-mono-sm absolute bottom-2 left-2 font-mono uppercase">
            {seed}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const InkColor: Story = {
  args: { color: "ink" },
  decorators: [panelDecorator],
};
export const CreamColor: Story = {
  args: { color: "cream" },
  decorators: [panelDecorator],
};
export const LongLength: Story = {
  args: { length: "lg" },
  decorators: [panelDecorator],
};
export const ShortLength: Story = {
  args: { length: "sm" },
  decorators: [panelDecorator],
};

// Right-anchored tape — R10 (#1748). Used on the outer NewsCard frame
// for the top-right corner pairing the top-left strip.
export const PositionRight: Story = {
  args: { color: "jersey", length: "md", position: "right" },
  decorators: [panelDecorator],
};

// Both strips composed on a single panel — exactly the NewsCard pairing:
// warm tape at TL + jersey tape at TR, leaning in opposite directions.
// Demonstrates that the two position anchors read independent CSS variables.
export const CornerPair: Story = {
  render: () => (
    <div
      style={
        {
          "--tape-left": "8%",
          "--tape-right": "8%",
        } as CSSProperties
      }
      className="bg-cream-soft border-paper-edge relative h-40 w-72 border"
    >
      <TapeStrip color="warm" length="md" position="left" rotation="b" />
      <TapeStrip color="jersey" length="md" position="right" rotation="e" />
    </div>
  ),
};

// The two angles the <EventFactInline> polaroid pins (#1853, folded into the
// bigger tier by #3329): -4° top-left, +4° bottom-right.

// Top-left -4° (`b`) — warm ochre, sm length. verticalEdge defaults to "top".
export const TopLeftMinusFour: Story = {
  args: {
    color: "warm",
    length: "sm",
    position: "left",
    rotation: "b",
  },
  decorators: [panelDecorator],
};

// Bottom-right +4° (`e`) — warm ochre, sm length, anchored to the bottom
// edge. Exercises the verticalEdge="bottom" code path.
export const BottomRightPlusFour: Story = {
  args: {
    color: "warm",
    length: "sm",
    position: "right",
    verticalEdge: "bottom",
    rotation: "e",
  },
  decorators: [panelDecorator],
};

// All four position × verticalEdge corners on a single panel. Mixed
// rotations span the bigger tier (a/b/d/e) so a single screenshot covers the
// full matrix of the extended API.
export const AllFourCornersMixed: Story = {
  render: () => (
    <div
      style={
        {
          "--tape-left": "8%",
          "--tape-right": "8%",
        } as CSSProperties
      }
      className="bg-cream-soft border-paper-edge relative h-48 w-72 border"
    >
      <TapeStrip
        color="jersey"
        length="md"
        position="left"
        verticalEdge="top"
        rotation="a"
      />
      <TapeStrip
        color="warm"
        length="md"
        position="right"
        verticalEdge="top"
        rotation="b"
      />
      <TapeStrip
        color="ink"
        length="md"
        position="left"
        verticalEdge="bottom"
        rotation="d"
      />
      <TapeStrip
        color="cream"
        length="md"
        position="right"
        verticalEdge="bottom"
        rotation="e"
      />
    </div>
  ),
};

// Warm-yellow tape on a jersey-deep panel — the contrast pairing this
// variant exists for. <FeaturedEventBand> (#1677) is the first consumer.
// The `bg-jersey-deep` + `border-jersey-deep-dark` utilities double as the
// smoke test that the new tokens (#1697) reach Tailwind via `@theme` —
// if either utility doesn't generate, the panel renders unstyled.
export const WarmOnJerseyDeep: Story = {
  args: { color: "warm", length: "lg" },
  decorators: [
    (Story) => (
      <div
        style={
          {
            "--tape-left": "12%",
          } as CSSProperties
        }
        className="bg-jersey-deep border-jersey-deep-dark relative h-40 w-64 border"
      >
        <Story />
      </div>
    ),
  ],
};
