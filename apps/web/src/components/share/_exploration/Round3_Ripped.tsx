/**
 * Round 3 — Design 1: "RIPPED"
 *
 * Dark green (#008755) base with KCVV pattern texture, black torn panel,
 * white GOAL! text visible above/below, white GOAL! blasting through front.
 * Quasimoda 900 for all display type. Bright green (#4acf52) for accents only.
 */
import type { ExplorationProps } from "./StyleA_StackedType";
import { BODY_FONT, TITLE_FONT } from "../constants";

const TORN_CLIP = `polygon(
  0% 22%,
  3% 20.5%, 6% 23%, 9% 21%, 12% 23%, 15% 21%,
  18% 23.5%, 21% 21%, 24% 23%, 27% 21.5%, 30% 23%,
  33% 21%, 36% 23.5%, 39% 21%, 42% 23%, 45% 21.5%,
  48% 23%, 51% 21%, 54% 23.5%, 57% 21%, 60% 23%,
  63% 21.5%, 66% 23%, 69% 21%, 72% 23%, 75% 21.5%,
  78% 23%, 81% 21%, 84% 23.5%, 87% 21%, 90% 23%,
  93% 21.5%, 96% 23%, 99% 21%, 100% 22%,
  100% 76%,
  97% 77.5%, 94% 75.5%, 91% 77.5%, 88% 75.5%, 85% 77%,
  82% 75%, 79% 77%, 76% 75.5%, 73% 77%, 70% 75%,
  67% 77.5%, 64% 75%, 61% 77%, 58% 75.5%, 55% 77%,
  52% 75%, 49% 77.5%, 46% 75%, 43% 77%, 40% 75.5%,
  37% 77%, 34% 75%, 31% 77.5%, 28% 75%, 25% 77%,
  22% 75.5%, 19% 77%, 16% 75%, 13% 77.5%, 10% 75%,
  7% 77%, 4% 75.5%, 1% 77%, 0% 76%
)`;

export function Round3_Ripped({
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
        background: "#008755",
      }}
    >
      {/* ── KCVV club pattern — prominent texture on the dark green bg ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "680px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 28%",
          opacity: 0.12,
          pointerEvents: "none",
        }}
      />

      {/* ── Vignette edges to frame the composition ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 110% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── LAYER 1 — bg GOAL! × 3 in white, behind the torn panel ── */}
      {[
        { top: 170, size: 490, opacity: 0.85 },
        { top: 640, size: 450, opacity: 0.5 },
        { top: 1080, size: 410, opacity: 0.25 },
      ].map(({ top, size, opacity }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${top}px`,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: TITLE_FONT,
            fontWeight: 900,
            fontSize: `${size}px`,
            lineHeight: 0.84,
            color: "white",
            opacity,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          GOAL!
        </div>
      ))}

      {/* ── LAYER 2 — torn black panel covering the center ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#121a14",
          clipPath: TORN_CLIP,
          zIndex: 2,
        }}
      />

      {/* ── Subtle green shimmer inside the panel ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,135,85,0.18) 0%, transparent 70%)",
          clipPath: TORN_CLIP,
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* ── LAYER 3 — player photo inside panel ── */}
      {celebrationImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={celebrationImageUrl}
          alt={playerName}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            top: "300px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "920px",
            height: "1160px",
            objectFit: "cover",
            objectPosition: "top center",
            filter: "grayscale(30%) contrast(1.1)",
            mixBlendMode: "luminosity",
            opacity: 0.5,
            zIndex: 4,
          }}
        />
      ) : (
        /* No photo — ghost shirt number */
        <div
          style={{
            position: "absolute",
            top: "460px",
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: TITLE_FONT,
            fontWeight: 900,
            fontSize: "680px",
            lineHeight: 1,
            color: "rgba(255,255,255,0.05)",
            letterSpacing: "-0.05em",
            zIndex: 4,
          }}
        >
          {shirtNumber}
        </div>
      )}

      {/* ── LAYER 4 — FRONT GOAL! white, bridges both layers ── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          transform: "translateY(-55%)",
          textAlign: "center",
          fontFamily: TITLE_FONT,
          fontWeight: 900,
          fontSize: "500px",
          lineHeight: 0.84,
          color: "white",
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          textShadow: "0 8px 80px rgba(0,0,0,0.95)",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

      {/* ── Bright green accent lines ── */}
      {[
        { top: "21%", left: "-80px", width: "480px", opacity: 0.7 },
        { top: "76%", right: "-60px", width: "400px", opacity: 0.7 },
        { top: "18%", left: "-20px", width: "260px", opacity: 0.35 },
        { bottom: "22%", right: "-40px", width: "300px", opacity: 0.35 },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            height: "5px",
            background: "#4acf52",
            transform: "rotate(-28deg)",
            zIndex: 6,
            pointerEvents: "none",
            ...s,
          }}
        />
      ))}

      {/* ── Player name — rotated left ── */}
      <div
        style={{
          position: "absolute",
          left: "-200px",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          fontFamily: BODY_FONT,
          fontWeight: 900,
          fontSize: "42px",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.75)",
          whiteSpace: "nowrap",
          zIndex: 7,
        }}
      >
        {playerName} &bull; {minute}&apos;
      </div>

      {/* ── Player name — rotated right ── */}
      <div
        style={{
          position: "absolute",
          right: "-200px",
          top: "50%",
          transform: "translateY(-50%) rotate(90deg)",
          fontFamily: BODY_FONT,
          fontWeight: 900,
          fontSize: "42px",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.75)",
          whiteSpace: "nowrap",
          zIndex: 7,
        }}
      >
        {playerName} &bull; {minute}&apos;
      </div>

      {/* ── Top bar ── */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: "80px",
          right: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 8,
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
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── Bottom: score + match ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(10,20,14,0.96)",
          borderTop: "5px solid #4acf52",
          padding: "48px 80px 68px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          zIndex: 8,
        }}
      >
        <span
          style={{
            fontFamily: TITLE_FONT,
            fontWeight: 900,
            fontSize: "130px",
            lineHeight: 1,
            color: "white",
            letterSpacing: "-0.02em",
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 600,
            fontSize: "36px",
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
          }}
        >
          {matchName}
        </span>
      </div>
    </div>
  );
}
