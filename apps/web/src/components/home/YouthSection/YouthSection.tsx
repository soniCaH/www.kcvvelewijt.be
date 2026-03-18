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
        "relative overflow-hidden bg-kcvv-green-dark py-20 text-center",
        className,
      )}
    >
      {/* Section background — atmospheric photo, slightly blurred.
          Outer wrapper clips at section boundary; inner div extends beyond it
          so the blur has pixel data at all edges (prevents compositing seams). */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -inset-4">
          <Image
            src="/images/youth-trainers.jpg"
            alt=""
            fill
            className="object-cover object-top blur-sm"
            sizes="100vw"
          />
        </div>
        {/* Dark tint overlay — preserves green-dark mood while letting the photo breathe */}
        <div className="absolute inset-0 bg-kcvv-green-dark/55" />
      </div>

      {/* Content — floats above the blurred background */}
      <div className="relative z-10">
        {/* Section label */}
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
      </div>
    </section>
  );
};
