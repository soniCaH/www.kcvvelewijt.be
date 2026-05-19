import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { fixtureImage } from "@test-fixtures/images";
import { ArticleBody } from "./ArticleBody";
import { VerderLezenRow } from "@/components/article/VerderLezenRow";

const meta = {
  title: "Article/ArticleBody",
  component: ArticleBody,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Shared article-body shell for every articleType. Renders the Sanity Portable Text body at `--container-prose` (680px) on a cream surface, wraps the first normal paragraph in `<DropCapParagraph tone="ink">`, renders inline `accent` marks as italic jersey-deep, and styles `h2` body headings per the 5.d3 section-break lock. Variant-specific blocks (PullQuote, EndMark, qaBlock, transferFact, eventFact, etc.) wire in subsequent Phase 5 sub-issues — Portable Text silently skips them in #1792.',
      },
    },
  },
  decorators: [
    // Stories render a body shell in isolation. In production the
    // template (Interview / Announcement / Event / Transfer) supplies
    // the surrounding <article> landmark + <h1> from the hero, so any
    // h2 body section breaks already have a parent h1. The decorator
    // simulates that wrapping so the a11y addon's heading-order /
    // page-has-heading-one rules see a valid hierarchy.
    (Story) => (
      <article>
        <h1 className="sr-only">Article body preview</h1>
        <Story />
      </article>
    ),
  ],
} satisfies Meta<typeof ArticleBody>;

export default meta;
type Story = StoryObj<typeof meta>;

function paragraph(
  text: string,
  key = `p-${text.slice(0, 6).replace(/\s/g, "-")}`,
): PortableTextBlock {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    children: [{ _type: "span", _key: `${key}-c`, text, marks: [] }],
    markDefs: [],
  } as PortableTextBlock;
}

function heading(
  text: string,
  key = `h2-${text.slice(0, 6)}`,
): PortableTextBlock {
  return {
    _type: "block",
    _key: key,
    style: "h2",
    children: [{ _type: "span", _key: `${key}-c`, text, marks: [] }],
    markDefs: [],
  } as PortableTextBlock;
}

function paragraphWithAccent(
  plain: string,
  accented: string,
  trailing = "",
): PortableTextBlock {
  const key = `accent-${plain.slice(0, 6).replace(/\s/g, "-")}`;
  return {
    _type: "block",
    _key: key,
    style: "normal",
    children: [
      { _type: "span", _key: `${key}-c1`, text: plain, marks: [] },
      { _type: "span", _key: `${key}-c2`, text: accented, marks: ["accent"] },
      { _type: "span", _key: `${key}-c3`, text: trailing, marks: [] },
    ],
    markDefs: [],
  } as PortableTextBlock;
}

// transferFact PT block fixture. The double cast through `unknown` is
// required because the placeholder shape lacks the structural `children`
// of a real PortableText block; PortableText still accepts the value at
// runtime because it routes by `_type` before reading any block fields.
function transferFactBlock(args: {
  _key: string;
  direction?: "incoming" | "outgoing" | "extension";
  playerName: string;
  position?: string;
  age?: number;
  otherClubName?: string;
  otherClubLogoUrl?: string;
  kcvvContext?: string;
  until?: string;
}): PortableTextBlock {
  return {
    _type: "transferFact",
    _key: args._key,
    direction: args.direction ?? "incoming",
    playerName: args.playerName,
    position: args.position,
    age: args.age,
    otherClubName: args.otherClubName,
    otherClubLogoUrl: args.otherClubLogoUrl,
    kcvvContext: args.kcvvContext,
    until: args.until,
  } as unknown as PortableTextBlock;
}

// pullQuote PT block fixture. The renderer consumes `body` plus either
// `respondentKey` (when a KCVV subject is the speaker) or
// `externalName`/`externalRole`/`externalSource` (for non-subject quotes).
function pullQuoteBlock(
  body: string,
  extras: {
    tone?: "cream" | "ink" | "jersey";
    respondentKey?: string;
    emphasis?: string;
    externalName?: string;
    externalRole?: string;
    externalSource?: string;
  } = {},
): PortableTextBlock {
  return {
    _type: "pullQuote",
    _key: `pq-${body.slice(0, 6).replace(/\s/g, "-")}`,
    body,
    ...extras,
  } as unknown as PortableTextBlock;
}

