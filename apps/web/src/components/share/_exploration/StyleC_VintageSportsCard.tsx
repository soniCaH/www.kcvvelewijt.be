/**
 * Style C: "Vintage Sports Card"
 * Inspired by the numbered 1–8 series — cream base, bold color bands,
 * player silhouette on a cutout zone, shirt number in a corner block.
 * Mixes Stenciletta display text with Montserrat small-caps.
 */
import type { ExplorationProps } from "./StyleA_StackedType";

export function StyleC_VintageSportsCard({
  playerName,
  shirtNumber,
  score,
  matchName,
  minute,
  celebrationImageUrl,
}: ExplorationProps) {
  return (
    <div
      style={{ width: "1080px", height: "1920px", background: "#F2EDE3" }}
      className="relative overflow-hidden flex flex-col"
    >
      {/* Grain overlay — simulated with CSS noise */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
          opacity: 0.055,
          mixBlendMode: "multiply",
        }}
      />

      {/* ── Top band: KCVV green ── */}
      <div
        className="relative shrink-0 bg-kcvv-green-bright flex items-center justify-between"
        style={{ height: "160px", padding: "0 72px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          style={{ width: "112px", height: "112px", objectFit: "contain" }}
        />
        <span
          className="font-stenciletta text-kcvv-black"
          style={{ fontSize: "88px" }}
        >
          55
        </span>
        <span
          className="font-montserrat font-black text-kcvv-black uppercase tracking-widest"
          style={{ fontSize: "32px" }}
        >
          Elewijt
        </span>
      </div>

      {/* ── Shirt number corner badge ── */}
      <div
        className="absolute font-stenciletta text-kcvv-black"
        style={{
          top: "132px",
          left: "72px",
          fontSize: "220px",
          lineHeight: 1,
          opacity: 0.12,
        }}
      >
        {shirtNumber}
      </div>

      {/* ── GOAL label — diagonal ── */}
      <div
        className="absolute font-stenciletta"
        style={{
          top: "200px",
          left: "-40px",
          fontSize: "320px",
          lineHeight: 0.85,
          color: "#1E2024",
          opacity: 0.08,
          transform: "rotate(-8deg)",
          transformOrigin: "top left",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        GOAL!
      </div>

      {/* ── Color band section ── */}
      <div className="relative flex shrink-0" style={{ height: "80px" }}>
        <div className="bg-kcvv-black" style={{ width: "54%" }} />
        <div className="bg-kcvv-green-bright" style={{ flex: 1 }} />
      </div>

      {/* ── Player photo zone ── */}
      <div
        className="relative flex-1 min-h-0"
        style={{ background: "#1E2024" }}
      >
        {celebrationImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={celebrationImageUrl}
            alt={playerName}
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: "top center",
              opacity: 0.8,
            }}
          />
        ) : (
          /* Placeholder zone */
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Silhouette placeholder */}
            <svg
              viewBox="0 0 200 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "380px", height: "760px", opacity: 0.12 }}
            >
              <ellipse cx="100" cy="48" rx="44" ry="44" fill="white" />
              <path
                d="M40 140 Q60 100 100 96 Q140 100 160 140 L175 260 L130 260 L120 400 L80 400 L70 260 L25 260 Z"
                fill="white"
              />
            </svg>
          </div>
        )}

        {/* GOAL! stamp — bottom right of photo zone */}
        <div
          className="absolute font-stenciletta text-kcvv-green-bright"
          style={{
            bottom: "40px",
            right: "56px",
            fontSize: "130px",
            lineHeight: 1,
            filter: "drop-shadow(0 4px 24px rgba(74,207,82,0.4))",
          }}
        >
          GOAL!
        </div>

        {/* Shirt number — bottom left of photo zone */}
        <div
          className="absolute font-stenciletta text-white"
          style={{
            bottom: "40px",
            left: "56px",
            fontSize: "130px",
            lineHeight: 1,
            opacity: 0.85,
          }}
        >
          {shirtNumber}
        </div>
      </div>

      {/* ── Second color band ── */}
      <div className="relative flex shrink-0" style={{ height: "80px" }}>
        <div className="bg-kcvv-green-bright" style={{ width: "46%" }} />
        <div className="bg-kcvv-black" style={{ flex: 1 }} />
      </div>

      {/* ── Player name section ── */}
      <div
        className="relative shrink-0 flex flex-col"
        style={{
          background: "#F2EDE3",
          padding: "56px 72px",
          gap: "20px",
        }}
      >
        <span
          className="font-montserrat font-black text-kcvv-black uppercase"
          style={{ fontSize: "78px", lineHeight: 1, letterSpacing: "0.04em" }}
        >
          {playerName}
        </span>

        <div className="flex items-center gap-[48px]">
          <span
            className="font-montserrat font-black text-kcvv-black"
            style={{ fontSize: "52px" }}
          >
            {score}
          </span>
          <div
            className="bg-kcvv-black"
            style={{ width: "3px", height: "48px", opacity: 0.3 }}
          />
          <span
            className="font-montserrat font-semibold text-kcvv-black"
            style={{ fontSize: "44px", opacity: 0.55 }}
          >
            {minute}&apos;
          </span>
          <div
            className="bg-kcvv-black"
            style={{ width: "3px", height: "48px", opacity: 0.3 }}
          />
          <span
            className="font-montserrat font-medium text-kcvv-black"
            style={{ fontSize: "32px", opacity: 0.45 }}
          >
            {matchName}
          </span>
        </div>
      </div>

      {/* ── Bottom KCVV black bar ── */}
      <div
        className="shrink-0 bg-kcvv-black flex items-center justify-center"
        style={{ height: "96px" }}
      >
        <span
          className="font-montserrat font-bold text-kcvv-green-bright uppercase tracking-widest"
          style={{ fontSize: "30px" }}
        >
          @kcvvelewijt
        </span>
      </div>
    </div>
  );
}
