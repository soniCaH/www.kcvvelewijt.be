/**
 * Team listing — loading skeleton.
 *
 * A skeleton draws only what it can know before the fetch (#2642). The
 * opening's kicker/headline/lead are fixed copy, not data, so per #2432 §2
 * this reuses the real `<PageHero>` unshimmered — this route's only
 * invariant.
 *
 * Everything below it is read from the same Sanity fetch. The two flagship
 * blocks this file used to draw unconditionally are not structural (#2607
 * correction): `page.tsx` gates each one independently (`{aTeam ? … :
 * null}`, `{bTeam ? … : null}`), so 0, 1 or 2 can render. The youth
 * directory's division and team counts (1/4/4/7 in production) are data
 * too. Neither is drawn; a run of neutral `paper-edge` bars of varying
 * width stands in for both, the same vocabulary the hero's own bars use.
 */

import {
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { PLOEGEN_KICKER, PLOEGEN_TITLE, PLOEGEN_LEAD } from "./page";

export default function TeamsLoading() {
  return (
    <PageContainer width="index" className="py-12 sm:py-16">
      <LoadingAnnouncement label="Ploegen laden…" />

      <PageHero
        register="minimal"
        kicker={PLOEGEN_KICKER}
        headline={PLOEGEN_TITLE}
        lead={PLOEGEN_LEAD}
      />

      {/* The flagship pair (0, 1 or 2 — #2607 correction) and the youth
          directory's division/team counts are both read from the same
          Sanity fetch this fallback covers. Neutral bars only. */}
      <div className="mt-16 flex flex-col gap-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </PageContainer>
  );
}
