import type { Article } from "@/lib/sanity/sanity.types";
import {
  DEFAULT_EVENT_TYPE,
  EVENT_TYPE_FILL,
  type EventType,
} from "@/components/event/event-type-style";
import { TOKENS } from "../constants";
import {
  formatScore,
  opponentName,
  resolveCrests,
  splitMatchName,
  type CrestEntry,
  type ResultMood,
} from "../shared/theme";

/** Schema-derived, so a new article type is a compile error in the table below. */
type ArticleType = NonNullable<Article["articleType"]>;

/**
 * `ShareContent` — the one view-model every share look renders (#3535). Looks
 * never read an article, an event or a match option; a builder turns each
 * source into this shape.
 */

/** A match moment: today's 11 templates, the key of every match story. */
export const TEMPLATE_IDS = [
  "goal-kcvv",
  "goal-opponent",
  "kickoff",
  "halftime",
  "full-time",
  "red-card-kcvv",
  "red-card-opponent",
  "yellow-card-kcvv",
  "yellow-card-opponent",
  "square-pre-game",
  "square-result",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type ShareContentKind = "match" | "article" | "event";

/** The one detail a type carries in every look (spec colour + detail tables). */
export type ShareDetail =
  | "quote"
  | "none"
  | "arrow"
  | "dateblock"
  | "vs"
  | "whistle"
  /** Match moments (#3536): the `45'` stamp, the minute disc (with or
   *  without the ball) and the disciplinary card with its minute. */
  | "halftime"
  | "minuteBall"
  | "minute"
  | "card";

/** The match block: both crests before kick-off, the score after. */
export type MatchHero =
  { kind: "crests"; crests: CrestEntry[] } | { kind: "score"; score: string };

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
  /** Squad badge (`A`, `U17`) — match stories only. */
  squad?: string;
  /** Match stories only: the hero block, the minute, the card colour. */
  hero?: MatchHero;
  minute?: string;
  card?: "yellow" | "red";
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

/** The literal for `"bg-warm text-ink"`'s `bg` or `text` colour, if listed above. */
export function eventColour(
  fillClass: string,
  prefix: "bg" | "text",
): string | undefined {
  const name = fillClass.match(new RegExp(`\\b${prefix}-(\\S+)`))?.[1];
  return name ? CLASS_COLOUR[name] : undefined;
}

/**
 * `"bg-warm text-ink"` → `{ fill, onFill }`, so the site's event colours have
 * one source. A re-tint to a colour missing above draws ink on cream; a test
 * asserts every `EVENT_TYPE_FILL` value resolves.
 */
function eventFill(fillClass: string): { fill: string; onFill: string } {
  return {
    fill: eventColour(fillClass, "bg") ?? TOKENS.ink,
    onFill: eventColour(fillClass, "text") ?? TOKENS.cream,
  };
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

/** What a match story is made of: the form's fields, already resolved. */
export interface MatchMomentInput {
  template: TemplateId;
  matchName: string;
  score: string;
  minute: string;
  mood: ResultMood;
  competition?: string;
  /** Free text, e.g. `Zaterdag · 20:00`. */
  dateTime?: string;
  homeLogo?: string;
  awayLogo?: string;
  squad?: string;
  playerName?: string;
  /** The editor's own upload or the scorer's photo; none → the look's fallback. */
  photo?: string;
}

/** Spec table "Match moments" — a first pass, the owner tunes it in Storybook. */
const MOMENT_STYLE = {
  kickoff: {
    label: "Aftrap",
    fill: TOKENS.jerseyDeepDark,
    onFill: TOKENS.cream,
    detail: "dateblock",
  },
  halftime: {
    label: "Rust",
    fill: TOKENS.inkSoft,
    onFill: TOKENS.cream,
    detail: "halftime",
  },
  win: {
    label: "Eindstand",
    fill: TOKENS.warm,
    onFill: TOKENS.ink,
    detail: "whistle",
  },
  result: {
    label: "Eindstand",
    fill: TOKENS.ink,
    onFill: TOKENS.cream,
    detail: "whistle",
  },
  goal: {
    label: "Goal",
    fill: TOKENS.jerseyDeep,
    onFill: TOKENS.cream,
    detail: "minuteBall",
  },
  against: {
    label: "Tegengoal",
    fill: TOKENS.cream,
    onFill: TOKENS.ink,
    detail: "minute",
  },
  yellow: {
    label: "Gele kaart",
    fill: TOKENS.warm,
    onFill: TOKENS.ink,
    detail: "card",
  },
  red: {
    label: "Rode kaart",
    fill: TOKENS.brick,
    onFill: TOKENS.cream,
    detail: "card",
  },
} satisfies Record<string, TypeStyle>;

const MOMENT_OF: Record<
  TemplateId,
  (mood: ResultMood) => keyof typeof MOMENT_STYLE
> = {
  kickoff: () => "kickoff",
  "square-pre-game": () => "kickoff",
  halftime: () => "halftime",
  "full-time": (mood) => (mood === "win" ? "win" : "result"),
  "square-result": (mood) => (mood === "win" ? "win" : "result"),
  "goal-kcvv": () => "goal",
  "goal-opponent": () => "against",
  "yellow-card-kcvv": () => "yellow",
  "yellow-card-opponent": () => "yellow",
  "red-card-kcvv": () => "red",
  "red-card-opponent": () => "red",
};

const isKcvv = (name: string) => /kcvv/i.test(name);

export function buildMatchContent(m: MatchMomentInput): ShareContent {
  const moment = MOMENT_OF[m.template](m.mood);
  const style: TypeStyle = MOMENT_STYLE[moment];
  const kickoff = moment === "kickoff";
  // `Zaterdag · 20:00` → block `20:00` over `Zaterdag`; no hour → no block.
  // The hour is the last one after the `·` (`Za 18.10 · 20:00` is not 18:10);
  // without a `·` there is no day part.
  const parts = m.dateTime?.split("·") ?? [];
  const hour = [...(parts.at(-1) ?? "").matchAll(/(\d{1,2})[:.hu](\d{2})/g)].at(
    -1,
  );
  const day = parts.length > 1 ? parts[0]!.trim() : undefined;
  const detail = kickoff && !hour ? "none" : style.detail;

  const ours = m.template.endsWith("-kcvv");
  const theirs = m.template.endsWith("-opponent");
  const { home, away } = splitMatchName(m.matchName);
  const title: TitleRun[] = ours
    ? [{ text: m.playerName || "KCVV Elewijt", accent: false }]
    : theirs
      ? [{ text: opponentName(m.matchName), accent: false }]
      : [
          { text: home, accent: isKcvv(home) },
          ...(away
            ? [
                { text: " — ", accent: false },
                { text: away, accent: isKcvv(away) },
              ]
            : []),
        ];

  return {
    kind: "match",
    typeKey: m.template,
    ...style,
    detail,
    kicker: style.label,
    title,
    info: [
      ours || theirs ? m.matchName : "",
      kickoff ? (m.dateTime ?? "") : "",
      m.competition ?? "",
    ].filter(Boolean),
    dateBlock: hour
      ? {
          day: `${hour[1]!.padStart(2, "0")}:${hour[2]}`,
          month: day || "Aftrap",
        }
      : { day: "", month: "" },
    squad: m.squad,
    hero: kickoff
      ? {
          kind: "crests",
          crests: resolveCrests(m.matchName, m.homeLogo, m.awayLogo),
        }
      : moment === "yellow" || moment === "red"
        ? undefined
        : { kind: "score", score: formatScore(m.score) },
    minute: m.minute,
    card: moment === "yellow" || moment === "red" ? moment : undefined,
    photo: m.photo
      ? { src: m.photo, source: "own", focal: { x: 0.5, y: 0.5 } }
      : null,
  };
}
