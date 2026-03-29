export interface GoalOpponentTemplateProps {
  score: string;
  matchName: string;
  minute: string;
}

/**
 * Goal opponent template — 1080x1920 Instagram Story image.
 * Dark background to differentiate from KCVV goal.
 */
export function GoalOpponentTemplate({
  score,
  matchName,
  minute,
}: GoalOpponentTemplateProps) {
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/kcvv-logo.png"
          alt="KCVV Elewijt"
          className="w-48 h-48 object-contain opacity-80"
        />
      </div>

      {/* Middle: GOAL label */}
      <div className="relative flex flex-col items-center gap-4 flex-1 justify-center">
        <span className="font-stenciletta text-white/40 text-[200px] leading-none">
          GOAL
        </span>
        <div className="w-[600px] h-1 bg-white/20" />
        <span className="font-montserrat font-black text-white text-[140px] leading-none">
          {score}
        </span>
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
