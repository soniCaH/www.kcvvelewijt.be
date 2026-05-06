import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { portraitSvgDataUri } from "../_fixtures";
import { SubjectsStrip, type Subject } from "./SubjectsStrip";

const meta = {
  title: "Article/SubjectsStrip",
  component: SubjectsStrip,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft px-12 py-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SubjectsStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

const PORTRAIT_PLACEHOLDER = (label: string, hue: string) =>
  portraitSvgDataUri({ label, bg: `#${hue}`, fg: "#ffffff" });

const PLAYER: Subject = {
  _key: "p1",
  kind: "player",
  firstName: "Maxim",
  lastName: "Breugelmans",
  jerseyNumber: 8,
  position: "Middenvelder",
  psdImageUrl: PORTRAIT_PLACEHOLDER("Maxim", "008755"),
};

const STAFF: Subject = {
  _key: "s1",
  kind: "staff",
  firstName: "Lien",
  lastName: "De Smet",
  functionTitle: "Hoofdcoach U17",
  photoUrl: PORTRAIT_PLACEHOLDER("Lien", "1f3a8a"),
};

const CUSTOM: Subject = {
  _key: "c1",
  kind: "custom",
  customName: "Bram Vermeulen",
  customRole: "Voorzitter",
  customPhotoUrl: PORTRAIT_PLACEHOLDER("Bram", "9a3412"),
};

const PLAYER_TWO: Subject = {
  _key: "p2",
  kind: "player",
  firstName: "Jan",
  lastName: "Janssens",
  jerseyNumber: 11,
  position: "Aanvaller",
  psdImageUrl: PORTRAIT_PLACEHOLDER("Jan", "b91c1c"),
};

const PLAYER_THREE: Subject = {
  _key: "p3",
  kind: "player",
  firstName: "Tom",
  lastName: "Peeters",
  jerseyNumber: 4,
  position: "Verdediger",
  psdImageUrl: PORTRAIT_PLACEHOLDER("Tom", "065f46"),
};

const QUOTE = {
  text: "KCVV ademt voetbal. Hier kan ik tonen wat ik in mij heb.",
  attribution: "Maxim Breugelmans · Middenvelder",
};

/** N=1 desktop — single polaroid + pull-quote. */
export const N1WithQuote: Story = {
  args: {
    subjects: [PLAYER],
    quote: QUOTE,
  },
};

/** N=1 desktop — quote slot suppressed when no key/quote-tagged qaPair exists. */
export const N1WithoutQuote: Story = {
  args: {
    subjects: [PLAYER],
  },
};

/** N=2 — duo polaroids with italic display "&" between. */
export const N2Duo: Story = {
  args: {
    subjects: [PLAYER, STAFF],
  },
};

/** N=3 — three polaroids inline, no separator. */
export const N3Trio: Story = {
  args: {
    subjects: [PLAYER, STAFF, CUSTOM],
  },
};

/** N=4 — 2×2 grid. */
export const N4Panel: Story = {
  args: {
    subjects: [PLAYER, STAFF, CUSTOM, PLAYER_TWO],
  },
};

/**
 * Mobile compact list (N≥3) — paper card with `★ Subjects` heading,
 * mono-caps rows, no polaroids. Forced via `orientation="vertical"`.
 */
export const MobileCompactList: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto w-[380px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    orientation: "vertical",
    subjects: [PLAYER, STAFF, CUSTOM, PLAYER_TWO, PLAYER_THREE],
  },
};

/** Mixed kinds — confirms uniform polaroid treatment across player/staff/custom. */
export const MixedKinds: Story = {
  args: {
    subjects: [PLAYER, STAFF, CUSTOM],
  },
};
