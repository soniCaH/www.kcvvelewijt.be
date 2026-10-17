import type { Article } from "@/lib/sanity/sanity.types";
import {
  DEFAULT_EVENT_TYPE,
  EVENT_TYPE_FILL,
  type EventType,
} from "@/components/event/event-type-style";
import { TOKENS } from "../constants";

/** Schema-derived, so a new article type is a compile error in the table below. */
type ArticleType = NonNullable<Article["articleType"]>;

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
const ARTICLE_STYLE = {
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
} satisfies Record<ArticleType, TypeStyle>;

/**
 * Tailwind colour names `EVENT_TYPE_FILL` uses, as capture-safe literals:
 * html-to-image needs concrete values, not classes.
 */
const CLASS_COLOUR: Record<string, string> = {
  "jersey-deep": TOKENS.jerseyDeep,
  "jersey-bright": TOKENS.jerseyBright,
  warm: TOKENS.warm,
  ink: TOKENS.ink,
  cream: TOKENS.cream,
  white: "#ffffff",
};

/**
 * `"bg-warm text-ink"` → `{ fill, onFill }`, so the site's event colours have
 * one source. A re-tint to a colour missing above throws at module load (and
 * so in every test that imports this) instead of rendering a wrong story.
 */
function eventFill(fillClass: string): { fill: string; onFill: string } {
  const colour = (prefix: "bg" | "text") => {
    const name = fillClass.match(new RegExp(`\\b${prefix}-(\\S+)`))?.[1];
    const hex = name && CLASS_COLOUR[name];
    if (!hex) throw new Error(`share: no colour for "${fillClass}"`);
    return hex;
  };
  return { fill: colour("bg"), onFill: colour("text") };
}

/** Label per event type; fill from `EVENT_TYPE_FILL`; every event gets the date block. */
const EVENT_STYLE = {
  Clubevent: {
    label: "Clubevent",
    ...eventFill(EVENT_TYPE_FILL.Clubevent),
    detail: "dateblock",
  },
  Supportersactiviteit: {
    label: "Supporters",
    ...eventFill(EVENT_TYPE_FILL.Supportersactiviteit),
    detail: "dateblock",
  },
  Jeugdwerking: {
    label: "Jeugdwerking",
    ...eventFill(EVENT_TYPE_FILL.Jeugdwerking),
    detail: "dateblock",
  },
  Andere: {
    label: "Evenement",
    ...eventFill(EVENT_TYPE_FILL.Andere),
    detail: "dateblock",
  },
} satisfies Record<EventType, TypeStyle>;

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
  const style: TypeStyle =
    ARTICLE_STYLE[item.type as ArticleType] ?? ARTICLE_STYLE.announcement;
  return build(item, fields, style, null);
}

export function buildEventContent(
  item: ShareItem,
  fields: ShareFields,
): ShareContent {
  const style: TypeStyle =
    EVENT_STYLE[item.type as EventType] ?? EVENT_STYLE[DEFAULT_EVENT_TYPE];
  return build(item, fields, style, {
    src: EVENT_FALLBACK_IMAGE,
    source: "fallback",
    focal: { x: 0.5, y: 0.5 },
  });
}

type Maybe<T> = { [K in keyof T]: T[K] | null } | null;

/**
 * A Sanity cover as `ShareItem["cover"]`: the editor's crop applied as
 * `rect=` (in source pixels), and the hotspot moved into the cropped frame so
 * a look can position the picture on it. No URL → no cover.
 */
export function shareCover(row: {
  coverUrl: string | null;
  hotspot: Maybe<{ x: number; y: number }>;
  crop: Maybe<{ top: number; bottom: number; left: number; right: number }>;
  dimensions: Maybe<{ width: number; height: number }>;
}): ShareItem["cover"] {
  if (!row.coverUrl) return null;
  const x = row.hotspot?.x ?? 0.5;
  const y = row.hotspot?.y ?? 0.5;
  const left = row.crop?.left ?? 0;
  const right = row.crop?.right ?? 0;
  const top = row.crop?.top ?? 0;
  const bottom = row.crop?.bottom ?? 0;
  const width = row.dimensions?.width;
  const height = row.dimensions?.height;
  const cropped = left + right + top + bottom > 0;
  if (!cropped || !width || !height) {
    return { url: row.coverUrl, hotspot: { x, y } };
  }
  const fw = 1 - left - right;
  const fh = 1 - top - bottom;
  const rect = [left * width, top * height, fw * width, fh * height]
    .map(Math.round)
    .join(",");
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return {
    url: `${row.coverUrl}?rect=${rect}`,
    hotspot: { x: clamp((x - left) / fw), y: clamp((y - top) / fh) },
  };
}
