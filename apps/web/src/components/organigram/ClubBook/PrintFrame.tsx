import Image from "next/image";
import { PrintDate } from "@/components/scheurkalender/PrintDate";
import { deriveSeason } from "@/lib/utils/season";

/**
 * The clubboek PDF's house style (KCVV huisstijl, translated to the site's
 * print CSS): a diagonal green/white band top and bottom, the crest top right,
 * "Organigram" in display roman over an italic green subtitle on a black bar,
 * a green mono chip, and a footer with the address and the print date. All of
 * it is `hidden` on screen and only exists on paper.
 *
 * Measures are the house ones in millimetres: band 11 mm high, stripes 4.4 mm
 * on an 8.8 mm period, the top edge 0.47 x the height further right than the
 * bottom edge. The band is drawn as explicit polygons, never as a CSS or SVG
 * gradient or `<pattern>`: Chromium exports those as PDF tiling patterns, which
 * macOS Preview renders pink (`<StripedSeam>` is a `<pattern>`, so it cannot be
 * reused here).
 */

const BAND_HEIGHT = 11;
const STRIPE = 4.4;
const PERIOD = 8.8;
const SKEW = BAND_HEIGHT * 0.47;
// Wider than any column the band sits in; the root `<svg>` clips the rest.
const BAND_WIDTH = 260;

const stripes = Array.from(
  { length: Math.ceil((BAND_WIDTH + SKEW) / PERIOD) + 1 },
  (_, i) => {
    const x = i * PERIOD - SKEW;
    return `${x + SKEW},0 ${x + SKEW + STRIPE},0 ${x + STRIPE},${BAND_HEIGHT} ${x},${BAND_HEIGHT}`;
  },
);

export function PrintBand() {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${BAND_WIDTH} ${BAND_HEIGHT}`}
      preserveAspectRatio="xMinYMin slice"
      className="fill-jersey-deep block w-full"
      style={{ height: `${BAND_HEIGHT}mm` }}
    >
      {stripes.map((points) => (
        <polygon key={points} points={points} />
      ))}
    </svg>
  );
}

export function PrintHeader({ now }: { now: Date }) {
  return (
    <div className="hidden print:block">
      <PrintBand />
      <div className="mt-[4mm] flex items-start justify-between gap-[6mm]">
        <div className="min-w-0">
          <span className="bg-jersey-deep text-cream text-label inline-block -rotate-1 px-[3.2mm] py-[2mm] font-mono uppercase shadow-[1.1mm_1.1mm_0_0_var(--color-ink)]">
            Seizoen {deriveSeason(now).label}
          </span>
          <p className="font-display text-ink text-display-lg mt-[3mm] font-bold">
            Organigram
          </p>
          <p className="font-display text-jersey-deep text-display-sm italic">
            Wie doet wat bij KCVV Elewijt
          </p>
        </div>
        <Image
          src="/images/logos/kcvv-crest.svg"
          alt=""
          width={87}
          height={87}
          unoptimized
          loading="eager"
          className="shrink-0"
          style={{ width: "23mm", height: "23mm" }}
        />
      </div>
      <div className="bg-ink mt-[3mm] h-[1mm]" />
    </div>
  );
}

export function PrintFooter() {
  return (
    <div className="hidden print:block">
      <div className="border-paper-edge text-ink-muted text-label flex items-baseline justify-between border-t-[0.3mm] pt-[3.6mm] pb-[2.8mm] font-mono uppercase">
        <span>kcvvelewijt.be/hulp</span>
        <span>
          Stand van <PrintDate />
        </span>
      </div>
      <PrintBand />
    </div>
  );
}
