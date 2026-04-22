import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  DIAGONAL_HEIGHT,
  BG_COLOR,
  type SectionBg,
} from "@/components/design-system/SectionTransition";

export interface YouthSectionProps {
  className?: string;
  /** Background key for the section above (top diagonal). */
  prevBg?: SectionBg;
  /** Background key for the section below (bottom diagonal). */
  nextBg?: SectionBg;
}

export const YouthSection = ({
  className,
  prevBg = "kcvv-black",
  nextBg = "gray-100",
}: YouthSectionProps) => {
  const prevBgColor = BG_COLOR[prevBg];
  const nextBgColor = BG_COLOR[nextBg];

  return (
    <section
      className={cn("bg-kcvv-green-dark relative text-left", className)}
      style={{
        marginTop: `calc(-1 * ${DIAGONAL_HEIGHT})`,
        paddingBottom: DIAGONAL_HEIGHT,
      }}
    >
      {/* Background image — covers the full section including both diagonal
          areas. The diagonals' transparent triangles let the image show. */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -inset-4">
          <Image
            src="/images/youth-trainers.jpg"
            alt=""
            fill
            className="object-cover object-top blur-[2px]"
            sizes="100vw"
          />
        </div>
        {/* Directional gradient overlay — lets the photo breathe on the right
            (desktop) or bottom (mobile) while keeping text readable. */}
        <div
          className={cn(
            "absolute inset-0",
            "from-kcvv-green-dark/90 via-kcvv-green-dark/75 to-kcvv-green-dark/50 bg-gradient-to-b",
            "md:from-kcvv-green-dark/90 md:via-kcvv-green-dark/75 md:to-kcvv-green-dark/50 md:bg-gradient-to-r",
          )}
        />
      </div>

      {/* Top diagonal — previous section color in the upper-right triangle,
          transparent lower-left so the image shows through (direction "right"). */}
      <div
        className="relative z-20"
        style={{ height: DIAGONAL_HEIGHT }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <polygon
            points="0,0 100,0 100,100"
            fill={prevBgColor}
            shapeRendering="crispEdges"
          />
          <polygon
            points="0,0 0,100 100,100"
            fill="transparent"
            shapeRendering="crispEdges"
          />
        </svg>
      </div>

      {/* Content — left-aligned editorial block */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        {/* Section label */}
        <p className="tracking-label mb-6 flex items-center gap-2 text-[11px] font-bold text-white/70 uppercase">
          <span aria-hidden="true" className="block h-0.5 w-5 bg-white/50" />
          Jeugdwerking
        </p>

        {/* Editorial title */}
        <h2
          className="font-title mb-6 leading-[0.95] font-black text-white uppercase"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          De toekomst
          <br />
          van Elewijt
        </h2>

        {/* Body text */}
        <p className="mb-6 max-w-lg text-base leading-relaxed text-white/90">
          Meer dan 220 jonge spelers en 16 ploegen trainen elke week op
          Sportpark Elewijt. Van de allerkleinsten tot de U21.
        </p>

        {/* Stats line */}
        <p className="mb-8 text-sm font-bold tracking-wider text-white uppercase">
          220+ spelers · 16 ploegen
        </p>

        {/* CTA */}
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

      {/* Bottom diagonal — absolutely positioned in the padding area so it
          does not push the next section down with a negative margin. */}
      <div
        className="absolute inset-x-0 bottom-0 z-20"
        style={{ height: DIAGONAL_HEIGHT }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <polygon
            points="0,0 100,0 0,100"
            fill="transparent"
            shapeRendering="crispEdges"
          />
          <polygon
            points="100,0 100,100 0,100"
            fill={nextBgColor}
            shapeRendering="crispEdges"
          />
        </svg>
      </div>
    </section>
  );
};
