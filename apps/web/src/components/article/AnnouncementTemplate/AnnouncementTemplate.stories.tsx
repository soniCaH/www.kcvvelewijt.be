import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { AnnouncementTemplate } from "./AnnouncementTemplate";

const paragraph = (key: string, text: string): PortableTextBlock =>
  ({
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  }) as unknown as PortableTextBlock;

const heading = (key: string, text: string): PortableTextBlock =>
  ({
    _type: "block",
    _key: key,
    style: "h2",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  }) as unknown as PortableTextBlock;

const blockquote = (key: string, text: string): PortableTextBlock =>
  ({
    _type: "block",
    _key: key,
    style: "blockquote",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  }) as unknown as PortableTextBlock;

const inlineImage = (
  key: string,
  url: string,
  alt: string,
): PortableTextBlock =>
  ({
    _type: "articleImage",
    _key: key,
    asset: { url },
    alt,
    width: 960,
    height: 540,
  }) as unknown as PortableTextBlock;

const meta = {
  title: "Pages/Article/Announcement",
  component: AnnouncementTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Default article template (#1330 Phase 4). Renders when `articleType` is `announcement` or missing. Showcases the §5.1 hero, §7.3 drop-cap, §7.4 rule-framed blockquote, and §7.5 body fade-up scroll motion.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AnnouncementTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDropCapBlockquoteAndInlineImage: Story = {
  args: {
    title: "Een nieuw hoofdstuk voor het eerste elftal.",
    category: "Nieuws",
    coverImageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=80",
    publishedDate: "19 April 2026",
    readingTime: "4 min lezen",
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/een-nieuw-hoofdstuk",
      title: "Een nieuw hoofdstuk voor het eerste elftal",
    },
    body: [
      paragraph(
        "p1",
        "Na een seizoen vol leermomenten schrijft KCVV Elewijt aan een nieuw verhaal. De kleedkamer borrelt, de staf heeft duidelijke ambities, en het publiek staat klaar om die sprong mee te maken. Dit is het moment om vooruit te kijken — en we doen dat vol vertrouwen.",
      ),
      paragraph(
        "p2",
        "Voor de nieuwe jaargang ligt de focus op diepgang in de kern, continuïteit in de speelstijl, en een duidelijke lijn tussen jeugd en eerste ploeg. Op elk van die drie punten zetten we nu al stappen.",
      ),
      heading("h1", "Drie speerpunten voor het nieuwe seizoen"),
      paragraph(
        "p3",
        "De staf werkt het masterplan verder uit rond drie speerpunten: speelstijl, schakeling naar de jeugd, en een stadionervaring die supporters laat terugkomen. Elk speerpunt krijgt een trekker uit de staf — niemand hoeft alles te dragen.",
      ),
      blockquote(
        "bq",
        "We gaan niet iedereen tevredenstellen, maar we gaan wel iedereen meenemen. Dat is een verschil dat je voelt op de tribune.",
      ),
      paragraph(
        "p4",
        "Intern werd de afgelopen weken stevig gesproken over wat werkte en wat niet. Die openheid is een verademing — en ook de reden dat de voorbereiding vroeg, gestructureerd en met overtuiging kan starten.",
      ),
      inlineImage(
        "img1",
        "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&q=80",
        "Spelers KCVV Elewijt tijdens de training",
      ),
      heading("h2", "Wat verandert er concreet?"),
      paragraph(
        "p5",
        "Vanaf het eerste weekend komen er extra stewards op de parking, wordt de tribune-ingang heringericht en krijgt de fanshop een vaste uitstalling naast het clubhuis. Kleine signalen die samen een groot verschil maken voor wie zaterdag na zaterdag langskomt.",
      ),
      paragraph(
        "p6",
        "Op sportief vlak behouden we de 4-3-3 met actieve backs, maar met meer druk op de zestien. De staf investeert bewust in een tweede afwerker naast de nummer 9, zodat we in cruciale wedstrijden een vluchtscenario hebben.",
      ),
    ] as PortableTextBlock[],
  },
};

export const WithoutCoverImage: Story = {
  args: {
    ...WithDropCapBlockquoteAndInlineImage.args,
    coverImageUrl: null,
  },
};

export const WithoutCategoryOrReadingTime: Story = {
  args: {
    ...WithDropCapBlockquoteAndInlineImage.args,
    category: undefined,
    readingTime: undefined,
  },
};
