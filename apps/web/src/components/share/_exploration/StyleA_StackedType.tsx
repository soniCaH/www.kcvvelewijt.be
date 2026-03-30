/**
 * Style A: "Stacked Type"
 * Inspired by the GOAL×3 stacked text designs.
 * Dark bg, oversized event keyword fills the frame, photo layered on top,
 * player name rotated on edges, diagonal slash accents.
 */
export interface ExplorationProps {
  playerName: string;
  shirtNumber: number;
  score: string;
  matchName: string;
  minute: string;
  celebrationImageUrl?: string;
}

export function StyleA_StackedType({
  playerName,
  shirtNumber,
  score,
  matchName,
  minute,
  celebrationImageUrl,
}: ExplorationProps) {
  return (
    <div
      style={{ width: "1080px", height: "1920px" }}
      className="relative overflow-hidden bg-kcvv-black"
    >
      {/* Paint-splatter green glow overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 55% at 25% 38%, rgba(74,207,82,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 35% at 75% 65%, rgba(74,207,82,0.10) 0%, transparent 65%)",
        }}
      />

      {/* Diagonal slash accents */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "360px",
          left: "-120px",
          width: "520px",
          height: "7px",
          background: "rgba(255,255,255,0.12)",
          transform: "rotate(-28deg)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "520px",
          right: "-80px",
          width: "380px",
          height: "5px",
          background: "rgba(255,255,255,0.08)",
          transform: "rotate(-28deg)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "480px",
          left: "-60px",
          width: "600px",
          height: "7px",
          background: "rgba(255,255,255,0.10)",
          transform: "rotate(-28deg)",
        }}
      />

      {/* Top bar: KCVV logo + handle */}
      <div className="relative flex items-center justify-between px-[80px] pt-[64px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          style={{ width: "96px", height: "96px", objectFit: "contain" }}
        />
        <span
          className="font-montserrat font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.55)", fontSize: "30px" }}
        >
          @kcvvelewijt
        </span>
      </div>

      {/* Player name rotated — left edge */}
      <div
        className="absolute font-montserrat font-black uppercase whitespace-nowrap"
        style={{
          left: "-210px",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          color: "rgba(255,255,255,0.85)",
          fontSize: "48px",
          letterSpacing: "0.18em",
        }}
      >
        {playerName} &mdash; {minute}&apos;
      </div>

      {/* Player name rotated — right edge */}
      <div
        className="absolute font-montserrat font-black uppercase whitespace-nowrap"
        style={{
          right: "-210px",
          top: "50%",
          transform: "translateY(-50%) rotate(90deg)",
          color: "rgba(255,255,255,0.85)",
          fontSize: "48px",
          letterSpacing: "0.18em",
        }}
      >
        {playerName} &mdash; {minute}&apos;
      </div>

      {/* Stacked GOAL! text — fills frame */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ top: "160px", lineHeight: 0.82 }}
      >
        {(["GOAL!", "GOAL!", "GOAL!"] as const).map((word, i) => (
          <span
            key={i}
            className="font-stenciletta block text-center"
            style={{
              fontSize: "290px",
              color:
                i === 1
                  ? "#4acf52"
                  : i === 0
                    ? "rgba(74,207,82,0.55)"
                    : "rgba(74,207,82,0.28)",
              lineHeight: 0.82,
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* Celebration photo — layered over text */}
      {celebrationImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={celebrationImageUrl}
          alt={playerName}
          crossOrigin="anonymous"
          className="absolute"
          style={{
            top: "280px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "860px",
            height: "1100px",
            objectFit: "cover",
            objectPosition: "top center",
            mixBlendMode: "luminosity",
            opacity: 0.65,
          }}
        />
      ) : (
        /* No photo: big shirt number instead */
        <div
          className="absolute font-stenciletta text-center"
          style={{
            top: "680px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "320px",
            color: "rgba(255,255,255,0.18)",
            lineHeight: 1,
          }}
        >
          {shirtNumber}
        </div>
      )}

      {/* Bottom panel: score + match name */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
        style={{
          background: "rgba(10,12,14,0.90)",
          borderTop: "5px solid #4acf52",
          padding: "52px 80px 72px",
          gap: "16px",
        }}
      >
        <span
          className="font-montserrat font-black text-white"
          style={{ fontSize: "130px", lineHeight: 1 }}
        >
          {score}
        </span>
        <span
          className="font-montserrat font-semibold text-center"
          style={{ fontSize: "38px", color: "rgba(255,255,255,0.65)" }}
        >
          {matchName}
        </span>
      </div>
    </div>
  );
}
