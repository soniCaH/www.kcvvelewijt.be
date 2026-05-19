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

// ─── 5.C body-block serializer coverage (#1850) ──────────────────────────
// Block fixtures wired below exercise the new serializers added in Part C:
// articleImage, videoBlock (embed branch), fileAttachment, htmlTable,
// blockquote, plus internal/external link marks. Together with the
// in-flow/groupAtTail qaBlock story below, this gives Storybook + VR
// coverage of every body-flow block type the page composition emits.

function articleImageBlock(args: {
  _key: string;
  alt: string;
  width?: "prose" | "wide" | "bleed";
  url: string;
  description?: string;
  creditLine?: string;
  dimensions?: { width: number; height: number };
}): PortableTextBlock {
  return {
    _type: "articleImage",
    _key: args._key,
    alt: args.alt,
    width: args.width ?? "prose",
    asset: {
      url: args.url,
      description: args.description,
      creditLine: args.creditLine,
      metadata: args.dimensions
        ? {
            dimensions: {
              ...args.dimensions,
              aspectRatio: args.dimensions.width / args.dimensions.height,
            },
          }
        : undefined,
    },
  } as unknown as PortableTextBlock;
}

function videoBlockEmbed(args: {
  _key: string;
  embedUrl: string;
  caption?: string;
  width?: "prose" | "wide" | "bleed";
}): PortableTextBlock {
  return {
    _type: "videoBlock",
    _key: args._key,
    embedUrl: args.embedUrl,
    caption: args.caption,
    width: args.width ?? "prose",
  } as unknown as PortableTextBlock;
}

function fileAttachmentBlock(args: {
  _key: string;
  label: string;
  fileUrl: string;
  fileMimeType?: string;
  fileSize?: number;
  fileOriginalFilename?: string;
}): PortableTextBlock {
  return {
    _type: "fileAttachment",
    _key: args._key,
    label: args.label,
    fileUrl: args.fileUrl,
    fileMimeType: args.fileMimeType,
    fileSize: args.fileSize,
    fileOriginalFilename: args.fileOriginalFilename,
  } as unknown as PortableTextBlock;
}

function htmlTableBlock(args: {
  _key: string;
  html: string;
}): PortableTextBlock {
  return {
    _type: "htmlTable",
    _key: args._key,
    html: args.html,
  } as unknown as PortableTextBlock;
}

function blockquoteParagraph(text: string, key: string): PortableTextBlock {
  return {
    _type: "block",
    _key: key,
    style: "blockquote",
    children: [{ _type: "span", _key: `${key}-c`, text, marks: [] }],
    markDefs: [],
  } as PortableTextBlock;
}

function paragraphWithLinkMarks(key: string): PortableTextBlock {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    children: [
      { _type: "span", _key: `${key}-c1`, text: "Lees ook ", marks: [] },
      {
        _type: "span",
        _key: `${key}-c2`,
        text: "het clubreglement",
        marks: ["int-link-1"],
      },
      { _type: "span", _key: `${key}-c3`, text: " of bekijk de ", marks: [] },
      {
        _type: "span",
        _key: `${key}-c4`,
        text: "externe federatiepagina",
        marks: ["ext-link-1"],
      },
      { _type: "span", _key: `${key}-c5`, text: " voor meer info.", marks: [] },
    ],
    markDefs: [
      {
        _key: "int-link-1",
        _type: "internalLink",
        reference: {
          _type: "page",
          slug: "reglement",
        },
      },
      {
        _key: "ext-link-1",
        _type: "link",
        href: "https://www.voetbalvlaanderen.be",
      },
    ],
  } as unknown as PortableTextBlock;
}

function qaBlockInline(
  key: string,
  opts?: { groupAtTail?: boolean },
): PortableTextBlock {
  return {
    _type: "qaBlock",
    _key: key,
    pairs: [
      {
        _key: `${key}-p1`,
        question: "Hoe begon dit seizoen voor jou?",
        respondents: [
          {
            _key: `${key}-r1`,
            respondentKey: "subj-coach",
            answer: [
              {
                _type: "block",
                _key: `${key}-ans-1`,
                style: "normal",
                children: [
                  {
                    _type: "span",
                    _key: `${key}-ans-1-c`,
                    text: "Met heel veel goesting. De groep was er klaar voor.",
                    marks: [],
                  },
                ],
                markDefs: [],
              },
            ],
          },
        ],
      },
    ],
    ...(opts?.groupAtTail ? { groupAtTail: true } : {}),
  } as unknown as PortableTextBlock;
}

