/**
 * Round 3 — Design 2: "DIAGONAL"
 *
 * Bold diagonal cut splits dark green (#008755) top-left from near-black
 * bottom-right. A bright green stripe marks the cut. GOAL! in white Quasimoda
 * straddles both zones at extreme scale. Very graphic, very kinetic.
 */
import type { ExplorationProps } from "./StyleA_StackedType";

const TITLE: React.CSSProperties["fontFamily"] =
  "quasimoda, acumin-pro, Montserrat, Verdana, sans-serif";
const BODY: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

export function Round3_Diagonal({
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
        background: "#1E2024",
      }}
    >
      {/* ── Top-left zone: dark green ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#008755",
          clipPath: "polygon(0 0, 100% 0, 100% 55%, 0 80%)",
          zIndex: 1,
        }}
      />

      {/* ── KCVV pattern texture on the green zone ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "520px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "75% 20%",
          opacity: 0.1,
          clipPath: "polygon(0 0, 100% 0, 100% 55%, 0 80%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* ── Bright green diagonal stripe (the cut line) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#4acf52",
          clipPath: "polygon(0 78%, 100% 53%, 100% 58%, 0 83%)",
          zIndex: 3,
        }}
      />

      {/* ── Player photo — lives in the dark lower zone ── */}
      {celebrationImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={celebrationImageUrl}
          alt={playerName}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            bottom: "280px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "960px",
            height: "900px",
            objectFit: "cover",
            objectPosition: "top center",
            filter: "grayscale(20%) contrast(1.1)",
            opacity: 0.55,
            zIndex: 4,
          }}
        />
      ) : (
        /* No photo — large ghost number in dark zone */
        <div
          style={{
            position: "absolute",
            bottom: "200px",
            right: "80px",
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "560px",
            lineHeight: 1,
            color: "rgba(255,255,255,0.04)",
            letterSpacing: "-0.05em",
            zIndex: 4,
          }}
        >
          {shirtNumber}
        </div>
      )}

      {/* ── Dark gradient over photo — keeps typography readable ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(20,22,20,0.9) 0%, rgba(20,22,20,0.4) 50%, transparent 70%)",
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* ── MAIN EVENT: GOAL! — straddles the diagonal cut ── */}
      {/* Background ghost — very large, slightly off-center */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: "-60px",
          right: "-60px",
          textAlign: "center",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "520px",
          lineHeight: 0.84,
          color: "rgba(255,255,255,0.07)",
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          zIndex: 6,
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

      {/* Foreground GOAL! — crisp, white, high impact */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "480px",
          lineHeight: 0.84,
          color: "white",
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          textShadow:
            "0 12px 80px rgba(0,0,0,0.8), 0 0 120px rgba(0,135,85,0.3)",
          zIndex: 7,
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

      {/* ── Shirt number — left side of diagonal, small accent ── */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "80px",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "220px",
          lineHeight: 1,
          color: "rgba(255,255,255,0.15)",
          letterSpacing: "-0.04em",
          zIndex: 6,
        }}
      >
        {shirtNumber}
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
          zIndex: 9,
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
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── Player name below GOAL ── */}
      <div
        style={{
          position: "absolute",
          bottom: "300px",
          left: "80px",
          right: "80px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          zIndex: 8,
        }}
      >
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 900,
            fontSize: "72px",
            lineHeight: 1,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {playerName}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <span
            style={{
              fontFamily: TITLE,
              fontWeight: 900,
              fontSize: "80px",
              lineHeight: 1,
              color: "#4acf52",
              letterSpacing: "-0.02em",
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontFamily: BODY,
              fontWeight: 600,
              fontSize: "44px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {minute}&apos;
          </span>
        </div>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 500,
            fontSize: "32px",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {matchName}
        </span>
      </div>
    </div>
  );
}
