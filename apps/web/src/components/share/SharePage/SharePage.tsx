"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toPng } from "html-to-image";
import { GoalKcvvTemplate } from "../GoalKcvvTemplate/GoalKcvvTemplate";
import { GoalOpponentTemplate } from "../GoalOpponentTemplate/GoalOpponentTemplate";
import { KickoffTemplate } from "../KickoffTemplate/KickoffTemplate";
import { HalftimeTemplate } from "../HalftimeTemplate/HalftimeTemplate";
import { FullTimeTemplate } from "../FullTimeTemplate/FullTimeTemplate";
import { DisciplinaryCard } from "../shared/DisciplinaryCard";
import { SquarePreGameTemplate } from "../SquarePreGameTemplate/SquarePreGameTemplate";
import { SquareResultTemplate } from "../SquareResultTemplate/SquareResultTemplate";
import {
  CAPTURE_WIDTH,
  CAPTURE_HEIGHT,
  SQUARE_SIZE,
  TEMPLATE_SCALE,
} from "../constants";
import { ShareBadgeContext, ShareBlocksContext } from "../shared/ShareFrame";
import { shortSquadLabel, type ResultMood } from "../shared/theme";
import { EmptyState } from "@/components/design-system/EmptyState";
import { Input } from "@/components/design-system/Input/Input";
import {
  type RedesignIconProps,
  SoccerBall,
  Play,
  Timer,
  Flag,
  Square,
} from "@/lib/icons.redesign";
import type { ComponentType } from "react";
import { LOOKS } from "../looks/looks";
import { ShareSkeleton } from "./ShareSkeleton";
import { trackShareImageSaved } from "../share-analytics";
import { clubToday } from "@/lib/utils/dates";
import {
  fallbackCount,
  usesAiFallback,
  usesFallback,
  ShareThumbContext,
  type CoverMode,
  type ShareFormat,
  type ShareTheme,
  type WashStep,
} from "../looks/look-parts";
import {
  buildArticleContent,
  buildEventContent,
  buildMatchContent,
  fieldsOf,
  type ShareFields,
  type ShareItem,
  type TemplateId,
} from "../looks/share-content";
import {
  moveBlock,
  placeBlock,
  type BlockLayer,
  type BlockLayout,
} from "../looks/block-layout";
import {
  NO_BLOCKS,
  readSession,
  writeSession,
  type AnyLook,
  type ShareMode,
  type StorySession,
} from "./story-session";

export type Aspect = ShareFormat;
export type { ShareMode, TemplateId };

export interface PlayerForShare {
  id: string;
  firstName: string;
  lastName: string;
  number?: number;
  /** Sanity celebrationImage — second in the Goal KCVV image chain. */
  celebrationImageUrl?: string;
  /** Rectangular portrait (psdImage) — third in the Goal KCVV image chain. */
  psdImageUrl?: string;
}

/** Deliberately out of scope for the #2802 reservation/reduced union — staff-only, `noindex`, reads the raw contract `Match` directly; a KCVV-vs-KCVV `matchName` here is ugly, not wrong. */
export interface MatchOption {
  id: number;
  label: string;
  /** Formatted match name used as template prop, e.g. "KCVV Elewijt — FC Opponent" */
  matchName: string;
  competition?: string;
  /** Formatted kickoff line, e.g. "Zaterdag · 20:00". */
  dateTime?: string;
  homeLogo?: string;
  awayLogo?: string;
  /** Raw `Match.kcvv_team_label` (`"A-Ploeg"`, `"U21"`, …) — reduced to its
   *  compact badge form via `shortSquadLabel` before it prefills Ploeg. */
  kcvvTeamLabel?: string;
}

interface TemplateMeta {
  id: TemplateId;
  label: string;
  icon: ComponentType<RedesignIconProps>;
  iconClassName?: string;
  aspect: Aspect;
  requiresPlayer: boolean;
  requiresScore: boolean;
  requiresMinute: boolean;
  requiresMood: boolean;
  requiresCompetition: boolean;
  requiresDateTime: boolean;
  imageCapable: boolean;
}

const F = {
  player: false,
  score: false,
  minute: false,
  mood: false,
  competition: false,
  dateTime: false,
  image: false,
};

function meta(
  id: TemplateId,
  label: string,
  icon: ComponentType<RedesignIconProps>,
  aspect: Aspect,
  flags: Partial<typeof F>,
  iconClassName?: string,
): TemplateMeta {
  const f = { ...F, ...flags };
  return {
    id,
    label,
    icon,
    iconClassName,
    aspect,
    requiresPlayer: f.player,
    requiresScore: f.score,
    requiresMinute: f.minute,
    requiresMood: f.mood,
    requiresCompetition: f.competition,
    requiresDateTime: f.dateTime,
    imageCapable: f.image,
  };
}

const TEMPLATES: TemplateMeta[] = [
  meta("goal-kcvv", "Goal KCVV", SoccerBall, "story", {
    player: true,
    score: true,
    minute: true,
    image: true,
  }),
  meta("goal-opponent", "Goal Teg.", SoccerBall, "story", {
    score: true,
    minute: true,
    competition: true,
  }),
  meta("kickoff", "Aftrap", Play, "story", {
    competition: true,
    dateTime: true,
    image: true,
  }),
  meta("halftime", "Rust", Timer, "story", {
    score: true,
    competition: true,
    image: true,
  }),
  meta("full-time", "Eindstand", Flag, "story", {
    score: true,
    mood: true,
    competition: true,
    image: true,
  }),
  meta(
    "red-card-kcvv",
    "Rode Kaart KCVV",
    Square,
    "story",
    { player: true, minute: true },
    "fill-card-red text-card-red",
  ),
  meta(
    "red-card-opponent",
    "Rode Kaart Teg.",
    Square,
    "story",
    { minute: true },
    "fill-card-red text-card-red",
  ),
  meta(
    "yellow-card-kcvv",
    "Gele Kaart KCVV",
    Square,
    "story",
    { player: true, minute: true },
    "fill-warm text-warm",
  ),
  meta(
    "yellow-card-opponent",
    "Gele Kaart Teg.",
    Square,
    "story",
    { minute: true },
    "fill-warm text-warm",
  ),
  meta("square-pre-game", "Pre-game", Play, "square", {
    competition: true,
    dateTime: true,
    image: true,
  }),
  meta("square-result", "Eindstand 1:1", Flag, "square", {
    score: true,
    mood: true,
    competition: true,
    image: true,
  }),
];

