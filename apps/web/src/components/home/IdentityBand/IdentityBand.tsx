import { useId } from "react";
import Image from "next/image";
import {
  LinkButton,
  PageContainer,
  SectionHeader,
} from "@/components/design-system";
import { MOTTO } from "@/lib/constants";

/**
 * Homepage identity band (#3417) — says who the club is, once, between
 * "Eerste ploegen." and "Uitgelicht.". Own club photo (the youth huddle),
 * decorative: the heading names the band.
 *
 * Phone: 4:3 photo on top, words below it on the dark field. Desktop: the
 * photo fills a 21:9 box (`md:min-h-[26rem]` as its floor) and the words sit in
 * normal flow at its bottom, over a transparent → jersey-deep-dark gradient —
 * in flow so a taller heading (three lines, a bigger user font) grows the box
 * instead of escaping upward over the seam above.
 *
 * No seam of its own: `<FirstTeamsBlock>` already closes with a flipped
 * `cream-jersey-deep` StripedSeam, and the colour change into `Uitgelicht.`
 * is the lower edge (dark-band family — no border). When Uitgelicht is
 * absent the page adds a closing seam itself.
 *
 * The buttons carry `data-identity-cta`, read by `<HomepageAnalytics>`.
 */
export const IdentityBand = () => {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      data-testid="identity-band"
      className="bg-jersey-deep-dark text-cream"
    >
      <div className="relative md:flex md:aspect-[21/9] md:min-h-[26rem] md:flex-col md:justify-end">
        <div className="relative aspect-[4/3] md:absolute md:inset-0 md:aspect-auto">
          <Image
            src="/images/identity-huddle.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[50%_30%] md:object-[50%_12%]"
          />
        </div>

        <div className="md:from-jersey-deep-dark md:via-jersey-deep-dark/75 relative py-8 md:bg-linear-to-t md:from-30% md:via-60% md:to-transparent md:pt-40 md:pb-12">
          <PageContainer width="index">
            <SectionHeader
              id={headingId}
              kicker={[{ label: "KCVV Elewijt · Stamnummer 55", size: "md" }]}
              title={`${MOTTO}.`}
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
          </PageContainer>
        </div>
      </div>
    </section>
  );
};
