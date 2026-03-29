export interface HalftimeTemplateProps {
  matchName: string;
  score: string;
}

/**
 * Halftime template — 1080x1920 Instagram Story image.
 * Green background, shows score at the break.
 */
export function HalftimeTemplate({ matchName, score }: HalftimeTemplateProps) {
  return (
    <div
      style={{ width: "1080px", height: "1920px" }}
      className="relative overflow-hidden bg-kcvv-green-dark flex flex-col items-center justify-between"
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

      {/* Middle: HALF-TIME label + score */}
      <div className="relative flex flex-col items-center gap-8 flex-1 justify-center">
        <span className="font-stenciletta text-white text-[140px] leading-none drop-shadow-2xl">
          HALF-TIME
        </span>
        <div className="w-[600px] h-2 bg-white/40 rounded-full" />
        <span className="font-montserrat font-black text-white text-[180px] leading-none drop-shadow-lg">
          {score}
        </span>
      </div>

      {/* Bottom: match info */}
      <div className="relative flex flex-col items-center pb-24 gap-6">
        <span className="font-montserrat font-semibold text-white text-[42px] text-center opacity-90">
          {matchName}
        </span>
      </div>
    </div>
  );
}
