export interface YellowCardOpponentTemplateProps {
  matchName: string;
  minute: string;
}

/**
 * Yellow card opponent template — 1080x1920 Instagram Story image.
 * Green background with yellow accent.
 */
export function YellowCardOpponentTemplate({
  matchName,
  minute,
}: YellowCardOpponentTemplateProps) {
  return (
    <div
      style={{ width: "1080px", height: "1920px" }}
      className="relative overflow-hidden bg-kcvv-green-bright flex flex-col items-center justify-between"
    >
      {/* Background pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
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

      {/* Middle: card icon + label */}
      <div className="relative flex flex-col items-center gap-8 flex-1 justify-center">
        {/* Yellow card shape */}
        <div className="w-[200px] h-[280px] bg-yellow-400 rounded-[20px] shadow-2xl" />
        <span className="font-stenciletta text-white text-[110px] leading-none drop-shadow-2xl">
          YELLOW CARD
        </span>
        <span className="font-montserrat font-semibold text-white text-[48px] opacity-80">
          Tegenstander
        </span>
      </div>

      {/* Bottom: match info */}
      <div className="relative flex flex-col items-center pb-24 gap-6">
        <span className="font-montserrat font-semibold text-white text-[36px] text-center opacity-90">
          {matchName}
        </span>
        <span className="font-montserrat text-white text-[30px] opacity-75">
          {minute}&apos;
        </span>
      </div>
    </div>
  );
}
