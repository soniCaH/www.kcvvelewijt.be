/** PROTOTYPE — throwaway. Do not ship. See #3911. */

import type { PortableTextBlock } from "@portabletext/react";
import { ArticleBody } from "@/components/article/ArticleBody";
import {
  API_LINE,
  CLOSING_LINE,
  ETHICS,
  ETHICS_AFTER_SLUG,
  GROUPS,
  INTRO_INDEX,
  INTRO_LEAD,
  INTRO_SAFE,
  pagesLabel,
  pdfHref,
  type Inline,
} from "./prototypeData";
import { PrototypeCtaBand, type Closing } from "./PrototypeShared";

// Variant A — "Plain Page": the copy as an editor would type it into a Sanity
// `page` body, fed to the real <ArticleBody>. Nothing here is new UI.

type BlockOpts = { style?: string; listItem?: "bullet" };

const block = (
  key: string,
  parts: Inline[],
  { style = "normal", listItem }: BlockOpts = {},
) => {
  const markDefs = parts.flatMap((p, i) =>
    typeof p !== "string" && p.href
      ? [{ _key: `${key}-l${i}`, _type: "link", href: p.href }]
      : [],
  );
  const children = parts.map((p, i) =>
    typeof p === "string"
      ? { _key: `${key}-s${i}`, _type: "span", text: p, marks: [] }
      : {
          _key: `${key}-s${i}`,
          _type: "span",
          text: p.text,
          marks: [
            ...(p.href ? [`${key}-l${i}`] : []),
            ...(p.strong ? ["strong"] : []),
          ],
        },
  );
  return {
    _key: key,
    _type: "block",
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  };
};

const fileAttachment = (slug: string, label: string, pages: number) => ({
  _key: `file-${slug}`,
  _type: "fileAttachment",
  label: `${label} (${pagesLabel(pages)})`,
  // shortcut: a `#pdf-…` href is dropped by <DownloadButton>'s safe-href
  // check, so the card renders without a link until real files exist.
  fileUrl: pdfHref(slug),
  fileMimeType: "application/pdf",
});

const buildBody = (showCode: boolean, closing: Closing) => [
  block("intro-1", INTRO_LEAD),
  block("intro-2", INTRO_SAFE),
  block("intro-api", API_LINE),
  block("intro-3", INTRO_INDEX),
  ...GROUPS.flatMap((group) => [
    block(`h2-${group.id}`, [group.title], { style: "h2" }),
    ...group.docs.flatMap((doc) => [
      block(`h3-${doc.slug}`, [doc.title], { style: "h3" }),
      block(`p-${doc.slug}`, doc.intro),
      fileAttachment(doc.slug, doc.label, doc.pages),
      ...(showCode && doc.slug === ETHICS_AFTER_SLUG
        ? [
            block("ethics-h", [ETHICS.title], { style: "h4" }),
            block("ethics-lead", [ETHICS.lead]),
            ...ETHICS.items.map((item, i) =>
              block(`ethics-${i}`, [item], { listItem: "bullet" }),
            ),
            block("ethics-after", [ETHICS.after]),
          ]
        : []),
    ]),
  ]),
  ...(closing === "line" ? [block("closing", CLOSING_LINE)] : []),
];

export const VariantAPrototype = ({
  showCode,
  closing,
}: {
  showCode: boolean;
  closing: Closing;
}) => (
  <>
    <ArticleBody
      className="article-body"
      // Same cast as club/[slug]/page.tsx does on the Sanity body.
      content={buildBody(showCode, closing) as PortableTextBlock[]}
    />
    {closing === "cta" ? <PrototypeCtaBand /> : null}
  </>
);
