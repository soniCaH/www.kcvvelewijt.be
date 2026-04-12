import React from "react";

const TITLE: React.CSSProperties["fontFamily"] =
  "quasimoda, -apple-system, system-ui, Montserrat, Verdana, sans-serif";
const BODY: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

const TORN_POLYGON =
  "polygon(0% 40%, 2% 38%, 5% 41%, 8% 38%, 11% 41%, 14% 38%, 17% 41%, 20% 38%, 23% 41%, 26% 38%, 29% 41%, 32% 38%, 35% 41%, 38% 38%, 41% 41%, 44% 38%, 47% 41%, 50% 38%, 53% 41%, 56% 38%, 59% 41%, 62% 38%, 65% 41%, 68% 38%, 71% 41%, 74% 38%, 77% 41%, 80% 38%, 83% 41%, 86% 38%, 89% 41%, 92% 38%, 95% 41%, 98% 38%, 100% 40%, 100% 100%, 0% 100%)";

export interface GoalOpponentTemplateProps {
  score: string;
  matchName: string;
  minute: string;
}

/**
 * Goal opponent template — 1080x1920 Instagram Story image.
 * Muted/subdued Round5_TornLeft variant: acknowledgment, not celebration.
 * Rendered at exact pixel dimensions so html-to-image captures at that resolution.
 */
export function GoalOpponentTemplate({
  score,
  matchName,
  minute,
}: GoalOpponentTemplateProps) {
  const team1 = matchName.split("—")[0]?.trim() ?? matchName;
  const team2 = matchName.split("—")[1]?.trim() ?? "Wedstrijd";

  return (
    <div
      style={{
        width: "1080px",
        height: "1920px",
        background: "#0d1810",
        position: "relative",
        overflow: "hidden",
        fontFamily: BODY,
      }}
    >
      {/* ── Upper zone: subtle radial gradient (no photo) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1080px",
          height: "730px",
          background:
            "radial-gradient(ellipse 60% 50% at 60% 30%, #1a2e1e 0%, #0d1810 100%)",
        }}
      />

      {/* KCVV pattern in upper zone */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1080px",
          height: "730px",
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "100% auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          opacity: 0.05,
        }}
      />

      {/* Top gradient */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1080px",
          height: "730px",
          background:
            "linear-gradient(to bottom, rgba(5,12,8,0.8) 0%, transparent 30%)",
        }}
      />

      {/* ── Lower zone: very dark green torn section ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1080px",
          height: "1920px",
          background: "#162418",
          clipPath: TORN_POLYGON,
          zIndex: 1,
        }}
      />

      {/* KCVV pattern on lower zone */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1080px",
          height: "1920px",
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "100% auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          opacity: 0.06,
          clipPath: TORN_POLYGON,
          zIndex: 2,
        }}
      />

      {/* ── Accent lines at torn boundary — subtle white ── */}
      {/* Line 1: left, at torn top */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "715px",
          left: "-60px",
          width: "460px",
          height: "5px",
          background: "rgba(255,255,255,0.1)",
          transform: "rotate(-0.8deg)",
          zIndex: 6,
        }}
      />
      {/* Line 2: right, below torn */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "792px",
          right: "-40px",
          width: "380px",
          height: "5px",
          background: "rgba(255,255,255,0.1)",
          transform: "rotate(-0.8deg)",
          zIndex: 6,
        }}
      />
      {/* Line 3: left, subtle */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "698px",
          left: "40px",
          width: "220px",
          height: "3px",
          background: "rgba(255,255,255,0.1)",
          zIndex: 6,
        }}
      />

      {/* ── Top bar ── */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: "80px",
          right: "80px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 9,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          style={{
            width: "88px",
            height: "88px",
            objectFit: "contain",
            opacity: 0.5,
          }}
        />
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: "28px",
            color: "rgba(255,255,255,0.28)",
            letterSpacing: "0.04em",
          }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── Headline: GOAL (muted) ── */}
      <div
        style={{
          position: "absolute",
          left: "80px",
          top: "635px",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "260px",
          color: "rgba(255,255,255,0.35)",
          lineHeight: 0.84,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          zIndex: 8,
        }}
      >
        GOAL
      </div>

      {/* ── Info section: score + minute ── */}
      <div
        style={{
          position: "absolute",
          top: "940px",
          left: "80px",
          right: "80px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          zIndex: 8,
        }}
      >
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: "28px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Tegenstander
        </span>
        <span
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "160px",
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: "36px",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          {minute}&apos; Minuten
        </span>
      </div>

      {/* ── Match name section ── */}
      <div
        style={{
          position: "absolute",
          top: "1400px",
          left: "80px",
          right: "80px",
          borderTop: "2px solid rgba(255,255,255,0.08)",
          paddingTop: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 8,
        }}
      >
        <span
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "50px",
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          {team1}
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: "30px",
            color: "rgba(255,255,255,0.25)",
            lineHeight: 1.2,
          }}
        >
          {team2}
        </span>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          position: "absolute",
          bottom: "60px",
          left: "80px",
          right: "80px",
          display: "flex",
          flexDirection: "row",
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
            opacity: 0.35,
          }}
        />
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: "26px",
            color: "rgba(255,255,255,0.2)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          kcvvelewijt.be
        </span>
      </div>
    </div>
  );
}
