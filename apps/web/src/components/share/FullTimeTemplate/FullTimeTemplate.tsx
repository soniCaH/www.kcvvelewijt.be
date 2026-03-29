export type FullTimeMood = "win" | "draw" | "loss";

export interface FullTimeTemplateProps {
  matchName: string;
  score: string;
  mood: FullTimeMood;
}

const moodBackground: Record<FullTimeMood, string> = {
  win: "bg-kcvv-green-bright",
  draw: "bg-[#555555]",
  loss: "bg-[#c0392b]",
};

/**
 * Full-time template — 1080x1920 Instagram Story image.
 * Background color changes by mood: green (win), grey (draw), red (loss).
 */
export function FullTimeTemplate({
  matchName,
  score,
  mood,
}: FullTimeTemplateProps) {
  return (
    <div
      style={{ width: "1080px", height: "1920px" }}
      className={`relative overflow-hidden ${moodBackground[mood]} flex flex-col items-center justify-between`}
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

      {/* Middle: FULL-TIME label + score */}
      <div className="relative flex flex-col items-center gap-8 flex-1 justify-center">
        <span className="font-stenciletta text-white text-[130px] leading-none drop-shadow-2xl">
          FULL-TIME
        </span>
        <div className="w-[600px] h-2 bg-white/40 rounded-full" />
        <span className="font-montserrat font-black text-white text-[200px] leading-none drop-shadow-lg">
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
