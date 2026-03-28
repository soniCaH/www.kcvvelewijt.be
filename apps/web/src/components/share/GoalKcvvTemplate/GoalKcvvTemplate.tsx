export interface GoalKcvvTemplateProps {
  playerName: string;
  shirtNumber: number;
  score: string;
  matchName: string;
  minute: string;
  celebrationImageUrl?: string;
}

/**
 * Goal KCVV template — 1080x1920 Instagram Story image.
 * Rendered at exact pixel dimensions so html-to-image captures at that resolution.
 */
export function GoalKcvvTemplate({
  playerName,
  shirtNumber,
  score,
  matchName,
  minute,
  celebrationImageUrl,
}: GoalKcvvTemplateProps) {
  return (
    <div
      style={{ width: "1080px", height: "1920px" }}
      className="relative overflow-hidden bg-kcvv-green-bright flex flex-col items-center justify-between"
    >
      {/* Top: KCVV branding */}
      <div className="flex flex-col items-center pt-24 gap-4">
        <span className="font-stenciletta text-white text-[120px] leading-none tracking-widest drop-shadow-lg">
          KCVV
        </span>
        <span className="font-montserrat font-black text-white text-[48px] tracking-[0.3em] uppercase">
          Elewijt
        </span>
      </div>

      {/* Middle: GOAL! + celebration image area */}
      <div className="flex flex-col items-center gap-8 flex-1 justify-center">
        {celebrationImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={celebrationImageUrl}
            alt={`${playerName} celebration`}
            crossOrigin="anonymous"
            className="w-[700px] h-[700px] object-cover rounded-full border-8 border-white shadow-2xl"
          />
        )}

        <div className="flex flex-col items-center gap-2">
          <span className="font-stenciletta text-white text-[240px] leading-none drop-shadow-2xl">
            GOAL!
          </span>
          <span className="font-montserrat font-black text-white text-[80px] leading-none drop-shadow-lg">
            {shirtNumber}
          </span>
          <span className="font-montserrat font-bold text-white text-[60px] leading-tight text-center drop-shadow-lg">
            {playerName}
          </span>
        </div>
      </div>

      {/* Bottom: match info */}
      <div className="flex flex-col items-center pb-24 gap-6">
        <span className="font-montserrat font-black text-white text-[140px] leading-none drop-shadow-lg">
          {score}
        </span>
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
