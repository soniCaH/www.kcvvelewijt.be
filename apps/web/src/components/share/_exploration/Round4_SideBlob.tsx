/**
 * Round 4 — Design 2: "SIDE BLOB"
 *
 * Inspired by style2.jpg:
 * - Near-black (#1E2024) background
 * - Player photo lives in an organic dark-green blob on the right side
 * - "GOAL" in massive white Quasimoda punches left→right, bleeding into the blob
 * - "!" in bright green below, anchoring the left column
 * - Ink-splatter accents mark the organic blob boundary
 * - Shirt number + score grid below the headline
 * - Player name + minute in the dark zone beneath the blob
 * - Dark green footer with match context
 */
import type { ExplorationProps } from "./StyleA_StackedType";

const TITLE: React.CSSProperties["fontFamily"] =
  "quasimoda, acumin-pro, Montserrat, Verdana, sans-serif";
const BODY: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

/** Organic blob clip-path for right photo zone — wavy left edge, top to ~54% height */
const SIDE_BLOB_CLIP = `polygon(
  40% 0%,
  45% 4%, 42% 9%, 47% 14%, 43% 19%, 48% 24%,
  44% 29%, 49% 34%, 45% 39%, 50% 44%, 46% 49%,
  51% 54%,
  57% 52%, 63% 55%, 70% 52%, 77% 55%, 84% 52%,
  91% 55%, 97% 52%, 100% 54%,
  100% 0%
)`;

export function Round4_SideBlob({
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
        background: "#1E2024",
      }}
    >
      {/* ── Subtle full-background pattern ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "580px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "20% 42%",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      />

      {/* ── Right blob: dark green zone ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#008755",
          clipPath: SIDE_BLOB_CLIP,
          zIndex: 1,
        }}
      />

      {/* ── KCVV pattern on the green blob ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "400px auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "78% 22%",
          opacity: 0.13,
          clipPath: SIDE_BLOB_CLIP,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* ── Player photo clipped to the blob zone ── */}
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
            objectPosition: "right top",
            filter: "grayscale(20%) contrast(1.1) brightness(0.85)",
            mixBlendMode: "luminosity",
            opacity: 0.68,
            clipPath: SIDE_BLOB_CLIP,
            zIndex: 3,
          }}
        />
      ) : (
        /* No photo — ghost shirt number on right */
        <div
          style={{
            position: "absolute",
            top: "80px",
            right: "40px",
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "560px",
            lineHeight: 1,
            color: "rgba(0,0,0,0.2)",
            letterSpacing: "-0.05em",
            zIndex: 3,
          }}
        >
          {shirtNumber}
        </div>
      )}

      {/* ── Ink-splatter accents at the blob's organic left edge ── */}
      <svg
        viewBox="0 0 1080 1920"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          inset: 0,
          width: "1080px",
          height: "1920px",
          zIndex: 4,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <polygon
          points="432,340 450,330 443,378 425,388"
          fill="#4acf52"
          opacity="0.82"
        />
        <polygon
          points="428,435 448,423 441,475 421,487"
          fill="#4acf52"
          opacity="0.64"
        />
        <polygon
          points="435,522 453,509 446,562 428,575"
          fill="#4acf52"
          opacity="0.46"
        />
        <polygon
          points="440,268 457,258 451,302 434,312"
          fill="white"
          opacity="0.36"
        />
        <polygon
          points="423,622 442,608 436,660 417,674"
          fill="white"
          opacity="0.26"
        />
        <line
          x1="440"
          y1="320"
          x2="418"
          y2="278"
          stroke="#4acf52"
          strokeWidth="3.5"
          opacity="0.52"
        />
        <line
          x1="427"
          y1="492"
          x2="405"
          y2="444"
          stroke="white"
          strokeWidth="2.5"
          opacity="0.28"
        />
        <circle cx="416" cy="302" r="8" fill="#4acf52" opacity="0.55" />
        <circle cx="408" cy="458" r="5" fill="white" opacity="0.35" />
      </svg>

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
          zIndex: 8,
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

      {/* ── Left column: GOAL! headline — punches across the blob boundary ── */}
      <div
        style={{
          position: "absolute",
          top: "200px",
          left: "80px",
          zIndex: 8,
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: "26px",
            color: "#4acf52",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Doelpunt
        </div>

        {/* GOAL in white — extends beyond blob boundary */}
        <div
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "300px",
            lineHeight: 0.84,
            color: "white",
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            textShadow: "6px 8px 0px rgba(0,0,0,0.72)",
            whiteSpace: "nowrap",
          }}
        >
          GOAL
        </div>

        {/* ! in bright green — anchors in the black zone */}
        <div
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "230px",
            lineHeight: 0.84,
            color: "#4acf52",
            letterSpacing: "-0.04em",
            textShadow: "6px 8px 0px rgba(0,0,0,0.72)",
            marginTop: "10px",
          }}
        >
          !
        </div>
      </div>

      {/* ── Shirt number + score grid — below headline, above blob bottom ── */}
      <div
        style={{
          position: "absolute",
          top: "780px",
          left: "80px",
          display: "flex",
          alignItems: "flex-end",
          gap: "44px",
          zIndex: 8,
        }}
      >
        {/* Shirt number */}
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
              fontSize: "24px",
              color: "rgba(255,255,255,0.42)",
              letterSpacing: "0.2em",
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
            height: "140px",
            background: "rgba(255,255,255,0.18)",
            marginBottom: "8px",
          }}
        />

        {/* Score */}
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
              fontSize: "24px",
              color: "rgba(255,255,255,0.42)",
              letterSpacing: "0.2em",
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

      {/* ── Ghost shirt number — decorative fill in lower zone ── */}
      <div
        style={{
          position: "absolute",
          top: "1120px",
          left: "40px",
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: "420px",
          lineHeight: 1,
          color: "rgba(255,255,255,0.035)",
          letterSpacing: "-0.04em",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        {shirtNumber}
      </div>

      {/* ── Player name + minute ── */}
      <div
        style={{
          position: "absolute",
          top: "1065px",
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
            fontSize: "25px",
            color: "rgba(255,255,255,0.42)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Speler
        </span>
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: "66px",
            lineHeight: 1.05,
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
            fontSize: "36px",
            color: "#4acf52",
            letterSpacing: "0.06em",
            marginTop: "4px",
          }}
        >
          {minute}&apos; Minuten
        </span>
      </div>

      {/* ── Match reference line ── */}
      <div
        style={{
          position: "absolute",
          top: "1310px",
          left: "80px",
          right: "80px",
          zIndex: 8,
        }}
      >
        <span
          style={{
            fontFamily: BODY,
            fontWeight: 500,
            fontSize: "30px",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.04em",
          }}
        >
          {matchName}
        </span>
      </div>

      {/* ── Bright green chevron row ── */}
      <div
        style={{
          position: "absolute",
          bottom: "246px",
          left: "80px",
          display: "flex",
          gap: "10px",
          zIndex: 8,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            style={{ width: "30px", height: "30px" }}
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

      {/* ── Bottom bar: match name ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#008755",
          padding: "36px 80px 56px",
          zIndex: 8,
        }}
      >
        <div
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: "52px",
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          {matchName.split("—")[0]?.trim() ?? matchName}
        </div>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: "32px",
            color: "#4acf52",
            letterSpacing: "0.06em",
            marginTop: "8px",
          }}
        >
          {matchName.split("—")[1]?.trim() ?? "KCVV Elewijt"}
        </div>
      </div>
    </div>
  );
}
