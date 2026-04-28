import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { InterviewTemplate } from "./InterviewTemplate";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";

const block = (text: string, key: string): PortableTextBlock => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
});

const answer = (text: string, key: string) => [block(text, key)];

const MAXIM: IndexedSubject = {
  _key: "maxim-k",
  kind: "player",
  playerRef: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    jerseyNumber: 9,
    position: "Middenvelder",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&q=80",
  },
};

const JEROEN: IndexedSubject = {
  _key: "jeroen-k",
  kind: "player",
  playerRef: {
    firstName: "Jeroen",
    lastName: "Van den Berghe",
    jerseyNumber: 5,
    position: "Verdediger",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&q=80",
  },
};

const THOMAS: IndexedSubject = {
  _key: "thomas-k",
  kind: "player",
  playerRef: {
    firstName: "Thomas",
    lastName: "Peeters",
    jerseyNumber: 11,
    position: "Aanvaller",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1605235186583-a65c4f4d1c3a?w=600&q=80",
  },
};

const LUC: IndexedSubject = {
  _key: "luc-k",
  kind: "player",
  playerRef: {
    firstName: "Luc",
    lastName: "Janssens",
    jerseyNumber: 3,
    position: "Keeper",
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80",
  },
};

const meta = {
  title: "Pages/Article/Interview",
  component: InterviewTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full interview page composition — InterviewHero (kicker + subtitle + 4:5 portrait), §7.6 metadata bar, and a 6-pair qaBlock mixing every tag variant with a player subject.",
      },
    },
  },
  // vr-skip: full-page Storybook composition exhausts the browser memory
  // budget in the pinned Playwright Docker image (page.goto crashes during
  // setupPage). Page-level visual coverage moves to Playwright e2e per
  // docs/prd/page-level-testing-rework.md.
  tags: ["autodocs", "vr-skip"],
} satisfies Meta<typeof InterviewTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullComposition: Story = {
  args: {
    title:
      "Drive, passie, doorzettingsvermogen — vijf seizoenen Maxim Breugelmans",
    coverImageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80",
    publishedDate: "19.04.2026",
    readingTime: "6 min lezen",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/phase-3-tracer",
      title: "Maxim Breugelmans interview",
    },
    subjects: [MAXIM],
    body: [
      {
        _type: "block",
        _key: "intro",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "intro-s",
            marks: [],
            text: "Na vijf seizoenen neemt Maxim Breugelmans afscheid van Elewijt. Een gesprek over herinneringen, gewoontes en de Plezante Compagnie.",
          },
        ],
      },
      {
        _key: "qa",
        _type: "qaBlock",
        pairs: [
          {
            _key: "p1",
            tag: "standard",
            question: "Wat is je eerste herinnering aan KCVV?",
            answer: answer(
              "Als U9 spelen op het A-terrein, met mijn grote broer in de dug-out.",
              "p1-a",
            ),
          },
          {
            _key: "p2",
            tag: "standard",
            question: "En welk advies van een coach kleefde het best?",
            answer: answer(
              "Van de Presi: “Er moet gewonnen worden.” Geen discussie mogelijk.",
              "p2-a",
            ),
          },
          {
            _key: "p3",
            tag: "key",
            question: "Je moment van de voorbije vijf jaar",
            answer: answer(
              "Eindrondewinst tegen Kraainem. Thuis 3-0, met een waanzinnig promotiefeest.",
              "p3-a",
            ),
          },
          {
            _key: "p4",
            tag: "rapid-fire",
            question: "Koffie of thee?",
            answer: answer("Koffie. Zwart.", "p4-a"),
          },
          {
            _key: "p5",
            tag: "rapid-fire",
            question: "Regen of sneeuw?",
            answer: answer("Regen. Sneeuw verpest de bal.", "p5-a"),
          },
          {
            _key: "p6",
            tag: "quote",
            question: "(hidden for quote)",
            answer: answer(
              "Een club is maar zo sterk als haar supporters — en Elewijt is een beresterke club.",
              "p6-a",
            ),
          },
        ],
      },
    ] as unknown as PortableTextBlock[],
  },
};

