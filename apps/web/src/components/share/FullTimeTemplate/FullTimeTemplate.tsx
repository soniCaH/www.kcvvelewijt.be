import React from "react";
import {
  BODY_FONT,
  CAPTURE_HEIGHT,
  CAPTURE_WIDTH,
  TITLE_FONT,
} from "../constants";
const TORN_BOTTOM_CLIP = `polygon(
  0% 40%, 2% 38%, 5% 41%, 8% 38%, 11% 41%, 14% 38%,
  17% 41%, 20% 38%, 23% 41%, 26% 38%, 29% 41%,
  32% 38%, 35% 41%, 38% 38%, 41% 41%, 44% 38%,
  47% 41%, 50% 38%, 53% 41%, 56% 38%, 59% 41%,
  62% 38%, 65% 41%, 68% 38%, 71% 41%, 74% 38%,
  77% 41%, 80% 38%, 83% 41%, 86% 38%, 89% 41%,
  92% 38%, 95% 41%, 98% 38%, 100% 40%, 100% 100%, 0% 100%
)`;

export type FullTimeMood = "win" | "draw" | "loss";

export interface FullTimeTemplateProps {
  matchName: string;
  score: string;
  mood: FullTimeMood;
}

const MOOD = {
  win: {
    zone: "#008755",
    accent: "#4acf52",
    headline: "GEWONNEN!",
    headlineSize: "148px",
    accentAlpha: "rgba(74,207,82,0.6)",
  },
  draw: {
    zone: "#3a3a3a",
    accent: "#909090",
    headline: "GELIJKSPEL",
    headlineSize: "128px",
    accentAlpha: "rgba(144,144,144,0.4)",
  },
  loss: {
    zone: "#5a1a1a",
    accent: "#e05555",
    headline: "VERLOREN",
    headlineSize: "158px",
    accentAlpha: "rgba(224,85,85,0.5)",
  },
} as const;

/**
 * Full-time template — 1080x1920 Instagram Story image.
 * Round5_TornLeft design style. Score is the hero. Mood-driven zone color.
 */
export function FullTimeTemplate({
  matchName,
  score,
  mood,
}: FullTimeTemplateProps) {
  const m = MOOD[mood];
  const teams = matchName.split("—").map((s) => s.trim());
  const home = teams[0] ?? matchName;
  const away = teams[1] ?? "";

  return (
    <div
      style={{
        width: `${CAPTURE_WIDTH}px`,
        height: `${CAPTURE_HEIGHT}px`,
        position: "relative",
        overflow: "hidden",
        background: "#121a14",
      }}
    >
      {/* Upper zone: KCVV pattern */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "640px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "50% 20%",
          opacity: 0.1,
          zIndex: 1,
        }}
      />

      {/* Upper zone: top gradient */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(10,20,14,0.7) 0%, transparent 35%)",
          zIndex: 2,
        }}
      />

      {/* Score — hero element in upper zone */}
      <div
        style={{
          position: "absolute",
          top: "180px",
          left: "80px",
          fontFamily: TITLE_FONT,
          fontWeight: 900,
          fontSize: "380px",
          lineHeight: 1,
          color: "white",
          letterSpacing: "-0.04em",
          textShadow: "0 12px 80px rgba(0,0,0,0.7)",
          zIndex: 3,
        }}
      >
        {score}
      </div>

      {/* Torn lower zone */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: m.zone,
          clipPath: TORN_BOTTOM_CLIP,
          zIndex: 4,
        }}
      />

      {/* KCVV pattern on zone */}
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

      {/* Accent lines at torn boundary */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "715px",
          left: "-60px",
          width: "460px",
          height: "5px",
          background: m.accent,
          transform: "rotate(-0.8deg)",
          boxShadow: `0 0 12px ${m.accentAlpha}`,
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
          background: m.accent,
          transform: "rotate(-0.8deg)",
          boxShadow: `0 0 12px ${m.accentAlpha}`,
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
          background: m.accent,
          opacity: 0.4,
          zIndex: 6,
          pointerEvents: "none",
        }}
      />

      {/* Headline: mood-driven */}
      <div
        style={{
          position: "absolute",
          top: "640px",
          left: "80px",
          fontFamily: TITLE_FONT,
          fontWeight: 900,
          fontSize: m.headlineSize,
          lineHeight: 0.84,
          color: "white",
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          textShadow: "6px 8px 0px rgba(0,0,0,0.8)",
          whiteSpace: "nowrap",
          zIndex: 8,
        }}
      >
        {m.headline}
      </div>

      {/* Info in zone: match teams */}
      <div
        style={{
          position: "absolute",
          top: "940px",
          left: "80px",
          right: "80px",
          zIndex: 8,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 800,
            fontSize: "26px",
            color: m.accent,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          Eindstand
        </div>
        <div
          style={{
            fontFamily: TITLE_FONT,
            fontWeight: 900,
            fontSize: "68px",
            color: "white",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {home}
        </div>
        {away && (
          <>
            <div
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 800,
                fontSize: "36px",
                color: m.accent,
                marginTop: "8px",
              }}
            >
              VS
            </div>
            <div
              style={{
                fontFamily: TITLE_FONT,
                fontWeight: 900,
                fontSize: "68px",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {away}
            </div>
          </>
        )}
      </div>

      {/* Info in zone: full match name */}
      <div
        style={{
          position: "absolute",
          top: "1450px",
          left: "80px",
          right: "80px",
          zIndex: 8,
          borderTop: "3px solid rgba(255,255,255,0.16)",
          paddingTop: "28px",
        }}
      >
        <div
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 600,
            fontSize: "32px",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {matchName}
        </div>
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
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          style={{ width: "88px", height: "88px", objectFit: "contain" }}
        />
        <div
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: "28px",
            color: "rgba(255,255,255,0.48)",
            letterSpacing: "0.12em",
          }}
        >
          @kcvvelewijt
        </div>
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
          alignItems: "center",
          gap: "24px",
          zIndex: 9,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt=""
          aria-hidden="true"
          style={{
            width: "64px",
            height: "64px",
            objectFit: "contain",
            opacity: 0.7,
          }}
        />
        <div
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: "26px",
            color: "rgba(255,255,255,0.38)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          kcvvelewijt.be
        </div>
      </div>
    </div>
  );
}
