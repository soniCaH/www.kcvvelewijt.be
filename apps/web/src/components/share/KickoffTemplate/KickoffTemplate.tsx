import React from "react";

const TITLE: React.CSSProperties["fontFamily"] =
  "quasimoda, acumin-pro, Montserrat, Verdana, sans-serif";
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

export interface KickoffTemplateProps {
  matchName: string;
}

/**
 * Kick-off template — 1080x1920 Instagram Story image.
 * Round5_TornLeft design style. Green background, signals start of match.
 */
export function KickoffTemplate({ matchName }: KickoffTemplateProps) {
  const teams = matchName.split("—").map((s) => s.trim());
  const home = teams[0] ?? matchName;
  const away = teams[1] ?? "";

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
      {/* Upper zone: KCVV pattern full background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "680px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "65% 25%",
          opacity: 0.12,
          zIndex: 1,
        }}
      />

      {/* Upper zone: radial glow behind logo area */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 55% 45% at 68% 28%, rgba(0,135,85,0.35) 0%, transparent 70%)",
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
            "linear-gradient(to bottom, rgba(10,20,14,0.65) 0%, transparent 28%)",
          zIndex: 2,
        }}
      />

      {/* Upper zone: KCVV logo centered-right */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logos/kcvv-logo.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "160px",
          right: "120px",
          width: "280px",
          height: "280px",
          objectFit: "contain",
          opacity: 0.9,
          zIndex: 3,
        }}
      />

      {/* Torn lower zone */}
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
          background: ACCENT_COLOR,
          transform: "rotate(-0.8deg)",
          boxShadow: `0 0 12px rgba(74,207,82,0.6)`,
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
          boxShadow: `0 0 12px rgba(74,207,82,0.6)`,
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

      {/* Headline: "KICK-" */}
      <div
        style={{
          position: "absolute",
          top: "460px",
          left: "80px",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "235px",
          lineHeight: 0.84,
          color: "white",
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          textShadow: "6px 8px 0px rgba(0,0,0,0.8)",
          zIndex: 8,
        }}
      >
        KICK-
      </div>

      {/* Headline: "OFF" */}
      <div
        style={{
          position: "absolute",
          top: "648px",
          left: "80px",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "235px",
          lineHeight: 0.84,
          color: "white",
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          textShadow: "6px 8px 0px rgba(0,0,0,0.8)",
          zIndex: 8,
        }}
      >
        OFF
      </div>

      {/* Info in green zone: match teams */}
      <div
        style={{
          position: "absolute",
          top: "900px",
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
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: "26px",
            color: ACCENT_COLOR,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          Wedstrijd
        </div>
        <div
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "72px",
            color: "white",
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {home}
        </div>
        {away && (
          <>
            <div
              style={{
                fontFamily: BODY,
                fontWeight: 800,
                fontSize: "36px",
                color: ACCENT_COLOR,
                letterSpacing: "0.2em",
                marginTop: "8px",
              }}
            >
              VS
            </div>
            <div
              style={{
                fontFamily: TITLE,
                fontWeight: 900,
                fontSize: "72px",
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

      {/* Info in green zone: full match name */}
      <div
        style={{
          position: "absolute",
          top: "1500px",
          left: "80px",
          right: "80px",
          zIndex: 8,
          borderTop: "3px solid rgba(255,255,255,0.16)",
          paddingTop: "28px",
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: "34px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.04em",
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
            fontFamily: BODY,
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
            fontFamily: BODY,
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
