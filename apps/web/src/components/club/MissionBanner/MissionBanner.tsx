interface MissionBannerProps {
  quote?: string;
  attribution?: string;
}

const DEFAULT_QUOTE =
  "Wij zijn KCVV Elewijt. Een plek waar jong en oud samenkomen, waar passie voor voetbal het hele dorp verbindt.";
const DEFAULT_ATTRIBUTION = "— Sportpark Elewijt, sinds 1909";

export function MissionBanner({
  quote = DEFAULT_QUOTE,
  attribution = DEFAULT_ATTRIBUTION,
}: MissionBannerProps = {}) {
  return (
    <div className="max-w-inner mx-auto px-4 text-center md:px-10">
      <div
        className="font-title mb-6 text-5xl leading-none text-white/20"
        aria-hidden="true"
      >
        {"\u201C"}
      </div>
      <p className="font-title mb-6 text-xl leading-normal font-bold text-white md:text-4xl">
        {quote}
      </p>
      <p className="tracking-caps text-sm font-semibold text-white/50 uppercase">
        {attribution}
      </p>
    </div>
  );
}
