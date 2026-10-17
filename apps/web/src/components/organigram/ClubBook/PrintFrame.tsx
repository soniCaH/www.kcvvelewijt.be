import Image from "next/image";
import { PrintDate } from "@/components/scheurkalender/PrintDate";
import { deriveSeason } from "@/lib/utils/season";

/**
 * The clubboek PDF's house style (KCVV huisstijl, translated to the site's
 * print CSS): a full-bleed diagonal green/white band at the top and the bottom edge of every
 * sheet, the crest top right, "Organigram" in display roman over an italic green
 * subtitle on a black bar, a green mono chip, and a footer with the address and
 * the print date. All of it is `hidden` on screen and only exists on paper.
 *
 * Sheet geometry (the house page): `@page` margin 0, bands full-bleed at the
 * sheet's top and bottom edge (`position: fixed`, repeated per page), content in
 * padding 19 / 17 / 25 mm (top / sides / bottom) that repeats per page too.
 *
 * Measures are the house ones in millimetres: band 10 mm high, stripes 4.4 mm
 * on an 8.8 mm period, the top edge 0.47 x the height further right than the
 * bottom edge. The band is drawn as explicit polygons, never as a CSS or SVG
 * gradient or `<pattern>`: Chromium exports those as PDF tiling patterns, which
 * macOS Preview renders pink (`<StripedSeam>` is a `<pattern>`, so it cannot be
 * reused here).
 */

const BAND_HEIGHT = 10;
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
      <div className="flex items-start justify-between gap-[6mm]">
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
        {/* The house crest with its lettering already converted to paths: no
            `<text>`, so it adds no font to the PDF. */}
        <Image
          src="/images/logos/kcvv-crest-print.svg"
          alt=""
          width={50}
          height={61}
          unoptimized
          loading="eager"
          className="shrink-0"
          style={{ width: "23mm", height: "auto" }}
        />
      </div>
      <div className="bg-ink mt-[3mm] h-[1mm]" />
    </div>
  );
}

/**
 * The bands and the footer, repeated on every sheet. The sheet has `@page`
 * margin 0, so `position: fixed` (which Chromium repeats per printed page)
 * reaches the sheet's very edges: the bands are full-bleed at the top and bottom
 * edge, and the footer sits just above the lower band. The content keeps clear
 * of all three through the print root's padding (see `print-style.ts`).
 */
export function PrintSheetFrame() {
  return (
    <div className="hidden print:block">
      <div className="fixed inset-x-0 top-0">
        <PrintBand />
      </div>
      <div className="fixed inset-x-0 bottom-0">
        <PrintBand />
      </div>
      <div
        className="border-paper-edge text-ink-muted text-label fixed flex items-baseline justify-between border-t-[0.3mm] pt-[2.4mm] font-mono uppercase"
        style={{ bottom: "12mm", left: "17mm", right: "17mm" }}
      >
        <span>kcvvelewijt.be/hulp</span>
        <span>
          Stand van <PrintDate />
        </span>
      </div>
    </div>
  );
}
