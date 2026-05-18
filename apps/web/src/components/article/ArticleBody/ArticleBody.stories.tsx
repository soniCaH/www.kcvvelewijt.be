import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { ArticleBody } from "./ArticleBody";

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

// Stand-in for a future PT block type the renderer doesn't handle yet
// (e.g. pullQuote). PortableText silently skips unknown types in #1792.
// The double cast through `unknown` is required because the placeholder
// shape lacks the structural `children` of a real PortableText block;
// PortableText still accepts the value at runtime because it routes by
// `_type` before reading any block fields.
function pullQuotePlaceholder(text: string): PortableTextBlock {
  return {
    _type: "pullQuote",
    _key: `pq-${text.slice(0, 6).replace(/\s/g, "-")}`,
    body: text,
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
  pullQuotePlaceholder("Eén ploeg, één doel."),
  pullQuotePlaceholder("De terras is altijd open."),
  pullQuotePlaceholder("Driesstraat, vrijdagavond."),
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

// Edge case: body is only pullQuote PT blocks. The pullQuote serializer
// wires in 5.A.2 (#1793); until then, PortableText silently skips these
// blocks. The story documents the graceful-degradation surface — the
// container renders cleanly without crashing on unhandled block types.
export const AllPullQuote: Story = {
  args: {
    content: ALL_PULL_QUOTE_CONTENT,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Body of only `pullQuote` PT blocks (5.A.2 territory). #1792 does not ship a `pullQuote` serializer, so PortableText silently skips them and the body renders empty inside the cream surface — graceful no-crash baseline for the shell.",
      },
    },
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
