/**
 * SearchNoResultsCard — the `/zoeken` no-results state (8s4 E2, copy 8s4.1).
 *
 * Shown for a valid query that returned zero (filtered) hits. A cream paper
 * card pairing a small taped `<JerseyShirt>` artefact with the football-pun
 * headline "Geen treffers." (treffer = both a search hit and a goal) and a body
 * line that names the missing query and offers inline way-forward links. The
 * links are plain navigations to the section index routes — escape hatches out
 * of the dead end (the "spelers" link resolves to /ploegen, since players live
 * on the team pages; confirmed at build #2106).
 */

import Link from "next/link";
import {
  EditorialHeading,
  JerseyShirt,
  TapeStrip,
} from "@/components/design-system";

export interface SearchNoResultsCardProps {
  /** The query that returned no results — named in the body line. */
  query: string;
}

const WAY_FORWARD_LINK_CLASS =
  "text-jersey-deep font-bold underline-offset-2 hover:underline";

/**
 * No-results paper card with taped jersey artefact + way-forward links.
 */
export function SearchNoResultsCard({ query }: SearchNoResultsCardProps) {
  return (
    <section className="border-ink bg-cream-soft shadow-paper-sm border-2 p-7 sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-7">
        {/* Taped jersey artefact — modest, not dominant (8s4). */}
        <div className="relative inline-block flex-shrink-0">
          <TapeStrip color="warm" length="md" />
          <JerseyShirt className="h-28 w-28 -rotate-3" />
        </div>

        <div className="text-center sm:text-left">
          <EditorialHeading
            level={2}
            size="display-md"
            emphasis={{ text: "." }}
          >
            Geen treffers
          </EditorialHeading>

          <p className="text-ink-soft mt-3 max-w-[52ch] text-[14.5px] leading-relaxed">
            Niets gevonden voor &ldquo;
            <strong className="text-ink font-semibold">{query}</strong>&rdquo;.
            Probeer een andere term — of spring meteen naar{" "}
            <Link href="/nieuws" className={WAY_FORWARD_LINK_CLASS}>
              nieuws
            </Link>
            ,{" "}
            <Link href="/ploegen" className={WAY_FORWARD_LINK_CLASS}>
              ploegen
            </Link>{" "}
            of{" "}
            <Link href="/ploegen" className={WAY_FORWARD_LINK_CLASS}>
              spelers
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
