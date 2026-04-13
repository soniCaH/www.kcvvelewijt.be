import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface YouthSectionProps {
  className?: string;
}

export const YouthSection = ({ className }: YouthSectionProps) => {
  return (
    <section
      className={cn(
        "relative bg-kcvv-green-dark py-16 text-left md:py-24",
        className,
      )}
    >
      {/* Background image container — extends beyond section bounds so the
          photo visually spans into adjacent diagonal transition areas.
          overflow-hidden lives here (not on <section>) to clip blur edges
          while allowing the image to bleed vertically. */}
      <div
        className="absolute inset-x-0 overflow-hidden"
        style={{
          top: "calc(-1 * clamp(2rem, 6vw, 5rem))",
          bottom: "calc(-1 * clamp(2rem, 6vw, 5rem))",
        }}
        aria-hidden="true"
      >
        <div className="absolute -inset-4">
          <Image
            src="/images/youth-trainers.jpg"
            alt=""
            fill
            className="object-cover object-top blur-[2px]"
            sizes="100vw"
          />
        </div>
        {/* Directional gradient overlay — lets the photo breathe on the right (desktop)
            or bottom (mobile) while keeping text readable on the left/top. */}
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-b from-kcvv-green-dark/80 via-kcvv-green-dark/60 to-kcvv-green-dark/30",
            "md:bg-gradient-to-r md:from-kcvv-green-dark/80 md:via-kcvv-green-dark/60 md:to-kcvv-green-dark/30",
          )}
        />
      </div>

      {/* Content — left-aligned editorial block */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        {/* Section label */}
        <p className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-label text-white/50">
          <span aria-hidden="true" className="block h-0.5 w-5 bg-white/30" />
          Jeugdwerking
        </p>

        {/* Editorial title */}
        <h2
          className="mb-6 font-title font-black uppercase leading-[0.95] text-white"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          De toekomst
          <br />
          van Elewijt
        </h2>

        {/* Body text */}
        <p className="mb-6 max-w-lg text-base leading-relaxed text-white/80">
          Meer dan 220 jonge spelers en 16 ploegen trainen elke week op
          Sportpark Elewijt. Van de allerkleinsten tot de U21.
        </p>

        {/* Stats line */}
        <p className="mb-8 text-sm font-bold uppercase tracking-wider text-kcvv-green">
          220+ spelers · 16 ploegen
        </p>

        {/* CTA */}
        <Link
          href="/jeugd"
          className="group inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-kcvv-black transition-colors hover:bg-kcvv-green"
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
};
