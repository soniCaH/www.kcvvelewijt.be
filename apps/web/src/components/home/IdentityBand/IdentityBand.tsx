import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { LinkButton, SectionHeader } from "@/components/design-system";

export interface IdentityBandProps {
  className?: string;
}

/**
 * Homepage identity band (#3417) — says who the club is, once, between
 * "Eerste ploegen." and "Uitgelicht.". Own club photo (the youth huddle),
 * decorative: the heading names the band.
 *
 * Phone: 4:3 photo on top, words below it on the dark field. Desktop: the
 * photo goes 21:9 full-bleed with the words overlaid bottom-left on a
 * transparent → jersey-deep-dark gradient. `md:min-h-[26rem]` keeps the
 * overlay clear of the huddle between 768px and ~1100px, where a pure 21:9
 * box would be shorter than the words.
 *
 * No seam of its own: `<FirstTeamsBlock>` already closes with a flipped
 * `cream-jersey-deep` StripedSeam, and the colour change into `Uitgelicht.`
 * is the lower edge (dark-band family — no border).
 *
 * The buttons carry `data-identity-cta`, read by `<HomepageAnalytics>`.
 */
export const IdentityBand = ({ className }: IdentityBandProps) => (
  <section
    data-testid="identity-band"
    className={cn("bg-jersey-deep-dark text-cream text-left", className)}
  >
    <div className="md:relative md:aspect-[21/9] md:min-h-[26rem]">
      <div className="relative aspect-[4/3] md:absolute md:inset-0 md:aspect-auto">
        <Image
          src="/images/identity-huddle.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[50%_30%] md:object-[50%_12%]"
        />
      </div>

      <div className="md:from-jersey-deep-dark relative py-8 md:absolute md:inset-x-0 md:bottom-0 md:bg-linear-to-t md:to-transparent md:pt-32 md:pb-12">
        <div className="mx-auto max-w-[var(--container-index)] px-4 md:px-8">
          <SectionHeader
            kicker={[{ label: "KCVV Elewijt · Stamnummer 55", size: "md" }]}
            title="Er is maar één plezante compagnie."
            size="display-lg"
            variant="dark"
            emphasis={{ text: "plezante", tone: "warm" }}
            className="max-w-3xl"
          />
          <div className="flex flex-wrap items-center gap-3.5">
            <LinkButton
              href="/club/word-lid"
              variant="primary"
              withArrow
              data-identity-cta="word_lid"
            >
              Word lid
            </LinkButton>
            <LinkButton
              href="/club/geschiedenis"
              variant="inverted"
              withArrow
              data-identity-cta="onze_club"
            >
              Onze club
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  </section>
);
