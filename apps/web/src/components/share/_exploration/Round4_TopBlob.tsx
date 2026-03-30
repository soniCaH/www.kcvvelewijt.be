/**
 * Round 4 — Design 1: "TOP BLOB"
 *
 * Directly inspired by style.jpg:
 * - Pure black background
 * - Photo lives in an organic ink-blob zone at the top
 * - White ink shards explode from the blob's bottom edge
 * - "GOAL" (white) + "!" (dark green) in massive Quasimoda below the blast
 * - Three-column info grid (shirt# | score pill | minute)
 * - Bright green bottom bar with match name + chevron marks
 */
import type { ExplorationProps } from "./StyleA_StackedType";

const TITLE: React.CSSProperties["fontFamily"] =
  "quasimoda, acumin-pro, Montserrat, Verdana, sans-serif";
const BODY: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

/** Organic blob clip-path for the photo zone — jagged bottom, slight top irregularity */
const BLOB_CLIP = `polygon(
  0% 3%, 6% 1%, 12% 3%, 18% 1%, 24% 3%, 30% 0%, 36% 2%,
  42% 0%, 48% 2%, 54% 0%, 60% 2%, 66% 0%, 72% 2%, 78% 0%,
  84% 2%, 90% 0%, 96% 2%, 100% 4%,
  100% 75%,
  96% 80%, 92% 74%, 88% 82%, 84% 76%, 80% 84%, 76% 78%,
  72% 86%, 68% 79%, 64% 88%, 60% 81%, 56% 89%, 52% 82%,
  48% 91%, 44% 84%, 40% 92%, 36% 85%, 32% 93%, 28% 86%,
  24% 94%, 20% 87%, 16% 95%, 12% 87%, 8% 95%, 4% 88%,
  0% 94%
)`;

/** White ink shards exploding from the bottom of the blob — SVG component */
function InkBlast() {
  const shards = [
    // Long left-reaching shards
    { p: "540,0 554,16 95,530 72,520", o: 0.95 },
    { p: "538,0 551,17 225,515 202,507", o: 0.9 },
    { p: "541,0 553,13 358,468 338,461", o: 0.87 },
    { p: "540,0 550,10 460,348 447,342", o: 0.82 },
    { p: "542,0 550,8 318,262 307,257", o: 0.78 },
    // Long right-reaching shards
    { p: "540,0 526,16 985,530 1008,520", o: 0.95 },
    { p: "542,0 529,17 855,515 878,507", o: 0.9 },
    { p: "539,0 527,13 722,468 742,461", o: 0.87 },
    { p: "540,0 530,10 620,348 633,342", o: 0.82 },
    { p: "538,0 530,8 762,262 773,257", o: 0.78 },
    // Center-down shards
    { p: "532,0 548,0 550,535 530,535", o: 0.92 },
    { p: "534,0 546,0 548,450 532,455", o: 0.78 },
    { p: "536,0 544,0 545,360 535,363", o: 0.62 },
    // Medium intermediates — left
    { p: "540,0 549,11 478,198 469,193", o: 0.85 },
    { p: "540,0 549,9 393,175 384,171", o: 0.8 },
    { p: "540,0 549,7 284,198 275,193", o: 0.74 },
    // Medium intermediates — right
    { p: "540,0 531,11 602,198 611,193", o: 0.85 },
    { p: "540,0 531,9 687,175 696,171", o: 0.8 },
    { p: "540,0 531,7 796,198 805,193", o: 0.74 },
    // Very thin needle shards
    { p: "541,1 543,1 148,536 145,536", o: 0.58 },
    { p: "539,1 541,1 932,536 935,536", o: 0.58 },
    // Debris triangles — scattered
    { p: "468,58 488,49 501,71 478,78", o: 0.72 },
    { p: "592,58 612,49 625,71 602,78", o: 0.72 },
    { p: "376,148 402,137 414,161 387,170", o: 0.62 },
    { p: "666,148 692,137 704,161 677,170", o: 0.62 },
    { p: "265,238 294,226 307,252 277,262", o: 0.5 },
    { p: "775,238 804,226 817,252 787,262", o: 0.5 },
    { p: "152,338 184,325 198,354 164,365", o: 0.38 },
    { p: "888,338 920,325 934,354 900,365", o: 0.38 },
    { p: "58,428 96,413 111,445 71,458", o: 0.28 },
    { p: "982,428 1020,413 1035,445 995,458", o: 0.28 },
  ];

  const outlineShards = [
    { p: "540,0 551,19 192,448 179,441" },
    { p: "540,0 529,19 888,448 901,441" },
    { p: "540,0 549,14 328,322 317,317" },
    { p: "540,0 531,14 752,322 763,317" },
  ];

  return (
    <svg
      viewBox="0 0 1080 540"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin meet"
      style={{ display: "block", width: "1080px", height: "540px" }}
      aria-hidden="true"
    >
      {/* Central burst ellipse */}
      <ellipse cx="540" cy="14" rx="148" ry="44" fill="white" opacity="0.92" />

      {/* Filled shards */}
      {shards.map(({ p, o }, i) => (
        <polygon key={i} points={p} fill="white" opacity={o} />
      ))}

      {/* Outline-only shards for depth */}
      {outlineShards.map(({ p }, i) => (
        <polygon
          key={i}
          points={p}
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          opacity="0.38"
        />
      ))}
    </svg>
  );
}

