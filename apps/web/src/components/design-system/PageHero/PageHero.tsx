import type { ReactNode } from "react";
import Image from "next/image";
import { LinkButton } from "../LinkButton";

export type HeroGradient = "dark" | "green" | "neutral";

const GRADIENTS: Record<HeroGradient, string> = {
  dark: "linear-gradient(135deg, #1E2024 0%, #1E2024 30%, #008755 70%, #1E2024 100%)",
  green: "linear-gradient(135deg, #008755 0%, #4acf52 50%, #008755 100%)",
  neutral: "linear-gradient(135deg, #1E2024 0%, #31404b 50%, #1E2024 100%)",
};

export interface PageHeroProps {
  image?: string;
  imageAlt?: string;
  label: string;
  headline: ReactNode;
  body: string;
  cta?: { label: string; href: string };
  size?: "default" | "compact";
  gradient?: HeroGradient;
}

export function PageHero({
  image,
  imageAlt = "",
  label,
  headline,
  body,
  cta,
  size = "default",
  gradient = "dark",
}: PageHeroProps) {
  return (
    <div className="relative">
      {/* Background layers */}
      <div className="absolute inset-0">
        {image ? (
          <>
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
          </>
        ) : (
          <div
            className="absolute inset-0"
            data-testid="hero-gradient"
            style={{ background: GRADIENTS[gradient] }}
          />
        )}
      </div>

      {/* Content */}
      <div
        className={`relative z-10 flex items-end ${size === "compact" ? "min-h-[35vh]" : "min-h-[60vh]"}`}
      >
        <div className="max-w-inner-lg mx-auto w-full px-4 pt-10 pb-16 md:px-10 md:pt-16 md:pb-24">
          <div className="tracking-label mb-6 flex items-center gap-2 text-xs font-extrabold text-white/50 uppercase">
            <span className="bg-kcvv-green block h-0.5 w-5" />
            {label}
          </div>
          <h1 className="font-title leading-hero text-hero mb-6 font-black text-white uppercase">
            {headline}
          </h1>
          <p className="max-w-lg text-lg leading-loose text-white/60">{body}</p>
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
