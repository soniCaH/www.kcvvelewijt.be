import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface YouthSectionProps {
  className?: string;
}

export const YouthSection = ({ className }: YouthSectionProps) => (
  <section className={cn("text-left", className)}>
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <p className="tracking-label mb-6 flex items-center gap-2 text-[11px] font-bold text-white/70 uppercase">
        <span aria-hidden="true" className="block h-0.5 w-5 bg-white/50" />
        Jeugdwerking
      </p>

      <h2
        className="font-title mb-6 leading-[0.95] font-black text-white uppercase"
        style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
      >
        De toekomst
        <br />
        van Elewijt
      </h2>

      <p className="mb-6 max-w-lg text-base leading-relaxed text-white/90">
        Meer dan 220 jonge spelers en 16 ploegen trainen elke week op Sportpark
        Elewijt. Van de allerkleinsten tot de U21.
      </p>

      <p className="mb-8 text-sm font-bold tracking-wider text-white uppercase">
        220+ spelers · 16 ploegen
      </p>

      <Link
        href="/jeugd"
        className="group text-kcvv-black hover:bg-kcvv-green inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors"
      >
        Ontdek onze jeugd
        <span
          className="inline-block transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </Link>
    </div>
  </section>
);
