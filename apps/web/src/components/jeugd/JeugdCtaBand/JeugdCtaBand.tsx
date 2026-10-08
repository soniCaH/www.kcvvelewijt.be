import { CtaBand } from "@/components/design-system";
import { MOTTO } from "@/lib/constants";

export interface JeugdCtaBandProps {
  /**
   * Where "Schrijf je in +" links. Defaults to the membership intake form
   * `/club/word-lid` (#1473). A `mailto:` or external href renders a plain
   * styled `<a>`.
   */
  href?: string;
}

/**
 * <JeugdCtaBand> — the `/jeugd` closing CTA band (Phase 7 / Phase 4). The shared
 * `<CtaBand>` with youth copy: "Interesse in onze jeugd?" + a `warm` paper-stamp
 * "Schrijf je in +". Render full-bleed as the page's last element.
 *
 * Carries the club motto — `/jeugd`'s only place for it, here rather than in
 * the hero so the hero's line count at 320 px stays as it is. No trial-training invitation:
 * club feedback v2 asked for none for now (#3427).
 */
export function JeugdCtaBand({ href = "/club/word-lid" }: JeugdCtaBandProps) {
  return (
    <CtaBand
      ariaLabel="Schrijf je in"
      heading="Interesse in onze jeugd?"
      emphasis={{ text: "onze jeugd", tone: "warm" }}
      lead={`Nieuwe spelers zijn altijd welkom — van U6 tot U21. ${MOTTO}.`}
      buttonLabel={
        <>
          Schrijf je in <span aria-hidden="true">+</span>
        </>
      }
      href={href}
    />
  );
}
