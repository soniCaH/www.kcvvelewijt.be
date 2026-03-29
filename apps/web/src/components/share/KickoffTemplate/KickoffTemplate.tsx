export interface KickoffTemplateProps {
  matchName: string;
}

/**
 * Kick-off template — 1080x1920 Instagram Story image.
 * Green background, signals start of match.
 */
export function KickoffTemplate({ matchName }: KickoffTemplateProps) {
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

      {/* Middle: KICK-OFF label */}
      <div className="relative flex flex-col items-center gap-8 flex-1 justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          className="w-64 h-64 object-contain drop-shadow-2xl"
        />
        <span className="font-stenciletta text-white text-[160px] leading-none drop-shadow-2xl">
          KICK-OFF
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
