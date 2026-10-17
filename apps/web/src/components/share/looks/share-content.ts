import { TOKENS } from "../constants";

/**
 * `ShareContent` — the one view-model every share look renders (#3535). Looks
 * never read an article, an event or a match option; a builder turns each
 * source into this shape. Match moments get their builder in #3536.
 */

export type ShareContentKind = "match" | "article" | "event";

/** The one detail a type carries in every look (spec colour + detail tables). */
export type ShareDetail =
  "quote" | "none" | "arrow" | "dateblock" | "vs" | "whistle";

export interface TitleRun {
  text: string;
  /** The Sanity `accent` decorator: rendered italic in the accent colour. */
  accent: boolean;
}

export interface SharePhoto {
  /** Raw source URL — a look sizes and routes it at the `<img>` sink. */
  src: string;
  source: "own" | "cover" | "fallback";
  /** Sanity hotspot, 0..1 (centre when the cover has none). */
  focal: { x: number; y: number };
}

export interface ShareContent {
  kind: ShareContentKind;
  /** `articleType`, `eventType` or (#3536) the match `TemplateId`. */
  typeKey: string;
  /** The type word on the look's stamp / chip / plate. */
  label: string;
  fill: string;
  onFill: string;
  detail: ShareDetail;
  /** Mono kicker line above the title. */
  kicker: string;
  title: TitleRun[];
  /** Info lines under the title, e.g. `<date · hour>` then `<location>`. */
  info: string[];
  /** Day + short month for the date block. */
  dateBlock: { day: string; month: string };
  /** Squad badge (`A`, `U17`) — match stories only (#3536). */
  squad?: string;
  /** `null` = no picture of its own: the look fills the slot from its fallback set. */
  photo: SharePhoto | null;
}

/**
 * A news article or an event, already reduced to strings on the server (the
 * route formats every date in the club's zone, so the client never parses
 * one). Serialisable: it crosses the server → client boundary as a prop.
 */
export interface ShareItem {
  kind: "article" | "event";
  slug: string;
  /** `articleType` or `eventType`. */
  type: string;
  title: string;
  spans: TitleRun[];
  /** `zaterdag 18 oktober` */
  date: string;
  /** `14:00`, or `""` when the item has no hour. */
  time: string;
  location: string;
  day: string;
  month: string;
  cover: { url: string; hotspot: { x: number; y: number } } | null;
}

/** The editable text of a news or event story, prefilled from its item. */
export interface ShareFields {
  title: string;
  date: string;
  time: string;
  location: string;
}

export const fieldsOf = (item: ShareItem): ShareFields => ({
  title: item.title,
  date: item.date,
  time: item.time,
  location: item.location,
});

interface TypeStyle {
  label: string;
  fill: string;
  onFill: string;
  detail: ShareDetail;
}

/** Spec table "Article types" (#3509). */
const ARTICLE_STYLE: Record<string, TypeStyle> = {
  interview: {
    label: "Interview",
    fill: TOKENS.ink,
    onFill: TOKENS.cream,
    detail: "quote",
  },
  announcement: {
    label: "Mededeling",
    fill: TOKENS.cream,
    onFill: TOKENS.ink,
    detail: "none",
  },
  transfer: {
    label: "Transfer",
    fill: TOKENS.jerseyDeep,
    onFill: TOKENS.cream,
    detail: "arrow",
  },
  event: {
    label: "Evenement",
    fill: TOKENS.warm,
    onFill: TOKENS.ink,
    detail: "dateblock",
  },
  matchPreview: {
    label: "Voorbeschouwing",
    fill: TOKENS.jerseyDeepDark,
    onFill: TOKENS.cream,
    detail: "vs",
  },
  matchRecap: {
    label: "Matchverslag",
    fill: TOKENS.inkSoft,
    onFill: TOKENS.cream,
    detail: "whistle",
  },
};

/** The site's `EVENT_TYPE_FILL` as capture-safe literals; every event gets the date block. */
const EVENT_STYLE: Record<string, TypeStyle> = {
  Clubevent: {
    label: "Clubevent",
    fill: TOKENS.jerseyDeep,
    onFill: "#ffffff",
    detail: "dateblock",
  },
  Supportersactiviteit: {
    label: "Supporters",
    fill: TOKENS.warm,
    onFill: TOKENS.ink,
    detail: "dateblock",
  },
  Jeugdwerking: {
    label: "Jeugdwerking",
    fill: TOKENS.jerseyBright,
    onFill: TOKENS.ink,
    detail: "dateblock",
  },
  Andere: {
    label: "Evenement",
    fill: TOKENS.ink,
    onFill: TOKENS.cream,
    detail: "dateblock",
  },
};

/** A type colour on its own background vanishes: flip it to cream on ink text. */
export function unclash<T extends { fill: string; onFill: string }>(
  style: T,
  behind: string,
): T {
  return style.fill === behind
    ? { ...style, fill: TOKENS.cream, onFill: TOKENS.ink }
    : style;
}

export const EVENT_FALLBACK_IMAGE = "/images/event-fallback.jpg";

function build(
  item: ShareItem,
  fields: ShareFields,
  style: TypeStyle,
  noCover: SharePhoto | null,
): ShareContent {
  // An untouched title keeps its accent runs; an edited one is plain text.
  const title =
    fields.title === item.title && item.spans.length > 0
      ? item.spans
      : [{ text: fields.title, accent: false }];
  const when = [fields.date, fields.time].filter(Boolean).join(" · ");
  return {
    kind: item.kind,
    typeKey: item.type,
    ...style,
    kicker: style.label,
    title,
    info: [when, fields.location].filter(Boolean),
    dateBlock: { day: item.day, month: item.month },
    photo: item.cover
      ? {
          src: item.cover.url,
          source: "cover",
          focal: item.cover.hotspot,
        }
      : noCover,
  };
}

export function buildArticleContent(
  item: ShareItem,
  fields: ShareFields,
): ShareContent {
  const style = ARTICLE_STYLE[item.type] ?? ARTICLE_STYLE.announcement!;
  return build(item, fields, style, null);
}

export function buildEventContent(
  item: ShareItem,
  fields: ShareFields,
): ShareContent {
  const style = EVENT_STYLE[item.type] ?? EVENT_STYLE.Andere!;
  return build(item, fields, style, {
    src: EVENT_FALLBACK_IMAGE,
    source: "fallback",
    focal: { x: 0.5, y: 0.5 },
  });
}
