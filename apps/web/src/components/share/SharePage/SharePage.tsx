"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { ResultMood } from "../shared/theme";
import { Button } from "@/components/design-system/Button/Button";
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

export type Aspect = "story" | "square";

export type TemplateId =
  | "goal-kcvv"
  | "goal-opponent"
  | "kickoff"
  | "halftime"
  | "full-time"
  | "red-card-kcvv"
  | "red-card-opponent"
  | "yellow-card-kcvv"
  | "yellow-card-opponent"
  | "square-pre-game"
  | "square-result";

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
  meta("square-result", "Eindstand", Flag, "square", {
    score: true,
    mood: true,
    competition: true,
    image: true,
  }),
];

export interface SharePageProps {
  matches: MatchOption[];
  players: PlayerForShare[];
}

const RESULT_MOODS: readonly ResultMood[] = ["win", "draw", "loss"];
function isResultMood(value: string): value is ResultMood {
  return (RESULT_MOODS as readonly string[]).includes(value);
}

const FALLBACK_MATCH_NAME = "KCVV Elewijt — FC Tegenstander";
const FALLBACK_SCORE = "0 - 0";
const FALLBACK_MINUTE = "0";

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

export function SharePage({ matches, players }: SharePageProps) {
  const templateRef = useRef<HTMLDivElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const uploadUrlRef = useRef<string | null>(null);
  const isGeneratingRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [aspect, setAspect] = useState<Aspect>("story");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<TemplateId>("goal-kcvv");

  // Session-persistent fields (survive template switches)
  const [matchName, setMatchName] = useState("");
  const [score, setScore] = useState("");
  const [competition, setCompetition] = useState("");
  const [dateTime, setDateTime] = useState("");

  // Template-specific fields (reset on template switch)
  const [minute, setMinute] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [mood, setMood] = useState<ResultMood>("win");
  const [playerSearch, setPlayerSearch] = useState("");

  // Manual photo upload (object URL)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Drop a generated preview once it no longer matches the form, so the
  // Share/Download buttons can never emit a stale graphic.
  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setGeneratedBlob(null);
    setPreviewUrl(null);
  }, []);

  const clearUpload = useCallback(() => {
    if (uploadUrlRef.current) {
      URL.revokeObjectURL(uploadUrlRef.current);
      uploadUrlRef.current = null;
    }
    setUploadedImageUrl(null);
    clearPreview();
  }, [clearPreview]);

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId)!;
  const visibleTemplates = TEMPLATES.filter((t) => t.aspect === aspect);
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const selectedMatch = matches.find((m) => m.matchName === matchName);

  // Prefill competition + kickoff line when a known match is picked (handled in
  // the change event, not an effect — the data flows from one input to others).
  const handleMatchNameChange = (value: string) => {
    setMatchName(value);
    const picked = matches.find((m) => m.matchName === value);
    if (picked) {
      setCompetition(picked.competition ?? "");
      setDateTime(picked.dateTime ?? "");
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
    resetTemplateFields();
  };

  const handleAspectChange = (next: Aspect) => {
    if (next === aspect) return;
    setAspect(next);
    setSelectedTemplateId(next === "square" ? "square-pre-game" : "goal-kcvv");
    resetTemplateFields();
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
  // other image-capable templates use only the manual upload.
  const resolvedImageUrl = useMemo(() => {
    if (!currentTemplate.imageCapable) return undefined;
    if (selectedTemplateId === "goal-kcvv") {
      return (
        uploadedImageUrl ??
        selectedPlayer?.celebrationImageUrl ??
        selectedPlayer?.psdImageUrl ??
        undefined
      );
    }
    return uploadedImageUrl ?? undefined;
  }, [
    currentTemplate.imageCapable,
    selectedTemplateId,
    uploadedImageUrl,
    selectedPlayer,
  ]);

  const captureWidth = aspect === "square" ? SQUARE_SIZE : CAPTURE_WIDTH;
  const captureHeight = aspect === "square" ? SQUARE_SIZE : CAPTURE_HEIGHT;

  const handleGenerate = async () => {
    if (!templateRef.current || isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setExportError(null);
    clearPreview();
    try {
      const dataUrl = await toPng(templateRef.current, {
        width: captureWidth,
        height: captureHeight,
        pixelRatio: 1,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setGeneratedBlob(blob);
      setPreviewUrl(url);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed. Please try again.",
      );
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
    const file = new File([generatedBlob], `kcvv-${selectedTemplateId}.png`, {
      type: "image/png",
    });
    try {
      await navigator.share({ files: [file] });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setExportError(
        err instanceof Error ? err.message : "Share failed. Please try again.",
      );
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.download = `kcvv-${selectedTemplateId}.png`;
    link.href = previewUrl;
    link.click();
  };

  const labelClass =
    "font-mono text-sm font-semibold uppercase tracking-wide text-ink-soft";
  const previewWidth = captureWidth * TEMPLATE_SCALE;
  const previewHeight = captureHeight * TEMPLATE_SCALE;

  return (
    <PageContainer width="prose" className="flex flex-col gap-6 py-8">
      <h1 className="font-display text-ink text-4xl font-black">
        Story Generator
      </h1>

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
              className={`flex-1 rounded-none border-2 px-4 py-3 font-mono text-sm font-semibold tracking-wide uppercase transition-all duration-300 ${
                aspect === opt.value
                  ? "border-ink bg-jersey-deep text-cream"
                  : "border-ink/30 text-ink-soft hover:border-ink bg-cream"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

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
              className={`flex min-h-[72px] flex-col items-center gap-1 rounded-none border-2 p-3 font-mono text-sm font-semibold transition-all duration-300 ${
                selectedTemplateId === t.id
                  ? "border-ink bg-jersey-deep/10 text-jersey-deep"
                  : "border-ink/30 text-ink-soft hover:border-ink bg-cream"
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
            <option key={m.id} value={m.matchName}>
              {m.label}
            </option>
          ))}
        </datalist>
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
                    : "text-ink-soft hover:bg-cream-soft"
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

      {/* ── Photo upload — image-capable templates ──────────────────── */}
      {currentTemplate.imageCapable && (
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
            className="text-ink-soft file:border-ink file:bg-cream file:text-ink-soft block w-full font-mono text-sm file:mr-4 file:rounded-none file:border-2 file:px-4 file:py-2 file:font-semibold"
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

      {/* ── Template preview ─────────────────────────────────────────── */}
      {/* aria-hidden: the live template is a visual artifact (it owns its own
          <h1>/crest alts); the generated PNG <img> below is the a11y surface. */}
      <div
        aria-hidden="true"
        style={{
          width: `${previewWidth}px`,
          height: `${previewHeight}px`,
          overflow: "hidden",
        }}
        className="border-ink self-center border-2"
      >
        <div
          style={{
            transform: `scale(${TEMPLATE_SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <div ref={templateRef}>
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
          </div>
        </div>
      </div>

      {exportError && (
        <p role="alert" className="text-card-red font-mono text-sm">
          {exportError}
        </p>
      )}

      <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
        {isGenerating ? "Genereren…" : "Genereer"}
      </Button>

      {previewUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Generated preview"
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
    </PageContainer>
  );
}