export interface SharePageProps {
  matches: MatchOption[];
  players: PlayerForShare[];
  /** The 20 newest published articles (#3540); empty when the read failed. */
  articles?: ShareItem[];
  /** Upcoming events plus the last 7 days; empty when the read failed. */
  events?: ShareItem[];
  /** `/share?article=` / `?event=` deep link: opens that mode with the item
   *  picked, or on the empty picker when the slug is unknown (`item: null`). */
  initial?: { kind: "article" | "event"; item: ShareItem | null };
}

const NO_ITEMS: ShareItem[] = [];

const MODES: { value: ShareMode; label: string }[] = [
  { value: "match", label: "Wedstrijd" },
  { value: "article", label: "Nieuws" },
  { value: "event", label: "Evenement" },
];
const THEMES: { value: ShareTheme; label: string }[] = [
  { value: "licht", label: "Licht" },
  { value: "donker", label: "Donker" },
];
const WASH_STEPS: { value: WashStep; label: string }[] = [
  { value: "zacht", label: "Zacht" },
  { value: "normaal", label: "Normaal" },
  { value: "sterk", label: "Sterk" },
];
/** Where a story starts: a match photo is used as is, a news/event cover is
 *  usually a flyer. */
const defaultCover = (mode: ShareMode): CoverMode =>
  mode === "match" ? "foto" : "affiche_wazig";

/** Every look in rotation order; W draws matches only (#3535). */
const ALL_LOOKS: { id: AnyLook; name: string }[] = [
  ...LOOKS.map(({ id, name }) => ({ id, name })),
  { id: "wedstrijd", name: "W · Wedstrijd" },
];

const noSubscribe = () => () => {};

// Drag mode on the preview (#3537): no text selection, no iOS callout, no
// page scroll from a block (the page still scrolls from empty areas), and
// an outline only on the block being dragged.
const DRAG_CLASSES =
  "[&_[data-block]]:cursor-grab [&_[data-block]]:touch-none [&_[data-block]]:select-none [&_[data-block]]:[-webkit-touch-callout:none] [&_[data-dragging]]:outline-8 [&_[data-dragging]]:outline-offset-8 [&_[data-dragging]]:outline-dashed [&_[data-dragging]]:outline-card-red";

const LAYERS: { value: BlockLayer; label: string }[] = [
  { value: "voor", label: "Voor" },
  { value: "achter", label: "Achter" },
];

const COVER_MODES: { value: CoverMode; label: string }[] = [
  { value: "foto", label: "Foto" },
  { value: "affiche_wazig", label: "Affiche wazig" },
  { value: "reservefoto", label: "Reservefoto" },
];