export const WithoutCoverImage: Story = {
  args: {
    ...FullComposition.args,
    coverImageUrl: null,
  },
};

export const WithoutSubject: Story = {
  args: {
    ...FullComposition.args,
    subjects: null,
  },
};

// Rename the N=1 baseline to match #1358 naming. FullComposition stays as
// the legacy story name; the `Single` export below is the canonical
// anchor for the new N=1/2/3/4 variants.

export const Single: Story = {
  name: "Single / N=1 baseline",
  args: {
    ...FullComposition.args,
  },
};

/** Safe accessor for story fixture `_key` values — the `_key` field is
 *  optional on the shared `IndexedSubject` type but always set on story
 *  fixtures. Using a fallback string keeps the call sites free of `!`
 *  non-null assertions that could theoretically explode at module load. */
const keyOf = (s: IndexedSubject, fallback: string): string =>
  s._key ?? fallback;

/**
 * Clone the FullComposition body and override every `key`/`quote` pair
 * with a respondentKey rotated across `respondentKeys`. Extends the
 * qaBlock with extra synthetic `key` pairs so every supplied subject
 * appears at least once even when the base body has fewer attributed
 * pairs than subjects (trio + panel).
 */
function bodyWithRotatedRespondents(
  respondentKeys: string[],
): PortableTextBlock[] {
  const base = FullComposition.args?.body as PortableTextBlock[] | undefined;
  if (!Array.isArray(base)) return [];
  return base.map((block) => {
    if ((block as { _type?: string })._type !== "qaBlock") return block;
    const qaBlock = block as unknown as {
      _key: string;
      _type: "qaBlock";
      pairs: Array<Record<string, unknown>>;
    };
    let rotationIdx = 0;
    const pairs = qaBlock.pairs.map((pair) => {
      const tag = pair.tag as string | undefined;
      if (tag !== "key" && tag !== "quote") return pair;
      const respondentKey = respondentKeys[rotationIdx % respondentKeys.length];
      rotationIdx += 1;
      return { ...pair, respondentKey };
    });

    // Ensure every subject shows up at least once. If the base body's
    // key/quote count is fewer than respondentKeys.length, append
    // synthetic `key` pairs for the uncovered subjects — enough to prove
    // the per-pair attribution swap visually in trio/panel stories.
    for (let i = rotationIdx; i < respondentKeys.length; i += 1) {
      pairs.push({
        _key: `panel-extra-${i}`,
        _type: "qaPair",
        tag: "key",
        question: "Een extra key-treatment",
        answer: answer(
          "Extra pair toegevoegd door de story om alle panel-leden te tonen.",
          `panel-extra-${i}-a`,
        ),
        respondentKey: respondentKeys[i],
      });
    }

    return { ...qaBlock, pairs } as unknown as PortableTextBlock;
  });
}

export const Duo: Story = {
  name: "Duo / N=2",
  args: {
    ...FullComposition.args,
    title: "Afscheid duo: Maxim en Jeroen sluiten vijf seizoenen af.",
    subjects: [MAXIM, JEROEN],
    body: bodyWithRotatedRespondents([
      keyOf(MAXIM, "maxim-k"),
      keyOf(JEROEN, "jeroen-k"),
    ]),
  },
};

export const Trio: Story = {
  name: "Trio / N=3 panel",
  args: {
    ...FullComposition.args,
    title: "Drie generaties, één shirt.",
    subjects: [MAXIM, JEROEN, THOMAS],
    body: bodyWithRotatedRespondents([
      keyOf(MAXIM, "maxim-k"),
      keyOf(JEROEN, "jeroen-k"),
      keyOf(THOMAS, "thomas-k"),
    ]),
  },
};

export const Panel: Story = {
  name: "Panel / N=4 max cap",
  args: {
    ...FullComposition.args,
    title: "Vier generaties over hetzelfde shirt.",
    subjects: [MAXIM, JEROEN, THOMAS, LUC],
    body: bodyWithRotatedRespondents([
      keyOf(MAXIM, "maxim-k"),
      keyOf(JEROEN, "jeroen-k"),
      keyOf(THOMAS, "thomas-k"),
      keyOf(LUC, "luc-k"),
    ]),
  },
};
