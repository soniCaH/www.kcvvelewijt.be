/**
 * Round 5 — "TORN LEFT"
 *
 * Synthesis of R4_TornDown + R4_SideBlob:
 * - Full-bleed photo, right-biased — player glows on the right side
 * - Left side of photo darkened via gradient so the headline reads cleanly
 * - "GOAL" left-aligned in massive Quasimoda, sitting in the darkened photo zone
 * - Horizontal torn-paper edge at 40% height
 * - "!" punches through the tear into the dark green zone below
 * - Dark green lower zone has SideBlob-style info grid:
 *   shirt# | divider | score, then player name + minute
 * - Match name at the very bottom
 */
import type { ExplorationProps } from "./StyleA_StackedType";

const TITLE: React.CSSProperties["fontFamily"] =
  "quasimoda, -apple-system, system-ui, Montserrat, Verdana, sans-serif";
const BODY: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

/** Torn-paper clip for the dark-green lower zone — jagged top edge at ~40% height */
const TORN_BOTTOM_CLIP = `polygon(
  0% 40%,
  2% 38%, 5% 41%, 8% 38%, 11% 41%, 14% 38%,
  17% 41%, 20% 38%, 23% 41%, 26% 38%, 29% 41%,
  32% 38%, 35% 41%, 38% 38%, 41% 41%, 44% 38%,
  47% 41%, 50% 38%, 53% 41%, 56% 38%, 59% 41%,
  62% 38%, 65% 41%, 68% 38%, 71% 41%, 74% 38%,
  77% 41%, 80% 38%, 83% 41%, 86% 38%, 89% 41%,
  92% 38%, 95% 41%, 98% 38%, 100% 40%,
  100% 100%,
  0% 100%
)`;

export function Round5_TornLeft({
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
        background: "#121a14",
      }}
    >
      {/* ── Full-bleed photo — right-biased so player is in the lit half ── */}
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
            objectPosition: "70% top",
            filter: "grayscale(20%) contrast(1.1) brightness(0.82)",
            zIndex: 1,
          }}
        />
      ) : (
        /* No photo — dark radial, player's shirt number on right as ghost */
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 80% 60% at 72% 25%, #008755 0%, #004d30 55%, #121a14 100%)",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/images/header-pattern.png)",
              backgroundSize: "640px auto",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "70% 18%",
              opacity: 0.13,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: "20px",
              fontFamily: TITLE,
              fontWeight: 900,
              fontSize: "580px",
              lineHeight: 0.9,
              color: "rgba(255,255,255,0.06)",
              letterSpacing: "-0.05em",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            {shirtNumber}
          </div>
        </>
      )}

      {/* ── Left-side darkening gradient — makes headline zone read on any photo ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(10,20,14,0.92) 0%, rgba(10,20,14,0.62) 40%, rgba(10,20,14,0.18) 65%, transparent 85%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* ── Top gradient — keeps logo bar readable ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(10,20,14,0.72) 0%, transparent 30%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* ── Lower dark green zone — torn top edge ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#008755",
          clipPath: TORN_BOTTOM_CLIP,
          zIndex: 4,
        }}
      />

      {/* ── KCVV pattern on the green zone ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "520px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 68%",
          opacity: 0.09,
          clipPath: TORN_BOTTOM_CLIP,
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* ── Bright green accent lines flanking the tear ── */}
      <div
        style={{
          position: "absolute",
          top: "715px",
          left: "-60px",
          width: "460px",
          height: "5px",
          background: "#4acf52",
          transform: "rotate(-0.8deg)",
          boxShadow: "0 0 12px rgba(74,207,82,0.6)",
          zIndex: 6,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "792px",
          right: "-40px",
          width: "380px",
          height: "5px",
          background: "#4acf52",
          transform: "rotate(-0.8deg)",
          boxShadow: "0 0 12px rgba(74,207,82,0.6)",
          zIndex: 6,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "698px",
          left: "40px",
          width: "220px",
          height: "3px",
          background: "#4acf52",
          opacity: 0.4,
          zIndex: 6,
          pointerEvents: "none",
        }}
      />

      {/* ── Top bar: KCVV logo + handle ── */}
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
            color: "rgba(255,255,255,0.48)",
            letterSpacing: "0.12em",
          }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── "GOAL!" — single line, left-aligned, straddles the torn boundary ── */}
      {/* 260px keeps the full word on one line within the 1080px canvas */}
      <div
        style={{
          position: "absolute",
          top: "635px",
          left: "80px",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "260px",
          lineHeight: 0.84,
          color: "white",
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          textShadow: "6px 8px 0px rgba(0,0,0,0.8)",
          whiteSpace: "nowrap",
          zIndex: 8,
        }}
      >
        GOAL!
      </div>

      {/* ── Info grid in the dark green zone ── */}

      {/* Player name block */}
      <div
        style={{
          position: "absolute",
          top: "940px",
          left: "80px",
          right: "80px",
          zIndex: 8,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: "26px",
            color: "#4acf52",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          Doelpunt
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: "74px",
            lineHeight: 1,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {playerName}
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: "40px",
            color: "#4acf52",
            letterSpacing: "0.06em",
            marginTop: "4px",
          }}
        >
          {minute}&apos; Minuten
        </span>
      </div>

      {/* Shirt number + Score row */}
      <div
        style={{
          position: "absolute",
          top: "1290px",
          left: "80px",
          display: "flex",
          alignItems: "flex-end",
          gap: "48px",
          zIndex: 8,
        }}
      >
        {/* Shirt number */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: BODY,
              fontWeight: 800,
              fontSize: "24px",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Nr.
          </span>
          <span
            style={{
              fontFamily: TITLE,
              fontWeight: 900,
              fontSize: "160px",
              lineHeight: 1,
              color: "white",
              letterSpacing: "-0.04em",
            }}
          >
            {shirtNumber}
          </span>
        </div>

        {/* Vertical divider */}
        <div
          style={{
            width: "3px",
            height: "130px",
            background: "rgba(255,255,255,0.2)",
            marginBottom: "10px",
          }}
        />

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: BODY,
              fontWeight: 800,
              fontSize: "24px",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Stand
          </span>
          <span
            style={{
              fontFamily: TITLE,
              fontWeight: 900,
              fontSize: "110px",
              lineHeight: 1,
              color: "#4acf52",
              letterSpacing: "-0.03em",
            }}
          >
            {score}
          </span>
        </div>
      </div>

      {/* Match name */}
      <div
        style={{
          position: "absolute",
          top: "1590px",
          left: "80px",
          right: "80px",
          zIndex: 8,
          borderTop: "3px solid rgba(255,255,255,0.16)",
          paddingTop: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "54px",
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          {matchName.split("—")[0]?.trim() ?? matchName}
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: "32px",
            color: "#4acf52",
            letterSpacing: "0.06em",
          }}
        >
          {matchName.split("—")[1]?.trim() ?? "KCVV Elewijt"}
        </span>
      </div>

      {/* KCVV logo row at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "60px",
          left: "80px",
          right: "80px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          zIndex: 9,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          style={{
            width: "64px",
            height: "64px",
            objectFit: "contain",
            opacity: 0.7,
          }}
        />
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: "26px",
            color: "rgba(255,255,255,0.38)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          kcvvelewijt.be
        </span>
      </div>
    </div>
  );
}
