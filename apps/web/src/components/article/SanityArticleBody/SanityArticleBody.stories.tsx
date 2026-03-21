import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { SanityArticleBody } from "./SanityArticleBody";

const meta = {
  title: "Features/Articles/SanityArticleBody",
  component: SanityArticleBody,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof SanityArticleBody>;

export default meta;
type Story = StoryObj<typeof meta>;

const heading = (
  text: string,
  style: "h2" | "h3" = "h2",
): PortableTextBlock => ({
  _type: "block",
  _key: `heading-${text.slice(0, 10)}`,
  style,
  children: [{ _type: "span", _key: "s1", text, marks: [] }],
  markDefs: [],
});

const paragraph = (text: string, key = "p1"): PortableTextBlock => ({
  _type: "block",
  _key: key,
  style: "normal",
  children: [{ _type: "span", _key: "s1", text, marks: [] }],
  markDefs: [],
});

const listItem = (text: string, key: string): PortableTextBlock => ({
  _type: "block",
  _key: key,
  style: "normal",
  listItem: "bullet",
  level: 1,
  children: [{ _type: "span", _key: "s1", text, marks: [] }],
  markDefs: [],
});

const imageBlock = (alt: string, fullBleed = false): PortableTextBlock =>
  ({
    _type: "image",
    _key: `img-${alt.slice(0, 5)}`,
    asset: {
      url: `https://placehold.co/800x450/4acf52/fff?text=${encodeURIComponent(alt)}`,
    },
    alt,
    width: 800,
    height: 450,
    fullBleed,
  }) as unknown as PortableTextBlock;

const htmlTableBlock = (html: string): PortableTextBlock =>
  ({
    _type: "htmlTable",
    _key: "table-1",
    html,
  }) as unknown as PortableTextBlock;

const fileAttachmentBlock = (
  label: string,
  fileUrl: string,
): PortableTextBlock =>
  ({
    _type: "fileAttachment",
    _key: "file-1",
    label,
    fileUrl,
  }) as unknown as PortableTextBlock;

const sampleTableHtml = `<table>
  <thead><tr><th>Ploeg</th><th>W</th><th>G</th><th>V</th><th>Ptn</th></tr></thead>
  <tbody>
    <tr><td>KCVV Elewijt</td><td>18</td><td>5</td><td>3</td><td>59</td></tr>
    <tr><td>FC Vigor</td><td>15</td><td>7</td><td>4</td><td>52</td></tr>
    <tr><td>SK Londerzeel</td><td>14</td><td>6</td><td>6</td><td>48</td></tr>
  </tbody>
</table>`;

const fullContent: PortableTextBlock[] = [
  heading("Verslag: KCVV Elewijt wint overtuigend"),
  paragraph(
    "KCVV Elewijt heeft zaterdagavond een overtuigende overwinning geboekt tegen FC Vigor. De thuisploeg domineerde van begin tot einde en liet de bezoekers weinig ruimte.",
    "p-intro",
  ),
  imageBlock("Wedstrijdfoto"),
  heading("Eerste helft", "h3"),
  paragraph(
    "Al na vijf minuten opende aanvaller Jonas De Smet de score met een knappe kopbal. De verdediging stond solide en gaf amper kansen weg.",
    "p-first-half",
  ),
  listItem("Doelpunt: Jonas De Smet (5')", "li-1"),
  listItem("Geel: Kevin Peeters (23')", "li-2"),
  listItem("Doelpunt: Sander Willems (38')", "li-3"),
  heading("Stand na speeldag 26"),
  htmlTableBlock(sampleTableHtml),
  heading("Downloads", "h3"),
  fileAttachmentBlock(
    "Wedstrijdblad downloaden",
    "https://example.com/wedstrijdblad.pdf",
  ),
];

/**
 * Full article body with headings, paragraphs, image, list, table, and download block
 */
export const Default: Story = {
  args: {
    content: fullContent,
  },
};

/**
 * Empty body content
 */
export const EmptyBody: Story = {
  args: {
    content: [],
  },
};

/**
 * Body with only a table block
 */
export const WithTableOnly: Story = {
  args: {
    content: [heading("Klassement"), htmlTableBlock(sampleTableHtml)],
  },
};
