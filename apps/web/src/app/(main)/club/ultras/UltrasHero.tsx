import Image from "next/image";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { PageContainer } from "@/components/design-system/PageContainer";
import { UpLink, type UpLinkProps } from "@/components/design-system/UpLink";
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
  /**
   * The up-link to `/club` (#2428/#2442). This hero is one of the site's
   * four dark, flush-against-the-header openings, so the chip renders
   * *inside* the band, tone-swapped to cream, rather than above it — a
   * cream strip here would turn the arrival into a section. Always the
   * container's left edge, even though this hero is otherwise centred.
   */
  upLink?: Pick<UpLinkProps, "href" | "label">;
}

// `linear-gradient(0deg, …)` jersey-deep duotone wash, per 7u2 hero spec.
const WASH =
  "linear-gradient(0deg, rgba(19, 61, 40, 0.82), rgba(19, 61, 40, 0.55))";

export function UltrasHero({ joinHref, upLink }: UltrasHeroProps) {
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

      <PageContainer className="relative z-10 flex flex-col items-center gap-6 py-24 text-center sm:py-32">
        {upLink ? (
          <UpLink
            href={upLink.href}
            label={upLink.label}
            tone="cream"
            className="self-start"
          />
        ) : null}

        <MonoLabel variant="plain" tone="cream">
          Supporters · KCVV Ultra&apos;s 55
        </MonoLabel>

        {/* `text-display-2xl` now carries its own -0.035em tracking (D14/Y8,
            #2617) — the hand-applied `tracking-tight` this replaced was a
            duplicate of the ramp's own step property. `leading-[0.95]` stays:
            it is this hero's own hand-tuned value, not the two-line-hero
            `leading-hero` step (0.85) — this headline isn't a fixed 2-line
            composition, it wraps by content length, so the tight-leading
            step (never the default) does not apply here. */}
        <h1 className="font-display-big text-cream text-display-2xl leading-[0.95] font-black hyphens-auto uppercase">
          De <span className="text-warm">luidste</span> hoek
        </h1>

        <p className="text-cream/85 text-body-lg max-w-xl">
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
          Word lid via Facebook
        </a>
      </PageContainer>
    </header>
  );
}
