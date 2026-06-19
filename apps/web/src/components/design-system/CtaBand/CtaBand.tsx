import type { ReactNode } from "react";
import {
  EditorialHeading,
  type EditorialHeadingEmphasis,
} from "../EditorialHeading";
import { LinkButton } from "../LinkButton";
import { StripedSeam } from "../StripedSeam";
import { PageContainer } from "../PageContainer";
import { getButtonClasses } from "../Button/button-styles";

const EXTERNAL_HREF = /^(https?:|mailto:|tel:)/i;

export interface CtaBandProps {
  /** Accessible name for the band's `<section>` landmark. */
  ariaLabel: string;
  /** The italic-display question (cream), with an optional warm emphasis. */
  heading: string;
  emphasis?: EditorialHeadingEmphasis;
  /** Sub-line under the heading. */
  lead: string;
  /** Paper-stamp button label (e.g. `Word sponsor +`). */
  buttonLabel: ReactNode;
  /**
   * Button target. Internal routes use `<LinkButton>`; `mailto:` / `tel:` /
   * external `http(s):` hrefs render a plain styled `<a>` (next/link is for
   * client-side route navigation only).
   */
  href: string;
  /** Optional `data-*` attributes forwarded onto the button (analytics markers). */
  buttonData?: Record<`data-${string}`, string>;
}

/**
 * <CtaBand> — the redesign's closing CTA band: a leading `<StripedSeam>` + a
 * full-width `bg-jersey-deep-dark` section (`border-y-2 border-ink`) carrying an
 * italic-display question + sub-line + a `warm` paper-stamp button (the
 * dark-surface `inverted` variant recoloured to `bg-warm`, canonical
 * press-down). Shared by `<SponsorCtaBand>` and `<JeugdCtaBand>`.
 *
 * Render this full-bleed — as the last element of a page, outside its centered
 * content container — so the band and its seam span the viewport.
 */
export function CtaBand({
  ariaLabel,
  heading,
  emphasis,
  lead,
  buttonLabel,
  href,
  buttonData,
}: CtaBandProps) {
  const isExternal = EXTERNAL_HREF.test(href);
  const isHttp = /^https?:/i.test(href);
  const buttonClassName = "bg-warm hover:bg-warm";

  return (
    <>
      <StripedSeam colorPair="ink-cream" height="md" />
      <section
        aria-label={ariaLabel}
        className="bg-jersey-deep-dark border-ink border-y-2"
      >
        <PageContainer className="py-12 text-center sm:py-16">
          <EditorialHeading
            level={2}
            size="display-lg"
            tone="cream"
            emphasis={emphasis}
            className="mb-4"
          >
            {heading}
          </EditorialHeading>

          <p className="text-cream/90 mx-auto mb-7 max-w-xl text-base leading-relaxed">
            {lead}
          </p>

          <div className="flex justify-center">
            {isExternal ? (
              <a
                href={href}
                className={getButtonClasses({
                  variant: "inverted",
                  className: buttonClassName,
                })}
                {...buttonData}
                {...(isHttp
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {buttonLabel}
              </a>
            ) : (
              <LinkButton
                href={href}
                variant="inverted"
                className={buttonClassName}
                {...buttonData}
              >
                {buttonLabel}
              </LinkButton>
            )}
          </div>
        </PageContainer>
      </section>
    </>
  );
}
