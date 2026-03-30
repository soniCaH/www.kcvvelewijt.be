/**
 * Round 2 — Design 3: "BANDS"
 *
 * Inspired by fulltime.jpg — "GOAL!" repeating in kinetic stacked bands
 * above and below a central score badge. Score lives in a KCVV green
 * circle. Strong diagonal energy throughout. Very clean, very bold.
 */
import type { ExplorationProps } from "./StyleA_StackedType";

const STENCIL: React.CSSProperties["fontFamily"] =
  'stenciletta, Impact, "Arial Narrow", sans-serif';
const SANS: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

export function Round2_Bands({
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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Background: diagonal gradient to add depth ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(160deg, #1E2836 0%, #1a1c20 45%, #1E2836 100%)",
          zIndex: 0,
        }}
      />

      {/* ── Diagonal accent lines ── */}
      {[
        { top: "8%", left: "-60px", width: "340px", opacity: 0.14 },
        { top: "12%", left: "-80px", width: "280px", opacity: 0.08 },
        { bottom: "8%", right: "-60px", width: "340px", opacity: 0.14 },
        { bottom: "12%", right: "-80px", width: "280px", opacity: 0.08 },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            height: "5px",
            background: "white",
            transform: "rotate(-28deg)",
            zIndex: 1,
            pointerEvents: "none",
            ...s,
          }}
        />
      ))}

      {/* ── KCVV logo + handle ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "60px 80px 0",
          zIndex: 2,
          flexShrink: 0,
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
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.1em",
          }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── TOP BANDS: GOAL! × 3, above the centerpiece ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "40px",
          gap: 0,
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        {/* Thin green separator line */}
        <div
          style={{
            width: "100%",
            height: "4px",
            background: "rgba(74,207,82,0.6)",
          }}
        />
        <div
          style={{
            fontFamily: STENCIL,
            fontSize: "260px",
            lineHeight: 0.88,
            color: "#4acf52",
            textAlign: "center",
            width: "100%",
            transform: "rotate(-1.5deg)",
          }}
        >
          GOAL!
        </div>
        <div
          style={{
            width: "100%",
            height: "3px",
            background: "rgba(74,207,82,0.35)",
          }}
        />
        <div
          style={{
            fontFamily: STENCIL,
            fontSize: "260px",
            lineHeight: 0.88,
            color: "rgba(74,207,82,0.55)",
            textAlign: "center",
            width: "100%",
            transform: "rotate(1deg)",
          }}
        >
          GOAL!
        </div>
        <div
          style={{
            width: "100%",
            height: "3px",
            background: "rgba(74,207,82,0.2)",
          }}
        />
        <div
          style={{
            fontFamily: STENCIL,
            fontSize: "260px",
            lineHeight: 0.88,
            color: "rgba(74,207,82,0.28)",
            textAlign: "center",
            width: "100%",
            transform: "rotate(-0.5deg)",
          }}
        >
          GOAL!
        </div>
        <div
          style={{
            width: "100%",
            height: "4px",
            background: "rgba(74,207,82,0.6)",
          }}
        />
      </div>

      {/* ── CENTERPIECE: Score badge ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          minHeight: 0,
          gap: "24px",
          zIndex: 2,
        }}
      >
        {/* Score circle */}
        <div
          style={{
            position: "relative",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "#4acf52",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 0 80px rgba(74,207,82,0.4), 0 0 200px rgba(74,207,82,0.15)",
            flexShrink: 0,
          }}
        >
          {/* Optional photo clipped to circle */}
          {celebrationImageUrl && (
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
                objectPosition: "top center",
                borderRadius: "50%",
                filter: "grayscale(60%) contrast(1.1)",
                mixBlendMode: "multiply",
                opacity: 0.35,
              }}
            />
          )}

          {/* Score */}
          <span
            style={{
              fontFamily: STENCIL,
              fontSize: "180px",
              lineHeight: 0.9,
              color: "#1E2024",
              position: "relative",
              zIndex: 1,
            }}
          >
            {score}
          </span>
        </div>

        {/* Player name + shirt number */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "28px",
          }}
        >
          <span
            style={{
              fontFamily: STENCIL,
              fontSize: "100px",
              color: "rgba(255,255,255,0.2)",
              lineHeight: 1,
            }}
          >
            {shirtNumber}
          </span>
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: "68px",
              lineHeight: 1,
              color: "white",
              textAlign: "center",
            }}
          >
            {playerName}
          </span>
        </div>

        <span
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: "38px",
            color: "#4acf52",
          }}
        >
          {minute}&apos;
        </span>
      </div>

      {/* ── BOTTOM BANDS: GOAL! × 3, mirrored ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "4px",
            background: "rgba(74,207,82,0.6)",
          }}
        />
        <div
          style={{
            fontFamily: STENCIL,
            fontSize: "260px",
            lineHeight: 0.88,
            color: "rgba(74,207,82,0.28)",
            textAlign: "center",
            width: "100%",
            transform: "rotate(0.5deg)",
          }}
        >
          GOAL!
        </div>
        <div
          style={{
            width: "100%",
            height: "3px",
            background: "rgba(74,207,82,0.35)",
          }}
        />
        <div
          style={{
            fontFamily: STENCIL,
            fontSize: "260px",
            lineHeight: 0.88,
            color: "rgba(74,207,82,0.55)",
            textAlign: "center",
            width: "100%",
            transform: "rotate(-1deg)",
          }}
        >
          GOAL!
        </div>
        <div
          style={{
            width: "100%",
            height: "3px",
            background: "rgba(74,207,82,0.2)",
          }}
        />
        <div
          style={{
            fontFamily: STENCIL,
            fontSize: "260px",
            lineHeight: 0.88,
            color: "#4acf52",
            textAlign: "center",
            width: "100%",
            transform: "rotate(1.5deg)",
          }}
        >
          GOAL!
        </div>
        <div
          style={{
            width: "100%",
            height: "4px",
            background: "rgba(74,207,82,0.6)",
          }}
        />
      </div>

      {/* ── Match name footer ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 80px 56px",
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: "34px",
            color: "rgba(255,255,255,0.45)",
            textAlign: "center",
          }}
        >
          {matchName}
        </span>
      </div>
    </div>
  );
}
