"use client";

import { useCallback, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { GoalKcvvTemplate } from "../GoalKcvvTemplate/GoalKcvvTemplate";
import { GoalOpponentTemplate } from "../GoalOpponentTemplate/GoalOpponentTemplate";
import { KickoffTemplate } from "../KickoffTemplate/KickoffTemplate";
import { HalftimeTemplate } from "../HalftimeTemplate/HalftimeTemplate";
import { FullTimeTemplate } from "../FullTimeTemplate/FullTimeTemplate";
import type { FullTimeMood } from "../FullTimeTemplate/FullTimeTemplate";
import { RedCardKcvvTemplate } from "../RedCardKcvvTemplate/RedCardKcvvTemplate";
import { RedCardOpponentTemplate } from "../RedCardOpponentTemplate/RedCardOpponentTemplate";
import { YellowCardKcvvTemplate } from "../YellowCardKcvvTemplate/YellowCardKcvvTemplate";
import { YellowCardOpponentTemplate } from "../YellowCardOpponentTemplate/YellowCardOpponentTemplate";
import {
  CAPTURE_WIDTH,
  CAPTURE_HEIGHT,
  TEMPLATE_SCALE,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,
} from "../constants";
import type { LucideIcon } from "@/lib/icons";
import { CircleDot, Play, Timer, Flag, Square } from "@/lib/icons";

export type TemplateId =
  | "goal-kcvv"
  | "goal-opponent"
  | "kickoff"
  | "halftime"
  | "full-time"
  | "red-card-kcvv"
  | "red-card-opponent"
  | "yellow-card-kcvv"
  | "yellow-card-opponent";

export interface PlayerForShare {
  id: string;
  firstName: string;
  lastName: string;
  number?: number;
  celebrationImageUrl?: string;
}

export interface MatchOption {
  id: number;
  label: string;
  /** Formatted match name used as template prop, e.g. "KCVV Elewijt — FC Opponent" */
  matchName: string;
}

interface TemplateMeta {
  id: TemplateId;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  requiresPlayer: boolean;
  requiresScore: boolean;
  requiresMinute: boolean;
  requiresMood: boolean;
}

const TEMPLATES: TemplateMeta[] = [
  {
    id: "goal-kcvv",
    label: "Goal KCVV",
    icon: CircleDot,
    requiresPlayer: true,
    requiresScore: true,
    requiresMinute: true,
    requiresMood: false,
  },
  {
    id: "goal-opponent",
    label: "Goal Teg.",
    icon: CircleDot,
    requiresPlayer: false,
    requiresScore: true,
    requiresMinute: true,
    requiresMood: false,
  },
  {
    id: "kickoff",
    label: "Aftrap",
    icon: Play,
    requiresPlayer: false,
    requiresScore: false,
    requiresMinute: false,
    requiresMood: false,
  },
  {
    id: "halftime",
    label: "Rust",
    icon: Timer,
    requiresPlayer: false,
    requiresScore: true,
    requiresMinute: false,
    requiresMood: false,
  },
  {
    id: "full-time",
    label: "Eindstand",
    icon: Flag,
    requiresPlayer: false,
    requiresScore: true,
    requiresMinute: false,
    requiresMood: true,
  },
  {
    id: "red-card-kcvv",
    label: "Rode Kaart KCVV",
    icon: Square,
    iconClassName: "fill-red-500 text-red-600",
    requiresPlayer: true,
    requiresScore: false,
    requiresMinute: true,
    requiresMood: false,
  },
  {
    id: "red-card-opponent",
    label: "Rode Kaart Teg.",
    icon: Square,
    iconClassName: "fill-red-500 text-red-600",
    requiresPlayer: false,
    requiresScore: false,
    requiresMinute: true,
    requiresMood: false,
  },
  {
    id: "yellow-card-kcvv",
    label: "Gele Kaart KCVV",
    icon: Square,
    iconClassName: "fill-yellow-400 text-yellow-500",
    requiresPlayer: true,
    requiresScore: false,
    requiresMinute: true,
    requiresMood: false,
  },
  {
    id: "yellow-card-opponent",
    label: "Gele Kaart Teg.",
    icon: Square,
    iconClassName: "fill-yellow-400 text-yellow-500",
    requiresPlayer: false,
    requiresScore: false,
    requiresMinute: true,
    requiresMood: false,
  },
];

export interface SharePageProps {
  matches: MatchOption[];
  players: PlayerForShare[];
}

const FULL_TIME_MOODS: readonly FullTimeMood[] = ["win", "draw", "loss"];
function isFullTimeMood(value: string): value is FullTimeMood {
  return (FULL_TIME_MOODS as readonly string[]).includes(value);
}

const FALLBACK_MATCH_NAME = "KCVV Elewijt — FC Tegenstander";
const FALLBACK_SCORE = "0 - 0";
const FALLBACK_MINUTE = "0";

function renderTemplate(
  id: TemplateId,
  opts: {
    matchName: string;
    score: string;
    minute: string;
    player: PlayerForShare | undefined;
    mood: FullTimeMood;
  },
): React.ReactNode {
  const { matchName, score, minute, player, mood } = opts;
  const playerName = player ? `${player.firstName} ${player.lastName}` : "";
  const shirtNumber = player?.number;

  switch (id) {
    case "goal-kcvv":
      return (
        <GoalKcvvTemplate
          matchName={matchName}
          score={score}
          minute={minute}
          playerName={playerName}
          shirtNumber={shirtNumber}
          celebrationImageUrl={player?.celebrationImageUrl}
        />
      );
    case "goal-opponent":
      return (
        <GoalOpponentTemplate
          matchName={matchName}
          score={score}
          minute={minute}
        />
      );
    case "kickoff":
      return <KickoffTemplate matchName={matchName} />;
    case "halftime":
      return <HalftimeTemplate matchName={matchName} score={score} />;
    case "full-time":
      return (
        <FullTimeTemplate matchName={matchName} score={score} mood={mood} />
      );
    case "red-card-kcvv":
      return (
        <RedCardKcvvTemplate
          matchName={matchName}
          minute={minute}
          playerName={playerName}
          shirtNumber={shirtNumber}
        />
      );
    case "red-card-opponent":
      return <RedCardOpponentTemplate matchName={matchName} minute={minute} />;
    case "yellow-card-kcvv":
      return (
        <YellowCardKcvvTemplate
          matchName={matchName}
          minute={minute}
          playerName={playerName}
          shirtNumber={shirtNumber}
        />
      );
    case "yellow-card-opponent":
      return (
        <YellowCardOpponentTemplate matchName={matchName} minute={minute} />
      );
  }
}

export function SharePage({ matches, players }: SharePageProps) {
  const templateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<TemplateId>("goal-kcvv");

  // Session-persistent fields (survive template switches)
  const [matchName, setMatchName] = useState("");
  const [score, setScore] = useState("");

  // Template-specific fields (reset on template switch)
  const [minute, setMinute] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [mood, setMood] = useState<FullTimeMood>("win");
  const [playerSearch, setPlayerSearch] = useState("");

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId)!;
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  const filteredPlayers = playerSearch
    ? players.filter((p) => {
        const full = `${p.firstName} ${p.lastName}`.toLowerCase();
        const reversed = `${p.lastName} ${p.firstName}`.toLowerCase();
        const q = playerSearch.toLowerCase();
        return full.includes(q) || reversed.includes(q);
      })
    : players;

  const handleTemplateChange = (id: TemplateId) => {
    if (id === selectedTemplateId) return;
    setSelectedTemplateId(id);
    // Reset template-specific fields; matchName + score persist intentionally
    setMinute("");
    setSelectedPlayerId(null);
    setMood("win");
    setPlayerSearch("");
  };

  const clearPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setGeneratedBlob(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleGenerate = async () => {
    if (!templateRef.current) return;
    setIsGenerating(true);
    setExportError(null);
    clearPreview();
    try {
      const dataUrl = await toPng(templateRef.current, {
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
        pixelRatio: 1,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      setGeneratedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({
      files: [new File([], "test.png", { type: "image/png" })],
    });

  const handleShare = async () => {
    if (!generatedBlob) return;
    const file = new File([generatedBlob], `kcvv-${selectedTemplateId}.png`, {
      type: "image/png",
    });
    try {
      await navigator.share({ files: [file] });
    } catch (err) {
      // User cancelled share sheet — not an error
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

  const inputClass =
    "w-full border-2 border-gray-200 rounded-sm px-4 py-3 font-montserrat text-base focus:border-kcvv-green focus:outline-none";
  const labelClass =
    "font-montserrat font-semibold text-sm uppercase tracking-wide text-kcvv-black";

  return (
    <div className="flex flex-col gap-6 py-8 px-4 max-w-2xl mx-auto">
      <h1 className="font-montserrat font-black text-3xl text-kcvv-black">
        Story Generator
      </h1>

      {/* ── Template Picker ─────────────────────────────────────────── */}
      <section aria-labelledby="template-picker-label">
        <h2 id="template-picker-label" className={`${labelClass} mb-3`}>
          Template
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTemplateChange(t.id)}
              aria-pressed={selectedTemplateId === t.id}
              className={`flex flex-col items-center gap-1 p-3 rounded-sm border-2 text-sm font-montserrat font-semibold transition-colors min-h-[72px] ${
                selectedTemplateId === t.id
                  ? "border-kcvv-green bg-kcvv-green/10 text-kcvv-green"
                  : "border-gray-200 bg-white text-kcvv-black hover:border-kcvv-green/50"
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
          className={`${labelClass} block mb-2`}
        >
          Wedstrijd
        </label>
        <input
          id="match-input"
          list="match-options"
          value={matchName}
          onChange={(e) => setMatchName(e.target.value)}
          placeholder={FALLBACK_MATCH_NAME}
          className={inputClass}
        />
        <datalist id="match-options">
          {matches.map((m) => (
            <option key={m.id} value={m.matchName}>
              {m.label}
            </option>
          ))}
        </datalist>
      </section>

      {/* ── Score input — only for templates that need it ───────────── */}
      {currentTemplate.requiresScore && (
        <section aria-labelledby="score-label">
          <label
            id="score-label"
            htmlFor="score-input"
            className={`${labelClass} block mb-2`}
          >
            Score
          </label>
          <input
            id="score-input"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="2 - 0"
            className={inputClass}
          />
        </section>
      )}

      {/* ── Minute input ─────────────────────────────────────────────── */}
      {currentTemplate.requiresMinute && (
        <section aria-labelledby="minute-label">
          <label
            id="minute-label"
            htmlFor="minute-input"
            className={`${labelClass} block mb-2`}
          >
            Minuut
          </label>
          <input
            id="minute-input"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            placeholder="45+2"
            className={inputClass}
          />
        </section>
      )}

      {/* ── Player search — KCVV templates only ─────────────────────── */}
      {currentTemplate.requiresPlayer && (
        <section aria-labelledby="player-label">
          <h2 id="player-label" className={`${labelClass} mb-2`}>
            Speler
          </h2>
          <input
            id="player-search-input"
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            placeholder="Zoek op naam…"
            aria-label="Zoek speler"
            className={`${inputClass} mb-2`}
          />
          <div
            className="max-h-48 overflow-y-auto border border-gray-200 rounded-sm"
            role="listbox"
            aria-label="Spelers"
          >
            {filteredPlayers.map((p) => (
              <button
                key={p.id}
                role="option"
                aria-selected={selectedPlayerId === p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left font-montserrat text-sm transition-colors ${
                  selectedPlayerId === p.id
                    ? "bg-kcvv-green/10 text-kcvv-green"
                    : "hover:bg-gray-50 text-kcvv-black"
                }`}
              >
                <span className="font-bold text-lg min-w-[2rem] text-center">
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

      {/* ── Mood select — full-time only ─────────────────────────────── */}
      {currentTemplate.requiresMood && (
        <section aria-labelledby="mood-label">
          <label
            id="mood-label"
            htmlFor="mood-select"
            className={`${labelClass} block mb-2`}
          >
            Resultaat
          </label>
          <select
            id="mood-select"
            value={mood}
            onChange={(e) => {
              if (isFullTimeMood(e.target.value)) setMood(e.target.value);
            }}
            aria-labelledby="mood-label"
            className={inputClass}
          >
            <option value="win">Gewonnen</option>
            <option value="draw">Gelijkspel</option>
            <option value="loss">Verloren</option>
          </select>
        </section>
      )}

      {/* ── Template preview ─────────────────────────────────────────── */}
      <div
        style={{
          width: `${PREVIEW_WIDTH}px`,
          height: `${PREVIEW_HEIGHT}px`,
          overflow: "hidden",
        }}
        className="shadow-lg rounded-sm self-center"
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
            })}
          </div>
        </div>
      </div>

      {exportError && (
        <p role="alert" className="text-red-600 font-montserrat text-sm">
          {exportError}
        </p>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="bg-kcvv-green-bright hover:bg-kcvv-green-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-montserrat font-bold text-lg px-10 py-4 rounded-sm transition-colors"
      >
        {isGenerating ? "Generating…" : "Genereer"}
      </button>

      {previewUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Generated preview"
            className="max-w-full rounded-sm shadow-lg self-center"
          />

          {canShareFiles ? (
            <button
              onClick={handleShare}
              className="bg-kcvv-green-bright hover:bg-kcvv-green-hover text-white font-montserrat font-bold text-lg px-10 py-4 rounded-sm transition-colors"
            >
              Delen
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="bg-kcvv-green-bright hover:bg-kcvv-green-hover text-white font-montserrat font-bold text-lg px-10 py-4 rounded-sm transition-colors"
            >
              Download PNG
            </button>
          )}
        </>
      )}
    </div>
  );
}
