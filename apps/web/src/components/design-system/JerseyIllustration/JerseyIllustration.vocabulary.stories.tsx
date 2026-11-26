/**
 * Coverage for the per-player garment vocabulary (#2635) — four shirt
 * patterns × two sleeve lengths, none of which had a story or a VR
 * baseline before this (code review finding #6). Separate meta from
 * `JerseyIllustration.stories.tsx` because that file's decorator frames a
 * single figure at card size; this one needs room for a grid.
 *
 * Seeds below were found by brute-force search over synthetic ids
 * (`vocab-0`, `vocab-1`, …) for the first id producing each
 * (pattern, sleeve) combination — not real player names, since the whole
 * point is covering the vocabulary deterministically.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { JerseyIllustration } from "./JerseyIllustration";

const VOCABULARY: { label: string; seed: string }[] = [
  { label: "bands · short sleeve", seed: "vocab-8" },
  { label: "bands · long sleeve", seed: "vocab-19" },
  { label: "hoops · short sleeve", seed: "vocab-3" },
  { label: "hoops · long sleeve", seed: "vocab-0" },
  { label: "dots · short sleeve", seed: "vocab-2" },
  { label: "dots · long sleeve", seed: "vocab-1" },
  { label: "plain · short sleeve", seed: "vocab-9" },
  { label: "plain · long sleeve", seed: "vocab-22" },
];

const VocabularyGrid = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {VOCABULARY.map(({ label, seed }) => (
        <div key={seed} className="flex flex-col gap-1">
          <div className="border-paper-edge relative aspect-[3/4] w-full overflow-hidden border">
            <JerseyIllustration variant="card" seed={seed} />
          </div>
          <p className="text-ink-muted font-mono text-[9px] uppercase">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
};

const meta = {
  title: "UI/JerseyIllustration/Vocabulary",
  component: VocabularyGrid,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof VocabularyGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All four shirt patterns crossed with both sleeve lengths — the garment vocabulary in full. */
export const GarmentVocabulary: Story = {};
