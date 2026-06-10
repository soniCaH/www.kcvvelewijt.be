import { CtaBand } from "@/components/design-system";

export interface SponsorCtaBandProps {
  /** Where "Word sponsor +" links. Defaults to the club contact page (which
   *  surfaces the sponsoring address). Internal routes use `<LinkButton>`;
   *  `mailto:` / `tel:` / external `http(s):` hrefs render a plain styled `<a>`. */
  href?: string;
}

/**
 * <SponsorCtaBand> — the `/sponsors` closing footer band (7.d4 · C1). After the
 * gratitude of the wall, the page turns the thanks into an invitation: the
 * shared `<CtaBand>` with sponsor copy and a `warm` paper-stamp
 * "Word sponsor +".
 */
export function SponsorCtaBand({
  href = "/club/contact",
}: SponsorCtaBandProps) {
  return (
    <CtaBand
      ariaLabel="Word sponsor"
      heading="Jouw zaak ook langs de zijlijn?"
      emphasis={{ text: "langs de zijlijn", tone: "warm" }}
      lead="Word partner van de plezantste compagnie en steun onze jeugd en eerste ploegen!"
      buttonLabel={
        <>
          Word sponsor <span aria-hidden="true">+</span>
        </>
      }
      href={href}
      buttonData={{ "data-sponsor-cta": "true" }}
    />
  );
}
