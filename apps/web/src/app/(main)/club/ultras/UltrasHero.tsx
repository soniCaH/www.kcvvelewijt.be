import Image from "next/image";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { getButtonClasses } from "@/components/design-system/Button/button-styles";

/**
 * Terrace-poster hero for `/club/ultras` (design contract 7u2, panel V2).
 *
 * Full-bleed crowd photo under a jersey-deep duotone wash + diagonal stripe
 * texture (guarantees cream/white contrast on any photo), centred mono kicker,
 * a heavy poster headline, and a warm paper-stamp Facebook CTA.
 *
 * Headline type — the locked 7u1 "heavy-sans" exception is rendered with our
 * existing display font (Freight Big, `font-display-big` at `font-black`,
 * uppercase): in-system, no new font family, scoped to this hero.
 */
export interface UltrasHeroProps {
  /** Facebook page URL — also the join CTA target. */
  joinHref: string;
}

// `linear-gradient(0deg, …)` jersey-deep duotone wash, per 7u2 hero spec.
const WASH =
  "linear-gradient(0deg, rgba(19, 61, 40, 0.82), rgba(19, 61, 40, 0.55))";

export function UltrasHero({ joinHref }: UltrasHeroProps) {
  return (
    <header className="bg-jersey-deep-dark relative isolate overflow-hidden">
      <Image
        src="/images/ultras.jpg"
        alt="KCVV Ultras aan de omheining"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: "center 35%" }}
      />
      {/* Duotone wash + diagonal stripe texture — decorative, guarantees contrast. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: WASH }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-15"
        style={{ backgroundImage: "var(--pattern-jersey-stripes)" }}
      />

      <div className="relative z-10 mx-auto flex max-w-[var(--container-wide)] flex-col items-center gap-6 px-4 py-24 text-center sm:py-32 md:px-8">
        <MonoLabel variant="plain" tone="cream">
          Supporters · KCVV Ultra&apos;s 55
        </MonoLabel>

        <h1 className="font-display-big text-cream text-[length:var(--text-display-2xl)] leading-[0.95] font-black tracking-tight uppercase">
          De <span className="text-warm">luidste</span> hoek
        </h1>

        <p className="text-cream/85 max-w-xl text-[length:var(--text-body-lg)] leading-[var(--text-body-lg--lh)]">
          Positief aanmoedigen van onze ploeg — vocaal, met trommels, met
          sfeermateriaal.
        </p>

        <a
          href={joinHref}
          target="_blank"
          rel="noopener noreferrer"
          data-ultras-join
          className={getButtonClasses({
            variant: "inverted",
            size: "lg",
            className: "bg-warm hover:bg-warm",
          })}
        >
          Word lid via Facebook ↗
        </a>
      </div>
    </header>
  );
}