const SHORT_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Twee jaar geleden landde KCVV Elewijt in derde provinciale. De promotiestrijd loopt nog, maar de basis is gelegd: vaste kern, jonge instroom, en een verzorgde speelstijl die het publiek terug naar de Driesstraat lokt.",
  ),
  paragraph(
    "De cijfers spreken voor zich. Acht overwinningen op tien, slechts elf tegendoelpunten, en een doelsaldo dat tot de top drie van de reeks behoort.",
  ),
];

const MEDIUM_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Het was een lange winter in Elewijt. De kerstperiode bracht weinig sportief plezier, met een bekeruitschakeling in eigen huis en twee competitienederlagen op rij. Maar januari werd het kantelmoment.",
  ),
  paragraph(
    "Onder leiding van trainer Wim Govaerts hervond de ploeg het ritme tijdens de wintercursus in Hoegaarden. Drie intense dagen oefenen, taktische bijsturingen en bovenal een ploeg die opnieuw begreep waarom ze elke woensdagavond op het kunstgras stonden.",
  ),
  heading("Het seizoen kantelt."),
  paragraph(
    "De eerste competitiewedstrijd na de winterstop bevestigde wat tijdens de stage gegroeid was. Een vlotte 3-0 zege tegen Diest werd gevolgd door een knappe gelijke aan de leider.",
  ),
  paragraphWithAccent(
    "Het ",
    "vertrouwen",
    " keerde zienderogen terug — niet alleen op het veld, maar ook in de tribunes.",
  ),
  paragraph(
    "Tegen het einde van de heenronde stond Elewijt op een verdienstelijke vijfde plaats. Het doel voor de terugronde: minstens vier plaatsen klimmen.",
  ),
];

const LONG_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Wie de afgelopen weken een wedstrijd van KCVV Elewijt heeft bijgewoond, zal het zelf hebben opgemerkt: er hangt iets in de lucht aan de Driesstraat. De ploeg speelt met een overtuiging die we lange tijd hebben moeten missen — en de resultaten volgen.",
  ),
  paragraph(
    "Het begin van het seizoen was nochtans rommelig. Met drie nieuwe spelers in de basis en een blessuregolf die de defensie hard trof, leek het erop dat we opnieuw rond plaats acht of negen zouden eindigen.",
  ),
  paragraph(
    "Maar dan kwam de wedstrijd tegen Tervuren. Een 4-1 zege op verplaatsing, gedragen door een ongelooflijk collectief.",
  ),
  heading("De ommekeer."),
  paragraph(
    "Wat veranderde er? Drie dingen, volgens de trainer. Ten eerste: het zelfvertrouwen na die zege in Tervuren. Ten tweede: de terugkeer van enkele basisspelers uit blessure. En ten derde: de inschakeling van enkele jonge spelers vanuit de A-kern.",
  ),
  paragraph(
    "Met name Jens Vandenberghe (19) viel op. De middenvelder maakte zijn debuut tegen Aarschot en speelde sindsdien elke wedstrijd. Zijn loopvermogen, inzet en intelligente positionering vormen een welkome aanvulling op het ervaren middenveld.",
  ),
  paragraphWithAccent(
    "We zijn ",
    "klaar voor de volgende stap",
    " — een rustige reeks afwerken, dan in mei pieken voor de eindronde.",
  ),
  heading("Naar de eindronde."),
  paragraph(
    "Met nog acht wedstrijden te gaan, staat Elewijt op een gedeelde tweede plaats. De ploeg heeft het lot in eigen handen — als we de eigen wedstrijden winnen, plaatsen we ons rechtstreeks voor de eindronde.",
  ),
  paragraph(
    'Maar trainer Govaerts blijft nuchter. "We kijken niet vooruit naar mei. We kijken naar zaterdag, naar de wedstrijd in Wespelaar. Eén wedstrijd tegelijk."',
  ),
  paragraph(
    "Die mentaliteit is misschien wel het grootste verschil met vorig seizoen. Geen luchtkastelen meer. Gewoon werken, week na week, en zien waar we eindigen.",
  ),
];

const HEADING_ONLY_CONTENT: PortableTextBlock[] = [
  heading("Het seizoen.", "h2-1"),
  heading("De promotie.", "h2-2"),
  heading("De toekomst.", "h2-3"),
];

