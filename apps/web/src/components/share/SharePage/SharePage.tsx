"use client";

import {
  useCallback,
  useEffect,
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
import { Button } from "@/components/design-system/Button/Button";
import { EmptyState } from "@/components/design-system/EmptyState";
import { Input } from "@/components/design-system/Input/Input";
import { Select } from "@/components/design-system/Select/Select";
import { PageContainer } from "@/components/design-system/PageContainer";
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
import { clubToday } from "@/lib/utils/dates";
import {
  fallbackCount,
  usesAiFallback,
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
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="text-ink mb-3 font-mono text-sm font-semibold uppercase"
      >
        {label}
      </h2>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
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
    </section>
  );
}

const RESULT_MOODS: readonly ResultMood[] = ["win", "draw", "loss"];
function isResultMood(value: string): value is ResultMood {
  return (RESULT_MOODS as readonly string[]).includes(value);
}

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
  return hydrated ? <ShareTool {...props} /> : <ShareSkeleton />;
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
}: SharePageProps) {
  const [boot] = useState(() => bootSession(initial));
  const saved = boot.story;
  const templateRef = useRef<HTMLDivElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const uploadUrlRef = useRef<string | null>(null);
  const isGeneratingRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFailure, setExportFailure] = useState<ExportFailure | null>(
    null,
  );
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
  const [dragMode, setDragMode] = useState(false);
  const [snap, setSnap] = useState(true);
  const [snapping, setSnapping] = useState(false);
  const dragRef = useRef<{
    el: HTMLElement;
    id: string;
    from: { x: number; y: number };
    cx: number;
    cy: number;
    centre: number;
  } | null>(null);
  const layout = blocks[aspect];
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
    setPreviewUrl(null);
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
  const content = isW
    ? null
    : mode === "match"
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
  const Look = LOOKS.find((l) => l.id === activeLook)?.Component;
  const fallbackIndex = isW ? 0 : (fallbackNext[activeLook] ?? 0);

  // Keep the story in progress in the browser (#3536). The own photo is a
  // `blob:` URL that dies with the tab, so it is never stored.
  useEffect(() => {
    writeSession({
      look,
      fallbackNext,
      story: {
        day: clubToday(),
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
  ]);

  /**
   * A PNG left the tool (shared, or its download clicked): the next story
   * starts on the next fitting look, the next fallback picture of this look,
   * and the default Omslag. The match details stay.
   */
  const handleSaved = () => {
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
    setPreviewUrl(null);
    if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleModeChange = (next: ShareMode) => {
    if (next === mode) return;
    setMode(next);
    setItem(null);
    setBlocks(NO_BLOCKS);
    setFields(null);
    setItemSearch("");
    setCoverMode(defaultCover(next));
    clearPreview();
  };

  const handlePickItem = (picked: ShareItem) => {
    if (picked.slug !== item?.slug) setBlocks(NO_BLOCKS);
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
    if (!dragMode || !node || !el || !node.contains(el)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const id = el.dataset.block!;
    const at = layout[id] ?? { x: 0, y: 0 };
    const box = el.getBoundingClientRect();
    const canvas = node.getBoundingClientRect();
    dragRef.current = {
      el,
      id,
      from: { x: at.x, y: at.y },
      cx: e.clientX,
      cy: e.clientY,
      centre: (box.left + box.width / 2 - canvas.left) / TEMPLATE_SCALE,
    };
    el.dataset.dragging = "";
    // Touching a block brings it on top, and Voor / Achter act on it.
    setLayout((prev) => placeBlock(prev, id, at));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const next = moveBlock({
      from: d.from,
      dx: e.clientX - d.cx,
      dy: e.clientY - d.cy,
      scale: TEMPLATE_SCALE,
      centre: d.centre,
      width: captureWidth,
      snap,
    });
    setSnapping(next.snapped);
    setLayout((prev) => placeBlock(prev, d.id, next));
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (!d) return;
    delete d.el.dataset.dragging;
    dragRef.current = null;
    setSnapping(false);
  };

  const fileName =
    mode === "match"
      ? `kcvv-${selectedTemplateId}.png`
      : `kcvv-${look}-${item?.slug ?? mode}.png`;

  const captureWidth = aspect === "square" ? SQUARE_SIZE : CAPTURE_WIDTH;
  const captureHeight = aspect === "square" ? SQUARE_SIZE : CAPTURE_HEIGHT;

  const handleGenerate = async () => {
    if (!templateRef.current || isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setExportFailure(null);
    clearPreview();
    try {
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
      await toPng(templateRef.current, opts);
      const dataUrl = await toPng(templateRef.current, opts);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setGeneratedBlob(blob);
      setPreviewUrl(url);
    } catch (err) {
      // The caught error goes to the console only — the visitor sees the
      // locked Dutch copy below, never the error's own text (#2818, mirrors
      // #2580 rule 6).
      console.error("[SharePage] Failed to generate:", err);
      setExportFailure("generate");
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  };

  const canShareFiles = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({
        files: [new File([], "test.png", { type: "image/png" })],
      }),
    [],
  );

  const handleShare = async () => {
    if (!generatedBlob) return;
    // Clear any stale notice from a previous share attempt up front — the
    // same "clear on entry" `handleGenerate` already does — so a retry that
    // now succeeds doesn't leave the old failure notice on screen, and a
    // repeat failure is a real null→"share" state transition (re-announced
    // to assistive tech) rather than a same-value bailout (#2818 review
    // finding 1).
    setExportFailure(null);
    const file = new File([generatedBlob], fileName, {
      type: "image/png",
    });
    try {
      await navigator.share({ files: [file] });
      handleSaved();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // The caught error goes to the console only — the visitor sees the
      // locked Dutch copy below, never the error's own text (#2818, mirrors
      // #2580 rule 6).
      console.error("[SharePage] Failed to share:", err);
      setExportFailure("share");
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.download = fileName;
    link.href = previewUrl;
    link.click();
    handleSaved();
  };

  const labelClass =
    "font-mono text-sm font-semibold uppercase tracking-wide text-ink";
  const previewWidth = captureWidth * TEMPLATE_SCALE;
  const previewHeight = captureHeight * TEMPLATE_SCALE;

  return (
    <PageContainer width="prose" className="flex flex-col gap-6 py-8">
      <h1 className="font-display text-ink text-4xl font-black">
        Story Generator
      </h1>

      <Choice
        id="mode-label"
        label="Soort"
        options={MODES}
        value={mode}
        onChange={handleModeChange}
      />

      {/* ── Aspect toggle ───────────────────────────────────────────── */}
      <section aria-labelledby="aspect-label">
        <h2 id="aspect-label" className={`${labelClass} mb-3`}>
          Formaat
        </h2>
        <div className="flex gap-2">
          {(
            [
              { value: "story", label: "Story · 9:16" },
              { value: "square", label: "Vierkant · 1:1" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleAspectChange(opt.value)}
              aria-pressed={aspect === opt.value}
              className={`flex-1 rounded-none border-2 px-4 py-3 font-mono text-sm font-semibold tracking-wide uppercase transition-colors duration-300 ${
                aspect === opt.value
                  ? "border-ink bg-jersey-deep text-cream"
                  : "border-ink/30 text-ink hover:border-ink bg-cream"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {mode === "match" && (
        <>
          {/* ── Template Picker ─────────────────────────────────────────── */}
          <section aria-labelledby="template-picker-label">
            <h2 id="template-picker-label" className={`${labelClass} mb-3`}>
              Template
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {visibleTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTemplateChange(t.id)}
                  aria-pressed={selectedTemplateId === t.id}
                  className={`flex min-h-[72px] flex-col items-center gap-1 rounded-none border-2 p-3 font-mono text-sm font-semibold transition-colors duration-300 ${
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
          </section>

          {/* ── Match combo-box — always visible ────────────────────────── */}
          <section aria-labelledby="match-label">
            <label
              id="match-label"
              htmlFor="match-input"
              className={`${labelClass} mb-2 block`}
            >
              Wedstrijd
            </label>
            <Input
              id="match-input"
              list="match-options"
              value={matchName}
              onChange={(e) => handleMatchNameChange(e.target.value)}
              placeholder={FALLBACK_MATCH_NAME}
            />
            <datalist id="match-options">
              {matches.map((m) => (
                // value is the unique label (carries the squad suffix, e.g.
                // "(A-Ploeg)") so two matches sharing a matchName never collide;
                // handleMatchNameChange resolves it back to the clean matchup.
                <option key={m.id} value={m.label}>
                  {m.label}
                </option>
              ))}
            </datalist>
          </section>

          {/* ── Ploeg — always visible ──────────────────────────────────── */}
          <section aria-labelledby="squad-label">
            <label
              id="squad-label"
              htmlFor="squad-input"
              className={`${labelClass} mb-2 block`}
            >
              Ploeg
            </label>
            <Input
              id="squad-input"
              value={squad}
              onChange={(e) => {
                setSquad(e.target.value);
                clearPreview();
              }}
              placeholder="A"
              // The badge has no auto-fit (locked design — see #2700); the
              // longest real label is 4 chars ("U13A"), so 6 leaves it room to
              // spare while still bounding the canvas-width overflow risk.
              maxLength={6}
            />
          </section>

          {/* ── Score ───────────────────────────────────────────────────── */}
          {currentTemplate.requiresScore && (
            <section aria-labelledby="score-label">
              <label
                id="score-label"
                htmlFor="score-input"
                className={`${labelClass} mb-2 block`}
              >
                Score
              </label>
              <Input
                id="score-input"
                value={score}
                onChange={(e) => {
                  setScore(e.target.value);
                  clearPreview();
                }}
                placeholder="2 - 0"
              />
            </section>
          )}

          {/* ── Minute ──────────────────────────────────────────────────── */}
          {currentTemplate.requiresMinute && (
            <section aria-labelledby="minute-label">
              <label
                id="minute-label"
                htmlFor="minute-input"
                className={`${labelClass} mb-2 block`}
              >
                Minuut
              </label>
              <Input
                id="minute-input"
                value={minute}
                onChange={(e) => {
                  setMinute(e.target.value);
                  clearPreview();
                }}
                placeholder="45+2"
              />
            </section>
          )}

          {/* ── Competition ─────────────────────────────────────────────── */}
          {currentTemplate.requiresCompetition && (
            <section aria-labelledby="competition-label">
              <label
                id="competition-label"
                htmlFor="competition-input"
                className={`${labelClass} mb-2 block`}
              >
                Competitie
              </label>
              <Input
                id="competition-input"
                value={competition}
                onChange={(e) => {
                  setCompetition(e.target.value);
                  clearPreview();
                }}
                placeholder="2e Provinciale"
              />
            </section>
          )}

          {/* ── Date / time ─────────────────────────────────────────────── */}
          {currentTemplate.requiresDateTime && (
            <section aria-labelledby="datetime-label">
              <label
                id="datetime-label"
                htmlFor="datetime-input"
                className={`${labelClass} mb-2 block`}
              >
                Datum &amp; uur
              </label>
              <Input
                id="datetime-input"
                value={dateTime}
                onChange={(e) => {
                  setDateTime(e.target.value);
                  clearPreview();
                }}
                placeholder="Zaterdag · 20:00"
              />
            </section>
          )}

          {/* ── Player search ───────────────────────────────────────────── */}
          {currentTemplate.requiresPlayer && (
            <section aria-labelledby="player-label">
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
              <div
                className="border-ink/30 max-h-48 overflow-y-auto rounded-none border-2"
                role="listbox"
                aria-label="Spelers"
              >
                {filteredPlayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={selectedPlayerId === p.id}
                    onClick={() => {
                      setSelectedPlayerId(p.id);
                      clearPreview();
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left font-mono text-sm transition-colors ${
                      selectedPlayerId === p.id
                        ? "bg-jersey-deep/10 text-jersey-deep"
                        : "text-ink hover:bg-cream-soft"
                    }`}
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
            </section>
          )}

          {/* ── Mood ────────────────────────────────────────────────────── */}
          {currentTemplate.requiresMood && (
            <section aria-labelledby="mood-label">
              <label
                id="mood-label"
                htmlFor="mood-select"
                className={`${labelClass} mb-2 block`}
              >
                Resultaat
              </label>
              <Select
                id="mood-select"
                value={mood}
                onChange={(e) => {
                  if (isResultMood(e.target.value)) setMood(e.target.value);
                  clearPreview();
                }}
                aria-labelledby="mood-label"
              >
                <option value="win">Gewonnen</option>
                <option value="draw">Gelijkspel</option>
                <option value="loss">Verloren</option>
              </Select>
            </section>
          )}

          {/* ── Photo upload — image-capable templates, every one in A–E ─── */}
          {photoCapable && (
            <section aria-labelledby="photo-label">
              <label
                id="photo-label"
                htmlFor="photo-input"
                className={`${labelClass} mb-2 block`}
              >
                Foto (optioneel)
              </label>
              {/* No `capture` attr → iOS/Android surface Photo Library / Camera / Files */}
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                aria-label="Foto uploaden"
                className="text-ink file:border-ink file:bg-cream file:text-ink block w-full font-mono text-sm file:mr-4 file:rounded-none file:border-2 file:px-4 file:py-2 file:font-semibold"
              />
              {uploadedImageUrl && (
                <button
                  type="button"
                  onClick={clearUpload}
                  className="text-card-red mt-2 font-mono text-sm underline"
                >
                  Foto verwijderen
                </button>
              )}
            </section>
          )}
        </>
      )}

      {/* ── Look, theme, wash (#3535) ───────────────────────────────── */}
      <section aria-labelledby="look-label">
        <h2 id="look-label" className={`${labelClass} mb-3`}>
          Look
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {fittingLooks.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                if (l.id !== activeLook) setBlocks(NO_BLOCKS);
                setLook(l.id);
                clearPreview();
              }}
              aria-pressed={activeLook === l.id}
              className={`rounded-none border-2 px-3 py-3 font-mono text-sm font-semibold uppercase transition-colors duration-300 ${
                activeLook === l.id
                  ? "border-ink bg-jersey-deep text-cream"
                  : "border-ink/30 text-ink hover:border-ink bg-cream"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </section>

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

      {/* ── Schik: drag the text blocks (#3537) ───────────────────────── */}
      <section aria-labelledby="arrange-label" className="flex flex-col gap-4">
        <h2 id="arrange-label" className={labelClass}>
          Blokken
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "Schik",
              on: dragMode,
              toggle: () => setDragMode(!dragMode),
            },
            ...(dragMode
              ? [{ label: "Midden", on: snap, toggle: () => setSnap(!snap) }]
              : []),
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={b.toggle}
              aria-pressed={b.on}
              className={`flex-1 basis-[6.5rem] rounded-none border-2 px-3 py-3 font-mono text-sm font-semibold uppercase transition-colors duration-300 ${
                b.on
                  ? "border-ink bg-jersey-deep text-cream"
                  : "border-ink/30 text-ink hover:border-ink bg-cream"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        {dragMode && (
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
            <Button
              variant="secondary"
              onClick={() => setLayout(() => ({}))}
              disabled={!topBlock}
            >
              Alles terugzetten
            </Button>
          </>
        )}
      </section>

      {/* ── News / event story (#3540) ───────────────────────────────── */}
      {mode !== "match" && (
        <>
          {/* Omslag only chooses how a cover is shown: an item without one
              already fills its slot with the fallback picture. */}
          {item?.cover && (
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

          <section aria-labelledby="item-label">
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
              className="border-ink/30 max-h-48 overflow-y-auto rounded-none border-2"
              role="listbox"
              aria-label={mode === "article" ? "Artikels" : "Evenementen"}
            >
              {filteredItems.map((i) => (
                <button
                  key={i.slug}
                  type="button"
                  role="option"
                  aria-selected={item?.slug === i.slug}
                  onClick={() => handlePickItem(i)}
                  className={`flex w-full px-4 py-2 text-left font-mono text-sm transition-colors ${
                    item?.slug === i.slug
                      ? "bg-jersey-deep/10 text-jersey-deep"
                      : "text-ink hover:bg-cream-soft"
                  }`}
                >
                  {i.title}
                </button>
              ))}
            </div>
          </section>

          {fields &&
            (
              [
                { key: "title", label: "Titel" },
                { key: "date", label: "Datum" },
                { key: "time", label: "Uur" },
                { key: "location", label: "Locatie" },
              ] as const
            ).map((f) => (
              <section key={f.key}>
                <label
                  htmlFor={`share-${f.key}`}
                  className={`${labelClass} mb-2 block`}
                >
                  {f.label}
                </label>
                <Input
                  id={`share-${f.key}`}
                  value={fields[f.key]}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFields((prev) => prev && { ...prev, [f.key]: value });
                    clearPreview();
                  }}
                />
              </section>
            ))}
        </>
      )}

      {/* ── Template preview ─────────────────────────────────────────── */}
      {/* aria-hidden: the live template is a visual artifact (it owns its own
          <h1>/crest alts); the generated PNG <img> below is the a11y surface. */}
      {(mode === "match" || content) && (
        <>
          <div
            aria-hidden="true"
            data-testid="share-preview"
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,
              overflow: "hidden",
              position: "relative",
            }}
            className={`border-ink self-center border-2 ${dragMode ? DRAG_CLASSES : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDragStart={(e) => e.preventDefault()}
          >
            <div
              style={{
                transform: `scale(${TEMPLATE_SCALE})`,
                transformOrigin: "top left",
              }}
            >
              <div ref={templateRef}>
                {content && Look ? (
                  <Look
                    content={content}
                    format={aspect}
                    theme={theme}
                    wash={wash}
                    coverMode={coverMode}
                    blocks={layout}
                    fallbackIndex={fallbackIndex}
                  />
                ) : (
                  <ShareBadgeContext.Provider value={shortSquadLabel(squad)}>
                    <ShareBlocksContext.Provider value={layout}>
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
                )}
              </div>
            </div>
            {/* Outside the captured node: the centre guide never reaches the PNG. */}
            {snapping && (
              <div className="bg-card-red absolute inset-y-0 left-1/2 w-px" />
            )}
          </div>

          {/* Tier 2, no action (#2818, mirrors #2580 rule 4): the Genereer/Delen
          button below already survives this failure and is its own retry,
          so a second control here would be redundant. True by construction,
          not just by luck: Genereer is unconditional, and a "share" failure
          only exists while `generatedBlob` is still set (`handleShare`
          early-returns without one, and `clearPreview` nulls the failure in
          the same call it nulls the blob) — so whenever this notice can
          read `exportFailure === "share"`, the Delen/Download button is
          still on screen too. Replaces the retired
          `<p role="alert" className="text-card-red">` idiom. */}
          {exportFailure && (
            <EmptyState
              tier="slot"
              reason="unavailable"
              live
              emphasis={{ text: "mislukt" }}
            >
              {EXPORT_FAILURE_COPY[exportFailure]}
            </EmptyState>
          )}

          <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
            {isGenerating ? "Genereren…" : "Genereer"}
          </Button>

          {previewUrl && (
            <>
              <img
                src={previewUrl}
                alt="Gegenereerde preview"
                className="border-ink self-center border-2"
              />

              {canShareFiles ? (
                <Button onClick={handleShare} size="lg">
                  Delen
                </Button>
              ) : (
                <Button onClick={handleDownload} size="lg">
                  Download PNG
                </Button>
              )}
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}
