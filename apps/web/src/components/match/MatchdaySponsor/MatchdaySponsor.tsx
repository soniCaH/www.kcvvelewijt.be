import { SanityImage } from "@/lib/image/sanity-image";
import { SponsorWallTracker } from "@/components/sponsors/SponsorWallTracker";
import { formatSponsorAlt } from "@/components/sponsors/formatSponsorAlt";
import type { MatchbalSponsorVM } from "@/lib/repositories/sponsor.repository";

export interface MatchdaySponsorProps {
  sponsor: MatchbalSponsorVM;
  className?: string;
}

/**
 * The matchday sponsor (Matchbal) of a Match page (#3917, design look D of
 * #3913): a framed card with the label, then the Sponsor's name and logo on
 * one row, centred on each other. The card links to the Sponsor's site when it
 * has one. `<SponsorWallTracker>` reads the markers on the card root and sends
 * `sponsor_impression` / `sponsor_click` with `source: "match"`.
 */
export const MatchdaySponsor = ({
  sponsor,
  className,
}: MatchdaySponsorProps) => {
  const body = (
    <>
      <span className="text-ink-muted text-label block font-mono font-semibold uppercase">
        Matchbal aangeboden door
      </span>
      <span className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <span className="font-display text-ink text-xl italic">
          {sponsor.name}
        </span>
        {sponsor.logoUrl && (
          <SanityImage
            src={sponsor.logoUrl}
            alt={formatSponsorAlt(sponsor.name)}
            width={200}
            height={100}
            className="h-auto max-h-20 w-auto max-w-[240px] object-contain"
            sizes="240px"
          />
        )}
      </span>
    </>
  );
  const frame = "border-ink bg-cream-soft block border-2 px-5 py-4";

  return (
    <div className={className} data-testid="matchday-sponsor">
      <SponsorWallTracker source="match">
        {sponsor.url ? (
          <a
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            data-sponsor-id={sponsor.id}
            className={frame}
          >
            {body}
          </a>
        ) : (
          <div data-sponsor-id={sponsor.id} className={frame}>
            {body}
          </div>
        )}
      </SponsorWallTracker>
    </div>
  );
};
