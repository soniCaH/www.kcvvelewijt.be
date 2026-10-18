/**
 * The cashless terms move from Drupal to a Sanity `page` (#3569). Pure: the
 * HTML → Portable Text conversion, the new document and the `cashless` patch
 * are built here so the dry run and the write judge the same data and a test
 * can pin them.
 *
 * The new page's slug is its whole path (`cashless/voorwaarden`): the sitemap,
 * `/inhoud` and the revalidate webhook build `/club/${slug}` already, and
 * `apps/web/src/app/(main)/club/cashless/voorwaarden/page.tsx` serves it.
 */
import { TERMS_HTML, TERMS_TITLE } from "./terms";

export const TERMS_ID = "page-cashless-voorwaarden";
export const TERMS_SLUG = "cashless/voorwaarden";
export const TERMS_HREF = `/club/${TERMS_SLUG}`;
export const CASHLESS_ID = "page-cashless";

export interface Span {
  _key: string;
  _type: "span";
  marks: string[];
  text: string;
}
export interface LinkDef {
  _key: string;
  _type: "link";
  href: string;
}
export interface Block {
  _key: string;
  _type: "block";
  style: "normal" | "h2";
  markDefs: LinkDef[];
  children: Span[];
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&#39;": "'",
};

/** Decodes the few entities the Drupal export uses; any other one is a stop. */
function decode(text: string): string {
  return text.replace(/&[#\w]+;/g, (e) => {
    const decoded = ENTITIES[e];
    if (decoded === undefined) throw new Error(`Unhandled HTML entity ${e}`);
    return decoded;
  });
}

/**
 * Converts the Drupal body (`<h2>`, `<p>`, `<a href>` and nothing else) to
 * Portable Text, text untouched. Any other tag throws — the terms must come
 * across verbatim, never half-converted. A paragraph holding only `&nbsp;` is
 * Drupal's trailing spacer and is dropped.
 */
export function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const blockRe = /<(h2|p)>([\s\S]*?)<\/\1>/g;
  const leftover = html.replace(blockRe, "").trim();
  if (leftover) throw new Error(`Unparsed HTML outside h2/p: ${leftover}`);

  let n = 0;
  for (const [, tag, inner] of html.matchAll(blockRe)) {
    if (inner!.replace(/&nbsp;|\s/g, "") === "") continue;
    const block: Block = {
      _key: `t${++n}`,
      _type: "block",
      style: tag === "h2" ? "h2" : "normal",
      markDefs: [],
      children: [],
    };
    const push = (text: string, marks: string[] = []) => {
      if (!text) return;
      block.children.push({
        _key: `${block._key}s${block.children.length + 1}`,
        _type: "span",
        marks,
        text,
      });
    };
    let at = 0;
    for (const m of inner!.matchAll(/<a href="([^"]*)">([^<]*)<\/a>/g)) {
      push(decode(inner!.slice(at, m.index)));
      const key = `${block._key}l${block.markDefs.length + 1}`;
      block.markDefs.push({ _key: key, _type: "link", href: decode(m[1]!) });
      push(decode(m[2]!), [key]);
      at = m.index + m[0].length;
    }
    push(decode(inner!.slice(at)));
    if (/<[^>]+>/.test(block.children.map((c) => c.text).join(""))) {
      throw new Error(`Unhandled tag in ${block._key}: ${inner}`);
    }
    blocks.push(block);
  }
  return blocks;
}

export interface TermsPage {
  _id: string;
  _type: "page";
  title: string;
  slug: { _type: "slug"; current: string };
  body: Block[];
}

export function buildTermsPage(): TermsPage {
  return {
    _id: TERMS_ID,
    _type: "page",
    title: TERMS_TITLE,
    slug: { _type: "slug", current: TERMS_SLUG },
    body: htmlToBlocks(TERMS_HTML),
  };
}

export interface CashlessDoc {
  _id: string;
  _rev: string;
  body?: (Partial<Block> & { _key: string; _type: string })[] | null;
}

/** The clause the page carries today; the patch refuses if it reads otherwise. */
const OLD_LEAD =
  "De volledige algemene voorwaarden van de cashless clubkaart zijn beschikbaar aan de toog of op aanvraag via ";
const NEW_LEAD = [
  "De volledige ",
  "algemene voorwaarden",
  " van de cashless clubkaart lees je online. Een papieren exemplaar is beschikbaar aan de toog of op aanvraag via ",
] as const;

const textOf = (b: { children?: Span[] }) =>
  (b.children ?? []).map((c) => c.text).join("");

export interface CashlessPatch {
  id: string;
  rev: string;
  blockKey: string;
  before: string;
  after: string;
  /** The whole replacement block, `set` at `body[_key=="…"]`. */
  block: Block;
}

/**
 * Points the "Algemene voorwaarden" paragraph at the new page: the words
 * "algemene voorwaarden" become the link and the "at the bar / on request"
 * clause becomes a paper-copy clause. The mail link and the rest stay.
 * Returns `null` when the paragraph already links there (a re-run).
 */
export function buildCashlessPatch(doc: CashlessDoc): CashlessPatch | null {
  const blocks = (doc.body ?? []).filter(
    (b): b is Block => b._type === "block",
  );
  if (blocks.some((b) => b.markDefs?.some((d) => d.href === TERMS_HREF))) {
    return null;
  }
  const block = blocks.find((b) => textOf(b).startsWith(OLD_LEAD));
  if (!block) {
    throw new Error(
      `${doc._id}: no paragraph starts with "${OLD_LEAD}" — it was edited; update the script.`,
    );
  }
  const [lead, ...rest] = block.children;
  if (!lead || lead.text !== OLD_LEAD) {
    throw new Error(
      `${doc._id}: the lead of ${block._key} is split over spans.`,
    );
  }
  const linkKey = `${block._key}-terms`;
  const children: Span[] = [
    { ...lead, text: NEW_LEAD[0] },
    {
      _key: `${lead._key}-terms`,
      _type: "span",
      marks: [linkKey],
      text: NEW_LEAD[1],
    },
    { _key: `${lead._key}-rest`, _type: "span", marks: [], text: NEW_LEAD[2] },
    ...rest,
  ];
  const next: Block = {
    ...block,
    markDefs: [
      ...block.markDefs,
      { _key: linkKey, _type: "link", href: TERMS_HREF },
    ],
    children,
  };
  return {
    id: doc._id,
    rev: doc._rev,
    blockKey: block._key,
    before: textOf(block),
    after: textOf(next),
    block: next,
  };
}

/** What the read found, so `preflight` can refuse before anything is planned. */
export interface Snapshot {
  cashless: CashlessDoc | null;
  /** Ids (drafts, versions, the published twin) already holding the new slug or id. */
  existingTerms: string[];
  /** `drafts.*` copies of the two documents touched. */
  drafts: string[];
}

export function preflight(snap: Snapshot): string[] {
  const errors: string[] = [];
  if (!snap.cashless) {
    errors.push(
      `${CASHLESS_ID} not found — wrong dataset, or a tokenless read of a private dataset (returns nothing, no error).`,
    );
  }
  if (snap.existingTerms.length > 0) {
    errors.push(
      `The terms page already exists (${snap.existingTerms.join(", ")}) — nothing to create.`,
    );
  }
  if (snap.drafts.length > 0) {
    errors.push(
      `Draft copies exist (${snap.drafts.join(", ")}) — publish or discard them first, a draft would be published over this write.`,
    );
  }
  return errors;
}