export function Round4_TopBlob({
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
        background: "#000000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top bar: logo + handle ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "60px 80px 0",
          flexShrink: 0,
          zIndex: 3,
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
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.12em",
          }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* ── Photo blob zone ── */}
      <div
        style={{
          position: "relative",
          marginTop: "40px",
          width: "1080px",
          height: "580px",
          flexShrink: 0,
          clipPath: BLOB_CLIP,
          background: "#008755",
          zIndex: 2,
        }}
      >
        {/* KCVV pattern on blob bg */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/header-pattern.png)",
            backgroundSize: "480px auto",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            opacity: 0.18,
            pointerEvents: "none",
          }}
        />
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
              filter: "grayscale(15%) contrast(1.05)",
              mixBlendMode: "luminosity",
              opacity: 0.75,
            }}
          />
        ) : (
          /* No photo — show shirt number ghost in blob */
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: TITLE,
                fontWeight: 900,
                fontSize: "420px",
                color: "rgba(0,0,0,0.18)",
                letterSpacing: "-0.05em",
                lineHeight: 1,
              }}
            >
              {shirtNumber}
            </span>
          </div>
        )}
      </div>

      {/* ── Ink blast SVG — overlaps bottom of blob and extends down ── */}
      <div
        style={{
          position: "relative",
          marginTop: "-130px",
          flexShrink: 0,
          zIndex: 3,
        }}
      >
        <InkBlast />
      </div>

      {/* ── Headline: "GOAL" white + "!" dark green ── */}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          marginTop: "-260px",
          flexShrink: 0,
          zIndex: 4,
          lineHeight: 0.88,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "380px",
            color: "white",
            textShadow: "4px 6px 0px rgba(0,0,0,0.8)",
          }}
        >
          GOAL
        </span>
        <span
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "380px",
            color: "#008755",
            textShadow: "4px 6px 0px rgba(0,0,0,0.9)",
          }}
        >
          !
        </span>
      </div>

      {/* ── Three-column info grid ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "32px 80px",
          flexShrink: 0,
          zIndex: 4,
        }}
      >
        {/* Left: shirt number */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontFamily: BODY,
              fontWeight: 800,
              fontSize: "28px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Speler
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
          <span
            style={{
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: "38px",
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              lineHeight: 1.2,
              maxWidth: "280px",
            }}
          >
            {playerName}
          </span>
        </div>

        {/* Center: score on dark green pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#008755",
            borderRadius: "16px",
            padding: "20px 48px",
            gap: "16px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logos/kcvv-logo.png"
            alt="KCVV"
            style={{ width: "72px", height: "72px", objectFit: "contain" }}
          />
          <span
            style={{
              fontFamily: TITLE,
              fontWeight: 900,
              fontSize: "88px",
              color: "white",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {score}
          </span>
        </div>

        {/* Right: minute */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <span
            style={{
              fontFamily: BODY,
              fontWeight: 800,
              fontSize: "28px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Minuut
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
            {minute}
          </span>
          <span
            style={{
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: "38px",
              color: "#4acf52",
            }}
          >
            MINUTEN
          </span>
        </div>
      </div>

      {/* ── Bottom: match name + bright green chevron bar ── */}
      <div
        style={{
          position: "relative",
          marginTop: "auto",
          flexShrink: 0,
          zIndex: 4,
        }}
      >
        {/* Chevron decoration row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 80px 16px",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              style={{ width: "36px", height: "36px" }}
              aria-hidden="true"
            >
              <path
                d="M8 4 L16 12 L8 20"
                fill="none"
                stroke="#4acf52"
                strokeWidth="3"
                strokeLinecap="square"
              />
            </svg>
          ))}
        </div>
        {/* Match name bar */}
        <div
          style={{
            background: "#008755",
            padding: "36px 80px 52px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: TITLE,
              fontWeight: 900,
              fontSize: "58px",
              color: "white",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {matchName.split("—")[0]?.trim() ?? matchName}
          </span>
          <span
            style={{
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: "34px",
              color: "#4acf52",
              letterSpacing: "0.06em",
            }}
          >
            {matchName.split("—")[1]?.trim() ?? "KCVV Elewijt"}
          </span>
        </div>
      </div>
    </div>
  );
}