/** One labelled row of mutually exclusive pressed buttons. */
function Choice<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-labelledby={id}>
      <h2
        id={id}
        className="text-ink mb-2 font-mono text-sm font-semibold uppercase"
      >
        {label}
      </h2>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            // The pressed option changes nothing (and keeps the kept PNG).
            onClick={() => opt.value !== value && onChange(opt.value)}
            disabled={disabled}
            aria-pressed={value === opt.value}
            className={`flex-1 basis-[6.5rem] rounded-none border-2 px-3 py-3 font-mono text-sm font-semibold uppercase transition-colors duration-300 disabled:opacity-40 ${
              value === opt.value
                ? "border-ink bg-jersey-deep text-cream"
                : "border-ink/30 text-ink hover:border-ink bg-cream"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const MOODS: { value: ResultMood; label: string }[] = [
  { value: "win", label: "Gewonnen" },
  { value: "draw", label: "Gelijkspel" },
  { value: "loss", label: "Verloren" },
];
const FORMATS: { value: Aspect; label: string }[] = [
  { value: "story", label: "Story · 9:16" },
  { value: "square", label: "Vierkant · 1:1" },
];

/** The bottom tab bar (#3538); `Schik` is drag mode. */
const TABS = ["Inhoud", "Stijl", "Tekst", "Schik"] as const;
type Tab = (typeof TABS)[number];

/** Width of a look-strip thumbnail, in screen pixels. */
const THUMB_WIDTH = 48;
const NO_LAYOUT: BlockLayout = {};

const FALLBACK_MATCH_NAME = "KCVV Elewijt — FC Tegenstander";
const FALLBACK_SCORE = "0 - 0";
const FALLBACK_MINUTE = "0";

/**
 * Which of the two client-initiated actions on this page failed — a
 * discriminant, not a message string carried up from a `catch` (#2818). The
 * caught error goes to the console only; the visitor sees exactly one of
 * these two locked Dutch sentences, identical for every cause, through
 * `<EmptyState tier="slot" reason="unavailable">` (the same failure-notice
 * register #2580 established at `CalendarSubscribePanel` and
 * `MembershipForm`'s transport catch).
 */
type ExportFailure = "generate" | "share";

const EXPORT_FAILURE_COPY: Record<ExportFailure, string> = {
  generate: "Exporteren mislukt. Probeer opnieuw.",
  share: "Delen mislukt. Probeer opnieuw.",
};

interface RenderOpts {
  matchName: string;
  score: string;
  minute: string;
  player: PlayerForShare | undefined;
  mood: ResultMood;
  competition?: string;
  dateTime?: string;
  homeLogo?: string;
  awayLogo?: string;
  imageUrl?: string;
}

function renderTemplate(id: TemplateId, o: RenderOpts): React.ReactNode {
  const playerName = o.player
    ? `${o.player.firstName} ${o.player.lastName}`
    : "";
  const shirtNumber = o.player?.number;
  const crests = { homeLogo: o.homeLogo, awayLogo: o.awayLogo };

  switch (id) {
    case "goal-kcvv":
      return (
        <GoalKcvvTemplate
          matchName={o.matchName}
          score={o.score}
          minute={o.minute}
          playerName={playerName}
          shirtNumber={shirtNumber}
          imageUrl={o.imageUrl}
          {...crests}
        />
      );
    case "goal-opponent":
      return (
        <GoalOpponentTemplate
          matchName={o.matchName}
          score={o.score}
          minute={o.minute}
          competition={o.competition}
          {...crests}
        />
      );
    case "kickoff":
      return (
        <KickoffTemplate
          matchName={o.matchName}
          competition={o.competition}
          dateTime={o.dateTime}
          imageUrl={o.imageUrl}
          {...crests}
        />
      );
    case "halftime":
      return (
        <HalftimeTemplate
          matchName={o.matchName}
          score={o.score}
          competition={o.competition}
          imageUrl={o.imageUrl}
          {...crests}
        />
      );
    case "full-time":
      return (
        <FullTimeTemplate
          matchName={o.matchName}
          score={o.score}
          mood={o.mood}
          competition={o.competition}
          imageUrl={o.imageUrl}
          {...crests}
        />
      );
    case "red-card-kcvv":
      return (
        <DisciplinaryCard
          kind="red"
          side="kcvv"
          matchName={o.matchName}
          minute={o.minute}
          playerName={playerName}
          shirtNumber={shirtNumber}
        />
      );
    case "red-card-opponent":
      return (
        <DisciplinaryCard
          kind="red"
          side="opponent"
          matchName={o.matchName}
          minute={o.minute}
        />
      );
    case "yellow-card-kcvv":
      return (
        <DisciplinaryCard
          kind="yellow"
          side="kcvv"
          matchName={o.matchName}
          minute={o.minute}
          playerName={playerName}
          shirtNumber={shirtNumber}
        />
      );
    case "yellow-card-opponent":
      return (
        <DisciplinaryCard
          kind="yellow"
          side="opponent"
          matchName={o.matchName}
          minute={o.minute}
        />
      );
    case "square-pre-game":
      return (
        <SquarePreGameTemplate
          matchName={o.matchName}
          competition={o.competition}
          dateTime={o.dateTime}
          imageUrl={o.imageUrl}
          {...crests}
        />
      );
    case "square-result":
      return (
        <SquareResultTemplate
          matchName={o.matchName}
          score={o.score}
          mood={o.mood}
          competition={o.competition}
          imageUrl={o.imageUrl}
          {...crests}
        />
      );
  }
}

/**
 * The tool restores the story in progress from browser storage, which the
 * server cannot see: render it only after hydration, so the first client
 * render already starts from the stored story instead of flashing defaults.
 */
export function SharePage(props: SharePageProps) {
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  // A tab left open past midnight starts a new story on its next edit: a
  // fresh ShareTool reads the session again, which drops yesterday's story.
  const [day, setDay] = useState(0);
  return hydrated ? (
    <ShareTool key={day} {...props} onNewDay={() => setDay((d) => d + 1)} />
  ) : (
    <ShareSkeleton />
  );
}

/**
 * The stored session for this render: a deep link to another item than the
 * stored one starts a new story (the per-phone look and fallback indexes
 * stay).
 */
function bootSession(initial: SharePageProps["initial"]): StorySession {
  const session = readSession();
  const story = session.story;
  if (
    initial &&
    story &&
    (story.mode !== initial.kind || story.itemSlug !== initial.item?.slug)
  ) {
    return { ...session, story: null };
  }
  return session;
}

function ShareTool({
  matches,
  players,
  articles = NO_ITEMS,
  events = NO_ITEMS,
  initial,
  onNewDay,
}: SharePageProps & { onNewDay: () => void }) {
  const [boot] = useState(() => bootSession(initial));
  const saved = boot.story;
  // The Brussels day this story belongs to: written as is, never re-dated.
  const storyDay = useRef(saved?.day ?? clubToday());
  const templateRef = useRef<HTMLDivElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const uploadUrlRef = useRef<string | null>(null);
  const isGeneratingRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFailure, setExportFailure] = useState<ExportFailure | null>(
    null,
  );
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  // The free space the preview is fitted into (#3538); null until measured.
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  // Every initial value comes from the stored story in progress (#3536).
  const [aspect, setAspect] = useState<Aspect>(saved?.format ?? "story");
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(
    saved?.template ?? "goal-kcvv",
  );

  // Session-persistent fields (survive template switches)
  const [matchName, setMatchName] = useState(saved?.match.name ?? "");
  const [score, setScore] = useState(saved?.match.score ?? "");
  const [competition, setCompetition] = useState(
    saved?.match.competition ?? "",
  );
  const [dateTime, setDateTime] = useState(saved?.match.dateTime ?? "");
  const [squad, setSquad] = useState(saved?.match.squad ?? "");
  // Disambiguates two matches that share a matchName (e.g. two KCVV squads vs
  // the same opponent club, or "KCVV Elewijt — KCVV Elewijt" placeholders).
  // Set only on an unambiguous datalist pick (by label); cleared on a miss so
  // a stale id can never outlive its pick.
  // The last match picked from the list: typing in the field nulls
  // `selectedMatchId`, so re-picking the same match must not read as "another".
  const lastPickedMatchIdRef = useRef<number | null>(saved?.match.id ?? null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(
    saved?.match.id ?? null,
  );

  // Template-specific fields (reset on template switch)
  const [minute, setMinute] = useState(saved?.match.minute ?? "");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    saved?.match.playerId ?? null,
  );
  const [mood, setMood] = useState<ResultMood>(saved?.match.mood ?? "win");
  const [playerSearch, setPlayerSearch] = useState("");

  // News and events (#3540)
  const [mode, setMode] = useState<ShareMode>(
    initial?.kind ?? saved?.mode ?? "match",
  );
  const [item, setItem] = useState<ShareItem | null>(() => {
    if (initial) return initial.item;
    if (!saved?.itemSlug) return null;
    const pool = saved.mode === "event" ? events : articles;
    return pool.find((i) => i.slug === saved.itemSlug) ?? null;
  });
  const [fields, setFields] = useState<ShareFields | null>(() =>
    // A stored item that is no longer listed takes its edits with it.
    item ? (saved?.fields ?? fieldsOf(item)) : null,
  );
  const [itemSearch, setItemSearch] = useState("");
  const [matchSearch, setMatchSearch] = useState("");
  // Nothing to preview yet (a news/event story without its item): start on
  // the picker.
  const [tab, setTab] = useState<Tab | null>(() =>
    mode !== "match" && !item ? "Inhoud" : null,
  );
  const [look, setLook] = useState<AnyLook>(boot.look);
  const [fallbackNext, setFallbackNext] = useState(boot.fallbackNext);
  const [theme, setTheme] = useState<ShareTheme>(saved?.theme ?? "licht");
  const [wash, setWash] = useState<WashStep>(saved?.wash ?? "normaal");
  const [coverMode, setCoverMode] = useState<CoverMode>(
    saved?.coverMode ?? defaultCover(mode),
  );

  // Manual photo upload (object URL)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Movable blocks (#3537): one layout per format.
  const [blocks, setBlocks] = useState(saved?.blocks ?? NO_BLOCKS);
  const dragMode = tab === "Schik";
  const [snap, setSnap] = useState(true);
  const [snapping, setSnapping] = useState(false);
  // The layout while a finger is down: drawn live, written to the session
  // (and so to storage) once, on pointer-up.
  const [dragLayout, setDragLayout] = useState<BlockLayout | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    el: HTMLElement;
    id: string;
    layout: BlockLayout;
    from: { x: number; y: number };
    cx: number;
    cy: number;
    centre: number;
  } | null>(null);
  const layout = dragLayout ?? blocks[aspect];
  /** The block moved last: Voor / Achter act on it. */
  const topBlock = Object.keys(layout).at(-1);

  // Drop a generated preview once it no longer matches the form, so the
  // Share/Download buttons can never emit a stale graphic. Also drops any
  // export failure notice: it can only ever describe the preview/blob this
  // same call just nulled (Generate clears it up front too — see
  // `handleGenerate`/`handleShare` — this is the field-change path), so a
  // failure notice can never outlive the Genereer/Delen button it refers to
  // (#2818 review finding 1).
  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setGeneratedBlob(null);
    setExportFailure(null);
  }, []);

  const clearUpload = useCallback(() => {
    if (uploadUrlRef.current) {
      URL.revokeObjectURL(uploadUrlRef.current);
      uploadUrlRef.current = null;
    }
    setUploadedImageUrl(null);
    clearPreview();
  }, [clearPreview]);

  const setLayout = (next: (prev: BlockLayout) => BlockLayout) => {
    setBlocks((prev) => ({ ...prev, [aspect]: next(prev[aspect]) }));
    clearPreview();
  };

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId)!;
  // Looks that can draw the story: A–E draw everything; W only matches, and
  // only in its own format (9 story templates, 2 square ones).
  const fittingLooks = ALL_LOOKS.filter(
    (l) =>
      l.id !== "wedstrijd" ||
      (mode === "match" && currentTemplate.aspect === aspect),
  );
  const activeLook = fittingLooks.some((l) => l.id === look)
    ? look
    : fittingLooks[0]!.id;
  const isW = activeLook === "wedstrijd";
  const visibleTemplates = isW
    ? TEMPLATES.filter((t) => t.aspect === aspect)
    : TEMPLATES;
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  // An id from an unambiguous datalist pick wins over the (possibly
  // colliding) matchName lookup; free-typed input has no id, so it falls
  // back to the old best-effort matchName match.
  const selectedMatch =
    (selectedMatchId != null &&
      matches.find((m) => m.id === selectedMatchId)) ||
    matches.find((m) => m.matchName === matchName);

  // Prefill competition + kickoff line + squad when a known match is picked
  // (handled in the change event, not an effect — the data flows from one
  // input to others). The datalist option value is `m.label` (unique — it
  // carries the squad suffix, e.g. "(A-Ploeg)"), so two squads meeting the
  // same opponent never collide here even though their `matchName` does.
  // On a hit, `matchName` is set to the clean club-names-only matchup so the
  // suffix never reaches the canvas.
  const handleMatchNameChange = (value: string) => {
    const pickedByLabel = matches.find((m) => m.label === value);
    const lastPicked = lastPickedMatchIdRef.current;
    if (
      pickedByLabel &&
      lastPicked != null &&
      pickedByLabel.id !== lastPicked
    ) {
      // Another match is another story: drop the last one's moment details.
      setScore("");
      setMinute("");
      setSelectedPlayerId(null);
      setMood("win");
      setBlocks(NO_BLOCKS);
    }
    if (pickedByLabel) {
      lastPickedMatchIdRef.current = pickedByLabel.id;
      setMatchName(pickedByLabel.matchName);
      setSelectedMatchId(pickedByLabel.id);
      setCompetition(pickedByLabel.competition ?? "");
      setDateTime(pickedByLabel.dateTime ?? "");
      setSquad(shortSquadLabel(pickedByLabel.kcvvTeamLabel) ?? "");
      clearPreview();
      return;
    }

    setMatchName(value);
    setSelectedMatchId(null);
    const picked = matches.find((m) => m.matchName === value);
    if (picked) {
      setCompetition(picked.competition ?? "");
      setDateTime(picked.dateTime ?? "");
      setSquad(shortSquadLabel(picked.kcvvTeamLabel) ?? "");
    }
    clearPreview();
  };

  const filteredPlayers = playerSearch
    ? players.filter((p) => {
        const full = `${p.firstName} ${p.lastName}`.toLowerCase();
        const reversed = `${p.lastName} ${p.firstName}`.toLowerCase();
        const q = playerSearch.toLowerCase();
        return full.includes(q) || reversed.includes(q);
      })
    : players;

  const resetTemplateFields = () => {
    setMinute("");
    setSelectedPlayerId(null);
    setMood("win");
    setPlayerSearch("");
    clearPreview();
  };

  const handleTemplateChange = (id: TemplateId) => {
    if (id === selectedTemplateId) return;
    setSelectedTemplateId(id);
    setBlocks(NO_BLOCKS);
    resetTemplateFields();
  };

  const handleAspectChange = (next: Aspect) => {
    if (next === aspect) return;
    setAspect(next);
    // A–E draw every template in both formats; W keeps today's swap.
    if (isW) {
      setSelectedTemplateId(
        next === "square" ? "square-pre-game" : "goal-kcvv",
      );
      setBlocks(NO_BLOCKS);
      resetTemplateFields();
    } else {
      clearPreview();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    const url = URL.createObjectURL(file);
    uploadUrlRef.current = url;
    setUploadedImageUrl(url);
    clearPreview();
    // Reset the input so re-picking the same file still fires onChange.
    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    };
  }, []);

  // Resolve the image for the current template. Goal KCVV walks the full chain;
  // other image-capable templates use only the manual upload. Looks A–E have
  // a photo slot on every template.
  const photoCapable = currentTemplate.imageCapable || !isW;
  const resolvedImageUrl = useMemo(() => {
    if (!photoCapable) return undefined;
    if (selectedTemplateId === "goal-kcvv") {
      return (
        uploadedImageUrl ??
        selectedPlayer?.celebrationImageUrl ??
        selectedPlayer?.psdImageUrl ??
        undefined
      );
    }
    return uploadedImageUrl ?? undefined;
  }, [photoCapable, selectedTemplateId, uploadedImageUrl, selectedPlayer]);

  // A deep-linked item outside the list still shows up in its picker.
  const pool = mode === "article" ? articles : events;
  const items =
    initial?.item &&
    initial.kind === mode &&
    !pool.some((i) => i.slug === initial.item!.slug)
      ? [initial.item, ...pool]
      : pool;
  const query = itemSearch.trim().toLowerCase();
  const filteredItems = query
    ? items.filter((i) => i.title.toLowerCase().includes(query))
    : items;
  // Built for W too: the look strip draws A–E beside it.
  const storyContent =
    mode === "match"
      ? buildMatchContent({
          template: selectedTemplateId,
          matchName: matchName || FALLBACK_MATCH_NAME,
          score: score || FALLBACK_SCORE,
          minute: minute || FALLBACK_MINUTE,
          mood,
          competition: competition.trim() || undefined,
          dateTime: dateTime.trim() || undefined,
          homeLogo: selectedMatch?.homeLogo,
          awayLogo: selectedMatch?.awayLogo,
          squad: shortSquadLabel(squad),
          playerName: selectedPlayer
            ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}`
            : undefined,
          photo: resolvedImageUrl,
        })
      : item && fields
        ? (item.kind === "article" ? buildArticleContent : buildEventContent)(
            item,
            fields,
          )
        : null;
  // Omslag only chooses how a cover is shown: an item without one already
  // fills its slot with the fallback picture, and an own photo replaces it.
  const showOmslag = !!item?.cover && !uploadedImageUrl;
  // An own photo replaces a news or event cover.
  const content =
    storyContent && mode !== "match" && uploadedImageUrl
      ? {
          ...storyContent,
          photo: {
            src: uploadedImageUrl,
            source: "own" as const,
            focal: { x: 0.5, y: 0.5 },
          },
        }
      : storyContent;

  // Keep the story in progress in the browser (#3536). The own photo is a
  // `blob:` URL that dies with the tab, so it is never stored.
  useEffect(() => {
    if (clubToday() !== storyDay.current) {
      onNewDay();
      return;
    }
    writeSession({
      look,
      fallbackNext,
      story: {
        day: storyDay.current,
        mode,
        template: selectedTemplateId,
        format: aspect,
        theme,
        wash,
        coverMode,
        match: {
          id: selectedMatchId,
          name: matchName,
          score,
          competition,
          dateTime,
          squad,
          minute,
          playerId: selectedPlayerId,
          mood,
        },
        itemSlug: item?.slug ?? null,
        fields,
        blocks,
      },
    });
  }, [
    look,
    fallbackNext,
    mode,
    selectedTemplateId,
    aspect,
    theme,
    wash,
    coverMode,
    selectedMatchId,
    matchName,
    score,
    competition,
    dateTime,
    squad,
    minute,
    selectedPlayerId,
    mood,
    item,
    fields,
    blocks,
    onNewDay,
  ]);

  /**
   * A PNG left the tool (shared, or its download clicked): the next story
   * starts on the next fitting look, the next fallback picture of this look,
   * and the default Omslag. The match details stay. It is also the one
   * place `share_image_saved` fires (#3539).
   */
  const handleSaved = () => {
    trackShareImageSaved({
      mode,
      itemType: item?.type ?? null,
      template: selectedTemplateId,
      look: activeLook,
      theme,
      wash,
      format: aspect,
      coverMode: showOmslag ? coverMode : null,
      blocks: blocks[aspect],
      fallbackUsed: !!content && !isW && usesFallback(content, coverMode),
    });
    if (content && !isW && usesAiFallback(content, coverMode)) {
      setFallbackNext((prev) => ({
        ...prev,
        [activeLook]: ((prev[activeLook] ?? 0) + 1) % fallbackCount(activeLook),
      }));
    }
    const at = fittingLooks.findIndex((l) => l.id === activeLook);
    setLook(fittingLooks[(at + 1) % fittingLooks.length]!.id);
    setCoverMode(defaultCover(mode));
    setBlocks(NO_BLOCKS);
    // The PNG on screen is the saved story, not the next one. Its object
    // URL is revoked a beat later: a download may still be reading it.
    const url = previewUrlRef.current;
    previewUrlRef.current = null;
    setGeneratedBlob(null);
    if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /** The URL names the story on screen, so a reload (iOS, back from
   *  Instagram) restores it instead of the link the tool opened with. */
  const keepUrl = (search: string) =>
    window.history.replaceState(window.history.state, "", `/share${search}`);

  const handleModeChange = (next: ShareMode) => {
    if (next === mode) return;
    keepUrl("");
    setMode(next);
    clearUpload();
    setItem(null);
    setBlocks(NO_BLOCKS);
    setFields(null);
    setItemSearch("");
    setCoverMode(defaultCover(next));
    clearPreview();
  };

  const handlePickItem = (picked: ShareItem) => {
    // Re-tapping the picked item keeps its edits.
    if (picked.slug === item?.slug) return;
    keepUrl(`?${picked.kind}=${encodeURIComponent(picked.slug)}`);
    setBlocks(NO_BLOCKS);
    clearUpload();
    setItem(picked);
    setFields(fieldsOf(picked));
    setCoverMode("affiche_wazig");
    clearPreview();
  };

  // Drag a block (#3537): the offset is the pointer delta since pointer-down
  // over the preview scale; the drag outline is a data attribute that lives
  // only between pointer-down and pointer-up, so no capture can include it.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const node = templateRef.current;
    const el =
      e.target instanceof Element
        ? e.target.closest<HTMLElement>("[data-block]")
        : null;
    // One finger drags; a second one is ignored until the first lifts. No
    // drag while a capture runs: the PNG would mix two layouts.
    if (
      isGeneratingRef.current ||
      dragRef.current ||
      !dragMode ||
      !node ||
      !el ||
      !node.contains(el)
    )
      return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const id = el.dataset.block!;
    const at = layout[id] ?? { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const canvas = node.getBoundingClientRect();
    // Touching a block brings it on top, and Voor / Achter act on it.
    const start = placeBlock(layout, id, at);
    dragRef.current = {
      pointerId: e.pointerId,
      el,
      id,
      layout: start,
      from: { x: at.x, y: at.y },
      cx: e.clientX,
      cy: e.clientY,
      centre: (rect.left + rect.width / 2 - canvas.left) / scale,
    };
    el.dataset.dragging = "";
    setDragLayout(start);
    clearPreview();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const next = moveBlock({
      from: d.from,
      dx: e.clientX - d.cx,
      dy: e.clientY - d.cy,
      scale,
      centre: d.centre,
      width: captureWidth,
      snap,
    });
    d.layout = placeBlock(d.layout, d.id, next);
    setSnapping(next.snapped);
    setDragLayout(d.layout);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    delete d.el.dataset.dragging;
    dragRef.current = null;
    setSnapping(false);
    setDragLayout(null);
    setLayout(() => d.layout);
  };

  const fileName =
    mode === "match"
      ? `kcvv-${selectedTemplateId}.png`
      : `kcvv-${activeLook}-${item?.slug ?? mode}.png`;

  const captureWidth = aspect === "square" ? SQUARE_SIZE : CAPTURE_WIDTH;
  const captureHeight = aspect === "square" ? SQUARE_SIZE : CAPTURE_HEIGHT;

  // Fit the preview into the space the layout leaves it (#3538); the drag
  // handlers divide by the same scale, so a finger moves a block 1:1.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    // Measured once before paint, then on every resize (a tab opening, the
    // look strip hiding, a rotation).
    if (el.clientWidth > 0) setBox({ w: el.clientWidth, h: el.clientHeight });
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry)
        setBox({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // The preview's 2 px border sits outside the canvas, on both sides.
  const scale = box
    ? Math.max(
        0.05,
        Math.min((box.w - 4) / captureWidth, (box.h - 4) / captureHeight),
      )
    : TEMPLATE_SCALE;

  const canShareFiles = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({
        files: [new File([], "test.png", { type: "image/png" })],
      }),
    [],
  );

  /** The PNG of the story on screen: two captures, the first thrown away. */
  const capture = async (node: HTMLDivElement): Promise<Blob> => {
    // The drag outline belongs to the screen, never to the PNG.
    node
      .querySelectorAll<HTMLElement>("[data-dragging]")
      .forEach((el) => delete el.dataset.dragging);
    const opts = {
      width: captureWidth,
      height: captureHeight,
      pixelRatio: 1,
      // html-to-image's resource cache strips the query string from its key
      // by default, so every `/_next/image?url=…` collapses onto ONE entry —
      // the first image captured then gets reused for every later one (the
      // previous scorer's portrait, an opponent crest blown up fullscreen).
      includeQueryParams: true,
    };
    // ponytail: iOS Safari rasterizes the foreignObject before the nested
    // data-URL images finish decoding, so the first capture drops them (the
    // crest comes out white). Throw the warm-up away, keep the second.
    await toPng(node, opts);
    const dataUrl = await toPng(node, opts);
    const blob = await (await fetch(dataUrl)).blob();
    previewUrlRef.current = URL.createObjectURL(blob);
    setGeneratedBlob(blob);
    return blob;
  };

  /**
   * Bewaar PNG (#3538): make the PNG and open the share sheet in one tap, or
   * download it where sharing files is not possible. A PNG whose share was
   * cancelled or refused is kept until the story changes, so the next tap
   * ("Deel PNG") reopens the sheet at once, with a fresh tap. The panel,
   * look strip and preview are inert while it runs, so the PNG is the story
   * that was on screen when Bewaar PNG was tapped.
   */
  const handleSave = async () => {
    const node = templateRef.current;
    // Mid-drag the layout is not committed yet: the PNG would mix two.
    if (!node || isGeneratingRef.current || dragRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    // Clear any stale notice up front, so a retry that now succeeds leaves
    // none behind and a repeat failure is announced again (#2818).
    setExportFailure(null);
    try {
      // The caught errors go to the console only — the visitor sees the
      // locked Dutch copy, never the error's own text (#2818, mirrors #2580
      // rule 6).
      const blob =
        generatedBlob ??
        (await capture(node).catch((err: unknown) => {
          console.error("[SharePage] Failed to generate:", err);
          setExportFailure("generate");
          return null;
        }));
      if (!blob) return;
      if (!canShareFiles) {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = previewUrlRef.current ?? "";
        link.click();
        handleSaved();
        return;
      }
      const file = new File([blob], fileName, { type: "image/png" });
      const shared = await navigator.share({ files: [file] }).then(
        () => true,
        (err: unknown) => {
          // Cancelled, or refused by iOS because the tap's user activation
          // expired during the captures: no failure, the kept PNG and a
          // fresh tap ("Deel PNG") share it.
          const quiet =
            err instanceof Error &&
            (err.name === "AbortError" || err.name === "NotAllowedError");
          if (!quiet) {
            console.error("[SharePage] Failed to share:", err);
            setExportFailure("share");
          }
          return false;
        },
      );
      if (shared) handleSaved();
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  };

  const labelClass =
    "font-mono text-sm font-semibold uppercase tracking-wide text-ink";
  // `tight`: the tab bar, five buttons across a 320 px phone.
  const chipClass = (on: boolean, tight = false) =>
    `flex min-h-12 items-center justify-center rounded-none border-2 font-mono font-semibold ${
      tight ? "min-w-0 flex-1 px-0.5 text-xs" : "px-3 py-2 text-sm"
    } uppercase transition-colors duration-300 disabled:opacity-40 ${
      on
        ? "border-ink bg-jersey-deep text-cream"
        : "border-ink/30 text-ink hover:border-ink bg-cream"
    }`;
  const optionClass = (on: boolean) =>
    `flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left font-mono text-sm transition-colors ${
      on ? "bg-jersey-deep/10 text-jersey-deep" : "text-ink hover:bg-cream-soft"
    }`;
  const listClass =
    "border-ink/30 bg-cream max-h-48 overflow-y-auto rounded-none border-2";
  const previewWidth = captureWidth * scale;
  const previewHeight = captureHeight * scale;
  const hasStory = mode === "match" || content !== null;
  const matchQuery = matchSearch.trim().toLowerCase();
  const filteredMatches = matchQuery
    ? matches.filter((m) => m.label.toLowerCase().includes(matchQuery))
    : matches;

  /** One look drawn with this story: the preview and every thumbnail. */
  const drawLook = (id: AnyLook, blockLayout: BlockLayout | null) => {
    const look = LOOKS.find((l) => l.id === id);
    if (look) {
      return (
        content && (
          <look.Component
            content={content}
            format={aspect}
            theme={theme}
            wash={wash}
            coverMode={coverMode}
            blocks={blockLayout ?? NO_LAYOUT}
            fallbackIndex={fallbackNext[look.id] ?? 0}
          />
        )
      );
    }
    return (
      <ShareBadgeContext.Provider value={shortSquadLabel(squad)}>
        <ShareBlocksContext.Provider value={blockLayout}>
          {renderTemplate(selectedTemplateId, {
            matchName: matchName || FALLBACK_MATCH_NAME,
            score: score || FALLBACK_SCORE,
            minute: minute || FALLBACK_MINUTE,
            player: selectedPlayer,
            mood,
            competition: competition.trim() || undefined,
            dateTime: dateTime.trim() || undefined,
            // Raw URLs — the templates route remote images through the
            // same-origin optimizer + sanitize at the <img> sink.
            homeLogo: selectedMatch?.homeLogo,
            awayLogo: selectedMatch?.awayLogo,
            imageUrl: resolvedImageUrl,
          })}
        </ShareBlocksContext.Provider>
      </ShareBadgeContext.Provider>
    );
  };

  /** A labelled text field of the Tekst tab. */
  const field = (
    id: string,
    label: string,
    value: string,
    set: (value: string) => void,
    extra: React.ComponentProps<typeof Input> = {},
  ) => (
    <div key={id}>
      <label htmlFor={id} className={`${labelClass} mb-2 block`}>
        {label}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          set(e.target.value);
          clearPreview();
        }}
        {...extra}
      />
    </div>
  );

  const inhoud = (
    <>
      <Choice
        id="mode-label"
        label="Soort"
        options={MODES}
        value={mode}
        onChange={handleModeChange}
      />

      {mode === "match" ? (
        <>
          {/* Type-to-search, never a bare dropdown: a datalist or a select
              is a scroll wheel on an iPhone. */}
          <div>
            <h2 id="match-label" className={`${labelClass} mb-2`}>
              Wedstrijd
            </h2>
            <Input
              value={matchSearch}
              onChange={(e) => setMatchSearch(e.target.value)}
              placeholder="Zoek op ploeg…"
              aria-label="Zoek wedstrijd"
              className="mb-2"
            />
            <div className={listClass} role="group" aria-label="Wedstrijden">
              {filteredMatches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={selectedMatchId === m.id}
                  // The unique label (it carries the squad suffix) resolves
                  // back to the clean club-names-only matchup. Re-tapping
                  // the picked match keeps its edits.
                  onClick={() =>
                    selectedMatchId !== m.id && handleMatchNameChange(m.label)
                  }
                  className={optionClass(selectedMatchId === m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-labelledby="template-picker-label">
            <h2 id="template-picker-label" className={`${labelClass} mb-2`}>
              Moment
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {visibleTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTemplateChange(t.id)}
                  aria-pressed={selectedTemplateId === t.id}
                  className={`flex min-h-[72px] flex-col items-center gap-1 rounded-none border-2 p-2 font-mono text-sm font-semibold transition-colors duration-300 ${
                    selectedTemplateId === t.id
                      ? "border-ink bg-jersey-deep/10 text-jersey-deep"
                      : "border-ink/30 text-ink hover:border-ink bg-cream"
                  }`}
                >
                  <t.icon
                    className={`size-5 ${t.iconClassName ?? ""}`}
                    aria-hidden="true"
                  />
                  <span className="text-center leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <h2 id="item-label" className={`${labelClass} mb-2`}>
              {mode === "article" ? "Artikel" : "Evenement"}
            </h2>
            <Input
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Zoek op titel…"
              aria-label={
                mode === "article" ? "Zoek artikel" : "Zoek evenement"
              }
              className="mb-2"
            />
            <div
              className={listClass}
              role="group"
              aria-label={mode === "article" ? "Artikels" : "Evenementen"}
            >
              {filteredItems.map((i) => (
                <button
                  key={i.slug}
                  type="button"
                  aria-pressed={item?.slug === i.slug}
                  onClick={() => handlePickItem(i)}
                  className={optionClass(item?.slug === i.slug)}
                >
                  {i.title}
                </button>
              ))}
            </div>
          </div>

          {showOmslag && (
            <Choice
              id="cover-label"
              label="Omslag"
              options={COVER_MODES}
              value={coverMode}
              onChange={(next) => {
                setCoverMode(next);
                clearPreview();
              }}
            />
          )}
        </>
      )}

      {/* Own photo — every template in A–E, the image-capable ones in W. */}
      {photoCapable && (
        <div className="flex gap-2">
          <label className={`${chipClass(false)} flex-1 cursor-pointer`}>
            {uploadedImageUrl ? "Andere foto…" : "Eigen foto…"}
            {/* No `capture` attr → iOS/Android surface Photo Library / Camera / Files */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              aria-label="Foto uploaden"
              className="sr-only"
            />
          </label>
          {uploadedImageUrl && (
            <button
              type="button"
              onClick={clearUpload}
              className={`${chipClass(false)} flex-1`}
            >
              Foto weghalen
            </button>
          )}
        </div>
      )}
    </>
  );

  const stijl = (
    <>
      {/* W keeps its own dark wash per moment: no theme or wash to choose. */}
      {!isW && (
        <Choice
          id="theme-label"
          label="Thema"
          options={THEMES}
          value={theme}
          onChange={(next) => {
            setTheme(next);
            clearPreview();
          }}
        />
      )}
      {activeLook === "affiche" && (
        <Choice
          id="wash-label"
          label="Waas"
          options={WASH_STEPS}
          value={wash}
          onChange={(next) => {
            setWash(next);
            clearPreview();
          }}
        />
      )}
      <Choice
        id="aspect-label"
        label="Formaat"
        options={FORMATS}
        value={aspect}
        onChange={handleAspectChange}
      />
    </>
  );

  const tekst =
    mode === "match" ? (
      <>
        <div>
          <label htmlFor="match-input" className={`${labelClass} mb-2 block`}>
            Wedstrijd
          </label>
          {/* Typing a list label here still resolves to its match. */}
          <Input
            id="match-input"
            value={matchName}
            onChange={(e) => handleMatchNameChange(e.target.value)}
            placeholder={FALLBACK_MATCH_NAME}
          />
        </div>
        {field("squad-input", "Ploeg", squad, setSquad, {
          placeholder: "A",
          // The badge has no auto-fit (locked design — see #2700); the
          // longest real label is 4 chars ("U13A"), so 6 leaves it room to
          // spare while still bounding the canvas-width overflow risk.
          maxLength: 6,
        })}
        {currentTemplate.requiresScore &&
          field("score-input", "Stand", score, setScore, {
            placeholder: "2 - 0",
          })}
        {currentTemplate.requiresMinute &&
          field("minute-input", "Minuut", minute, setMinute, {
            placeholder: "45+2",
          })}
        {currentTemplate.requiresCompetition &&
          field(
            "competition-input",
            "Competitie",
            competition,
            setCompetition,
            {
              placeholder: "2e Provinciale",
            },
          )}
        {currentTemplate.requiresDateTime &&
          field("datetime-input", "Datum & uur", dateTime, setDateTime, {
            placeholder: "Zaterdag · 20:00",
          })}
        {currentTemplate.requiresPlayer && (
          <div>
            <h2 id="player-label" className={`${labelClass} mb-2`}>
              Speler
            </h2>
            <Input
              id="player-search-input"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Zoek op naam…"
              aria-label="Zoek speler"
              className="mb-2"
            />
            <div className={listClass} role="group" aria-label="Spelers">
              {filteredPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={selectedPlayerId === p.id}
                  onClick={() => {
                    if (p.id === selectedPlayerId) return;
                    setSelectedPlayerId(p.id);
                    clearPreview();
                  }}
                  className={optionClass(selectedPlayerId === p.id)}
                >
                  <span className="min-w-[2rem] text-center text-lg font-bold">
                    {p.number ?? "—"}
                  </span>
                  <span>
                    {p.lastName} {p.firstName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {currentTemplate.requiresMood && (
          <Choice
            id="mood-label"
            label="Stemming"
            options={MOODS}
            value={mood}
            onChange={(next) => {
              setMood(next);
              clearPreview();
            }}
          />
        )}
      </>
    ) : (
      fields &&
      (
        [
          { key: "title", label: "Titel" },
          { key: "date", label: "Datum" },
          { key: "time", label: "Uur" },
          { key: "location", label: "Locatie" },
        ] as const
      ).map((f) =>
        field(`share-${f.key}`, f.label, fields[f.key], (value) =>
          setFields((prev) => prev && { ...prev, [f.key]: value }),
        ),
      )
    );

  const schik = (
    <>
      <p className="text-ink font-mono text-sm">
        Sleep een tekstblok in de preview.
      </p>
      <Choice
        id="layer-label"
        label="Laatst verschoven blok"
        options={LAYERS}
        value={topBlock ? layout[topBlock]!.layer : "voor"}
        disabled={!topBlock}
        onChange={(layer) =>
          topBlock &&
          setLayout((prev) => ({
            ...prev,
            [topBlock]: { ...prev[topBlock]!, layer },
          }))
        }
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSnap(!snap)}
          aria-pressed={snap}
          className={`${chipClass(snap)} flex-1`}
        >
          Midden
        </button>
        <button
          type="button"
          onClick={() => setLayout(() => ({}))}
          disabled={!topBlock}
          className={`${chipClass(false)} flex-1`}
        >
          Alles terugzetten
        </button>
      </div>
    </>
  );

  return (
    // A full-screen layer over the site chrome (#3538): at the pitch the tool
    // is the whole screen. globals.css hides the site header and footer
    // while `#share-tool` is on the page.
    <div
      id="share-tool"
      className="bg-cream text-ink fixed inset-0 z-[55] flex flex-col"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-3 pb-2">
          <div
            ref={boxRef}
            className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
          >
            {/* aria-hidden: the live template is a visual artifact (it owns
                its own <h1>/crest alts). */}
            {hasStory ? (
              <div
                aria-hidden="true"
                data-testid="share-preview"
                inert={isGenerating}
                style={{
                  width: `${previewWidth}px`,
                  height: `${previewHeight}px`,
                  overflow: "hidden",
                  position: "relative",
                  flex: "none",
                }}
                className={`border-ink box-content border-2 ${dragMode ? DRAG_CLASSES : ""}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onLostPointerCapture={endDrag}
                onDragStart={(e) => e.preventDefault()}
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <div ref={templateRef}>{drawLook(activeLook, layout)}</div>
                </div>
                {/* Outside the captured node: the centre guide never reaches the PNG. */}
                {snapping && (
                  <div
                    data-testid="share-centre-guide"
                    className="bg-card-red absolute inset-y-0 w-px"
                    // The canvas centre, measured from the padding edge.
                    style={{ left: previewWidth / 2 - 0.5 }}
                  />
                )}
              </div>
            ) : (
              <p className="font-mono text-sm">
                Kies een {mode === "article" ? "artikel" : "evenement"} in
                Inhoud.
              </p>
            )}
          </div>
        </div>

        {/* Tier 2, no action (#2818, mirrors #2580 rule 4): Bewaar PNG
            survives this failure and is its own retry, so a second control
            here would be redundant. `clearPreview` nulls the failure on any
            change, so the notice never outlives the story it describes. */}
        {exportFailure && (
          <div className="px-4 pb-2">
            <EmptyState
              tier="slot"
              reason="unavailable"
              live
              emphasis={{ text: "mislukt" }}
            >
              {EXPORT_FAILURE_COPY[exportFailure]}
            </EmptyState>
          </div>
        )}

        {tab && (
          <div
            id="share-panel"
            role="region"
            aria-label={tab}
            inert={isGenerating}
            className="border-ink bg-cream-soft flex max-h-[44dvh] flex-col gap-4 overflow-y-auto border-t-2 p-4"
          >
            {tab === "Inhoud" && inhoud}
            {tab === "Stijl" && stijl}
            {tab === "Tekst" && tekst}
            {tab === "Schik" && schik}
          </div>
        )}

        {/* Drag mode gives the strip's room back to the preview; unmounted,
            not hidden, so its thumbnails cost nothing while dragging. */}
        {tab !== "Schik" && (
          <div
            role="group"
            aria-label="Look"
            inert={isGenerating}
            className="border-paper-edge flex [scrollbar-width:none] gap-2 overflow-x-auto border-t px-2 pt-2"
          >
            {fittingLooks.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  // The active look: nothing changes, the kept PNG stays.
                  if (l.id === activeLook) return;
                  setBlocks(NO_BLOCKS);
                  setLook(l.id);
                  clearPreview();
                }}
                aria-pressed={activeLook === l.id}
                className={`flex flex-none flex-col items-center gap-1 border-[3px] p-0.5 ${
                  activeLook === l.id
                    ? "border-jersey-deep"
                    : "border-transparent"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none overflow-hidden"
                  style={{
                    width: THUMB_WIDTH,
                    height: (captureHeight * THUMB_WIDTH) / captureWidth,
                  }}
                >
                  <div
                    style={{
                      width: captureWidth,
                      transform: `scale(${THUMB_WIDTH / captureWidth})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <ShareThumbContext.Provider value={true}>
                      {drawLook(l.id, l.id === activeLook ? layout : null)}
                    </ShareThumbContext.Provider>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold whitespace-nowrap uppercase">
                  {l.name}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1.5 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(tab === t ? null : t)}
              aria-expanded={tab === t}
              aria-controls={tab === t ? "share-panel" : undefined}
              className={chipClass(tab === t, true)}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={handleSave}
            disabled={isGenerating || !hasStory}
            className="bg-jersey-deep border-jersey-deep text-cream flex min-h-12 min-w-0 flex-[1.6] items-center justify-center rounded-none border-2 px-2 font-mono text-sm font-bold uppercase disabled:opacity-40"
          >
            {isGenerating
              ? "Bezig…"
              : generatedBlob
                ? "Deel PNG"
                : "Bewaar PNG"}
          </button>
        </div>
      </div>
    </div>
  );
}