const ALL_PULL_QUOTE_CONTENT: PortableTextBlock[] = [
  pullQuoteBlock("Eén ploeg, één doel.", {
    externalName: "Voorzitter",
    externalRole: "BESTUUR",
  }),
  pullQuoteBlock("De terras is altijd open.", {
    externalName: "Cafetariadame",
    externalRole: "VRIJWILLIGER",
  }),
  pullQuoteBlock("Driesstraat, vrijdagavond.", {
    externalName: "Supportersfederatie",
    externalSource: "FANBLAD",
  }),
];

const WITH_PULL_QUOTE_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Wim Govaerts opent de deur van zijn kantoor met een lach. Het tweede seizoen op de bank loopt op zijn einde, en het verschil met vorig jaar is voelbaar.",
  ),
  paragraph(
    "We zaten samen aan een tafel in de cafetaria om terug te blikken op een seizoen dat anders begon dan voorzien.",
  ),
  pullQuoteBlock(
    "We hebben de kleedkamer in de derde minuut weer wakker gekregen.",
    {
      tone: "ink",
      respondentKey: "subj-coach",
    },
  ),
  paragraph(
    "Die wakker-roeper-mentaliteit zou de rode draad worden door de tweede helft van het seizoen. Geen luchtkastelen, geen excuses, alleen werken.",
  ),
  paragraph(
    "Met nog vier wedstrijden te gaan, staat Elewijt op een gedeelde tweede plaats. Het lot ligt in eigen handen.",
  ),
];

// Subjects fixture for the WithPullQuote story — supplies the resolvable
// respondentKey on the inline pull-quote so the SubjectAvatar renders
// with the staff photo path.
const WITH_PULL_QUOTE_SUBJECTS = [
  {
    _key: "subj-coach",
    kind: "staff" as const,
    staffRef: {
      firstName: "Wim",
      lastName: "Govaerts",
      functionTitle: "TRAINER",
      photoUrl: fixtureImage("staff-portrait", 0),
    },
  },
];

// Transfer-article body with 4 consecutive `transferFact` PT blocks
// renders as a 2-up grid (adjacency rule). The lead paragraph and the
// closing paragraph drop in around the group — verifies the segmenter
// correctly splits PT runs from transferFact runs and flushes both.
const WITH_TRANSFER_FACTS_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Vier nieuwe versterkingen voor de A-kern. Het clubbestuur sluit de wintermercato af met een mix van ervaring en jeugd.",
    "p-lead-transfer",
  ),
  transferFactBlock({
    _key: "tf-1",
    direction: "incoming",
    playerName: "Joren De Smet",
    position: "Middenvelder",
    age: 19,
    otherClubName: "Diest",
    otherClubLogoUrl: "/images/logos/clubs/dummy-rouge.svg",
    kcvvContext: "#14",
  }),
  transferFactBlock({
    _key: "tf-2",
    direction: "incoming",
    playerName: "Maxim Breugelmans",
    position: "Spits",
    age: 21,
    otherClubName: "Tienen",
    otherClubLogoUrl: "/images/logos/clubs/dummy-bleu.svg",
    kcvvContext: "#9",
  }),
  transferFactBlock({
    _key: "tf-3",
    direction: "outgoing",
    playerName: "Bram Vanhoutte",
    position: "Centrale verdediger",
    age: 28,
    otherClubName: "Aarschot",
    otherClubLogoUrl: "/images/logos/clubs/dummy-vert.svg",
    kcvvContext: "#5",
  }),
  transferFactBlock({
    _key: "tf-4",
    direction: "extension",
    playerName: "Niels Geukens",
    position: "Aanvoerder",
    age: 26,
    kcvvContext: "#11",
    until: "juni 2028",
  }),
  paragraph(
    "Met deze laatste handtekeningen is de kern definitief rond voor de terugronde. Trainer Govaerts spreekt van een evenwichtige selectie.",
    "p-close-transfer",
  ),
];

// Single transferFact in a transfer article — renders as a 1-up card at
// prose width, isolated between paragraphs. Verifies the segmenter's
// single-fact path.
const SINGLE_TRANSFER_FACT_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Eén nieuwe handtekening kleurt de wintermercato van KCVV Elewijt.",
    "p-single-lead",
  ),
  transferFactBlock({
    _key: "tf-solo",
    direction: "incoming",
    playerName: "Daan Permentier",
    position: "Linksachter",
    age: 22,
    otherClubName: "Boortmeerbeek",
    otherClubLogoUrl: "/images/logos/clubs/dummy-rouge.svg",
    kcvvContext: "#3",
  }),
  paragraph(
    "Permentier tekent voor anderhalf seizoen en sluit volgende week aan op de training.",
    "p-single-close",
  ),
];

