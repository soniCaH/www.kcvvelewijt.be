/**
 * <BioBlock> stories — Phase 6.A player bio surface.
 *
 * Lock matrix from `docs/design/mockups/phase-6-player-profile/bioblock-pullquote-locked.md`:
 *  - Full bio with TWO marked spans → inline highlights + first span lifted (`FullWithTwoMarks`)
 *  - Bio with ONE marked span → inline highlight + that span lifted (`OneMark`)
 *  - Bio with ZERO marks → paragraph collapses to single-column (`NoMarks`)
 *  - Empty bio → component returns `null` (`Empty`)
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { BioBlock } from "./BioBlock";

function block(
  key: string,
  ...spans: ReadonlyArray<{ text: string; marks?: string[] }>
): PortableTextBlock {
  return {
    _type: "block",
    _key: `block-${key}`,
    style: "normal",
    children: spans.map((span, i) => ({
      _type: "span",
      _key: `${key}-${i}`,
      text: span.text,
      marks: span.marks ?? [],
    })),
    markDefs: [],
  } as unknown as PortableTextBlock;
}

const BIO_TWO_MARKS: PortableTextBlock[] = [
  block(
    "p1",
    {
      text: "Maxim groeide op in Elewijt en kreeg de liefde voor het spel met de paplepel mee. ",
    },
    {
      text: "Vanaf zijn zesde stond hij elke zaterdag bij de jeugdploegen.",
      marks: ["pullquote"],
    },
    { text: " Op zijn zeventiende debuteerde hij in de eerste ploeg." },
  ),
  block(
    "p2",
    { text: "Op het veld is hij " },
    { text: "een meedogenloze tackler", marks: ["pullquote"] },
    {
      text: " en een uitstekende passgever — een combinatie die hem onmisbaar maakt in het middenveld.",
    },
  ),
];

const BIO_ONE_MARK: PortableTextBlock[] = [
  block(
    "p1",
    {
      text: "Joris kwam in 2018 over van een naburige ploeg en groeide snel uit tot vaste waarde in de verdediging. ",
    },
    {
      text: "Zijn linkervoet legt elke vrije trap waar hij hem hebben wil.",
      marks: ["pullquote"],
    },
  ),
  block("p2", {
    text: "In zijn vrije tijd coacht hij de U10 — een rol waar hij naar eigen zeggen evenveel uit haalt als uit de A-Ploeg.",
  }),
];

const BIO_NO_MARKS: PortableTextBlock[] = [
  block("p1", {
    text: "Ben staat sinds zijn elfde tussen de palen en heeft alle jeugdcategorieën doorlopen bij KCVV. Een rustige keeper met goeie spelhervattingen en een vaste hand in het penaltygebied.",
  }),
];

const meta = {
  title: "Features/Players/BioBlock",
  component: BioBlock,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase 6.A bio block for `/spelers/[slug]`. Consumes `player.bio` Portable Text via the article-body serializer pattern. The new `pullquote` PT decorator renders inline highlights AND lifts the FIRST marked substring into a right-column jersey-deep `<PullQuote>` card (6.d5 lock). Auto-hide when bio is empty.",
      },
    },
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof BioBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full bio with two `pullquote`-marked spans. Both render inline; the first is lifted. */
export const FullWithTwoMarks: Story = {
  args: {
    bio: BIO_TWO_MARKS,
    playerName: "Maxim Breugelmans",
  },
};

/** Bio with a single `pullquote` mark — same lifting rule, single highlight. */
export const OneMark: Story = {
  args: {
    bio: BIO_ONE_MARK,
    playerName: "Joris Vermeiren",
  },
};

/** Bio without any `pullquote` marks — paragraph collapses to single-column. */
export const NoMarks: Story = {
  args: {
    bio: BIO_NO_MARKS,
    playerName: "Ben Lievens",
  },
};

/**
 * Empty bio — component returns `null`. Rendered here so the story file
 * captures the auto-hide branch; the VR snapshot is intentionally blank.
 */
export const Empty: Story = {
  args: {
    bio: [],
    playerName: "Anoniem",
  },
};
