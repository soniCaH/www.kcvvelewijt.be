export function MissionBanner() {
  return (
    <div className="max-w-[50rem] mx-auto px-4 md:px-10 text-center">
      <div
        className="text-5xl text-white/20 mb-6 leading-none"
        style={{ fontFamily: "Georgia, serif" }}
        aria-hidden="true"
      >
        {"\u201C"}
      </div>
      <p
        className="font-title font-bold text-white leading-normal mb-6"
        style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}
      >
        Wij zijn KCVV Elewijt. Een plek waar jong en oud samenkomen, waar passie
        voor voetbal het hele dorp verbindt.
      </p>
      <p className="text-[0.8125rem] font-semibold text-white/50 uppercase tracking-[0.08em]">
        — Sportpark Elewijt, sinds 1948
      </p>
    </div>
  );
}
