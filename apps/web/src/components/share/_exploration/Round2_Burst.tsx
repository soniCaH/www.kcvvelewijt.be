/**
 * Round 2 — Design 2: "BURST"
 *
 * Player photo desaturated + screen blend mode over a massive KCVV green
 * radial burst. Player glows. "GOAL!" explodes at the top. Premium, cinematic.
 * Works beautifully both with and without a photo.
 */
import type { ExplorationProps } from "./StyleA_StackedType";

const STENCIL: React.CSSProperties["fontFamily"] =
  'stenciletta, Impact, "Arial Narrow", sans-serif';
const SANS: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

export function Round2_Burst({
  playerName,
  shirtNumber,
  score,
  matchName,
  minute,
  celebrationImageUrl,
}: ExplorationProps) {
  return (
    <div
      style={{
        width: "1080px",
        height: "1920px",
        position: "relative",
        overflow: "hidden",
        background: "#111316",
      }}
    >
      {/* ── Main green burst — the heart of this design ── */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1600px",
          height: "1600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(74,207,82,1) 0%, rgba(74,207,82,0.7) 18%, rgba(74,207,82,0.3) 40%, rgba(74,207,82,0.05) 65%, transparent 80%)",
          zIndex: 1,
        }}
      />

      {/* ── Secondary warm green corona ── */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(186,218,85,0.6) 0%, rgba(74,207,82,0.2) 50%, transparent 70%)",
          zIndex: 1,
        }}
      />

      {/* ── Ghost shirt number — huge, very subtle, fills frame ── */}
      <div
        style={{
          position: "absolute",
          bottom: "260px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: STENCIL,
          fontSize: "900px",
          lineHeight: 1,
          color: "rgba(74,207,82,0.06)",
          whiteSpace: "nowrap",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {shirtNumber}
      </div>

      {/* ── Player photo — desaturated, screen blended over the burst ── */}
      {celebrationImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={celebrationImageUrl}
          alt={playerName}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "1200px",
            objectFit: "cover",
            objectPosition: "top center",
            filter: "grayscale(100%) contrast(1.3) brightness(1.1)",
            mixBlendMode: "screen",
            zIndex: 2,
          }}
        />
      ) : (
        /* No photo: ring of light effect */
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "680px",
            height: "680px",
            borderRadius: "50%",
            border: "8px solid rgba(74,207,82,0.4)",
            boxShadow:
              "0 0 80px rgba(74,207,82,0.6), inset 0 0 80px rgba(74,207,82,0.2)",
            zIndex: 2,
          }}
        />
      )}

      {/* ── GOAL! — top of frame, massive, explosive ── */}
      <div
        style={{
          position: "absolute",
          top: "32px",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: STENCIL,
          fontSize: "440px",
          lineHeight: 0.82,
          color: "white",
          textShadow:
            "0 0 160px rgba(74,207,82,1), 0 0 60px rgba(74,207,82,0.8), 0 6px 40px rgba(0,0,0,0.9)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

      {/* ── Player info block — lower section ── */}
      <div
        style={{
          position: "absolute",
          bottom: "280px",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          zIndex: 4,
        }}
      >
        {/* Shirt number badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "4px solid rgba(74,207,82,0.7)",
            background: "rgba(74,207,82,0.12)",
          }}
        >
          <span
            style={{
              fontFamily: STENCIL,
              fontSize: "72px",
              lineHeight: 1,
              color: "#4acf52",
            }}
          >
            {shirtNumber}
          </span>
        </div>

        {/* Player name */}
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: "84px",
            lineHeight: 1.05,
            color: "white",
            textAlign: "center",
            textShadow: "0 4px 40px rgba(0,0,0,0.95)",
            marginTop: "16px",
          }}
        >
          {playerName}
        </span>

        {/* Minute pill */}
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: "40px",
            color: "#4acf52",
            letterSpacing: "0.08em",
          }}
        >
          {minute}&apos;
        </span>
      </div>

      {/* ── Bottom bar — score + match name ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "260px",
          background: "rgba(10,12,14,0.97)",
          borderTop: "2px solid rgba(74,207,82,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          zIndex: 5,
        }}
      >
        <span
          style={{
            fontFamily: STENCIL,
            fontSize: "140px",
            lineHeight: 1,
            color: "#4acf52",
            textShadow: "0 0 40px rgba(74,207,82,0.5)",
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: "32px",
            color: "rgba(255,255,255,0.45)",
            textAlign: "center",
          }}
        >
          {matchName}
        </span>
      </div>

      {/* ── KCVV logo — top left ── */}
      <div
        style={{
          position: "absolute",
          top: "52px",
          right: "72px",
          zIndex: 6,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          style={{ width: "84px", height: "84px", objectFit: "contain" }}
        />
      </div>

      {/* ── @handle ── */}
      <div
        style={{
          position: "absolute",
          top: "72px",
          left: "72px",
          zIndex: 6,
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: "26px",
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.1em",
          }}
        >
          @kcvvelewijt
        </span>
      </div>
    </div>
  );
}
