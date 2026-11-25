import { Fragment } from "react";
import { cn } from "@/lib/utils/cn";
import { ExternalMark } from "@/components/design-system/ExternalMark";
import type { TeamSponsorVM } from "@/lib/repositories/team.repository";
import { TeamSponsorLineTracker } from "./TeamSponsorLineTracker";

export interface TeamSponsorLineProps {
  /** Active Sponsors that name this Team, already ordered by name. */
  sponsors: TeamSponsorVM[];
  /** Sent with every name click, so a Sponsor learns how its Team line did. */
  teamSlug: string;
  className?: string;
}

/** ", " between names, " en " before the last: "A, B en C". */
const separator = (index: number, count: number) => {
  if (index === count - 1) return "";
  return index === count - 2 ? " en " : ", ";
};

/**
 * "Gesteund door A, B en C" — the quiet line on a team page (#3652, slice (b) of
 * #3618). A name with a url links out in a new tab and carries the sponsor
 * marker `<TeamSponsorLineTracker>` reads; a name without one is plain text. No
 * logos, and nothing at all for an empty list, so a team no Sponsor names looks
 * exactly as it did.
 *
 * The link's accessible name is its visible name plus `<ExternalMark>`'s
 * "(opent in een nieuw tabblad)", never a replacement label.
 */
export const TeamSponsorLine = ({
  sponsors,
  teamSlug,
  className,
}: TeamSponsorLineProps) => {
  if (sponsors.length === 0) return null;

  return (
    <TeamSponsorLineTracker teamSlug={teamSlug}>
      <p
        data-testid="team-sponsor-line"
        className={cn(
          "text-ink-muted font-body text-body-sm mx-auto w-full max-w-[var(--container-prose)]",
          className,
        )}
      >
        Gesteund door{" "}
        {sponsors.map((sponsor, i) => (
          <Fragment key={sponsor.id}>
            {sponsor.url ? (
              <a
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                data-sponsor-id={sponsor.id}
                className="prose-link"
              >
                {sponsor.name}
                <ExternalMark />
              </a>
            ) : (
              sponsor.name
            )}
            {separator(i, sponsors.length)}
          </Fragment>
        ))}
      </p>
    </TeamSponsorLineTracker>
  );
};
