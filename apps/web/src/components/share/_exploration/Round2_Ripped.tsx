/**
 * Round 2 — Design 1: "RIPPED"
 *
 * Inspired by goal-image.jpg / goal-no-image.jpg from the inspiration pack.
 * Layered depth: giant green GOAL text behind a torn black panel,
 * white GOAL blasting through on top. Player photo bleeds through.
 * Torn paper edges on the panel give raw energy.
 */
import type { ExplorationProps } from "./StyleA_StackedType";

const STENCIL: React.CSSProperties["fontFamily"] =
  'stenciletta, Impact, "Arial Narrow", sans-serif';
const SANS: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

const TORN_PANEL_CLIP = `polygon(
  0% 22%,
  3% 20.5%, 6% 22.5%, 9% 21%, 12% 23%, 15% 21.5%,
  18% 23%, 21% 21.5%, 24% 23.5%, 27% 21.5%, 30% 23%,
  33% 21.5%, 36% 23%, 39% 21%, 42% 23.5%, 45% 21.5%,
  48% 23%, 51% 21.5%, 54% 23.5%, 57% 22%, 60% 23.5%,
  63% 21.5%, 66% 23%, 69% 21%, 72% 23.5%, 75% 21.5%,
  78% 23%, 81% 21.5%, 84% 23.5%, 87% 21.5%, 90% 23%,
  93% 21.5%, 96% 23%, 99% 21.5%, 100% 22%,
  100% 76%,
  97% 78%, 94% 75.5%, 91% 78%, 88% 75.5%, 85% 77.5%,
  82% 75%, 79% 77.5%, 76% 75%, 73% 77%, 70% 75%,
  67% 77%, 64% 75%, 61% 77.5%, 58% 75%, 55% 77%,
  52% 75%, 49% 77%, 46% 75%, 43% 77.5%, 40% 75%,
  37% 77%, 34% 75%, 31% 77%, 28% 75%, 25% 77.5%,
  22% 75%, 19% 77%, 16% 75%, 13% 77%, 10% 75%,
  7% 77%, 4% 75.5%, 1% 77%, 0% 76%
)`;

export function Round2_Ripped({
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
        background: "#1E2836",
      }}
    >
      {/* ── Subtle diagonal line texture on the dark blue bg ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(-50deg, transparent, transparent 80px, rgba(255,255,255,0.018) 80px, rgba(255,255,255,0.018) 81px)",
          pointerEvents: "none",
        }}
      />

      {/* ── LAYER 1: Background GOAL × 3 (KCVV green, behind torn panel) ── */}
      {[
        { top: 180, opacity: 0.9, rotate: 0 },
        { top: 630, opacity: 0.55, rotate: 0 },
        { top: 1080, opacity: 0.3, rotate: 0 },
      ].map(({ top, opacity, rotate }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${top}px`,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: STENCIL,
            fontSize: "520px",
            lineHeight: 0.82,
            color: "#4acf52",
            opacity,
            transform: rotate ? `rotate(${rotate}deg)` : undefined,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          GOAL!
        </div>
      ))}

      {/* ── LAYER 2: Torn black panel — hides the middle of the green text ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#1a1c20",
          clipPath: TORN_PANEL_CLIP,
          zIndex: 2,
        }}
      />

      {/* ── LAYER 3: Player photo inside the panel zone ── */}
      {celebrationImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={celebrationImageUrl}
          alt={playerName}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            top: "360px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "1120px",
            objectFit: "cover",
            objectPosition: "top center",
            filter: "grayscale(40%) contrast(1.15)",
            mixBlendMode: "luminosity",
            opacity: 0.55,
            zIndex: 3,
          }}
        />
      ) : (
        /* No photo: giant shirt number ghosted inside panel */
        <div
          style={{
            position: "absolute",
            top: "520px",
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: STENCIL,
            fontSize: "700px",
            lineHeight: 1,
            color: "rgba(255,255,255,0.07)",
            zIndex: 3,
          }}
        >
          {shirtNumber}
        </div>
      )}

      {/* ── LAYER 4: Front GOAL! — white, blasts through everything ── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          transform: "translateY(-58%)",
          textAlign: "center",
          fontFamily: STENCIL,
          fontSize: "500px",
          lineHeight: 0.82,
          color: "white",
          textShadow: "0 8px 60px rgba(0,0,0,0.9)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

      {/* ── Player name — rotated left edge ── */}
      <div
        style={{
          position: "absolute",
          left: "-195px",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: "44px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.8)",
          whiteSpace: "nowrap",
          zIndex: 5,
        }}
      >
        {playerName} &mdash; {minute}&apos;
      </div>

      {/* ── Player name — rotated right edge ── */}
      <div
        style={{
          position: "absolute",
          right: "-195px",
          top: "50%",
          transform: "translateY(-50%) rotate(90deg)",
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: "44px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.8)",
          whiteSpace: "nowrap",
          zIndex: 5,
        }}
      >
        {playerName} &mdash; {minute}&apos;
      </div>

      {/* ── Diagonal accent lines ── */}
      {[
        { top: "28%", left: "-100px", width: "500px", opacity: 0.18 },
        { top: "56%", right: "-70px", width: "380px", opacity: 0.12 },
        { top: "72%", left: "-60px", width: "440px", opacity: 0.1 },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            height: "5px",
            background: "white",
            transform: "rotate(-30deg)",
            zIndex: 5,
            pointerEvents: "none",
            ...s,
          }}
        />
      ))}

      {/* ── Top bar: logo + handle ── */}
      <div
        style={{
          position: "absolute",
          top: "64px",
          left: "80px",
          right: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 6,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          style={{ width: "88px", height: "88px", objectFit: "contain" }}
        />
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── Bottom: score + match name ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(20,22,26,0.96)",
          borderTop: "6px solid #4acf52",
          padding: "44px 80px 68px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          zIndex: 6,
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: "128px",
            lineHeight: 1,
            color: "white",
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: "36px",
            color: "rgba(255,255,255,0.55)",
            textAlign: "center",
          }}
        >
          {matchName}
        </span>
      </div>
    </div>
  );
}
