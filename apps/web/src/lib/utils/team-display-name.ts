/**
 * One team, one name — everywhere a human reads it (#2630, decided in #2539).
 *
 * Three of the eighteen team pages used to head a different team than the one
 * clicked: `/ploegen/reserven` read `A-ploeg.`, `kcvve-u16` read `U17.`,
 * `kcvve-u10p` read `U10.` All three were the same bug. `age` is a *competition
 * band*, and bands are legitimately shared — four teams carry `A`, two carry
 * `U17`, two carry `U10` (`docs/ubiquitous-language.md` has said so since it was
 * written) — but `<TeamHero>` used it as the page's identity anyway. The data
 * was never wrong; the rendering was.
 *
 * So identity comes from the slug, which is unique by construction (it is the
 * route key), with an editorial override on top for the cases a slug cannot
 * express. `name` stays what it is: the federation-registered name, PSD-synced
 * and re-patched on every sync, so it is not editable and cannot be the answer.
 * It survives as the last-resort fallback and as JSON-LD `SportsTeam.name`.
 */

/**
 * The fields a display name is resolved from. Structural rather than tied to
 * one view-model, so `TeamNavVM` / `TeamDetailVM` / `TeamLandingItem` all fit
 * without adapters.
 */
interface TeamNameSource {
  /** Editorial override (Sanity `displayName`). Empty on all 18 teams today. */
  displayName?: string | null;
  /** Route key, e.g. `eerste-elftallen-a`, `kcvve-u10p`. */
  slug: string;
  /** Federation-registered name, PSD-synced, e.g. `KCVVE  U15`. */
  name: string;
}

/** Title-case one lowercase slug segment (`wit` → `Wit`, `groen` → `Groen`). */
function capitalizeSegment(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

/**
 * Label derived from the slug — which is also what drops the `kcvve-`
 * prefix, so no separate strip is needed:
 *
 * - an age token anywhere in the slug → that token uppercased, plus every
 *   segment after it title-cased (`kcvve-u16` → `U16`, `kcvve-u10p` →
 *   `U10P`, `kcvve-u8-wit` → `U8 Wit`)
 * - a lone letter (no age token) → `X-ploeg` (`eerste-elftallen-a` →
 *   `A-ploeg`)
 * - anything else → the federation `name` (`reserven` → `Reserven`)
 *
 * This is `firstTeamLabel` (#2211) *extended*: it only ever recognised the lone
 * letter, so every youth slug fell straight through to the raw name — which is
 * where the five double-space names (`KCVVE  U15`) came from. A slug cannot
 * contain a double space, so recognising the age token retires them.
 *
 * **The age token used to have to be the slug's last segment** (#2599 review):
 * that missed a colour-distinguished duplicate — `kcvve-u8-wit` /
 * `kcvve-u8-groen`, both live in production — whose age token sits mid-slug
 * with a colour segment after it, so it fell through to the raw federation
 * `name` (`KCVVE U8 Wit`) exactly like the lone-letter guard's comment below
 * already warned `kcvve-u7-wit`/`kcvve-u9-groen` would. Those two were marked
 * "archived" when this comment was written; `kcvve-u8-wit`/`kcvve-u8-groen`
 * are not, so the fall-through was live on both `/kalender` and `/ploegen` —
 * matching this helper everywhere it's read fixes both call sites in one
 * source rather than stripping the prefix again in a consuming row.
 *
 * The lone-letter branch is gated on the slug naming no age band, and that
 * guard is load-bearing rather than defensive: PSD slugifies the team name, and
 * the club has already fielded variant youth sides this way (`kcvve-u7-wit`,
 * `kcvve-u9-groen`, both archived). The day PSD syncs a `KCVVE U9 A`, an
 * ungated branch would head `/ploegen/kcvve-u9-a` with `A-ploeg.` — the exact
 * collision this helper exists to close, reintroduced with nobody editing
 * anything. Such a side falls through to its name until an editor writes a
 * `displayName`, which is what the field is for.
 */
function slugLabel(slug: string, name: string): string {
  const segments = slug.split("-");
  const tail = segments.at(-1) ?? "";
  const ageIndex = segments.findIndex((s) => /^u\d{1,2}[a-z]?$/i.test(s));
  if (ageIndex !== -1) {
    return segments
      .slice(ageIndex)
      .map((segment) =>
        /^u\d{1,2}[a-z]?$/i.test(segment)
          ? segment.toUpperCase()
          : capitalizeSegment(segment),
      )
      .join(" ");
  }
  if (/^[a-z]$/i.test(tail) && !segments.some((s) => /^u\d{1,2}$/i.test(s)))
    return `${tail.toUpperCase()}-ploeg`;
  return name;
}

/**
 * What this team is called, on every surface a human reads it from: the `<h1>`,
 * the `<title>`, the OG card, the homepage first-team row, the youth directory
 * caption. One helper so those cannot drift into three names for one team.
 *
 * `displayName` is an escape hatch for what a slug cannot express — separating
 * two U10 sides by colour, say — not a data-entry task: it is empty on all
 * eighteen teams and every heading comes from the fallback.
 */
export function teamDisplayName(team: TeamNameSource): string {
  const editorial = team.displayName?.trim() ?? "";
  return editorial === "" ? slugLabel(team.slug, team.name) : editorial;
}
