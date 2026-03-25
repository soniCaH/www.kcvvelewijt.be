interface MissionBannerProps {
  quote?: string;
  attribution?: string;
}

const DEFAULT_QUOTE =
  "Wij zijn KCVV Elewijt. Een plek waar jong en oud samenkomen, waar passie voor voetbal het hele dorp verbindt.";
const DEFAULT_ATTRIBUTION = "— Sportpark Elewijt, sinds 1948";

export function MissionBanner({
  quote = DEFAULT_QUOTE,
  attribution = DEFAULT_ATTRIBUTION,
}: MissionBannerProps = {}) {
  return (
    <div className="max-w-inner mx-auto px-4 md:px-10 text-center">
      <div
        className="text-5xl text-white/20 mb-6 leading-none font-title"
        aria-hidden="true"
      >
        {"\u201C"}
      </div>
      <p className="font-title font-bold text-white leading-normal text-xl md:text-4xl mb-6">
        {quote}
      </p>
      <p className="text-sm font-semibold text-white/50 uppercase tracking-caps">
        {attribution}
      </p>
    </div>
  );
}
