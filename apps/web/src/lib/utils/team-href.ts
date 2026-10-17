/**
 * The three board teams (bestuur, jeugdbestuur, angels) live at `/club/<slug>`
 * only; `/ploegen/<slug>` for them is a 308 (#3483). One list feeds the
 * `next.config.ts` redirect rules, the sitemap and every team-URL builder, so
 * they cannot drift. Keep in step with the `club/*` folders that call
 * `createBoardPage`.
 *
 * Plain module on purpose (no `@/` imports): `next.config.ts` loads it.
 */
export const BOARD_TEAM_SLUGS = ["bestuur", "jeugdbestuur", "angels"] as const;

export function isBoardTeamSlug(slug: string): boolean {
  return (BOARD_TEAM_SLUGS as readonly string[]).includes(slug);
}

/** The public URL of a `team` document: `/club/<slug>` for a board, else `/ploegen/<slug>`. */
export function teamHref(slug: string): string {
  return isBoardTeamSlug(slug) ? `/club/${slug}` : `/ploegen/${slug}`;
}
