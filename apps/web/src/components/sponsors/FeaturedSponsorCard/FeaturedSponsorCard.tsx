import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatSponsorAlt } from "../formatSponsorAlt";
import type { Sponsor } from "../Sponsors";

export interface FeaturedSponsorCardProps {
  sponsor: Sponsor;
}

/**
 * <FeaturedSponsorCard> — the single "In de kijker" marquee card in the
 * `/sponsors` hero (7.d5 F3: light cream-soft body + jersey-deep banner tab).
 *
 * - **Tab:** full-width `bg-jersey-deep` mono-caps "In de kijker" (`text-white`
 *   per the jersey-deep contrast rule), `border-b-2 border-ink`. Text only — no
 *   dingbat.
 * - **Body:** logo inset (cream box, `border-2 border-ink`) → italic-display
 *   name → optional `description` blurb (~3-line clamp, omitted when absent) →
 *   mono "Bezoek website ↗" when `url` is present.
 * - **Logo absent:** the italic-display name fills the inset.
 * - **Link:** when `url` is present the whole card is the link and presses down
 *   on hover (canonical paper-stamp); without a `url` it renders as a static
 *   card.
 */
export function FeaturedSponsorCard({ sponsor }: FeaturedSponsorCardProps) {
  const content = (
    <>
      <div className="bg-jersey-deep border-ink border-b-2 px-4 py-2">
        <span className="font-mono text-[12px] leading-none font-semibold tracking-[0.16em] text-white uppercase">
          In de kijker
        </span>
      </div>

      <div className="px-[22px] pt-[18px] pb-[22px]">
        <div className="bg-cream border-ink mt-1 mb-3 flex min-h-[56px] items-center justify-center border-2 p-[18px]">
          {sponsor.logo ? (
            <Image
              src={sponsor.logo}
              alt={formatSponsorAlt(sponsor.name)}
              width={240}
              height={96}
              className="h-auto max-h-[72px] w-auto max-w-full object-contain grayscale transition-all duration-300 ease-out group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none"
              sizes="(max-width: 1024px) 80vw, 320px"
            />
          ) : (
            <span className="font-display text-ink line-clamp-2 text-center text-xl italic">
              {sponsor.name}
            </span>
          )}
        </div>

        <p className="font-display text-ink text-[21px] leading-tight italic">
          {sponsor.name}
        </p>

        {sponsor.description && (
          <p className="text-ink-soft mt-1.5 line-clamp-3 text-[13px] leading-normal">
            {sponsor.description}
          </p>
        )}

        {sponsor.url && (
          // `jersey-deep-dark` (not the 7d5-spec `jersey-deep`): at 12px the
          // brighter jersey-deep only reaches 3.73:1 on cream-soft (sub-AA);
          // jersey-deep-dark clears 4.5:1 while keeping the green-link cue.
          <span className="text-jersey-deep-dark mt-3 inline-block font-mono text-[12px] font-semibold tracking-[0.08em] uppercase">
            Bezoek website ↗
          </span>
        )}
      </div>
    </>
  );

  const frameClass = "bg-cream-soft border-ink shadow-paper-sm block border-2";

  if (sponsor.url) {
    return (
      <Link
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Bezoek de website van ${sponsor.name}`}
        data-sponsor-id={sponsor.id}
        data-sponsor-tier={sponsor.tier}
        data-sponsor-featured="true"
        className={cn(
          frameClass,
          "group focus-visible:outline-jersey-deep transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2",
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={frameClass}>{content}</div>;
}