// Two-consecutive transferFacts — even-count branch of the segmenter.
// Both cards render at single-column width inside a 2-up grid (no
// trailing-odd full-width).
const TWO_CONSECUTIVE_TRANSFER_FACTS_CONTENT: PortableTextBlock[] = [
  paragraph("Twee nieuwe gezichten op de Driesstraat.", "p-two-lead"),
  transferFactBlock({
    _key: "tf-two-1",
    direction: "incoming",
    playerName: "Lars Janssens",
    position: "Vleugelaanvaller",
    age: 20,
    otherClubName: "Wespelaar",
    otherClubLogoUrl: "/images/logos/clubs/dummy-bleu.svg",
    kcvvContext: "#7",
  }),
  transferFactBlock({
    _key: "tf-two-2",
    direction: "incoming",
    playerName: "Tom Verhaegen",
    position: "Doelman",
    age: 25,
    otherClubName: "Tienen",
    otherClubLogoUrl: "/images/logos/clubs/dummy-vert.svg",
    kcvvContext: "#1",
  }),
];

// Three-consecutive transferFacts — odd-count branch. First two cards
// occupy the 2-up grid; the third (trailing odd) spans both columns and
// reads as a centered 1-up block beneath the grid.
const THREE_CONSECUTIVE_TRANSFER_FACTS_CONTENT: PortableTextBlock[] = [
  paragraph("Drie aanwinsten ronden de winterperiode af.", "p-three-lead"),
  transferFactBlock({
    _key: "tf-three-1",
    direction: "incoming",
    playerName: "Sam De Coninck",
    position: "Linksback",
    age: 21,
    otherClubName: "Aarschot",
    otherClubLogoUrl: "/images/logos/clubs/dummy-rouge.svg",
    kcvvContext: "#3",
  }),
  transferFactBlock({
    _key: "tf-three-2",
    direction: "incoming",
    playerName: "Jelle Maes",
    position: "Spits",
    age: 23,
    otherClubName: "Boortmeerbeek",
    otherClubLogoUrl: "/images/logos/clubs/dummy-bleu.svg",
    kcvvContext: "#10",
  }),
  transferFactBlock({
    _key: "tf-three-3",
    direction: "extension",
    playerName: "Niels Geukens",
    position: "Aanvoerder",
    age: 26,
    kcvvContext: "#11",
    until: "juni 2028",
  }),
];

export const Short: Story = {
  args: {
    content: SHORT_CONTENT,
  },
};

export const Medium: Story = {
  args: {
    content: MEDIUM_CONTENT,
  },
};

export const Long: Story = {
  args: {
    content: LONG_CONTENT,
  },
};

// Edge case: body is only h2 section breaks, no normal paragraphs. The
// DropCap injection skips (no eligible paragraph found); the renderer
// still emits the cream surface + prose-width container around the h2s.
export const HeadingOnly: Story = {
  args: {
    content: HEADING_ONLY_CONTENT,
  },
};

// Edge case: body is only `pullQuote` PT blocks (no paragraphs, no
// headings). Each renders the external-attribution path because the
// fixtures don't supply a respondentKey. Verifies the shell handles a
// pull-quote-heavy body without normal paragraphs gracefully — DropCap
// skips (no normal paragraph found), EndMark still renders.
export const AllPullQuote: Story = {
  args: {
    content: ALL_PULL_QUOTE_CONTENT,
  },
};

// Mixed body with an inline `pullQuote` block that resolves a KCVV
// subject (Wim Govaerts) via respondentKey. The pullQuote renders the
// avatar layout with the staff photo + italic display name + mono caps
// role/source. tone="ink" demonstrates the dark variant inside the
// otherwise cream body. EndMark closes the body.
export const WithPullQuote: Story = {
  args: {
    content: WITH_PULL_QUOTE_CONTENT,
    subjects: WITH_PULL_QUOTE_SUBJECTS,
  },
};

