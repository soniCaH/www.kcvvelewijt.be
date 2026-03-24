import Link from "next/link";

export function TeamsCta() {
  return (
    <div className="max-w-[40rem] mx-auto px-4 md:px-10 text-center">
      <h2
        className="font-title font-extrabold text-white mb-3"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
      >
        Aansluiten bij KCVV Elewijt?
      </h2>

      <p className="text-sm text-white/60 mb-8 leading-relaxed">
        Vanaf de allerkleinsten tot de eerste ploeg — iedereen is welkom op
        Sportpark Elewijt.
      </p>

      <Link
        href="/club/aansluiten"
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-kcvv-black font-bold text-sm uppercase tracking-wider rounded-sm transition-colors hover:bg-kcvv-green"
      >
        Meer info →
      </Link>
    </div>
  );
}
