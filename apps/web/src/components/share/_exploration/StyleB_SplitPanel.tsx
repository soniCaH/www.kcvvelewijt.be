/**
 * Style B: "Split Panel"
 * Inspired by matchday2/fulltime2 — dark left column with match info,
 * right column is a live photo zone. KCVV club pattern as watermark.
 */
import type { ExplorationProps } from "./StyleA_StackedType";

export function StyleB_SplitPanel({
  playerName,
  shirtNumber,
  score,
  matchName,
  minute,
  celebrationImageUrl,
}: ExplorationProps) {
  return (
    <div
      style={{ width: "1080px", height: "1920px" }}
      className="relative overflow-hidden bg-kcvv-black flex flex-col"
    >
      {/* ── KCVV green accent top bar ── */}
      <div
        className="shrink-0 bg-kcvv-green-bright flex items-center px-[64px]"
        style={{ height: "120px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          style={{ width: "80px", height: "80px", objectFit: "contain" }}
        />
        <span
          className="font-montserrat font-black text-kcvv-black uppercase tracking-widest ml-[32px]"
          style={{ fontSize: "36px" }}
        >
          KCVV Elewijt
        </span>
        <span
          className="font-montserrat font-bold text-kcvv-black ml-auto"
          style={{ fontSize: "28px", opacity: 0.65 }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── Main split area ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left column — content */}
        <div
          className="relative flex flex-col justify-between"
          style={{
            width: "430px",
            flexShrink: 0,
            padding: "80px 56px 80px 64px",
            background: "#1E2024",
            borderRight: "5px solid #4acf52",
          }}
        >
          {/* Club pattern watermark */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "url(/images/header-pattern.png)",
              backgroundSize: "380px auto",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center bottom",
              opacity: 0.06,
            }}
          />

          {/* Vertical GOAL label */}
          <div
            className="relative font-stenciletta text-kcvv-green-bright"
            style={{
              fontSize: "160px",
              lineHeight: 0.85,
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              alignSelf: "flex-start",
            }}
          >
            GOAL!
          </div>

          {/* Player info */}
          <div className="relative flex flex-col gap-[32px]">
            {/* Shirt number */}
            <span
              className="font-stenciletta text-kcvv-green-bright"
              style={{ fontSize: "200px", lineHeight: 1 }}
            >
              {shirtNumber}
            </span>

            {/* Player name */}
            <span
              className="font-montserrat font-black text-white uppercase"
              style={{ fontSize: "58px", lineHeight: 1.1 }}
            >
              {playerName}
            </span>

            {/* Divider */}
            <div
              className="bg-kcvv-green-bright"
              style={{ height: "4px", width: "80px" }}
            />

            {/* Score */}
            <span
              className="font-montserrat font-black text-white"
              style={{ fontSize: "96px", lineHeight: 1 }}
            >
              {score}
            </span>

            {/* Minute */}
            <span
              className="font-montserrat font-semibold"
              style={{ fontSize: "44px", color: "rgba(255,255,255,0.55)" }}
            >
              {minute}&apos;
            </span>
          </div>
        </div>

        {/* Right column — photo zone */}
        <div className="relative flex-1 overflow-hidden">
          {celebrationImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={celebrationImageUrl}
              alt={playerName}
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: "cover", objectPosition: "top center" }}
            />
          ) : (
            /* Placeholder */
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-[32px]"
              style={{ background: "#2a2d33" }}
            >
              {/* Checkered placeholder pattern */}
              <div
                style={{
                  width: "280px",
                  height: "280px",
                  backgroundImage:
                    "repeating-conic-gradient(rgba(255,255,255,0.07) 0% 25%, transparent 0% 50%)",
                  backgroundSize: "56px 56px",
                  borderRadius: "8px",
                }}
              />
              <span
                className="font-montserrat font-bold uppercase tracking-widest"
                style={{ fontSize: "28px", color: "rgba(255,255,255,0.2)" }}
              >
                Live photo
              </span>
            </div>
          )}

          {/* Green edge glow */}
          <div
            className="absolute inset-y-0 left-0 w-[6px] bg-kcvv-green-bright opacity-50"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ── Bottom match-name bar ── */}
      <div
        className="shrink-0 bg-kcvv-green-bright flex items-center justify-center px-[64px]"
        style={{ height: "120px" }}
      >
        <span
          className="font-montserrat font-black text-kcvv-black text-center uppercase tracking-wider"
          style={{ fontSize: "38px" }}
        >
          {matchName}
        </span>
      </div>
    </div>
  );
}
