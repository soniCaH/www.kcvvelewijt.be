"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { GoalKcvvTemplate } from "../GoalKcvvTemplate/GoalKcvvTemplate";
import {
  CAPTURE_WIDTH,
  CAPTURE_HEIGHT,
  TEMPLATE_SCALE,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,
} from "../constants";

// Hardcoded tracer-bullet data — replaced by form inputs in Phase 3
const HARDCODED_PROPS = {
  playerName: "Kevin Van Ransbeeck",
  shirtNumber: 10,
  score: "1 - 0",
  matchName: "KCVV Elewijt - FC Opponent",
  minute: "45",
};

export function SharePage() {
  const templateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!templateRef.current) return;
    setIsGenerating(true);
    setExportError(null);
    try {
      const dataUrl = await toPng(templateRef.current, {
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
        pixelRatio: 1,
      });
      const link = document.createElement("a");
      link.download = "kcvv-goal.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-12 px-4">
      <h1 className="font-montserrat font-black text-3xl text-kcvv-black">
        Story Generator
      </h1>

      {/* Scale wrapper — renders template at 1080×1920, displayed at 25% */}
      <div
        style={{
          width: `${PREVIEW_WIDTH}px`,
          height: `${PREVIEW_HEIGHT}px`,
          overflow: "hidden",
        }}
        className="shadow-lg rounded-sm"
      >
        <div
          style={{
            transform: `scale(${TEMPLATE_SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <div ref={templateRef}>
            <GoalKcvvTemplate {...HARDCODED_PROPS} />
          </div>
        </div>
      </div>

      {exportError && (
        <p role="alert" className="text-red-600 font-montserrat text-sm">
          {exportError}
        </p>
      )}

      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="bg-kcvv-green-bright hover:bg-kcvv-green-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-montserrat font-bold text-lg px-10 py-4 rounded-sm transition-colors"
      >
        {isGenerating ? "Generating…" : "Download PNG"}
      </button>
    </div>
  );
}
