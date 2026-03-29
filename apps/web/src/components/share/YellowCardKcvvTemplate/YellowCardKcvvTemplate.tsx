export interface YellowCardKcvvTemplateProps {
  playerName: string;
  shirtNumber: number;
  matchName: string;
  minute: string;
}

/**
 * Yellow card KCVV template — 1080x1920 Instagram Story image.
 * Dark background with yellow accent.
 */
export function YellowCardKcvvTemplate({
  playerName,
  shirtNumber,
  matchName,
  minute,
}: YellowCardKcvvTemplateProps) {
  return (
    <div
      style={{ width: "1080px", height: "1920px" }}
      className="relative overflow-hidden bg-kcvv-black flex flex-col items-center justify-between"
    >
      {/* Background pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundSize: "100% auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
        aria-hidden="true"
      />

      {/* Top: KCVV branding */}
      <div className="relative flex flex-col items-center pt-24 gap-4">
        <span className="font-stenciletta text-white text-[120px] leading-none tracking-widest drop-shadow-lg">
          KCVV
        </span>
        <span className="font-montserrat font-black text-white text-[48px] tracking-[0.3em] uppercase">
          Elewijt
        </span>
      </div>

      {/* Middle: card icon + label + player */}
      <div className="relative flex flex-col items-center gap-8 flex-1 justify-center">
        {/* Yellow card shape */}
        <div className="w-[200px] h-[280px] bg-yellow-400 rounded-[20px] shadow-2xl" />
        <span className="font-stenciletta text-yellow-400 text-[110px] leading-none drop-shadow-2xl">
          YELLOW CARD
        </span>
        <div className="flex flex-col items-center gap-2">
          <span className="font-montserrat font-black text-white text-[80px] leading-none drop-shadow-lg">
            {shirtNumber}
          </span>
          <span className="font-montserrat font-bold text-white text-[60px] leading-tight text-center drop-shadow-lg">
            {playerName}
          </span>
        </div>
      </div>

      {/* Bottom: match info */}
      <div className="relative flex flex-col items-center pb-24 gap-6">
        <span className="font-montserrat font-semibold text-white text-[36px] text-center opacity-70">
          {matchName}
        </span>
        <span className="font-montserrat text-white text-[30px] opacity-50">
          {minute}&apos;
        </span>
      </div>
    </div>
  );
}