// Edge case: body that doesn't reference any image blocks (the shell's
// default — image serializers wire in later sub-issues). Distinguished
// from Medium by being slightly longer + multiple section breaks.
export const NoImages: Story = {
  args: {
    content: LONG_CONTENT,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Same fixture as Long, framed as the no-images edge case. The shell never emits image blocks in #1792; image-block serializers (articleImage, TapedFigure) wire in 5.A.2 / 5.B.*. This story confirms that an image-free body still reads as long-form editorial.",
      },
    },
  },
};

// Transfer-article body with a 4-fact consecutive group → renders as a
// 2-up grid (adjacency rule from the 5.d-tra lock). The first transferFact
// in a real transfer article powers the hero via <TransferFactStrip>; this
// story isolates the body-level grouping behaviour.
export const WithTransferFacts: Story = {
  args: {
    content: WITH_TRANSFER_FACTS_CONTENT,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Transfer-article body composition. Four consecutive `transferFact` PT blocks render as a `<TransferFactGroup variant="grid">` (2-up grid). The first transferFact in a production transfer article is consumed by `<TransferFactStrip>` in the hero (Phase 3-b R1.5) and never reaches `<ArticleBody>`; this story exercises the body-level adjacency rule for additional facts beyond the first.',
      },
    },
  },
};

// Single transferFact in the body → 1-up card at prose width. Verifies
// that an isolated fact (no adjacent siblings) renders without the
// 2-up grid layout.
export const WithSingleTransferFact: Story = {
  args: {
    content: SINGLE_TRANSFER_FACT_CONTENT,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Isolated `transferFact` between paragraphs → single 1-up card. The segmenter doesn't promote a lone fact into the grid layout.",
      },
    },
  },
};

// Two consecutive transferFacts — even-count branch of the segmenter.
export const WithTwoConsecutiveTransferFacts: Story = {
  args: {
    content: TWO_CONSECUTIVE_TRANSFER_FACTS_CONTENT,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Two consecutive `transferFact` blocks → 2-up grid with both cards at single-column width. Verifies the even-count branch of the adjacency rule (no trailing-odd full-width).",
      },
    },
  },
};

// Three consecutive transferFacts — odd-count branch. The trailing card
// spans both columns to read as a centered 1-up block beneath the grid.
export const WithThreeConsecutiveTransferFacts: Story = {
  args: {
    content: THREE_CONSECUTIVE_TRANSFER_FACTS_CONTENT,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Three consecutive `transferFact` blocks → 2-up grid with the first two cards in a row and the third card spanning both columns (trailing-odd full-width). Exercises the `md:col-span-2` branch of `<TransferFactGroup>`.",
      },
    },
  },
};

// Full body composition (PullQuote + EndMark + VerderLezenRow). Stitches
// the 5.A.2 surfaces together to show how `<ArticleBody>` and
// `<VerderLezenRow>` compose inside the page template that lands at 5.C
// (#1800). The article body ends at <EndMark>; <VerderLezenRow> sits
// beneath as a sibling, wider than the body's prose width.
export const BodyComposition: Story = {
  args: {
    content: WITH_PULL_QUOTE_CONTENT,
    subjects: WITH_PULL_QUOTE_SUBJECTS,
  },
  render: (args) => (
    <>
      <ArticleBody {...args} />
      <VerderLezenRow
        items={[
          {
            title: "Maxim Breugelmans versterkt Elewijt",
            href: "/nieuws/maxim-breugelmans-transfer",
            imageUrl: fixtureImage("article-hero-transfer", 0),
            badge: "TRANSFER",
            date: "18 mei 2026",
            articleType: "transfer",
          },
          {
            title: "Algemene vergadering op 12 juni",
            href: "/nieuws/algemene-vergadering-juni",
            imageUrl: fixtureImage("article-hero-generic", 0),
            badge: "MEDEDELING",
            date: "15 mei 2026",
            articleType: "announcement",
          },
          {
            title: "Lentetornooi U13",
            href: "/nieuws/lentetornooi-u13",
            imageUrl: fixtureImage("article-hero-evenement", 0),
            badge: "EVENEMENT",
            date: "10 mei 2026",
            articleType: "event",
          },
        ]}
      />
    </>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "5.A.2 composition story — `<ArticleBody>` (with inline pull-quote + EndMark closer) followed by `<VerderLezenRow>` (3-up related articles). Mirrors the per-variant shell `/nieuws/[slug]` ships post-5.C (#1800).",
      },
    },
  },
};
