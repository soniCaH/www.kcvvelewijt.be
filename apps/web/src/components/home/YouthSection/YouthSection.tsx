import { cn } from "@/lib/utils/cn";
import {
  EditorialHeading,
  LinkButton,
  MonoLabel,
  StripedSeam,
} from "@/components/design-system";

/** The jeugd-band stat line's two CMS-owned numbers (#2401 item 4). */
export interface YouthSectionStats {
  playerCount: string;
  teamCount: string;
}

export interface YouthSectionProps {
  className?: string;
  /**
   * The stat line's two numbers, sourced from the `homePage` singleton
   * (`youthPlayerCount`/`youthTeamCount`) so an editor can keep them true
   * season to season — a hardcoded literal here used to be an unsourced
   * club fact with no writer (#2401 item 4, Writer Rule). `null`/absent
   * omits the whole line rather than rendering an empty label or a stray
   * "·" — the section never shows half a claim.
   */
  stats?: YouthSectionStats | null;
}

export const YouthSection = ({ className, stats }: YouthSectionProps) => (
  <section className={cn("text-cream text-left", className)}>
    {/* R5.B top stripe band — full-bleed cream + jersey-deep stripes
        (paper-tape on green field), 28px tall. Sits inside the section
        so it inherits the SectionStack's jersey-deep paint without a
        separate transition shim — see `youth-revisit-locked.md`
        "path 1". The cream-on-deep pair was picked over jersey-tonal
        greens at PR review to keep the band quieter on the
        photographic backdrop. No ink hairlines around the seam — the
        cream stops carry the band's edge against the photo on their
        own, and the bare seam matches the Clubshop section's
        treatment for cross-page consistency. */}
    <div className="mb-6">
      <StripedSeam height="xl" colorPair="cream-jersey-deep" />
    </div>

    <div className="mx-auto max-w-[var(--container-index)] px-4 md:px-8">
      <div className="mb-4">
        <MonoLabel size="md" tone="cream">
          Word jeugdspeler
        </MonoLabel>
      </div>

      <EditorialHeading
        level={2}
        size="display-lg"
        tone="cream"
        // Emphasis shifts from "De toekomst" to "Elewijt" per brief §8
        // (R5.B). The accent lands on the club name, not the abstract
        // concept of the future.
        emphasis={{ text: "Elewijt", tone: "warm" }}
        className="mb-6 max-w-3xl"
      >
        De toekomst van Elewijt.
      </EditorialHeading>

      {/* Full cream — DESIGN.md "The Whole-Cream Rule". */}
      <p className="text-cream mb-6 max-w-xl text-base leading-relaxed">
        Onze jeugdwerking groeit elk jaar. Bovenbouw, Middenbouw en Onderbouw
        delen één doel: voetbal als zelfontplooiing — nooit als prestatie
        alleen.
      </p>

      {stats ? (
        <div className="mb-8">
          <MonoLabel size="md" tone="cream">
            {stats.playerCount} spelers · {stats.teamCount} ploegen
          </MonoLabel>
        </div>
      ) : null}

      {/* Dual-CTA row — primary "Ontdek onze jeugd" → /jeugd, secondary
          "Schrijf je in" → the existing /club/word-lid route
          (mirrors the SiteHeader "Word lid" link target). Wraps to a
          vertical stack on narrow viewports via `flex-wrap`. */}
      <div className="flex flex-wrap items-center gap-3.5">
        <LinkButton href="/jeugd" variant="primary" withArrow>
          Ontdek onze jeugd
        </LinkButton>
        <LinkButton href="/club/word-lid" variant="inverted" withArrow>
          Schrijf je in
        </LinkButton>
      </div>
    </div>
  </section>
);
