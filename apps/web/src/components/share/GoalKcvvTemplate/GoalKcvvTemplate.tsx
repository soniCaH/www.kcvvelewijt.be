import React from "react";
import { BODY_FONT, TITLE_FONT } from "../constants";

const TORN_POLYGON =
  "polygon(0% 40%, 2% 38%, 5% 41%, 8% 38%, 11% 41%, 14% 38%, 17% 41%, 20% 38%, 23% 41%, 26% 38%, 29% 41%, 32% 38%, 35% 41%, 38% 38%, 41% 41%, 44% 38%, 47% 41%, 50% 38%, 53% 41%, 56% 38%, 59% 41%, 62% 38%, 65% 41%, 68% 38%, 71% 41%, 74% 38%, 77% 41%, 80% 38%, 83% 41%, 86% 38%, 89% 41%, 92% 38%, 95% 41%, 98% 38%, 100% 40%, 100% 100%, 0% 100%)";

export interface GoalKcvvTemplateProps {
  playerName: string;
  shirtNumber?: number;
  score: string;
  matchName: string;
  minute: string;
  celebrationImageUrl?: string;
}

/**
 * Goal KCVV template — 1080x1920 Instagram Story image.
 * Round5_TornLeft design pattern.
 * Rendered at exact pixel dimensions so html-to-image captures at that resolution.
 */
export function GoalKcvvTemplate({
  playerName,
  shirtNumber,
  score,
  matchName,
  minute,
  celebrationImageUrl,
}: GoalKcvvTemplateProps) {
  const parts = matchName.split(/—| - /).map((s) => s.trim());
  const team1 = parts[0] ?? matchName;
  const team2 = parts[1] ?? "";

  return (
    <div
      style={{
        width: "1080px",
        height: "1920px",
        background: "#121a14",
        position: "relative",
        overflow: "hidden",
        fontFamily: BODY_FONT,
      }}
    >
      {/* ── Upper zone: photo or no-photo fallback ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1080px",
          height: "730px",
          overflow: "hidden",
        }}
      >
        {celebrationImageUrl ? (
          <>
            {/* Full-bleed photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={celebrationImageUrl}
              alt={`${playerName} celebration`}
              crossOrigin="anonymous"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "70% top",
                filter: "grayscale(20%) contrast(1.1) brightness(0.82)",
              }}
            />
            {/* Left-side darkening gradient */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, rgba(10,20,14,0.92) 0%, rgba(10,20,14,0.62) 40%, rgba(10,20,14,0.18) 65%, transparent 85%)",
              }}
            />
          </>
        ) : (
          <>
            {/* No-photo fallback: dark green radial gradient */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 80% 60% at 72% 25%, #008755 0%, #004d30 55%, #121a14 100%)",
              }}
            />
            {/* KCVV pattern */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url(/images/header-pattern.png)",
                backgroundSize: "640px auto",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "70% 18%",
                opacity: 0.13,
              }}
            />
            {/* Ghost shirt number */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "20px",
                top: "-20px",
                fontFamily: TITLE_FONT,
                fontWeight: 900,
                fontSize: "580px",
                lineHeight: 1,
                color: "rgba(255,255,255,0.06)",
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {shirtNumber ?? "—"}
            </div>
          </>
        )}
        {/* Top gradient */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(10,20,14,0.72) 0%, transparent 30%)",
          }}
        />
      </div>

      {/* ── Lower zone: green torn section ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1080px",
          height: "1920px",
          background: "#008755",
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
          opacity: 0.09,
          clipPath: TORN_POLYGON,
          zIndex: 2,
        }}
      />

      {/* ── Accent lines at torn boundary ── */}
      {/* Line 1: left, at torn top */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "715px",
          left: "-60px",
          width: "460px",
          height: "5px",
          background: "#4acf52",
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
          background: "#4acf52",
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
          background: "#4acf52",
          opacity: 0.4,
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
          style={{ width: "88px", height: "88px", objectFit: "contain" }}
        />
        <span
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: "28px",
            color: "rgba(255,255,255,0.48)",
            letterSpacing: "0.04em",
          }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── Headline: GOAL! ── */}
      <div
        style={{
          position: "absolute",
          left: "80px",
          top: "635px",
          fontFamily: TITLE_FONT,
          fontWeight: 900,
          fontSize: "260px",
          color: "white",
          lineHeight: 0.84,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          textShadow: "6px 8px 0px rgba(0,0,0,0.8)",
          whiteSpace: "nowrap",
          zIndex: 8,
        }}
      >
        GOAL!
      </div>

      {/* ── Player block ── */}
      <div
        style={{
          position: "absolute",
          top: "940px",
          left: "80px",
          right: "80px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 8,
        }}
      >
        <span
          style={{
            fontFamily: BODY_FONT,
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
            fontFamily: BODY_FONT,
            fontWeight: 800,
            fontSize: "74px",
            color: "white",
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {playerName}
        </span>
        <span
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: "40px",
            color: "#4acf52",
            marginTop: "4px",
          }}
        >
          {minute}&apos; Minuten
        </span>
      </div>

      {/* ── Stats row ── */}
      <div
        style={{
          position: "absolute",
          top: "1290px",
          left: "80px",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: "48px",
          zIndex: 8,
        }}
      >
        {/* Nr. column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          <span
            style={{
              fontFamily: BODY_FONT,
              fontWeight: 400,
              fontSize: "24px",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Nr.
          </span>
          <span
            style={{
              fontFamily: TITLE_FONT,
              fontWeight: 900,
              fontSize: "160px",
              color: "white",
              lineHeight: 1,
            }}
          >
            {shirtNumber ?? "—"}
          </span>
        </div>

        {/* Divider */}
        <div
          aria-hidden="true"
          style={{
            width: "3px",
            height: "130px",
            background: "rgba(255,255,255,0.2)",
            flexShrink: 0,
            marginBottom: "16px",
          }}
        />

        {/* Stand column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          <span
            style={{
              fontFamily: BODY_FONT,
              fontWeight: 400,
              fontSize: "24px",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Stand
          </span>
          <span
            style={{
              fontFamily: TITLE_FONT,
              fontWeight: 900,
              fontSize: "110px",
              color: "#4acf52",
              lineHeight: 1,
            }}
          >
            {score}
          </span>
        </div>
      </div>

      {/* ── Match name section ── */}
      <div
        style={{
          position: "absolute",
          top: "1590px",
          left: "80px",
          right: "80px",
          borderTop: "3px solid rgba(255,255,255,0.16)",
          paddingTop: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 8,
        }}
      >
        <span
          style={{
            fontFamily: TITLE_FONT,
            fontWeight: 900,
            fontSize: "54px",
            color: "white",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          {team1}
        </span>
        <span
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 600,
            fontSize: "32px",
            color: "#4acf52",
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
            opacity: 0.7,
          }}
        />
        <span
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: "26px",
            color: "rgba(255,255,255,0.38)",
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
