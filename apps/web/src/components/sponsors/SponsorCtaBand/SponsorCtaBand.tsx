import {
  EditorialHeading,
  LinkButton,
  StripedSeam,
} from "@/components/design-system";

export interface SponsorCtaBandProps {
  /** Where "Word sponsor +" links. Defaults to the club contact page (which
   *  surfaces the sponsoring address). */
  href?: string;
}

/**
 * <SponsorCtaBand> — the `/sponsors` closing footer band (7.d4 · C1). After the
 * gratitude of the wall, the page turns the thanks into an invitation: a
 * full-width `bg-jersey-deep-dark` band (`border-y-2 border-ink`, with a leading
 * `<StripedSeam>`) carrying an italic question + sub-line + a `warm` paper-stamp
 * "Word sponsor +". Mirrors the homepage `<ClubshopBanner>` dark-band idiom.
 *
 * The button reuses `<LinkButton variant="inverted">` (the dark-surface
 * paper-stamp: soft offset shadow + canonical press-down) recoloured to
 * `bg-warm`; promote to a dedicated `warm` variant once a second CtaBand
 * (e.g. <JeugdCtaBand>, #2041) needs it.
 */
export function SponsorCtaBand({
  href = "/club/contact",
}: SponsorCtaBandProps) {
  return (
    <>
      <StripedSeam colorPair="ink-cream" height="md" />
      <section
        aria-label="Word sponsor"
        className="bg-jersey-deep-dark border-ink border-y-2"
      >
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:py-16">
          <EditorialHeading
            level={2}
            size="display-lg"
            tone="cream"
            emphasis={{ text: "langs de lijn", tone: "warm" }}
            className="mb-4"
          >
            Ook jouw zaak langs de lijn?
          </EditorialHeading>

          <p className="text-cream/90 mx-auto mb-7 max-w-xl text-base leading-relaxed">
            Word partner van de plezantste compagnie en steun mee de jeugd én de
            eerste ploeg.
          </p>

          <div className="flex justify-center">
            <LinkButton
              href={href}
              variant="inverted"
              className="bg-warm hover:bg-warm"
            >
              Word sponsor <span aria-hidden="true">+</span>
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