const MIXED_PHASE_5_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Een doorgewinterd seizoen in beeld. De club blikt terug op de wedstrijden, de doelpunten en de momenten die de tribunes aan het zingen brachten.",
    "p-mixed-lead",
  ),
  articleImageBlock({
    _key: "img-1",
    alt: "De eerste ploeg viert een treffer in de slotfase",
    width: "prose",
    url: "/images/news/feature-1.jpg",
    description: "De ontlading bij de gelijkmaker in de slotminuut.",
    creditLine: "Foto: An Verheyden",
    dimensions: { width: 1600, height: 900 },
  }),
  paragraphWithLinkMarks("p-links"),
  blockquoteParagraph(
    "We hebben de kleedkamer in de derde minuut weer wakker gekregen.",
    "bq-1",
  ),
  videoBlockEmbed({
    _key: "vid-1",
    embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    caption: "Hoogtepunten — KCVV Elewijt 3-0 Diest.",
    width: "prose",
  }),
  htmlTableBlock({
    _key: "table-1",
    html: `<table><thead><tr><th>Stand</th><th>Ploeg</th><th>Punten</th></tr></thead><tbody><tr><td>1</td><td>KCVV Elewijt</td><td>52</td></tr><tr><td>2</td><td>Diest</td><td>49</td></tr><tr><td>3</td><td>Aarschot</td><td>45</td></tr></tbody></table>`,
  }),
  fileAttachmentBlock({
    _key: "file-1",
    label: "Reglement 2026 (PDF)",
    fileUrl: "/files/reglement-2026.pdf",
    fileMimeType: "application/pdf",
    fileSize: 421337,
    fileOriginalFilename: "reglement-2026.pdf",
  }),
  paragraph(
    "Een seizoen waarin elk detail telde. De spelers bedanken het thuispubliek voor de niet-aflatende steun.",
    "p-mixed-close",
  ),
];

const WITH_EVENT_FACT_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Komende zaterdag staat de jeugdacademie in het centrum van de aandacht. Het clubbestuur nodigt alle leden uit voor het lentetornooi.",
    "p-event-lead",
  ),
  {
    _type: "eventFact",
    _key: "evt-1",
    title: "Lentetornooi U13",
    date: "2026-06-13",
    startTime: "09:00",
    endTime: "17:00",
    location: "Driesstraat",
    ageGroup: "U13",
    competitionTag: "TORNOOI",
    ticketUrl: "https://kcvvelewijt.be/inschrijven",
    ticketLabel: "Schrijf je in",
  } as unknown as PortableTextBlock,
  paragraph(
    "Alle ploegen uit de regio nemen deel. De cafetaria is doorlopend open en de jeugdwerking serveert pannenkoeken.",
    "p-event-close",
  ),
];

const WITH_QA_INFLOW_AND_TAIL_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Een uitvoerig gesprek met de trainer, voorafgegaan door enkele opwarmende vragen die in-flow blijven.",
    "p-qa-lead",
  ),
  qaBlockInline("qa-inflow", { groupAtTail: false }),
  paragraph(
    "De zwaarte van de match zat in de details — een ingooi, een tweede bal, een net iets te laat ingreep.",
    "p-qa-mid",
  ),
  // groupAtTail block — in production this would be hoisted by
  // qaBlocksToTailSection before reaching <ArticleBody>. The story
  // leaves it in flow on purpose so reviewers can verify the in-flow
  // qaBlock serializer renders both flagged and unflagged blocks
  // identically (the flag is a page-composition concern).
  qaBlockInline("qa-tail", { groupAtTail: true }),
];

