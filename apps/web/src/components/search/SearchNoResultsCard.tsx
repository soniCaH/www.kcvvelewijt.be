/**
 * SearchNoResultsCard — the `/zoeken` no-results state (8s4 E2, copy 8s4.1).
 *
 * A thin call to the tier-"surface" `<EmptyState>` (#2427 / #2562) — this
 * register is what #2427 named the primitive's tier-1 reference. Shown for a
 * valid query that returned zero (filtered) hits: the football-pun heading
 * "Geen treffers." (treffer = both a search hit and a goal) and a body line
 * that names the missing query and offers inline way-forward links. The
 * links are plain navigations to the section index routes — escape hatches
 * out of the dead end (the "spelers" link resolves to /ploegen, since
 * players live on the team pages; confirmed at build #2106).
 */

import Link from "next/link";
import { EmptyState } from "@/components/design-system";

export interface SearchNoResultsCardProps {
  /** The query that returned no results — named in the body line. */
  query: string;
}

// The three links sit inside a running sentence, so they are body copy and
// join `.prose-link` (#2474 rule 2) rather than the affordance-chip styling
// (`underline-offset-2 hover:underline`) they carried before. `.prose-link`
// is deliberately unlayered (globals.css) so it beats the typography plugin
// — which also means it beats any `@layer utilities` class on the same
// property. A `font-bold`/`font-semibold` here would never apply: accept
// `.prose-link`'s own `font-weight: 500` as the link weight, don't add a
// dead one.
const WAY_FORWARD_LINK_CLASS = "prose-link";

/**
 * No-results paper card with taped jersey artefact + way-forward links.
 */
export function SearchNoResultsCard({ query }: SearchNoResultsCardProps) {
  return (
    <EmptyState tier="surface" heading="Geen treffers">
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
    </EmptyState>
  );
}
