/**
 * <QuotesBlock> stories — Phase 6.A player-profile quote interlude.
 *
 * Lock matrix from `docs/design/mockups/phase-6-player-profile/quotesblock-locked.md`:
 *  - Bio with 2+ marked spans → renders the SECOND span as an ink card
 *    (`TwoMarks`, `ThreeMarksIgnoresThird`)
 *  - Bio with 1 marked span → auto-hides (`OneMarkHidden`)
 *  - Bio with no marks → auto-hides (`NoMarksHidden`)
 *  - Empty bio → component returns `null` (`Empty`)
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { QuotesBlock } from "./QuotesBlock";

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
    {
      text: "een meedogenloze tackler die elk duel wint en de opbouw vanuit het midden draagt.",
      marks: ["pullquote"],
    },
    { text: " Een combinatie die hem onmisbaar maakt in het middenveld." },
  ),
];

const BIO_THREE_MARKS: PortableTextBlock[] = [
  block(
    "p1",
    {
      text: "Joris debuteerde in 2018 en groeide snel uit tot vaste waarde in de verdediging. ",
    },
    {
      text: "Zijn linkervoet legt elke vrije trap waar hij hem hebben wil.",
      marks: ["pullquote"],
    },
  ),
  block(
    "p2",
    { text: "Daarnaast coacht hij " },
    {
      text: "de U10 — een rol die hij elke woensdag met evenveel plezier opneemt als de wedstrijd in het weekend.",
      marks: ["pullquote"],
    },
    { text: " In de kleedkamer is hij de stille kracht." },
  ),
  block(
    "p3",
    { text: "Buiten het veld werkt hij als " },
    { text: "elektricien in Mechelen.", marks: ["pullquote"] },
  ),
];

const BIO_ONE_MARK: PortableTextBlock[] = [
  block(
    "p1",
    { text: "Joris kwam in 2018 over van een naburige ploeg. " },
    {
      text: "Zijn linkervoet legt elke vrije trap waar hij hem hebben wil.",
      marks: ["pullquote"],
    },
  ),
];

const BIO_NO_MARKS: PortableTextBlock[] = [
  block("p1", {
    text: "Ben staat sinds zijn elfde tussen de palen en heeft alle jeugdcategorieën doorlopen bij KCVV.",
  }),
];

const meta = {
  title: "Features/Players/QuotesBlock",
  component: QuotesBlock,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Phase 6.A quote interlude for `/spelers/[slug]`. Renders the SECOND `pullquote`-marked run in `player.bio` as a single full-width `<PullQuote tone="ink">` card — the home for the parked 6.d4 dark-band aesthetic. Auto-hides when fewer than 2 marked runs exist (BioBlock owns span #0).',
      },
    },
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof QuotesBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two marked spans — renders the second as an ink card. */
export const TwoMarks: Story = {
  args: {
    bio: BIO_TWO_MARKS,
    playerName: "Maxim Breugelmans",
  },
};

/** Three marked spans — the second wins; span #3 is ignored. */
export const ThreeMarksIgnoresThird: Story = {
  args: {
    bio: BIO_THREE_MARKS,
    playerName: "Joris Vermeiren",
  },
};

/**
 * One marked span — component auto-hides. BioBlock still renders span #0.
 * Story file documents the hidden branch; the VR snapshot is intentionally blank.
 */
export const OneMarkHidden: Story = {
  args: {
    bio: BIO_ONE_MARK,
    playerName: "Joris Vermeiren",
  },
};

/** Zero marked spans — component auto-hides. */
export const NoMarksHidden: Story = {
  args: {
    bio: BIO_NO_MARKS,
    playerName: "Ben Lievens",
  },
};

/** Empty bio — component returns `null`. */
export const Empty: Story = {
  args: {
    bio: [],
    playerName: "Anoniem",
  },
};
