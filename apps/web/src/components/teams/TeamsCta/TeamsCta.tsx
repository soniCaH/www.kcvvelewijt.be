import Link from "next/link";
import { ArrowRight } from "@/lib/icons";

export function TeamsCta() {
  return (
    <div className="max-w-[40rem] mx-auto px-4 md:px-10 text-center">
      <h2
        className="font-title font-extrabold text-kcvv-black mb-3"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
      >
        Aansluiten bij KCVV Elewijt?
      </h2>

      <p className="text-sm text-kcvv-gray mb-8 leading-relaxed">
        Vanaf de allerkleinsten tot de eerste ploeg — iedereen is welkom op
        Sportpark Elewijt.
      </p>

      <Link
        href="/club/aansluiten"
        className="group inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 bg-kcvv-green-bright text-white hover:bg-kcvv-green-bright/50 text-base px-8 py-3 rounded-[0.25em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green focus-visible:ring-offset-2"
      >
        Meer info
        <ArrowRight
          size={16}
          className="transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
