import React from "react";

const TITLE: React.CSSProperties["fontFamily"] =
  "quasimoda, -apple-system, system-ui, Montserrat, Verdana, sans-serif";
const BODY: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';
const TORN_BOTTOM_CLIP = `polygon(
  0% 40%, 2% 38%, 5% 41%, 8% 38%, 11% 41%, 14% 38%,
  17% 41%, 20% 38%, 23% 41%, 26% 38%, 29% 41%,
  32% 38%, 35% 41%, 38% 38%, 41% 41%, 44% 38%,
  47% 41%, 50% 38%, 53% 41%, 56% 38%, 59% 41%,
  62% 38%, 65% 41%, 68% 38%, 71% 41%, 74% 38%,
  77% 41%, 80% 38%, 83% 41%, 86% 38%, 89% 41%,
  92% 38%, 95% 41%, 98% 38%, 100% 40%, 100% 100%, 0% 100%
)`;

const ZONE_COLOR = "#008755";
const ACCENT_COLOR = "#4acf52";
const CARD_COLOR = "#f59e0b";

export interface YellowCardOpponentTemplateProps {
  matchName: string;
  minute: string;
}

/**
 * Yellow card opponent template — 1080×1920 Instagram Story image.
 * Round5_TornLeft design style. Green accent — good news for KCVV.
 */
export function YellowCardOpponentTemplate({
  matchName,
  minute,
}: YellowCardOpponentTemplateProps) {
  const parts = matchName.split("—").map((p) => p.trim());
  const matchPart1 = parts[0];
  const matchPart2 = parts[1] ?? "";

  return (
    <div
      style={{
        position: "relative",
        width: "1080px",
        height: "1920px",
        overflow: "hidden",
        background: "#121a14",
      }}
    >
      {/* KCVV pattern — upper zone background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "640px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "65% 22%",
          opacity: 0.08,
          zIndex: 1,
        }}
      />

      {/* Green glow behind card area */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "600px",
          height: "700px",
          background:
            "radial-gradient(ellipse 70% 60% at 70% 35%, rgba(0,135,85,0.2) 0%, transparent 70%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Top gradient */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(10,20,14,0.68) 0%, transparent 30%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Card shape — upper right */}
      <div
        style={{
          position: "absolute",
          top: "155px",
          right: "130px",
          width: "210px",
          height: "295px",
          background: CARD_COLOR,
          borderRadius: "16px",
          transform: "rotate(9deg)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.75)",
          zIndex: 3,
        }}
      />

      {/* Torn zone */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: ZONE_COLOR,
          clipPath: TORN_BOTTOM_CLIP,
          zIndex: 4,
        }}
      />

      {/* Pattern on torn zone */}
      <div
        aria-hidden="true"
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

      {/* Accent lines */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "715px",
          left: "-60px",
          width: "460px",
          height: "5px",
          background: ACCENT_COLOR,
          transform: "rotate(-0.8deg)",
          boxShadow: `0 0 12px ${ACCENT_COLOR}88`,
          zIndex: 6,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "792px",
          right: "-40px",
          width: "380px",
          height: "5px",
          background: ACCENT_COLOR,
          transform: "rotate(-0.8deg)",
          boxShadow: `0 0 12px ${ACCENT_COLOR}88`,
          zIndex: 6,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "698px",
          left: "40px",
          width: "220px",
          height: "3px",
          background: ACCENT_COLOR,
          opacity: 0.4,
          zIndex: 6,
          pointerEvents: "none",
        }}
      />

      {/* Headline — "GEEL!" */}
      <div
        style={{
          position: "absolute",
          top: "640px",
          left: "80px",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "245px",
          lineHeight: 0.84,
          color: "white",
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          textShadow: "6px 8px 0px rgba(0,0,0,0.8)",
          whiteSpace: "nowrap",
          zIndex: 8,
        }}
      >
        GEEL!
      </div>

      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: "80px",
          right: "80px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 9,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/kcvv-logo.png" alt="KCVV" width={88} height={88} />
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

      {/* Info block */}
      <div
        style={{
          position: "absolute",
          top: "940px",
          left: "80px",
          right: "80px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 8,
        }}
      >
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: "26px",
            color: ACCENT_COLOR,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          Tegenstander
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: "54px",
            lineHeight: 1,
            color: "white",
          }}
        >
          Gele kaart
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: "40px",
            color: ACCENT_COLOR,
            marginTop: "4px",
          }}
        >
          {minute}&apos; Minuten
        </span>
      </div>

      {/* Match section */}
      <div
        style={{
          position: "absolute",
          top: "1350px",
          left: "80px",
          right: "80px",
          borderTop: "3px solid rgba(255,255,255,0.16)",
          paddingTop: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 8,
        }}
      >
        <span
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "54px",
            color: "white",
            textTransform: "uppercase",
          }}
        >
          {matchPart1}
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: "32px",
            color: "#4acf52",
          }}
        >
          {matchPart2}
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "60px",
          left: "80px",
          right: "80px",
          display: "flex",
          flexDirection: "row",
          gap: "24px",
          alignItems: "center",
          zIndex: 9,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/kcvv-logo.png"
          alt="KCVV"
          width={64}
          height={64}
          style={{ opacity: 0.7 }}
        />
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: "26px",
            color: "rgba(255,255,255,0.38)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          kcvvelewijt.be
        </span>
      </div>
    </div>
  );
}
