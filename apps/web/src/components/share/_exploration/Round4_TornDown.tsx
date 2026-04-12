/**
 * Round 4 — Design 3: "TORN DOWN"
 *
 * Photo fills the upper 40% as a full-bleed cinematic shot.
 * A torn paper edge at 40% height separates the photo zone
 * from a dark green (#008755) lower zone.
 * "GOAL!" in massive white Quasimoda straddles the tear —
 * half on photo, half punching into the green zone below.
 * All match info lives in the generous dark green space.
 */
import type { ExplorationProps } from "./StyleA_StackedType";
import { BODY_FONT, TITLE_FONT } from "../constants";

/** Torn-paper clip for the lower dark-green zone — jagged top edge at ~40% height */
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

export function Round4_TornDown({
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
      {/* ── Full-bleed photo — upper zone hero ── */}
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
            filter: "grayscale(25%) contrast(1.08) brightness(0.75)",
            zIndex: 1,
          }}
        />
      ) : (
        /* No photo — dark radial on black background */
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 100% 80% at 50% 25%, #008755 0%, #004d30 55%, #121a14 100%)",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/images/header-pattern.png)",
              backgroundSize: "760px auto",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center 20%",
              opacity: 0.14,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          {/* Ghost shirt number in the photo zone */}
          <div
            style={{
              position: "absolute",
              top: "0px",
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: TITLE_FONT,
              fontWeight: 900,
              fontSize: "520px",
              lineHeight: 0.9,
              color: "rgba(255,255,255,0.07)",
              letterSpacing: "-0.05em",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            {shirtNumber}
          </div>
        </>
      )}

      {/* ── Darkening gradient over the photo ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(10,20,14,0.65) 0%, rgba(10,20,14,0.15) 22%, transparent 40%, transparent 55%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* ── Lower dark green zone — clipped with torn top edge ── */}
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
          backgroundSize: "560px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 65%",
          opacity: 0.1,
          clipPath: TORN_BOTTOM_CLIP,
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* ── Bright green accent lines flanking the tear ── */}
      {[
        {
          left: "-80px",
          width: "440px",
          top: "37.5%",
          rotate: "0deg",
          opacity: 0.7,
        },
        {
          right: "-60px",
          width: "360px",
          top: "41.5%",
          rotate: "0deg",
          opacity: 0.7,
        },
        {
          left: "20px",
          width: "240px",
          top: "36%",
          rotate: "0deg",
          opacity: 0.35,
        },
        {
          right: "0px",
          width: "200px",
          top: "43%",
          rotate: "0deg",
          opacity: 0.35,
        },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            height: "5px",
            background: "#4acf52",
            transform: `rotate(-1.5deg)`,
            boxShadow: "0 0 10px rgba(74,207,82,0.6)",
            zIndex: 6,
            pointerEvents: "none",
            ...s,
          }}
        />
      ))}

      {/* ── "GOAL!" — straddles the torn boundary ── */}
      {/* Ghost behind — very large, slightly offset for depth */}
      <div
        style={{
          position: "absolute",
          top: "544px",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: TITLE_FONT,
          fontWeight: 900,
          fontSize: "530px",
          lineHeight: 0.84,
          color: "rgba(255,255,255,0.06)",
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

      {/* Main GOAL! — white, z above torn zone */}
      <div
        style={{
          position: "absolute",
          top: "564px",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: TITLE_FONT,
          fontWeight: 900,
          fontSize: "490px",
          lineHeight: 0.84,
          color: "white",
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          textShadow:
            "0 10px 80px rgba(0,0,0,0.9), 4px 6px 0px rgba(0,0,0,0.6)",
          zIndex: 7,
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

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
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: "28px",
            color: "rgba(255,255,255,0.48)",
            letterSpacing: "0.12em",
          }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── Player name rotated on left edge ── */}
      <div
        style={{
          position: "absolute",
          left: "-205px",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          fontFamily: BODY_FONT,
          fontWeight: 900,
          fontSize: "38px",
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.65)",
          whiteSpace: "nowrap",
          zIndex: 8,
        }}
      >
        {playerName} &bull; {minute}&apos;
      </div>

      {/* ── Green zone content ── */}

      {/* Minute */}
      <div
        style={{
          position: "absolute",
          top: "1090px",
          left: "80px",
          zIndex: 8,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 800,
            fontSize: "26px",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Minuut
        </span>
        <span
          style={{
            fontFamily: TITLE_FONT,
            fontWeight: 900,
            fontSize: "200px",
            lineHeight: 0.88,
            color: "white",
            letterSpacing: "-0.04em",
          }}
        >
          {minute}
          <span
            style={{
              fontSize: "80px",
              color: "#4acf52",
              letterSpacing: 0,
              marginLeft: "8px",
            }}
          >
            &apos;
          </span>
        </span>
      </div>

      {/* Player name */}
      <div
        style={{
          position: "absolute",
          top: "1340px",
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
            fontFamily: BODY_FONT,
            fontWeight: 800,
            fontSize: "26px",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Doelpunt
        </span>
        <span
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 800,
            fontSize: "72px",
            lineHeight: 1,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {playerName}
        </span>
      </div>

      {/* Score pill */}
      <div
        style={{
          position: "absolute",
          top: "1530px",
          left: "80px",
          display: "flex",
          alignItems: "center",
          background: "rgba(0,0,0,0.3)",
          border: "4px solid rgba(255,255,255,0.2)",
          borderRadius: "14px",
          padding: "18px 44px",
          gap: "20px",
          zIndex: 8,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV"
          style={{ width: "60px", height: "60px", objectFit: "contain" }}
        />
        <span
          style={{
            fontFamily: TITLE_FONT,
            fontWeight: 900,
            fontSize: "90px",
            color: "#4acf52",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {score}
        </span>
      </div>

      {/* Match name */}
      <div
        style={{
          position: "absolute",
          top: "1720px",
          left: "80px",
          right: "80px",
          zIndex: 8,
          borderTop: "3px solid rgba(255,255,255,0.2)",
          paddingTop: "24px",
        }}
      >
        <span
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 600,
            fontSize: "30px",
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.06em",
          }}
        >
          {matchName}
        </span>
      </div>
    </div>
  );
}