// Mixed serializer coverage — articleImage + videoBlock + fileAttachment +
// htmlTable + inline link marks + blockquote in one body. Demonstrates
// the cream-surface treatment end-to-end with the Phase 5 redesigned
// block primitives wired in.
export const WithMixedPhase5Blocks: Story = {
  args: {
    content: MIXED_PHASE_5_CONTENT,
    articleSlug: "phase-5-storybook",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Phase 5.C serializer coverage. Renders one articleImage (prose-width, with caption + credit), one external `videoBlock` (YouTube embed branch), one `fileAttachment` (PDF card), one `htmlTable`, a `blockquote`, plus internal + external link marks inside a paragraph. The cream surface stays consistent across all blocks per the locked composition.",
      },
    },
  },
};

// Body-flow eventFact (not absorbed by hero). Mirrors the
// announcement / interview / transfer variants where the eventFact
// authored inside the body renders as a polaroid card.
export const WithEventFactInBody: Story = {
  args: {
    content: WITH_EVENT_FACT_CONTENT,
  },
  parameters: {
    docs: {
      description: {
        story:
          "`eventFact` body-block rendering. On `event`-articleType articles the FIRST eventFact is absorbed by `<EventDetailBlock>` at the hero (page composition concern); every other eventFact — and every eventFact on non-event articleTypes — renders here via `<EventFactInline>`.",
      },
    },
  },
};

// qaBlock in-flow + tail mix. The page composition normally hoists
// `groupAtTail: true` blocks out via `qaBlocksToTailSection()` before
// they reach <ArticleBody>. This story keeps both in flow so reviewers
// can verify the in-flow `qaBlock` serializer behaves identically
// regardless of the tail flag.
export const WithQaBlocksInFlowAndTail: Story = {
  args: {
    content: WITH_QA_INFLOW_AND_TAIL_CONTENT,
    subjects: WITH_PULL_QUOTE_SUBJECTS,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Two `qaBlock` PT blocks in source order: one with `groupAtTail: false`, one with `groupAtTail: true`. The `<ArticleBody>` PT serializer treats both as in-flow content — the page composition is responsible for splitting tail blocks via `qaBlocksToTailSection()` before reaching this renderer.",
      },
    },
  },
};

// articleImage width-enum coverage. Three figures at `prose`, `wide`,
// and `bleed` widths between a lead and a closing paragraph.
const WITH_ARTICLE_IMAGE_WIDTHS_CONTENT: PortableTextBlock[] = [
  paragraph(
    "Drie identieke foto's, drie verschillende breedtes. Editors kiezen de breedte per beeld via de Studio dropdown.",
    "p-widths-lead",
  ),
  articleImageBlock({
    _key: "img-prose",
    alt: "Prose-width landschap met onderschrift en credit",
    width: "prose",
    url: "/images/news/feature-1.jpg",
    description: "Standaard prose-breedte (680 px).",
    creditLine: "Foto: An Verheyden",
    dimensions: { width: 1600, height: 900 },
  }),
  paragraph(
    "Een breedte-variant dwingt de figuur buiten de leescolumn, terwijl het onderschrift binnen de prose-grid blijft staan.",
    "p-widths-mid",
  ),
  articleImageBlock({
    _key: "img-wide",
    alt: "Wide-width landschap",
    width: "wide",
    url: "/images/news/feature-1.jpg",
    description: "Wide breedte (~1040 px) — collapsed naar prose op mobiel.",
    dimensions: { width: 1600, height: 900 },
  }),
  paragraph(
    "Bleed onderdrukt de tape strip en pin de foto aan de viewport-randen.",
    "p-widths-mid-2",
  ),
  articleImageBlock({
    _key: "img-bleed",
    alt: "Bleed-width landschap",
    width: "bleed",
    url: "/images/news/feature-1.jpg",
    creditLine: "Foto: An Verheyden",
    dimensions: { width: 1600, height: 900 },
  }),
  paragraph(
    "Editors flippen elk beeld onafhankelijk; geen schema-bredte-hint, geen automatische resize.",
    "p-widths-close",
  ),
];

export const WithArticleImageWidths: Story = {
  args: {
    content: WITH_ARTICLE_IMAGE_WIDTHS_CONTENT,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Three identical photos at `width: 'prose'`, `'wide'`, and `'bleed'`. Verifies the locked R3 width enum from `articleimage-locked.md` (tape stays for prose + wide, suppressed for bleed; bleed pins to viewport edges while keeping the figcaption at prose width).",
      },
    },
  },
};
