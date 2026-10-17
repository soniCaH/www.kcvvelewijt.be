import {
  fallbackCount,
  type CoverMode,
  type LookId,
  type ShareFormat,
  type ShareTheme,
  type WashStep,
} from "../looks/look-parts";
import type { ShareFields, TemplateId } from "../looks/share-content";
import type { ResultMood } from "../shared/theme";
import { clubToday } from "@/lib/utils/dates";

/**
 * The story session (#3535): the one place `/share` keeps anything in the
 * browser, under one key. iOS Safari reloads the tab after a trip to
 * Instagram; this is what brings the story in progress back.
 *
 * - `look` and `fallbackNext` are per phone and kept across days.
 * - `story` is the story in progress; it holds only for the Europe/Brussels
 *   day it was written on.
 *
 * Every read and write swallows storage errors: a missing, full, blocked or
 * corrupt store is a fresh start, never a crash. Later slices add fields to
 * `StoryInProgress` (the block layout, #3537).
 */

export const STORY_SESSION_KEY = "kcvv-share-session";

/** A share look, including today's match templates (W Wedstrijd). */
export type AnyLook = LookId | "wedstrijd";
export type ShareMode = "match" | "article" | "event";

export interface MatchDetails {
  /** The picked match option, `null` for a free-typed matchup. */
  id: number | null;
  name: string;
  score: string;
  competition: string;
  dateTime: string;
  squad: string;
  minute: string;
  playerId: string | null;
  mood: ResultMood;
}

export interface StoryInProgress {
  /** `YYYY-MM-DD` in Europe/Brussels: another day is another story. */
  day: string;
  mode: ShareMode;
  template: TemplateId;
  format: ShareFormat;
  theme: ShareTheme;
  wash: WashStep;
  coverMode: CoverMode;
  match: MatchDetails;
  /** The picked article or event, and its edited text. */
  itemSlug: string | null;
  fields: ShareFields | null;
}

export interface StorySession {
  look: AnyLook;
  /** Per look, the index of the next fallback picture. */
  fallbackNext: Partial<Record<LookId, number>>;
  story: StoryInProgress | null;
}

export const FRESH_SESSION: StorySession = {
  look: "kaart",
  fallbackNext: {},
  story: null,
};

/** The looks with an AI fallback set (W draws its own poster). */
const SET_LOOKS: readonly LookId[] = ["kaart", "plakboek", "affiche", "ticket"];

const LOOK_IDS: readonly AnyLook[] = [
  "kaart",
  "plakboek",
  "affiche",
  "ticket",
  "wedstrijd",
];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const TEMPLATE_IDS: readonly TemplateId[] = [
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
];

/** `v` when it is one of `allowed`, else `fallback`. */
function oneOf<T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.find((a) => a === v) ?? fallback;
}
const text = (v: unknown) => (typeof v === "string" ? v : "");

/** A stored story, every field checked: whatever is off falls back to the default. */
function storyOf(s: Record<string, unknown>): StoryInProgress {
  const m = isObject(s.match) ? s.match : {};
  const f = isObject(s.fields) ? s.fields : null;
  return {
    day: text(s.day),
    mode: oneOf(s.mode, ["match", "article", "event"], "match"),
    template: oneOf(s.template, TEMPLATE_IDS, "goal-kcvv"),
    format: oneOf(s.format, ["story", "square"], "story"),
    theme: oneOf(s.theme, ["licht", "donker"], "licht"),
    wash: oneOf(s.wash, ["zacht", "normaal", "sterk"], "normaal"),
    coverMode: oneOf(
      s.coverMode,
      ["foto", "affiche_wazig", "reservefoto"],
      "foto",
    ),
    match: {
      id: typeof m.id === "number" ? m.id : null,
      name: text(m.name),
      score: text(m.score),
      competition: text(m.competition),
      dateTime: text(m.dateTime),
      squad: text(m.squad),
      minute: text(m.minute),
      playerId: typeof m.playerId === "string" ? m.playerId : null,
      mood: oneOf(m.mood, ["win", "draw", "loss"], "win"),
    },
    itemSlug: typeof s.itemSlug === "string" ? s.itemSlug : null,
    fields: f && {
      title: text(f.title),
      date: text(f.date),
      time: text(f.time),
      location: text(f.location),
    },
  };
}

/**
 * Today's session: yesterday's story dropped, the per-phone parts kept. The
 * day is checked here, at read: a tab left open across midnight keeps
 * yesterday's story until it reloads.
 */
export function readSession(): StorySession {
  try {
    const raw: unknown = JSON.parse(
      window.localStorage.getItem(STORY_SESSION_KEY) ?? "null",
    );
    if (!isObject(raw)) return FRESH_SESSION;
    const look = LOOK_IDS.find((l) => l === raw.look) ?? "kaart";
    const stored = isObject(raw.fallbackNext) ? raw.fallbackNext : {};
    const fallbackNext: StorySession["fallbackNext"] = {};
    for (const id of SET_LOOKS) {
      const n = stored[id];
      if (Number.isInteger(n) && (n as number) >= 0) {
        fallbackNext[id] = (n as number) % fallbackCount(id);
      }
    }
    const story =
      isObject(raw.story) && raw.story.day === clubToday()
        ? storyOf(raw.story)
        : null;
    return { look, fallbackNext, story };
  } catch {
    return FRESH_SESSION;
  }
}

export function writeSession(session: StorySession): void {
  try {
    window.localStorage.setItem(STORY_SESSION_KEY, JSON.stringify(session));
  } catch {
    // A full or blocked store only costs the reload restore.
  }
}
