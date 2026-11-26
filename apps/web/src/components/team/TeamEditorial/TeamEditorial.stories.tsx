import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { TeamEditorial } from "./TeamEditorial";

const block = (
  ...spans: ReadonlyArray<{ text: string; marks?: string[] }>
): PortableTextBlock => {
  return {
    _type: "block",
    _key: `block-${spans.map((s) => s.text.slice(0, 4)).join("-")}`,
    style: "normal",
    children: spans.map((span, i) => ({
      _type: "span",
      _key: `span-${i}`,
      text: span.text,
      marks: span.marks ?? [],
    })),
    markDefs: [],
  } as unknown as PortableTextBlock;
};

const body: PortableTextBlock[] = [
  block(
    {
      text: "Onze A-ploeg speelt al sinds de promotie in 2018 op het hoogste provinciale niveau. De kern bestaat uit een mix van eigen jeugd en ervaren spelers. ",
    },
    {
      text: "Hier wordt voetbal nog met het hart gespeeld.",
      marks: ["pullquote"],
    },
  ),
  block({
    text: "Elke week opnieuw zetten de spelers, de staf en de supporters samen de schouders eronder.",
  }),
];

const contactInfo: PortableTextBlock[] = [
  block({ text: "Ploegafgevaardigde: Jan Janssens — 0470 12 34 56" }),
  block({ text: "Secretariaat: info@kcvvelewijt.be" }),
];

const meta = {
  title: "Features/Teams/TeamEditorial",
  component: TeamEditorial,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
  args: { teamLabel: "U8" },
} satisfies Meta<typeof TeamEditorial>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Both blocks present, body carries a "Het verhaal" pull-quote. Trainingen
 *  still routes to ProSoccerData — unconditional, not a fallback (#2637). */
export const FullEditorial: Story = {
  args: { body, contactInfo },
};

/** Only the contact block — verhaal auto-hides, Trainingen stays on. */
export const ContactOnly: Story = {
  args: { contactInfo },
};

/** Body without a pullquote — prose renders, no lifted quote card. */
export const BodyNoPullquote: Story = {
  args: {
    body: [
      block({
        text: "Een beknopte ploegbeschrijving zonder uitgelicht citaat.",
      }),
    ],
  },
};

/**
 * Routing state (#2637) — `body`/`contactInfo` both unset, the state all 26
 * team documents are in today. Only "Trainingen" renders; the section still
 * never returns `null` — this is the 18-of-18 state the ticket measures.
 */
export const TrainingRoutingOnly: Story = {
  args: {},
};

/**
 * All three blocks together (#2637 review round 1) — a SEPARATE story from
 * `FullEditorial`, not a duplicate. `FullEditorial`'s pullquote card pushes
 * "Contact" past the 667px mobile capture fold (the VR runner's mobile
 * viewport is fixed, same as every other tall VR-tagged story in this repo —
 * `ArticleBody`'s own long-content stories capture "above the fold" too), so
 * that story alone stopped regression-testing Contact at mobile width the
 * moment Trainingen's height was added ahead of it. This story keeps the
 * same three-block combination but with `BodyNoPullquote`'s short body (no
 * lifted `<PullQuote>` card) so the full stack — Het verhaal, Trainingen,
 * Contact — stays inside the mobile fold and stays under regression.
 */
export const AllBlocksCompact: Story = {
  args: {
    body: [
      block({
        text: "Een beknopte ploegbeschrijving zonder uitgelicht citaat.",
      }),
    ],
    contactInfo,
  },
};
