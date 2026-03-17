import Image from "next/image";
import Link from "next/link";
import { SectionDivider } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";

export interface YouthSectionProps {
  className?: string;
}

export const YouthSection = ({ className }: YouthSectionProps) => {
  return (
    <section
      className={cn(
        "relative bg-kcvv-green-dark overflow-hidden py-20 text-center -mt-0.5",
        className,
      )}
    >
      {/* Diagonal top cut: kcvv-black → kcvv-green-dark */}
      <SectionDivider color="kcvv-black" position="top" />
      {/* Diagonal bottom cut: kcvv-green-dark → gray-100 */}
      <SectionDivider color="gray-100" position="bottom" flip />

      {/* Section label — aligned to the full-width 1280px grid */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-8 mb-6">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
          <span aria-hidden="true" className="block w-5 h-0.5 bg-white/30" />
          Jeugdwerking
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 md:px-8">
        {/* Stat row */}
        <div className="flex items-center justify-center gap-8 md:gap-16 mb-10">
          <div>
            <div
              className="font-title font-black text-kcvv-green leading-none"
              style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
            >
              220+
            </div>
            <div className="text-xs tracking-widest uppercase text-white/50 mt-1">
              Spelers
            </div>
          </div>
          <div className="w-px h-16 bg-white/15" aria-hidden="true" />
          <div>
            <div
              className="font-title font-black text-kcvv-green leading-none"
              style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
            >
              16
            </div>
            <div className="text-xs tracking-widest uppercase text-white/50 mt-1">
              Ploegen
            </div>
          </div>
        </div>

        {/* Jersey photo — TODO: add youth-jerseys.png to public/images/ */}
        <div className="relative inline-block mb-10">
          <Image
            src="/images/youth-jerseys.png"
            alt="KCVV jeugd tenues"
            width={480}
            height={360}
            className="max-w-sm w-full mx-auto object-contain drop-shadow-xl"
            style={{ rotate: "1deg" }}
          />
        </div>

        {/* CTA */}
        <div>
          <Link
            href="/jeugd"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-kcvv-black font-bold text-sm uppercase tracking-wider rounded-sm hover:bg-kcvv-green transition-colors"
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
      </div>
    </section>
  );
};
