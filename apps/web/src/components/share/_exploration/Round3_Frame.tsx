/**
 * Round 3 — Design 3: "FRAME"
 *
 * Player photo fills the frame. Heavy dark green top + bottom bars frame the
 * shot. GOAL! erupts from behind the top bar in massive white Quasimoda,
 * breaking the frame. Score sits on the bottom bar in bright green.
 * Cinematic, like a match broadcast freeze-frame.
 */
import type { ExplorationProps } from "./StyleA_StackedType";

const TITLE: React.CSSProperties["fontFamily"] =
  "quasimoda, -apple-system, system-ui, Montserrat, Verdana, sans-serif";
const BODY: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

export function Round3_Frame({
  playerName,
  shirtNumber: _shirtNumber,
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
        background: "#121a14",
      }}
    >
      {/* ── Full-frame photo — the hero ── */}
      {celebrationImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={celebrationImageUrl}
          alt={playerName}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            filter: "grayscale(25%) contrast(1.1) brightness(0.85)",
            zIndex: 1,
          }}
        />
      ) : (
        /* No photo: dark green gradient fill with KCVV pattern */
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 90% 70% at 50% 40%, #008755 0%, #004d30 60%, #121a14 100%)",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/images/header-pattern.png)",
              backgroundSize: "900px auto",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center 35%",
              opacity: 0.18,
              zIndex: 2,
            }}
          />
        </>
      )}

      {/* ── Dark gradient overlay — top and bottom bars blend into photo ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,60,30,0.98) 0%, rgba(0,60,30,0.7) 18%, transparent 35%, transparent 60%, rgba(10,20,14,0.75) 80%, rgba(10,20,14,0.98) 100%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* ── TOP BAR — dark green, holds logo and context ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "320px",
          background: "#008755",
          zIndex: 4,
        }}
      />

      {/* ── KCVV pattern in top bar ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "320px",
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "460px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 60px center",
          opacity: 0.15,
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* ── KCVV logo + handle inside top bar ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "320px",
          display: "flex",
          alignItems: "center",
          padding: "0 80px",
          gap: "40px",
          zIndex: 6,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          style={{ width: "120px", height: "120px", objectFit: "contain" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              fontFamily: TITLE,
              fontWeight: 900,
              fontSize: "52px",
              lineHeight: 1,
              color: "white",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            KCVV Elewijt
          </span>
          <span
            style={{
              fontFamily: BODY,
              fontWeight: 600,
              fontSize: "28px",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.1em",
            }}
          >
            @kcvvelewijt
          </span>
        </div>
      </div>

      {/* ── GOAL! — explodes OUT of the top bar, breaking the frame ── */}
      {/* Ghost behind */}
      <div
        style={{
          position: "absolute",
          top: "220px",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "520px",
          lineHeight: 0.84,
          color: "rgba(255,255,255,0.06)",
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

      {/* Main GOAL! — white, sits over bar and bleeds into photo */}
      <div
        style={{
          position: "absolute",
          top: "240px",
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
          textShadow: "0 16px 100px rgba(0,0,0,0.8)",
          zIndex: 7,
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

      {/* ── Bright green underline on GOAL ── */}
      <div
        style={{
          position: "absolute",
          top: "710px",
          left: "80px",
          right: "80px",
          height: "6px",
          background: "#4acf52",
          zIndex: 7,
          boxShadow: "0 0 20px rgba(74,207,82,0.6)",
        }}
      />

      {/* ── Player name rotated on left ── */}
      <div
        style={{
          position: "absolute",
          left: "-185px",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          fontFamily: BODY,
          fontWeight: 900,
          fontSize: "40px",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.7)",
          whiteSpace: "nowrap",
          zIndex: 8,
        }}
      >
        {playerName} &bull; {minute}&apos;
      </div>

      {/* ── BOTTOM BAR — deep dark green ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "340px",
          background: "#008755",
          zIndex: 4,
        }}
      />

      {/* ── KCVV pattern in bottom bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "340px",
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "380px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left 60px center",
          opacity: 0.12,
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* ── Bottom bar content: score + match ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "340px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "0 80px",
          gap: "12px",
          zIndex: 6,
        }}
      >
        {/* Score */}
        <span
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "140px",
            lineHeight: 0.9,
            color: "#4acf52",
            letterSpacing: "-0.03em",
          }}
        >
          {score}
        </span>

        {/* Divider */}
        <div
          style={{
            width: "80px",
            height: "4px",
            background: "rgba(255,255,255,0.3)",
          }}
        />

        {/* Player + match */}
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: "52px",
            lineHeight: 1.1,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {playerName}
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 500,
            fontSize: "30px",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {matchName}
        </span>
      </div>
    </div>
  );
}
