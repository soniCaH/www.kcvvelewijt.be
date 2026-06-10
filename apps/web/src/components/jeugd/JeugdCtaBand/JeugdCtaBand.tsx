import { CtaBand } from "@/components/design-system";

export interface JeugdCtaBandProps {
  /**
   * Where "Schrijf je in +" links. Defaults to `/hulp` until the membership
   * intake form (#1473) ships (PRD redesign-phase-7-jeugd §7). A `mailto:` or
   * external href renders a plain styled `<a>`.
   */
  href?: string;
}

/**
 * <JeugdCtaBand> — the `/jeugd` closing CTA band (Phase 7 / Phase 4). The shared
 * `<CtaBand>` with youth copy: "Interesse in onze jeugd?" + a `warm` paper-stamp
 * "Schrijf je in +". Render full-bleed as the page's last element.
 */
export function JeugdCtaBand({ href = "/hulp" }: JeugdCtaBandProps) {
  return (
    <CtaBand
      ariaLabel="Schrijf je in"
      heading="Interesse in onze jeugd?"
      emphasis={{ text: "onze jeugd", tone: "warm" }}
      lead="Nieuwe spelers zijn altijd welkom — van U6 tot U21. Kom gerust eens langs op training."
      buttonLabel={
        <>
          Schrijf je in <span aria-hidden="true">+</span>
        </>
      }
      href={href}
    />
  );
}
