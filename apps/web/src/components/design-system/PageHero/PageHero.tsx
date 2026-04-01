import type { ReactNode } from "react";
import Image from "next/image";
import { LinkButton } from "../LinkButton";

export interface PageHeroProps {
  image: string;
  imageAlt?: string;
  label: string;
  headline: ReactNode;
  body: string;
  cta?: { label: string; href: string };
  size?: "default" | "compact";
}

export function PageHero({
  image,
  imageAlt = "",
  label,
  headline,
  body,
  cta,
  size = "default",
}: PageHeroProps) {
  return (
    <div className="relative">
      {/* Background layers */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover object-[center_30%]"
          style={{ filter: "brightness(0.25) saturate(0.7)" }}
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(30, 32, 36, 0.2) 0%, rgba(30, 32, 36, 0.4) 40%, rgba(0, 135, 85, 0.25) 70%, rgba(30, 32, 36, 0.85) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 flex items-end ${size === "compact" ? "min-h-[35vh]" : "min-h-[60vh]"}`}
      >
        <div className="max-w-inner-lg mx-auto px-4 md:px-10 pt-10 pb-16 md:pt-16 md:pb-24 w-full">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-label text-white/50 mb-6">
            <span className="block w-5 h-0.5 bg-kcvv-green" />
            {label}
          </div>
          <h1 className="font-title font-black text-white uppercase leading-hero mb-6 text-hero">
            {headline}
          </h1>
          <p className="text-lg text-white/60 leading-loose max-w-lg">{body}</p>
          {cta && (
            <div className="mt-8">
              <LinkButton href={cta.href} variant="primary" withArrow>
                {cta.label}
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
